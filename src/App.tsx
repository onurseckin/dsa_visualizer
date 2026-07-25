import { useState, useMemo, useCallback } from 'react';
import { CategoryType, ViewMode, AlgorithmDefinition } from './types/dsa';
import { ALGORITHM_REGISTRY, getAllAlgorithms } from './algorithms/registry';
import { useStepEngine } from './engine/stepEngine';
import soundEngine from './engine/soundEngine';
import { Navbar } from './components/Navbar';
import { ControlPanel } from './components/ControlPanel';
import { MainLayout } from './components/MainLayout';
import { KnowledgeGraph } from './components/KnowledgeGraph';

const CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: 'arrays_and_hashing', label: '1. Arrays & Hashing' },
  { id: 'two_pointers', label: '2. Two Pointers' },
  { id: 'stack', label: '3. Stack' },
  { id: 'binary_search', label: '4. Binary Search' },
  { id: 'sliding_window', label: '5. Sliding Window' },
  { id: 'linked_list', label: '6. Linked List' },
  { id: 'trees', label: '7. Trees' },
  { id: 'tries', label: '8. Tries' },
  { id: 'heap', label: '9. Heap / Priority Queue' },
  { id: 'backtracking', label: '10. Backtracking' },
  { id: 'graphs', label: '11. Graphs' },
  { id: 'dp_1d', label: '12. 1-D Dynamic Programming' },
  { id: 'intervals', label: '13. Intervals' },
  { id: 'greedy', label: '14. Greedy Algorithms' },
  { id: 'advanced_graphs', label: '15. Advanced Graphs' },
  { id: 'math_and_geometry', label: '16. Math & Geometry' },
  { id: 'dp_2d', label: '17. 2-D Dynamic Programming' },
  { id: 'bit_manipulation', label: '18. Bit Manipulation' },
  { id: 'advanced_range_and_cp', label: '19. Advanced Range & CP' },
];

export function App() {
  const [appView, setAppView] = useState<'tree' | 'workspace'>('tree');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('arrays_and_hashing');
  const [activeAlgorithmId, setActiveAlgorithmId] = useState<string>('bubble-sort');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [showAuxiliary, setShowAuxiliary] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [dataSize, setDataSize] = useState<number>(10);
  const [inputSeed, setInputSeed] = useState<number>(1);

  // Available algorithms filtered by active category
  const categoryAlgorithms = useMemo(() => {
    const algs = getAllAlgorithms().filter((alg) => alg.category === activeCategory);
    return algs.length > 0 ? algs : getAllAlgorithms();
  }, [activeCategory]);

  // Selected algorithm object
  const algorithm: AlgorithmDefinition = useMemo(() => {
    return ALGORITHM_REGISTRY[activeAlgorithmId] || categoryAlgorithms[0] || getAllAlgorithms()[0];
  }, [activeAlgorithmId, categoryAlgorithms]);

  // Input data generator based on algorithm
  const currentInput = useMemo(() => {
    if (algorithm.category === 'arrays_and_hashing' || algorithm.category === 'sorting') {
      const arr: number[] = [];
      for (let i = 0; i < dataSize; i++) {
        const val = Math.floor(Math.abs(Math.sin(inputSeed * 997 + i * 13)) * 85) + 15;
        arr.push(val);
      }
      return arr;
    }
    return algorithm.defaultInput;
  }, [algorithm, dataSize, inputSeed]);

  // Generate steps from algorithm definition
  const steps = useMemo(() => {
    return algorithm.generateSteps(currentInput);
  }, [algorithm, currentInput]);

  // Sound handler on step transition
  const handleStepChange = useCallback(
    (step: typeof steps[0]) => {
      if (!soundEnabled) return;
      if (step.explanation?.what.toLowerCase().includes('swap')) {
        soundEngine.playSwap();
      } else if (step.explanation?.what.toLowerCase().includes('compar')) {
        soundEngine.playCompare(440);
      } else if (step.stepIndex === steps.length - 1) {
        soundEngine.playComplete();
      }
    },
    [soundEnabled, steps.length]
  );

  // Step engine hook
  const {
    currentStepIndex,
    currentStep,
    totalSteps,
    isPlaying,
    speed,
    togglePlay,
    stepForward,
    stepBackward,
    reset,
    setSpeed,
  } = useStepEngine({
    steps,
    soundEnabled,
    onStepChange: handleStepChange,
  });

  // Handle topic node selection from Knowledge Graph
  const handleSelectCategoryFromTree = (folder: string) => {
    const cat = folder as CategoryType;
    setActiveCategory(cat);
    const algs = getAllAlgorithms().filter((a) => a.category === cat);
    if (algs.length > 0) {
      setActiveAlgorithmId(algs[0].id);
    }
    setAppView('workspace');
  };

  // Handle category switch in navbar
  const handleSelectCategory = (cat: CategoryType) => {
    setActiveCategory(cat);
    const firstAlg = getAllAlgorithms().find((a) => a.category === cat);
    if (firstAlg) {
      setActiveAlgorithmId(firstAlg.id);
    }
  };

  const handleGenerateRandom = () => {
    setInputSeed((prev) => prev + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Top Header Navigation */}
      <Navbar
        appView={appView}
        onSetAppView={setAppView}
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        algorithmIds={categoryAlgorithms.map((a) => ({ id: a.id, title: a.title, difficulty: a.difficulty }))}
        activeAlgorithmId={activeAlgorithmId}
        onSelectAlgorithm={setActiveAlgorithmId}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        showTutorial={showTutorial}
        onToggleTutorial={() => setShowTutorial((prev) => !prev)}
        showAuxiliary={showAuxiliary}
        onToggleAuxiliary={() => setShowAuxiliary((prev) => !prev)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      {/* Main Content Area */}
      {appView === 'tree' ? (
        <KnowledgeGraph onSelectCategoryFolder={handleSelectCategoryFromTree} />
      ) : (
        <>
          {/* Playback Control Toolbar */}
          <ControlPanel
            isPlaying={isPlaying}
            onPlayPause={togglePlay}
            onStepBack={stepBackward}
            onStepForward={stepForward}
            onReset={reset}
            currentStep={currentStepIndex}
            totalSteps={totalSteps}
            speed={speed}
            onSpeedChange={setSpeed}
            dataSize={dataSize}
            onDataSizeChange={setDataSize}
            onGenerateRandom={handleGenerateRandom}
            supportsCustomSize={algorithm.category === 'arrays_and_hashing' || algorithm.category === 'sorting'}
          />

          {/* Main Visualizer Workspace Layout */}
          <MainLayout
            algorithm={algorithm}
            currentStep={currentStep}
            viewMode={viewMode}
            showTutorial={showTutorial}
            showAuxiliary={showAuxiliary}
            onToggleTutorial={() => setShowTutorial(false)}
            onToggleAuxiliary={() => setShowAuxiliary((prev) => !prev)}
          />
        </>
      )}
    </div>
  );
}

export default App;
