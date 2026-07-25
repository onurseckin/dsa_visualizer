import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ArrayVisualizer from '../../../components/primitives/ArrayVisualizer';
import {
  generateCountingBitsSteps,
  DEFAULT_COUNTING_BITS_INPUT,
} from '../countingBits';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('countingBits React component spec', () => {
  it('renders ArrayVisualizer with counting bits snapshot', () => {
    const steps = generateCountingBitsSteps(DEFAULT_COUNTING_BITS_INPUT);
    const snapshot = steps[steps.length - 1].primarySnapshot as ArrayVisualSnapshot;

    render(
      <ArrayVisualizer
        elements={snapshot.elements}
        title="Counting Bits DP Array"
      />
    );

    expect(screen.getByText('Counting Bits DP Array')).toBeInTheDocument();
  });
});
