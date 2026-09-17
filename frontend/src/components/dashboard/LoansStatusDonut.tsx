import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { LoansByStatusPoint } from '@/types';
import { loanStatusLabels } from '@/utils/status';
import { formatCurrency } from '@/utils/format';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#0E6E5B',
  OVERDUE: '#B23A2E',
  PAID: '#8D9BB8',
  PENDING: '#B9812C',
  CANCELLED: '#D6DCE8',
};

export function LoansStatusDonut({ data }: { data: LoansByStatusPoint[] }) {
  const chartData = data.map((d) => ({
    name: loanStatusLabels[d.status],
    value: d.amount,
    count: d.count,
    color: STATUS_COLORS[d.status] ?? '#8D9BB8',
  }));

  if (chartData.every((d) => d.value === 0)) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-slate">
        Aún no hay préstamos registrados.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          strokeWidth={0}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, _name, props: any) => [
            `${formatCurrency(value)} · ${props.payload.count} préstamo(s)`,
            props.payload.name,
          ]}
          contentStyle={{ borderRadius: 6, borderColor: '#E3E6EC', fontSize: 13 }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: '#5B6472' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
