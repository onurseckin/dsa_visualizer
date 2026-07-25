import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ArrayVisualizer from '../../../components/primitives/ArrayVisualizer';
import { MainLayout } from '../../../components/MainLayout';
import {
  euclidGcd,
  generateEuclidGcdSteps,
  DEFAULT_EUCLID_GCD_INPUT,
} from '../euclidGcd';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('euclidGcd React component spec', () => {
  it('renders ArrayVisualizer with Euclid GCD snapshot', () => {
    const steps = generateEuclidGcdSteps(DEFAULT_EUCLID_GCD_INPUT);
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;

    render(
      <ArrayVisualizer
        elements={snapshot.elements}
        title="Euclidean Algorithm (GCD)"
      />
    );

    expect(screen.getByText('Euclidean Algorithm (GCD)')).toBeInTheDocument();
  });

  it('renders MainLayout cleanly with euclidGcd algorithm', () => {
    const steps = generateEuclidGcdSteps(DEFAULT_EUCLID_GCD_INPUT);

    render(
      <MainLayout
        algorithm={euclidGcd}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );

    expect(screen.getAllByText(/Euclidean Algorithm/i)[0]).toBeInTheDocument();
  });
});

