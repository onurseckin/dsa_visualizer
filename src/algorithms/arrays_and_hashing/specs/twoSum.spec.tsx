import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { DEFAULT_TWO_SUM_INPUT, generateTwoSumSteps, twoSum } from '../twoSum';

describe('TwoSum React Component Spec', () => {
  it('renders title and algorithm description', () => {
    const steps = generateTwoSumSteps(DEFAULT_TWO_SUM_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={twoSum}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Two Sum')).toBeInTheDocument();

    // Problem details are collapsed by default; expand them to reveal the description.
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(
      screen.getByText(/Given an array of integers nums and an integer target/i)
    ).toBeInTheDocument();
  });

  it('renders step visualizer with hash map auxiliary state', () => {
    const steps = generateTwoSumSteps(DEFAULT_TWO_SUM_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={twoSum}
        currentStep={lastStep}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getAllByText(/Return indices/i)[0]).toBeInTheDocument();
  });
});
