import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { generateKadaneMaxSubarraySteps, kadaneMaxSubarray } from '../kadaneMaxSubarray';

describe('KadaneMaxSubarray React Component Spec', () => {
  it('renders algorithm title and problem description', () => {
    const steps = generateKadaneMaxSubarraySteps(kadaneMaxSubarray.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={kadaneMaxSubarray}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText("Kadane's Algorithm (Maximum Subarray)")).toBeInTheDocument();

    // Problem details render expanded, so the description needs no disclosure click.
    expect(
      screen.getByText(/Kadane's Algorithm finds the maximum sum of a contiguous subarray/i)
    ).toBeInTheDocument();
    expect(screen.getByText(kadaneMaxSubarray.topicGuide.overview)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: kadaneMaxSubarray.topicGuide.sections[0].heading })
    ).toBeInTheDocument();
    expect(screen.getByText('Key terms')).toBeInTheDocument();
  });

  it('renders step explanation for completed state', () => {
    const steps = generateKadaneMaxSubarraySteps(kadaneMaxSubarray.defaultInput);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={kadaneMaxSubarray}
        currentStep={lastStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText(/Kadane's scan complete/i)).toBeInTheDocument();
  });
});
