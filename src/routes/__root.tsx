import { Suspense, lazy } from 'react';
import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { AppView } from '../types/dsa';
import { Navbar } from '../components/Navbar';
import { CATEGORIES } from '../app/categories';
import { SettingsProvider, useSettings } from '../app/SettingsContext';

/* Devtools are dev-only; MODE === 'test' is excluded so the lazy chunk does not
   render extra DOM into jsdom-based routing specs. */
const RouterDevtools =
  import.meta.env.DEV && import.meta.env.MODE !== 'test'
    ? lazy(() =>
        import('@tanstack/react-router-devtools').then((mod) => ({
          default: mod.TanStackRouterDevtools,
        }))
      )
    : null;

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <SettingsProvider>
      <RootShell />
    </SettingsProvider>
  );
}

function RootShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const {
    viewMode,
    setViewMode,
    showTutorial,
    setShowTutorial,
    showAuxiliary,
    setShowAuxiliary,
    soundEnabled,
    setSoundEnabled,
    lastAlgorithmId,
    setLastAlgorithmId,
  } = useSettings();

  const appView: AppView =
    pathname === '/' ? 'tree' : pathname.startsWith('/problems') ? 'list' : 'workspace';

  const handleSetAppView = (view: AppView) => {
    if (view === 'tree') {
      navigate({ to: '/' });
    } else if (view === 'list') {
      navigate({ to: '/problems', search: {} });
    } else {
      navigate({ to: '/workspace/$algorithmId', params: { algorithmId: lastAlgorithmId } });
    }
  };

  const handleGlobalSelectAlgorithm = (algorithmId: string) => {
    setLastAlgorithmId(algorithmId);
    navigate({ to: '/workspace/$algorithmId', params: { algorithmId } });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg-page)',
      }}
    >
      <Navbar
        appView={appView}
        onSetAppView={handleSetAppView}
        categories={CATEGORIES}
        activeAlgorithmId={lastAlgorithmId}
        onGlobalSelectAlgorithm={handleGlobalSelectAlgorithm}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        showTutorial={showTutorial}
        onToggleTutorial={() => setShowTutorial(!showTutorial)}
        showAuxiliary={showAuxiliary}
        onToggleAuxiliary={() => setShowAuxiliary(!showAuxiliary)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      <Outlet />

      {RouterDevtools ? (
        <Suspense fallback={null}>
          <RouterDevtools />
        </Suspense>
      ) : null}
    </div>
  );
}
