import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../MainLayout';
import type { AlgorithmDefinition, AlgorithmStep } from '../../types/dsa';

const dummyAlgorithm: AlgorithmDefinition = {
  id: 'bubble-sort',
  title: 'Bubble Sort Algorithm',
  category: 'arrays_and_hashing',
  difficulty: 'Easy',
  description: 'Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
  constraints: ['1 <= n <= 50'],
  examples: [{ input: '[3, 1, 2]', output: '[1, 2, 3]' }],
  code: 'def bubble_sort(arr):\n    pass',
  timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
  spaceComplexity: 'O(1)',
  defaultInput: { array: [3, 1, 2] },
  generateSteps: () => [],
};

const dummyStep: AlgorithmStep = {
  stepIndex: 0,
  codeLine: 1,
  explanation: {
    what: 'Comparing elements 3 and 1',
    why: 'Index 0 is greater than index 1, swap required.',
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

describe('MainLayout Component Spec', () => {
  it('renders problem header details accurately', () => {
    render(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.getByText('Bubble Sort Algorithm')).toBeInTheDocument();
    expect(screen.getByText(/Repeatedly steps through the list/i)).toBeInTheDocument();
    expect(screen.getByText(/Easy/i)).toBeInTheDocument();
  });

  it('renders both visualizer and code viewer in split viewMode', () => {
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

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/def bubble_sort/i)).toBeInTheDocument();
  });

  it('hides code viewer in visual viewMode', () => {
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

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText(/def bubble_sort/i)).not.toBeInTheDocument();
  });

  it('hides visualizer canvas in code viewMode', () => {
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

    expect(screen.getByText(/def bubble_sort/i)).toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('toggles tutorial card banner and triggers onClose', () => {
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

    const closeBtn = screen.getByTitle('Close tutorial');
    fireEvent.click(closeBtn);
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

    expect(screen.queryByText('Comparing elements 3 and 1')).not.toBeInTheDocument();
  });

  it('toggles auxiliary panel and triggers onToggleAuxiliary', () => {
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

    expect(screen.getByText('Auxiliary Helper Data Structures')).toBeInTheDocument();

    const hideAuxBtn = screen.getByTitle('Hide auxiliary panel');
    fireEvent.click(hideAuxBtn);
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

    expect(screen.queryByText('Auxiliary Helper Data Structures')).not.toBeInTheDocument();
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
  });
});
