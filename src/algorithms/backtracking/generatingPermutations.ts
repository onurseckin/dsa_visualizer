import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface GeneratingPermutationsInput {
  elements: number[];
}

export const DEFAULT_GENERATING_PERMUTATIONS_INPUT: GeneratingPermutationsInput = {
  elements: [1, 2, 3],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Permutation Generation problem asks to construct all N! distinct linear orderings of an array of N unique elements.",
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
      "We model the search space as a decision tree of depth N, where each level picks an available element for the current position in the sequence.",
    primarySnapshot: {
      kind: "composite",
      layout: "vertical",
      heading: "Permutation State Tree",
      items: [
        {
          id: "curr-perm",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "current_perm",
            mode: "box",
            elements: [
              { id: "p1", value: 1, label: "pos 0", state: "sorted" },
              { id: "p2", value: "?", label: "pos 1", state: "active" },
              { id: "p3", value: "?", label: "pos 2", state: "default" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "A boolean array `used` tracks which elements are already chosen in the current search path to prevent duplicate element selection.",
    primarySnapshot: {
      kind: "array",
      name: "used",
      mode: "box",
      elements: [
        { id: "u0", value: "true", label: "elem 1", state: "visited" },
        { id: "u1", value: "false", label: "elem 2", state: "default" },
        { id: "u2", value: "false", label: "elem 3", state: "default" },
      ],
    },
  },
  {
    narrative:
      "At position k, we iterate over all elements: if used[i] is false, we mark used[i] = true and append element i to the sequence.",
    primarySnapshot: {
      kind: "array",
      name: "decision",
      mode: "box",
      elements: [
        { id: "d1", value: 1, label: "used", state: "visited" },
        { id: "d2", value: 2, label: "pick ->", state: "active" },
        { id: "d3", value: 3, label: "available", state: "default" },
      ],
    },
  },
  {
    narrative:
      "When current_perm length equals N, all positions are filled, forming a complete leaf permutation that is appended to the results list.",
    primarySnapshot: {
      kind: "array",
      name: "current_perm",
      mode: "box",
      elements: [
        { id: "l1", value: 1, label: "[0]", state: "sorted" },
        { id: "l2", value: 2, label: "[1]", state: "sorted" },
        { id: "l3", value: 3, label: "[2]", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "After exploring a subtree, we perform the backtracking step: we pop the last element from current_perm and reset used[i] = false.",
    primarySnapshot: {
      kind: "array",
      name: "backtrack",
      mode: "box",
      elements: [
        { id: "b1", value: 1, label: "pos 0", state: "sorted" },
        { id: "b2", value: 2, label: "pos 1", state: "sorted" },
        { id: "b3", value: "pop ->", label: "un-choose 3", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "State restoration guarantees that a single mutable buffer is reused across all N! paths without allocating extra memory.",
    primarySnapshot: {
      kind: "array",
      name: "invariant",
      mode: "box",
      elements: [
        { id: "i1", value: "Push -> Recurse -> Pop", state: "sorted" },
        { id: "i2", value: "Mark -> Recurse -> Unmark", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "After exploring all decision branches, the algorithm terminates having generated all N! permutations in O(N * N!) time and O(N) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "s1", value: "3! = 6 Permutations", state: "sorted" },
        { id: "s2", value: "O(N * N!) Time, O(N) Space", state: "default" },
      ],
    },
  },
];

export const generateGeneratingPermutationsSteps = (
  input: GeneratingPermutationsInput,
): AlgorithmStep[] => {
  const safeInput = input ?? DEFAULT_GENERATING_PERMUTATIONS_INPUT;
  const rawElements = Array.isArray(safeInput.elements)
    ? safeInput.elements
    : DEFAULT_GENERATING_PERMUTATIONS_INPUT.elements;
  const nums = rawElements.length > 0 ? rawElements.slice(0, 5) : [1, 2, 3];
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
      input.elements.length === DEFAULT_GENERATING_PERMUTATIONS_INPUT.elements.length &&
      input.elements.every(
        (val, idx) => val === DEFAULT_GENERATING_PERMUTATIONS_INPUT.elements[idx],
      ));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const allPermutations: number[][] = [];
  const currPerm: number[] = [];
  const used = Array(n).fill(false);

  const makeSnapshot = (activeIdx?: number, isLeaf = false): PrimaryVisualSnapshot => ({
    kind: "composite",
    layout: "vertical",
    heading: `Permutation Building: [${currPerm.join(", ")}]`,
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
            state: activeIdx === idx ? "active" : used[idx] ? "visited" : "default",
            pointers: activeIdx === idx ? ["pick"] : used[idx] ? ["used"] : undefined,
          })),
        },
      },
      {
        id: "perm-array",
        role: "primary",
        snapshot: {
          kind: "array",
          name: "currPerm",
          mode: "box",
          elements: Array.from({ length: n }, (_, idx) => ({
            id: `perm-${idx}`,
            value: idx < currPerm.length ? currPerm[idx] : "?",
            label: `pos ${idx}`,
            state: isLeaf
              ? "sorted"
              : idx < currPerm.length
                ? "visited"
                : idx === currPerm.length
                  ? "active"
                  : "default",
          })),
        },
      },
    ],
  });

  addStep(
    `Initializing Permutation backtracking for elements [${nums.join(", ")}]. Target permutation count is ${n}! = ${factorial(n)}.`,
    makeSnapshot(),
  );

  const backtrack = () => {
    if (currPerm.length === n) {
      allPermutations.push([...currPerm]);
      addStep(
        `Recorded complete permutation #${allPermutations.length}: [${currPerm.join(", ")}].`,
        makeSnapshot(undefined, true),
      );
      return;
    }

    for (let i = 0; i < n; i++) {
      if (used[i]) {
        addStep(
          `Inspecting candidate element nums[${i}] = ${nums[i]}: element is already marked as used in current branch, skipping.`,
          makeSnapshot(i),
        );
        continue;
      }

      used[i] = true;
      currPerm.push(nums[i]);
      addStep(
        `Chose available element nums[${i}] = ${nums[i]}: marked used[${i}] = true and appended to sequence [${currPerm.join(", ")}].`,
        makeSnapshot(i),
      );

      backtrack();

      const popped = currPerm.pop();
      used[i] = false;
      addStep(
        `Backtracked from branch: removed element ${popped} from sequence and reset used[${i}] = false.`,
        makeSnapshot(i),
      );
    }
  };

  backtrack();

  addStep(
    `Completed Permutation Backtracking: generated all ${allPermutations.length} unique permutations of [${nums.join(", ")}].`,
    makeSnapshot(undefined, true),
  );

  return steps;
};

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

const PERMUTATIONS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: generate all N! permutations of array elements.",
    2: "Initialize result list to collect generated permutations.",
    3: "Create boolean used array tracking elements in current permutation.",
    4: "Blank line separating variable initialization from backtrack helper function.",
    5: "Recursive helper function backtrack(current_perm).",
    6: "Base case: when len(current_perm) equals len(elements), record copy.",
    7: "Append current permutation copy to result list.",
    8: "Returns from current recursion level after adding complete permutation.",
    9: "Blank line separating base case from recursive search loop.",
    10: "Iterate over all elements to pick the next position.",
    11: "If element is already used in current branch, skip it.",
    12: "Skip used element.",
    13: "Mark element as used in boolean tracking array.",
    14: "Append element to current_perm.",
    15: "Recurse into next decision level.",
    16: "Pop element from current_perm to un-choose.",
    17: "Unmark used[i] to backtrack for sibling choices.",
    18: "Blank line separating recursive loop from initial backtrack call.",
    19: "Start recursion with empty initial permutation.",
    20: "Return all generated permutations.",
  },
};

export const generatingPermutations: AlgorithmDefinition<GeneratingPermutationsInput> = {
  id: "generating-permutations",
  title: "Generating Permutations",
  topicIds: ["backtracking"],
  difficulty: "Medium",
  description:
    "<p>Given an array of distinct integers <code>elements</code>, return all possible permutations (distinct linear orderings) of the array elements in any order.</p><p><strong>Input:</strong> An array of integers <code>elements</code>.</p><p><strong>Output:</strong> A list of arrays, where each array is a unique permutation of <code>elements</code>.</p>",
  constraints: [
    "1 <= elements.length <= 8",
    "-10 <= elements[i] <= 10",
    "All elements of elements are unique",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "elements = [1, 2, 3]",
      outputDisplay: "6 permutations",
      title: "Standard 3-Element Case",
      input: DEFAULT_GENERATING_PERMUTATIONS_INPUT,
      output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",
      explanation: "3 distinct elements produce 3! = 6 distinct orderings.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "elements = [1, 2, 3, 4]",
      outputDisplay: "24 permutations",
      title: "Adversarial 4-Element Search Space",
      input: { elements: [1, 2, 3, 4] },
      output: "24 distinct orderings",
      explanation: "4 distinct elements produce 4! = 24 distinct orderings.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "elements = [1]",
      outputDisplay: "[[1]]",
      title: "Single Element Boundary",
      input: { elements: [1] },
      output: "[[1]]",
      explanation: "1 element array has exactly 1 permutation: [[1]].",
    },
  ],
  code: `def permute(nums: list[int]) -> list[list[int]]:
    result = []
    used = [False] * len(nums)

    def backtrack(current_perm: list[int]):
        if len(current_perm) == len(nums):
            result.append(current_perm.copy())
            return

        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            current_perm.append(nums[i])
            backtrack(current_perm)
            current_perm.pop()
            used[i] = False

    backtrack([])
    return result`,
  timeComplexity: {
    best: "O(N * N!)",
    average: "O(N * N!)",
    worst: "O(N * N!)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Generating all N! permutations requires building N! leaf nodes in the decision tree. Copying each permutation of length N into the output list takes O(N) work, yielding O(N * N!) total time complexity.",
    space:
      "Auxiliary stack memory is O(N) corresponding to maximum recursion depth N. The boolean used array takes O(N) space.",
  },
  topicGuide: {
    overview:
      "<p>Generating permutations is the fundamental model for decision-tree traversal over non-overlapping choices. The algorithm systematically constructs all <code>N!</code> arrangements by picking available elements at each depth level.</p>",
    sections: [
      {
        heading: "Permutation Tree Geometry & Branching Factor",
        body: "<p>The search tree branches by <code>N</code> choices at root level 0, <code>N-1</code> choices at level 1, down to 1 choice at level <code>N-1</code>. The tree has <code>N!</code> leaf nodes at depth <code>N</code>, representing all complete linear orderings.</p>",
      },
      {
        heading: "State Management & Backtracking Invariants",
        body: "<p>Rather than copying intermediate lists at every recursive call, backtracking maintains a single mutable <code>current_perm</code> list and a boolean <code>used</code> array. Reversing state changes (pop and un-marking <code>used[i]</code>) during recursion unwinding ensures zero extra allocation during search tree traversal.</p>",
      },
      {
        heading: "Systems & Compiler Applications",
        body: "<p>Instruction schedulers in compilers evaluate localized basic block instruction permutations to minimize pipeline stalls and CPU register spill overhead. Similarly, query planners evaluate join-order permutations when cost-based optimizers search for minimal disk I/O query execution trees.</p>",
      },
      {
        heading: "Handling Duplicate Inputs (Permutations II)",
        body: "<p>When input elements contain duplicates, generating unique permutations requires sorting the array first and enforcing a skip guard: if <code>nums[i] == nums[i-1]</code> and <code>not used[i-1]</code>, skip index <code>i</code> to avoid duplicate branch trees.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Permutation",
        definition: "An arrangement of all members of a set into a specific linear sequence.",
      },
      {
        term: "Backtracking Invariant",
        definition:
          "The property that state mutations performed during tree descent are completely restored before returning to a parent node.",
      },
      {
        term: "State Space Tree",
        definition:
          "A conceptual tree where each node represents a partial candidate sequence and leaves represent completed permutations.",
      },
    ],
  },
  trivia: PERMUTATIONS_TRIVIA,
  generateSteps: generateGeneratingPermutationsSteps,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 5,
      label: "Competitive Programmer's Handbook, Ch 5",
    },
  ],
  defaultInput: DEFAULT_GENERATING_PERMUTATIONS_INPUT,
};

export default generatingPermutations;
