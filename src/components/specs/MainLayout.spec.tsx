import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { MainLayout } from '../MainLayout';
import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from '../../types/dsa';
import type { ControlPanelProps } from '../ControlPanel';
import {
  DEFAULT_WORKSPACE_LAYOUT,
  WORKSPACE_LAYOUT_KEY,
  WorkspaceLayout,
} from '../../app/workspaceLayout';

/* Child panels are owned and rebuilt by other agents. They are mocked here so this
   spec verifies the layout contract only: composition, conditional rendering per
   viewMode, prop wiring across the agent boundary, and the persisted geometry.
   ResizableLayout / ResizableRows and ConfirmDialog stay real. */

vi.mock('../primitives/ProblemHeader', () => ({
  ProblemHeader: ({
    title,
    difficulty,
    description,
    topicGuide,
    expanded,
    onToggleExpanded,
    onResetLayout,
  }: {
    title: string;
    difficulty?: string;
    description: string;
    topicGuide: TopicGuide;
    expanded: boolean;
    onToggleExpanded: () => void;
    onResetLayout?: () => void;
  }) => (
    <div data-testid="problem-header" data-topic-sections={topicGuide.sections.length}>
      <span>{title}</span>
      <span>{difficulty}</span>
      <button aria-expanded={expanded} onClick={onToggleExpanded}>
        Details
      </button>
      {expanded && <p>{description}</p>}
      {expanded && <p>{topicGuide.overview}</p>}
      <button onClick={onResetLayout}>Ask to reset layout</button>
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

const dummyTopicGuide: TopicGuide = {
  overview: 'Sorting rearranges a collection so its elements sit in a predictable order.',
  sections: [
    { heading: 'The core idea', body: 'You repeatedly compare neighbours and push the larger one right.' },
    { heading: 'Why it is correct', body: 'After each pass the largest unsorted value has reached its final slot.' },
  ],
  keyTerms: [{ term: 'Pass', definition: 'One full sweep from the start of the array to its unsorted end.' }],
};

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
  topicGuide: dummyTopicGuide,
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

const renderLayout = (
  overrides: Partial<ComponentProps<typeof MainLayout>> = {},
): ReturnType<typeof render> =>
  render(
    <MainLayout
      algorithm={dummyAlgorithm}
      currentStep={dummyStep}
      viewMode="split"
      showTutorial={false}
      showAuxiliary={false}
      onToggleTutorial={vi.fn()}
      onToggleAuxiliary={vi.fn()}
      {...overrides}
    />,
  );

const columnHandle = (): HTMLElement =>
  screen.getByRole('separator', { name: 'Resize visualizer and code columns' });

const storedLayout = (): WorkspaceLayout | null => {
  const raw = localStorage.getItem(WORKSPACE_LAYOUT_KEY);
  return raw === null ? null : (JSON.parse(raw) as WorkspaceLayout);
};

const seedLayout = (layout: WorkspaceLayout): void => {
  localStorage.setItem(WORKSPACE_LAYOUT_KEY, JSON.stringify(layout));
};

afterEach(() => {
  localStorage.clear();
});

describe('MainLayout Component Spec', () => {
  it('renders the problem header strip with algorithm identity and the topic guide', () => {
    renderLayout();

    expect(screen.getByTestId('problem-header')).toBeInTheDocument();
    expect(screen.getByText('Bubble Sort Algorithm')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByTestId('problem-header')).toHaveAttribute('data-topic-sections', '2');
    expect(screen.getByText(dummyTopicGuide.overview)).toBeInTheDocument();
  });

  it('never blocks page scrolling: main keeps overflow-y auto in every state', () => {
    renderLayout();

    const main = screen.getByRole('main');
    expect(main).toHaveStyle({ display: 'flex', overflowY: 'auto' });
    expect(main.style.overflow).not.toBe('hidden');
    expect(main).toHaveAttribute('data-details-expanded', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));

    expect(main).toHaveAttribute('data-details-expanded', 'false');
    expect(main).toHaveStyle({ overflowY: 'auto' });
    expect(main.style.overflow).not.toBe('hidden');
  });

  it('sizes the stage from the viewport with a floor so short screens scroll instead of squeezing', () => {
    const { container } = renderLayout();

    const stage = container.querySelector('[data-stage="workspace"]') as HTMLElement;
    expect(stage.style.height).toContain('max(var(--stage-min-h)');
    expect(stage.style.height).toContain('100dvh');
    expect(stage.style.height).toContain('var(--navbar-h)');
  });

  it('shows problem details expanded by default and lets the toggle collapse them', () => {
    renderLayout();

    expect(screen.getByText(dummyAlgorithm.description)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.queryByText(dummyAlgorithm.description)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByText(dummyAlgorithm.description)).toBeInTheDocument();
  });

  it('keeps the details panel collapsed across an algorithm change once the user collapsed it', () => {
    const { rerender } = renderLayout();

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-details-expanded', 'false');

    rerender(
      <MainLayout
        algorithm={{ ...dummyAlgorithm, id: 'insertion-sort' }}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={false}
        showAuxiliary={false}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />,
    );

    expect(screen.getByRole('main')).toHaveAttribute('data-details-expanded', 'false');
  });

  it('renders visualizer, code viewer, and complexity prose in split viewMode', () => {
    renderLayout();

    expect(screen.getByTestId('array-visualizer')).toHaveTextContent('3,1,2');
    expect(screen.getByTestId('code-viewer')).toHaveTextContent('def bubble_sort');
    expect(columnHandle()).toBeInTheDocument();
  });

  it('passes complexityAnalysis from the algorithm definition to ComplexityCard', () => {
    renderLayout();

    const card = screen.getByTestId('complexity-card');
    expect(card).toHaveTextContent(dummyAlgorithm.complexityAnalysis.time);
    expect(card).toHaveTextContent(dummyAlgorithm.complexityAnalysis.space);
  });

  it('embeds playback controls at the bottom edge of the visualizer card when controlProps are provided', () => {
    renderLayout({ controlProps: dummyControlProps });

    const panel = screen.getByTestId('control-panel');
    expect(panel).toHaveAttribute('data-variant', 'embedded');
    expect(panel).toHaveTextContent('0 / 5');
  });

  it('omits playback controls when neither controlProps nor playback callbacks are provided', () => {
    renderLayout();

    expect(screen.queryByTestId('control-panel')).not.toBeInTheDocument();
  });

  it('hides the code column in visual viewMode', () => {
    renderLayout({ viewMode: 'visual' });

    expect(screen.getByTestId('array-visualizer')).toBeInTheDocument();
    expect(screen.queryByTestId('code-viewer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('complexity-card')).not.toBeInTheDocument();
  });

  it('hides the visualizer column in code viewMode', () => {
    renderLayout({ viewMode: 'code' });

    expect(screen.getByTestId('code-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('complexity-card')).toBeInTheDocument();
    expect(screen.queryByTestId('array-visualizer')).not.toBeInTheDocument();
  });

  it('toggles the tutorial card and forwards onClose to onToggleTutorial', () => {
    const handleToggleTutorial = vi.fn();
    const { rerender } = renderLayout({
      showTutorial: true,
      onToggleTutorial: handleToggleTutorial,
    });

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
      />,
    );

    expect(screen.queryByTestId('tutorial-card')).not.toBeInTheDocument();
  });

  it('toggles the auxiliary panel and forwards onClose to onToggleAuxiliary', () => {
    const handleToggleAuxiliary = vi.fn();
    const { rerender } = renderLayout({
      showAuxiliary: true,
      onToggleAuxiliary: handleToggleAuxiliary,
    });

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
      />,
    );

    expect(screen.queryByTestId('auxiliary-panel')).not.toBeInTheDocument();
  });

  it('renders fallback UI when currentStep is null', () => {
    renderLayout({ currentStep: null, showTutorial: true, showAuxiliary: true });

    expect(screen.getByText('No visual snapshot available')).toBeInTheDocument();
    expect(screen.queryByTestId('tutorial-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('auxiliary-panel')).not.toBeInTheDocument();
  });

  describe('resizable sections', () => {
    it('exposes a vertical column handle plus horizontal row handles for every visible row pair', () => {
      renderLayout({ showTutorial: true, showAuxiliary: true });

      expect(columnHandle()).toHaveAttribute('aria-orientation', 'vertical');

      const rowHandles = screen
        .getAllByRole('separator')
        .filter((handle) => handle.getAttribute('aria-orientation') === 'horizontal');

      expect(rowHandles.map((handle) => handle.getAttribute('aria-label'))).toEqual([
        'Resize visualizer and tutorial rows',
        'Resize tutorial and auxiliary data rows',
        'Resize code and complexity rows',
      ]);
    });

    it('drops the row handles of hidden rows so no dead handle or empty gap is left', () => {
      renderLayout({ showTutorial: false, showAuxiliary: false });

      const rowHandles = screen
        .getAllByRole('separator')
        .filter((handle) => handle.getAttribute('aria-orientation') === 'horizontal');

      expect(rowHandles.map((handle) => handle.getAttribute('aria-label'))).toEqual([
        'Resize code and complexity rows',
      ]);
    });

    it('restores persisted sizes on mount', () => {
      seedLayout({
        version: 3,
        splitPercent: 40,
        leftRows: { visualizer: 50, tutorial: 30, auxiliary: 20 },
        rightRows: { code: 55, complexity: 45 },
      });

      const { container } = renderLayout({ showTutorial: true });

      expect(columnHandle()).toHaveAttribute('aria-valuenow', '40');
      expect((container.querySelector('[data-row="visualizer"]') as HTMLElement).style.flexGrow).toBe(
        '50',
      );
      expect((container.querySelector('[data-row="code"]') as HTMLElement).style.flexGrow).toBe('55');
    });

    it('falls back to defaults when the persisted layout is unusable', () => {
      localStorage.setItem(WORKSPACE_LAYOUT_KEY, '{"version":1,"splitPercent":90}');

      renderLayout();

      expect(columnHandle()).toHaveAttribute(
        'aria-valuenow',
        String(DEFAULT_WORKSPACE_LAYOUT.splitPercent),
      );
    });

    it('persists a keyboard nudge of the column split so it survives a reload', () => {
      renderLayout();

      fireEvent.keyDown(columnHandle(), { key: 'ArrowRight' });

      expect(columnHandle()).toHaveAttribute('aria-valuenow', '62');
      expect(storedLayout()?.splitPercent).toBe(62);
    });

    it('persists a keyboard nudge of a row handle', () => {
      renderLayout();

      const rowHandle = screen.getByRole('separator', { name: 'Resize code and complexity rows' });
      fireEvent.keyDown(rowHandle, { key: 'ArrowDown' });

      const stored = storedLayout();
      expect(stored?.rightRows.code).toBeGreaterThan(DEFAULT_WORKSPACE_LAYOUT.rightRows.code);
      expect((stored?.rightRows.code ?? 0) + (stored?.rightRows.complexity ?? 0)).toBeCloseTo(100);
    });
  });

  describe('reset layout', () => {
    const customLayout: WorkspaceLayout = {
      version: 3,
      splitPercent: 40,
      leftRows: { visualizer: 50, tutorial: 30, auxiliary: 20 },
      rightRows: { code: 55, complexity: 45 },
    };

    it('asks for confirmation instead of resetting immediately', () => {
      seedLayout(customLayout);
      renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Ask to reset layout' }));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByText('Reset workspace layout?')).toBeInTheDocument();
      expect(dialog).toHaveTextContent('custom panel sizes will be lost');

      // Nothing changed yet.
      expect(columnHandle()).toHaveAttribute('aria-valuenow', '40');
      expect(storedLayout()).toEqual(customLayout);
    });

    it('keeps the layout when the dialog is dismissed with Escape', () => {
      seedLayout(customLayout);
      renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Ask to reset layout' }));
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(columnHandle()).toHaveAttribute('aria-valuenow', '40');
      expect(storedLayout()).toEqual(customLayout);
    });

    it('keeps the layout when the cancel button is used', () => {
      seedLayout(customLayout);
      renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Ask to reset layout' }));
      fireEvent.click(screen.getByRole('button', { name: 'Keep my layout' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(columnHandle()).toHaveAttribute('aria-valuenow', '40');
      expect(storedLayout()).toEqual(customLayout);
    });

    it('clears storage and restores every default size only on confirm', () => {
      seedLayout(customLayout);
      const { container } = renderLayout({ showTutorial: true });

      fireEvent.click(screen.getByRole('button', { name: 'Ask to reset layout' }));
      fireEvent.click(screen.getByRole('button', { name: 'Reset layout' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBeNull();
      expect(columnHandle()).toHaveAttribute(
        'aria-valuenow',
        String(DEFAULT_WORKSPACE_LAYOUT.splitPercent),
      );
      expect((container.querySelector('[data-row="visualizer"]') as HTMLElement).style.flexGrow).toBe(
        String(DEFAULT_WORKSPACE_LAYOUT.leftRows.visualizer),
      );
      expect((container.querySelector('[data-row="code"]') as HTMLElement).style.flexGrow).toBe(
        String(DEFAULT_WORKSPACE_LAYOUT.rightRows.code),
      );
    });
  });
});
