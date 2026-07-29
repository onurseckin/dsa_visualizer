import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface ReverseLinkedListInput {
  nodes: number[];
}

export const REVERSE_LINKED_LIST_CODE = `def reverse_linked_list(head: "Optional[ListNode]") -> "Optional[ListNode]":
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`;

export const DEFAULT_REVERSE_LINKED_LIST_INPUT: ReverseLinkedListInput = {
  nodes: [1, 2, 3, 4, 5, 6],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Reverse Linked List inverts the pointer directions of a singly linked list in-place so each node points backward to its predecessor.",
    primarySnapshot: {
      kind: "array",
      name: "nodes",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "default" },
        { id: "c2", value: 2, label: "[1]", state: "default" },
        { id: "c3", value: 3, label: "[2]", state: "default" },
        { id: "c4", value: 4, label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Unlike arrays where elements can be accessed by index in O(1) time, linked lists only permit forward traversal via .next pointers, so we cannot step backward from the tail.",
    primarySnapshot: {
      kind: "array",
      name: "nodes",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "active", pointers: ["head"] },
        { id: "c2", value: 2, label: "[1]", state: "compare" },
        { id: "c3", value: 3, label: "[2]", state: "compare" },
        { id: "c4", value: 4, label: "[3]", state: "compare", pointers: ["tail"] },
      ],
    },
  },
  {
    narrative:
      "Pointer Loss Warning: overwriting curr.next = prev without saving curr.next first instantly destroys access to all downstream nodes, causing a critical memory leak.",
    primarySnapshot: {
      kind: "array",
      name: "nodes",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "visited", pointers: ["prev"] },
        { id: "c2", value: 2, label: "[1]", state: "swap", pointers: ["curr"] },
        { id: "c3", value: 3, label: "[2]", state: "active", pointers: ["nxt"] },
        { id: "c4", value: 4, label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "We maintain three pointers: prev (head of reversed prefix, starting at null), curr (active node being flipped), and nxt (stashed handle to next node).",
    primarySnapshot: {
      kind: "array",
      name: "nodes",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "active", pointers: ["curr"] },
        { id: "c2", value: 2, label: "[1]", state: "default", pointers: ["nxt"] },
        { id: "c3", value: 3, label: "[2]", state: "default" },
        { id: "c4", value: 4, label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Step 1 (Save): stash nxt = curr.next to preserve access to the remaining un-reversed suffix before breaking the forward connection.",
    primarySnapshot: {
      kind: "array",
      name: "nodes",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "active", pointers: ["curr"] },
        { id: "c2", value: 2, label: "[1]", state: "compare", pointers: ["nxt"] },
        { id: "c3", value: 3, label: "[2]", state: "default" },
        { id: "c4", value: 4, label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Step 2 (Flip): redirect curr.next backward to point to prev (curr.next = prev), inverting the pointer direction in O(1) time.",
    primarySnapshot: {
      kind: "array",
      name: "nodes",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "swap", pointers: ["curr -> prev"] },
        { id: "c2", value: 2, label: "[1]", state: "active", pointers: ["nxt"] },
        { id: "c3", value: 3, label: "[2]", state: "default" },
        { id: "c4", value: 4, label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Steps 3 & 4 (Advance): step prev forward to curr (prev = curr) and step curr forward to nxt (curr = nxt) to prepare for the next node.",
    primarySnapshot: {
      kind: "array",
      name: "nodes",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "sorted", pointers: ["prev"] },
        { id: "c2", value: 2, label: "[1]", state: "active", pointers: ["curr"] },
        { id: "c3", value: 3, label: "[2]", state: "default" },
        { id: "c4", value: 4, label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Completion: when curr becomes null, prev stands on the old tail node, which is the new head of the fully reversed linked list in O(N) time and O(1) space.",
    primarySnapshot: {
      kind: "array",
      name: "nodes",
      mode: "box",
      elements: [
        { id: "c1", value: 4, label: "[0]", state: "sorted", pointers: ["new head"] },
        { id: "c2", value: 3, label: "[1]", state: "sorted" },
        { id: "c3", value: 2, label: "[2]", state: "sorted" },
        { id: "c4", value: 1, label: "[3]", state: "sorted", pointers: ["tail -> null"] },
      ],
    },
  },
];

export const generateReverseLinkedListSteps = (input: ReverseLinkedListInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nodes = Array.isArray(input?.nodes)
    ? [...input.nodes]
    : DEFAULT_REVERSE_LINKED_LIST_INPUT.nodes;
  const n = nodes.length;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input.nodes) &&
      input.nodes.length === DEFAULT_REVERSE_LINKED_LIST_INPUT.nodes.length &&
      input.nodes.every((val, idx) => val === DEFAULT_REVERSE_LINKED_LIST_INPUT.nodes[idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const makeSnapshot = (
    currIdx?: number,
    prevIdx?: number,
    nxtIdx?: number,
    highlightState: ElementState = "compare",
    highlightIdx?: number,
    isComplete?: boolean,
  ): PrimaryVisualSnapshot => {
    const elements: ArrayElement[] = nodes.map((val, idx) => {
      const ptrs: string[] = [];
      if (idx === prevIdx) ptrs.push("prev");
      if (idx === currIdx) ptrs.push("curr");
      if (idx === nxtIdx) ptrs.push("nxt");

      let state: ArrayElement["state"] = "default";
      if (isComplete) {
        state = "sorted";
      } else if (idx === highlightIdx && highlightIdx !== undefined) {
        state = highlightState;
      } else if (idx === currIdx) {
        state = "active";
      } else if (prevIdx !== undefined && idx <= prevIdx) {
        state = "visited";
      }

      return {
        id: `el-${idx}`,
        value: val,
        label: `[${idx}]`,
        state,
        pointers: ptrs.length > 0 ? ptrs : undefined,
      };
    });

    return {
      kind: "array",
      name: "nodes",
      mode: "box",
      elements,
    };
  };

  if (n === 0) {
    addStep(
      "The input linked list is empty (head is null); returning null immediately.",
      {
        kind: "array",
        name: "nodes",
        mode: "box",
        elements: [],
      },
    );
    return steps;
  }

  addStep(
    `Having established the mental model, let's now transition to our selected linked list sequence of ${n} nodes: [${nodes.join(" -> ")}].`,
    makeSnapshot(0, undefined, undefined, "compare", 0),
  );

  let prevIdx = -1;
  let currIdx = 0;

  while (currIdx < n) {
    const currentVal = nodes[currIdx];
    const nxtIdx = currIdx + 1 < n ? currIdx + 1 : undefined;
    const nxtVal = nxtIdx !== undefined ? nodes[nxtIdx] : "null";

    addStep(
      `Inspect curr node [${currIdx}] (value ${currentVal}): prepare to process node and invert its next pointer.`,
      makeSnapshot(currIdx, prevIdx >= 0 ? prevIdx : undefined, nxtIdx, "compare", currIdx),
    );

    addStep(
      `Stash next node: nxt = curr.next (node ${nxtVal}) to preserve forward reference before breaking link.`,
      makeSnapshot(currIdx, prevIdx >= 0 ? prevIdx : undefined, nxtIdx, "active", nxtIdx),
    );

    addStep(
      `Invert link direction: set curr.next = prev (node ${prevIdx >= 0 ? nodes[prevIdx] : "null"}), reversing pointer direction.`,
      makeSnapshot(currIdx, prevIdx >= 0 ? prevIdx : undefined, nxtIdx, "swap", currIdx),
    );

    prevIdx = currIdx;
    currIdx = currIdx + 1;

    addStep(
      `Advance pointers: step prev to node ${nodes[prevIdx]} and step curr forward to ${currIdx < n ? `node ${nodes[currIdx]}` : "null"}.`,
      makeSnapshot(currIdx < n ? currIdx : undefined, prevIdx, undefined, "visited", prevIdx),
    );
  }

  const reversedValues = [...nodes].reverse();
  addStep(
    `Reverse Linked List complete! Reached end of list (curr is null); prev points to node ${nodes[n - 1]}, which is the new head of reversed list: [${reversedValues.join(" -> ")}].`,
    makeSnapshot(undefined, undefined, undefined, "sorted", undefined, true),
  );

  return steps;
};

const REVERSE_LINKED_LIST_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 7, 8],
  lineExplanations: {
    1: "Declares reverse_linked_list function accepting head node pointer.",
    2: "Initializes prev pointer to None as terminator for reversed list tail.",
    3: "Initializes curr pointer starting at list head.",
    4: "Loops while active curr pointer is not None.",
    5: "Stashes next node reference (nxt = curr.next) to prevent pointer loss.",
    6: "Inverts link direction by assigning curr.next = prev.",
    7: "Advances prev pointer forward to curr.",
    8: "Advances curr pointer forward to saved nxt node.",
    9: "Returns prev pointer as the new head of the reversed list.",
  },
};

export const reverseLinkedList: AlgorithmDefinition<ReverseLinkedListInput> = {
  id: "reverse-linked-list",
  title: "Reverse Linked List",
  topicIds: ["linked_list"],
  difficulty: "Easy",
  description: `<p>Given the <code>head</code> of a singly linked list, reverse the list, and return the reversed list.</p>
<h3>Problem Statement</h3>
<p>Given the head node of a singly linked list, reverse the directional links between nodes so that the tail node becomes the new head of the list.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>head</code>: The head node of a singly linked list (represented as an array of node values).</li>
</ul>
<h3>Output</h3>
<p>Returns the head of the reversed singly linked list.</p>
<h3>Constraints &amp; Edge Cases</h3>
<ul>
  <li><code>0 &le; N &le; 5000</code>.</li>
  <li><code>-5000 &le; Node.val &le; 5000</code>.</li>
  <li>Empty list (<code>head == null</code>) returns <code>null</code>.</li>
  <li>Single-node list returns <code>head</code> untouched.</li>
</ul>`,
  constraints: ["0 <= number of nodes <= 5000", "-5000 <= Node.val <= 5000"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard 6-Node List",
      input: DEFAULT_REVERSE_LINKED_LIST_INPUT,
      inputDisplay: "head = [1, 2, 3, 4, 5, 6]",
      output: "[6, 5, 4, 3, 2, 1]",
      outputDisplay: "[6, 5, 4, 3, 2, 1]",
      explanation: "Node next pointers are reversed iteratively so node 6 becomes the new head.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Adversarial 2-Node List",
      input: { nodes: [1, 2] },
      inputDisplay: "head = [1, 2]",
      output: "[2, 1]",
      outputDisplay: "[2, 1]",
      explanation: "Reverses two-node linked list.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Boundary Empty List Case",
      input: { nodes: [] },
      inputDisplay: "head = []",
      output: "[]",
      outputDisplay: "[]",
      explanation: "An empty linked list remains empty.",
    },
  ],
  code: REVERSE_LINKED_LIST_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Each node is visited once and undergoes 4 constant-time pointer assignments. Total time scales linearly with list size N, yielding O(N).",
    space: "Uses O(1) auxiliary space, requiring only 3 scalar pointers (prev, curr, nxt).",
  },
  topicGuide: {
    overview:
      "<p>A singly linked list is a linear data structure consisting of nodes with data payloads and single forward pointers. In-place reversal is the canonical pointer manipulation algorithm. By re-aiming each next pointer during a single linear traversal, the algorithm reverses the entire list in <em>O(N)</em> time and <em>O(1)</em> space. Reversal patterns underpin LRU caches, lock-free queues, and memory allocator free-lists.</p>",
    sections: [
      {
        heading: "Why Pointer Loss Must Be Avoided",
        body: "<p>In a singly linked list, <code>curr.next</code> is the only link to subsequent nodes. Overwriting <code>curr.next = prev</code> without saving <code>curr.next</code> first instantly destroys access to all remaining nodes, causing a memory leak / lost pointer bug. Stashing <code>nxt = curr.next</code> before flipping is mandatory.</p>",
      },
      {
        heading: "The Four-Step Pointer Dance",
        body: "<p>Inside the loop, execution follows a strict 4-step sequence: <code>nxt = curr.next</code>, <code>curr.next = prev</code>, <code>prev = curr</code>, <code>curr = nxt</code>. This maintains the invariant that <code>prev</code> always points to the head of the inverted prefix while <code>curr</code> points to the remaining forward suffix.</p>",
      },
      {
        heading: "Systems Performance & Memory Locality",
        body: "<p>Linked list nodes scattered across heap memory can cause CPU L1/L2 cache misses during traversal. Reversing in-place avoids heap allocations or garbage collection overhead, preserving cache footprint.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Singly Linked List",
        definition:
          "A chain of nodes where each node contains a value and a single pointer to its successor.",
      },
      {
        term: "In-Place Pointer Inversion",
        definition:
          "Modifying pointer targets directly within existing node objects without instantiating new node objects.",
      },
      {
        term: "Pointer Loss",
        definition:
          "The bug where overwriting a reference cuts off access to downstream nodes before preserving a handle.",
      },
    ],
  },
  trivia: REVERSE_LINKED_LIST_TRIVIA,
  leetcode: {
    id: 206,
    url: "https://leetcode.com/problems/reverse-linked-list/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #206",
      leetcodeId: 206,
      url: "https://leetcode.com/problems/reverse-linked-list/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 4",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 4,
      section: "4.1 Data structures",
    },
  ],
  defaultInput: DEFAULT_REVERSE_LINKED_LIST_INPUT,
  generateSteps: generateReverseLinkedListSteps,
};

export default reverseLinkedList;
