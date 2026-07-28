import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ReverseLinkedListInput {
  nodes: number[];
}

export const REVERSE_LINKED_LIST_CODE = `def reverse_linked_list(head: Optional[ListNode]) -> Optional[ListNode]:
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

  const nodes = input.nodes;
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
    "Start reversing the linked list",
    `Reversing singly linked list [${nodes.join(" -> ")}] in-place in $O(N)$ time and $O(1)$ space.`,
    { head: n > 0 ? nodes[0] : "None", length: n },
  );

  if (n === 0) {
    addStep(
      2,
      "Set prev to None",
      "The list is empty, so there are no links to flip — we set prev to None.",
      { prev: "None", curr: "None" },
    );
    addStep(9, "Return None", "An empty list reversed is still an empty list, so we return None.", {
      newHead: "None",
    });
    return steps;
  }

  addStep(
    2,
    "Initialize prev = None",
    `prev marks the head of the reversed portion. It starts at None because original head node ${nodes[0]} becomes the tail pointing to None.`,
    { prev: "None" },
  );

  elements[0].state = "active";
  elements[0].pointers = ["curr"];

  addStep(
    3,
    `Initialize curr = head (node ${nodes[0]})`,
    `curr marks the active node being processed. It begins at head node ${nodes[0]}.`,
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
      `Evaluate loop condition: while curr (node ${currentVal})`,
      `curr is valid (node ${currentVal}), so untouched nodes remain in forward list.`,
      { i, prev: prevVal, curr: currentVal },
    );

    addStep(
      5,
      `Stash next reference: nxt = curr.next (${nextVal})`,
      `Saving reference to node ${nextVal} in nxt before overwriting curr.next pointer.`,
      { i, prev: prevVal, curr: currentVal, nxt: nextVal },
    );

    elements[i].state = "swap";
    addStep(
      6,
      `Flip link: curr.next = prev (point node ${currentVal} to ${prevVal})`,
      `Reversing pointer direction: node ${currentVal} now points backward to ${prevVal}.`,
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
      `Advance prev = curr (prev now points to node ${currentVal})`,
      `Node ${currentVal} is now the head of the reversed portion so far.`,
      { i, prev: currentVal, curr: currentVal },
    );

    addStep(
      8,
      `Advance curr = nxt (curr now points to node ${nextVal})`,
      `Moving curr forward to stashed node ${nextVal} to process next link.`,
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
    "Evaluate loop condition: curr is None",
    "curr has reached end of list (None) — all pointers reversed.",
    { prev: nodes[n - 1], curr: "None" },
  );

  addStep(
    9,
    `Return prev (new head node ${nodes[n - 1]})`,
    `prev points at old tail node ${nodes[n - 1]}, which is the new head of the reversed list.`,
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
  description: `Master Reverse Linked List: invert pointer directions of a singly linked list in-place in $O(N)$ time and $O(1)$ space.

### Why It Exists & What It Solves
Unlike arrays where elements can be accessed by index in $O(1)$ time, a singly linked list only permits forward traversal via \`.next\` pointers. Reversing an array involves swapping elements from outside in. For a linked list, we cannot step backward from the tail; we must flip each \`.next\` pointer forward as we traverse. In-place reversal rearranges existing node references without instantiating new objects, avoiding heap allocations and memory fragmentation.

### Step-by-Step Intuition
1. **Three-Pointer Setup**: Maintain three pointers:
   - \`prev\`: Head of the already reversed portion (starts at \`None\`).
   - \`curr\`: Node currently being processed (starts at \`head\`).
   - \`nxt\`: Temporary handle to preserve forward connection (\`curr.next\`).
2. **Four-Step Inversion Loop**:
   - **Save**: \`nxt = curr.next\` (stash next node before link breaks).
   - **Flip**: \`curr.next = prev\` (redirect pointer backward).
   - **Advance Prev**: \`prev = curr\` (move reversed boundary forward).
   - **Advance Curr**: \`curr = nxt\` (hop to saved next node).
3. **Completion**: When \`curr\` becomes \`None\`, \`prev\` stands on the old tail, which is the new head!

### Input Parameters
- \`head\`: Pointer to the head node of a singly linked list.

### Output
- Returns pointer to the new head node of the reversed linked list.

### Trade-offs & Complexity
- **Time Complexity**: $O(N)$ worst/average case, making a single pass over $N$ nodes.
- **Space Complexity**: $O(1)$ auxiliary space using iterative pointer adjustments.

### Edge Cases & Constraints
- \`0 <= N <= 5000\`
- \`-5000 <= Node.val <= 5000\`
- Empty list (\`head == null\`): returns \`null\`.
- Single-node list (\`head.next == null\`): returns \`head\` untouched.`,
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
      "A singly linked list is a linear data structure consisting of nodes with data payloads and single forward pointers. In-place reversal is the canonical pointer manipulation algorithm. By re-aiming each next pointer during a single linear traversal, the algorithm reverses the entire list in O(N) time and O(1) space. Reversal patterns underpin LRU caches, lock-free queues, and memory allocator free-lists.",
    sections: [
      {
        heading: "Why Pointer Loss Must Be Avoided",
        body: "In a singly linked list, `curr.next` is the only link to subsequent nodes. Overwriting `curr.next = prev` without saving `curr.next` first instantly destroys access to all remaining nodes, causing a memory leak / lost pointer bug. Stashing `nxt = curr.next` before flipping is mandatory.",
      },
      {
        heading: "The Four-Step Pointer Dance",
        body: "Inside the `while curr:` loop, execution follows a strict 4-step sequence: `nxt = curr.next`, `curr.next = prev`, `prev = curr`, `curr = nxt`. This maintains the invariant that `prev` always points to the head of the inverted prefix while `curr` points to the remaining forward suffix.",
      },
      {
        heading: "Systems Performance & Memory Locality",
        body: "Linked list nodes scattered across heap memory can cause CPU L1/L2 cache misses during traversal. Reversing in-place avoids heap allocations or garbage collection overhead, preserving cache footprint.",
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
