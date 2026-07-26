import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { MainLayout } from '../MainLayout';
import type {
  AlgorithmDefinition,
  AlgorithmStep,
  AuxiliaryState,
  PanelVisibility,
  StepExplanation,
  TopicGuide,
} from '../../types/dsa';
import type { ControlPanelProps } from '../ControlPanel';
import {
  DEFAULT_WORKSPACE_LAYOUT,
  MIN_PANEL_HEIGHT_PX,
  WORKSPACE_LAYOUT_KEY,
  WORKSPACE_LAYOUT_RESET_EVENT,
  WorkspaceLayout,
  clearWorkspaceLayout,
} from '../../app/workspaceLayout';

/* Child panels are owned and rebuilt by other agents. They are mocked here so this
   spec verifies the layout contract only: the single-container stage, per-panel
   visibility, prop wiring across the agent boundary, and the persisted state.
   ResizableLayout / ResizableRows stay real. */

vi.mock('../primitives/ProblemHeader', () => ({
  ProblemHeader: ({
    title,
    difficulty,
    description,
    topicGuide,
    expanded,
    onToggleExpanded,
  }: {
    title: string;
    difficulty?: string;
    description: string;
    topicGuide: TopicGuide;
    expanded: boolean;
    onToggleExpanded: () => void;
  }) => (
    <div data-testid="problem-header" data-topic-sections={topicGuide.sections.length}>
      <span>{title}</span>
      <span>{difficulty}</span>
      <button aria-expanded={expanded} onClick={onToggleExpanded}>
        Details
      </button>
      {expanded && <p>{description}</p>}
      {expanded && <p>{topicGuide.overview}</p>}
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

/* The real predicates are mirrored here rather than stubbed to `true`: MainLayout
   gates each strip on them, so a stub would hide the empty-strip regression. */
vi.mock('../primitives/TutorialCard', () => ({
  TutorialCard: ({ what, onClose }: { what?: string; onClose?: () => void }) => (
    <div data-testid="tutorial-card">
      <span>{what}</span>
      <button onClick={onClose}>Dismiss explanation</button>
    </div>
  ),
  hasTutorialContent: (explanation?: StepExplanation, what?: string, why?: string) =>
    Boolean((what || explanation?.what || '').trim() || (why || explanation?.why || '').trim()),
}));

vi.mock('../primitives/AuxiliaryPanel', () => ({
  AuxiliaryPanel: ({ onClose }: { onClose?: () => void }) => (
    <div data-testid="auxiliary-panel">
      <span>Working data</span>
      <button onClick={onClose}>Hide auxiliary panel</button>
    </div>
  ),
  hasAuxiliaryContent: (state?: AuxiliaryState) =>
    Boolean(
      state &&
        ((state.stack?.length ?? 0) > 0 ||
          (state.queue?.length ?? 0) > 0 ||
          (state.visited?.length ?? 0) > 0 ||
          Object.keys(state.hashMap ?? {}).length > 0 ||
          Object.keys(state.distanceTable ?? {}).length > 0 ||
          Object.keys(state.customState ?? {}).length > 0),
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

const allPanels = (overrides: Partial<PanelVisibility> = {}): PanelVisibility => ({
  visualizer: true,
  code: true,
  tutorial: true,
  auxiliary: true,
  ...overrides,
});

const renderLayout = (
  overrides: Partial<ComponentProps<typeof MainLayout>> = {},
): ReturnType<typeof render> =>
  render(
    <MainLayout
      algorithm={dummyAlgorithm}
      currentStep={dummyStep}
      panels={allPanels()}
      onToggleTutorial={vi.fn()}
      onToggleAuxiliary={vi.fn()}
      {...overrides}
    />,
  );

const columnHandle = (): HTMLElement =>
  screen.getByRole('separator', { name: 'Resize visualizer and code columns' });

const horizontalHandles = (): string[] =>
  screen
    .getAllByRole('separator')
    .filter((handle) => handle.getAttribute('aria-orientation') === 'horizontal')
    .map((handle) => handle.getAttribute('aria-label') ?? '');

const panelRow = (container: HTMLElement, id: string): HTMLElement | null =>
  container.querySelector(`[data-row="${id}"]`);

/** The one container the whole left column is made of (DESIGN.md R5.2). */
const stagePanel = (container: HTMLElement): HTMLElement =>
  container.querySelector('[data-panel="visualizer"]') as HTMLElement;

const region = (container: HTMLElement, name: string): HTMLElement | null =>
  container.querySelector(`[data-region="${name}"]`);

/** The tutorial + working-data band, capped together so neither starves the canvas. */
const stepBand = (container: HTMLElement): HTMLElement | null =>
  container.querySelector('[data-band="step-context"]');

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
        panels={allPanels()}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />,
    );

    expect(screen.getByRole('main')).toHaveAttribute('data-details-expanded', 'false');
  });

  it('renders visualizer, code viewer and complexity prose when every panel is on', () => {
    renderLayout();

    expect(screen.getByTestId('array-visualizer')).toHaveTextContent('3,1,2');
    expect(screen.getByTestId('code-viewer')).toHaveTextContent('def bubble_sort');
    expect(screen.getByTestId('complexity-card')).toBeInTheDocument();
    expect(screen.getByTestId('tutorial-card')).toBeInTheDocument();
    expect(screen.getByTestId('auxiliary-panel')).toBeInTheDocument();
    expect(columnHandle()).toBeInTheDocument();
  });

  it('passes complexityAnalysis from the algorithm definition to ComplexityCard', () => {
    renderLayout();

    const card = screen.getByTestId('complexity-card');
    expect(card).toHaveTextContent(dummyAlgorithm.complexityAnalysis.time);
    expect(card).toHaveTextContent(dummyAlgorithm.complexityAnalysis.space);
  });

  it('omits playback controls when neither controlProps nor playback callbacks are provided', () => {
    renderLayout();

    expect(screen.queryByTestId('control-panel')).not.toBeInTheDocument();
  });

  describe('one graph-focused stage container', () => {
    it('reads tutorial, working data, canvas then playback down the single visualizer panel', () => {
      const { container } = renderLayout({ controlProps: dummyControlProps });

      const panel = stagePanel(container);
      expect(panel).toBeInTheDocument();
      expect(panel).toContainElement(screen.getByText('Working data'));
      expect(panel).toContainElement(screen.getByTestId('array-visualizer'));
      expect(panel).toContainElement(screen.getByTestId('tutorial-card'));
      expect(panel).toContainElement(screen.getByTestId('control-panel'));

      // The tutorial is the panel's header now (R6.4), not a footer above playback.
      const order = Array.from(panel.querySelectorAll('[data-region]')).map((node) =>
        node.getAttribute('data-region'),
      );
      expect(order).toEqual(['tutorial', 'working-data', 'canvas', 'controls']);
    });

    it('keeps the tutorial first even when the working-data strip is hidden', () => {
      const { container } = renderLayout({
        panels: allPanels({ auxiliary: false }),
        controlProps: dummyControlProps,
      });

      const order = Array.from(
        stagePanel(container).querySelectorAll('[data-region]'),
      ).map((node) => node.getAttribute('data-region'));
      expect(order).toEqual(['tutorial', 'canvas', 'controls']);
    });

    it('nests the step rows inside the panel instead of stacking them beside it', () => {
      const { container } = renderLayout();

      /* The left column is still one row — the tutorial and working-data rows are
         resizable rows (R7.4), but they live INSIDE the visualizer panel, so the
         column itself never stacks anything next to the stage. */
      const visualizerRow = panelRow(container, 'visualizer') as HTMLElement;
      expect(visualizerRow).toContainElement(stagePanel(container));
      for (const id of ['tutorial', 'auxiliary']) {
        const row = panelRow(container, id);
        expect(row).not.toBeNull();
        expect(stagePanel(container)).toContainElement(row);
      }

      const columnRows = Array.from(visualizerRow.parentElement?.children ?? []).filter((child) =>
        child.hasAttribute('data-row'),
      );
      expect(columnRows).toHaveLength(1);
      expect(columnRows[0]).toBe(visualizerRow);

      /* One handle per adjacent pair of rows — the step rows inside the panel and
         the code column's pair — plus the standalone one that pins the stage. */
      expect(horizontalHandles()).toEqual([
        'Resize tutorial and working data rows',
        'Resize code and complexity rows',
        'Resize the stage height',
      ]);
    });

    it('integrates every strip with one subtle divider on the edge facing the canvas', () => {
      const { container } = renderLayout();

      /* Both strips sit above the canvas now, so every divider faces down. The
         strip owns the band fill and that one line; its content draws no edge of
         its own, so each seam is exactly 1px. The fill is the card's own darkest
         surface (R7.2): these strips are reading surfaces like the code and
         complexity panels, so lifting them to the chrome tier made the Step
         section read as a lighter, separate component. The divider alone marks
         the seam. */
      for (const name of ['tutorial', 'working-data']) {
        const strip = region(container, name) as HTMLElement;
        expect(strip.style.borderBottom).toBe('1px solid var(--border-subtle)');
        expect(strip.style.borderTop).toBe('');
        expect(strip.style.background).toBe('var(--bg-surface)');
      }
    });

    it('drops the last strip divider when there is no canvas under it to divide from', () => {
      const { container } = renderLayout({ panels: allPanels({ visualizer: false }) });

      expect((region(container, 'tutorial') as HTMLElement).style.borderBottom).toBe(
        '1px solid var(--border-subtle)',
      );
      expect((region(container, 'working-data') as HTMLElement).style.borderBottom).toBe('');
    });

    it('caps tutorial and working data as ONE band so neither starves the canvas', () => {
      const { container } = renderLayout();

      /* Two strips each free to take 38% would leave the canvas a quarter of the
         panel, so the cap is on the band and the prose strip inside it scrolls. */
      const band = stepBand(container) as HTMLElement;
      expect(band.style.maxHeight).toBe('45%');
      expect(band.style.flexShrink).toBe('0');
      expect(band.style.minHeight).toBe('0');
      expect(band.style.overflow).toBe('hidden');
      expect(band).toContainElement(region(container, 'tutorial'));
      expect(band).toContainElement(region(container, 'working-data'));
      expect(band).not.toContainElement(region(container, 'canvas'));

      // The prose gives height back under the cap; the one-row data strip does not.
      const tutorial = region(container, 'tutorial') as HTMLElement;
      expect(tutorial.style.flex).toBe('1 1 auto');
      const workingData = region(container, 'working-data') as HTMLElement;
      expect(workingData.style.flex).toBe('0 0 auto');

      for (const name of ['tutorial', 'working-data']) {
        const strip = region(container, name) as HTMLElement;
        // Each scrolls inside itself, so a verbose step never resizes the panel.
        expect(strip.style.overflowY).toBe('auto');
        expect(strip.style.minHeight).toBe('0');
        expect(strip.style.maxHeight).toBe('');
      }
    });

    it('renders no band at all when both strips are off', () => {
      const { container } = renderLayout({
        panels: allPanels({ tutorial: false, auxiliary: false }),
      });

      expect(stepBand(container)).toBeNull();
    });

    it('gives the canvas every leftover pixel and never centres a child inside it', () => {
      const { container } = renderLayout();

      const canvas = region(container, 'canvas') as HTMLElement;
      expect(canvas.style.flex).toBe('1 1 0%');
      // A flex child must be allowed to go below its content to give space back.
      expect(canvas.style.minHeight).toBe('0');

      /* R6.1: centring a 100%-sized visualizer, or padding it like a band, is how
         the dead vertical space kept being MOVED instead of removed. Vertical
         slack must not exist here; horizontal slack scrolls. */
      expect(canvas.style.alignItems).toBe('');
      expect(canvas.style.justifyContent).toBe('');
      expect(canvas.style.padding).toBe('var(--space-2)');
      expect(canvas.style.overflowY).toBe('hidden');
      expect(canvas.style.overflowX).toBe('auto');
    });

    it('embeds playback controls at the bottom edge of the visualizer panel', () => {
      renderLayout({ controlProps: dummyControlProps });

      const panel = screen.getByTestId('control-panel');
      expect(panel).toHaveAttribute('data-variant', 'embedded');
      expect(panel).toHaveTextContent('0 / 5');
    });

    it('hands the canvas the space of a hidden strip and renders no wrapper for it', () => {
      const { container } = renderLayout({
        panels: allPanels({ tutorial: false, auxiliary: false }),
      });

      expect(region(container, 'working-data')).toBeNull();
      expect(region(container, 'tutorial')).toBeNull();
      expect(screen.queryByTestId('tutorial-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('auxiliary-panel')).not.toBeInTheDocument();

      const canvas = region(container, 'canvas') as HTMLElement;
      expect(canvas.style.flex).toBe('1 1 0%');
      expect(stagePanel(container)).toContainElement(canvas);
    });
  });

  describe('panel visibility', () => {
    it('renders nothing at all for a hidden strip — no row, no handle, no gap', () => {
      const { container } = renderLayout({
        panels: allPanels({ tutorial: false, auxiliary: false }),
      });

      expect(panelRow(container, 'tutorial')).toBeNull();
      expect(panelRow(container, 'auxiliary')).toBeNull();
      // No step rows means no handle between them; the stage handle is not theirs.
      expect(horizontalHandles()).toEqual([
        'Resize code and complexity rows',
        'Resize the stage height',
      ]);
    });

    /* The strip components return null when they have no content, so gating the
       wrapper on "the data object exists" left an empty bordered band with a
       divider — the dead space R5.2 forbids. Gate on real content instead. */
    it('renders no working-data strip when the step carries an empty auxiliary state', () => {
      const { container } = renderLayout({
        currentStep: { ...dummyStep, auxiliaryState: {} },
        panels: allPanels(),
      });

      expect(container.querySelector('[data-region="working-data"]')).toBeNull();
      expect(screen.queryByTestId('auxiliary-panel')).not.toBeInTheDocument();
    });

    it('renders no working-data strip when every auxiliary collection is empty', () => {
      const { container } = renderLayout({
        currentStep: {
          ...dummyStep,
          auxiliaryState: { stack: [], queue: [], visited: [], hashMap: {} },
        },
        panels: allPanels(),
      });

      expect(container.querySelector('[data-region="working-data"]')).toBeNull();
    });

    it('renders no tutorial strip when the step explanation is blank', () => {
      const { container } = renderLayout({
        currentStep: { ...dummyStep, explanation: { what: '   ', why: '' } },
        panels: allPanels(),
      });

      expect(container.querySelector('[data-region="tutorial"]')).toBeNull();
      expect(screen.queryByTestId('tutorial-card')).not.toBeInTheDocument();
    });

    it('drops the whole code column, complexity card and column handle when code is off', () => {
      const { container } = renderLayout({ panels: allPanels({ code: false }) });

      expect(screen.queryByTestId('code-viewer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('complexity-card')).not.toBeInTheDocument();
      expect(panelRow(container, 'code')).toBeNull();
      expect(
        screen.queryByRole('separator', { name: 'Resize visualizer and code columns' }),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('array-visualizer')).toBeInTheDocument();
    });

    it('drops the canvas but keeps the step strips when the visualizer is off', () => {
      const { container } = renderLayout({
        panels: allPanels({ visualizer: false }),
        controlProps: dummyControlProps,
      });

      expect(region(container, 'canvas')).toBeNull();
      expect(screen.queryByTestId('array-visualizer')).not.toBeInTheDocument();
      expect(screen.getByTestId('code-viewer')).toBeInTheDocument();

      // The strips are the panel's content, so a tutorial toggle still shows one.
      expect(stagePanel(container)).toContainElement(screen.getByTestId('tutorial-card'));
      expect(stagePanel(container)).toContainElement(screen.getByTestId('auxiliary-panel'));
      // With no canvas to absorb it, the panel hugs its strips instead of stretching.
      expect(panelRow(container, 'visualizer')).toHaveAttribute('data-height-mode', 'hug');

      // Playback has to stay reachable, so it docks under the stage on its own.
      const panel = screen.getByTestId('control-panel');
      expect(panel).toHaveAttribute('data-variant', 'standalone');
      expect(region(container, 'controls')).toBeNull();
    });

    it('shows a calm empty state instead of a blank stage when every panel is off', () => {
      const { container } = renderLayout({
        panels: { visualizer: false, code: false, tutorial: false, auxiliary: false },
        controlProps: dummyControlProps,
      });

      expect(screen.getByText('Every panel is hidden')).toBeInTheDocument();
      expect(
        screen.getByText(/Turn on Visualizer, Code, Tutorial or Aux data in the navbar/),
      ).toBeInTheDocument();
      expect(screen.queryAllByRole('separator')).toHaveLength(0);
      expect(panelRow(container, 'code')).toBeNull();
      expect(panelRow(container, 'visualizer')).toBeNull();
      expect(screen.queryByTestId('control-panel')).not.toBeInTheDocument();
      // The problem header is chrome, not a panel: it stays.
      expect(screen.getByTestId('problem-header')).toBeInTheDocument();
    });

    it('forwards the tutorial close button to onToggleTutorial', () => {
      const handleToggleTutorial = vi.fn();
      renderLayout({ onToggleTutorial: handleToggleTutorial });

      fireEvent.click(screen.getByText('Dismiss explanation'));

      expect(handleToggleTutorial).toHaveBeenCalledTimes(1);
    });

    it('forwards the auxiliary close button to onToggleAuxiliary', () => {
      const handleToggleAuxiliary = vi.fn();
      renderLayout({ onToggleAuxiliary: handleToggleAuxiliary });

      fireEvent.click(screen.getByText('Hide auxiliary panel'));

      expect(handleToggleAuxiliary).toHaveBeenCalledTimes(1);
    });

    it('renders the canvas fallback and no strips when currentStep is null', () => {
      const { container } = renderLayout({ currentStep: null });

      expect(screen.getByText('No visual snapshot available')).toBeInTheDocument();
      expect(region(container, 'working-data')).toBeNull();
      expect(region(container, 'tutorial')).toBeNull();
      expect(region(container, 'canvas')).toBeInTheDocument();
    });
  });

  describe('the code column hugs its content', () => {
    it('sizes code and complexity to their content with neither one greedy', () => {
      const { container } = renderLayout();

      for (const id of ['code', 'complexity']) {
        const element = panelRow(container, id) as HTMLElement;
        expect(element).toHaveAttribute('data-height-mode', 'hug');
        expect(element.style.flexGrow).toBe('0');
        expect(element.style.flexShrink).toBe('0');
        expect(element.style.flexBasis).toBe('auto');
        expect(element.style.height).toBe('');
        // No trailing empty space and no scroll of its own while it fits (R5.4).
        expect(element.style.overflowY).toBe('visible');
      }
    });

    it('puts the overflow on the column, so the complexity card follows the code directly', () => {
      const { container } = renderLayout();

      const code = panelRow(container, 'code') as HTMLElement;
      const complexity = panelRow(container, 'complexity') as HTMLElement;
      expect(code.nextElementSibling).toHaveAttribute('role', 'separator');
      expect(code.nextElementSibling?.nextElementSibling).toBe(complexity);

      const column = code.parentElement as HTMLElement;
      expect(column.style.overflowY).toBe('auto');
    });

    it('keeps the visualizer as the one greedy panel of the stage', () => {
      const { container } = renderLayout();

      const visualizer = panelRow(container, 'visualizer') as HTMLElement;
      expect(visualizer).toHaveAttribute('data-height-mode', 'greedy');
      expect(visualizer.style.flexGrow).toBe('1');
      expect(visualizer.style.flexBasis).toBe('0%');
    });

    it('keeps both columns automatic as step content grows and shrinks', () => {
      const { container, rerender } = renderLayout();

      rerender(
        <MainLayout
          algorithm={dummyAlgorithm}
          currentStep={{
            ...dummyStep,
            auxiliaryState: { stack: ['a', 'b', 'c'], queue: [1, 2], visited: [3, 4, 5] },
            explanation: {
              what: 'Comparing elements 3 and 1',
              why: 'A much longer teacher sentence that wraps onto several lines and therefore makes this strip taller than it was on the previous step.',
            },
          }}
          panels={allPanels()}
          onToggleTutorial={vi.fn()}
          onToggleAuxiliary={vi.fn()}
        />,
      );

      /* Nothing imposes a height, so content changes need no layout bookkeeping:
         the strips re-measure inside a panel whose outer size never moved. */
      expect(panelRow(container, 'visualizer')).toHaveAttribute('data-height-mode', 'greedy');
      for (const id of ['code', 'complexity']) {
        const element = panelRow(container, id) as HTMLElement;
        expect(element).toHaveAttribute('data-height-mode', 'hug');
        expect(element.style.height).toBe('');
        expect(element.style.flexBasis).toBe('auto');
      }
      expect(horizontalHandles()).toEqual([
        'Resize tutorial and working data rows',
        'Resize code and complexity rows',
        'Resize the stage height',
      ]);
    });
  });

  describe('persisted geometry', () => {
    it('gives the visualizer column the wider default share of the stage', () => {
      renderLayout();

      expect(columnHandle()).toHaveAttribute('aria-valuenow', '70');
      expect(DEFAULT_WORKSPACE_LAYOUT.splitPercent).toBe(70);
    });

    it('restores persisted sizes on mount, including the step rows', () => {
      seedLayout({
        version: 7,
        splitPercent: 40,
        panelHeights: {
          stage: null,
          visualizer: null,
          tutorial: 96,
          auxiliary: null,
          code: 320,
          complexity: 240,
        },
        detailsExpanded: true,
      });

      const { container } = renderLayout();

      expect(columnHandle()).toHaveAttribute('aria-valuenow', '40');
      expect((panelRow(container, 'code') as HTMLElement).style.height).toBe('320px');
      expect((panelRow(container, 'complexity') as HTMLElement).style.height).toBe('240px');
      // v7 gives the step strips their own slots, so a pinned tutorial comes back too.
      expect((panelRow(container, 'tutorial') as HTMLElement).style.height).toBe('96px');
      expect(panelRow(container, 'tutorial')).toHaveAttribute('data-height-mode', 'pinned');
      expect(panelRow(container, 'auxiliary')).toHaveAttribute('data-height-mode', 'hug');
      expect(panelRow(container, 'visualizer')).toHaveAttribute('data-height-mode', 'greedy');
    });

    it('ignores a payload from the previous v6 schema', () => {
      localStorage.setItem(
        WORKSPACE_LAYOUT_KEY,
        JSON.stringify({
          version: 6,
          splitPercent: 40,
          panelHeights: { visualizer: null, code: null, complexity: 240 },
          detailsExpanded: false,
        }),
      );

      const { container } = renderLayout();

      expect(columnHandle()).toHaveAttribute(
        'aria-valuenow',
        String(DEFAULT_WORKSPACE_LAYOUT.splitPercent),
      );
      expect(panelRow(container, 'complexity')).toHaveAttribute('data-height-mode', 'hug');
      expect(screen.getByRole('main')).toHaveAttribute('data-details-expanded', 'true');
    });

    it('persists a keyboard nudge of the column split so it survives a reload', () => {
      renderLayout();

      fireEvent.keyDown(columnHandle(), { key: 'ArrowRight' });

      expect(columnHandle()).toHaveAttribute('aria-valuenow', '72');
      expect(storedLayout()?.splitPercent).toBe(72);
      expect(storedLayout()?.panelHeights).toEqual(DEFAULT_WORKSPACE_LAYOUT.panelHeights);
    });

    it('pins only the resized panel and leaves every other panel automatic', () => {
      const { container } = renderLayout();

      const rowHandle = screen.getByRole('separator', { name: 'Resize code and complexity rows' });
      fireEvent.keyDown(rowHandle, { key: 'ArrowDown' });

      // jsdom measures 0, so the nudge lands on the floor — the point is that it pins.
      expect(storedLayout()?.panelHeights).toEqual({
        stage: null,
        visualizer: null,
        tutorial: null,
        auxiliary: null,
        code: MIN_PANEL_HEIGHT_PX,
        complexity: null,
      });
      const code = panelRow(container, 'code') as HTMLElement;
      expect(code).toHaveAttribute('data-height-mode', 'pinned');
      expect(code.style.height).toBe(`${MIN_PANEL_HEIGHT_PX}px`);
      expect(code.style.overflowY).toBe('auto');
      expect(panelRow(container, 'complexity')).toHaveAttribute('data-height-mode', 'hug');
    });

    /* R7.4: the step strips are rows now, so the handle between them is the height
       control for the graph area — the canvas absorbs whatever the tutorial gives up. */
    it('pins the tutorial row from the step handle and leaves the rest automatic', () => {
      const { container } = renderLayout();

      fireEvent.keyDown(
        screen.getByRole('separator', { name: 'Resize tutorial and working data rows' }),
        { key: 'ArrowDown' },
      );

      expect(storedLayout()?.panelHeights).toEqual({
        stage: null,
        visualizer: null,
        tutorial: MIN_PANEL_HEIGHT_PX,
        auxiliary: null,
        code: null,
        complexity: null,
      });
      const tutorial = panelRow(container, 'tutorial') as HTMLElement;
      expect(tutorial).toHaveAttribute('data-height-mode', 'pinned');
      expect(tutorial.style.height).toBe(`${MIN_PANEL_HEIGHT_PX}px`);
      expect(panelRow(container, 'auxiliary')).toHaveAttribute('data-height-mode', 'hug');
      expect(panelRow(container, 'visualizer')).toHaveAttribute('data-height-mode', 'greedy');
    });

    /* The stage is one row, so it has no separator of its own inside the column;
       the standalone handle is what gives the graph area a height and not only a
       width, and a pin has to beat the viewport calculation to be worth anything. */
    it('pins the stage height from its own handle and gives it back on double-click', () => {
      const { container } = renderLayout();

      const stage = container.querySelector('[data-stage="workspace"]') as HTMLElement;
      const stageHandle = screen.getByRole('separator', { name: 'Resize the stage height' });

      fireEvent.keyDown(stageHandle, { key: 'ArrowDown' });

      expect(storedLayout()?.panelHeights.stage).toBe(MIN_PANEL_HEIGHT_PX);
      expect(stage.style.height).toBe(`${MIN_PANEL_HEIGHT_PX}px`);

      fireEvent.doubleClick(stageHandle);

      expect(storedLayout()?.panelHeights.stage).toBeNull();
      expect(stage.style.height).toContain('max(var(--stage-min-h)');
    });

    it('restores a pinned panel to automatic on double-click and persists that', () => {
      seedLayout({
        version: 7,
        splitPercent: 70,
        panelHeights: {
          stage: null,
          visualizer: null,
          tutorial: null,
          auxiliary: null,
          code: 240,
          complexity: null,
        },
        detailsExpanded: true,
      });
      const { container } = renderLayout();

      expect((panelRow(container, 'code') as HTMLElement).style.height).toBe('240px');

      fireEvent.doubleClick(
        screen.getByRole('separator', { name: 'Resize code and complexity rows' }),
      );

      expect(panelRow(container, 'code')).toHaveAttribute('data-height-mode', 'hug');
      expect(storedLayout()?.panelHeights.code).toBeNull();
    });
  });

  /* R6.5: whether the lesson is open is a manual adjustment like any drag, so it
     lives under the same versioned key and survives a reload. */
  describe('persisted details state', () => {
    const detailsExpandedAttr = (): string | null =>
      screen.getByRole('main').getAttribute('data-details-expanded');

    it('persists a collapse to the v7 key without disturbing the geometry', () => {
      renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Details' }));

      expect(detailsExpandedAttr()).toBe('false');
      expect(storedLayout()?.detailsExpanded).toBe(false);
      expect(storedLayout()?.version).toBe(7);
      expect(storedLayout()?.splitPercent).toBe(DEFAULT_WORKSPACE_LAYOUT.splitPercent);
      expect(storedLayout()?.panelHeights).toEqual(DEFAULT_WORKSPACE_LAYOUT.panelHeights);
    });

    it('restores a collapsed details panel on mount, and reopening persists too', () => {
      seedLayout({
        version: 7,
        splitPercent: 55,
        panelHeights: {
          stage: null,
          visualizer: null,
          tutorial: null,
          auxiliary: null,
          code: null,
          complexity: null,
        },
        detailsExpanded: false,
      });

      renderLayout();

      expect(detailsExpandedAttr()).toBe('false');
      expect(screen.queryByText(dummyAlgorithm.description)).not.toBeInTheDocument();
      expect(columnHandle()).toHaveAttribute('aria-valuenow', '55');

      fireEvent.click(screen.getByRole('button', { name: 'Details' }));

      expect(detailsExpandedAttr()).toBe('true');
      expect(storedLayout()?.detailsExpanded).toBe(true);
      // Reopening must not drop the split the user dragged.
      expect(storedLayout()?.splitPercent).toBe(55);
    });

    it('keeps the details state through a later geometry drag', () => {
      renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Details' }));
      fireEvent.keyDown(columnHandle(), { key: 'ArrowRight' });

      expect(storedLayout()?.splitPercent).toBe(72);
      expect(storedLayout()?.detailsExpanded).toBe(false);
      expect(detailsExpandedAttr()).toBe('false');
    });

    it('opens details when the stored payload is from an older schema', () => {
      localStorage.setItem(
        WORKSPACE_LAYOUT_KEY,
        JSON.stringify({
          version: 6,
          splitPercent: 40,
          panelHeights: { visualizer: null, code: null, complexity: 240 },
          detailsExpanded: false,
        }),
      );

      renderLayout();

      expect(detailsExpandedAttr()).toBe('true');
    });
  });

  /* Reset moved to the navbar (R6.5), which clears the key and announces it; this
     panel owns no dialog any more and re-reads on the announcement. */
  describe('reset announced from the navbar', () => {
    const customLayout: WorkspaceLayout = {
      version: 7,
      splitPercent: 40,
      panelHeights: {
        stage: null,
        visualizer: null,
        tutorial: null,
        auxiliary: null,
        code: 320,
        complexity: 240,
      },
      detailsExpanded: false,
    };

    it('renders no reset control and no confirm dialog of its own', () => {
      renderLayout();

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reset layout/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Reset workspace layout?')).not.toBeInTheDocument();
    });

    it('reloads defaults live when the workspace-layout reset event fires', () => {
      seedLayout(customLayout);
      const { container } = renderLayout();

      expect(columnHandle()).toHaveAttribute('aria-valuenow', '40');
      expect(screen.getByRole('main')).toHaveAttribute('data-details-expanded', 'false');

      // Exactly what the navbar does on a confirmed reset.
      clearWorkspaceLayout();
      fireEvent(window, new Event(WORKSPACE_LAYOUT_RESET_EVENT));

      expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBeNull();
      expect(columnHandle()).toHaveAttribute(
        'aria-valuenow',
        String(DEFAULT_WORKSPACE_LAYOUT.splitPercent),
      );
      expect(screen.getByRole('main')).toHaveAttribute('data-details-expanded', 'true');
      for (const id of ['code', 'complexity']) {
        expect(panelRow(container, id)).toHaveAttribute('data-height-mode', 'hug');
        expect((panelRow(container, id) as HTMLElement).style.height).toBe('');
      }
    });

    it('ignores the announcement once unmounted, so a reset cannot resurrect it', () => {
      seedLayout(customLayout);
      const { unmount } = renderLayout();

      unmount();
      clearWorkspaceLayout();

      expect(() => fireEvent(window, new Event(WORKSPACE_LAYOUT_RESET_EVENT))).not.toThrow();
    });

    it('re-reads whatever is stored, so an announcement without a clear keeps the layout', () => {
      seedLayout(customLayout);
      renderLayout();

      fireEvent(window, new Event(WORKSPACE_LAYOUT_RESET_EVENT));

      expect(columnHandle()).toHaveAttribute('aria-valuenow', '40');
      expect(storedLayout()).toEqual(customLayout);
    });
  });
});
