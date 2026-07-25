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
import { ResizableLayout, LAYOUT_SPLIT_STORAGE_KEY } from './ResizableLayout';
import { Card } from '../ui';

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

  const [resetLayoutKey, setResetLayoutKey] = React.useState<number>(0);

  const handleResetLayout = React.useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(LAYOUT_SPLIT_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
    setResetLayoutKey((prev) => prev + 1);
  }, []);

  const leftColumnContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        minHeight: 0,
        height: '100%',
      }}
    >
      {/* Hero visualizer panel: canvas centers, ControlPanel docks at the bottom edge */}
      <Card padding="none" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
          }}
        >
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

      {/* Compact teacher explanation for the current step */}
      {showTutorial && currentStep?.explanation && (
        <div style={{ flexShrink: 0 }}>
          <TutorialCard
            explanation={currentStep.explanation}
            what={currentStep.explanation.what}
            why={currentStep.explanation.why}
            stepIndex={currentStep.stepIndex}
            totalSteps={totalSteps}
            codeLine={currentStep.codeLine}
            onClose={onToggleTutorial}
          />
        </div>
      )}

      {/* Auxiliary side data structures (queue, call stack, visited set, hash map) */}
      {showAuxiliary && currentStep?.auxiliaryState && (
        <div style={{ flexShrink: 0 }}>
          <AuxiliaryPanel state={currentStep.auxiliaryState} onClose={onToggleAuxiliary} />
        </div>
      )}
    </div>
  );

  const rightColumnContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        minHeight: 0,
        height: '100%',
      }}
    >
      {/* Code viewer owns its internal scroll; this wrapper only constrains height */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <CodeBlockViewer
          code={algorithm.code}
          activeLine={currentStep?.codeLine || 1}
          variables={currentStep?.variables}
        />
      </div>

      <div style={{ flexShrink: 0 }}>
        <ComplexityCard
          timeComplexity={algorithm.timeComplexity}
          spaceComplexity={algorithm.spaceComplexity}
          complexityAnalysis={algorithm.complexityAnalysis}
        />
      </div>
    </div>
  );

  return (
    <main
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Compact problem strip (expand/collapse handled inside ProblemHeader) */}
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
          onResetLayout={handleResetLayout}
        />
      </div>

      {/* Stage row takes the remaining viewport space; panels scroll internally */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {viewMode === 'split' && (
          <ResizableLayout
            leftPanel={leftColumnContent}
            rightPanel={rightColumnContent}
            initialSplitRatio={60}
            minLeftPercent={30}
            maxLeftPercent={80}
            resetKey={resetLayoutKey}
          />
        )}
        {viewMode === 'visual' && (
          <div style={{ width: '100%', height: '100%', minHeight: 0 }}>
            {leftColumnContent}
          </div>
        )}
        {viewMode === 'code' && (
          <div style={{ width: '100%', height: '100%', minHeight: 0 }}>
            {rightColumnContent}
          </div>
        )}
      </div>
    </main>
  );
};
