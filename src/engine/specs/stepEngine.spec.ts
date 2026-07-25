import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StrictMode } from 'react';
import { useStepEngine } from '../stepEngine';
import { AlgorithmStep } from '../../types/dsa';

const makeStep = (stepIndex: number): AlgorithmStep => ({
  stepIndex,
  codeLine: stepIndex + 1,
  explanation: { what: `step ${stepIndex}`, why: 'spec fixture' },
  primarySnapshot: { kind: 'array', elements: [] },
  auxiliaryState: {},
  variables: {},
});

const makeSteps = (count: number): AlgorithmStep[] =>
  Array.from({ length: count }, (_, i) => makeStep(i));

interface HookProps {
  steps: AlgorithmStep[];
  onStepChange?: (step: AlgorithmStep) => void;
}

// StrictMode wrapper mirrors the app's dev-mode double-invoked effects, the
// original source of double-fired sounds.
const renderEngine = (initialProps: HookProps) =>
  renderHook(
    ({ steps, onStepChange }: HookProps) =>
      useStepEngine({ steps, soundEnabled: true, onStepChange }),
    { initialProps, wrapper: StrictMode }
  );

describe('useStepEngine onStepChange notifications', () => {
  it('does not fire onStepChange on mount', () => {
    const onStepChange = vi.fn();
    renderEngine({ steps: makeSteps(3), onStepChange });
    expect(onStepChange).not.toHaveBeenCalled();
  });

  it('fires exactly once per index change despite StrictMode double rendering', () => {
    const steps = makeSteps(3);
    const onStepChange = vi.fn();
    const { result } = renderEngine({ steps, onStepChange });

    act(() => result.current.stepForward());

    expect(onStepChange).toHaveBeenCalledTimes(1);
    expect(onStepChange).toHaveBeenCalledWith(steps[1]);
  });

  it('does not fire again for the same index', () => {
    const steps = makeSteps(4);
    const onStepChange = vi.fn();
    const { result } = renderEngine({ steps, onStepChange });

    act(() => result.current.goToStep(2));
    expect(onStepChange).toHaveBeenCalledTimes(1);

    act(() => result.current.goToStep(2));
    expect(onStepChange).toHaveBeenCalledTimes(1);
  });

  it('does not fire when stepping backward at the lower boundary', () => {
    const onStepChange = vi.fn();
    const { result } = renderEngine({ steps: makeSteps(3), onStepChange });

    act(() => result.current.stepBackward());
    expect(onStepChange).not.toHaveBeenCalled();
    expect(result.current.currentStepIndex).toBe(0);
  });

  it('fires on stepForward, stepBackward, and goToStep', () => {
    const steps = makeSteps(5);
    const onStepChange = vi.fn();
    const { result } = renderEngine({ steps, onStepChange });

    act(() => result.current.stepForward());
    expect(onStepChange).toHaveBeenLastCalledWith(steps[1]);

    act(() => result.current.stepForward());
    expect(onStepChange).toHaveBeenLastCalledWith(steps[2]);

    act(() => result.current.stepBackward());
    expect(onStepChange).toHaveBeenLastCalledWith(steps[1]);

    act(() => result.current.goToStep(4));
    expect(onStepChange).toHaveBeenLastCalledWith(steps[4]);

    act(() => result.current.goToStep(0));
    expect(onStepChange).toHaveBeenLastCalledWith(steps[0]);

    expect(onStepChange).toHaveBeenCalledTimes(5);
  });

  it('resets silently when the steps array changes', () => {
    const stepsA = makeSteps(3);
    const stepsB = makeSteps(4);
    const onStepChange = vi.fn();
    const { result, rerender } = renderEngine({ steps: stepsA, onStepChange });

    act(() => result.current.stepForward());
    expect(onStepChange).toHaveBeenCalledTimes(1);

    act(() => rerender({ steps: stepsB, onStepChange }));

    // Algorithm switch: index snaps back to 0 without a notification (no sound).
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.totalSteps).toBe(4);
    expect(onStepChange).toHaveBeenCalledTimes(1);

    // Notification tracking is re-armed against the new steps array.
    act(() => result.current.stepForward());
    expect(onStepChange).toHaveBeenCalledTimes(2);
    expect(onStepChange).toHaveBeenLastCalledWith(stepsB[1]);
  });

  it('supports omitting onStepChange entirely', () => {
    const { result } = renderEngine({ steps: makeSteps(2) });
    expect(() => {
      act(() => result.current.stepForward());
    }).not.toThrow();
    expect(result.current.currentStepIndex).toBe(1);
  });
});
