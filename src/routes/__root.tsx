import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { AppView } from '../types/dsa';
import { Navbar } from '../components/Navbar';
import { CATEGORIES } from '../app/categories';
import { SettingsProvider, useSettings } from '../app/SettingsContext';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent(): React.ReactElement {
  return (
    <SettingsProvider>
      <RootShell />
    </SettingsProvider>
  );
}

function RootShell(): React.ReactElement {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const {
    panels,
    togglePanel,
    lastAlgorithmId,
    setLastAlgorithmId,
  } = useSettings();

  const appView: AppView =
    pathname === '/'
      ? 'tree'
      : pathname.startsWith('/problems')
      ? 'list'
      : pathname.startsWith('/trivia')
      ? 'trivia'
      : 'workspace';

  const handleSetAppView = (view: AppView) => {
    if (view === 'tree') {
      navigate({ to: '/' });
    } else if (view === 'list') {
      navigate({ to: '/problems', search: {} });
    } else if (view === 'trivia') {
      navigate({ to: '/trivia' });
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
        panels={panels}
        onTogglePanel={togglePanel}
      />

      <Outlet />
    </div>
  );
}
