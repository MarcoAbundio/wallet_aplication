import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutGrid,
  Users,
  Landmark,
  ArrowDownToLine,
  UserCog,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { to: '/', label: 'Panel', icon: LayoutGrid, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { to: '/clientes', label: 'Clientes', icon: Users, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { to: '/prestamos', label: 'Préstamos', icon: Landmark, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { to: '/depositos', label: 'Depósitos', icon: ArrowDownToLine, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { to: '/usuarios', label: 'Usuarios', icon: UserCog, roles: ['ADMIN'] },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-ink-900/40 md:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-ink transition-transform md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <span className="font-display text-xl font-semibold tracking-tight text-white">
            Cartera
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-300 hover:text-white md:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-0.5 px-3">
          {navItems
            .filter((item) => !user || item.roles.includes(user.role))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-ink-700 text-white'
                      : 'text-ink-300 hover:bg-ink-800 hover:text-white',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="border-t border-ink-700 px-6 py-4">
          <p className="text-xs text-ink-300">Cartera v1.0</p>
        </div>
      </aside>
    </>
  );
}
