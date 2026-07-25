import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  DEFAULT_TRIE_INPUT,
  generateTriePrefixTreeSteps,
  triePrefixTree,
} from '../triePrefixTree';

/* The AuxiliaryPanel card is the only reliable scope for short row labels
   like "State" that also appear in badges and segmented controls. */
const getWorkingDataCard = (): HTMLElement => {
  const card = screen.getByText('Working data').closest('.ui-card');
  if (!(card instanceof HTMLElement)) {
    throw new Error('Working data card not found');
  }
  return card;
};

describe('TriePrefixTree React Component Spec', () => {
  it('renders algorithm title and problem header', () => {
    const steps = generateTriePrefixTreeSteps(DEFAULT_TRIE_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={triePrefixTree}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Trie (Prefix Tree)')).toBeInTheDocument();

    // Problem details render expanded by default, so the description is already visible.
    expect(
      screen.getAllByText(/tree-like data structure for storing strings/i)[0]
    ).toBeInTheDocument();
  });

  it('renders graph visualizer for trie steps', () => {
    const steps = generateTriePrefixTreeSteps(DEFAULT_TRIE_INPUT);
    const midStep = steps[4];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={triePrefixTree}
        currentStep={midStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Trie (Prefix Tree)')).toBeInTheDocument();

    const aux = within(getWorkingDataCard());
    expect(aux.getByText('State')).toBeInTheDocument();
    expect(aux.getAllByText(/insertedWords/)[0]).toBeInTheDocument();
  });
});
