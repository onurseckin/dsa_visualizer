import React from 'react';
import { AlgorithmDefinition, AlgorithmStep, ViewMode } from '../types/dsa';
import { ArrayVisualizer } from './primitives/ArrayVisualizer';
import { GridVisualizer } from './primitives/GridVisualizer';
import { GraphVisualizer } from './primitives/GraphVisualizer';
import { TreeVisualizer } from './primitives/TreeVisualizer';
import { AuxiliaryPanel } from './primitives/AuxiliaryPanel';
import { TutorialCard } from './primitives/TutorialCard';
import { CodeBlockViewer } from './primitives/CodeBlockViewer';
import { ProblemHeader } from './primitives/ProblemHeader';
import { ComplexityCard } from './ComplexityCard';
import { ControlPanel, ControlPanelProps } from './ControlPanel';
import { ResizableLayout, ResizableRow, ResizableRows } from './ResizableLayout';
import { Card, ConfirmDialog } from '../ui';
import {
  DEFAULT_WORKSPACE_LAYOUT,
  MAX_SPLIT_PERCENT,
  MIN_ROW_WEIGHT,
  MIN_SPLIT_PERCENT,
  WorkspaceLayout,
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

export interface MainLayoutProps {
  algorithm: AlgorithmDefinition;
  currentStep: AlgorithmStep | null;
  viewMode: ViewMode;
  showTutorial: boolean;
  showAuxiliary: boolean;
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
  viewMode,
  showTutorial,
  showAuxiliary,
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
        leftRows: layoutRef.current.leftRows,
        rightRows: layoutRef.current.rightRows,
      }),
    );
  }, []);

  const applyLeftRows = React.useCallback((weights: Record<string, number>, commit: boolean) => {
    const leftRows = {
      visualizer: weights.visualizer,
      tutorial: weights.tutorial,
      auxiliary: weights.auxiliary,
    };
    if (!commit) {
      setLayout((prev) => ({ ...prev, leftRows }));
      return;
    }
    setLayout(
      writeWorkspaceLayout({
        splitPercent: layoutRef.current.splitPercent,
        leftRows,
        rightRows: layoutRef.current.rightRows,
      }),
    );
  }, []);

  const applyRightRows = React.useCallback((weights: Record<string, number>, commit: boolean) => {
    const rightRows = { code: weights.code, complexity: weights.complexity };
    if (!commit) {
      setLayout((prev) => ({ ...prev, rightRows }));
      return;
    }
    setLayout(
      writeWorkspaceLayout({
        splitPercent: layoutRef.current.splitPercent,
        leftRows: layoutRef.current.leftRows,
        rightRows,
      }),
    );
  }, []);

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

  const visualizerPanel = (
    // Hero visualizer panel: canvas centers, ControlPanel docks at the bottom edge
    <Card padding="none" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <div
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

        {resolvedControlProps && (
          <div style={{ flexShrink: 0 }}>
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
      content: visualizerPanel,
      weight: layout.leftRows.visualizer,
      defaultWeight: DEFAULT_WORKSPACE_LAYOUT.leftRows.visualizer,
    },
    {
      id: 'tutorial',
      label: 'tutorial',
      visible: showTutorial && Boolean(currentStep?.explanation),
      scroll: true,
      weight: layout.leftRows.tutorial,
      defaultWeight: DEFAULT_WORKSPACE_LAYOUT.leftRows.tutorial,
      content: currentStep?.explanation ? (
        <TutorialCard
          explanation={currentStep.explanation}
          what={currentStep.explanation.what}
          why={currentStep.explanation.why}
          stepIndex={currentStep.stepIndex}
          totalSteps={totalSteps}
          codeLine={currentStep.codeLine}
          onClose={onToggleTutorial}
        />
      ) : null,
    },
    {
      id: 'auxiliary',
      label: 'auxiliary data',
      visible: showAuxiliary && Boolean(currentStep?.auxiliaryState),
      scroll: true,
      weight: layout.leftRows.auxiliary,
      defaultWeight: DEFAULT_WORKSPACE_LAYOUT.leftRows.auxiliary,
      content: currentStep?.auxiliaryState ? (
        <AuxiliaryPanel state={currentStep.auxiliaryState} onClose={onToggleAuxiliary} />
      ) : null,
    },
  ];

  const rightRows: ResizableRow[] = [
    {
      id: 'code',
      label: 'code',
      weight: layout.rightRows.code,
      defaultWeight: DEFAULT_WORKSPACE_LAYOUT.rightRows.code,
      // CodeBlockViewer owns its internal scroll; the row only constrains height.
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
      scroll: true,
      weight: layout.rightRows.complexity,
      defaultWeight: DEFAULT_WORKSPACE_LAYOUT.rightRows.complexity,
      content: (
        <ComplexityCard
          timeComplexity={algorithm.timeComplexity}
          spaceComplexity={algorithm.spaceComplexity}
          complexityAnalysis={algorithm.complexityAnalysis}
        />
      ),
    },
  ];

  const leftColumn = (
    <ResizableRows
      rows={leftRows}
      minRowWeight={MIN_ROW_WEIGHT}
      onWeightsChange={(weights) => applyLeftRows(weights, false)}
      onWeightsCommit={(weights) => applyLeftRows(weights, true)}
    />
  );

  const rightColumn = (
    <ResizableRows
      rows={rightRows}
      minRowWeight={MIN_ROW_WEIGHT}
      onWeightsChange={(weights) => applyRightRows(weights, false)}
      onWeightsCommit={(weights) => applyRightRows(weights, true)}
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
        <ResizableLayout
          leftPanel={leftColumn}
          rightPanel={rightColumn}
          splitPercent={layout.splitPercent}
          defaultSplitPercent={DEFAULT_WORKSPACE_LAYOUT.splitPercent}
          minLeftPercent={MIN_SPLIT_PERCENT}
          maxLeftPercent={MAX_SPLIT_PERCENT}
          showLeft={viewMode !== 'code'}
          showRight={viewMode !== 'visual'}
          onSplitChange={handleSplitChange}
          onSplitCommit={handleSplitCommit}
        />
      </div>

      <ConfirmDialog
        isOpen={resetDialogOpen}
        title="Reset workspace layout?"
        message="Your custom panel sizes will be lost and every section goes back to its default size. This cannot be undone."
        confirmLabel="Reset layout"
        cancelLabel="Keep my layout"
        destructive
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />
    </main>
  );
};
