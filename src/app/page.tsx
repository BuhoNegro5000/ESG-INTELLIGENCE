import CommandCenter from '@/components/command-center';
import { getPortfolio, getWorkspace } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const portfolio = getPortfolio();
  const initialCompany = portfolio.companies.find((c) => c.id === 'andean-copper') || portfolio.companies[0];
  const initialWorkspace = getWorkspace(initialCompany?.id || 'andean-copper');
  if (!initialWorkspace) {
    return <main style={{ padding: 40 }}>No se encontraron datos del portafolio. Ejecuta <code>npm run seed</code>.</main>;
  }
  return <CommandCenter initialPortfolio={portfolio} initialWorkspace={initialWorkspace} />;
}
