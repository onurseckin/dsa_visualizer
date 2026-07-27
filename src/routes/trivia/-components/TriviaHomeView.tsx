import type { RefObject } from "react";
import {
  MAX_PANEL_HEIGHT_PX,
  MIN_PANEL_HEIGHT_PX,
  TriviaLayout,
} from "../../../trivia/triviaLayout";
import { DragHandle } from "../../../ui";
import { TriviaSessionsManager } from "../../../components/trivia/TriviaSessionsManager";
import { TriviaSessionRecord } from "../../../types/trivia";

interface TriviaHomeViewProps {
  sessions: TriviaSessionRecord[];
  layout: TriviaLayout;
  sessionListPanel: {
    ref: RefObject<HTMLDivElement | null>;
    dragging: boolean;
    setDragging: (dragging: boolean) => void;
    nudge: (delta: number) => void;
    restoreDefault: () => void;
  };
  onCreateNewSession: () => void;
  onResumeSession: (session: TriviaSessionRecord) => void;
  onRenameSession: (id: string, newName: string) => void;
  onDeleteSession: (id: string) => void;
}

export function TriviaHomeView({
  sessions,
  layout,
  sessionListPanel,
  onCreateNewSession,
  onResumeSession,
  onRenameSession,
  onDeleteSession,
}: TriviaHomeViewProps): React.ReactElement {
  return (
    <>
      <div
        ref={sessionListPanel.ref}
        className="shrink-0 min-h-0"
        style={{
          height:
            layout.panelHeights.sessionList !== null
              ? `${layout.panelHeights.sessionList}px`
              : undefined,
          overflow: layout.panelHeights.sessionList !== null ? "auto" : "visible",
        }}
      >
        <TriviaSessionsManager
          sessions={sessions}
          onCreateNewSession={onCreateNewSession}
          onResumeSession={onResumeSession}
          onRenameSession={onRenameSession}
          onDeleteSession={onDeleteSession}
        />
      </div>

      <DragHandle
        orientation="horizontal"
        label="Resize the trivia session list"
        valueNow={layout.panelHeights.sessionList ?? MIN_PANEL_HEIGHT_PX}
        valueMin={MIN_PANEL_HEIGHT_PX}
        valueMax={MAX_PANEL_HEIGHT_PX}
        valueText={
          layout.panelHeights.sessionList === null ? "Automatic, sized to content" : undefined
        }
        step={16}
        dragging={sessionListPanel.dragging}
        onDragStart={() => sessionListPanel.setDragging(true)}
        onNudge={sessionListPanel.nudge}
        onRestoreDefault={sessionListPanel.restoreDefault}
      />
    </>
  );
}
