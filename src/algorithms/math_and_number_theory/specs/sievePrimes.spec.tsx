import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ArrayVisualizer from '../../../components/primitives/ArrayVisualizer';
import { MainLayout } from '../../../components/MainLayout';
import {
  sievePrimes,
  generateSieveSteps,
  DEFAULT_SIEVE_INPUT,
} from '../sievePrimes';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('sievePrimes React component spec', () => {
  it('renders ArrayVisualizer with sieve snapshot', () => {
    const steps = generateSieveSteps(DEFAULT_SIEVE_INPUT);
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;

    render(
      <ArrayVisualizer
        elements={snapshot.elements}
        title="Sieve of Eratosthenes"
      />
    );

    expect(screen.getByText('Sieve of Eratosthenes')).toBeInTheDocument();
  });

  it('renders MainLayout cleanly with sievePrimes algorithm', () => {
    const steps = generateSieveSteps(DEFAULT_SIEVE_INPUT);

    render(
      <MainLayout
        algorithm={sievePrimes}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.getAllByText(/Sieve of Eratosthenes/i)[0]).toBeInTheDocument();
  });
});

