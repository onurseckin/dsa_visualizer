/**
 * Interactive Step Replay & Time-Travel Debugger
 *
 * Implements deterministic execution recording, fine-grained bidirectional state diffing,
 * instantaneous time-travel stepping, and conditional breakpoint evaluation for algorithm animations.
 */

import type { CourseVisualStep, MemoryCellTrace } from "./stepperAdapters";

export interface VariableDiff {
  readonly name: string;
  readonly previousValue?: string | number | boolean | readonly unknown[];
  readonly currentValue?: string | number | boolean | readonly unknown[];
  readonly kind: "created" | "updated" | "deleted";
}

export interface MemoryCellDiff {
  readonly address: string;
  readonly label: string;
  readonly previousValue?: string | number;
  readonly currentValue?: string | number;
  readonly previousCacheHit?: boolean;
  readonly currentCacheHit?: boolean;
  readonly isDirty?: boolean;
}

export interface StepStateDiff {
  readonly fromStepIndex: number;
  readonly toStepIndex: number;
  readonly variableDiffs: readonly VariableDiff[];
  readonly memoryDiffs: readonly MemoryCellDiff[];
  readonly invariantChanged: boolean;
  readonly previousInvariant?: string;
  readonly currentInvariant?: string;
  readonly lineChanged: boolean;
  readonly previousLine: number;
  readonly currentLine: number;
}

export interface ExecutionCheckpoint {
  readonly stepIndex: number;
  readonly step: CourseVisualStep;
  readonly forwardDiff?: StepStateDiff;
  readonly backwardDiff?: StepStateDiff;
}

export interface ConditionalBreakpoint {
  readonly id: string;
  readonly label: string;
  readonly predicate: (step: CourseVisualStep, diff?: StepStateDiff) => boolean;
}

export type TimeTravelPlaybackState = "idle" | "playing" | "paused" | "completed";

/**
 * Computes deep state difference between two CourseVisualStep snapshots.
 */
export function computeStepDiff(
  fromStep: CourseVisualStep,
  toStep: CourseVisualStep,
  fromIndex: number,
  toIndex: number,
): StepStateDiff {
  // 1. Variable Diffs
  const varDiffs: VariableDiff[] = [];
  const fromVars = fromStep.variables ?? {};
  const toVars = toStep.variables ?? {};

  const allVarKeys = new Set([...Object.keys(fromVars), ...Object.keys(toVars)]);

  for (const key of allVarKeys) {
    const hasPrev = key in fromVars;
    const hasCurr = key in toVars;

    if (!hasPrev && hasCurr) {
      varDiffs.push({
        name: key,
        currentValue: toVars[key],
        kind: "created",
      });
    } else if (hasPrev && !hasCurr) {
      varDiffs.push({
        name: key,
        previousValue: fromVars[key],
        kind: "deleted",
      });
    } else {
      const prevVal = fromVars[key];
      const currVal = toVars[key];
      const isDiff =
        Array.isArray(prevVal) && Array.isArray(currVal)
          ? JSON.stringify(prevVal) !== JSON.stringify(currVal)
          : prevVal !== currVal;

      if (isDiff) {
        varDiffs.push({
          name: key,
          previousValue: prevVal,
          currentValue: currVal,
          kind: "updated",
        });
      }
    }
  }

  // 2. Memory Cell Diffs
  const memDiffs: MemoryCellDiff[] = [];
  const fromMem = new Map<string, MemoryCellTrace>(
    (fromStep.memoryTrace ?? []).map((m) => [m.address, m]),
  );
  const toMem = new Map<string, MemoryCellTrace>(
    (toStep.memoryTrace ?? []).map((m) => [m.address, m]),
  );

  const allMemAddresses = new Set([...fromMem.keys(), ...toMem.keys()]);

  for (const addr of allMemAddresses) {
    const prevCell = fromMem.get(addr);
    const currCell = toMem.get(addr);

    if (!prevCell && currCell) {
      memDiffs.push({
        address: addr,
        label: currCell.label,
        currentValue: currCell.value,
        currentCacheHit: currCell.isCacheHit,
        isDirty: currCell.isDirty,
      });
    } else if (prevCell && !currCell) {
      memDiffs.push({
        address: addr,
        label: prevCell.label,
        previousValue: prevCell.value,
        previousCacheHit: prevCell.isCacheHit,
        isDirty: prevCell.isDirty,
      });
    } else if (prevCell && currCell) {
      const valChanged = prevCell.value !== currCell.value;
      const hitChanged = prevCell.isCacheHit !== currCell.isCacheHit;
      const dirtyChanged = prevCell.isDirty !== currCell.isDirty;

      if (valChanged || hitChanged || dirtyChanged) {
        memDiffs.push({
          address: addr,
          label: currCell.label,
          previousValue: prevCell.value,
          currentValue: currCell.value,
          previousCacheHit: prevCell.isCacheHit,
          currentCacheHit: currCell.isCacheHit,
          isDirty: currCell.isDirty,
        });
      }
    }
  }

  const invariantChanged = fromStep.activeInvariant !== toStep.activeInvariant;
  const lineChanged = fromStep.codeLine !== toStep.codeLine;

  return {
    fromStepIndex: fromIndex,
    toStepIndex: toIndex,
    variableDiffs: varDiffs,
    memoryDiffs: memDiffs,
    invariantChanged,
    previousInvariant: fromStep.activeInvariant,
    currentInvariant: toStep.activeInvariant,
    lineChanged,
    previousLine: fromStep.codeLine,
    currentLine: toStep.codeLine,
  };
}

/**
 * Deterministic Execution Recorder that analyzes step transitions and builds checkpoints.
 */
export class ExecutionRecorder {
  private readonly stepsList: readonly CourseVisualStep[];
  private readonly checkpointsList: readonly ExecutionCheckpoint[];

  constructor(steps: readonly CourseVisualStep[]) {
    this.stepsList = [...steps];

    const checkpoints: ExecutionCheckpoint[] = [];
    const n = steps.length;

    for (let i = 0; i < n; i++) {
      const step = steps[i];
      const forwardDiff = i < n - 1 ? computeStepDiff(step, steps[i + 1], i, i + 1) : undefined;
      const backwardDiff = i > 0 ? computeStepDiff(step, steps[i - 1], i, i - 1) : undefined;

      checkpoints.push({
        stepIndex: i,
        step,
        forwardDiff,
        backwardDiff,
      });
    }

    this.checkpointsList = Object.freeze(checkpoints);
  }

  get totalSteps(): number {
    return this.stepsList.length;
  }

  get steps(): readonly CourseVisualStep[] {
    return this.stepsList;
  }

  get checkpoints(): readonly ExecutionCheckpoint[] {
    return this.checkpointsList;
  }

  getCheckpoint(index: number): ExecutionCheckpoint | undefined {
    return this.checkpointsList[index];
  }
}

/**
 * Factory utilities for creating conditional breakpoints.
 */
export const BreakpointFactory = {
  createVariableBreakpoint(
    varName: string,
    predicate: (value: unknown) => boolean,
    label?: string,
  ): ConditionalBreakpoint {
    return {
      id: `bp_var_${varName}_${Date.now()}`,
      label: label ?? `Variable '${varName}' predicate match`,
      predicate: (step) => {
        const val = step.variables?.[varName];
        return val !== undefined && predicate(val);
      },
    };
  },

  createCacheMissBreakpoint(label?: string): ConditionalBreakpoint {
    return {
      id: `bp_cache_miss_${Date.now()}`,
      label: label ?? "Cache Miss / Memory Stall Trigger",
      predicate: (step) => {
        return (step.memoryTrace ?? []).some((m) => m.isCacheHit === false);
      },
    };
  },

  createInvariantViolationBreakpoint(label?: string): ConditionalBreakpoint {
    return {
      id: `bp_invariant_violation_${Date.now()}`,
      label: label ?? "Invariant Violation / Anomaly Trigger",
      predicate: (step) => {
        const inv = (step.activeInvariant ?? "").toLowerCase();
        const desc = (step.description ?? "").toLowerCase();
        const title = (step.title ?? "").toLowerCase();
        const varsStr = JSON.stringify(step.variables ?? {}).toLowerCase();
        const combined = `${inv} ${desc} ${title} ${varsStr}`;
        return (
          combined.includes("violation") ||
          combined.includes("invalid") ||
          combined.includes("hazard") ||
          combined.includes("overflow") ||
          combined.includes("corrupt")
        );
      },
    };
  },

  createLineBreakpoint(targetLine: number, label?: string): ConditionalBreakpoint {
    return {
      id: `bp_line_${targetLine}_${Date.now()}`,
      label: label ?? `Execution reaches line ${targetLine}`,
      predicate: (step) => step.codeLine === targetLine,
    };
  },
};

/**
 * Interactive Time-Travel Stepping Controller with breakpoint support and playback control.
 */
export class TimeTravelController {
  private readonly recorderInst: ExecutionRecorder;
  private currIndex: number = 0;
  private playbackStatus: TimeTravelPlaybackState = "idle";
  private playTimerId: ReturnType<typeof setInterval> | null = null;
  private readonly breakpointsMap: Map<string, ConditionalBreakpoint> = new Map();

  constructor(steps: readonly CourseVisualStep[]) {
    this.recorderInst = new ExecutionRecorder(steps);
    this.currIndex = 0;
  }

  get recorder(): ExecutionRecorder {
    return this.recorderInst;
  }

  get currentIndex(): number {
    return this.currIndex;
  }

  get totalSteps(): number {
    return this.recorderInst.totalSteps;
  }

  get currentStep(): CourseVisualStep | undefined {
    return this.recorderInst.getCheckpoint(this.currIndex)?.step;
  }

  get currentCheckpoint(): ExecutionCheckpoint | undefined {
    return this.recorderInst.getCheckpoint(this.currIndex);
  }

  get playbackState(): TimeTravelPlaybackState {
    return this.playbackStatus;
  }

  get isAtStart(): boolean {
    return this.currIndex === 0;
  }

  get isAtEnd(): boolean {
    return this.currIndex >= this.recorderInst.totalSteps - 1;
  }

  // Breakpoint Management
  addBreakpoint(bp: ConditionalBreakpoint): void {
    this.breakpointsMap.set(bp.id, bp);
  }

  removeBreakpoint(id: string): void {
    this.breakpointsMap.delete(id);
  }

  clearBreakpoints(): void {
    this.breakpointsMap.clear();
  }

  get breakpoints(): readonly ConditionalBreakpoint[] {
    return Array.from(this.breakpointsMap.values());
  }

  /**
   * Advances execution forward by 1 step.
   */
  stepForward(): { step?: CourseVisualStep; diff?: StepStateDiff } {
    if (this.isAtEnd) {
      this.playbackStatus = "completed";
      return { step: this.currentStep };
    }

    const prevCp = this.recorderInst.getCheckpoint(this.currIndex);
    this.currIndex++;
    const currCp = this.recorderInst.getCheckpoint(this.currIndex);

    return {
      step: currCp?.step,
      diff: prevCp?.forwardDiff,
    };
  }

  /**
   * Rewinds execution backward by 1 step.
   */
  stepBackward(): { step?: CourseVisualStep; diff?: StepStateDiff } {
    if (this.isAtStart) {
      return { step: this.currentStep };
    }

    const prevCp = this.recorderInst.getCheckpoint(this.currIndex);
    this.currIndex--;
    const currCp = this.recorderInst.getCheckpoint(this.currIndex);

    return {
      step: currCp?.step,
      diff: prevCp?.backwardDiff,
    };
  }

  /**
   * Instantaneous random-access jump to arbitrary step index.
   */
  jumpToStep(targetIndex: number): CourseVisualStep | undefined {
    if (this.recorderInst.totalSteps === 0) return undefined;
    const clampedIndex = Math.max(0, Math.min(this.recorderInst.totalSteps - 1, targetIndex));
    this.currIndex = clampedIndex;

    if (this.currIndex >= this.recorderInst.totalSteps - 1) {
      this.playbackStatus = "completed";
    } else {
      this.playbackStatus = "paused";
    }

    return this.currentStep;
  }

  /**
   * Resumes execution until the next matching breakpoint or end of trace.
   */
  resumeUntilBreakpoint(): {
    hitBreakpoint?: ConditionalBreakpoint;
    stepsAdvanced: number;
    finalStep?: CourseVisualStep;
  } {
    let advanced = 0;
    const bpList = Array.from(this.breakpointsMap.values());

    // Check if initial step matches breakpoint when starting from idle at index 0
    if (this.currIndex === 0 && this.playbackStatus === "idle" && this.currentStep) {
      for (const bp of bpList) {
        if (bp.predicate(this.currentStep, undefined)) {
          this.playbackStatus = "paused";
          return {
            hitBreakpoint: bp,
            stepsAdvanced: 0,
            finalStep: this.currentStep,
          };
        }
      }
    }

    while (!this.isAtEnd) {
      const { step, diff } = this.stepForward();
      advanced++;

      if (step) {
        for (const bp of bpList) {
          if (bp.predicate(step, diff)) {
            this.playbackStatus = "paused";
            return {
              hitBreakpoint: bp,
              stepsAdvanced: advanced,
              finalStep: step,
            };
          }
        }
      }
    }

    this.playbackStatus = "completed";
    return {
      stepsAdvanced: advanced,
      finalStep: this.currentStep,
    };
  }

  /**
   * Begins animated playback at specified frames per second.
   */
  play(fps: number = 2, onStep?: (step: CourseVisualStep, diff?: StepStateDiff) => void): void {
    if (this.playbackStatus === "playing") return;

    if (this.isAtEnd) {
      this.currIndex = 0;
    }

    this.playbackStatus = "playing";
    const intervalMs = Math.max(50, 1000 / fps);

    this.playTimerId = setInterval(() => {
      if (this.isAtEnd) {
        this.pause();
        this.playbackStatus = "completed";
        return;
      }

      const { step, diff } = this.stepForward();
      if (step && onStep) {
        onStep(step, diff);
      }

      // Check breakpoints
      if (step) {
        for (const bp of this.breakpointsMap.values()) {
          if (bp.predicate(step, diff)) {
            this.pause();
            break;
          }
        }
      }
    }, intervalMs);
  }

  /**
   * Pauses active animated playback.
   */
  pause(): void {
    if (this.playTimerId) {
      clearInterval(this.playTimerId);
      this.playTimerId = null;
    }
    this.playbackStatus = "paused";
  }

  /**
   * Resets execution to step 0.
   */
  reset(): void {
    this.pause();
    this.currIndex = 0;
    this.playbackStatus = "idle";
  }
}
