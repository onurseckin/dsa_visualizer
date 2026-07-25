import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ArrayVisualizer from '../../../components/primitives/ArrayVisualizer';
import { generateEuclidGcdSteps, DEFAULT_EUCLID_GCD_INPUT } from '../euclidGcd';
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
});
