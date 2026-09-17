import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/dto/paginated-result.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto, createdById?: string) {
    const existing = await this.prisma.client.findUnique({ where: { documentId: dto.documentId } });
    if (existing) {
      throw new ConflictException('A client with this document ID already exists');
    }

    return this.prisma.client.create({
      data: { ...dto, createdById },
    });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = query.search
      ? {
          OR: [
            { firstName: { contains: query.search, mode: 'insensitive' as const } },
            { lastName: { contains: query.search, mode: 'insensitive' as const } },
            { documentId: { contains: query.search, mode: 'insensitive' as const } },
            { phone: { contains: query.search, mode: 'insensitive' as const } },
            { email: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { loans: true } },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return new PaginatedResult(data, total, page, limit);
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        loans: {
          orderBy: { createdAt: 'desc' },
          include: { installments: { orderBy: { number: 'asc' } } },
        },
      },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.ensureExists(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.client.update({ where: { id }, data: { status: 'INACTIVE' } });
    return { message: 'Client marked as inactive' };
  }

  /**
   * Returns a consolidated view of a client's pending and overdue installments,
   * used by the client detail screen in the frontend.
   */
  async getSummary(id: string) {
    await this.ensureExists(id);

    const installments = await this.prisma.installment.findMany({
      where: {
        loan: { clientId: id },
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      },
      include: { loan: true },
      orderBy: { dueDate: 'asc' },
    });

    const today = new Date();
    const pending = installments.filter((i) => i.status !== 'OVERDUE' && i.dueDate >= today);
    const overdue = installments.filter((i) => i.status === 'OVERDUE' || i.dueDate < today);

    const totalPending = pending.reduce(
      (sum, i) => sum + Number(i.amountDue) - Number(i.amountPaid),
      0,
    );
    const totalOverdue = overdue.reduce(
      (sum, i) => sum + Number(i.amountDue) - Number(i.amountPaid),
      0,
    );

    const activeLoans = await this.prisma.loan.count({
      where: { clientId: id, status: { in: ['ACTIVE', 'OVERDUE'] } },
    });

    return {
      activeLoans,
      totalPending,
      totalOverdue,
      pendingInstallments: pending,
      overdueInstallments: overdue,
    };
  }

  private async ensureExists(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }
}
