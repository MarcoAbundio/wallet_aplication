import type { ReactNode } from 'react';

export function Field({
  label,
  error,
  hint,
  children,
  required,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">
        {label}
        {required && <span className="text-rust"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rust-600">{error}</p>}
    </label>
  );
}

export const inputClass =
  'focus-ring h-10 w-full rounded border border-line bg-white px-3 text-sm text-ink placeholder:text-slate-400';

export const selectClass = inputClass + ' appearance-none bg-white';

export const textareaClass =
  'focus-ring w-full rounded border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400';
