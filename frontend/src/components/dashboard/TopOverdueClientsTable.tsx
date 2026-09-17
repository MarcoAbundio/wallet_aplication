import { Link } from 'react-router-dom';
import type { OverdueClientPoint } from '@/types';
import { formatCurrency } from '@/utils/format';
import { EmptyState } from '@/components/common/EmptyState';
import { ShieldCheck } from 'lucide-react';

export function TopOverdueClientsTable({ data }: { data: OverdueClientPoint[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Sin atrasos"
        description="Ningún cliente tiene cuotas atrasadas en este momento."
      />
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate-400">
          <th className="pb-2 font-medium">Cliente</th>
          <th className="pb-2 font-medium">Cuotas atrasadas</th>
          <th className="pb-2 text-right font-medium">Monto atrasado</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.clientId} className="border-b border-line last:border-0">
            <td className="py-2.5">
              <Link to={`/clientes/${row.clientId}`} className="font-medium text-ink hover:text-accent">
                {row.name}
              </Link>
            </td>
            <td className="py-2.5 text-slate">{row.overdueInstallments}</td>
            <td className="py-2.5 text-right font-medium tabular text-rust-600">
              {formatCurrency(row.overdueAmount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
