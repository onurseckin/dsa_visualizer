import { createRootRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { AppView } from "../types/dsa";
import { Navbar } from "../ui";
import { CATEGORIES } from "../app/categories";
import { SettingsProvider, useSettings } from "../app/SettingsContext";

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
  const { panels, togglePanel, lastAlgorithmId, setLastAlgorithmId } = useSettings();

  const appView: AppView =
    pathname === "/"
      ? "tree"
      : pathname.startsWith("/problems")
        ? "list"
        : pathname.startsWith("/trivia")
          ? "trivia"
          : "workspace";

  const handleSetAppView = (view: AppView) => {
    if (view === "tree") {
      navigate({ to: "/" });
    } else if (view === "list") {
      navigate({ to: "/problems", search: {} });
    } else if (view === "trivia") {
      navigate({ to: "/trivia" });
    } else {
      navigate({ to: "/workspace/$algorithmId", params: { algorithmId: lastAlgorithmId } });
    }
  };

  const handleGlobalSelectAlgorithm = (algorithmId: string) => {
    setLastAlgorithmId(algorithmId);
    navigate({ to: "/workspace/$algorithmId", params: { algorithmId } });
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[var(--bg-page)] overflow-x-hidden">
      <Navbar
        appView={appView}
        onSetAppView={handleSetAppView}
        categories={CATEGORIES}
        activeAlgorithmId={lastAlgorithmId}
        onGlobalSelectAlgorithm={handleGlobalSelectAlgorithm}
        panels={panels}
        onTogglePanel={togglePanel}
      />

      <div className="w-full flex-1 flex flex-col min-h-0 items-center">
        <Outlet />
      </div>
    </div>
  );
}
