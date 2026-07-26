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
import { PanelHeightMap, ResizableLayout, ResizableRow, ResizableRows } from './ResizableLayout';
import { Card, ConfirmDialog } from '../ui';
import {
  DEFAULT_WORKSPACE_LAYOUT,
  MAX_PANEL_HEIGHT_PX,
  MAX_SPLIT_PERCENT,
  MIN_PANEL_HEIGHT_PX,
  MIN_SPLIT_PERCENT,
  WorkspaceLayout,
  WorkspacePanelHeights,
  clearWorkspaceLayout,
  cloneWorkspaceLayout,
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

/* A strip is capped so a long explanation or a wide working set can never starve
   the canvas it belongs to; past the cap the strip scrolls inside itself and the
   panel's outer size still does not move. */
const STRIP_MAX_HEIGHT = '38%';

interface PanelStripProps {
  region: string;
  /** The edge facing the canvas — that is where the divider belongs. */
  dividerEdge: 'top' | 'bottom';
  children: React.ReactNode;
}

/* Step context is part of the visualizer panel, not a card floating next to it:
   a --border-subtle divider plus a band fill is all that separates a strip from
   the canvas (DESIGN.md R5.2). The strip owns both, and its content renders
   border-free inside it, so the canvas edge is exactly one line.

   The band is the chrome tier, matching the playback strip docked below it: the
   working-data chips are --bg-elevated and would dissolve into an equally
   elevated band. */
const PanelStrip: React.FC<PanelStripProps> = ({ region, dividerEdge, children }) => (
  <div
    data-region={region}
    style={{
      flexShrink: 0,
      maxHeight: STRIP_MAX_HEIGHT,
      overflowY: 'auto',
      background: 'var(--bg-chrome)',
      borderTop: dividerEdge === 'top' ? '1px solid var(--border-subtle)' : undefined,
      borderBottom: dividerEdge === 'bottom' ? '1px solid var(--border-subtle)' : undefined,
    }}
  >
    {children}
  </div>
);

export interface MainLayoutProps {
  algorithm: AlgorithmDefinition;
  currentStep: AlgorithmStep | null;
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

  const [layout, setLayout] = React.useState<WorkspaceLayout>(() => readWorkspaceLayout());
  const [detailsExpanded, setDetailsExpanded] = React.useState<boolean>(true);
  const [resetDialogOpen, setResetDialogOpen] = React.useState<boolean>(false);

  /* Drag handlers fire from window listeners, so they read the newest layout
     from a ref rather than closing over a stale render's state. */
  const layoutRef = React.useRef<WorkspaceLayout>(layout);
  layoutRef.current = layout;

  const handleToggleDetails = React.useCallback(() => {
    setDetailsExpanded((prev) => !prev);
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
      applyPanelHeights({ visualizer: heights.visualizer ?? null }, commit);
    },
    [applyPanelHeights],
  );

  const applyRightHeights = React.useCallback(
    (heights: PanelHeightMap, commit: boolean) => {
      applyPanelHeights({ code: heights.code ?? null, complexity: heights.complexity ?? null }, commit);
    },
    [applyPanelHeights],
  );

  const handleResetLayout = React.useCallback(() => {
    setResetDialogOpen(true);
  }, []);

  const handleCancelReset = React.useCallback(() => {
    setResetDialogOpen(false);
  }, []);

  // The only path that is allowed to drop the persisted sizes.
  const handleConfirmReset = React.useCallback(() => {
    clearWorkspaceLayout();
    setLayout(cloneWorkspaceLayout(DEFAULT_WORKSPACE_LAYOUT));
    setResetDialogOpen(false);
  }, []);

  /* A strip is shown when its toggle is on AND the current step actually has
     something for it — an empty tutorial or working-data strip would be dead
     space inside the panel. Both child components return null when they have
     nothing, so the presence of the data object is not enough: ask their own
     predicates, which are the same ones they render by. */
  const showTutorial = panels.tutorial && hasTutorialContent(currentStep?.explanation);
  const showAuxiliary = panels.auxiliary && hasAuxiliaryContent(currentStep?.auxiliaryState);

  /* One container for the whole stage (DESIGN.md R5.2): working data pinned at
     the top, the canvas taking every remaining pixel, the tutorial above the
     docked playback strip. Nothing here changes the panel's outer size, so a step
     that adds an aux row or a longer sentence only moves the canvas boundary. */
  const stagePanel = (
    <Card
      data-panel="visualizer"
      padding="none"
      style={{
        flex: panels.visualizer ? 1 : '0 0 auto',
        minHeight: 0,
        overflow: 'hidden',
        // Near-black surfaces need a real edge or the panel dissolves (R5.1).
        borderColor: 'var(--border-default)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        {showAuxiliary && currentStep?.auxiliaryState && (
          <PanelStrip region="working-data" dividerEdge="bottom">
            <AuxiliaryPanel state={currentStep.auxiliaryState} onClose={onToggleAuxiliary} />
          </PanelStrip>
        )}

        {panels.visualizer && (
          <div
            data-region="canvas"
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto',
              padding: 'var(--space-3)',
            }}
          >
            {renderPrimaryVisualizer() || (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
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
        )}

        {showTutorial && currentStep?.explanation && (
          <PanelStrip region="tutorial" dividerEdge="top">
            <TutorialCard
              explanation={currentStep.explanation}
              what={currentStep.explanation.what}
              why={currentStep.explanation.why}
              stepIndex={currentStep.stepIndex}
              totalSteps={totalSteps}
              onClose={onToggleTutorial}
            />
          </PanelStrip>
        )}

        {/* The embedded ControlPanel brings its own --border-default top edge. */}
        {panels.visualizer && resolvedControlProps && (
          <div data-region="controls" style={{ flexShrink: 0 }}>
            <ControlPanel {...resolvedControlProps} variant="embedded" />
          </div>
        )}
      </div>
    </Card>
  );

  const leftRows: ResizableRow[] = [
    {
      id: 'visualizer',
      label: 'visualizer',
      content: stagePanel,
      /* The strips live inside this panel, so it also carries them when the
         canvas itself is toggled off — turning Tutorial on always shows the
         tutorial (R4.4), and the stage is never blank while a toggle is on. */
      visible: panels.visualizer || showTutorial || showAuxiliary,
      // Greedy while the canvas is there to absorb the leftover space; with the
      // canvas off the panel is just its strips and hugs them.
      greedy: panels.visualizer,
      height: layout.panelHeights.visualizer,
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
          timeComplexity={algorithm.timeComplexity}
          spaceComplexity={algorithm.spaceComplexity}
          topicGuide={algorithm.topicGuide}
          expanded={detailsExpanded}
          onToggleExpanded={handleToggleDetails}
          onResetLayout={handleResetLayout}
        />
      </div>

      <div data-stage="workspace" style={{ flexShrink: 0, height: STAGE_HEIGHT }}>
        {stageEmpty ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Card style={{ maxWidth: '42ch', textAlign: 'center' }}>
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

      {/* Playback lives at the visualizer's bottom edge; with the visualizer
          hidden it still has to be reachable, so it docks under the stage. */}
      {resolvedControlProps && !panels.visualizer && !stageEmpty && (
        <div style={{ flexShrink: 0 }}>
          <ControlPanel {...resolvedControlProps} variant="standalone" />
        </div>
      )}

      <ConfirmDialog
        isOpen={resetDialogOpen}
        title="Reset workspace layout?"
        message="Your custom panel sizes will be lost and every panel goes back to sizing itself to its content. This cannot be undone."
        confirmLabel="Reset layout"
        cancelLabel="Keep my layout"
        destructive
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />
    </main>
  );
};
