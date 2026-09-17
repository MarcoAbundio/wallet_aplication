import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Landmark, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { clientsApi, type CreateClientPayload } from '@/api/clients';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Panel } from '@/components/common/Panel';
import { StatusChip } from '@/components/common/StatusChip';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import { useToast, getErrorMessage } from '@/components/common/Toast';
import { formatCurrency, formatDate, getLoanRemainingBalance, initials } from '@/utils/format';
import { loanStatusLabels, loanStatusTone } from '@/utils/status';

export default function ClientDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.get(id),
    enabled: !!id,
  });

  const { data: summary } = useQuery({
    queryKey: ['client-summary', id],
    queryFn: () => clientsApi.summary(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateClientPayload) => clientsApi.update(id, payload),
    onSuccess: () => {
      showSuccess('Cliente actualizado correctamente.');
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  if (isLoading || !client) {
    return <div className="py-14 text-center text-sm text-slate">Cargando cliente…</div>;
  }

  return (
    <div>
      <button
        onClick={() => navigate('/clientes')}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </button>

      <PageHeader
        title={`${client.firstName} ${client.lastName}`}
        description={`Cliente desde ${formatDate(client.createdAt)}`}
        action={
          <>
            <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <Button onClick={() => navigate(`/prestamos/nuevo?clientId=${client.id}`)}>
              <Landmark className="h-4 w-4" />
              Nuevo préstamo
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Panel className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-50 font-display text-xl text-ink-500">
              {initials(client.firstName, client.lastName)}
            </span>
            <p className="mt-3 font-display text-lg font-medium text-ink">
              {client.firstName} {client.lastName}
            </p>
            <StatusChip
              label={client.status === 'ACTIVE' ? 'Cliente activo' : 'Cliente inactivo'}
              tone={client.status === 'ACTIVE' ? 'positive' : 'neutral'}
            />
          </div>

          <div className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
            <div className="flex items-center gap-2 text-slate">
              <Phone className="h-4 w-4 shrink-0" />
              {client.phone}
            </div>
            {client.email && (
              <div className="flex items-center gap-2 text-slate">
                <Mail className="h-4 w-4 shrink-0" />
                {client.email}
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 text-slate">
                <MapPin className="h-4 w-4 shrink-0" />
                {client.address}
              </div>
            )}
            {client.occupation && (
              <div className="flex items-center gap-2 text-slate">
                <Briefcase className="h-4 w-4 shrink-0" />
                {client.occupation}
              </div>
            )}
            <div className="pt-1 text-xs text-slate-400">Cédula: {client.documentId}</div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-3">
          <StatCard
            label="Préstamos activos"
            value={String(summary?.activeLoans ?? 0)}
            tone="ink"
            icon={Landmark}
          />
          <StatCard
            label="Pendiente por cobrar"
            value={formatCurrency(summary?.totalPending ?? 0)}
            tone="amber"
          />
          <StatCard
            label="Atrasado"
            value={formatCurrency(summary?.totalOverdue ?? 0)}
            tone="rust"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Cuotas atrasadas" noPadding>
          {!summary || summary.overdueInstallments.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate">Sin cuotas atrasadas.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {summary.overdueInstallments.map((installment) => (
                  <tr key={installment.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3">
                      <Link
                        to={`/prestamos/${installment.loanId}`}
                        className="font-medium text-ink hover:text-accent"
                      >
                        {installment.loan.code}
                      </Link>
                      <p className="text-xs text-slate-400">Cuota #{installment.number}</p>
                    </td>
                    <td className="px-5 py-3 text-slate">{formatDate(installment.dueDate)}</td>
                    <td className="px-5 py-3 text-right font-medium tabular text-rust-600">
                      {formatCurrency(Number(installment.amountDue) - Number(installment.amountPaid))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Próximas cuotas" noPadding>
          {!summary || summary.pendingInstallments.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate">Sin cuotas pendientes.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {summary.pendingInstallments.slice(0, 6).map((installment) => (
                  <tr key={installment.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3">
                      <Link
                        to={`/prestamos/${installment.loanId}`}
                        className="font-medium text-ink hover:text-accent"
                      >
                        {installment.loan.code}
                      </Link>
                      <p className="text-xs text-slate-400">Cuota #{installment.number}</p>
                    </td>
                    <td className="px-5 py-3 text-slate">{formatDate(installment.dueDate)}</td>
                    <td className="px-5 py-3 text-right font-medium tabular text-ink">
                      {formatCurrency(Number(installment.amountDue) - Number(installment.amountPaid))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Préstamos del cliente" noPadding>
          {!client.loans || client.loans.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title="Sin préstamos"
              description="Este cliente aún no tiene préstamos registrados."
              action={
                <Button onClick={() => navigate(`/prestamos/nuevo?clientId=${client.id}`)}>
                  Registrar préstamo
                </Button>
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Código</th>
                  <th className="px-5 py-3 font-medium">Monto</th>
                  <th className="px-5 py-3 font-medium">Restante por pagar</th>
                  <th className="px-5 py-3 font-medium">Cuotas</th>
                  <th className="px-5 py-3 font-medium">Inicio</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {client.loans.map((loan) => (
                  <tr key={loan.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-5 py-3">
                      <Link to={`/prestamos/${loan.id}`} className="font-medium text-ink hover:text-accent">
                        {loan.code}
                      </Link>
                    </td>
                    <td className="px-5 py-3 tabular text-slate">{formatCurrency(loan.principal)}</td>
                    <td className="px-5 py-3 tabular font-medium text-ink">
                      {formatCurrency(getLoanRemainingBalance(loan))}
                      <span className="block text-xs font-normal text-slate-400">
                        de {formatCurrency(loan.totalToPay)}
                      </span>
                    </td>
                    <td className="px-5 py-3 tabular text-slate">{loan.termInstallments}</td>
                    <td className="px-5 py-3 text-slate">{formatDate(loan.startDate)}</td>
                    <td className="px-5 py-3">
                      <StatusChip label={loanStatusLabels[loan.status]} tone={loanStatusTone[loan.status]} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/prestamos/${loan.id}`)}
                        >
                          Ver
                        </Button>
                        {(loan.status === 'ACTIVE' || loan.status === 'OVERDUE') && (
                          <Button size="sm" onClick={() => navigate(`/prestamos/${loan.id}`)}>
                            Depósito
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <ClientFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={(payload) => updateMutation.mutateAsync(payload).then(() => undefined)}
        isSubmitting={updateMutation.isPending}
        client={client}
      />
    </div>
  );
}
