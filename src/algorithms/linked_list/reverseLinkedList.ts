import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface ReverseLinkedListInput {
  nodes: number[];
}

export const REVERSE_LINKED_LIST_CODE = `def reverse_list(head: Optional[ListNode]) -> Optional[ListNode]:
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`;

export const DEFAULT_REVERSE_LINKED_LIST_INPUT: ReverseLinkedListInput = {
  nodes: [1, 2, 3, 4, 5],
};

export const generateReverseLinkedListSteps = (
  input: ReverseLinkedListInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nodes = input.nodes;
  const n = nodes.length;

  const elements: ArrayElement[] = nodes.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: 'default',
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customState?: Record<string, string | number>
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
        customState: customState ?? {
          prev: String(variables.prev ?? 'None'),
          curr: String(variables.curr ?? 'None'),
          nxt: String(variables.nxt ?? 'None'),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    'Start reversing the list',
    `We want [${nodes.join(' -> ')}] to point the other way. Rather than building a copy, we walk the list once and flip each next pointer as we pass, juggling just three pointers: prev, curr, and nxt.`,
    { head: n > 0 ? nodes[0] : 'None', length: n }
  );

  if (n === 0) {
    addStep(
      2,
      'Set prev to None',
      'The list is empty, so there are no links to flip — we set prev to None and we are already done.',
      { prev: 'None', curr: 'None' }
    );
    addStep(
      9,
      'Return None',
      'An empty list reversed is still an empty list, so we return None.',
      { newHead: 'None' }
    );
    return steps;
  }

  addStep(
    2,
    'Set prev to None',
    `We start prev at None because the current head, node ${nodes[0]}, will become the tail of the reversed list — and a tail's next pointer has to be None.`,
    { prev: 'None' }
  );

  elements[0].state = 'active';
  elements[0].pointers = ['curr'];

  addStep(
    3,
    `Point curr at the head, node ${nodes[0]}`,
    `curr marks the node we are working on right now. We begin at the head, node ${nodes[0]}, and we'll slide forward one node at a time until we fall off the end.`,
    { prev: 'None', curr: nodes[0] }
  );

  let prevIdx = -1;

  for (let i = 0; i < n; i++) {
    const currentVal = nodes[i];
    const prevVal = prevIdx >= 0 ? nodes[prevIdx] : 'None';
    const nextVal = i + 1 < n ? nodes[i + 1] : 'None';

    // Clear old pointers
    for (let k = 0; k < n; k++) {
      const ptrs: string[] = [];
      if (k === prevIdx) ptrs.push('prev');
      if (k === i) ptrs.push('curr');
      if (k === i + 1) ptrs.push('nxt');
      elements[k].pointers = ptrs.length > 0 ? ptrs : undefined;
    }

    elements[i].state = 'active';

    addStep(
      4,
      `Check the loop: curr is ${currentVal}`,
      `curr still points at node ${currentVal}, so there is a link left to flip — we stay in the loop.`,
      { i, prev: prevVal, curr: currentVal }
    );

    addStep(
      5,
      `Save the next node, ${nextVal}`,
      `Flipping curr.next in a moment would cut us off from the rest of the list, so first we stash a reference to ${nextVal} in nxt. This little save is what makes reversing in place safe.`,
      { i, prev: prevVal, curr: currentVal, nxt: nextVal }
    );

    elements[i].state = 'swap';
    addStep(
      6,
      `Flip node ${currentVal} to point at ${prevVal}`,
      `Here is the actual reversal: node ${currentVal}'s next pointer now aims backward at ${prevVal} instead of forward. One more link is turned around.`,
      { i, 'curr.next': prevVal, prev: prevVal, curr: currentVal }
    );

    prevIdx = i;
    elements[i].state = 'visited';

    const prevPtrs: string[] = ['prev'];
    if (i + 1 < n) {
      elements[i + 1].pointers = ['curr'];
    }
    elements[i].pointers = prevPtrs;

    addStep(
      7,
      `Move prev up to node ${currentVal}`,
      `Node ${currentVal} is now fully reversed, so prev advances onto it — prev always marks the head of the finished, already-flipped portion of the list.`,
      { i, prev: currentVal, curr: currentVal }
    );

    addStep(
      8,
      `Move curr to the saved node ${nextVal}`,
      `We hop curr forward to ${nextVal}, the node we stashed earlier, and repeat the same flip on the rest of the list.`,
      { i, prev: currentVal, curr: nextVal }
    );
  }

  // Clear pointers for final step
  for (let k = 0; k < n; k++) {
    elements[k].state = 'sorted';
    elements[k].pointers = k === n - 1 ? ['newHead'] : undefined;
  }

  addStep(
    4,
    'Check the loop: curr is None',
    'curr has walked off the end of the list, which means every link has been flipped — the loop is done.',
    { prev: nodes[n - 1], curr: 'None' }
  );

  addStep(
    9,
    `Return prev, the new head ${nodes[n - 1]}`,
    `prev finished on node ${nodes[n - 1]}, the old tail — which is exactly the head of the reversed list, so we hand it back. One pass over the list, constant extra space.`,
    { newHead: nodes[n - 1] }
  );

  return steps;
};

export const reverseLinkedList: AlgorithmDefinition<ReverseLinkedListInput> = {
  id: 'reverse-linked-list',
  title: 'Reverse Linked List',
  category: 'linked_list',
  difficulty: 'Easy',
  description:
    'Reverses a singly linked list in O(n) time and O(1) space by iteratively modifying node next pointers.',
  constraints: [
    '0 <= number of nodes <= 5000',
    '-5000 <= Node.val <= 5000',
  ],
  examples: [
    {
      input: 'head = [1, 2, 3, 4, 5]',
      output: '[5, 4, 3, 2, 1]',
      explanation: 'Node next pointers are reversed iteratively so node 5 becomes the new head.',
    },
    {
      input: 'head = [1, 2]',
      output: '[2, 1]',
      explanation: 'Reverses two-node linked list.',
    },
    {
      input: 'head = []',
      output: '[]',
      explanation: 'An empty linked list remains empty.',
    },
  ],
  code: REVERSE_LINKED_LIST_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(1)',
  complexityAnalysis: {
    time: 'We visit each node exactly once, and at every node we do the same constant amount of pointer work — save the next node, flip one link, advance two pointers. There is no nesting and no re-scanning, so the total work grows linearly with the list length: O(n) in every case, even when the list is already "reversed".',
    space: 'No matter how long the list is, we only ever hold three pointer variables (prev, curr, nxt), and all flipping happens in place on the existing nodes — so extra memory stays constant at O(1).',
  },
  defaultInput: DEFAULT_REVERSE_LINKED_LIST_INPUT,
  generateSteps: generateReverseLinkedListSteps,
};
