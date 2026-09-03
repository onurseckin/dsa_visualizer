import { createRootRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { AppView } from "../types/dsa";
import { Navbar } from "../ui";
import { TOPICS } from "../app/topics";
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
  const { panels, togglePanel, lastItemId, setLastItemId } = useSettings();

  const appView: AppView = pathname.startsWith("/ml-infra")
    ? "ml-infra"
    : pathname === "/"
      ? "tree"
      : pathname.startsWith("/learn")
        ? "learn"
        : pathname.startsWith("/problems")
          ? "list"
          : pathname.startsWith("/trivia")
            ? "trivia"
            : "workspace";

  const handleSetAppView = (view: AppView) => {
    if (view === "ml-infra") {
      navigate({ to: "/ml-infra" });
    } else if (view === "tree") {
      navigate({ to: "/" });
    } else if (view === "learn") {
      navigate({ to: "/learn", search: {} });
    } else if (view === "list") {
      navigate({ to: "/problems", search: {} });
    } else if (view === "trivia") {
      navigate({ to: "/trivia" });
    } else {
      navigate({ to: "/workspace/$algorithmId", params: { algorithmId: lastItemId } });
    }
  };

  const handleGlobalSelectItem = (itemId: string) => {
    setLastItemId(itemId);
    navigate({ to: "/workspace/$algorithmId", params: { algorithmId: itemId } });
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[var(--bg-page)] overflow-x-hidden">
      <Navbar
        appView={appView}
        onSetAppView={handleSetAppView}
        topics={TOPICS}
        activeAlgorithmId={lastItemId}
        onGlobalSelectAlgorithm={handleGlobalSelectItem}
        panels={panels}
        onTogglePanel={togglePanel}
      />

      <div className="w-full flex-1 flex flex-col min-h-0 items-center">
        <Outlet />
      </div>
    </div>
  );
}
