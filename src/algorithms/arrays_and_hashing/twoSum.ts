import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface TwoSumInput {
  nums: number[];
  target: number;
}

export const TWO_SUM_CODE = `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`;

export const DEFAULT_TWO_SUM_INPUT: TwoSumInput = {
  nums: [2, 7, 11, 15],
  target: 9,
};

export const generateTwoSumSteps = (input: TwoSumInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.nums.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: 'default',
  }));

  const hashMap: Record<string, number> = {};

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'array',
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        hashMap: { ...hashMap },
      },
      variables,
    });
  };

  const target = input.target;
  const n = elements.length;

  addStep(
    1,
    'Start the search',
    `We want two numbers in [${input.nums.join(', ')}] that add up to ${target}. Rather than testing every pair, we'll walk the array once and remember each value we pass.`,
    { target, length: n }
  );

  addStep(
    2,
    'Create an empty map',
    `This map will remember every value we see and where we saw it, so later elements can ask "has my partner already shown up?" with a single lookup.`,
    { target }
  );

  for (let i = 0; i < n; i++) {
    elements[i].state = 'active';
    elements[i].pointers = ['i'];

    const currentVal = elements[i].value;

    addStep(
      3,
      `Visit nums[${i}] = ${currentVal}`,
      `We're standing at index ${i} looking at ${currentVal}, asking the same question we ask everywhere: which number would pair with this one to reach ${target}?`,
      { i, 'nums[i]': currentVal, target }
    );

    const complement = target - currentVal;

    addStep(
      4,
      `Compute the complement ${complement}`,
      `${target} minus ${currentVal} leaves ${complement} — that's the exact partner ${currentVal} needs. If we've already walked past a ${complement}, this pair is our answer.`,
      { i, 'nums[i]': currentVal, complement, target }
    );

    const hasComplement = String(complement) in hashMap;

    addStep(
      5,
      `Look up ${complement} in the map`,
      hasComplement
        ? `We have seen ${complement} before — it's sitting at index ${hashMap[String(complement)]}. Together with ${currentVal} it completes the target sum, so the search is over.`
        : `We haven't met ${complement} yet, so no partner for ${currentVal} exists behind us. We'll remember ${currentVal} and keep walking.`,
      { i, complement, hasComplement }
    );

    if (hasComplement) {
      const prevIdx = hashMap[String(complement)];
      elements[prevIdx].state = 'sorted';
      elements[prevIdx].pointers = ['match'];
      elements[i].state = 'sorted';
      elements[i].pointers = ['match'];

      addStep(
        6,
        `Return indices [${prevIdx}, ${i}]`,
        `nums[${prevIdx}] and nums[${i}] give us ${elements[prevIdx].value} + ${currentVal} = ${target}, exactly what we wanted. One pass and a map of what we'd seen was all it took — linear time overall.`,
        { resultIdx1: prevIdx, resultIdx2: i, target }
      );
      return steps;
    }

    // Store in map
    hashMap[String(currentVal)] = i;
    elements[i].state = 'visited';
    elements[i].pointers = undefined;

    addStep(
      7,
      `Remember ${currentVal} at index ${i}`,
      `We store ${currentVal} → ${i} in the map, so if a later number needs ${currentVal} as its partner, it can find it instantly instead of rescanning the array.`,
      { i, 'nums[i]': currentVal }
    );
  }

  addStep(
    8,
    'Return an empty array',
    `We walked the whole array and no value ever found its partner for ${target}, so we report that no valid pair exists.`,
    { target }
  );

  return steps;
};

export const twoSum: AlgorithmDefinition<TwoSumInput> = {
  id: 'two-sum',
  title: 'Two Sum',
  category: 'arrays_and_hashing',
  difficulty: 'Easy',
  description:
    "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. A hash map of values we've already seen lets each element check for its partner in constant time.",
  constraints: [
    '2 <= nums.length <= 10^4',
    '-10^9 <= nums[i] <= 10^9',
    '-10^9 <= target <= 10^9',
    'Only one valid answer exists.',
  ],
  examples: [
    {
      input: 'nums = [2, 7, 11, 15], target = 9',
      output: '[0, 1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
    },
    {
      input: 'nums = [3, 2, 4], target = 6',
      output: '[1, 2]',
      explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
    },
    {
      input: 'nums = [3, 3], target = 6',
      output: '[0, 1]',
      explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].',
    },
  ],
  code: TWO_SUM_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(n)',
  complexityAnalysis: {
    time: 'We walk the array once, and each hash-map lookup and insert costs O(1) on average, so the total work grows linearly with the number of elements — O(n). Even in the worst case, where no pair exists, we still make just a single pass.',
    space: 'The hash map stores up to one entry per element before a pair is found, so extra memory grows linearly with the input — O(n).',
  },
  defaultInput: DEFAULT_TWO_SUM_INPUT,
  generateSteps: generateTwoSumSteps,
};
