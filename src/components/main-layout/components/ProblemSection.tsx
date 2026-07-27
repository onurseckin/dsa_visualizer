import React from "react";
import { AlgorithmDefinition } from "../../../types/dsa";
import { ProblemDescriptionCard } from "../../../ui";
import { DragHandle } from "../../../ui";

interface ProblemSectionProps {
  algorithm: AlgorithmDefinition;
  problemExpanded: boolean;
  problemPinned: number | null;
  problemDragging: boolean;
  problemRef: React.RefObject<HTMLDivElement | null>;
  onToggleProblemExpanded: () => void;
  onSetProblemDragging: (dragging: boolean) => void;
  onNudgeProblem: (delta: number) => void;
  onRestoreProblemDefault: () => void;
  minPanelHeightPx: number;
  maxPanelHeightPx: number;
}

export const ProblemSection: React.FC<ProblemSectionProps> = ({
  algorithm,
  problemExpanded,
  problemPinned,
  problemDragging,
  problemRef,
  onToggleProblemExpanded,
  onSetProblemDragging,
  onNudgeProblem,
  onRestoreProblemDefault,
  minPanelHeightPx,
  maxPanelHeightPx,
}) => {
  return (
    <section aria-label="Problem description and details" className="flex flex-col shrink-0">
      <div
        ref={problemRef}
        data-height-mode={problemPinned !== null ? "pinned" : "hug"}
        style={{
          flexShrink: 0,
          height: problemPinned !== null ? `${problemPinned}px` : undefined,
          overflowY: problemPinned !== null ? "auto" : undefined,
        }}
      >
        <ProblemDescriptionCard
          title={algorithm.title}
          category={algorithm.category}
          difficulty={algorithm.difficulty}
          description={algorithm.description}
          constraints={algorithm.constraints}
          examples={algorithm.examples}
          expanded={problemExpanded}
          onToggleExpanded={onToggleProblemExpanded}
        />
      </div>

      <DragHandle
        orientation="horizontal"
        label="Resize the problem description height"
        valueNow={problemPinned ?? 0}
        valueMin={minPanelHeightPx}
        valueMax={maxPanelHeightPx}
        valueText={problemPinned === null ? "Automatic, sized to its content" : undefined}
        step={16}
        dragging={problemDragging}
        onDragStart={() => onSetProblemDragging(true)}
        onNudge={onNudgeProblem}
        onRestoreDefault={onRestoreProblemDefault}
      />
    </section>
  );
};
