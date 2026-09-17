import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowDownToLine, Ban } from 'lucide-react';
import { loansApi } from '@/api/loans';
import { paymentsApi, type CreatePaymentPayload } from '@/api/payments';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { StatusChip } from '@/components/common/StatusChip';
import { Button } from '@/components/common/Button';
import { PaymentFormModal } from '@/components/payments/PaymentFormModal';
import { useToast, getErrorMessage } from '@/components/common/Toast';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  frequencyLabels,
  installmentStatusLabels,
  installmentStatusTone,
  loanStatusLabels,
  loanStatusTone,
  paymentMethodLabels,
} from '@/utils/status';

export default function LoanDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { data: loan, isLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => loansApi.get(id),
    enabled: !!id,
  });

  const paymentMutation = useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentsApi.create(payload),
    onSuccess: (result) => {
      showSuccess(result.message);
      setIsPaymentOpen(false);
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => loansApi.updateStatus(id, 'CANCELLED'),
    onSuccess: () => {
      showSuccess('Préstamo cancelado.');
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  if (isLoading || !loan) {
    return <div className="py-14 text-center text-sm text-slate">Cargando préstamo…</div>;
  }

  const canRegisterPayment = loan.status === 'ACTIVE' || loan.status === 'OVERDUE';
  const canCancel = loan.status === 'ACTIVE' && (loan.payments?.length ?? 0) === 0;

  return (
    <div>
      <button
        onClick={() => navigate('/prestamos')}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a préstamos
      </button>

      <PageHeader
        title={loan.code}
        description={`Cliente: ${loan.client?.firstName} ${loan.client?.lastName}`}
        action={
          <>
            {canCancel && (
              <Button variant="danger" onClick={() => cancelMutation.mutate()} isLoading={cancelMutation.isPending}>
                <Ban className="h-4 w-4" />
                Cancelar préstamo
              </Button>
            )}
            {canRegisterPayment && (
              <Button onClick={() => setIsPaymentOpen(true)}>
                <ArrowDownToLine className="h-4 w-4" />
                Registrar depósito
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Panel className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate">Estado</dt>
              <dd>
                <StatusChip label={loanStatusLabels[loan.status]} tone={loanStatusTone[loan.status]} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate">Monto</dt>
              <dd className="font-medium tabular text-ink">{formatCurrency(loan.principal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate">Tasa anual</dt>
              <dd className="font-medium tabular text-ink">{Number(loan.interestRate)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate">Cuotas</dt>
              <dd className="font-medium tabular text-ink">{loan.termInstallments}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate">Frecuencia</dt>
              <dd className="font-medium text-ink">{frequencyLabels[loan.frequency]}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate">Inicio</dt>
              <dd className="font-medium text-ink">{formatDate(loan.startDate)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3">
              <dt className="text-slate">Total a pagar</dt>
              <dd className="font-display font-medium tabular text-ink">{formatCurrency(loan.totalToPay)}</dd>
            </div>
          </dl>
          {loan.purpose && (
            <p className="mt-4 border-t border-line pt-3 text-xs text-slate-400">
              <span className="font-medium text-slate">Propósito: </span>
              {loan.purpose}
            </p>
          )}
        </Panel>

        <Panel title="Tabla de amortización" className="lg:col-span-3" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Vencimiento</th>
                  <th className="px-4 py-2.5 text-right font-medium">Monto</th>
                  <th className="px-4 py-2.5 text-right font-medium">Pagado</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {loan.installments?.map((installment) => (
                  <tr key={installment.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 tabular text-slate">{installment.number}</td>
                    <td className="px-4 py-2.5 text-slate">{formatDate(installment.dueDate)}</td>
                    <td className="px-4 py-2.5 text-right tabular text-ink">
                      {formatCurrency(installment.amountDue)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular text-slate">
                      {formatCurrency(installment.amountPaid)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusChip
                        label={installmentStatusLabels[installment.status]}
                        tone={installmentStatusTone[installment.status]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Historial de pagos" noPadding>
          {!loan.payments || loan.payments.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate">
              Aún no se han registrado depósitos para este préstamo.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Fecha</th>
                  <th className="px-5 py-2.5 font-medium">Método</th>
                  <th className="px-5 py-2.5 font-medium">Referencia</th>
                  <th className="px-5 py-2.5 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {loan.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-2.5 text-slate">{formatDate(payment.paidAt)}</td>
                    <td className="px-5 py-2.5 text-slate">{paymentMethodLabels[payment.method]}</td>
                    <td className="px-5 py-2.5 text-slate">{payment.reference ?? '—'}</td>
                    <td className="px-5 py-2.5 text-right font-medium tabular text-accent-700">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <PaymentFormModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSubmit={(payload) => paymentMutation.mutateAsync(payload).then(() => undefined)}
        isSubmitting={paymentMutation.isPending}
        fixedLoan={loan}
      />
    </div>
  );
}
