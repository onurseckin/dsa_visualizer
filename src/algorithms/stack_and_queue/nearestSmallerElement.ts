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
    Array.isArray(input?.nums) && input.nums.length > 0
      ? [...input.nums]
      : DEFAULT_NEAREST_SMALLER_INPUT.nums;
  const n = nums.length;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const result = new Array<number>(n).fill(-1);
  const stack: number[] = [];

  // Step 1: Function entry (Line 1)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initialize monotonic stack search for input sequence of length ${n}`,
      why: "We prepare to scan the array left-to-right, maintaining a monotonic stack of candidate values to identify the nearest smaller predecessor for each position in linear O(N) total time.",
    },
    primarySnapshot: {
      kind: "array",
      elements: nums.map((val, idx) => ({
        id: `num-${idx}`,
        value: val,
        state: "default",
      })),
    },
    auxiliaryState: {
      stack: [],
      customState: { "Array Length": n, "Array Elements": nums.join(", ") },
    },
    variables: { n, nums: nums.join(", ") },
  });

  // Step 2: Cache length n (Line 2)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Determine sequence length (N = ${n})`,
      why: "Establishes the total iteration count for scanning all elements in a single sequential pass.",
    },
    primarySnapshot: {
      kind: "array",
      elements: nums.map((val, idx) => ({
        id: `num-${idx}`,
        value: val,
        state: "default",
      })),
    },
    auxiliaryState: {
      stack: [],
      customState: { "Array Length": n, "Array Elements": nums.join(", ") },
    },
    variables: { n },
  });

  // Step 3: Initialize result array (Line 3)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Initialize output array with default -1 entries`,
      why: "A value of -1 represents the baseline assumption that no smaller element exists to the left until a valid predecessor is identified.",
    },
    primarySnapshot: {
      kind: "array",
      elements: nums.map((val, idx) => ({
        id: `num-${idx}`,
        value: val,
        state: "default",
      })),
    },
    auxiliaryState: {
      stack: [],
      customState: { "Result Array": result.join(", ") },
    },
    variables: { n, result: result.join(", ") },
  });

  // Step 4: Initialize stack (Line 4)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Create empty candidate stack",
      why: "The stack will maintain candidate elements in strictly increasing order, allowing rapid O(1) access to the nearest smaller element.",
    },
    primarySnapshot: {
      kind: "array",
      elements: nums.map((val, idx) => ({
        id: `num-${idx}`,
        value: val,
        state: "default",
      })),
    },
    auxiliaryState: {
      stack: [],
      customState: { Stack: "[]", "Result Array": result.join(", ") },
    },
    variables: { n, result: result.join(", "), stackSize: 0 },
  });

  for (let i = 0; i < n; i++) {
    const current = nums[i];

    // Line 6: for i in range(n)
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Scan element nums[${i}] = ${current} at index ${i}`,
        why: `Evaluating element ${current}. We inspect the monotonic stack to determine whether preceding elements are smaller or dominated.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: nums.map((val, idx) => ({
          id: `num-${idx}`,
          value: val,
          state: idx === i ? "active" : idx < i ? "visited" : "default",
          pointers: idx === i ? ["i"] : undefined,
        })),
      },
      auxiliaryState: {
        stack: [...stack],
        customState: {
          "Current Index": i,
          "Current Value": current,
          "Stack Top": stack.length > 0 ? stack[stack.length - 1] : "EMPTY",
        },
      },
      variables: { i, current, stackTop: stack.length > 0 ? stack[stack.length - 1] : "EMPTY" },
    });

    // Line 7: while stack and stack[-1] >= nums[i]
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what:
          stack.length > 0
            ? `Compare stack top candidate (${stack[stack.length - 1]}) with current element ${current}`
            : "Stack is empty; no candidates to compare",
        why:
          stack.length > 0 && stack[stack.length - 1] >= current
            ? `Candidate ${stack[stack.length - 1]} is greater than or equal to current element ${current}. To preserve monotonic increasing order, this candidate must be evicted.`
            : stack.length > 0
              ? `Candidate ${stack[stack.length - 1]} is strictly smaller than ${current}. The monotonic invariant is satisfied, establishing this as the nearest smaller element.`
              : "With an empty stack, there are no preceding candidate elements to evaluate.",
      },
      primarySnapshot: {
        kind: "array",
        elements: nums.map((val, idx) => ({
          id: `num-${idx}`,
          value: val,
          state: idx === i ? "active" : idx < i ? "visited" : "default",
          pointers: idx === i ? ["i"] : undefined,
        })),
      },
      auxiliaryState: {
        stack: [...stack],
        customState: {
          "Current Index": i,
          "Current Value": current,
          "Stack Top": stack.length > 0 ? stack[stack.length - 1] : "EMPTY",
        },
      },
      variables: { i, current, stackTop: stack.length > 0 ? stack[stack.length - 1] : "EMPTY" },
    });

    // Monotonic stack popping loop (Line 8)
    while (stack.length > 0 && stack[stack.length - 1] >= current) {
      const popped = stack.pop()!;
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Evict candidate ${popped} from monotonic stack`,
          why: `Since ${current} is smaller or equal and appears later, ${popped} is permanently dominated. It can never serve as a nearest smaller element for ${current} or any subsequent rightward positions.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: nums.map((val, idx) => ({
            id: `num-${idx}`,
            value: val,
            state: idx === i ? "active" : idx < i ? "visited" : "default",
            pointers: idx === i ? ["i"] : undefined,
          })),
        },
        auxiliaryState: {
          stack: [...stack],
          customState: {
            "Popped Element": popped,
            "Current Value": current,
            "Stack Top": stack.length > 0 ? stack[stack.length - 1] : "EMPTY",
          },
        },
        variables: { i, current, popped },
      });
    }

    // Line 9: if stack:
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what:
          stack.length > 0
            ? `Valid nearest smaller candidate found on stack: ${stack[stack.length - 1]}`
            : "No smaller predecessor exists to the left",
        why:
          stack.length > 0
            ? `After popping larger or equal elements, the top of the stack is guaranteed to be the closest smaller element to the left.`
            : `All preceding values were greater than or equal to ${current}, leaving -1 as the output for position ${i}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: nums.map((val, idx) => ({
          id: `num-${idx}`,
          value: val,
          state: idx === i ? "active" : idx < i ? "visited" : "default",
          pointers: idx === i ? ["i"] : undefined,
        })),
      },
      auxiliaryState: {
        stack: [...stack],
        customState: {
          "Current Index": i,
          "Current Value": current,
          "Stack Top": stack.length > 0 ? stack[stack.length - 1] : "EMPTY",
        },
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
          what: `Record result[${i}] = ${result[i]}`,
          why: `Stores ${result[i]} as the verified nearest smaller leftward element for nums[${i}].`,
        },
        primarySnapshot: {
          kind: "array",
          elements: nums.map((val, idx) => ({
            id: `num-${idx}`,
            value: val,
            state: idx === i ? "active" : idx < i ? "visited" : "default",
            pointers: idx === i ? ["i"] : undefined,
          })),
        },
        auxiliaryState: {
          stack: [...stack],
          customState: { "Current Index": i, "Current Value": current, "result[i]": result[i] },
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
        what: `Push current element ${current} onto candidate stack`,
        why: `Enters ${current} onto the stack so it can act as a candidate nearest smaller element for future elements further right.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: nums.map((val, idx) => ({
          id: `num-${idx}`,
          value: val,
          state: idx === i ? "sorted" : idx < i ? "visited" : "default",
          pointers: idx === i ? ["i"] : undefined,
        })),
      },
      auxiliaryState: {
        stack: [...stack],
        customState: {
          "Current Index": i,
          "Current Value": current,
          "Nearest Smaller": result[i],
          "Stack Contents": stack.join(", "),
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
      what: `Complete monotonic stack scan and return result array`,
      why: "All elements have been processed. Every element was pushed once and popped at most once, guaranteeing linear O(N) total runtime.",
    },
    primarySnapshot: {
      kind: "array",
      elements: result.map((val, idx) => ({
        id: `res-${idx}`,
        value: val,
        state: "sorted",
      })),
    },
    auxiliaryState: {
      stack: [...stack],
      customState: { "Final Result": result.join(", ") },
    },
    variables: { result: result.join(", ") },
  });

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
  topicIds: ["stack_and_queue"],
  difficulty: "Medium",
  description: `<p>Given an array of integers <code>nums</code>, find the nearest smaller element to the left for each element in the array.</p>
<p>For each element at index <em>i</em> (0 &le; <em>i</em> &lt; <em>N</em>), locate the largest index <em>j</em> &lt; <em>i</em> such that <code>nums[j]</code> &lt; <code>nums[i]</code>. If no such element exists, output <code>-1</code> for index <em>i</em>. A monotonic stack algorithm computes the answer in linear <em>O(N)</em> time by maintaining an increasing stack of candidate elements.</p>
<h3>Why It Exists &amp; Real-World Relevance</h3>
<p>Finding nearest smaller or larger elements in an array is a fundamental pattern in algorithm design. A naive nested loop takes <em>O(N<sup>2</sup>)</em> time, which becomes prohibitively slow for large arrays. Monotonic stacks solve this class of problems in linear <em>O(N)</em> time.</p>
<p>Real-world applications include:</p>
<ul>
  <li><strong>Histogram &amp; Layout Math</strong>: Computing the largest rectangle in a histogram relies on finding the nearest smaller element on both left and right sides to establish bar boundaries.</li>
  <li><strong>Stock Span &amp; Financial Analytics</strong>: Calculating how many consecutive days prior to today a stock price was lower or equal.</li>
  <li><strong>Tensor &amp; Memory Layout Compilers</strong>: PyTorch and TensorFlow compilers use monotonic bounds to find non-overlapping contiguous memory spans.</li>
</ul>
<h3>How It Works (Step-by-Step Intuition)</h3>
<ul>
  <li>Maintain an increasing monotonic stack storing candidate elements.</li>
  <li>Iterate through each element <code>nums[i]</code> from left to right.</li>
  <li><strong>Pop Phase</strong>: While the stack is non-empty and the top element is &ge; <code>nums[i]</code>, pop it because <code>nums[i]</code> is both smaller (or equal) and positioned further right, so any future element that could use the popped value can use <code>nums[i]</code> instead.</li>
  <li><strong>Answer Phase</strong>: If the stack is non-empty after popping, the top element is the nearest smaller element to the left of <code>nums[i]</code>. If empty, record <code>-1</code>.</li>
  <li><strong>Push Phase</strong>: Push <code>nums[i]</code> onto the stack.</li>
</ul>
<h3>Input Parameters</h3>
<ul>
  <li><code>nums</code>: An array of integers.</li>
</ul>
<h3>Output</h3>
<p>Returns an array <code>result</code> of length <em>N</em> where <code>result[i]</code> is the nearest smaller element to the left of <code>nums[i]</code>, or <code>-1</code> if no smaller element exists to its left.</p>
<h3>Edge Cases &amp; Constraints</h3>
<ul>
  <li><code>1 &le; nums.length &le; 10<sup>5</sup></code></li>
  <li><code>-10<sup>4</sup> &le; nums[i] &le; 10<sup>4</sup></code></li>
  <li><strong>Strictly increasing array</strong>: Each element's nearest smaller element is its immediate left neighbor.</li>
  <li><strong>Strictly decreasing array</strong>: No element has a smaller element to its left; all entries in <code>result</code> are <code>-1</code>.</li>
  <li><strong>Duplicate elements</strong>: Popping when the stack top is &ge; <code>nums[i]</code> ensures equal values are popped, preserving strict monotonicity.</li>
</ul>`,
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
    space:
      "In the worst case (a strictly increasing array), the stack stores up to $N$ elements. Thus the auxiliary space complexity is $O(N)$.",
  },
  topicGuide: {
    overview:
      "<p>The Nearest Smaller Element problem asks for the nearest preceding element smaller than each array entry. A naive search checks all preceding indices for each element, taking <em>O(N<sup>2</sup>)</em> time. By using a monotonic stack—a stack whose elements are maintained in strictly sorted order—we can prune invalid candidates and achieve <em>O(N)</em> linear runtime.</p>",
    sections: [
      {
        heading: "The Monotonic Stack Invariant",
        body: "<p>The algorithm maintains a stack whose entries strictly increase from bottom to top. When processing element <code>nums[i]</code>, any stack element &ge; <code>nums[i]</code> is popped. This preserves the invariant: every element currently in the stack is strictly smaller than the elements above it. Once popping finishes, the top element is guaranteed to be the nearest smaller element to the left of index <em>i</em>.</p>",
      },
      {
        heading: "Domination Principle & Amortized Linear Proof",
        body: "<p>Why is it safe to pop an element <em>x</em> when <em>x</em> &ge; <code>nums[i]</code>? Because <code>nums[i]</code> is both smaller than (or equal to) <em>x</em> AND located further to the right. Any future element to the right of index <em>i</em> that could potentially use <em>x</em> as its nearest smaller element will find <code>nums[i]</code> (or something even smaller) first. Thus, <em>x</em> is permanently dominated and can never be the answer for any subsequent query. Since each element is pushed once and popped at most once, total work across the entire scan is bounded by 2<em>N</em> operations, guaranteeing amortized <em>O(N)</em> runtime.</p>",
      },
      {
        heading: "Comparison of Approaches & Trade-Offs",
        body: "<p>1. <strong>Brute Force</strong> <em>O(N<sup>2</sup>)</em>: For each element <em>i</em>, scan leftward. Simple but exceeds time limits for large inputs.<br />2. <strong>Segment Tree / RMQ</strong> <em>O(N log N)</em>: Supports dynamic range minimum queries, but requires <em>O(N)</em> extra tree overhead and logarithmic query time.<br />3. <strong>Monotonic Stack</strong> <em>O(N)</em>: Optimal for static array scans. Runs in linear time with sequential array access that maximizes CPU cache hit rates.</p>",
      },
      {
        heading: "Systems Applications & Memory Efficiency",
        body: "<p>Monotonic stack traversals access memory sequentially, which plays exceptionally well with modern CPU hardware prefetchers. Dynamic array-backed stacks store entries contiguously in L1/L2 cache, making this algorithm significantly faster in practice than pointer-based data structures like binary search trees.</p>",
      },
      {
        heading: "Edge Cases & Strict vs Non-Strict Variations",
        body: "<p>The condition <code>stack[-1] &ge; nums[i]</code> enforces strictly smaller nearest neighbors. If the problem asks for nearest smaller-or-equal elements, change the condition to <code>stack[-1] &gt; nums[i]</code>. For duplicate elements, non-strict popping ensures the stack only holds distinct values when required.</p>",
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
