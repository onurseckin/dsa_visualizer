import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface NearestSmallerElementInput {
  nums: number[];
}

export const DEFAULT_NEAREST_SMALLER_INPUT: NearestSmallerElementInput = {
  nums: [4, 5, 2, 10, 8],
};

export const PYTHON_NEAREST_SMALLER_CODE = `def nearest_smaller_element(nums: list[int]) -> list[int]:
    n = len(nums)
    result = [-1] * n
    stack = []

    for i in range(n):
        while stack and stack[-1] >= nums[i]:
            stack.pop()
        if stack:
            result[i] = stack[-1]
        stack.append(nums[i])

    return result`;

export const generateNearestSmallerElementSteps = (
  input: NearestSmallerElementInput,
): AlgorithmStep[] => {
  const nums =
    input?.nums && input.nums.length > 0 ? [...input.nums] : DEFAULT_NEAREST_SMALLER_INPUT.nums;
  const n = nums.length;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const result = new Array<number>(n).fill(-1);
  const stack: number[] = [];

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: "Initialize Monotonic Stack and Result Array",
      why: "result array initialized with -1s. Stack will maintain an increasing sequence of elements.",
    },
    primarySnapshot: {
      kind: "array",
      elements: nums.map((val, idx) => ({
        id: `num-${idx}`,
        value: val,
        state: "default",
        pointers: [`res: ${result[idx]}`],
      })),
    },
    auxiliaryState: {
      stack: [],
      customState: { nums: nums.join(", ") },
    },
    variables: { n },
  });

  for (let i = 0; i < n; i++) {
    const current = nums[i];

    while (stack.length > 0 && stack[stack.length - 1] >= current) {
      const popped = stack.pop()!;
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Pop ${popped} from stack`,
          why: `Stack top ${popped} >= current element ${current}, so it cannot be a nearest smaller element for current or future items.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: nums.map((val, idx) => ({
            id: `num-${idx}`,
            value: val,
            state: idx === i ? "active" : "default",
            pointers: idx === i ? [`i: ${current}`] : undefined,
          })),
        },
        auxiliaryState: {
          stack: [...stack],
          customState: { popped, current },
        },
        variables: { i, current, popped },
      });
    }

    if (stack.length > 0) {
      result[i] = stack[stack.length - 1];
    }

    stack.push(current);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Set result[${i}] = ${result[i]} and push ${current} to stack`,
        why:
          result[i] !== -1
            ? `Top of stack ${result[i]} is nearest smaller element to the left of ${current}.`
            : `No smaller element found to the left of ${current}, so result remains -1.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: nums.map((val, idx) => ({
          id: `num-${idx}`,
          value: val,
          state: idx === i ? "sorted" : idx < i ? "visited" : "default",
          pointers: [idx === i ? `i: ${current}` : `res: ${result[idx]}`],
        })),
      },
      auxiliaryState: {
        stack: [...stack],
        customState: {
          i,
          current,
          nearestSmaller: result[i],
        },
      },
      variables: { i, current, "result[i]": result[i] },
    });
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: `Return nearest smaller element array: [${result.join(", ")}]`,
      why: "Monotonic stack traversal complete in linear O(N) time.",
    },
    primarySnapshot: {
      kind: "array",
      elements: result.map((val, idx) => ({
        id: `res-${idx}`,
        value: val,
        state: "sorted",
        pointers: [`orig: ${nums[idx]}`],
      })),
    },
    auxiliaryState: {
      stack: [...stack],
      customState: { result: result.join(", ") },
    },
    variables: { result: result.join(", ") },
  });

  return steps;
};

const NEAREST_SMALLER_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares nearest_smaller_element: given nums, returns array where entry i is nearest element to left smaller than nums[i].",
    2: "Caches length of nums in n.",
    3: "Initializes result array filled with default -1s.",
    4: "Initializes an empty stack to maintain a monotonic increasing order of elements.",
    6: "Iterates through array indices i from 0 to n - 1.",
    7: "Checks while stack is non-empty and top element is >= current element nums[i].",
    8: "Pops top element from stack because it can never be a nearest smaller element for nums[i] or future items.",
    9: "If stack is not empty after popping, top of stack is the nearest smaller element.",
    10: "Records stack[-1] in result[i].",
    11: "Pushes current element nums[i] onto stack.",
    13: "Returns the completed result list.",
  },
};

export const nearestSmallerElement: AlgorithmDefinition<NearestSmallerElementInput> = {
  id: "nearest-smaller-element",
  title: "Nearest Smaller Element",
  category: "stack_and_queue",
  difficulty: "Medium",
  description:
    "Finds the nearest smaller element to the left for each element in an array using a monotonic stack.",
  constraints: ["1 <= nums.length <= 15", "-10^4 <= nums[i] <= 10^4"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nums = [4, 5, 2, 10, 8]",
      outputDisplay: "[-1, 4, -1, 2, 2]",
      title: "Basic Case",
      input: DEFAULT_NEAREST_SMALLER_INPUT,
      output: "[-1, 4, -1, 2, 2]",
      explanation: "Nearest smaller to 4 is -1, to 5 is 4, to 2 is -1, to 10 is 2, to 8 is 2.",
    },
    {
      kind: "complex",
      inputDisplay: "nums = [1, 3, 0, 2, 5]",
      outputDisplay: "[-1, 1, -1, 0, 2]",
      title: "Mixed Array",
      input: { nums: [1, 3, 0, 2, 5] },
      output: "[-1, 1, -1, 0, 2]",
      explanation: "Returns nearest smaller elements [-1, 1, -1, 0, 2].",
    },
    {
      kind: "negative",
      inputDisplay: "nums = [5, 4, 3, 2, 1]",
      outputDisplay: "[-1, -1, -1, -1, -1]",
      title: "Decreasing Array",
      input: { nums: [5, 4, 3, 2, 1] },
      output: "[-1, -1, -1, -1, -1]",
      explanation: "In a strictly decreasing array, no element has a smaller element to its left.",
    },
  ],
  code: PYTHON_NEAREST_SMALLER_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Each element is pushed to and popped from the stack at most once, running in linear O(N) time.",
    space: "Requires a stack storing at most N elements, using O(N) space.",
  },
  topicGuide: {
    overview:
      "Monotonic stack maintains elements in strictly increasing order to efficiently find nearest smaller items.",
    sections: [
      {
        heading: "Monotonic Property",
        body: "By popping larger elements, the top of the stack is guaranteed to be the nearest smaller element to the left.",
      },
    ],
  },
  trivia: NEAREST_SMALLER_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 8",
      label: "Competitive Programmer's Handbook, Ch 8",
    },
  ],
  defaultInput: DEFAULT_NEAREST_SMALLER_INPUT,
  generateSteps: generateNearestSmallerElementSteps,
};
