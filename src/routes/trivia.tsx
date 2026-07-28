import { createFileRoute } from "@tanstack/react-router";

import { useTriviaPage } from "./trivia/-hooks/useTriviaPage";
import { TriviaHomeView } from "./trivia/-components/TriviaHomeView";
import { TriviaSetupView } from "./trivia/-components/TriviaSetupView";
import { TriviaCompletionView } from "./trivia/-components/TriviaCompletionView";
import { TriviaEmptyLevelView } from "./trivia/-components/TriviaEmptyLevelView";
import { TriviaSession } from "../components/trivia/TriviaSession";

export const Route = createFileRoute("/trivia")({
  component: TriviaPage,
});

function TriviaPage() {
  const {
    sessions,
    activeSession,
    config,
    progress,
    round,
    screen,
    level,
    coverage,
    sources,
    meta,
    deckLineCounts,
    isDeckEmpty,
    activeTitle,
    layout,
    sessionListPanel,
    deckBuilderPanel,
    settingsPanel,
    applyConfig,
    handleSubmit,
    handleNext,
    handleStartDrilling,
    handleEditSettings,
    handleBackToHome,
    handleCreateNewSession,
    handleResumeSession,
    handleRenameSession,
    handleDeleteSession,
    handleStudyInWorkspace,
  } = useTriviaPage();

  return (
    <main
      aria-label="Code trivia drill"
      className="w-[90%] py-8 mx-auto flex flex-col flex-1 gap-8 min-h-0 box-border overflow-y-auto"
    >
      {screen === "home" ? (
        <TriviaHomeView
          sessions={sessions}
          layout={layout}
          sessionListPanel={sessionListPanel}
          onCreateNewSession={handleCreateNewSession}
          onResumeSession={handleResumeSession}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
        />
      ) : activeSession && config && progress ? (
        screen === "setup" ? (
          <TriviaSetupView
            layout={layout}
            activeSession={activeSession}
            level={level}
            config={config}
            progress={progress}
            sourcesSize={sources.size}
            coverage={coverage}
            isDeckEmpty={isDeckEmpty}
            deckLineCounts={deckLineCounts}
            settingsPanel={settingsPanel}
            deckBuilderPanel={deckBuilderPanel}
            onStartDrilling={handleStartDrilling}
            onBackToHome={() => handleBackToHome("setup")}
            onRenameSession={handleRenameSession}
            onChangeSettings={applyConfig}
          />
        ) : progress.completed ? (
          <TriviaCompletionView
            sourcesSize={sources.size}
            maxBlanks={config.maxBlanks}
            onEditSettings={handleEditSettings}
            onBackToHome={() => handleBackToHome("drill")}
          />
        ) : round !== null ? (
          <TriviaSession
            round={round}
            algorithmTitle={activeTitle}
            mode={config.mode}
            level={level}
            coverage={coverage}
            onSubmit={handleSubmit}
            onNext={handleNext}
            onEditSettings={handleEditSettings}
            onBackToHome={() => handleBackToHome("drill")}
            onStudyInWorkspace={handleStudyInWorkspace}
            hints={meta.get(round.algorithmId)?.hints}
            lineExplanations={meta.get(round.algorithmId)?.lineExplanations}
          />
        ) : (
          <TriviaEmptyLevelView
            level={level}
            onEditSettings={handleEditSettings}
            onBackToHome={() => handleBackToHome("drill")}
          />
        )
      ) : null}
    </main>
  );
}
