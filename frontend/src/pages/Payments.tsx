import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowDownToLine } from 'lucide-react';
import { paymentsApi, type CreatePaymentPayload } from '@/api/payments';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/common/Button';
import { Panel } from '@/components/common/Panel';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { PaymentFormModal } from '@/components/payments/PaymentFormModal';
import { useToast, getErrorMessage } from '@/components/common/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, formatDate } from '@/utils/format';
import { paymentMethodLabels } from '@/utils/status';

export default function Payments() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payments', debouncedSearch, page],
    queryFn: () => paymentsApi.list({ search: debouncedSearch || undefined, page, limit: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentsApi.create(payload),
    onSuccess: (result) => {
      showSuccess(result.message);
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  const payments = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Depósitos"
        description="Historial de pagos y depósitos registrados sobre los préstamos."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Registrar depósito
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Buscar por código de préstamo o referencia…"
          className="max-w-md"
        />
      </div>

      <Panel noPadding>
        {isLoading ? (
          <div className="px-6 py-14 text-center text-sm text-slate">Cargando depósitos…</div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={ArrowDownToLine}
            title="Sin depósitos registrados"
            description="Registra el primer depósito de un cliente sobre un préstamo activo."
            action={<Button onClick={() => setIsModalOpen(true)}>Registrar depósito</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Préstamo</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Método</th>
                  <th className="px-5 py-3 font-medium">Referencia</th>
                  <th className="px-5 py-3 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-5 py-3 text-slate">{formatDate(payment.paidAt)}</td>
                    <td className="px-5 py-3">
                      <Link to={`/prestamos/${payment.loanId}`} className="font-medium text-ink hover:text-accent">
                        {payment.loan?.code}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to={`/clientes/${payment.loan?.clientId}`}
                        className="text-slate hover:text-ink"
                      >
                        {payment.loan?.client?.firstName} {payment.loan?.client?.lastName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate">{paymentMethodLabels[payment.method]}</td>
                    <td className="px-5 py-3 text-slate">{payment.reference ?? '—'}</td>
                    <td className="px-5 py-3 text-right font-medium tabular text-accent-700">
                      {formatCurrency(payment.amount)}
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

      <PaymentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(payload) => createMutation.mutateAsync(payload).then(() => undefined)}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
