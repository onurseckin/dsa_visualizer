import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../components/MainLayout';
import { DEFAULT_PREFIX_SUM_INPUT, generatePrefixSumSteps, prefixSum } from './prefixSum';

describe('PrefixSum React Component Spec', () => {
  it('renders algorithm title and problem header', () => {
    const steps = generatePrefixSumSteps(DEFAULT_PREFIX_SUM_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={prefixSum}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Prefix Sum')).toBeInTheDocument();
    expect(
      screen.getByText(/Computes cumulative prefix sums for an array/i)
    ).toBeInTheDocument();
  });

  it('renders step explanation and auxiliary prefix sum array state', () => {
    const steps = generatePrefixSumSteps(DEFAULT_PREFIX_SUM_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={prefixSum}
        currentStep={lastStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText(/Complete Prefix Sum Array/i)).toBeInTheDocument();
    expect(screen.getByText(/Auxiliary Helper Data Structures/i)).toBeInTheDocument();
  });
});
