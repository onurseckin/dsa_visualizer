import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
} from '../../types/dsa';

export interface IntervalItem {
  start: number;
  end: number;
}

export interface MergeIntervalsInput {
  intervals: IntervalItem[];
}

export const DEFAULT_MERGE_INTERVALS_INPUT: MergeIntervalsInput = {
  intervals: [
    { start: 1, end: 3 },
    { start: 2, end: 6 },
    { start: 8, end: 10 },
    { start: 15, end: 18 },
  ],
};

function formatInterval(interval: IntervalItem): string {
  return `[${interval.start}, ${interval.end}]`;
}

function createIntervalArrayElements(
  intervals: IntervalItem[],
  currentIdx: number = -1,
  activeState: ElementState = 'active'
): ArrayElement[] {
  return intervals.map((item, idx) => {
    let state: ElementState = 'default';
    const pointers: string[] = [formatInterval(item)];

    if (idx === currentIdx) {
      state = activeState;
      pointers.push('curr');
    }

    return {
      id: `interval-${idx}-${item.start}-${item.end}`,
      value: item.start,
      state,
      pointers,
    };
  });
}

export function generateMergeIntervalsSteps(
  input: MergeIntervalsInput
): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const rawIntervals = input.intervals || [];

  if (rawIntervals.length === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 2,
      explanation: {
        what: 'Return an empty result',
        why: 'There are no intervals to merge, so we simply hand back an empty list.',
      },
      primarySnapshot: {
        kind: 'array',
        elements: [],
      },
      auxiliaryState: {
        customState: { merged: '[]' },
      },
      variables: { totalIntervals: 0 },
    });
    return steps;
  }

  const intervals = rawIntervals
    .map((item) => ({ ...item }))
    .sort((a, b) => a.start - b.start);
  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 4,
    explanation: {
      what: `Sort ${intervals.length} intervals by start`,
      why: 'We sort by start time so that any two intervals that overlap end up next to each other. That lets us merge everything in one left-to-right walk.',
    },
    primarySnapshot: {
      kind: 'array',
      elements: createIntervalArrayElements(intervals),
    },
    auxiliaryState: {
      customState: {
        intervals: intervals.map(formatInterval).join(', '),
        merged: '[]',
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
      why: 'We take the first sorted interval as our running interval — every later interval will either stretch it or start a fresh one.',
    },
    primarySnapshot: {
      kind: 'array',
      elements: createIntervalArrayElements(intervals, 0, 'queued'),
    },
    auxiliaryState: {
      customState: {
        merged: merged.map(formatInterval).join(', '),
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
          kind: 'array',
          elements: createIntervalArrayElements(intervals, i, 'swap'),
        },
        auxiliaryState: {
          customState: {
            status: 'Merged overlap',
            current: formatInterval(current),
            updatedInterval: formatInterval(prev),
            merged: merged.map(formatInterval).join(', '),
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
          kind: 'array',
          elements: createIntervalArrayElements(intervals, i, 'active'),
        },
        auxiliaryState: {
          customState: {
            status: 'New interval appended',
            current: formatInterval(current),
            merged: merged.map(formatInterval).join(', '),
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
      why: `Every interval has been folded in, leaving ${merged.map(formatInterval).join(', ')} — non-overlapping pieces that cover exactly the same ground as the input. The sort was the expensive part; the merge itself was a single pass.`,
    },
    primarySnapshot: {
      kind: 'array',
      elements: intervals.map((item, idx) => ({
        id: `interval-final-${idx}`,
        value: item.start,
        state: 'sorted',
        pointers: [formatInterval(item)],
      })),
    },
    auxiliaryState: {
      customState: {
        mergedResult: merged.map(formatInterval).join(', '),
      },
    },
    variables: {
      finalMergedCount: merged.length,
      completed: true,
    },
  });

  return steps;
}

export const mergeIntervals: AlgorithmDefinition<MergeIntervalsInput> = {
  id: 'merge-intervals',
  title: 'Merge Intervals',
  category: 'intervals',
  difficulty: 'Medium',
  description:
    'Merge all overlapping intervals into a minimal set of non-overlapping intervals that cover the exact same range as the input intervals. Intervals are sorted by start time, allowing overlap detection via a single linear scan.',
  constraints: [
    '1 <= intervals.length <= 10^4',
    'intervals[i].length == 2',
    '0 <= start_i <= end_i <= 10^4',
  ],
  examples: [
    {
      input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
      output: '[[1,6],[8,10],[15,18]]',
      explanation: 'Intervals [1,3] and [2,6] overlap since 2 <= 3; they merge into [1,6].',
    },
    {
      input: 'intervals = [[1,4],[4,5]]',
      output: '[[1,5]]',
      explanation: 'Intervals [1,4] and [4,5] touch at boundary 4 and are merged into [1,5].',
    },
  ],
  code: `def merge(intervals):
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for current in intervals[1:]:
        prev = merged[-1]
        if current[0] <= prev[1]:
            prev[1] = max(prev[1], current[1])
        else:
            merged.append(current)
    return merged`,
  timeComplexity: {
    best: 'O(N log N)',
    average: 'O(N log N)',
    worst: 'O(N log N)',
  },
  spaceComplexity: 'O(N)',
  complexityAnalysis: {
    time: 'Sorting the intervals by start time dominates the work at O(N log N). After that, we make a single linear pass and compare each interval only with the last merged one, which adds just O(N) more. That is why best, average, and worst case are all O(N log N) — the sort always happens.',
    space: 'The merged output list is what grows: when nothing overlaps it holds all N intervals, so extra memory is O(N).',
  },
  generateSteps: generateMergeIntervalsSteps,
  defaultInput: DEFAULT_MERGE_INTERVALS_INPUT,
};
