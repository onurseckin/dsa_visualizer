import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ArrayVisualizer from '../../../components/primitives/ArrayVisualizer';
import {
  generateKthLargestSteps,
  DEFAULT_KTH_LARGEST_INPUT,
} from '../kthLargestElement';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('kthLargestElement React spec (category root)', () => {
  it('renders ArrayVisualizer correctly', () => {
    const steps = generateKthLargestSteps(DEFAULT_KTH_LARGEST_INPUT);
    const snapshot = steps[steps.length - 1].primarySnapshot as ArrayVisualSnapshot;

    render(
      <ArrayVisualizer
        elements={snapshot.elements}
        title="Kth Largest Element"
      />
    );

    expect(screen.getByText('Kth Largest Element')).toBeInTheDocument();
  });
});
