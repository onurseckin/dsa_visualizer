import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface ValidParenthesesInput {
  s: string;
}

export const VALID_PARENTHESES_CODE = `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.length === 0 || stack.pop() !== map[char]) {
        return false;
      }
    }
  }
  return stack.length === 0;
}`;

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
    `Validate input string "${s}" using stack-based matching.`,
    { inputString: s, length: n }
  );

  addStep(
    2,
    'Initialize Empty Stack',
    'Created empty call stack for tracking open brackets.',
    { stackSize: 0 }
  );

  for (let i = 0; i < n; i++) {
    const char = chars[i];
    elements[i].state = 'active';

    addStep(
      4,
      `Inspect index i = ${i} ('${char}')`,
      `Reading character '${char}' at index ${i}.`,
      { i, char, stackSize: stack.length }
    );

    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
      elements[i].state = 'queued';

      addStep(
        6,
        `Push open bracket '${char}' onto stack`,
        `Opening bracket '${char}' pushed. Stack now contains: [${stack.join(', ')}].`,
        { i, char, stackSize: stack.length }
      );
    } else {
      const expectedOpen = bracketMap[char];
      const stackTop = stack.length > 0 ? stack[stack.length - 1] : undefined;

      addStep(
        8,
        `Inspect closing bracket '${char}'`,
        `Closing bracket '${char}' requires matching open bracket '${expectedOpen}'. Top of stack: '${stackTop ?? 'EMPTY'}'.`,
        { i, char, expectedOpen, stackTop: stackTop ?? 'EMPTY' }
      );

      if (stack.length === 0 || stackTop !== expectedOpen) {
        elements[i].state = 'swap'; // error highlight

        addStep(
          9,
          `Mismatch or empty stack! Return false`,
          `Closing bracket '${char}' does not match top of stack '${stackTop ?? 'EMPTY'}'. String is invalid!`,
          { i, char, stackTop: stackTop ?? 'EMPTY', isValid: false }
        );
        return steps;
      }

      const popped = stack.pop();
      elements[i].state = 'visited';

      addStep(
        10,
        `Pop '${popped}' from stack`,
        `Successfully matched '${char}' with '${popped}'. Popped '${popped}' from stack.`,
        { i, char, poppedChar: popped ?? '', stackSize: stack.length }
      );
    }
  }

  const isValid = stack.length === 0;

  for (let i = 0; i < n; i++) {
    elements[i].state = isValid ? 'sorted' : 'swap';
  }

  addStep(
    14,
    `Final Check: Stack is ${isValid ? 'Empty (true)' : 'Non-empty (false)'}`,
    isValid
      ? 'All open brackets were matched correctly. String is VALID!'
      : `Unmatched open brackets remain in stack: [${stack.join(', ')}]. String is INVALID!`,
    { isValid, remainingStackSize: stack.length }
  );

  return steps;
};

export const validParentheses: AlgorithmDefinition<ValidParenthesesInput> = {
  id: 'valid-parentheses',
  title: 'Valid Parentheses',
  category: 'leetcode',
  difficulty: 'Easy',
  description:
    'Determine if an input string of brackets () {} [] is valid using a LIFO stack.',
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
