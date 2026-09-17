import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

type Tone = 'ink' | 'accent' | 'amber' | 'rust';

const barTone: Record<Tone, string> = {
  ink: 'bg-ink',
  accent: 'bg-accent',
  amber: 'bg-amber',
  rust: 'bg-rust',
};

const iconTone: Record<Tone, string> = {
  ink: 'text-ink-500',
  accent: 'text-accent',
  amber: 'text-amber-600',
  rust: 'text-rust-600',
};

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'ink',
}: {
  label: string;
  value: string;
  helper?: string;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className="relative overflow-hidden rounded border border-line bg-surface p-5">
      <div className={clsx('absolute inset-x-0 top-0 h-0.5', barTone[tone])} />
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate">{label}</p>
        {Icon && <Icon className={clsx('h-4 w-4', iconTone[tone])} />}
      </div>
      <p className="mt-2 font-display text-2xl font-medium tabular text-ink">{value}</p>
      {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
    </div>
  );
}
