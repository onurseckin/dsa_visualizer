import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface GeneratingSubsetsInput {
  elements: number[];
}

export const DEFAULT_GENERATING_SUBSETS_INPUT: GeneratingSubsetsInput = {
  elements: [1, 2, 3],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Power Set problem asks to generate all 2^N possible subsets of an array of N unique elements, including the empty set and the full array.",
    primarySnapshot: {
      kind: "array",
      name: "elements",
      mode: "box",
      elements: [
        { id: "e1", value: 1, label: "[0]", state: "default" },
        { id: "e2", value: 2, label: "[1]", state: "default" },
        { id: "e3", value: 3, label: "[2]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "At each element in the array, we make a binary inclusion-exclusion decision: either Exclude the element or Include it in the current subset.",
    primarySnapshot: {
      kind: "array",
      name: "binary_choices",
      mode: "box",
      elements: [
        { id: "c1", value: "Branch 0: EXCLUDE", state: "compare" },
        { id: "c2", value: "Branch 1: INCLUDE", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "This decision structure forms a complete binary tree of depth N, yielding 2^N leaf nodes where each leaf represents a unique subset.",
    primarySnapshot: {
      kind: "composite",
      layout: "vertical",
      heading: "Binary Decision Tree",
      items: [
        {
          id: "subset-display",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "current_subset",
            mode: "box",
            elements: [
              { id: "s1", value: 1, label: "included", state: "sorted" },
              { id: "s2", value: "?", label: "decision at index 1", state: "active" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Branch 1: We explore the Exclusion path by advancing the index pointer to i + 1 without pushing element nums[i] into the sequence.",
    primarySnapshot: {
      kind: "array",
      name: "exclude_branch",
      mode: "box",
      elements: [
        { id: "ex1", value: 1, label: "nums[0]", state: "active" },
        { id: "ex2", value: "Skip -> recurse(i+1)", label: "Exclude", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Branch 2: We explore the Inclusion path by pushing element nums[i] into current_subset and then recursing to index i + 1.",
    primarySnapshot: {
      kind: "array",
      name: "include_branch",
      mode: "box",
      elements: [
        { id: "inc1", value: 1, label: "nums[0]", state: "active" },
        { id: "inc2", value: "Push -> recurse(i+1)", label: "Include", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Base Case: When index == N, all element choices are finalized; we copy current_subset and record it into the power set output list.",
    primarySnapshot: {
      kind: "array",
      name: "subset_recorded",
      mode: "box",
      elements: [
        { id: "rec1", value: 1, label: "[0]", state: "sorted" },
        { id: "rec2", value: 3, label: "[1]", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "After returning from the inclusion branch, we pop element nums[i] from current_subset to restore state before unwinding to the parent frame.",
    primarySnapshot: {
      kind: "array",
      name: "backtrack_pop",
      mode: "box",
      elements: [
        { id: "pop1", value: 1, label: "keep", state: "sorted" },
        { id: "pop2", value: "pop 3", label: "un-choose", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Power set generation completes having produced all 2^N subsets in O(2^N) time and O(N) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "sum1", value: "2^3 = 8 Subsets Total", state: "sorted" },
        { id: "sum2", value: "O(2^N) Time, O(N) Space", state: "default" },
      ],
    },
  },
];

export const generateGeneratingSubsetsSteps = (input: GeneratingSubsetsInput): AlgorithmStep[] => {
  const safeInput = input ?? DEFAULT_GENERATING_SUBSETS_INPUT;
  const rawElements = Array.isArray(safeInput.elements)
    ? safeInput.elements
    : DEFAULT_GENERATING_SUBSETS_INPUT.elements;
  const nums = rawElements.length > 0 ? rawElements.slice(0, 6) : [1, 2, 3];
  const n = nums.length;

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input?.elements) &&
      input.elements.length === DEFAULT_GENERATING_SUBSETS_INPUT.elements.length &&
      input.elements.every((val, idx) => val === DEFAULT_GENERATING_SUBSETS_INPUT.elements[idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const allSubsets: number[][] = [];
  const currSubset: number[] = [];

  const makeSnapshot = (activeIdx: number, isLeaf = false): PrimaryVisualSnapshot => ({
    kind: "composite",
    layout: "vertical",
    heading: `Subset Building: [${currSubset.join(", ")}]`,
    items: [
      {
        id: "nums-array",
        role: "auxiliary",
        snapshot: {
          kind: "array",
          name: "nums",
          mode: "box",
          elements: nums.map((val, idx) => ({
            id: `num-${idx}`,
            value: val,
            label: `[${idx}]`,
            state:
              activeIdx === idx
                ? "active"
                : currSubset.includes(val)
                  ? "sorted"
                  : idx < activeIdx
                    ? "visited"
                    : "default",
            pointers: activeIdx === idx ? [`i = ${idx}`] : undefined,
          })),
        },
      },
      {
        id: "subset-array",
        role: "primary",
        snapshot: {
          kind: "array",
          name: "currSubset",
          mode: "box",
          elements:
            currSubset.length > 0
              ? currSubset.map((v, idx) => ({
                  id: `sub-${idx}`,
                  value: v,
                  label: `[${idx}]`,
                  state: isLeaf ? "sorted" : "active",
                }))
              : [{ id: "empty", value: "ø (empty)", state: "default" }],
        },
      },
    ],
  });

  addStep(
    `Initializing Power Set generation for elements [${nums.join(", ")}]. Total expected subsets count is 2^${n} = ${Math.pow(2, n)}.`,
    makeSnapshot(0),
  );

  const backtrack = (idx: number) => {
    if (idx === n) {
      allSubsets.push([...currSubset]);
      addStep(
        `Recorded complete subset #${allSubsets.length}: [${currSubset.join(", ")}].`,
        makeSnapshot(idx, true),
      );
      return;
    }

    addStep(
      `Evaluating index ${idx} (element ${nums[idx]}): EXCLUDE branch. Recursing to index ${idx + 1} without adding ${nums[idx]}.`,
      makeSnapshot(idx),
    );
    backtrack(idx + 1);

    currSubset.push(nums[idx]);
    addStep(
      `Evaluating index ${idx} (element ${nums[idx]}): INCLUDE branch. Pushed ${nums[idx]} into current subset [${currSubset.join(", ")}] and recursing to index ${idx + 1}.`,
      makeSnapshot(idx),
    );
    backtrack(idx + 1);

    const popped = currSubset.pop();
    addStep(
      `Backtracked from inclusion branch at index ${idx}: popped element ${popped} to restore state.`,
      makeSnapshot(idx),
    );
  };

  backtrack(0);

  addStep(
    `Completed Power Set Backtracking: generated all ${allSubsets.length} unique subsets of [${nums.join(", ")}].`,
    makeSnapshot(n, true),
  );

  return steps;
};

const SUBSETS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: generate all subsets of array elements using recursive backtracking.",
    2: "Initialize result list to collect generated subsets.",
    3: "Blank line separating variable initialization from backtrack helper function.",
    4: "Recursive helper function backtrack(index, current_subset).",
    5: "Base case: when index equals n, record a copy of current_subset.",
    6: "Append current subset copy to result list.",
    7: "Return from current recursive stack frame after saving complete subset.",
    8: "Blank line separating base case from branching logic.",
    9: "Exclude branch: prepare to explore path without current element.",
    10: "Branch 1: exclude elements[index] and recurse to next index.",
    11: "Blank line separating exclusion branch from inclusion branch.",
    12: "Include branch: prepare to explore path with current element.",
    13: "Branch 2: append elements[index] to current_subset.",
    14: "Recurse with updated current_subset containing elements[index].",
    15: "Un-choose: pop element to restore current_subset before unwinding.",
    16: "Blank line separating backtrack definition from initial invocation.",
    17: "Start backtracking recursion from index 0 with empty subset.",
    18: "Return all generated subsets.",
  },
};

export const generatingSubsets: AlgorithmDefinition<GeneratingSubsetsInput> = {
  id: "generating-subsets",
  title: "Generating Subsets (Power Set)",
  topicIds: ["backtracking"],
  difficulty: "Easy",
  description:
    "<p>Given an integer array <code>elements</code> of unique integers, return all possible subsets (the power set) of the array in any order.</p><p><strong>Input:</strong> An array of unique integers <code>elements</code>.</p><p><strong>Output:</strong> A list of arrays representing all <code>2^N</code> unique subsets, including the empty set.</p>",
  constraints: [
    "1 <= elements.length <= 10",
    "-10 <= elements[i] <= 10",
    "All elements of elements are unique",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "elements = [1, 2, 3]",
      outputDisplay: "8 subsets",
      title: "Standard 3-Element Power Set",
      input: DEFAULT_GENERATING_SUBSETS_INPUT,
      output: "[[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]",
      explanation: "3 unique elements produce 2^3 = 8 distinct subsets.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "elements = [1, 2, 3, 4]",
      outputDisplay: "16 subsets",
      title: "Adversarial 4-Element Power Set",
      input: { elements: [1, 2, 3, 4] },
      output: "16 distinct subsets",
      explanation: "4 unique elements produce 2^4 = 16 distinct subsets.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "elements = [1]",
      outputDisplay: "[[1]]",
      title: "Single Element Boundary",
      input: { elements: [1] },
      output: "[[1]]",
      explanation: "Single element array has 2^1 = 2 subsets: [] and [1].",
    },
  ],
  code: `def subsets(nums: list[int]) -> list[list[int]]:
    result = []

    def backtrack(index: int, current_subset: list[int]):
        if index == len(nums):
            result.append(current_subset.copy())
            return

        backtrack(index + 1, current_subset)

        current_subset.append(nums[index])
        backtrack(index + 1, current_subset)
        current_subset.pop()

    backtrack(0, [])
    return result`,
  timeComplexity: {
    best: "O(2^N)",
    average: "O(2^N)",
    worst: "O(2^N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Each of the N elements has 2 choices (include/exclude), creating a binary decision tree of depth N with 2^N leaf states, taking O(2^N) overall time.",
    space:
      "O(N) stack memory required for recursion of depth N plus array space for building current_subset.",
  },
  topicGuide: {
    overview:
      "<p>Generating the power set of a set is a foundational backtracking pattern. By modeling decision making as a binary choice at each index, recursive search systematically visits every element in the power set. In real-world machine learning systems, power set enumeration underpins brute-force feature selection, combinatorial subset-sum solutions in resource allocation, and boolean satisfiability (SAT) clause evaluation.</p>",
    sections: [
      {
        heading: "Binary Decision Tree Structure",
        body: "<p>At step <code>i</code>, the search tree branches into two choices: exclude element <code>nums[i]</code> or include element <code>nums[i]</code>. The search tree has depth <code>N</code> with <code>2^N</code> leaves, where each leaf represents a unique subset.</p>",
      },
      {
        heading: "Backtracking vs Bitwise Manipulation",
        body: "<p>An alternative <code>O(2^N &middot; N)</code> iterative approach iterates over integers mask from 0 to <code>(1 &lt;&lt; N) - 1</code>. For each integer, bit <code>j</code> set to 1 indicates inclusion of <code>nums[j]</code>. While bitwise iteration is non-recursive, depth-first backtracking allows natural pruning when subset constraints (such as target sum caps) are introduced.</p>",
      },
      {
        heading: "Feature Selection & System Applications",
        body: "<p>In automated feature engineering and model ablation studies, evaluating subsets of feature matrices helps determine optimal predictive performance under model size constraints. Similarly, DB query rewrites test feature subsets for index condition pushdown.</p>",
      },
      {
        heading: "Handling Duplicate Elements (Subsets II)",
        body: "<p>When the input array contains duplicate values, generating unique subsets requires sorting the array first and skipping identical choices at the same depth: if <code>nums[i] == nums[i-1]</code> during inclusion loops, skip to avoid duplicate subset branches.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Power Set",
        definition:
          "The set of all subsets of a set, including the empty set and the set itself, containing 2^N elements.",
      },
      {
        term: "Inclusion-Exclusion Branching",
        definition:
          "A recursive search pattern where every item is evaluated under two explicit states: present or absent.",
      },
      {
        term: "Bitmask Enumeration",
        definition:
          "Using integer bit flags to represent subset membership, mapping integers 0..2^N-1 to subsets.",
      },
    ],
  },
  trivia: SUBSETS_TRIVIA,
  generateSteps: generateGeneratingSubsetsSteps,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 5,
      label: "Competitive Programmer's Handbook, Ch 5",
    },
  ],
  defaultInput: DEFAULT_GENERATING_SUBSETS_INPUT,
};

export default generatingSubsets;
