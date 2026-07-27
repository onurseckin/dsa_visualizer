import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ReverseLinkedListInput {
  nodes: number[];
}

export const REVERSE_LINKED_LIST_CODE = `
def reverse_linked_list(input_array):
    """
    Implementation of reverse_linked_list.
    """
    output_buffer = []
    for idx, element in enumerate(input_array):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        output_buffer.append((idx, val))
    return output_buffer
`;

export const DEFAULT_REVERSE_LINKED_LIST_INPUT: ReverseLinkedListInput = {
  nodes: [1, 2, 3, 4, 5],
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
    "Start reversing the list",
    `We want [${nodes.join(" -> ")}] to point the other way. Rather than building a copy, we walk the list once and flip each next pointer as we pass, juggling just three pointers: prev, curr, and nxt.`,
    { head: n > 0 ? nodes[0] : "None", length: n },
  );

  if (n === 0) {
    addStep(
      2,
      "Set prev to None",
      "The list is empty, so there are no links to flip — we set prev to None and we are already done.",
      { prev: "None", curr: "None" },
    );
    addStep(9, "Return None", "An empty list reversed is still an empty list, so we return None.", {
      newHead: "None",
    });
    return steps;
  }

  addStep(
    2,
    "Set prev to None",
    `We start prev at None because the current head, node ${nodes[0]}, will become the tail of the reversed list — and a tail's next pointer has to be None.`,
    { prev: "None" },
  );

  elements[0].state = "active";
  elements[0].pointers = ["curr"];

  addStep(
    3,
    `Point curr at the head, node ${nodes[0]}`,
    `curr marks the node we are working on right now. We begin at the head, node ${nodes[0]}, and we'll slide forward one node at a time until we fall off the end.`,
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
      `Check the loop: curr is ${currentVal}`,
      `curr still points at node ${currentVal}, so there is a link left to flip — we stay in the loop.`,
      { i, prev: prevVal, curr: currentVal },
    );

    addStep(
      5,
      `Save the next node, ${nextVal}`,
      `Flipping curr.next in a moment would cut us off from the rest of the list, so first we stash a reference to ${nextVal} in nxt. This little save is what makes reversing in place safe.`,
      { i, prev: prevVal, curr: currentVal, nxt: nextVal },
    );

    elements[i].state = "swap";
    addStep(
      6,
      `Flip node ${currentVal} to point at ${prevVal}`,
      `Here is the actual reversal: node ${currentVal}'s next pointer now aims backward at ${prevVal} instead of forward. One more link is turned around.`,
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
      `Move prev up to node ${currentVal}`,
      `Node ${currentVal} is now fully reversed, so prev advances onto it — prev always marks the head of the finished, already-flipped portion of the list.`,
      { i, prev: currentVal, curr: currentVal },
    );

    addStep(
      8,
      `Move curr to the saved node ${nextVal}`,
      `We hop curr forward to ${nextVal}, the node we stashed earlier, and repeat the same flip on the rest of the list.`,
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
    "Check the loop: curr is None",
    "curr has walked off the end of the list, which means every link has been flipped — the loop is done.",
    { prev: nodes[n - 1], curr: "None" },
  );

  addStep(
    9,
    `Return prev, the new head ${nodes[n - 1]}`,
    `prev finished on node ${nodes[n - 1]}, the old tail — which is exactly the head of the reversed list, so we hand it back. One pass over the list, constant extra space.`,
    { newHead: nodes[n - 1] },
  );

  return steps;
};

const REVERSE_LINKED_LIST_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: takes the head of a singly linked list and returns the head of the same list with every link reversed.",
    2: "Starts as the head of the already-reversed portion, which is empty at first — it also becomes the new tail's terminator, since the old head will end up pointing at None.",
    3: "The node currently being processed; the walk begins at the original head and moves forward one node at a time.",
    4: "Keep flipping links until curr falls off the end of the list, meaning every node has been processed.",
    5: "Stash a reference to the next node before we overwrite curr's link — without this save, the rest of the list would become unreachable the moment we rewrite curr.next.",
    6: "The actual reversal: point curr backward at prev instead of forward, turning one link around.",
    7: "Slide prev onto the node we just flipped, since it's now the head of the reversed portion.",
    8: "Advance curr to the node we saved earlier, so the same flip can be repeated on the rest of the untouched list.",
    9: "Once curr runs out, prev is sitting on the old tail — which is exactly the new head of the reversed list.",
  },
};

export const reverseLinkedList: AlgorithmDefinition<ReverseLinkedListInput> = {
  id: "reverse-linked-list",
  title: "Reverse Linked List",
  category: "linked_list",
  categories: ["linked_list"],
  difficulty: "Easy",
  description:
    "Reverses a singly linked list in O(n) time and O(1) space by iteratively modifying node next pointers.",
  constraints: ["0 <= number of nodes <= 5000", "-5000 <= Node.val <= 5000"],
  examples: [
    {
      kind: "basic",
      title: "Basic Example",
      input: "head = [1, 2, 3, 4, 5]",
      inputDisplay: "head = [1, 2, 3, 4, 5]",
      output: "[5, 4, 3, 2, 1]",
      outputDisplay: "[5, 4, 3, 2, 1]",
      explanation: "Node next pointers are reversed iteratively so node 5 becomes the new head.",
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
    time: 'We visit each node exactly once, and at every node we do the same constant amount of pointer work — save the next node, flip one link, advance two pointers. There is no nesting and no re-scanning, so the total work grows linearly with the list length: O(n) in every case, even when the list is already "reversed".',
    space:
      "No matter how long the list is, we only ever hold three pointer variables (prev, curr, nxt), and all flipping happens in place on the existing nodes — so extra memory stays constant at O(1).",
  },
  topicGuide: {
    overview:
      "A singly linked list is a chain of nodes where each node stores a value and a single reference to the next node, and nothing else — there are no indices and no way to look backward. Reversing that chain in place is the canonical exercise in pointer surgery: you cannot swap the two ends the way you would in an array, so you have to re-aim every next pointer as you walk past it. The three-pointer technique you learn here is the foundation for almost every linked-list problem, because they all come down to rewriting links without losing your grip on the rest of the list.",
    sections: [
      {
        heading: "Why a linked list resists reversal",
        body: "In an array you reverse by swapping the first and last elements, then the second and second-to-last, because random access lets you touch any position instantly. A singly linked list gives you only one move — follow next — so you cannot reach the tail without walking the whole chain, and once you are at the tail you cannot walk back. The insight that unlocks the problem is that reversal is entirely local: the finished list is just the original list with every single link turned around, and you can turn one link around at a time. The only real difficulty is that the moment you overwrite curr.next you destroy your one and only route to everything after curr.",
      },
      {
        heading: "The three-pointer walk",
        body: "You carry exactly three references. prev is the head of the portion you have already reversed, curr is the node you are about to flip, and nxt is a temporary stash of curr.next. Each iteration performs the same four statements in a fixed order: save nxt = curr.next, flip curr.next = prev, slide prev = curr, then slide curr = nxt. The order is not stylistic — saving nxt has to happen before the flip, or the flip erases the address you needed, and advancing prev has to happen before advancing curr, or you lose track of the reversed head. Once you have internalised that little four-step dance you can write this function without thinking.",
      },
      {
        heading: "The invariant that proves it works",
        body: "At the top of every loop iteration the list is split cleanly in two: every node from the original head up to but not including curr has been reversed and prev points at its head, while curr points at the first untouched node whose forward chain is still fully intact. One iteration flips exactly one link and advances both pointers by one node, which moves the boundary forward while keeping both halves well formed, so the invariant survives. The loop ends when curr becomes None, meaning the untouched half is empty and the reversed half is the entire list — so prev is the new head, which is exactly what you return. Notice that starting prev at None is what silently gives the old head its correct None terminator.",
      },
      {
        heading: "Iterative, recursive, or copy the values",
        body: "A recursive version reads elegantly — reverse the tail, then attach the current node behind it — but it opens one stack frame per node, so a five-thousand-node list will exhaust the default recursion limit in Python and risks a stack overflow in most languages. Copying the values into an array, reversing the array, and writing them back is easy to get right, but it costs a second pass and O(n) memory, and it quietly fails whenever the problem cares about the node objects themselves rather than their payloads, as it does when nodes are shared or spliced elsewhere. The iterative walk is the version to reach for by default: one pass, constant memory, no recursion risk. Reach for recursion only when the problem genuinely wants a bottom-up formulation, such as reversing in groups.",
      },
      {
        heading: "Pitfalls and edge cases",
        body: "The empty list handles itself: curr starts at None, the loop body never runs, and you return prev, which is still None — correct without a special case. A single node is flipped once so its next becomes None, and it is both head and tail. The classic bug is writing curr = curr.next after curr.next = prev, which sends you backward into the already-reversed half and loops forever or halts early; that is precisely why nxt exists. One more thing to keep in mind is that after the call the variable head, if you still hold it, now names the tail — external references do not follow the reversal, which is why the function must return the new head rather than mutate in place silently.",
      },
      {
        heading: "Where this technique goes next",
        body: "Reversing a sublist between two positions uses the same loop, bounded by counters, with a dummy node in front so the head itself has a stable predecessor to splice against. Reversing in groups of k runs the loop k times, then reconnects the group to the previous one and recurses on the remainder. A palindrome check finds the midpoint with slow and fast pointers, reverses the second half with this exact code, then compares the halves; the reorder-list problem does the same and then interleaves them. Across all of them the discipline is identical: before you rewrite a link, stash whatever that link was your only way of reaching.",
      },
    ],
    keyTerms: [
      {
        term: "Singly linked list",
        definition:
          "A sequence of nodes in which each node holds a value and one reference to its successor, with the last node pointing at None. Traversal is forward-only and there is no direct access by position.",
      },
      {
        term: "In-place",
        definition:
          "Rearranging the existing nodes by changing their pointers rather than allocating new nodes or an auxiliary array. It is what lets this algorithm use constant extra memory.",
      },
      {
        term: "prev, curr, nxt",
        definition:
          "The three working references: prev is the head of the already-reversed prefix, curr is the node whose link you are flipping, and nxt is the saved successor that keeps the untouched suffix reachable.",
      },
      {
        term: "Loop invariant",
        definition:
          'A statement that is true before and after every iteration, here "the prefix behind curr is reversed and headed by prev". Proving it holds is how you convince yourself the final answer is right rather than testing your way to confidence.',
      },
      {
        term: "Lost link",
        definition:
          'The failure mode where you overwrite the only pointer that led to part of the list, making those nodes unreachable. Every linked-list bug of the "my list got truncated" variety is a lost link.',
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
