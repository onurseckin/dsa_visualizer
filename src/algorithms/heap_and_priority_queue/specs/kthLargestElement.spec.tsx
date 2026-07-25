import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ArrayVisualizer from '../../../components/primitives/ArrayVisualizer';
import { MainLayout } from '../../../components/MainLayout';
import {
  kthLargestElement,
  generateKthLargestSteps,
  DEFAULT_KTH_LARGEST_INPUT,
} from '../kthLargestElement';

describe('kthLargestElement React Spec', () => {
  it('renders ArrayVisualizer correctly', () => {
    const steps = generateKthLargestSteps(DEFAULT_KTH_LARGEST_INPUT);
    const snapshot = steps[steps.length - 1].primarySnapshot;

    if (snapshot.kind === 'array') {
      render(
        <ArrayVisualizer
          elements={snapshot.elements}
          title="Kth Largest Element"
        />
      );
      expect(screen.getByText('Kth Largest Element')).toBeInTheDocument();
    }
  });

  it('renders MainLayout cleanly with kthLargestElement', () => {
    const steps = generateKthLargestSteps(DEFAULT_KTH_LARGEST_INPUT);
    render(
      <MainLayout
        algorithm={kthLargestElement}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />
    );
    expect(
      screen.getAllByText(/Kth Largest Element in an Array/i)[0]
    ).toBeInTheDocument();
  });
});
