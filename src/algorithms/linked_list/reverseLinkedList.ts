import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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

export const generateReverseLinkedListSteps = (input: ReverseLinkedListInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nodes = Array.isArray(input?.nodes)
    ? [...input.nodes]
    : DEFAULT_REVERSE_LINKED_LIST_INPUT.nodes;
  const n = nodes.length;

  const elements: ArrayElement[] = nodes.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: customState ?? {
          prev: String(variables.prev ?? "None"),
          curr: String(variables.curr ?? "None"),
          nxt: String(variables.nxt ?? "None"),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize linked list pointer inversion",
    `Preparing to reverse link directions in-place for singly linked list sequence [${nodes.join(" -> ")}] in O(N) time.`,
    { head: n > 0 ? nodes[0] : "None", length: n },
  );

  if (n === 0) {
    addStep(
      2,
      "Set prev pointer to null (terminator)",
      "The list is empty, so there are no pointers to invert.",
      { prev: "None", curr: "None" },
    );
    addStep(9, "Return null", "Reversing an empty list produces an empty list; returning null.", {
      newHead: "None",
    });
    return steps;
  }

  addStep(
    2,
    "Set prev pointer to null (terminator)",
    `prev marks the head of the reversed prefix. It begins at null because original head node ${nodes[0]} will become the new tail pointing to null.`,
    { prev: "None" },
  );

  elements[0].state = "active";
  elements[0].pointers = ["curr"];

  addStep(
    3,
    "Set curr pointer to list head",
    `Establishes curr as the active traversal pointer starting at head node ${nodes[0]}.`,
    { prev: "None", curr: nodes[0] },
  );

  let prevIdx = -1;

  for (let i = 0; i < n; i++) {
    const currentVal = nodes[i];
    const prevVal = prevIdx >= 0 ? nodes[prevIdx] : "None";
    const nextVal = i + 1 < n ? nodes[i + 1] : "None";

    // Clear old pointers
    for (let k = 0; k < n; k++) {
      const ptrs: string[] = [];
      if (k === prevIdx) ptrs.push("prev");
      if (k === i) ptrs.push("curr");
      if (k === i + 1) ptrs.push("nxt");
      elements[k].pointers = ptrs.length > 0 ? ptrs : undefined;
    }

    elements[i].state = "active";

    addStep(
      4,
      `Evaluate traversal condition: active node exists (${currentVal})`,
      `curr is valid (node ${currentVal}), indicating un-reversed nodes remain in the forward sequence.`,
      { i, prev: prevVal, curr: currentVal },
    );

    addStep(
      5,
      `Stash next node reference (${nextVal})`,
      `Preserves pointer reference to downstream node ${nextVal} in nxt before breaking and redirecting curr's link.`,
      { i, prev: prevVal, curr: currentVal, nxt: nextVal },
    );

    elements[i].state = "swap";
    addStep(
      6,
      `Invert pointer direction for node ${currentVal}`,
      `Redirects curr.next backward to point to prev (node ${prevVal}), reversing link direction in O(1) time.`,
      { i, "curr.next": prevVal, prev: prevVal, curr: currentVal },
    );

    prevIdx = i;
    elements[i].state = "visited";

    const prevPtrs: string[] = ["prev"];
    if (i + 1 < n) {
      elements[i + 1].pointers = ["curr"];
    }
    elements[i].pointers = prevPtrs;

    addStep(
      7,
      `Advance prev pointer to node ${currentVal}`,
      `Updates prev to mark node ${currentVal} as the new head of the reversed prefix so far.`,
      { i, prev: currentVal, curr: currentVal },
    );

    addStep(
      8,
      `Advance curr pointer to stashed node ${nextVal}`,
      `Moves curr forward to stashed node ${nextVal} to continue reversing remaining links.`,
      { i, prev: currentVal, curr: nextVal },
    );
  }

  // Clear pointers for final step
  for (let k = 0; k < n; k++) {
    elements[k].state = "sorted";
    elements[k].pointers = k === n - 1 ? ["newHead"] : undefined;
  }

  addStep(
    4,
    "Evaluate traversal condition: curr is null",
    "curr has reached null — all pointer directions are successfully reversed.",
    { prev: nodes[n - 1], curr: "None" },
  );

  addStep(
    9,
    `Return new head node (${nodes[n - 1]})`,
    `prev points to original tail node ${nodes[n - 1]}, which now serves as the head of the reversed linked list.`,
    { newHead: nodes[n - 1] },
  );

  return steps;
};

const REVERSE_LINKED_LIST_TRIVIA: TriviaMeta = {
  skipLines: [4],
  distractors: ["curr.next = nxt", "prev = nxt", "curr = prev", "return curr"],
  hints: [
    {
      line: 5,
      hint: "Stash curr.next before overwriting it so you don't lose the rest of the list.",
    },
    {
      line: 6,
      hint: "Point curr backward at prev to flip the pointer direction.",
    },
    {
      line: 7,
      hint: "Slide prev forward onto curr to expand the reversed list.",
    },
    {
      line: 8,
      hint: "Slide curr forward onto nxt to continue processing the remaining nodes.",
    },
  ],
  lineExplanations: {
    1: "Defines reverse_linked_list(head): inverts pointer directions of a singly linked list in-place.",
    2: "Initializes prev = None to serve as the tail terminator of the reversed list.",
    3: "Initializes curr = head to point at the first node to be reversed.",
    4: "Loops while curr is not None (untouched nodes remain).",
    5: "Stashes reference to next node (nxt = curr.next) before pointer reversal.",
    6: "Flips pointer: sets curr.next = prev to point backward.",
    7: "Advances prev pointer forward to curr node.",
    8: "Advances curr pointer forward to saved nxt node.",
    9: "Returns prev as the new head of the reversed list.",
  },
};

export const reverseLinkedList: AlgorithmDefinition<ReverseLinkedListInput> = {
  id: "reverse-linked-list",
  title: "Reverse Linked List",
  topicIds: ["linked_list"],
  difficulty: "Easy",
  description: `<p>Invert pointer directions of a singly linked list in-place in <em>O(N)</em> time and <em>O(1)</em> space.</p>
<h3>Why It Exists &amp; What It Solves</h3>
<p>Unlike arrays where elements can be accessed by index in <em>O(1)</em> time, a singly linked list only permits forward traversal via <code>.next</code> pointers. Reversing an array involves swapping elements from outside in. For a linked list, we cannot step backward from the tail; we must flip each <code>.next</code> pointer forward as we traverse. In-place reversal rearranges existing node references without instantiating new objects, avoiding heap allocations and memory fragmentation.</p>
<h3>Step-by-Step Intuition</h3>
<ul>
  <li><strong>Three-Pointer Setup</strong>: Maintain three pointers:
    <ul>
      <li><code>prev</code>: Head of the already reversed portion (starts at <code>None</code>).</li>
      <li><code>curr</code>: Node currently being processed (starts at <code>head</code>).</li>
      <li><code>nxt</code>: Temporary handle to preserve forward connection (<code>curr.next</code>).</li>
    </ul>
  </li>
  <li><strong>Four-Step Inversion Loop</strong>:
    <ul>
      <li><strong>Save</strong>: <code>nxt = curr.next</code> (stash next node before link breaks).</li>
      <li><strong>Flip</strong>: <code>curr.next = prev</code> (redirect pointer backward).</li>
      <li><strong>Advance Prev</strong>: <code>prev = curr</code> (move reversed boundary forward).</li>
      <li><strong>Advance Curr</strong>: <code>curr = nxt</code> (hop to saved next node).</li>
    </ul>
  </li>
  <li><strong>Completion</strong>: When <code>curr</code> becomes <code>None</code>, <code>prev</code> stands on the old tail, which is the new head!</li>
</ul>
<h3>Input Parameters</h3>
<ul>
  <li><code>head</code>: Pointer to the head node of a singly linked list.</li>
</ul>
<h3>Output</h3>
<p>Returns pointer to the new head node of the reversed linked list.</p>
<h3>Trade-offs &amp; Complexity</h3>
<ul>
  <li><strong>Time Complexity</strong>: <em>O(N)</em> worst/average case, making a single pass over <em>N</em> nodes.</li>
  <li><strong>Space Complexity</strong>: <em>O(1)</em> auxiliary space using iterative pointer adjustments.</li>
</ul>
<h3>Edge Cases &amp; Constraints</h3>
<ul>
  <li><code>0 &le; N &le; 5000</code></li>
  <li><code>-5000 &le; Node.val &le; 5000</code></li>
  <li>Empty list (<code>head == null</code>): returns <code>null</code>.</li>
  <li>Single-node list (<code>head.next == null</code>): returns <code>head</code> untouched.</li>
</ul>`,
  constraints: ["0 <= number of nodes <= 5000", "-5000 <= Node.val <= 5000"],
  examples: [
    {
      kind: "basic",
      title: "Basic Example",
      input: "head = [1, 2, 3, 4, 5, 6]",
      inputDisplay: "head = [1, 2, 3, 4, 5, 6]",
      output: "[6, 5, 4, 3, 2, 1]",
      outputDisplay: "[6, 5, 4, 3, 2, 1]",
      explanation: "Node next pointers are reversed iteratively so node 6 becomes the new head.",
    },
    {
      kind: "complex",
      title: "Complex Edge Case",
      input: "head = [1, 2]",
      inputDisplay: "head = [1, 2]",
      output: "[2, 1]",
      outputDisplay: "[2, 1]",
      explanation: "Reverses two-node linked list.",
    },
    {
      kind: "negative",
      title: "Failing / Boundary Case",
      input: "head = []",
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
