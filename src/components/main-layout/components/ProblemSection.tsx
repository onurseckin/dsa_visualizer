import React from "react";
import { AlgorithmDefinition, ProblemExample } from "../../../types/dsa";
import { ProblemDescriptionCard, ProblemExamplesCard, DragHandle } from "../../../ui";

export interface ProblemSectionProps {
  algorithm: AlgorithmDefinition;
  selectedExampleId?: string;
  onSelectExample?: (example: ProblemExample, index: number) => void;
  showProblem?: boolean;
  showExamples?: boolean;
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
  selectedExampleId,
  onSelectExample,
  showProblem = true,
  showExamples = true,
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
  if (!problemExpanded) {
    return null;
  }

  const renderProblem = showProblem;
  const renderExamples = showExamples && Boolean(algorithm.examples && algorithm.examples.length > 0);

  if (!renderProblem && !renderExamples) {
    return null;
  }

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
        {renderProblem && (
          <ProblemDescriptionCard
            title={algorithm.title}
            category={algorithm.category}
            difficulty={algorithm.difficulty}
            description={algorithm.description}
            constraints={algorithm.constraints}
            sources={algorithm.sources}
            leetcode={algorithm.leetcode}
            expanded={problemExpanded}
            onToggleExpanded={onToggleProblemExpanded}
            showHeader={false}
          />
        )}
        {renderExamples && (
          <ProblemExamplesCard
            examples={algorithm.examples}
            selectedExampleId={selectedExampleId}
            onSelectExample={onSelectExample}
          />
        )}
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
