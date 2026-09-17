import { useState } from 'react';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ClientSearchBar } from './ClientSearchBar';
import { initials } from '@/utils/format';
import { roleLabels } from '@/utils/status';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-line bg-surface px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="text-ink-500 hover:text-ink md:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <ClientSearchBar />

      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="focus-ring flex items-center gap-2 rounded px-2 py-1.5 hover:bg-paper"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-medium text-white">
              {user ? initials(user.name.split(' ')[0], user.name.split(' ')[1] ?? '') : ''}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-ink">{user?.name}</span>
              <span className="block text-xs leading-tight text-slate-400">
                {user ? roleLabels[user.role] : ''}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1.5 w-44 overflow-hidden rounded border border-line bg-surface shadow-subtle">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink hover:bg-paper"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
