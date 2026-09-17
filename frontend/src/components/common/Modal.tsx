import { X } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Modal({
  title,
  description,
  isOpen,
  onClose,
  children,
  width = 'md',
}: {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[width];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 px-4 py-10">
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${widthClass} rounded border border-line bg-surface shadow-subtle`}
      >
        <div className="flex items-start justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-medium text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded p-1 text-slate-400 hover:bg-paper hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
