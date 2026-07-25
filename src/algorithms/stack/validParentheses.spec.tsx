import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../components/MainLayout';
import {
  DEFAULT_VALID_PARENTHESES_INPUT,
  generateValidParenthesesSteps,
  validParentheses,
} from './validParentheses';

describe('ValidParentheses React Component Spec', () => {
  it('renders valid parentheses title and header details', () => {
    const steps = generateValidParenthesesSteps(DEFAULT_VALID_PARENTHESES_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={validParentheses}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Valid Parentheses')).toBeInTheDocument();
    expect(
      screen.getByText(/Determine if an input string of brackets/i)
    ).toBeInTheDocument();
  });

  it('renders call stack auxiliary panel during bracket pushing/popping', () => {
    const steps = generateValidParenthesesSteps(DEFAULT_VALID_PARENTHESES_INPUT);
    // step index 3 has stack pushed
    const stepWithStack = steps.find((s) => (s.auxiliaryState.stack?.length ?? 0) > 0) || steps[1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={validParentheses}
        currentStep={stepWithStack}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText(/Call Stack \(LIFO\)/i)).toBeInTheDocument();
  });
});
