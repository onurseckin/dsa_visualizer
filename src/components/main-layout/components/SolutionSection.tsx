import React from "react";
import { TopicGuide } from "../../../types/dsa";
import { SolutionApproachCard } from "../../../ui";
import { DragHandle } from "../../../ui";

interface SolutionSectionProps {
  topicGuide: TopicGuide;
  solutionExpanded: boolean;
  solutionPinned: number | null;
  solutionDragging: boolean;
  solutionRef: React.RefObject<HTMLDivElement | null>;
  onToggleSolutionExpanded: () => void;
  onSetSolutionDragging: (dragging: boolean) => void;
  onNudgeSolution: (delta: number) => void;
  onRestoreSolutionDefault: () => void;
  minPanelHeightPx: number;
  maxPanelHeightPx: number;
}

export const SolutionSection: React.FC<SolutionSectionProps> = ({
  topicGuide,
  solutionExpanded,
  solutionPinned,
  solutionDragging,
  solutionRef,
  onToggleSolutionExpanded,
  onSetSolutionDragging,
  onNudgeSolution,
  onRestoreSolutionDefault,
  minPanelHeightPx,
  maxPanelHeightPx,
}) => {
  return (
    <section aria-label="Solution approach and analysis" style={{ flexShrink: 0 }}>
      <div
        ref={solutionRef}
        data-height-mode={solutionPinned !== null ? "pinned" : "hug"}
        style={{
          height: solutionPinned !== null ? `${solutionPinned}px` : undefined,
          overflowY: solutionPinned !== null ? "auto" : undefined,
        }}
      >
        <SolutionApproachCard
          topicGuide={topicGuide}
          expanded={solutionExpanded}
          onToggleExpanded={onToggleSolutionExpanded}
        />
      </div>

      <DragHandle
        orientation="horizontal"
        label="Resize the solution approach height"
        valueNow={solutionPinned ?? 0}
        valueMin={minPanelHeightPx}
        valueMax={maxPanelHeightPx}
        valueText={solutionPinned === null ? "Automatic, sized to its content" : undefined}
        step={16}
        dragging={solutionDragging}
        onDragStart={() => onSetSolutionDragging(true)}
        onNudge={onNudgeSolution}
        onRestoreDefault={onRestoreSolutionDefault}
      />
    </section>
  );
};
