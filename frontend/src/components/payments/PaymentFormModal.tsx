import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Field, inputClass, selectClass, textareaClass } from '@/components/common/Field';
import { Button } from '@/components/common/Button';
import { LoanPicker } from '@/components/loans/LoanPicker';
import type { Loan, PaymentMethod } from '@/types';
import type { CreatePaymentPayload } from '@/api/payments';
import { paymentMethodLabels } from '@/utils/status';
import { formatCurrency } from '@/utils/format';

export function PaymentFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  fixedLoan,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePaymentPayload) => Promise<void>;
  isSubmitting: boolean;
  /** When provided, the loan cannot be changed (used from the loan detail page). */
  fixedLoan?: Loan;
}) {
  const [loan, setLoan] = useState<Loan | null>(fixedLoan ?? null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      const effectiveLoan = fixedLoan ?? null;
      setLoan(effectiveLoan);
      const pending = effectiveLoan?.installments?.find((i) => i.status !== 'PAID');
      setAmount(
        pending ? String(Number(pending.amountDue) - Number(pending.amountPaid)) : '',
      );
      setMethod('CASH');
      setReference('');
      setNotes('');
    }
  }, [isOpen, fixedLoan]);

  const effectiveLoan = fixedLoan ?? loan;
  const nextDue = effectiveLoan?.installments?.find((i) => i.status !== 'PAID');

  // Si el usuario elige otro préstamo desde el buscador, autollenar con su cuota pendiente.
  useEffect(() => {
    if (isOpen && !fixedLoan && loan) {
      const pending = loan.installments?.find((i) => i.status !== 'PAID');
      if (pending) {
        setAmount(String(Number(pending.amountDue) - Number(pending.amountPaid)));
      }
    }
  }, [isOpen, fixedLoan, loan?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    await onSubmit({
      loanId: loan.id,
      amount: Number(amount),
      method,
      reference: reference || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Modal
      title="Registrar depósito"
      description="El monto se aplica automáticamente a las cuotas pendientes más antiguas."
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Préstamo" required>
          {fixedLoan ? (
            <div className="rounded border border-line bg-paper px-3 py-2 text-sm">
              <p className="font-medium text-ink">{fixedLoan.code}</p>
              <p className="text-xs text-slate-400">
                {fixedLoan.client?.firstName} {fixedLoan.client?.lastName}
              </p>
            </div>
          ) : (
            <LoanPicker value={loan} onChange={setLoan} />
          )}
        </Field>

        {nextDue && (
          <p className="rounded border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-600">
            Próxima cuota pendiente: #{nextDue.number} por{' '}
            {formatCurrency(Number(nextDue.amountDue) - Number(nextDue.amountPaid))}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Monto del depósito" required>
            <input
              required
              type="number"
              min={0.01}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
              placeholder="5000"
            />
          </Field>
          <Field label="Método de pago" required>
            <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={selectClass}>
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Referencia" hint="Número de recibo, transferencia, etc. (opcional)">
          <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} />
        </Field>

        <Field label="Notas">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaClass} rows={2} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!loan}>
            Registrar depósito
          </Button>
        </div>
      </form>
    </Modal>
  );
}
