import React from "react";
import { AlgorithmDefinition, AlgorithmStep, PanelVisibility } from "../../../types/dsa";
import { AuxiliaryPanel, hasAuxiliaryContent } from "../../../ui";
import { TutorialCard, hasTutorialContent } from "../../../ui";
import { CodeBlockViewer } from "../../../ui";
import { ComplexityCard } from "../../../ui/organisms/ComplexityCard";
import { ControlPanel, ControlPanelProps } from "../../../ui";
import { DragHandle, ResizableLayout, ResizableRow, ResizableRows } from "../../../ui";
import { MainLayoutState } from "../hooks/useMainLayoutState";
import { PrimaryVisualizerCanvas } from "./PrimaryVisualizerCanvas";
import { MainLayoutEmptyStage } from "./MainLayoutEmptyStage";

const DEFAULT_STAGE_HEIGHT = "max(var(--stage-min-h), 50vh)";

export interface MainStageProps {
  algorithm: AlgorithmDefinition;
  currentStep?: AlgorithmStep | null;
  panels: PanelVisibility;
  resolvedControlProps: ControlPanelProps | null;
  layoutState: MainLayoutState;
  totalSteps?: number;
}

export const MainStage: React.FC<MainStageProps> = ({
  algorithm,
  currentStep,
  panels,
  resolvedControlProps,
  layoutState,
  totalSteps,
}) => {
  const showTutorial = panels.tutorial && hasTutorialContent(currentStep?.explanation);
  const showAuxiliary =
    panels.auxiliary && hasAuxiliaryContent(currentStep?.auxiliaryState, currentStep?.variables);

  const stagePinned = layoutState.stagePinned;
  const visualizerPinned = layoutState.layout.panelHeights.visualizer;

  const stageHeight =
    stagePinned !== null
      ? `${stagePinned}px`
      : visualizerPinned !== null
        ? `${visualizerPinned}px`
        : DEFAULT_STAGE_HEIGHT;

  const leftRows: ResizableRow[] = [
    {
      id: "tutorial",
      label: "tutorial",
      visible: showTutorial,
      greedy: !panels.visualizer && !showAuxiliary,
      height: layoutState.layout.panelHeights.tutorial,
      content:
        currentStep?.explanation !== undefined ? (
          <div className="h-full overflow-auto">
            <TutorialCard
              explanation={currentStep.explanation}
              what={currentStep.explanation.what}
              why={currentStep.explanation.why}
              stepIndex={currentStep.stepIndex}
              totalSteps={totalSteps}
            />
          </div>
        ) : null,
    },
    {
      id: "auxiliary",
      label: "working data & variables",
      visible: showAuxiliary,
      greedy: !panels.visualizer,
      height: layoutState.layout.panelHeights.auxiliary,
      content: (
        <div className="h-full overflow-auto">
          <AuxiliaryPanel state={currentStep?.auxiliaryState} variables={currentStep?.variables} />
        </div>
      ),
    },
    {
      id: "visualizer",
      label: "graph visualizer canvas",
      visible: panels.visualizer,
      greedy: true,
      height: layoutState.layout.panelHeights.visualizer,
      content: (
        <PrimaryVisualizerCanvas
          currentStep={currentStep}
          resolvedControlProps={resolvedControlProps}
        />
      ),
    },
  ];

  const rightRows: ResizableRow[] = [
    {
      id: "code",
      label: "code",
      visible: panels.code,
      greedy: !panels.complexity,
      height: layoutState.layout.panelHeights.code,
      content: (
        <div
          className="h-full w-full bg-[var(--bg-inset)]"
          style={{ background: "var(--bg-inset)" }}
        >
          <CodeBlockViewer
            code={algorithm.code}
            activeLine={currentStep?.codeLine || 1}
            variables={currentStep?.variables}
            lineExplanations={algorithm.trivia?.lineExplanations}
          />
        </div>
      ),
    },
    {
      id: "complexity",
      label: "complexity",
      visible: panels.complexity,
      greedy: !panels.code,
      height: layoutState.layout.panelHeights.complexity,
      content: (
        <ComplexityCard
          timeComplexity={algorithm.timeComplexity}
          spaceComplexity={algorithm.spaceComplexity}
          complexityAnalysis={algorithm.complexityAnalysis}
        />
      ),
    },
  ];

  const hasLeftRows = leftRows.some((row) => row.visible !== false);
  const hasRightRows = rightRows.some((row) => row.visible !== false);
  const stageEmpty = !hasLeftRows && !hasRightRows;

  const leftColumn = (
    <ResizableRows
      rows={leftRows}
      minRowHeight={layoutState.minPanelHeightPx}
      maxRowHeight={layoutState.maxPanelHeightPx}
      onHeightsChange={(heights) => layoutState.applyLeftHeights(heights, false)}
      onHeightsCommit={(heights) => layoutState.applyLeftHeights(heights, true)}
    />
  );

  const rightColumn = (
    <ResizableRows
      rows={rightRows}
      minRowHeight={layoutState.minPanelHeightPx}
      maxRowHeight={layoutState.maxPanelHeightPx}
      onHeightsChange={(heights) => layoutState.applyRightHeights(heights, false)}
      onHeightsCommit={(heights) => layoutState.applyRightHeights(heights, true)}
    />
  );

  return (
    <>
      <div
        ref={layoutState.stageRef}
        data-stage="workspace"
        className="flex flex-col overflow-hidden h-full shrink-0"
        style={{
          height: stageHeight,
        }}
      >
        {stageEmpty ? (
          <MainLayoutEmptyStage />
        ) : (
          <ResizableLayout
            leftPanel={leftColumn}
            rightPanel={rightColumn}
            splitPercent={layoutState.layout.splitPercent}
            defaultSplitPercent={layoutState.defaultSplitPercent}
            minLeftPercent={layoutState.minSplitPercent}
            maxLeftPercent={layoutState.maxSplitPercent}
            showLeft={hasLeftRows}
            showRight={hasRightRows}
            onSplitChange={layoutState.handleSplitChange}
            onSplitCommit={layoutState.handleSplitCommit}
          />
        )}
      </div>

      {!stageEmpty && (
        <DragHandle
          orientation="horizontal"
          label="Resize the stage height"
          valueNow={layoutState.stagePinned ?? 0}
          valueMin={layoutState.minPanelHeightPx}
          valueMax={layoutState.maxPanelHeightPx}
          valueText={
            layoutState.stagePinned === null ? "Automatic, sized to the viewport" : undefined
          }
          step={16}
          dragging={layoutState.stageDragging}
          onDragStart={() => layoutState.setStageDragging(true)}
          onNudge={layoutState.nudgeStage}
          onRestoreDefault={() => layoutState.applyPanelHeights({ stage: null }, true)}
        />
      )}

      {resolvedControlProps && !panels.visualizer && !stageEmpty && (
        <div className="shrink-0">
          <ControlPanel {...resolvedControlProps} variant="standalone" />
        </div>
      )}
    </>
  );
};
