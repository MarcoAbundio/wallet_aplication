import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { PaginatedResult } from '../common/dto/paginated-result.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a deposit against a loan. The amount is allocated to pending
   * installments in chronological order (a "cascading" payment), so a single
   * deposit can catch up several overdue installments at once. Any amount left
   * over after every installment is paid is recorded as an advance credit.
   */
  async create(dto: CreatePaymentDto, registeredById?: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: dto.loanId },
      include: { installments: { orderBy: { number: 'asc' } } },
    });
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }
    if (loan.status === 'PAID' || loan.status === 'CANCELLED') {
      throw new BadRequestException(`This loan is already ${loan.status.toLowerCase()}`);
    }

    let pendingInstallments = loan.installments.filter((i) => i.status !== 'PAID');
    if (dto.installmentId) {
      const startIndex = pendingInstallments.findIndex((i) => i.id === dto.installmentId);
      if (startIndex === -1) {
        throw new BadRequestException('Installment not found or already paid');
      }
      pendingInstallments = pendingInstallments.slice(startIndex);
    }
    if (pendingInstallments.length === 0) {
      throw new BadRequestException('This loan has no pending installments');
    }

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    let remaining = dto.amount;
    const createdPayments: Array<Record<string, unknown>> = [];

    await this.prisma.$transaction(async (tx) => {
      for (const installment of pendingInstallments) {
        if (remaining <= 0) break;

        const due = Number(installment.amountDue) - Number(installment.amountPaid);
        if (due <= 0) continue;

        const allocation = Math.min(remaining, due);
        const newAmountPaid = Number(installment.amountPaid) + allocation;
        const isFullyPaid = newAmountPaid >= Number(installment.amountDue) - 0.005;

        await tx.installment.update({
          where: { id: installment.id },
          data: {
            amountPaid: newAmountPaid,
            status: isFullyPaid ? 'PAID' : 'PARTIAL',
            paidAt: isFullyPaid ? paidAt : installment.paidAt,
          },
        });

        const payment = await tx.payment.create({
          data: {
            loanId: loan.id,
            installmentId: installment.id,
            amount: allocation,
            method: dto.method,
            paidAt,
            reference: dto.reference,
            notes: dto.notes,
            registeredById,
          },
        });
        createdPayments.push(payment);

        remaining = Math.round((remaining - allocation) * 100) / 100;
      }

      // Any leftover amount is recorded as an advance credit not tied to an installment.
      if (remaining > 0) {
        const advance = await tx.payment.create({
          data: {
            loanId: loan.id,
            installmentId: null,
            amount: remaining,
            method: dto.method,
            paidAt,
            reference: dto.reference,
            notes: `${dto.notes ? dto.notes + ' - ' : ''}Pago anticipado / excedente`,
            registeredById,
          },
        });
        createdPayments.push(advance);
      }

      const remainingInstallments = await tx.installment.count({
        where: { loanId: loan.id, status: { not: 'PAID' } },
      });
      if (remainingInstallments === 0) {
        await tx.loan.update({ where: { id: loan.id }, data: { status: 'PAID' } });
      }
    });

    return {
      payments: createdPayments,
      message: `Payment of ${dto.amount} applied to loan ${loan.code}`,
    };
  }

  async findAll(query: PaymentQueryDto): Promise<PaginatedResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Record<string, unknown> = {};
    if (query.loanId) where.loanId = query.loanId;
    if (query.clientId) where.loan = { clientId: query.clientId };
    if (query.search) {
      where.OR = [
        { reference: { contains: query.search, mode: 'insensitive' as const } },
        { loan: { code: { contains: query.search, mode: 'insensitive' as const } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          loan: { include: { client: true } },
          installment: true,
        },
        orderBy: { paidAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return new PaginatedResult(data, total, page, limit);
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { loan: { include: { client: true } }, installment: true },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }
}
