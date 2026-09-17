import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, User, X } from 'lucide-react';
import { clientsApi } from '@/api/clients';
import { useDebounce } from '@/hooks/useDebounce';
import type { Client } from '@/types';

export function ClientPicker({
  value,
  onChange,
}: {
  value: Client | null;
  onChange: (client: Client | null) => void;
}) {
  const [term, setTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedTerm = useDebounce(term, 250);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['client-picker', debouncedTerm],
    queryFn: () => clientsApi.list({ search: debouncedTerm, page: 1, limit: 8 }),
    enabled: isOpen,
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

  if (value) {
    return (
      <div className="flex items-center justify-between rounded border border-line bg-paper px-3 py-2">
        <div>
          <p className="text-sm font-medium text-ink">
            {value.firstName} {value.lastName}
          </p>
          <p className="text-xs text-slate-400">{value.documentId}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-slate-400 hover:text-ink"
          aria-label="Cambiar cliente"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const results = data?.data ?? [];

  return (
    <div ref={containerRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={term}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setTerm(e.target.value);
          setIsOpen(true);
        }}
        placeholder="Buscar cliente por nombre o cédula…"
        className="focus-ring h-10 w-full rounded border border-line bg-white pl-9 pr-3 text-sm text-ink placeholder:text-slate-400"
      />
      {isOpen && (
        <div className="absolute z-30 mt-1.5 max-h-64 w-full overflow-y-auto rounded border border-line bg-surface shadow-subtle">
          {isFetching && <div className="px-4 py-3 text-sm text-slate">Buscando…</div>}
          {!isFetching && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate">Escribe para buscar un cliente.</div>
          )}
          {!isFetching &&
            results.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => {
                  onChange(client);
                  setIsOpen(false);
                  setTerm('');
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-paper"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-500">
                  <User className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">
                    {client.firstName} {client.lastName}
                  </span>
                  <span className="block truncate text-xs text-slate-400">{client.documentId}</span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
