import { useQuery } from '@tanstack/react-query';
import { Wallet, HandCoins, Clock, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Panel } from '@/components/common/Panel';
import { CollectionsChart } from '@/components/dashboard/CollectionsChart';
import { LoansStatusDonut } from '@/components/dashboard/LoansStatusDonut';
import { DisbursementsVsCollectionsChart } from '@/components/dashboard/DisbursementsVsCollectionsChart';
import { TopOverdueClientsTable } from '@/components/dashboard/TopOverdueClientsTable';
import { formatCurrency, formatNumber } from '@/utils/format';

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['collections-by-month'],
    queryFn: () => dashboardApi.collectionsByMonth(6),
  });

  const { data: disbursements = [] } = useQuery({
    queryKey: ['disbursements-by-month'],
    queryFn: () => dashboardApi.disbursementsByMonth(6),
  });

  const { data: byStatus = [] } = useQuery({
    queryKey: ['loans-by-status'],
    queryFn: dashboardApi.loansByStatus,
  });

  const { data: topOverdue = [] } = useQuery({
    queryKey: ['top-overdue-clients'],
    queryFn: () => dashboardApi.topOverdueClients(5),
  });

  return (
    <div>
      <PageHeader
        title="Panel general"
        description="Resumen de la cartera de préstamos, cobros y clientes atrasados."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total desembolsado"
          value={loadingSummary ? '—' : formatCurrency(summary?.totalDisbursed ?? 0)}
          helper={`${formatNumber(summary?.activeLoans ?? 0)} préstamos activos`}
          icon={Wallet}
          tone="ink"
        />
        <StatCard
          label="Total cobrado"
          value={loadingSummary ? '—' : formatCurrency(summary?.totalCollected ?? 0)}
          helper={`${formatNumber(summary?.totalClients ?? 0)} clientes registrados`}
          icon={HandCoins}
          tone="accent"
        />
        <StatCard
          label="Pendiente por cobrar"
          value={loadingSummary ? '—' : formatCurrency(summary?.totalPending ?? 0)}
          helper="Cuotas al día, aún no vencidas"
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Atrasado"
          value={loadingSummary ? '—' : formatCurrency(summary?.totalOverdue ?? 0)}
          helper={`${formatNumber(summary?.overdueLoans ?? 0)} préstamos atrasados`}
          icon={AlertTriangle}
          tone="rust"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Cobros por mes" className="lg:col-span-2">
          <CollectionsChart data={collections} />
        </Panel>
        <Panel title="Cartera por estado">
          <LoansStatusDonut data={byStatus} />
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Desembolsos vs. cobros" className="lg:col-span-2">
          <DisbursementsVsCollectionsChart disbursements={disbursements} collections={collections} />
        </Panel>
        <Panel title="Clientes con mayor atraso">
          <TopOverdueClientsTable data={topOverdue} />
        </Panel>
      </div>
    </div>
  );
}
