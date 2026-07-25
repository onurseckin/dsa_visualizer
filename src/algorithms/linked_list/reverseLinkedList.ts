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
    'Initialize Reverse Linked List',
    `Iterative Reversal Strategy: Reversing list [${nodes.join(' -> ')}] in-place in O(n) time and O(1) space by shifting three pointers (prev, curr, nxt).`,
    { head: n > 0 ? nodes[0] : 'None', length: n }
  );

  if (n === 0) {
    addStep(
      2,
      'Initialize prev = None',
      'Base Case: List is empty. Initialize prev = None.',
      { prev: 'None', curr: 'None' }
    );
    addStep(
      9,
      'Return None',
      'Empty list reversed is None. Return None.',
      { newHead: 'None' }
    );
    return steps;
  }

  addStep(
    2,
    'Initialize prev = None',
    'Set prev pointer to None (null). The original head node will become the tail node of the reversed list, so its next pointer must point to None.',
    { prev: 'None' }
  );

  elements[0].state = 'active';
  elements[0].pointers = ['curr'];

  addStep(
    3,
    'Initialize curr = head',
    `Set active traversal pointer curr to original head node ${nodes[0]}.`,
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
      `Check while curr (curr = ${currentVal})`,
      `Loop Invariant: Node curr (${currentVal}) is non-null. Proceeding with pointer reversal step.`,
      { i, prev: prevVal, curr: currentVal }
    );

    addStep(
      5,
      `nxt = curr.next (nxt = ${nextVal})`,
      `Preserve Forward Link: Save reference to original next node nxt (${nextVal}) BEFORE modifying curr.next, preventing loss of remaining list access.`,
      { i, prev: prevVal, curr: currentVal, nxt: nextVal }
    );

    elements[i].state = 'swap';
    addStep(
      6,
      `curr.next = prev (node ${currentVal} -> ${prevVal})`,
      `Reverse Pointer Invariant: Overwrite node ${currentVal}'s next pointer to point backward to prev node (${prevVal}).`,
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
      `prev = curr (prev = ${currentVal})`,
      `Advance Prev Pointer: Move prev forward to node ${currentVal}, extending the reversed sub-list.`,
      { i, prev: currentVal, curr: currentVal }
    );

    addStep(
      8,
      `curr = nxt (curr = ${nextVal})`,
      `Advance Curr Pointer: Shift curr forward to saved nxt node (${nextVal}) to continue processing remaining unreversed list.`,
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
    'Check while curr (curr = None)',
    'Loop Termination: curr is now None (null). All node pointers have been reversed.',
    { prev: nodes[n - 1], curr: 'None' }
  );

  addStep(
    9,
    `Return prev (new head = ${nodes[n - 1]})`,
    `Reversal Complete: Pointer prev references node ${nodes[n - 1]}, which is the new head of the reversed linked list.`,
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
  defaultInput: DEFAULT_REVERSE_LINKED_LIST_INPUT,
  generateSteps: generateReverseLinkedListSteps,
};
