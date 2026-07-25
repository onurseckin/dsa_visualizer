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
import { ResizableLayout } from './ResizableLayout';

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

  const leftColumnContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Primary Visualizer Canvas Card (HERO Focus - Fits Viewport Height) */}
      <div
        className="glass-card visualizer-hero-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          flex: 1,
          minHeight: '260px',
          overflow: 'hidden',
          border: '1px solid var(--border-muted)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Integrated Tutorial Explanation Banner */}
        {showTutorial && currentStep?.explanation && (
          <div
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
            }}
          >
            <TutorialCard
              what={currentStep.explanation.what}
              why={currentStep.explanation.why}
              stepIndex={currentStep.stepIndex}
              codeLine={currentStep.codeLine}
              onClose={onToggleTutorial}
              variant="banner"
            />
          </div>
        )}

        {/* Canvas Center Stage Render Area (Fills Available Height) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            width: '100%',
            height: '100%',
            overflow: 'auto',
          }}
        >
          {renderPrimaryVisualizer() || (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '1.5rem',
              }}
            >
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                No visual snapshot available
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                Select an algorithm step or click Play to begin visualization.
              </p>
            </div>
          )}
        </div>

        {/* Integrated Control Panel Toolbar Attached Directly to Bottom of Canvas */}
        {resolvedControlProps && (
          <div style={{ flexShrink: 0 }}>
            <ControlPanel {...resolvedControlProps} variant="embedded" />
          </div>
        )}
      </div>

      {/* Auxiliary Side Data Structures (Queue, Call Stack, Visited Set, Hash Map) */}
      {showAuxiliary && currentStep?.auxiliaryState && (
        <div style={{ flexShrink: 0, maxHeight: '220px', overflow: 'auto' }}>
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
        gap: '0.75rem',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, minHeight: '200px', overflow: 'auto' }}>
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
          variableState={currentStep?.variables}
        />
      </div>
    </div>
  );

  return (
    <main
      style={{
        padding: '0.75rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        height: 'calc(100vh - 68px)',
        maxHeight: 'calc(100dvh - 68px)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Problem Specification Compact Header Card */}
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
        />
      </div>

      {/* Resizable Layout Stage (Zero Page Scroll) */}
      <div style={{ flex: 1, height: '100%', minHeight: 0, overflow: 'hidden' }}>
        {viewMode === 'split' && (
          <ResizableLayout
            leftPanel={leftColumnContent}
            rightPanel={rightColumnContent}
            initialSplitRatio={60}
            minLeftPercent={30}
            maxLeftPercent={80}
          />
        )}
        {viewMode === 'visual' && (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            {leftColumnContent}
          </div>
        )}
        {viewMode === 'code' && (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            {rightColumnContent}
          </div>
        )}
      </div>
    </main>
  );
};
