import { useState, useMemo, useCallback, useRef } from 'react';
import { CategoryType, ViewMode, AlgorithmDefinition, AppView } from './types/dsa';
import { ALGORITHM_REGISTRY, getAllAlgorithms } from './algorithms/registry';
import { useStepEngine } from './engine/stepEngine';
import soundEngine from './engine/soundEngine';
import { Navbar } from './components/Navbar';
import { MainLayout } from './components/MainLayout';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { ProblemList } from './components/ProblemList';

const CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: 'arrays_and_hashing', label: '1. Arrays & Hashing' },
  { id: 'two_pointers', label: '2. Two Pointers' },
  { id: 'stack_and_queue', label: '3. Stack & Queue' },
  { id: 'binary_search', label: '4. Binary Search' },
  { id: 'sliding_window', label: '5. Sliding Window' },
  { id: 'linked_list', label: '6. Linked List' },
  { id: 'tree_fundamentals', label: '7. Tree Fundamentals' },
  { id: 'tree_queries_and_diameter', label: '8. Tree Queries & Diameter' },
  { id: 'tries_and_strings', label: '9. Tries & Strings' },
  { id: 'heap_and_priority_queue', label: '10. Heap / Priority Queue' },
  { id: 'backtracking', label: '11. Backtracking' },
  { id: 'graph_traversal', label: '12. Graph Traversal' },
  { id: 'graph_shortest_paths', label: '13. Graph Shortest Paths' },
  { id: 'graph_spanning_trees', label: '14. Graph Spanning Trees' },
  { id: 'graph_directed_and_scc', label: '15. Graph Directed & SCC' },
  { id: 'graph_flows_and_cuts', label: '16. Graph Flows & Cuts' },
  { id: 'dp_1d', label: '17. 1-D Dynamic Programming' },
  { id: 'dp_2d', label: '18. 2-D Dynamic Programming' },
  { id: 'intervals', label: '19. Intervals' },
  { id: 'greedy_algorithms', label: '20. Greedy Algorithms' },
  { id: 'bit_manipulation', label: '21. Bit Manipulation' },
  { id: 'math_and_number_theory', label: '22. Math & Number Theory' },
  { id: 'game_theory', label: '23. Game Theory' },
  { id: 'advanced_range_queries', label: '24. Advanced Range Queries' },
  { id: 'geometry_and_sweep_line', label: '25. Geometry & Sweep Line' },
];

export function App() {
  const [appView, setAppView] = useState<AppView>('tree');
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
    if (algorithm.category === 'arrays_and_hashing') {
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

  // Ref to track last step index that triggered sound (prevents duplicate triggers/echoes)
  const lastHandledStepRef = useRef<number>(-1);

  // Sound handler on step transition
  const handleStepChange = useCallback(
    (step: typeof steps[0]) => {
      if (!soundEnabled || !step) return;
      if (lastHandledStepRef.current === step.stepIndex) return;
      lastHandledStepRef.current = step.stepIndex;

      const whatText = step.explanation?.what.toLowerCase() || '';
      if (whatText.includes('swap')) {
        soundEngine.playSwap();
      } else if (whatText.includes('compar')) {
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

  // Global algorithm selection handler from search bar or problem list
  const handleGlobalSelectAlgorithm = useCallback((algorithmId: string, categoryFolder?: CategoryType) => {
    const targetAlg = ALGORITHM_REGISTRY[algorithmId] || getAllAlgorithms().find((a) => a.id === algorithmId);
    if (targetAlg) {
      setActiveAlgorithmId(targetAlg.id);
      setActiveCategory(categoryFolder || targetAlg.category);
    } else {
      setActiveAlgorithmId(algorithmId);
    }
    setAppView('workspace');
  }, []);

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-page)' }}>
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
        onGlobalSelectAlgorithm={handleGlobalSelectAlgorithm}
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
      ) : appView === 'list' ? (
        <ProblemList onSelectAlgorithm={handleGlobalSelectAlgorithm} />
      ) : (
        /* Main Visualizer Workspace Layout */
        <MainLayout
          algorithm={algorithm}
          currentStep={currentStep}
          viewMode={viewMode}
          showTutorial={showTutorial}
          showAuxiliary={showAuxiliary}
          onToggleTutorial={() => setShowTutorial(false)}
          onToggleAuxiliary={() => setShowAuxiliary((prev) => !prev)}
          controlProps={{
            isPlaying,
            onPlayPause: togglePlay,
            onStepBack: stepBackward,
            onStepForward: stepForward,
            onReset: reset,
            currentStep: currentStepIndex,
            totalSteps,
            speed,
            onSpeedChange: setSpeed,
            dataSize,
            onDataSizeChange: setDataSize,
            onGenerateRandom: handleGenerateRandom,
            supportsCustomSize: algorithm.category === 'arrays_and_hashing',
          }}
        />
      )}
    </div>
  );
}

export default App;
