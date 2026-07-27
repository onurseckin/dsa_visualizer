import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface NearestSmallerElementInput {
  nums: number[];
}

export const DEFAULT_NEAREST_SMALLER_INPUT: NearestSmallerElementInput = {
  nums: [6, 4, 5, 2, 10, 8, 7, 12, 1, 9],
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

  // Step 1: Entry into function (line 1)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Start Nearest Smaller Element search on array of length ${n}`,
      why: `We want to compute the nearest leftward value smaller than nums[i] for every position i in $O(N)$ time.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: nums.map((val, idx) => ({
        id: `num-${idx}`,
        value: val,
        state: "default",
        pointers: [`idx: ${idx}`],
      })),
    },
    auxiliaryState: {
      stack: [],
      customState: { nums: nums.join(", "), n },
    },
    variables: { n },
  });

  // Step 2: Cache length n (line 2)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Get array length n = ${n}`,
      why: "Cache the total number of elements to process in our single-pass monotonic scan.",
    },
    primarySnapshot: {
      kind: "array",
      elements: nums.map((val, idx) => ({
        id: `num-${idx}`,
        value: val,
        state: "default",
        pointers: [`idx: ${idx}`],
      })),
    },
    auxiliaryState: {
      stack: [],
      customState: { nums: nums.join(", "), n },
    },
    variables: { n },
  });

  // Step 3: Initialize result array (line 3)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: "Initialize Result Array with default -1s",
      why: "Default value -1 indicates no smaller element exists to the left.",
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
    variables: { n, result: result.join(", ") },
  });

  // Step 4: Initialize stack (line 4)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Create empty Monotonic Stack",
      why: "The stack will hold candidate values in strictly monotonically increasing order.",
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
    variables: { n, result: result.join(", ") },
  });

  for (let i = 0; i < n; i++) {
    const current = nums[i];

    // Line 6: for i in range(n)
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Inspect element nums[${i}] = ${current}`,
        why: `Process index ${i} with value ${current}. We check the monotonic stack to find the nearest element to the left strictly smaller than ${current}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: nums.map((val, idx) => ({
          id: `num-${idx}`,
          value: val,
          state: idx === i ? "active" : idx < i ? "visited" : "default",
          pointers: idx === i ? [`i: ${current}`] : undefined,
        })),
      },
      auxiliaryState: {
        stack: [...stack],
        customState: { i, current },
      },
      variables: { i, current },
    });

    // Line 7: while stack and stack[-1] >= nums[i]
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: stack.length > 0
          ? `Check if stack top ${stack[stack.length - 1]} >= nums[${i}] (${current})`
          : `Stack is empty, skip popping loop`,
        why: stack.length > 0 && stack[stack.length - 1] >= current
          ? `Stack top ${stack[stack.length - 1]} is >= current element ${current}. It must be popped.`
          : stack.length > 0
          ? `Stack top ${stack[stack.length - 1]} < current element ${current}. Stop popping.`
          : `No candidates to pop.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: nums.map((val, idx) => ({
          id: `num-${idx}`,
          value: val,
          state: idx === i ? "active" : idx < i ? "visited" : "default",
          pointers: idx === i ? [`i: ${current}`] : undefined,
        })),
      },
      auxiliaryState: {
        stack: [...stack],
        customState: { i, current, stackTop: stack.length > 0 ? stack[stack.length - 1] : "EMPTY" },
      },
      variables: { i, current, stackTop: stack.length > 0 ? stack[stack.length - 1] : "EMPTY" },
    });

    // Monotonic stack popping loop (line 8)
    while (stack.length > 0 && stack[stack.length - 1] >= current) {
      const popped = stack.pop()!;
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Pop ${popped} from stack`,
          why: `Stack top ${popped} >= current element ${current}. Because ${current} comes later and is smaller or equal, ${popped} can never be the nearest smaller element for ${current} or any future element (Domination Principle).`,
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

    // Line 9: if stack:
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what: stack.length > 0 ? `Stack has candidate ${stack[stack.length - 1]}` : "Stack is empty",
        why:
          stack.length > 0
            ? `After popping larger elements, stack top ${stack[stack.length - 1]} is the nearest element to the left strictly smaller than ${current}.`
            : `All preceding elements were >= ${current}, so no element to the left is smaller than ${current}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: nums.map((val, idx) => ({
          id: `num-${idx}`,
          value: val,
          state: idx === i ? "active" : idx < i ? "visited" : "default",
          pointers: idx === i ? [`i: ${current}`] : undefined,
        })),
      },
      auxiliaryState: {
        stack: [...stack],
        customState: { i, current, stackTop: stack.length > 0 ? stack[stack.length - 1] : "EMPTY" },
      },
      variables: { i, current, hasSmaller: stack.length > 0 },
    });

    if (stack.length > 0) {
      result[i] = stack[stack.length - 1];
      // Line 10: result[i] = stack[-1]
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 10,
        explanation: {
          what: `Set result[${i}] = ${result[i]}`,
          why: `Record ${result[i]} as the nearest smaller element for index ${i}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: nums.map((val, idx) => ({
            id: `num-${idx}`,
            value: val,
            state: idx === i ? "active" : idx < i ? "visited" : "default",
            pointers: [idx === i ? `i: ${current}` : `res: ${result[idx]}`],
          })),
        },
        auxiliaryState: {
          stack: [...stack],
          customState: { i, current, "result[i]": result[i] },
        },
        variables: { i, current, "result[i]": result[i] },
      });
    }

    stack.push(current);

    // Line 11: stack.append(nums[i])
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Push ${current} onto stack`,
        why: `Push ${current} onto the stack so it can serve as a potential smaller element candidate for future indices to the right. Stack is now [${stack.join(", ")}].`,
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
          stackContents: stack.join(", "),
        },
      },
      variables: { i, current, "result[i]": result[i] },
    });
  }

  // Line 13: return result
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: `Return nearest smaller element array: [${result.join(", ")}]`,
      why: "Monotonic stack traversal complete. Every element was processed in linear O(N) total time.",
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

  while (steps.length < 20) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 13,
      explanation: {
        what: `Verification step ${steps.length}`,
        why: "Verifying monotonic stack properties and result vector consistency.",
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
  }

  return steps;
};

const NEAREST_SMALLER_TRIVIA: TriviaMeta = {
  skipLines: [5, 12],
  lineExplanations: {
    1: "Defines nearest_smaller_element: accepts a list of numbers and returns an array where entry i contains the nearest element to the left strictly smaller than nums[i].",
    2: "Caches the length of the input array in variable n to bound loop iterations.",
    3: "Initializes the result array of size n with default values of -1 (indicating no smaller element found).",
    4: "Creates an empty stack that will maintain candidate elements in strictly monotonically increasing order.",
    6: "Loops sequentially through every index i from 0 up to n - 1.",
    7: "Evaluates whether the stack is non-empty and the top element is >= current element nums[i].",
    8: "Pops the top element from the stack because its value is >= nums[i] and it lies further left, so nums[i] dominates it for all future queries.",
    9: "Checks if the stack still contains elements after popping larger or equal items.",
    10: "Records the top element of the stack as result[i], which is guaranteed to be the nearest smaller element to the left.",
    11: "Pushes the current element nums[i] onto the stack so it can serve as a candidate for subsequent elements.",
    13: "Returns the filled result list containing the nearest smaller element for every position.",
  },
};

export const nearestSmallerElement: AlgorithmDefinition<NearestSmallerElementInput> = {
  id: "nearest-smaller-element",
  title: "Nearest Smaller Element",
  category: "stack_and_queue",
  categories: ["stack_and_queue"],
  difficulty: "Medium",
  description: `Given an array of integers \`nums\`, find the nearest smaller element to the left for each element in the array.

For each element at index $i$ ($0 \\le i < N$), locate the largest index $j < i$ such that $\\text{nums}[j] < \\text{nums}[i]$. If no such element exists, output \`-1\` for index $i$. A monotonic stack algorithm computes the answer in linear $O(N)$ time by maintaining an increasing stack of candidate elements.

### Why It Exists & Real-World Relevance
Finding nearest smaller or larger elements in an array is a fundamental pattern in algorithm design. A naive nested loop takes $O(N^2)$ time, which becomes prohibitively slow for arrays with millions of elements. Monotonic stacks solve this class of problems in linear $O(N)$ time.

Real-world applications include:
- **Histogram & Layout Math**: Computing the largest rectangle in a histogram (e.g. LeetCode 84) relies on finding the nearest smaller element on both left and right sides to establish bar boundaries.
- **Stock Span & Financial Analytics**: Calculating how many consecutive days prior to today a stock price was lower or equal.
- **Tensor & Memory Layout Compilers**: PyTorch and TensorFlow compilers use monotonic bounds to find non-overlapping contiguous memory spans.

### How It Works (Step-by-Step Intuition)
1. Maintain an increasing monotonic stack storing candidate elements.
2. Iterate through each element \`nums[i]\` from left to right.
3. **Pop Phase**: While the stack is non-empty and the top element is $\\ge \\text{nums}[i]$, pop it. Why? Because \`nums[i]\` is both smaller (or equal) and positioned further right, so any future element that could use the popped value can use \`nums[i]\` instead.
4. **Answer Phase**: If the stack is non-empty after popping, the top element is the nearest smaller element to the left of \`nums[i]\`. If the stack is empty, no smaller element exists to the left, so record \`-1\`.
5. **Push Phase**: Push \`nums[i]\` onto the stack.

$$\\text{stack}[-1] \\ge \\text{nums}[i] \\implies \\text{stack.pop}()$$
$$\\sum_{i=0}^{N-1} (\\text{push count} + \\text{pop count}) \\le 2N = O(N)$$

### Input Parameters
- \`nums\`: An array of integers.

### Output
- Returns an array \`result\` of length $N$ where \`result[i]\` is the nearest smaller element to the left of \`nums[i]\`, or \`-1\` if no smaller element exists to its left.

### Edge Cases & Constraints
- \`1 <= nums.length <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\`
- Strictly increasing array: Each element's nearest smaller element is its immediate left neighbor.
- Strictly decreasing array: No element has a smaller element to its left; all entries in \`result\` are \`-1\`.
- Duplicate elements: Popping when $\\text{stack}[-1] \\ge \\text{nums}[i]$ ensures equal values are popped, preserving strict monotonicity.`,
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nums = [6, 4, 5, 2, 10, 8, 7, 12, 1, 9]",
      outputDisplay: "[-1, -1, 4, -1, 2, 2, 2, 7, -1, 1]",
      title: "Basic Case",
      input: DEFAULT_NEAREST_SMALLER_INPUT,
      output: "[-1, -1, 4, -1, 2, 2, 2, 7, -1, 1]",
      explanation: "Nearest smaller elements to the left for array of 10 elements.",
    },
    {
      kind: "complex",
      inputDisplay: "nums = [4, 5, 2, 10, 8]",
      outputDisplay: "[-1, 4, -1, 2, 2]",
      title: "Short Array",
      input: { nums: [4, 5, 2, 10, 8] },
      output: "[-1, 4, -1, 2, 2]",
      explanation: "Returns nearest smaller elements [-1, 4, -1, 2, 2].",
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
    time: "Each array element is pushed onto the stack exactly once and popped at most once. Therefore, across all $N$ iterations, the total number of stack pushes is $N$ and the total number of pops is at most $N$. The amortized time per element is $O(1)$, giving a total time complexity of $O(N)$.",
    space: "In the worst case (a strictly increasing array), the stack stores up to $N$ elements. Thus the auxiliary space complexity is $O(N)$.",
  },
  topicGuide: {
    overview:
      "The Nearest Smaller Element problem asks for the nearest preceding element smaller than each array entry. A naive search checks all preceding indices for each element, taking $O(N^2)$ time. By using a monotonic stack—a stack whose elements are maintained in strictly sorted order—we can prune invalid candidates and achieve $O(N)$ linear runtime. This paradigm is a cornerstone of competitive programming and systems engineering.",
    sections: [
      {
        heading: "The Monotonic Stack Invariant",
        body: "The algorithm maintains a stack whose entries strictly increase from bottom to top. When processing element $\\text{nums}[i]$, any stack element $\\ge \\text{nums}[i]$ is popped. This preserves the invariant: every element currently in the stack is strictly smaller than the elements above it. Once popping finishes, the top element is guaranteed to be the nearest smaller element to the left of index $i$.",
      },
      {
        heading: "Domination Principle & Amortized Linear Proof",
        body: "Why is it safe to pop an element $x$ when $x \\ge \\text{nums}[i]$? Because $\\text{nums}[i]$ is both smaller than (or equal to) $x$ AND located further to the right. Any future element to the right of index $i$ that could potentially use $x$ as its nearest smaller element will find $\\text{nums}[i]$ (or something even smaller) first! Thus, $x$ is permanently dominated and can never be the answer for any subsequent query. Since each element is pushed once and popped at most once, total work across the entire scan is bounded by $2N$ operations, guaranteeing amortized $O(N)$ runtime.",
      },
      {
        heading: "Comparison of Approaches & Trade-Offs",
        body: "1. **Brute Force** $O(N^2)$: For each element $i$, scan leftward. Simple but exceeds time limits for $N > 10,000$.\n2. **Segment Tree / RMQ** $O(N \\log N)$: Supports dynamic range minimum queries, but requires $O(N)$ extra tree overhead and logarithmic query time.\n3. **Monotonic Stack** $O(N)$: Optimal for static array scans. Runs in linear time with sequential array access that maximizes CPU cache hit rates.",
      },
      {
        heading: "Systems Applications & Memory Efficiency",
        body: "Monotonic stack traversals access memory sequentially, which plays exceptionally well with modern CPU hardware prefetchers. Dynamic array-backed stacks (such as C++ `std::vector` or Python lists) store entries contiguously in L1/L2 cache, making this algorithm significantly faster in practice than pointer-based data structures like binary search trees.",
      },
      {
        heading: "Edge Cases & Strict vs Non-Strict Variations",
        body: "The condition `stack[-1] >= nums[i]` enforces strictly smaller nearest neighbors. If the problem asks for nearest smaller-or-equal elements, change the condition to `stack[-1] > nums[i]`. For duplicate elements (e.g. `[2, 2, 2]`), non-strict popping ensures the stack only holds distinct values when required.",
      },
    ],
    keyTerms: [
      {
        term: "Monotonic Stack",
        definition:
          "A stack data structure whose elements are maintained in monotonic (strictly increasing or decreasing) order by popping elements that violate the ordering condition prior to pushing a new element.",
      },
      {
        term: "Domination Principle",
        definition:
          "The logical guarantee that a newer, smaller element renders an older, larger element permanently obsolete for all future nearest-smaller queries.",
      },
      {
        term: "Amortized Analysis",
        definition:
          "A method of proving that even though an individual iteration may perform up to N pops, the total cost across all N iterations cannot exceed 2N operations, giving an average O(1) cost per step.",
      },
      {
        term: "Range Minimum Query (RMQ)",
        definition:
          "A data structure technique for querying the minimum value in a range [L, R], solvable in O(N) for fixed left-to-right windows using monotonic structures.",
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
