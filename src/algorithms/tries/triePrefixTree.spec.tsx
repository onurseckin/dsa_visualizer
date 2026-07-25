import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../components/MainLayout';
import {
  DEFAULT_TRIE_INPUT,
  generateTriePrefixTreeSteps,
  triePrefixTree,
} from './triePrefixTree';

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
    expect(
      screen.getByText(/tree-like data structure used for efficient storage/i)
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
    expect(screen.getByText(/Auxiliary Helper Data Structures/i)).toBeInTheDocument();
  });
});
