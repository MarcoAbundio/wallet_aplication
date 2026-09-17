import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, User } from 'lucide-react';
import { clientsApi } from '@/api/clients';
import { useDebounce } from '@/hooks/useDebounce';

export function ClientSearchBar() {
  const [term, setTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedTerm = useDebounce(term, 250);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ['client-search', debouncedTerm],
    queryFn: () => clientsApi.list({ search: debouncedTerm, page: 1, limit: 6 }),
    enabled: debouncedTerm.length >= 2,
  });

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const results = data?.data ?? [];
  const showDropdown = isOpen && debouncedTerm.length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Buscar cliente por nombre, cédula o teléfono…"
        className="focus-ring h-10 w-full rounded border border-line bg-paper pl-9 pr-3 text-sm text-ink placeholder:text-slate-400"
      />

      {showDropdown && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded border border-line bg-surface shadow-subtle">
          {isFetching && <div className="px-4 py-3 text-sm text-slate">Buscando…</div>}

          {!isFetching && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate">
              No se encontraron clientes para “{debouncedTerm}”
            </div>
          )}

          {!isFetching &&
            results.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setTerm('');
                  navigate(`/clientes/${client.id}`);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-paper"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-500">
                  <User className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">
                    {client.firstName} {client.lastName}
                  </span>
                  <span className="block truncate text-xs text-slate-400">{client.documentId}</span>
                </span>
              </button>
            ))}

          {!isFetching && results.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(`/clientes?search=${encodeURIComponent(debouncedTerm)}`);
              }}
              className="w-full border-t border-line px-4 py-2 text-center text-xs font-medium text-accent hover:bg-accent-50"
            >
              Ver todos los resultados
            </button>
          )}
        </div>
      )}
    </div>
  );
}
