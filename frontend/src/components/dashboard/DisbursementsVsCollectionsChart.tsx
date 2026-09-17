import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlyPoint } from '@/types';
import { formatCurrency } from '@/utils/format';

export function DisbursementsVsCollectionsChart({
  disbursements,
  collections,
}: {
  disbursements: MonthlyPoint[];
  collections: MonthlyPoint[];
}) {
  const data = disbursements.map((d, i) => ({
    month: d.month,
    Desembolsado: d.total,
    Cobrado: collections[i]?.total ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={6}>
        <CartesianGrid stroke="#E3E6EC" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#5B6472' }}
          axisLine={{ stroke: '#E3E6EC' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#5B6472' }}
          axisLine={false}
          tickLine={false}
          width={70}
          tickFormatter={(value) => formatCurrency(value).replace('MX$', '').replace('$', '').trim()}
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{ borderRadius: 6, borderColor: '#E3E6EC', fontSize: 13 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#5B6472' }} iconType="circle" iconSize={8} />
        <Bar dataKey="Desembolsado" fill="#14213D" radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Bar dataKey="Cobrado" fill="#0E6E5B" radius={[3, 3, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
