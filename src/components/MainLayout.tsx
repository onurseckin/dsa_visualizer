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

interface MainLayoutProps {
  algorithm: AlgorithmDefinition;
  currentStep: AlgorithmStep | null;
  viewMode: ViewMode;
  showTutorial: boolean;
  showAuxiliary: boolean;
  onToggleTutorial: () => void;
  onToggleAuxiliary: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  algorithm,
  currentStep,
  viewMode,
  showTutorial,
  showAuxiliary,
  onToggleTutorial,
}) => {
  const primarySnapshot = currentStep?.primarySnapshot;

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

  return (
    <main
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        flex: 1,
      }}
    >
      {/* Problem Specification Header */}
      <ProblemHeader
        title={algorithm.title}
        category={algorithm.category}
        difficulty={algorithm.difficulty}
        description={algorithm.description}
        constraints={algorithm.constraints}
        examples={algorithm.examples}
      />

      {/* Toggleable Tutorial Explanation Banner */}
      {showTutorial && currentStep?.explanation && (
        <TutorialCard
          what={currentStep.explanation.what}
          why={currentStep.explanation.why}
          stepIndex={currentStep.stepIndex}
          codeLine={currentStep.codeLine}
          onClose={onToggleTutorial}
        />
      )}

      {/* Main Workspace Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            viewMode === 'split'
              ? '1fr 1fr'
              : viewMode === 'visual'
              ? '1fr'
              : '1fr',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Visual Canvas & Auxiliary Side Panels */}
        {(viewMode === 'split' || viewMode === 'visual') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Primary Visualizer Canvas */}
            <div className="glass-card" style={{ padding: '1rem', minHeight: '380px' }}>
              {renderPrimaryVisualizer()}
            </div>

            {/* Auxiliary Side Data Structures (Queue, Call Stack, Visited Set, Hash Map) */}
            {showAuxiliary && currentStep?.auxiliaryState && (
              <AuxiliaryPanel state={currentStep.auxiliaryState} />
            )}
          </div>
        )}

        {/* Right Column: Code Viewer & Complexity Metrics */}
        {(viewMode === 'split' || viewMode === 'code') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <CodeBlockViewer
              code={algorithm.code}
              activeLine={currentStep?.codeLine || 1}
              variables={currentStep?.variables}
            />

            <ComplexityCard
              timeComplexity={algorithm.timeComplexity}
              spaceComplexity={algorithm.spaceComplexity}
              variableState={currentStep?.variables}
            />
          </div>
        )}
      </div>
    </main>
  );
};
