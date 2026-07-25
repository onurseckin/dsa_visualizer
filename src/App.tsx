import { useState, useMemo, useCallback } from 'react';
import { CategoryType, ViewMode, AlgorithmDefinition } from './types/dsa';
import { ALGORITHM_REGISTRY, getAllAlgorithms } from './algorithms/registry';
import { useStepEngine } from './engine/stepEngine';
import soundEngine from './engine/soundEngine';
import { Navbar } from './components/Navbar';
import { ControlPanel } from './components/ControlPanel';
import { MainLayout } from './components/MainLayout';

const CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: 'fundamentals', label: '1. Fundamentals & Search' },
  { id: 'sorting', label: '2. Sorting & Searching' },
  { id: 'data-structures', label: '3. Data Structures & Range Queries' },
  { id: 'dynamic-programming', label: '4. Dynamic Programming' },
  { id: 'graph', label: '5. Graph Algorithms' },
  { id: 'tree', label: '6. Trees & Spanning Trees' },
  { id: 'advanced', label: '7. Advanced Strings & Flows' },
  { id: 'math-games', label: '8. Math & Game Theory' },
  { id: 'leetcode', label: '9. LeetCode Collection' },
];

export function App() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('sorting');
  const [activeAlgorithmId, setActiveAlgorithmId] = useState<string>('bubble-sort');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [showAuxiliary, setShowAuxiliary] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [dataSize, setDataSize] = useState<number>(10);
  const [inputSeed, setInputSeed] = useState<number>(1);

  // Available algorithms filtered by current category
  const categoryAlgorithms = useMemo(() => {
    return getAllAlgorithms().filter((alg) => alg.category === activeCategory);
  }, [activeCategory]);

  // Selected algorithm object
  const algorithm: AlgorithmDefinition = useMemo(() => {
    return ALGORITHM_REGISTRY[activeAlgorithmId] || ALGORITHM_REGISTRY['bubble-sort'];
  }, [activeAlgorithmId]);

  // Input data calculation (e.g. random array for sorting, or default for graph/leetcode)
  const currentInput = useMemo(() => {
    if (algorithm.category === 'sorting') {
      // Generate random array of numbers based on dataSize and inputSeed
      const arr: number[] = [];
      for (let i = 0; i < dataSize; i++) {
        // pseudo random numbers based on seed + i
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

  // Handle category switch
  const handleSelectCategory = (cat: CategoryType) => {
    setActiveCategory(cat);
    const firstAlg = getAllAlgorithms().find((a) => a.category === cat);
    if (firstAlg) {
      setActiveAlgorithmId(firstAlg.id);
    }
  };

  // Handle new random input generation
  const handleGenerateRandom = () => {
    setInputSeed((prev) => prev + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Top Navbar */}
      <Navbar
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
        supportsCustomSize={algorithm.category === 'sorting'}
      />

      {/* Main Workspace Layout */}
      <MainLayout
        algorithm={algorithm}
        currentStep={currentStep}
        viewMode={viewMode}
        showTutorial={showTutorial}
        showAuxiliary={showAuxiliary}
        onToggleTutorial={() => setShowTutorial(false)}
        onToggleAuxiliary={() => setShowAuxiliary((prev) => !prev)}
      />
    </div>
  );
}

export default App;
