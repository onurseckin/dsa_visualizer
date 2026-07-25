import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../MainLayout';
import type { AlgorithmDefinition, AlgorithmStep } from '../../types/dsa';
import type { ControlPanelProps } from '../ControlPanel';

/* Child panels are owned and rebuilt by other agents. They are mocked here so this
   spec verifies the layout contract only: composition, conditional rendering per
   viewMode, and prop wiring across the agent boundary. ResizableLayout stays real. */

vi.mock('../primitives/ProblemHeader', () => ({
  ProblemHeader: ({
    title,
    difficulty,
    description,
    expanded,
    onToggleExpanded,
    onResetLayout,
  }: {
    title: string;
    difficulty?: string;
    description: string;
    expanded: boolean;
    onToggleExpanded: () => void;
    onResetLayout?: () => void;
  }) => (
    <div data-testid="problem-header">
      <span>{title}</span>
      <span>{difficulty}</span>
      <button aria-expanded={expanded} onClick={onToggleExpanded}>
        Details
      </button>
      {expanded && <p>{description}</p>}
      <button onClick={onResetLayout}>Reset Layout</button>
    </div>
  ),
}));

vi.mock('../ControlPanel', () => ({
  ControlPanel: ({
    variant,
    currentStep,
    totalSteps,
    onPlayPause,
  }: {
    variant?: string;
    currentStep: number;
    totalSteps: number;
    onPlayPause: () => void;
  }) => (
    <div data-testid="control-panel" data-variant={variant}>
      <button onClick={onPlayPause}>Play</button>
      <span>{`${currentStep} / ${totalSteps}`}</span>
    </div>
  ),
}));

vi.mock('../primitives/TutorialCard', () => ({
  TutorialCard: ({ what, onClose }: { what?: string; onClose?: () => void }) => (
    <div data-testid="tutorial-card">
      <span>{what}</span>
      <button onClick={onClose}>Dismiss explanation</button>
    </div>
  ),
}));

vi.mock('../primitives/AuxiliaryPanel', () => ({
  AuxiliaryPanel: ({ onClose }: { onClose?: () => void }) => (
    <div data-testid="auxiliary-panel">
      <button onClick={onClose}>Hide auxiliary panel</button>
    </div>
  ),
}));

vi.mock('../primitives/CodeBlockViewer', () => ({
  CodeBlockViewer: ({ code, activeLine }: { code: string; activeLine: number }) => (
    <pre data-testid="code-viewer" data-active-line={activeLine}>
      {code}
    </pre>
  ),
}));

vi.mock('../ComplexityCard', () => ({
  ComplexityCard: ({
    complexityAnalysis,
  }: {
    complexityAnalysis: { time: string; space: string };
  }) => (
    <div data-testid="complexity-card">
      <p>{complexityAnalysis.time}</p>
      <p>{complexityAnalysis.space}</p>
    </div>
  ),
}));

vi.mock('../primitives/ArrayVisualizer', () => ({
  ArrayVisualizer: ({ elements }: { elements: { value: number }[] }) => (
    <div data-testid="array-visualizer">{elements.map((el) => el.value).join(',')}</div>
  ),
}));

vi.mock('../primitives/GridVisualizer', () => ({
  GridVisualizer: () => <div data-testid="grid-visualizer" />,
}));

vi.mock('../primitives/GraphVisualizer', () => ({
  GraphVisualizer: () => <div data-testid="graph-visualizer" />,
}));

vi.mock('../primitives/TreeVisualizer', () => ({
  TreeVisualizer: () => <div data-testid="tree-visualizer" />,
}));

const dummyAlgorithm: AlgorithmDefinition = {
  id: 'bubble-sort',
  title: 'Bubble Sort Algorithm',
  category: 'arrays_and_hashing',
  difficulty: 'Easy',
  description:
    'Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
  constraints: ['1 <= n <= 50'],
  examples: [{ input: '[3, 1, 2]', output: '[1, 2, 3]' }],
  code: 'def bubble_sort(arr):\n    pass',
  timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
  spaceComplexity: 'O(1)',
  complexityAnalysis: {
    time: 'We sweep the array repeatedly, so in the worst case the work grows quadratically — O(n^2).',
    space: 'Swaps happen in place, so extra memory stays constant — O(1).',
  },
  defaultInput: { array: [3, 1, 2] },
  generateSteps: () => [],
};

const dummyStep: AlgorithmStep = {
  stepIndex: 0,
  codeLine: 1,
  explanation: {
    what: 'Comparing elements 3 and 1',
    why: 'Index 0 is greater than index 1, so we swap the pair to move the larger value right.',
  },
  primarySnapshot: {
    kind: 'array',
    elements: [
      { id: '0', value: 3, state: 'active' },
      { id: '1', value: 1, state: 'active' },
      { id: '2', value: 2, state: 'default' },
    ],
  },
  auxiliaryState: {
    stack: ['bubble_sort(arr)'],
  },
  variables: { i: 0, j: 0 },
};

const dummyControlProps: ControlPanelProps = {
  isPlaying: false,
  onPlayPause: vi.fn(),
  onStepBack: vi.fn(),
  onStepForward: vi.fn(),
  onReset: vi.fn(),
  currentStep: 0,
  totalSteps: 5,
  speed: 300,
  onSpeedChange: vi.fn(),
  dataSize: 10,
  onDataSizeChange: vi.fn(),
  onGenerateRandom: vi.fn(),
  supportsCustomSize: true,
};

describe('MainLayout Component Spec', () => {
  it('renders the problem header strip with algorithm identity', () => {
    render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.getByTestId('problem-header')).toBeInTheDocument();
    expect(screen.getByText('Bubble Sort Algorithm')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('fills the viewport without page scroll: main is a flex column that clips overflow', () => {
    render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    const main = screen.getByRole('main');
    expect(main).toHaveStyle({ overflow: 'hidden', display: 'flex' });
    expect(main).toHaveAttribute('data-details-expanded', 'false');
  });

  it('hides problem details by default and switches to page-scroll mode while expanded', () => {
    render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    const main = screen.getByRole('main');
    expect(screen.queryByText(dummyAlgorithm.description)).not.toBeInTheDocument();
    expect(main).toHaveAttribute('data-details-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.getByText(dummyAlgorithm.description)).toBeInTheDocument();
    expect(main).toHaveAttribute('data-details-expanded', 'true');
    expect(main).toHaveStyle({ overflowY: 'auto' });

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.queryByText(dummyAlgorithm.description)).not.toBeInTheDocument();
    expect(main).toHaveAttribute('data-details-expanded', 'false');
    expect(main).toHaveStyle({ overflow: 'hidden' });
  });

  it('collapses details again when the algorithm changes', () => {
    const { rerender } = render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-details-expanded', 'true');

    rerender(
      <MainLayout
        algorithm={{ ...dummyAlgorithm, id: 'insertion-sort' }}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.getByRole('main')).toHaveAttribute('data-details-expanded', 'false');
    expect(screen.queryByText(dummyAlgorithm.description)).not.toBeInTheDocument();
  });

  it('renders visualizer, code viewer, and complexity prose in split viewMode', () => {
    render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.getByTestId('array-visualizer')).toHaveTextContent('3,1,2');
    expect(screen.getByTestId('code-viewer')).toHaveTextContent('def bubble_sort');
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('passes complexityAnalysis from the algorithm definition to ComplexityCard', () => {
    render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    const card = screen.getByTestId('complexity-card');
    expect(card).toHaveTextContent(dummyAlgorithm.complexityAnalysis.time);
    expect(card).toHaveTextContent(dummyAlgorithm.complexityAnalysis.space);
  });

  it('embeds playback controls at the bottom edge of the visualizer card when controlProps are provided', () => {
    render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
        controlProps={dummyControlProps}
      />
    );

    const panel = screen.getByTestId('control-panel');
    expect(panel).toHaveAttribute('data-variant', 'embedded');
    expect(panel).toHaveTextContent('0 / 5');
  });

  it('omits playback controls when neither controlProps nor playback callbacks are provided', () => {
    render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.queryByTestId('control-panel')).not.toBeInTheDocument();
  });

  it('hides the code column in visual viewMode', () => {
    render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="visual"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.getByTestId('array-visualizer')).toBeInTheDocument();
    expect(screen.queryByTestId('code-viewer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('complexity-card')).not.toBeInTheDocument();
  });

  it('hides the visualizer column in code viewMode', () => {
    render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="code"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.getByTestId('code-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('complexity-card')).toBeInTheDocument();
    expect(screen.queryByTestId('array-visualizer')).not.toBeInTheDocument();
  });

  it('toggles the tutorial card and forwards onClose to onToggleTutorial', () => {
    const handleToggleTutorial = vi.fn();
    const { rerender } = render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={false}
        onToggleTutorial={handleToggleTutorial}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.getByText('Comparing elements 3 and 1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Dismiss explanation'));
    expect(handleToggleTutorial).toHaveBeenCalledTimes(1);

    rerender(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={handleToggleTutorial}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.queryByTestId('tutorial-card')).not.toBeInTheDocument();
  });

  it('toggles the auxiliary panel and forwards onClose to onToggleAuxiliary', () => {
    const handleToggleAuxiliary = vi.fn();
    const { rerender } = render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={true}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={handleToggleAuxiliary}
      />
    );

    expect(screen.getByTestId('auxiliary-panel')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hide auxiliary panel'));
    expect(handleToggleAuxiliary).toHaveBeenCalledTimes(1);

    rerender(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={handleToggleAuxiliary}
      />
    );

    expect(screen.queryByTestId('auxiliary-panel')).not.toBeInTheDocument();
  });

  it('renders fallback UI when currentStep is null', () => {
    render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={null}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.getByText('No visual snapshot available')).toBeInTheDocument();
    expect(screen.queryByTestId('tutorial-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('auxiliary-panel')).not.toBeInTheDocument();
  });

  it('resets the split ratio to 60 when ProblemHeader triggers onResetLayout', () => {
    localStorage.setItem('dsa_visualizer_layout_split', '75');

    render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-valuenow', '75');

    fireEvent.click(screen.getByRole('button', { name: 'Reset Layout' }));

    expect(handle).toHaveAttribute('aria-valuenow', '60');
    expect(localStorage.getItem('dsa_visualizer_layout_split')).toBe('60');
    localStorage.clear();
  });
});
