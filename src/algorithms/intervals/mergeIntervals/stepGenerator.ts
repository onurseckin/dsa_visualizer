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
  const rawIntervals = Array.isArray(input?.intervals) ? input.intervals : [];

  let stepIdx = 0;

  // Line 1: Function entry
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: `Initialize interval consolidation for ${rawIntervals.length} range(s).`,
      why: "Consolidating overlapping intervals into a minimal disjoint set that covers the exact same numerical range.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createIntervalArrayElements(rawIntervals),
    },
    auxiliaryState: {
      customState: {
        totalInputIntervals: rawIntervals.length,
        status: "Function entry",
      },
    },
    variables: { totalIntervals: rawIntervals.length },
  });

  // Line 2: Empty input check
  if (rawIntervals.length === 0) {
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 2,
      explanation: {
        what: "Check for empty input intervals list.",
        why: "Input list contains no intervals; skipping sorting to return empty result immediately.",
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

    // Line 3: Return empty list
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 3,
      explanation: {
        what: "Return empty list [].",
        why: "No intervals exist to process, so the minimal disjoint set is empty.",
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

  // Line 2: Empty check evaluates to false
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 2,
    explanation: {
      what: `Verify non-empty input (${rawIntervals.length} interval(s) present).`,
      why: "Non-empty collection confirmed; proceeding to sort intervals by start coordinate.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createIntervalArrayElements(rawIntervals),
    },
    auxiliaryState: {
      customState: { totalInputIntervals: rawIntervals.length },
    },
    variables: { totalIntervals: rawIntervals.length },
  });

  // Line 4: Sort intervals by start time
  const intervals = rawIntervals
    .map((item) => ({ ...item }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 4,
    explanation: {
      what: `Sort ${intervals.length} intervals by start coordinate.`,
      why: "Sorting guarantees that any potentially overlapping or contiguous intervals will appear adjacent in sequence.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createIntervalArrayElements(intervals),
    },
    auxiliaryState: {
      customState: {
        sortedIntervals: intervals.map(formatInterval).join(", "),
        merged: "[]",
      },
    },
    variables: {
      count: intervals.length,
      sorted: true,
    },
  });

  // Line 5: Initialize merged array with first interval
  const merged: IntervalItem[] = [{ ...intervals[0] }];

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 5,
    explanation: {
      what: `Seed merged result with earliest sorted interval ${formatInterval(intervals[0])}.`,
      why: "The first sorted interval forms the initial active block against which subsequent intervals are evaluated.",
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

  // Line 6: Loop through remaining intervals
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];

    // Line 6: Loop header
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 6,
      explanation: {
        what: `Inspect next candidate interval ${formatInterval(current)} (${i}/${intervals.length - 1}).`,
        why: "Fetching the next sorted interval to test against the current active merged block.",
      },
      primarySnapshot: {
        kind: "array",
        elements: createIntervalArrayElements(intervals, i, "active"),
      },
      auxiliaryState: {
        customState: {
          status: `Processing interval ${i}`,
          current: formatInterval(current),
          merged: merged.map(formatInterval).join(", "),
        },
      },
      variables: {
        i,
        currentStart: current.start,
        currentEnd: current.end,
      },
    });

    const prev = merged[merged.length - 1];

    // Line 7: Get last merged interval
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 7,
      explanation: {
        what: `Retrieve active merged block ${formatInterval(prev)}.`,
        why: "Because intervals are sorted by start time, comparing against only the last merged block is necessary and sufficient.",
      },
      primarySnapshot: {
        kind: "array",
        elements: createIntervalArrayElements(intervals, i, "compare"),
      },
      auxiliaryState: {
        customState: {
          prevBlock: formatInterval(prev),
          current: formatInterval(current),
          merged: merged.map(formatInterval).join(", "),
        },
      },
      variables: {
        prevStart: prev.start,
        prevEnd: prev.end,
      },
    });

    const overlaps = current.start <= prev.end;

    // Line 8: Check overlap condition
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 8,
      explanation: {
        what: `Evaluate overlap: current start ${current.start} ≤ active block end ${prev.end} (${overlaps ? "TRUE" : "FALSE"}).`,
        why: overlaps
          ? `Interval ${formatInterval(current)} starts before or at active block end ${prev.end}. Overlap confirmed!`
          : `Interval ${formatInterval(current)} starts after active block end ${prev.end}. Disjoint gap detected!`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createIntervalArrayElements(intervals, i, overlaps ? "swap" : "active"),
      },
      auxiliaryState: {
        customState: {
          overlapCondition: `${current.start} <= ${prev.end}`,
          overlaps: overlaps ? "True" : "False",
          merged: merged.map(formatInterval).join(", "),
        },
      },
      variables: {
        overlaps,
        currentStart: current.start,
        prevEnd: prev.end,
      },
    });

    if (overlaps) {
      const oldEnd = prev.end;
      prev.end = Math.max(prev.end, current.end);

      // Line 9: Update prev[1] with max
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 9,
        explanation: {
          what: `Extend active block end coordinate to max(${oldEnd}, ${current.end}) = ${prev.end}.`,
          why: "Taking max() expands active range while preserving full coverage if the candidate interval is nested.",
        },
        primarySnapshot: {
          kind: "array",
          elements: createIntervalArrayElements(intervals, i, "sorted"),
        },
        auxiliaryState: {
          customState: {
            status: "Merged overlapping block",
            updatedBlock: formatInterval(prev),
            merged: merged.map(formatInterval).join(", "),
          },
        },
        variables: {
          oldEnd,
          newEnd: prev.end,
          mergedCount: merged.length,
        },
      });
    } else {
      // Line 10: else branch taken
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 10,
        explanation: {
          what: `Branch to seal active block ${formatInterval(prev)}.`,
          why: "Current interval starts strictly after active block ends; the previous range is now complete.",
        },
        primarySnapshot: {
          kind: "array",
          elements: createIntervalArrayElements(intervals, i, "active"),
        },
        auxiliaryState: {
          customState: {
            status: "No overlap - branching to append",
            current: formatInterval(current),
            merged: merged.map(formatInterval).join(", "),
          },
        },
        variables: {
          mergedCount: merged.length,
        },
      });

      merged.push({ ...current });

      // Line 11: append current
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 11,
        explanation: {
          what: `Append new disjoint interval block ${formatInterval(current)} to merged list.`,
          why: "Starts a new active merged block for subsequent comparisons.",
        },
        primarySnapshot: {
          kind: "array",
          elements: createIntervalArrayElements(intervals, i, "sorted"),
        },
        auxiliaryState: {
          customState: {
            status: "Appended new interval block",
            newBlock: formatInterval(current),
            merged: merged.map(formatInterval).join(", "),
          },
        },
        variables: {
          mergedCount: merged.length,
        },
      });
    }
  }

  // Line 12: Return merged list
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 12,
    explanation: {
      what: `Final merged result: ${merged.length} disjoint interval(s).`,
      why: `Linear pass complete. Merged ranges: ${merged.map(formatInterval).join(", ")}.`,
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
