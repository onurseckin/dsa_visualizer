import React from 'react';
import { AlgorithmDefinition, AlgorithmStep, PanelVisibility } from '../types/dsa';
import { ArrayVisualizer } from './primitives/ArrayVisualizer';
import { GridVisualizer } from './primitives/GridVisualizer';
import { GraphVisualizer } from './primitives/GraphVisualizer';
import { TreeVisualizer } from './primitives/TreeVisualizer';
import { AuxiliaryPanel, hasAuxiliaryContent } from './primitives/AuxiliaryPanel';
import { TutorialCard, hasTutorialContent } from './primitives/TutorialCard';
import { CodeBlockViewer } from './primitives/CodeBlockViewer';
import { ProblemHeader } from './primitives/ProblemHeader';
import { ComplexityCard } from './ComplexityCard';
import { ControlPanel, ControlPanelProps } from './ControlPanel';
import {
  DragHandle,
  PanelHeightMap,
  ResizableLayout,
  ResizableRow,
  ResizableRows,
  usePointerDrag,
} from './ResizableLayout';
import { Card } from '../ui';
import {
  DEFAULT_WORKSPACE_LAYOUT,
  MAX_PANEL_HEIGHT_PX,
  MAX_SPLIT_PERCENT,
  MIN_PANEL_HEIGHT_PX,
  MIN_SPLIT_PERCENT,
  WORKSPACE_LAYOUT_RESET_EVENT,
  WorkspaceLayout,
  WorkspacePanelHeights,
  readWorkspaceLayout,
  writeWorkspaceLayout,
} from '../app/workspaceLayout';

/* Smart viewport sizing (DESIGN.md R3.2). The stage takes the viewport minus the
   app chrome it sits under — navbar, the collapsed problem strip, main's vertical
   padding and the header/stage gap — but never goes below --stage-min-h. On a tall
   monitor the subtraction wins and everything fits with no scrolling; on a short
   one the floor wins and the page scrolls. Expanding details adds content above
   the stage and lets the page scroll rather than squeezing the panels, so the
   subtraction always uses the collapsed strip height. */

/* The collapsed strip is one sm control row inside a Card: its tallest child is a
   sm button, wrapped in the card body's --space-2 padding and the card's own 1px
   top and bottom borders. The borders have to be counted — undercounting by even
   2px puts a scrollbar on a viewport that would otherwise fit exactly. */
const HEADER_STRIP_H = 'var(--control-h-sm) + var(--space-2) * 2 + 2px';
/* main's top and bottom padding plus the header-to-stage gap, all --space-3. */
const STAGE_CHROME = `var(--navbar-h) + (${HEADER_STRIP_H}) + var(--space-3) * 3`;
const STAGE_HEIGHT = `max(var(--stage-min-h), calc(100dvh - (${STAGE_CHROME})))`;

export interface MainLayoutProps {
  algorithm: AlgorithmDefinition;
  currentStep?: AlgorithmStep | null;
  /** Independent on/off per workspace panel (DESIGN.md R4.4) — no view modes. */
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
  const primarySnapshot = currentStep?.primarySnapshot;

  const resolvedControlProps: ControlPanelProps | null = controlProps || (
    isPlaying !== undefined && onPlayPause && onStepBack && onStepForward && onReset
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
      : null
  );

  const renderPrimaryVisualizer = () => {
    if (!primarySnapshot) return null;

    switch (primarySnapshot.kind) {
      case 'array':
        return <ArrayVisualizer elements={primarySnapshot.elements} />;
      case 'grid':
        return <GridVisualizer grid={primarySnapshot.grid} />;
      case 'graph':
        return <GraphVisualizer nodes={primarySnapshot.nodes} edges={primarySnapshot.edges} />;
      case 'tree':
        return <TreeVisualizer nodes={primarySnapshot.nodes} rootId={primarySnapshot.rootId} />;
      default:
        return null;
    }
  };

  /* Every manual adjustment — the column split, each pinned height and whether
     the details panel is open — lives in this one persisted record (R6.5). */
  const [layout, setLayout] = React.useState<WorkspaceLayout>(() => readWorkspaceLayout());
  const detailsExpanded = layout.detailsExpanded;

  /* Drag handlers fire from window listeners, so they read the newest layout
     from a ref rather than closing over a stale render's state. */
  const layoutRef = React.useRef<WorkspaceLayout>(layout);
  layoutRef.current = layout;

  /* Reset is a navbar action on state this component owns, so the navbar clears
     storage and announces it; re-reading is how the reset takes effect live
     instead of only after a reload. */
  React.useEffect(() => {
    const reload = () => setLayout(readWorkspaceLayout());
    window.addEventListener(WORKSPACE_LAYOUT_RESET_EVENT, reload);
    return () => window.removeEventListener(WORKSPACE_LAYOUT_RESET_EVENT, reload);
  }, []);

  const handleToggleDetails = React.useCallback(() => {
    setLayout(writeWorkspaceLayout({ detailsExpanded: !layoutRef.current.detailsExpanded }));
  }, []);

  const handleSplitChange = React.useCallback((percent: number) => {
    setLayout((prev) => ({ ...prev, splitPercent: percent }));
  }, []);

  const handleSplitCommit = React.useCallback((percent: number) => {
    setLayout(
      writeWorkspaceLayout({
        splitPercent: percent,
        panelHeights: layoutRef.current.panelHeights,
      }),
    );
  }, []);

  const applyPanelHeights = React.useCallback(
    (patch: Partial<WorkspacePanelHeights>, commit: boolean) => {
      if (!commit) {
        setLayout((prev) => ({ ...prev, panelHeights: { ...prev.panelHeights, ...patch } }));
        return;
      }
      setLayout(
        writeWorkspaceLayout({
          splitPercent: layoutRef.current.splitPercent,
          panelHeights: { ...layoutRef.current.panelHeights, ...patch },
        }),
      );
    },
    [],
  );

  const applyLeftHeights = React.useCallback(
    (heights: PanelHeightMap, commit: boolean) => {
      applyPanelHeights(
        {
          tutorial: heights.tutorial ?? null,
          auxiliary: heights.auxiliary ?? null,
          visualizer: heights.visualizer ?? null,
        },
        commit,
      );
    },
    [applyPanelHeights],
  );

  const applyRightHeights = React.useCallback(
    (heights: PanelHeightMap, commit: boolean) => {
      applyPanelHeights({ code: heights.code ?? null, complexity: heights.complexity ?? null }, commit);
    },
    [applyPanelHeights],
  );

  /* Stage height: pinned by its own handle, otherwise the viewport calculation.
     The drag measures against the stage's own top edge so the pointer stays on
     the handle rather than drifting as the element grows. */
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const [stageDragging, setStageDragging] = React.useState(false);
  const stagePinned = layout.panelHeights.stage;

  const nudgeStage = React.useCallback(
    (delta: number) => {
      const current =
        layoutRef.current.panelHeights.stage ?? stageRef.current?.getBoundingClientRect().height ?? 0;
      applyPanelHeights({ stage: current + delta }, true);
    },
    [applyPanelHeights],
  );

  const dragStageTo = React.useCallback(
    (_x: number, y: number) => {
      const top = stageRef.current?.getBoundingClientRect().top;
      if (top === undefined) return;
      applyPanelHeights({ stage: y - top }, false);
    },
    [applyPanelHeights],
  );

  const endStageDrag = React.useCallback(() => {
    setStageDragging(false);
    applyPanelHeights({ stage: layoutRef.current.panelHeights.stage }, true);
  }, [applyPanelHeights]);

  usePointerDrag(stageDragging, dragStageTo, endStageDrag);

  const showTutorial = panels.tutorial && hasTutorialContent(currentStep?.explanation);
  const showAuxiliary =
    panels.auxiliary &&
    hasAuxiliaryContent(currentStep?.auxiliaryState, currentStep?.variables);

  const leftRows: ResizableRow[] = [
    {
      id: 'tutorial',
      label: 'tutorial',
      visible: showTutorial,
      greedy: !panels.visualizer && !showAuxiliary,
      height: layout.panelHeights.tutorial,
      content:
        currentStep?.explanation !== undefined ? (
          <Card
            padding="sm"
            style={{
              height: '100%',
              borderColor: 'var(--border-default)',
              overflow: 'auto',
            }}
          >
            <TutorialCard
              explanation={currentStep.explanation}
              what={currentStep.explanation.what}
              why={currentStep.explanation.why}
              stepIndex={currentStep.stepIndex}
              totalSteps={totalSteps}
              onClose={onToggleTutorial}
            />
          </Card>
        ) : null,
    },
    {
      id: 'auxiliary',
      label: 'working data & variables',
      visible: showAuxiliary,
      greedy: !panels.visualizer,
      height: layout.panelHeights.auxiliary,
      content: (
        <Card
          padding="sm"
          style={{
            height: '100%',
            borderColor: 'var(--border-default)',
            overflow: 'auto',
          }}
        >
          <AuxiliaryPanel
            state={currentStep?.auxiliaryState}
            variables={currentStep?.variables}
            onClose={onToggleAuxiliary}
          />
        </Card>
      ),
    },
    {
      id: 'visualizer',
      label: 'graph visualizer canvas',
      visible: panels.visualizer,
      greedy: true,
      height: layout.panelHeights.visualizer,
      content: (
        <Card
          data-panel="visualizer"
          padding="none"
          style={{
            height: '100%',
            borderColor: 'var(--border-default)',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <div
              data-region="canvas"
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflowX: 'auto',
                overflowY: 'hidden',
                padding: 'var(--space-2)',
                background: 'var(--bg-inset)',
              }}
            >
              {renderPrimaryVisualizer() || (
                <div
                  style={{
                    margin: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: 'var(--space-6)',
                  }}
                >
                  <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    No visual snapshot available
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    Select an algorithm step or click Play to begin visualization.
                  </p>
                </div>
              )}
            </div>

            {resolvedControlProps && (
              <div data-region="controls" style={{ flexShrink: 0 }}>
                <ControlPanel {...resolvedControlProps} variant="embedded" />
              </div>
            )}
          </div>
        </Card>
      ),
    },
  ];

  /* The complexity card is the code column's companion, so it follows the code
     toggle — there is no separate navbar switch for it.

     Neither row is greedy (DESIGN.md R5.4): the code panel is exactly as tall as
     the solution, so nothing trails it and the complexity card is pulled up
     right underneath. When the two together outgrow the column, the column
     scrolls — the panels themselves do not. */
  const rightRows: ResizableRow[] = [
    {
      id: 'code',
      label: 'code',
      visible: panels.code,
      height: layout.panelHeights.code,
      content: (
        <CodeBlockViewer
          code={algorithm.code}
          activeLine={currentStep?.codeLine || 1}
          variables={currentStep?.variables}
          lineExplanations={algorithm.trivia?.lineExplanations}
        />
      ),
    },
    {
      id: 'complexity',
      label: 'complexity',
      visible: panels.code,
      height: layout.panelHeights.complexity,
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

  /* The left column is a single row now (R5.2), so it renders no row handle — a
     stored visualizer pin is still honoured on read, but only the column split
     changes this column's geometry interactively. */
  const leftColumn = (
    <ResizableRows
      rows={leftRows}
      minRowHeight={MIN_PANEL_HEIGHT_PX}
      maxRowHeight={MAX_PANEL_HEIGHT_PX}
      onHeightsChange={(heights) => applyLeftHeights(heights, false)}
      onHeightsCommit={(heights) => applyLeftHeights(heights, true)}
    />
  );

  const rightColumn = (
    <ResizableRows
      rows={rightRows}
      minRowHeight={MIN_PANEL_HEIGHT_PX}
      maxRowHeight={MAX_PANEL_HEIGHT_PX}
      onHeightsChange={(heights) => applyRightHeights(heights, false)}
      onHeightsCommit={(heights) => applyRightHeights(heights, true)}
    />
  );

  return (
    <main
      data-details-expanded={detailsExpanded ? 'true' : 'false'}
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        boxSizing: 'border-box',
        // Page scrolling is never blocked, whatever the details panel is doing.
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <ProblemHeader
          title={algorithm.title}
          category={algorithm.category}
          difficulty={algorithm.difficulty}
          description={algorithm.description}
          constraints={algorithm.constraints}
          examples={algorithm.examples}
          topicGuide={algorithm.topicGuide}
          expanded={detailsExpanded}
          onToggleExpanded={handleToggleDetails}
        />
      </div>

      <div
        ref={stageRef}
        data-stage="workspace"
        style={{
          flexShrink: 0,
          /* A pinned stage wins over the viewport calculation: the graph area is a
             section like any other and owns a height handle (R7.4). */
          height: stagePinned !== null ? `${stagePinned}px` : STAGE_HEIGHT,
        }}
      >
        {stageEmpty ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Card
              style={{
                maxWidth: '42ch',
                textAlign: 'center',
                borderColor: 'var(--border-default)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Every panel is hidden
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Turn on Visualizer, Code, Tutorial or Aux data in the navbar to bring the workspace
                back.
              </p>
            </Card>
          </div>
        ) : (
          <ResizableLayout
            leftPanel={leftColumn}
            rightPanel={rightColumn}
            splitPercent={layout.splitPercent}
            defaultSplitPercent={DEFAULT_WORKSPACE_LAYOUT.splitPercent}
            minLeftPercent={MIN_SPLIT_PERCENT}
            maxLeftPercent={MAX_SPLIT_PERCENT}
            showLeft={hasLeftRows}
            showRight={hasRightRows}
            onSplitChange={handleSplitChange}
            onSplitCommit={handleSplitCommit}
          />
        )}
      </div>

      {/* The stage is a single row, so ResizableRows renders no separator for it.
          This standalone handle pins the stage height directly, which is how the
          graph area gets a height control and not only a width one (R7.4).
          Double-click restores the viewport-derived automatic height. */}
      {!stageEmpty && (
        <DragHandle
          orientation="horizontal"
          label="Resize the stage height"
          valueNow={stagePinned ?? 0}
          valueMin={MIN_PANEL_HEIGHT_PX}
          valueMax={MAX_PANEL_HEIGHT_PX}
          valueText={stagePinned === null ? 'Automatic, sized to the viewport' : undefined}
          step={16}
          dragging={stageDragging}
          onDragStart={() => setStageDragging(true)}
          onNudge={nudgeStage}
          onRestoreDefault={() => applyPanelHeights({ stage: null }, true)}
        />
      )}

      {/* Playback lives at the visualizer's bottom edge; with the visualizer
          hidden it still has to be reachable, so it docks under the stage. */}
      {resolvedControlProps && !panels.visualizer && !stageEmpty && (
        <div style={{ flexShrink: 0 }}>
          <ControlPanel {...resolvedControlProps} variant="standalone" />
        </div>
      )}
    </main>
  );
};
