import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users as UsersIcon, Eye } from 'lucide-react';
import { clientsApi, type CreateClientPayload } from '@/api/clients';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/common/Button';
import { Panel } from '@/components/common/Panel';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusChip } from '@/components/common/StatusChip';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import { useToast, getErrorMessage } from '@/components/common/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate } from '@/utils/format';

export default function Clients() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialSearch = searchParams.get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['clients', debouncedSearch, page],
    queryFn: () => clientsApi.list({ search: debouncedSearch, page, limit: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateClientPayload) => clientsApi.create(payload),
    onSuccess: () => {
      showSuccess('Cliente registrado correctamente.');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  const clients = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Consulta y administra la información de los clientes de la financiera."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
            setSearchParams(value ? { search: value } : {});
          }}
          placeholder="Buscar por nombre, cédula, teléfono o correo…"
          className="max-w-md"
        />
      </div>

      <Panel className="overflow-hidden" noPadding>
        {isLoading ? (
          <div className="px-6 py-14 text-center text-sm text-slate">Cargando clientes…</div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No hay clientes que coincidan"
            description={
              debouncedSearch
                ? `No encontramos resultados para “${debouncedSearch}”.`
                : 'Aún no se han registrado clientes. Comienza creando el primero.'
            }
            action={
              !debouncedSearch && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nuevo cliente
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Cédula</th>
                  <th className="px-5 py-3 font-medium">Teléfono</th>
                  <th className="px-5 py-3 font-medium">Préstamos</th>
                  <th className="px-5 py-3 font-medium">Registrado</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-5 py-3">
                      <Link
                        to={`/clientes/${client.id}`}
                        className="font-medium text-ink hover:text-accent"
                      >
                        {client.firstName} {client.lastName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate">{client.documentId}</td>
                    <td className="px-5 py-3 text-slate">{client.phone}</td>
                    <td className="px-5 py-3 tabular text-slate">{client._count?.loans ?? 0}</td>
                    <td className="px-5 py-3 text-slate">{formatDate(client.createdAt)}</td>
                    <td className="px-5 py-3">
                      <StatusChip
                        label={client.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        tone={client.status === 'ACTIVE' ? 'positive' : 'neutral'}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/clientes/${client.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
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

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(payload) => createMutation.mutateAsync(payload).then(() => undefined)}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
