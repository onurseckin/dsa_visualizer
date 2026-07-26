import type { AlgorithmStep, ArrayElement, ElementState } from "../../../types/dsa";

export interface IntervalItem {
  start: number;
  end: number;
}

export interface MergeIntervalsInput {
  intervals: IntervalItem[];
}

function formatInterval(interval: IntervalItem): string {
  return `[${interval.start}, ${interval.end}]`;
}

function createIntervalArrayElements(
  intervals: IntervalItem[],
  currentIdx: number = -1,
  activeState: ElementState = "active",
): ArrayElement[] {
  return intervals.map((item, idx) => {
    let state: ElementState = "default";
    const pointers: string[] = [formatInterval(item)];

    if (idx === currentIdx) {
      state = activeState;
      pointers.push("curr");
    }

    return {
      id: `interval-${idx}-${item.start}-${item.end}`,
      value: item.start,
      state,
      pointers,
    };
  });
}

export function generateMergeIntervalsSteps(input: MergeIntervalsInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const rawIntervals = input.intervals || [];

  if (rawIntervals.length === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 2,
      explanation: {
        what: "Return an empty result",
        why: "There are no intervals to merge, so we simply hand back an empty list.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: {
        customState: { merged: "[]" },
      },
      variables: { totalIntervals: 0 },
    });
    return steps;
  }

  const intervals = rawIntervals.map((item) => ({ ...item })).sort((a, b) => a.start - b.start);
  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 4,
    explanation: {
      what: `Sort ${intervals.length} intervals by start`,
      why: "We sort by start time so that any two intervals that overlap end up next to each other. That lets us merge everything in one left-to-right walk.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createIntervalArrayElements(intervals),
    },
    auxiliaryState: {
      customState: {
        intervals: intervals.map(formatInterval).join(", "),
        merged: "[]",
      },
    },
    variables: {
      count: intervals.length,
      sorted: true,
    },
  });

  const merged: IntervalItem[] = [{ ...intervals[0] }];

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 5,
    explanation: {
      what: `Start merged list with ${formatInterval(intervals[0])}`,
      why: "We take the first sorted interval as our running interval — every later interval will either stretch it or start a fresh one.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createIntervalArrayElements(intervals, 0, "queued"),
    },
    auxiliaryState: {
      customState: {
        merged: merged.map(formatInterval).join(", "),
        lastMerged: formatInterval(merged[merged.length - 1]),
      },
    },
    variables: {
      mergedCount: merged.length,
    },
  });

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const prev = merged[merged.length - 1];

    if (current.start <= prev.end) {
      const oldEnd = prev.end;
      prev.end = Math.max(prev.end, current.end);

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 9,
        explanation: {
          what: `Merge overlapping interval ${formatInterval(current)}`,
          why: `This interval starts at ${current.start}, before the previous one ends at ${oldEnd}, so they overlap. We stretch the running interval's end to max(${oldEnd}, ${current.end}) = ${prev.end}, giving ${formatInterval(prev)}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: createIntervalArrayElements(intervals, i, "swap"),
        },
        auxiliaryState: {
          customState: {
            status: "Merged overlap",
            current: formatInterval(current),
            updatedInterval: formatInterval(prev),
            merged: merged.map(formatInterval).join(", "),
          },
        },
        variables: {
          i,
          currentStart: current.start,
          prevEnd: oldEnd,
          mergedEnd: prev.end,
        },
      });
    } else {
      merged.push({ ...current });

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 11,
        explanation: {
          what: `Start new interval ${formatInterval(current)}`,
          why: `This interval begins at ${current.start}, after the previous one ends at ${prev.end}, so there is a real gap between them. We close out ${formatInterval(prev)} and start tracking ${formatInterval(current)} on its own.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: createIntervalArrayElements(intervals, i, "active"),
        },
        auxiliaryState: {
          customState: {
            status: "New interval appended",
            current: formatInterval(current),
            merged: merged.map(formatInterval).join(", "),
          },
        },
        variables: {
          i,
          currentStart: current.start,
          prevEnd: prev.end,
          mergedCount: merged.length,
        },
      });
    }
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 12,
    explanation: {
      what: `Return ${merged.length} merged interval(s)`,
      why: `Every interval has been folded in, leaving ${merged.map(formatInterval).join(", ")} — non-overlapping pieces that cover exactly the same ground as the input. The sort was the expensive part; the merge itself was a single pass.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: intervals.map((item, idx) => ({
        id: `interval-final-${idx}`,
        value: item.start,
        state: "sorted",
        pointers: [formatInterval(item)],
      })),
    },
    auxiliaryState: {
      customState: {
        mergedResult: merged.map(formatInterval).join(", "),
      },
    },
    variables: {
      finalMergedCount: merged.length,
      completed: true,
    },
  });

  return steps;
}
