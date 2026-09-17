import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { loansApi } from '@/api/loans';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, getLoanRemainingBalance } from '@/utils/format';
import type { Loan } from '@/types';

export function LoanPicker({ value, onChange }: { value: Loan | null; onChange: (loan: Loan | null) => void }) {
  const [term, setTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedTerm = useDebounce(term, 250);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['loan-picker', debouncedTerm],
    queryFn: () => loansApi.list({ search: debouncedTerm, page: 1, limit: 8 }),
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
          <p className="text-sm font-medium text-ink">{value.code}</p>
          <p className="text-xs text-slate-400">
            {value.client?.firstName} {value.client?.lastName} · {formatCurrency(value.principal)} · Restante{' '}
            {formatCurrency(getLoanRemainingBalance(value))}
          </p>
        </div>
        <button type="button" onClick={() => onChange(null)} className="text-slate-400 hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const results = (data?.data ?? []).filter((loan) => loan.status === 'ACTIVE' || loan.status === 'OVERDUE');

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
        placeholder="Buscar préstamo por código, cliente o cédula…"
        className="focus-ring h-10 w-full rounded border border-line bg-white pl-9 pr-3 text-sm text-ink placeholder:text-slate-400"
      />
      {isOpen && (
        <div className="absolute z-30 mt-1.5 max-h-64 w-full overflow-y-auto rounded border border-line bg-surface shadow-subtle">
          {isFetching && <div className="px-4 py-3 text-sm text-slate">Buscando…</div>}
          {!isFetching && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate">
              Escribe para buscar un préstamo activo o atrasado.
            </div>
          )}
          {!isFetching &&
            results.map((loan) => (
              <button
                key={loan.id}
                type="button"
                onClick={() => {
                  onChange(loan);
                  setIsOpen(false);
                  setTerm('');
                }}
                className="flex w-full flex-col items-start px-4 py-2.5 text-left text-sm hover:bg-paper"
              >
                <span className="font-medium text-ink">{loan.code}</span>
                <span className="text-xs text-slate-400">
                  {loan.client?.firstName} {loan.client?.lastName} · {formatCurrency(loan.principal)} · Restante{' '}
                  {formatCurrency(getLoanRemainingBalance(loan))}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
