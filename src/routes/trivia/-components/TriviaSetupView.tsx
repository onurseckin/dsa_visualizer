import type { RefObject } from "react";
import { TriviaConfig, TriviaProgress, TriviaSessionRecord } from "../../../types/trivia";
import { TriviaHeaderCard } from "../../../components/trivia/TriviaHeaderCard";
import { TriviaDeckBuilder } from "../../../ui";

interface TriviaSetupViewProps {
  activeSession: TriviaSessionRecord;
  level: number;
  config: TriviaConfig;
  progress: TriviaProgress;
  sourcesSize: number;
  coverage: number;
  isDeckEmpty: boolean;
  deckLineCounts: number[];
  layout?: unknown;
  settingsPanel: {
    ref: RefObject<HTMLDivElement | null>;
    dragging?: boolean;
    setDragging?: (dragging: boolean) => void;
    nudge?: (delta: number) => void;
    restoreDefault?: () => void;
  };
  deckBuilderPanel: {
    ref: RefObject<HTMLDivElement | null>;
    dragging?: boolean;
    setDragging?: (dragging: boolean) => void;
    nudge?: (delta: number) => void;
    restoreDefault?: () => void;
  };
  onStartDrilling: () => void;
  onBackToHome: () => void;
  onRenameSession: (id: string, name: string) => void;
  onChangeSettings: (patch: Partial<TriviaConfig>) => void;
}

export function TriviaSetupView({
  activeSession,
  level,
  config,
  progress,
  sourcesSize,
  coverage,
  isDeckEmpty,
  deckLineCounts,
  settingsPanel,
  deckBuilderPanel,
  onStartDrilling,
  onBackToHome,
  onRenameSession,
  onChangeSettings,
}: TriviaSetupViewProps): React.ReactElement {
  return (
    <div className="w-full flex flex-col lg:flex-row items-start gap-8 mt-6 md:mt-8">
      {/* Left Column (62%): Build Your Deck / Question Selection */}
      <div className="w-full lg:w-[62%] flex flex-col gap-6" ref={deckBuilderPanel.ref}>
        <TriviaDeckBuilder deck={config.deck} onChange={(deck) => onChangeSettings({ deck })} />
      </div>

      {/* Right Column (38%): Trivia Drill Settings & Controls */}
      <div className="w-full lg:w-[38%] flex flex-col gap-6 sticky top-20" ref={settingsPanel.ref}>
        <TriviaHeaderCard
          activeSession={activeSession}
          level={level}
          config={config}
          progress={progress}
          sourcesCount={sourcesSize}
          coverage={coverage}
          isDeckEmpty={isDeckEmpty}
          onStartDrilling={onStartDrilling}
          onBackToHome={onBackToHome}
          onRenameSession={onRenameSession}
          deckLineCounts={deckLineCounts}
          onChangeSettings={onChangeSettings}
        />
        {isDeckEmpty && (
          <span className="text-xs text-rose-400 font-medium px-2">
            Add at least one algorithm to the deck to start drilling.
          </span>
        )}
      </div>
    </div>
  );
}
