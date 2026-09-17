import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Field, inputClass } from '@/components/common/Field';
import { getErrorMessage } from '@/components/common/Toast';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/';
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err) === 'Invalid credentials' ? 'Correo o contraseña incorrectos.' : getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Landmark className="h-6 w-6" />
          </span>
          <h1 className="font-display text-2xl font-medium text-white">Cartera</h1>
          <p className="mt-1 text-sm text-ink-300">Gestión de préstamos y clientes</p>
        </div>

        <form onSubmit={onSubmit} className="rounded border border-ink-700 bg-ink-800 p-6">
          <div className="space-y-4">
            <Field label="Correo electrónico" required>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cartera.com"
                className={`${inputClass} border-ink-700 bg-ink-900 text-white placeholder:text-ink-300`}
              />
            </Field>
            <Field label="Contraseña" required>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputClass} border-ink-700 bg-ink-900 text-white placeholder:text-ink-300`}
              />
            </Field>

            {error && (
              <p className="rounded border border-rust-100 bg-rust-50 px-3 py-2 text-sm text-rust-600">
                {error}
              </p>
            )}

            <Button type="submit" variant="accent" isLoading={isLoading} className="w-full">
              Iniciar sesión
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-ink-300">
          Cuenta de prueba: admin@cartera.com / Admin123!
        </p>
      </div>
    </div>
  );
}
