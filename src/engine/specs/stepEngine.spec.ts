import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { StrictMode } from "react";
import { useStepEngine } from "../stepEngine";
import { AlgorithmStep } from "../../types/dsa";

const makeStep = (stepIndex: number): AlgorithmStep => ({
  stepIndex,
  codeLine: stepIndex + 1,
  explanation: { what: `step ${stepIndex}`, why: "spec fixture" },
  primarySnapshot: { kind: "array", elements: [] },
  auxiliaryState: {},
  variables: {},
});

const makeSteps = (count: number): AlgorithmStep[] =>
  Array.from({ length: count }, (_, i) => makeStep(i));

interface HookProps {
  steps: AlgorithmStep[];
  onStepChange?: (step: AlgorithmStep) => void;
  defaultSpeed?: number;
}

// StrictMode wrapper mirrors the app's dev-mode double-invoked effects, the
// original source of double-fired sounds.
const renderEngine = (initialProps: HookProps) =>
  renderHook(
    ({ steps, onStepChange, defaultSpeed }: HookProps) =>
      useStepEngine({ steps, onStepChange, defaultSpeed }),
    { initialProps, wrapper: StrictMode },
  );

describe("useStepEngine onStepChange notifications", () => {
  it("does not fire onStepChange on mount", () => {
    const onStepChange = vi.fn();
    renderEngine({ steps: makeSteps(3), onStepChange });
    expect(onStepChange).not.toHaveBeenCalled();
  });

  it("fires exactly once per index change despite StrictMode double rendering", () => {
    const steps = makeSteps(3);
    const onStepChange = vi.fn();
    const { result } = renderEngine({ steps, onStepChange });

    act(() => result.current.stepForward());

    expect(onStepChange).toHaveBeenCalledTimes(1);
    expect(onStepChange).toHaveBeenCalledWith(steps[1]);
  });

  it("does not fire again for the same index", () => {
    const steps = makeSteps(4);
    const onStepChange = vi.fn();
    const { result } = renderEngine({ steps, onStepChange });

    act(() => result.current.goToStep(2));
    expect(onStepChange).toHaveBeenCalledTimes(1);

    act(() => result.current.goToStep(2));
    expect(onStepChange).toHaveBeenCalledTimes(1);
  });

  it("does not fire when stepping backward at the lower boundary", () => {
    const onStepChange = vi.fn();
    const { result } = renderEngine({ steps: makeSteps(3), onStepChange });

    act(() => result.current.stepBackward());
    expect(onStepChange).not.toHaveBeenCalled();
    expect(result.current.currentStepIndex).toBe(0);
  });

  it("fires on stepForward, stepBackward, and goToStep", () => {
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

  it("resets silently when the steps array changes", () => {
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

  it("supports omitting onStepChange entirely", () => {
    const { result } = renderEngine({ steps: makeSteps(2) });
    expect(() => {
      act(() => result.current.stepForward());
    }).not.toThrow();
    expect(result.current.currentStepIndex).toBe(1);
  });
});

/* The actions the ArrowRight/ArrowLeft/Space shortcuts bind to (DESIGN.md R6.6).
   Fake timers keep the playback interval from firing on its own, so each
   assertion is about the action rather than about wall-clock luck. */
describe("useStepEngine actions behind the playback shortcuts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("togglePlay starts playback without moving the index, then stops it", () => {
    const { result } = renderEngine({ steps: makeSteps(4) });

    act(() => result.current.togglePlay());
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentStepIndex).toBe(0);

    act(() => result.current.togglePlay());
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentStepIndex).toBe(0);
  });

  it("advances one step per interval while playing and notifies once each", () => {
    const steps = makeSteps(4);
    const onStepChange = vi.fn();
    const { result } = renderEngine({ steps, onStepChange });

    act(() => result.current.togglePlay());

    act(() => {
      vi.advanceTimersByTime(result.current.speed);
    });
    expect(result.current.currentStepIndex).toBe(1);
    expect(onStepChange).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(result.current.speed);
    });
    expect(result.current.currentStepIndex).toBe(2);
    expect(onStepChange).toHaveBeenCalledTimes(2);
    expect(onStepChange).toHaveBeenLastCalledWith(steps[2]);

    act(() => result.current.togglePlay());
    act(() => {
      vi.advanceTimersByTime(result.current.speed * 5);
    });
    expect(result.current.currentStepIndex).toBe(2);
    expect(onStepChange).toHaveBeenCalledTimes(2);
  });

  it("stops playback at the last step so Space restarts from the beginning", () => {
    const { result } = renderEngine({ steps: makeSteps(3) });

    act(() => result.current.goToStep(2));
    act(() => result.current.togglePlay());
    act(() => {
      vi.advanceTimersByTime(result.current.speed * 3);
    });
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentStepIndex).toBe(2);

    // From the end, play rewinds instead of sitting still.
    act(() => result.current.togglePlay());
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.isPlaying).toBe(true);
  });

  it("clamps stepForward at the last step and stepBackward at the first", () => {
    const { result } = renderEngine({ steps: makeSteps(2) });

    act(() => result.current.stepBackward());
    expect(result.current.currentStepIndex).toBe(0);

    act(() => result.current.stepForward());
    act(() => result.current.stepForward());
    expect(result.current.currentStepIndex).toBe(1);

    act(() => result.current.stepBackward());
    expect(result.current.currentStepIndex).toBe(0);
  });

  it("handles empty steps array gracefully across all controls", () => {
    const { result } = renderEngine({ steps: [] });

    expect(result.current.totalSteps).toBe(0);
    expect(result.current.currentStep).toBeNull();

    act(() => result.current.play());
    expect(result.current.isPlaying).toBe(false);

    act(() => result.current.togglePlay());
    expect(result.current.isPlaying).toBe(false);

    act(() => result.current.stepForward());
    expect(result.current.currentStepIndex).toBe(0);

    act(() => result.current.stepBackward());
    expect(result.current.currentStepIndex).toBe(0);

    act(() => result.current.goToStep(2));
    expect(result.current.currentStepIndex).toBe(0);
  });

  it("resets, changes speed, and ignores out-of-bound goToStep indices", () => {
    const { result } = renderEngine({ steps: makeSteps(5), defaultSpeed: 300 });

    expect(result.current.speed).toBe(300);
    act(() => result.current.setSpeed(150));
    expect(result.current.speed).toBe(150);

    act(() => result.current.goToStep(3));
    expect(result.current.currentStepIndex).toBe(3);

    act(() => result.current.goToStep(-1));
    expect(result.current.currentStepIndex).toBe(3);

    act(() => result.current.goToStep(100));
    expect(result.current.currentStepIndex).toBe(3);

    act(() => result.current.reset());
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.isPlaying).toBe(false);
  });

  it("rewinds to 0 when play() is called while at the end of the steps array", () => {
    const { result } = renderEngine({ steps: makeSteps(3) });

    act(() => result.current.goToStep(2));
    expect(result.current.currentStepIndex).toBe(2);

    act(() => result.current.play());
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.isPlaying).toBe(true);
  });

  it("starts playback without moving index when play() is called at step 0 of 3", () => {
    const { result } = renderEngine({ steps: makeSteps(3) });

    act(() => result.current.play());
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentStepIndex).toBe(0);
  });
});
