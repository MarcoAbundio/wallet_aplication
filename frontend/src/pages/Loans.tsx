import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Landmark, Eye, ArrowDownToLine } from 'lucide-react';
import { loansApi } from '@/api/loans';
import { paymentsApi, type CreatePaymentPayload } from '@/api/payments';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/common/Button';
import { Panel } from '@/components/common/Panel';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusChip } from '@/components/common/StatusChip';
import { PaymentFormModal } from '@/components/payments/PaymentFormModal';
import { useToast, getErrorMessage } from '@/components/common/Toast';
import { selectClass } from '@/components/common/Field';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, formatDate, getLoanRemainingBalance } from '@/utils/format';
import { frequencyLabels, loanStatusLabels, loanStatusTone } from '@/utils/status';
import type { LoanStatus } from '@/types';

const statusFilters: { value: LoanStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'OVERDUE', label: 'Atrasados' },
  { value: 'PAID', label: 'Pagados' },
  { value: 'CANCELLED', label: 'Cancelados' },
];

export default function Loans() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LoanStatus | ''>('');
  const [page, setPage] = useState(1);
  const [payLoanId, setPayLoanId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['loans', debouncedSearch, status, page],
    queryFn: () =>
      loansApi.list({
        search: debouncedSearch || undefined,
        status: status || undefined,
        page,
        limit: 10,
      }),
  });

  const { data: payLoan } = useQuery({
    queryKey: ['loan', payLoanId],
    queryFn: () => loansApi.get(payLoanId!),
    enabled: !!payLoanId,
  });

  const paymentMutation = useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentsApi.create(payload),
    onSuccess: (result) => {
      showSuccess(result.message);
      setPayLoanId(null);
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  const loans = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Préstamos"
        description="Administra los préstamos activos, atrasados y liquidados."
        action={
          <Button onClick={() => navigate('/prestamos/nuevo')}>
            <Plus className="h-4 w-4" />
            Nuevo préstamo
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Buscar por código, cliente o cédula…"
          className="max-w-md flex-1"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as LoanStatus | '');
            setPage(1);
          }}
          className={`${selectClass} sm:w-56`}
        >
          {statusFilters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      <Panel noPadding>
        {isLoading ? (
          <div className="px-6 py-14 text-center text-sm text-slate">Cargando préstamos…</div>
        ) : loans.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="No hay préstamos que coincidan"
            description="Ajusta los filtros o registra un nuevo préstamo."
            action={<Button onClick={() => navigate('/prestamos/nuevo')}>Nuevo préstamo</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Código</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Monto</th>
                  <th className="px-5 py-3 font-medium">Restante por pagar</th>
                  <th className="px-5 py-3 font-medium">Frecuencia</th>
                  <th className="px-5 py-3 font-medium">Inicio</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-5 py-3">
                      <Link to={`/prestamos/${loan.id}`} className="font-medium text-ink hover:text-accent">
                        {loan.code}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to={`/clientes/${loan.clientId}`}
                        className="text-slate hover:text-ink"
                      >
                        {loan.client?.firstName} {loan.client?.lastName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 tabular text-slate">{formatCurrency(loan.principal)}</td>
                    <td className="px-5 py-3 tabular font-medium text-ink">
                      {formatCurrency(getLoanRemainingBalance(loan))}
                      <span className="block text-xs font-normal text-slate-400">
                        de {formatCurrency(loan.totalToPay)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate">{frequencyLabels[loan.frequency]}</td>
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
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                        {(loan.status === 'ACTIVE' || loan.status === 'OVERDUE') && (
                          <Button size="sm" onClick={() => setPayLoanId(loan.id)}>
                            <ArrowDownToLine className="h-4 w-4" />
                            Depósito
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.meta.total > 0 && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={data.meta.limit}
            onPageChange={setPage}
          />
        )}
      </Panel>

      {payLoan && (
        <PaymentFormModal
          isOpen={!!payLoanId}
          onClose={() => {
            setPayLoanId(null);
            paymentMutation.reset();
          }}
          onSubmit={(payload) => paymentMutation.mutateAsync(payload).then(() => undefined)}
          isSubmitting={paymentMutation.isPending}
          fixedLoan={payLoan}
        />
      )}
    </div>
  );
}
