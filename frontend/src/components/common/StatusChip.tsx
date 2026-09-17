import clsx from 'clsx';

type Tone = 'neutral' | 'positive' | 'warning' | 'danger';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-ink-50 text-ink-500 border-ink-100',
  positive: 'bg-accent-50 text-accent-700 border-accent-100',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  danger: 'bg-rust-50 text-rust-600 border-rust-100',
};

export function StatusChip({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
      )}
    >
      {label}
    </span>
  );
}
