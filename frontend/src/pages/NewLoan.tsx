import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { clientsApi } from '@/api/clients';
import { loansApi } from '@/api/loans';
import { ClientPicker } from '@/components/clients/ClientPicker';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { Field, inputClass, selectClass, textareaClass } from '@/components/common/Field';
import { Button } from '@/components/common/Button';
import { useToast, getErrorMessage } from '@/components/common/Toast';
import { formatCurrency } from '@/utils/format';
import type { Client, PaymentFrequency } from '@/types';

const frequencyOptions: { value: PaymentFrequency; label: string; periodsPerYear: number }[] = [
  { value: 'WEEKLY', label: 'Semanal', periodsPerYear: 52 },
  { value: 'BIWEEKLY', label: 'Quincenal', periodsPerYear: 26 },
  { value: 'MONTHLY', label: 'Mensual', periodsPerYear: 12 },
];

function estimateInstallment(principal: number, annualRate: number, term: number, periodsPerYear: number) {
  if (!principal || !term) return 0;
  const periodicRate = annualRate / 100 / periodsPerYear;
  if (periodicRate === 0) return principal / term;
  return (principal * periodicRate) / (1 - Math.pow(1 + periodicRate, -term));
}

export default function NewLoan() {
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('24');
  const [termInstallments, setTermInstallments] = useState('12');
  const [frequency, setFrequency] = useState<PaymentFrequency>('MONTHLY');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  const { data: preselectedClient } = useQuery({
    queryKey: ['client', preselectedClientId],
    queryFn: () => clientsApi.get(preselectedClientId as string),
    enabled: !!preselectedClientId,
  });

  useEffect(() => {
    if (preselectedClient) setSelectedClient(preselectedClient);
  }, [preselectedClient]);

  const createMutation = useMutation({
    mutationFn: loansApi.create,
    onSuccess: (loan) => {
      showSuccess(`Préstamo ${loan.code} creado correctamente.`);
      navigate(`/prestamos/${loan.id}`);
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  const periodsPerYear = frequencyOptions.find((f) => f.value === frequency)?.periodsPerYear ?? 12;
  const estimatedInstallment = useMemo(
    () =>
      estimateInstallment(
        Number(principal) || 0,
        Number(interestRate) || 0,
        Number(termInstallments) || 0,
        periodsPerYear,
      ),
    [principal, interestRate, termInstallments, periodsPerYear],
  );
  const estimatedTotal = estimatedInstallment * (Number(termInstallments) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      showError('Selecciona un cliente para el préstamo.');
      return;
    }
    createMutation.mutate({
      clientId: selectedClient.id,
      principal: Number(principal),
      interestRate: Number(interestRate),
      termInstallments: Number(termInstallments),
      frequency,
      startDate,
      purpose: purpose || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate('/prestamos')}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a préstamos
      </button>

      <PageHeader
        title="Nuevo préstamo"
        description="Define el monto, tasa y plazo. La tabla de amortización se genera automáticamente."
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Panel title="Cliente">
          <ClientPicker value={selectedClient} onChange={setSelectedClient} />
        </Panel>

        <Panel title="Condiciones del préstamo">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Monto del préstamo" required hint="Monto que se desembolsa al cliente">
              <input
                required
                type="number"
                min={1}
                step="0.01"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className={inputClass}
                placeholder="30000"
              />
            </Field>
            <Field label="Tasa de interés anual (%)" required>
              <input
                required
                type="number"
                min={0}
                max={200}
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Número de cuotas" required>
              <input
                required
                type="number"
                min={1}
                max={120}
                value={termInstallments}
                onChange={(e) => setTermInstallments(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Frecuencia de pago" required>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as PaymentFrequency)}
                className={selectClass}
              >
                {frequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha de inicio" required>
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Propósito del préstamo">
              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className={inputClass}
                placeholder="Capital de trabajo"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Notas">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={textareaClass}
                rows={2}
              />
            </Field>
          </div>
        </Panel>

        {Number(principal) > 0 && Number(termInstallments) > 0 && (
          <Panel title="Estimación de la cuota" className="bg-accent-50/40">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Cuota estimada</p>
                <p className="mt-1 font-display text-xl font-medium tabular text-ink">
                  {formatCurrency(estimatedInstallment)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Total a pagar</p>
                <p className="mt-1 font-display text-xl font-medium tabular text-ink">
                  {formatCurrency(estimatedTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Costo financiero</p>
                <p className="mt-1 font-display text-xl font-medium tabular text-ink">
                  {formatCurrency(estimatedTotal - Number(principal))}
                </p>
              </div>
            </div>
          </Panel>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/prestamos')}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Crear préstamo
          </Button>
        </div>
      </form>
    </div>
  );
}
