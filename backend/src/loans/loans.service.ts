import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoanQueryDto } from './dto/loan-query.dto';
import { PaginatedResult } from '../common/dto/paginated-result.dto';
import { buildAmortizationSchedule } from './utils/amortization.util';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class LoansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLoanDto, createdById?: string) {
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client) {
      throw new BadRequestException('Client does not exist');
    }

    const { schedule, totalToPay } = buildAmortizationSchedule({
      principal: dto.principal,
      annualInterestRate: dto.interestRate,
      termInstallments: dto.termInstallments,
      frequency: dto.frequency,
      startDate: new Date(dto.startDate),
    });

    const code = await this.generateLoanCode();

    return this.prisma.loan.create({
      data: {
        code,
        clientId: dto.clientId,
        principal: dto.principal,
        interestRate: dto.interestRate,
        termInstallments: dto.termInstallments,
        frequency: dto.frequency,
        startDate: new Date(dto.startDate),
        totalToPay,
        purpose: dto.purpose,
        notes: dto.notes,
        createdById,
        status: LoanStatus.ACTIVE,
        installments: {
          create: schedule.map((installment) => ({
            number: installment.number,
            dueDate: installment.dueDate,
            amountDue: installment.amountDue,
            principalPart: installment.principalPart,
            interestPart: installment.interestPart,
          })),
        },
      },
      include: { installments: { orderBy: { number: 'asc' } }, client: true },
    });
  }

  async findAll(query: LoanQueryDto): Promise<PaginatedResult<any>> {
    await this.syncOverdueLoans();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.clientId) where.clientId = query.clientId;
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' as const } },
        { client: { firstName: { contains: query.search, mode: 'insensitive' as const } } },
        { client: { lastName: { contains: query.search, mode: 'insensitive' as const } } },
        { client: { documentId: { contains: query.search, mode: 'insensitive' as const } } },
      ];
    }

    const [rawData, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        include: {
          client: { select: { id: true, firstName: true, lastName: true, documentId: true } },
          _count: { select: { payments: true } },
          installments: { select: { amountDue: true, amountPaid: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.loan.count({ where }),
    ]);

    const data = rawData.map((loan) => {
      const remainingBalance = (loan.installments ?? []).reduce(
        (sum, i) => sum + Number(i.amountDue) - Number(i.amountPaid),
        0,
      );
      return { ...loan, remainingBalance };
    });

    return new PaginatedResult(data, total, page, limit);
  }

  async findOne(id: string) {
    await this.syncOverdueLoans();
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        client: true,
        installments: { orderBy: { number: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }
    return loan;
  }

  async updateStatus(id: string, status: LoanStatus) {
    const loan = await this.prisma.loan.findUnique({ where: { id } });
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }
    return this.prisma.loan.update({ where: { id }, data: { status } });
  }

  /**
   * Marks installments whose due date has passed as OVERDUE, and propagates
   * that status to the parent loan. Safe to call frequently - it only
   * touches records that need a status change.
   */
  async syncOverdueLoans(): Promise<void> {
    const now = new Date();

    await this.prisma.installment.updateMany({
      where: {
        dueDate: { lt: now },
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      data: { status: 'OVERDUE' },
    });

    const loansWithOverdue = await this.prisma.installment.findMany({
      where: { status: 'OVERDUE' },
      select: { loanId: true },
      distinct: ['loanId'],
    });
    const overdueLoanIds = loansWithOverdue.map((l) => l.loanId);

    if (overdueLoanIds.length > 0) {
      await this.prisma.loan.updateMany({
        where: { id: { in: overdueLoanIds }, status: { in: ['ACTIVE'] } },
        data: { status: 'OVERDUE' },
      });
    }

    // A loan that was OVERDUE but no longer has overdue installments goes back to ACTIVE.
    await this.prisma.loan.updateMany({
      where: {
        status: 'OVERDUE',
        id: { notIn: overdueLoanIds.length > 0 ? overdueLoanIds : ['__none__'] },
      },
      data: { status: 'ACTIVE' },
    });
  }

  private async generateLoanCode(): Promise<string> {
    const count = await this.prisma.loan.count();
    const nextNumber = count + 1;
    return `PR-${nextNumber.toString().padStart(6, '0')}`;
  }
}
