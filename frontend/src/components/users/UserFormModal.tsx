import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Field, inputClass, selectClass } from '@/components/common/Field';
import { Button } from '@/components/common/Button';
import type { Role, StaffUser } from '@/types';
import { roleLabels } from '@/utils/status';

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  isSubmitting: boolean;
  user?: StaffUser | null;
}) {
  const [form, setForm] = useState<UserFormValues>({ name: '', email: '', password: '', role: 'CASHIER' });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, password: '', role: user.role });
    } else {
      setForm({ name: '', email: '', password: '', role: 'CASHIER' });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <Modal
      title={user ? 'Editar usuario' : 'Nuevo usuario del sistema'}
      description="Los usuarios del sistema son el personal que opera la plataforma (no los clientes)."
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre completo" required>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
            placeholder="Maria Gonzalez"
          />
        </Field>
        <Field label="Correo electrónico" required>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
            placeholder="maria.gonzalez@cartera.com"
          />
        </Field>
        {!user && (
          <Field label="Contraseña" required hint="Mínimo 8 caracteres">
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className={inputClass}
            />
          </Field>
        )}
        <Field label="Rol" required>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
            className={selectClass}
          >
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {user ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
