import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  DEFAULT_REVERSE_LINKED_LIST_INPUT,
  generateReverseLinkedListSteps,
  reverseLinkedList,
} from '../reverseLinkedList';

describe('ReverseLinkedList React Component Spec', () => {
  it('renders algorithm title and problem description', () => {
    const steps = generateReverseLinkedListSteps(DEFAULT_REVERSE_LINKED_LIST_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={reverseLinkedList}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Reverse Linked List')).toBeInTheDocument();
    expect(
      screen.getByText(/Reverses a singly linked list in O\(n\) time and O\(1\) space/i)
    ).toBeInTheDocument();
  });

  it('renders step visualizer with auxiliary pointers state', () => {
    const steps = generateReverseLinkedListSteps(DEFAULT_REVERSE_LINKED_LIST_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={reverseLinkedList}
        currentStep={lastStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText(/Return prev \(new head = 5\)/i)).toBeInTheDocument();
  });
});
