import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-4 text-center">
      <Compass className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
      <h1 className="font-display text-2xl font-medium text-ink">Página no encontrada</h1>
      <p className="text-sm text-slate">La página que buscas no existe o fue movida.</p>
      <Link to="/" className="focus-ring mt-2 rounded bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink-800">
        Volver al panel
      </Link>
    </div>
  );
}
