import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ArrayVisualizer from '../../../components/primitives/ArrayVisualizer';
import { generateSieveSteps, DEFAULT_SIEVE_INPUT } from '../sievePrimes';
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
});
