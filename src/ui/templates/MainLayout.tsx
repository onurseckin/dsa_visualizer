import React from "react";
import { AlgorithmDefinition, AlgorithmStep, PanelVisibility } from "../../types/dsa";
import { ControlPanelProps } from "../organisms/ControlPanel";
import { useMainLayoutState } from "../../components/main-layout/hooks/useMainLayoutState";
import { ProblemSection } from "../../components/main-layout/components/ProblemSection";
import { SolutionSection } from "../../components/main-layout/components/SolutionSection";
import { MainStage } from "../../components/main-layout/components/MainStage";

export interface MainLayoutProps {
  algorithm: AlgorithmDefinition;
  currentStep?: AlgorithmStep | null;
  panels: PanelVisibility;
  onToggleTutorial: () => void;
  onToggleAuxiliary: () => void;
  controlProps?: ControlPanelProps;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onStepBack?: () => void;
  onStepForward?: () => void;
  onReset?: () => void;
  currentStepIndex?: number;
  totalSteps?: number;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  dataSize?: number;
  onDataSizeChange?: (size: number) => void;
  onGenerateRandom?: () => void;
  supportsCustomSize?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  algorithm,
  currentStep,
  panels,
  onToggleTutorial,
  onToggleAuxiliary,
  controlProps,
  isPlaying,
  onPlayPause,
  onStepBack,
  onStepForward,
  onReset,
  currentStepIndex,
  totalSteps,
  speed,
  onSpeedChange,
  dataSize,
  onDataSizeChange,
  onGenerateRandom,
  supportsCustomSize,
}) => {
  const layoutState = useMainLayoutState();

  const resolvedControlProps: ControlPanelProps | null =
    controlProps ||
    (isPlaying !== undefined && onPlayPause && onStepBack && onStepForward && onReset
      ? {
          isPlaying,
          onPlayPause,
          onStepBack,
          onStepForward,
          onReset,
          currentStep: currentStepIndex ?? currentStep?.stepIndex ?? 0,
          totalSteps: totalSteps ?? 0,
          speed: speed ?? 300,
          onSpeedChange: onSpeedChange || (() => {}),
          dataSize: dataSize ?? 10,
          onDataSizeChange: onDataSizeChange || (() => {}),
          onGenerateRandom: onGenerateRandom || (() => {}),
          supportsCustomSize: supportsCustomSize ?? false,
        }
      : null);

  return (
    <main
      data-problem-expanded={layoutState.problemExpanded ? "true" : "false"}
      data-solution-expanded={layoutState.solutionExpanded ? "true" : "false"}
      className="w-full max-w-full p-0 flex-1 flex flex-col gap-4 min-h-0 box-border overflow-y-auto overflow-x-hidden bg-[var(--bg-surface)]"
      style={{ display: "flex", overflowY: "auto" }}
    >
      {panels.problem && (
        <ProblemSection
          algorithm={algorithm}
          problemExpanded={layoutState.problemExpanded}
          problemPinned={layoutState.problemPinned}
          problemDragging={layoutState.problemDragging}
          problemRef={layoutState.problemRef}
          onToggleProblemExpanded={layoutState.handleToggleProblemExpanded}
          onSetProblemDragging={layoutState.setProblemDragging}
          onNudgeProblem={layoutState.nudgeProblem}
          onRestoreProblemDefault={() => layoutState.applyPanelHeights({ problem: null }, true)}
          minPanelHeightPx={layoutState.minPanelHeightPx}
          maxPanelHeightPx={layoutState.maxPanelHeightPx}
        />
      )}

      <MainStage
        algorithm={algorithm}
        currentStep={currentStep}
        panels={panels}
        onToggleTutorial={onToggleTutorial}
        onToggleAuxiliary={onToggleAuxiliary}
        resolvedControlProps={resolvedControlProps}
        layoutState={layoutState}
        totalSteps={totalSteps}
      />

      {panels.solution && (
        <SolutionSection
          topicGuide={algorithm.topicGuide}
          solutionExpanded={layoutState.solutionExpanded}
          solutionPinned={layoutState.solutionPinned}
          solutionDragging={layoutState.solutionDragging}
          solutionRef={layoutState.solutionRef}
          onToggleSolutionExpanded={layoutState.handleToggleSolutionExpanded}
          onSetSolutionDragging={layoutState.setSolutionDragging}
          onNudgeSolution={layoutState.nudgeSolution}
          onRestoreSolutionDefault={() => layoutState.applyPanelHeights({ solution: null }, true)}
          minPanelHeightPx={layoutState.minPanelHeightPx}
          maxPanelHeightPx={layoutState.maxPanelHeightPx}
        />
      )}
    </main>
  );
};
