import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoansService } from '../loans/loans.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loansService: LoansService,
  ) {}

  /** High level KPIs shown as stat tiles at the top of the dashboard. */
  async getSummary() {
    await this.loansService.syncOverdueLoans();

    const [
      totalClients,
      activeClients,
      totalLoans,
      activeLoansAggregate,
      overdueLoansCount,
      disbursedAggregate,
      collectedAggregate,
      pendingAggregate,
      overdueAggregate,
    ] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.client.count({ where: { status: 'ACTIVE' } }),
      this.prisma.loan.count(),
      this.prisma.loan.count({ where: { status: { in: ['ACTIVE', 'OVERDUE'] } } }),
      this.prisma.loan.count({ where: { status: 'OVERDUE' } }),
      this.prisma.loan.aggregate({ _sum: { principal: true } }),
      this.prisma.payment.aggregate({ _sum: { amount: true } }),
      this.prisma.installment.aggregate({
        _sum: { amountDue: true, amountPaid: true },
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
      }),
      this.prisma.installment.aggregate({
        _sum: { amountDue: true, amountPaid: true },
        where: { status: 'OVERDUE' },
      }),
    ]);

    const pendingTotal =
      Number(pendingAggregate._sum.amountDue ?? 0) - Number(pendingAggregate._sum.amountPaid ?? 0);
    const overdueTotal =
      Number(overdueAggregate._sum.amountDue ?? 0) - Number(overdueAggregate._sum.amountPaid ?? 0);

    return {
      totalClients,
      activeClients,
      totalLoans,
      activeLoans: activeLoansAggregate,
      overdueLoans: overdueLoansCount,
      totalDisbursed: Number(disbursedAggregate._sum.principal ?? 0),
      totalCollected: Number(collectedAggregate._sum.amount ?? 0),
      totalPending: Math.max(0, pendingTotal),
      totalOverdue: Math.max(0, overdueTotal),
    };
  }

  /** Amount collected per month for the last N months, for a line/bar chart. */
  async getCollectionsByMonth(months = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const payments = await this.prisma.payment.findMany({
      where: { paidAt: { gte: since } },
      select: { amount: true, paidAt: true },
    });

    return this.groupByMonth(payments, months, since);
  }

  /** Principal disbursed per month for the last N months, for a comparison chart. */
  async getDisbursementsByMonth(months = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const loans = await this.prisma.loan.findMany({
      where: { createdAt: { gte: since } },
      select: { principal: true, createdAt: true },
    });

    return this.groupByMonth(
      loans.map((l) => ({ amount: l.principal, paidAt: l.createdAt })),
      months,
      since,
    );
  }

  /** Loan portfolio distribution by status, for a donut chart. */
  async getLoansByStatus() {
    const grouped = await this.prisma.loan.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { principal: true },
    });

    return grouped.map((g) => ({
      status: g.status,
      count: g._count._all,
      amount: Number(g._sum.principal ?? 0),
    }));
  }

  /** Clients ranked by outstanding overdue balance, for a "clients at risk" table/chart. */
  async getTopOverdueClients(limit = 5) {
    const overdueInstallments = await this.prisma.installment.findMany({
      where: { status: 'OVERDUE' },
      include: { loan: { include: { client: true } } },
    });

    const byClient = new Map<
      string,
      { clientId: string; name: string; overdueAmount: number; overdueInstallments: number }
    >();

    for (const installment of overdueInstallments) {
      const client = installment.loan.client;
      const outstanding = Number(installment.amountDue) - Number(installment.amountPaid);
      const existing = byClient.get(client.id);
      if (existing) {
        existing.overdueAmount += outstanding;
        existing.overdueInstallments += 1;
      } else {
        byClient.set(client.id, {
          clientId: client.id,
          name: `${client.firstName} ${client.lastName}`,
          overdueAmount: outstanding,
          overdueInstallments: 1,
        });
      }
    }

    return Array.from(byClient.values())
      .sort((a, b) => b.overdueAmount - a.overdueAmount)
      .slice(0, limit);
  }

  private groupByMonth(
    items: Array<{ amount: unknown; paidAt: Date }>,
    months: number,
    since: Date,
  ) {
    const buckets: { key: string; label: string; total: number }[] = [];
    const cursor = new Date(since);
    for (let i = 0; i < months; i++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({ key, label: this.monthLabel(cursor), total: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const bucketByKey = new Map(buckets.map((b) => [b.key, b]));
    for (const item of items) {
      const date = new Date(item.paidAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = bucketByKey.get(key);
      if (bucket) {
        bucket.total += Number(item.amount);
      }
    }

    return buckets.map((b) => ({ month: b.label, total: Math.round(b.total * 100) / 100 }));
  }

  private monthLabel(date: Date): string {
    const labels = [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ];
    return `${labels[date.getMonth()]} ${date.getFullYear()}`;
  }
}
