import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Field, inputClass, textareaClass } from '@/components/common/Field';
import { Button } from '@/components/common/Button';
import type { Client } from '@/types';
import type { CreateClientPayload } from '@/api/clients';

const emptyForm: CreateClientPayload = {
  firstName: '',
  lastName: '',
  documentId: '',
  phone: '',
  email: '',
  address: '',
  occupation: '',
  notes: '',
};

export function ClientFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  client,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateClientPayload) => Promise<void>;
  isSubmitting: boolean;
  client?: Client | null;
}) {
  const [form, setForm] = useState<CreateClientPayload>(emptyForm);

  useEffect(() => {
    if (client) {
      setForm({
        firstName: client.firstName,
        lastName: client.lastName,
        documentId: client.documentId,
        phone: client.phone,
        email: client.email ?? '',
        address: client.address ?? '',
        occupation: client.occupation ?? '',
        notes: client.notes ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [client, isOpen]);

  const update = (field: keyof CreateClientPayload, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <Modal
      title={client ? 'Editar cliente' : 'Nuevo cliente'}
      description="Registra la información básica del cliente para poder asociarle préstamos."
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre" required>
            <input
              required
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              className={inputClass}
              placeholder="Ana"
            />
          </Field>
          <Field label="Apellido" required>
            <input
              required
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              className={inputClass}
              placeholder="Martínez López"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Cédula / documento" required>
            <input
              required
              value={form.documentId}
              onChange={(e) => update('documentId', e.target.value)}
              className={inputClass}
              placeholder="001-1234567-8"
            />
          </Field>
          <Field label="Teléfono" required>
            <input
              required
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className={inputClass}
              placeholder="809-555-0102"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Correo electrónico">
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className={inputClass}
              placeholder="cliente@correo.com"
            />
          </Field>
          <Field label="Ocupación">
            <input
              value={form.occupation}
              onChange={(e) => update('occupation', e.target.value)}
              className={inputClass}
              placeholder="Comerciante"
            />
          </Field>
        </div>

        <Field label="Dirección">
          <input
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            className={inputClass}
            placeholder="Calle Duarte #45, Santo Domingo"
          />
        </Field>

        <Field label="Notas">
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            className={textareaClass}
            rows={3}
            placeholder="Observaciones adicionales sobre el cliente…"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {client ? 'Guardar cambios' : 'Registrar cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
