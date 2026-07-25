import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface ValidParenthesesInput {
  s: string;
}

export const VALID_PARENTHESES_CODE = `def is_valid(s: str) -> bool:
    stack = []
    bracket_map = {')': '(', '}': '{', ']': '['}
    for i, char in enumerate(s):
        if char in '({[':
            stack.append(char)
        else:
            if not stack or stack[-1] != bracket_map[char]:
                return False
            stack.pop()
    return len(stack) == 0`;

export const DEFAULT_VALID_PARENTHESES_INPUT: ValidParenthesesInput = {
  s: '({[]})',
};

export const generateValidParenthesesSteps = (
  input: ValidParenthesesInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const s = input.s;
  const chars = s.split('');
  const n = chars.length;

  const elements: ArrayElement[] = chars.map((ch, idx) => ({
    id: `char-${idx}`,
    value: ch.charCodeAt(0),
    state: 'default',
    pointers: [ch],
  }));

  const stack: string[] = [];
  const bracketMap: Record<string, string> = {
    ')': '(',
    '}': '{',
    ']': '[',
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>
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
        stack: [...stack],
        customState: {
          'stackTop': stack.length > 0 ? stack[stack.length - 1] : 'EMPTY',
          'stringLength': n,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    'Initialize Valid Parentheses Check',
    `LIFO Stack Parsing Strategy: Validate input bracket string "${s}" using a Last-In, First-Out (LIFO) stack to enforce proper bracket nesting and closure order.`,
    { inputString: s, length: n }
  );

  addStep(
    2,
    'Initialize Empty Stack',
    'Created empty stack data structure. The stack buffers open brackets so that the most recently opened bracket is evaluated first upon encountering a closing bracket.',
    { stackSize: 0 }
  );

  addStep(
    3,
    'Define Bracket Mappings',
    'Constructed bracket hash map { ")":"(", "}":"{", "]":"[" } for O(1) matching verification between closing brackets and expected opening brackets.',
    { map: '")":"(", "}":"{", "]":"["' }
  );

  for (let i = 0; i < n; i++) {
    const char = chars[i];
    elements[i].state = 'active';

    addStep(
      4,
      `Inspect index i = ${i} ('${char}')`,
      `Character Inspection: Reading bracket '${char}' at string index ${i}. Active stack depth: ${stack.length}.`,
      { i, char, stackSize: stack.length }
    );

    if (char === '(' || char === '{' || char === '[') {
      addStep(
        5,
        `Check if '${char}' is an open bracket`,
        `Opening Bracket Decision: '${char}' is an opening bracket, initiating a new nested context that must be pushed onto the stack.`,
        { i, char, isOpenBracket: true }
      );

      stack.push(char);
      elements[i].state = 'queued';

      addStep(
        6,
        `Push '${char}' onto stack`,
        `Push Action: Pushed open bracket '${char}' to top of stack. Active unclosed brackets stack: [${stack.join(', ')}].`,
        { i, char, stackSize: stack.length }
      );
    } else {
      const expectedOpen = bracketMap[char];
      const stackTop = stack.length > 0 ? stack[stack.length - 1] : undefined;

      addStep(
        8,
        `Check matching condition for closing bracket '${char}'`,
        `Closing Bracket Verification: Closing bracket '${char}' requires top of stack to hold matching open bracket '${expectedOpen}'. Current stack top: '${stackTop ?? 'EMPTY'}'.`,
        { i, char, expectedOpen: expectedOpen ?? '', stackTop: stackTop ?? 'EMPTY' }
      );

      if (stack.length === 0 || stackTop !== expectedOpen) {
        elements[i].state = 'swap'; // error highlight

        addStep(
          9,
          `Mismatch or empty stack! Return False`,
          `Validation Failure: Closing bracket '${char}' does not match top of stack '${stackTop ?? 'EMPTY'}'. Bracket order or symmetry is violated; return False!`,
          { i, char, stackTop: stackTop ?? 'EMPTY', isValid: false }
        );
        return steps;
      }

      const popped = stack.pop();
      elements[i].state = 'visited';

      addStep(
        10,
        `Pop '${popped}' from stack`,
        `Pop Match: Closing bracket '${char}' correctly matches open bracket '${popped}'. Popped '${popped}' from stack to resolve the nested pair.`,
        { i, char, poppedChar: popped ?? '', stackSize: stack.length }
      );
    }
  }

  const isValid = stack.length === 0;

  for (let i = 0; i < n; i++) {
    elements[i].state = isValid ? 'sorted' : 'swap';
  }

  addStep(
    11,
    `Final Check: Stack is ${isValid ? 'Empty (True)' : 'Non-empty (False)'}`,
    isValid
      ? 'All open brackets were matched and closed in correct LIFO sequence. String is VALID!'
      : `Unmatched open brackets remain in stack: [${stack.join(', ')}]. String is INVALID!`,
    { isValid, remainingStackSize: stack.length }
  );

  return steps;
};

export const validParentheses: AlgorithmDefinition<ValidParenthesesInput> = {
  id: 'valid-parentheses',
  title: 'Valid Parentheses',
  category: 'stack_and_queue',
  difficulty: 'Easy',
  description:
    'Determine if an input string of brackets () {} [] is valid using a LIFO stack to enforce exact opening-closing pair order and nesting symmetry.',
  constraints: [
    '1 <= s.length <= 10^4',
    's consists of parentheses only: () {} []',
  ],
  examples: [
    {
      input: 's = "({[]})"',
      output: 'true',
      explanation: 'All opening brackets are matched by corresponding closing brackets in exact LIFO order.',
    },
    {
      input: 's = "()[]{}"',
      output: 'true',
      explanation: 'Sequential matching bracket pairs are correctly closed.',
    },
    {
      input: 's = "(]"',
      output: 'false',
      explanation: 'Closing bracket ] does not match the most recently opened bracket (.',
    },
  ],
  code: VALID_PARENTHESES_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(n)',
  defaultInput: DEFAULT_VALID_PARENTHESES_INPUT,
  generateSteps: generateValidParenthesesSteps,
};

