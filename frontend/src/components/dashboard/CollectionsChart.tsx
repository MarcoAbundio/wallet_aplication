import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { MonthlyPoint } from '@/types';
import { formatCurrency } from '@/utils/format';

export function CollectionsChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
          formatter={(value: number) => [formatCurrency(value), 'Cobrado']}
          contentStyle={{
            borderRadius: 6,
            borderColor: '#E3E6EC',
            fontSize: 13,
          }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#0E6E5B"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#0E6E5B' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
