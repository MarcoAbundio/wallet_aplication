import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCog, Pencil, UserX, UserCheck } from 'lucide-react';
import { usersApi, type CreateUserPayload } from '@/api/users';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/common/Button';
import { Panel } from '@/components/common/Panel';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusChip } from '@/components/common/StatusChip';
import { UserFormModal, type UserFormValues } from '@/components/users/UserFormModal';
import { useToast, getErrorMessage } from '@/components/common/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils/format';
import { roleLabels } from '@/utils/status';
import type { StaffUser } from '@/types';

export default function Users() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['staff-users', debouncedSearch, page],
    queryFn: () => usersApi.list({ search: debouncedSearch || undefined, page, limit: 10 }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['staff-users'] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => {
      showSuccess('Usuario creado correctamente.');
      setIsModalOpen(false);
      invalidate();
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      usersApi.update(editingUser!.id, { name: values.name, email: values.email, role: values.role }),
    onSuccess: () => {
      showSuccess('Usuario actualizado correctamente.');
      setIsModalOpen(false);
      setEditingUser(null);
      invalidate();
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.update(id, { isActive }),
    onSuccess: (_, variables) => {
      showSuccess(variables.isActive ? 'Usuario activado.' : 'Usuario desactivado.');
      invalidate();
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  const staff = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Usuarios del sistema"
        description="Administra las cuentas del personal que opera la plataforma."
        action={
          <Button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nuevo usuario
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
          placeholder="Buscar por nombre o correo…"
          className="max-w-md"
        />
      </div>

      <Panel noPadding>
        {isLoading ? (
          <div className="px-6 py-14 text-center text-sm text-slate">Cargando usuarios…</div>
        ) : staff.length === 0 ? (
          <EmptyState icon={UserCog} title="No hay usuarios que coincidan" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="px-5 py-3 font-medium">Correo</th>
                  <th className="px-5 py-3 font-medium">Rol</th>
                  <th className="px-5 py-3 font-medium">Último acceso</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-5 py-3 font-medium text-ink">{member.name}</td>
                    <td className="px-5 py-3 text-slate">{member.email}</td>
                    <td className="px-5 py-3 text-slate">{roleLabels[member.role]}</td>
                    <td className="px-5 py-3 text-slate">
                      {member.lastLoginAt ? formatDate(member.lastLoginAt) : 'Nunca'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusChip
                        label={member.isActive ? 'Activo' : 'Inactivo'}
                        tone={member.isActive ? 'positive' : 'neutral'}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingUser(member);
                            setIsModalOpen(true);
                          }}
                          className="focus-ring rounded p-1.5 text-slate-400 hover:bg-paper hover:text-ink"
                          aria-label="Editar usuario"
                          title="Editar usuario"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {member.id !== currentUser?.id &&
                          (member.isActive ? (
                            <button
                              onClick={() =>
                                toggleActiveMutation.mutate({ id: member.id, isActive: false })
                              }
                              disabled={toggleActiveMutation.isPending}
                              className="focus-ring rounded p-1.5 text-slate-400 hover:bg-rust-50 hover:text-rust-600"
                              aria-label="Desactivar usuario"
                              title="Desactivar usuario"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                toggleActiveMutation.mutate({ id: member.id, isActive: true })
                              }
                              disabled={toggleActiveMutation.isPending}
                              className="focus-ring rounded p-1.5 text-slate-400 hover:bg-accent-50 hover:text-accent-700"
                              aria-label="Activar usuario"
                              title="Activar usuario"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          ))}
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

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={(values) =>
          editingUser
            ? updateMutation.mutateAsync(values).then(() => undefined)
            : createMutation.mutateAsync(values).then(() => undefined)
        }
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        user={editingUser}
      />
    </div>
  );
}
