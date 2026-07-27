import type { RefObject } from "react";
import {
  MAX_PANEL_HEIGHT_PX,
  MIN_PANEL_HEIGHT_PX,
  TriviaLayout,
} from "../../../trivia/triviaLayout";
import { TriviaConfig, TriviaProgress, TriviaSessionRecord } from "../../../types/trivia";
import { DragHandle } from "../../../ui";
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
  layout: TriviaLayout;
  settingsPanel: {
    ref: RefObject<HTMLDivElement | null>;
    dragging: boolean;
    setDragging: (dragging: boolean) => void;
    nudge: (delta: number) => void;
    restoreDefault: () => void;
  };
  deckBuilderPanel: {
    ref: RefObject<HTMLDivElement | null>;
    dragging: boolean;
    setDragging: (dragging: boolean) => void;
    nudge: (delta: number) => void;
    restoreDefault: () => void;
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
  layout,
  settingsPanel,
  deckBuilderPanel,
  onStartDrilling,
  onBackToHome,
  onRenameSession,
  onChangeSettings,
}: TriviaSetupViewProps): React.ReactElement {
  return (
    <>
      <div
        ref={settingsPanel.ref}
        className="shrink-0"
        style={{
          height:
            layout.panelHeights.settings !== null ? `${layout.panelHeights.settings}px` : undefined,
          overflow: layout.panelHeights.settings !== null ? "auto" : "visible",
        }}
      >
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
      </div>

      {isDeckEmpty && (
        <span className="text-xs text-[var(--text-muted)] leading-normal">
          Add at least one algorithm to the deck to start drilling.
        </span>
      )}

      <DragHandle
        orientation="horizontal"
        label="Resize drill settings and deck builder"
        valueNow={layout.panelHeights.settings ?? MIN_PANEL_HEIGHT_PX}
        valueMin={MIN_PANEL_HEIGHT_PX}
        valueMax={MAX_PANEL_HEIGHT_PX}
        valueText={
          layout.panelHeights.settings === null ? "Automatic, sized to content" : undefined
        }
        step={16}
        dragging={settingsPanel.dragging}
        onDragStart={() => settingsPanel.setDragging(true)}
        onNudge={settingsPanel.nudge}
        onRestoreDefault={settingsPanel.restoreDefault}
      />

      <div
        ref={deckBuilderPanel.ref}
        className="shrink-0"
        style={{
          height:
            layout.panelHeights.deckBuilder !== null
              ? `${layout.panelHeights.deckBuilder}px`
              : undefined,
          overflow: layout.panelHeights.deckBuilder !== null ? "auto" : "visible",
        }}
      >
        <TriviaDeckBuilder deck={config.deck} onChange={(deck) => onChangeSettings({ deck })} />
      </div>
    </>
  );
}
