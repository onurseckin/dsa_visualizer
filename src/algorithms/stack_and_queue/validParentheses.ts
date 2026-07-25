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
    'Set up the bracket check',
    `We'll read "${s}" left to right, using a stack to remember which brackets are still open. The rule we're enforcing: the last bracket opened must be the first one closed.`,
    { inputString: s, length: n }
  );

  addStep(
    2,
    'Create an empty stack',
    'The stack holds open brackets that are waiting for a partner. Whenever a closer appears, the most recently opened bracket sits right on top, ready to be checked.',
    { stackSize: 0 }
  );

  addStep(
    3,
    'Map each closer to its opener',
    'We pair ")" with "(", "}" with "{", and "]" with "[" up front, so checking a match later is a single lookup instead of a chain of comparisons.',
    { map: '")":"(", "}":"{", "]":"["' }
  );

  for (let i = 0; i < n; i++) {
    const char = chars[i];
    elements[i].state = 'active';

    addStep(
      4,
      `Read '${char}' at index ${i}`,
      `We take the next character, '${char}', and decide what it means: an opener starts a new nested context, while a closer must resolve the most recent one. The stack currently holds ${stack.length} unclosed bracket(s).`,
      { i, char, stackSize: stack.length }
    );

    if (char === '(' || char === '{' || char === '[') {
      addStep(
        5,
        `Recognize '${char}' as an opener`,
        `'${char}' starts a new nested context that isn't resolved yet, so we'll park it on the stack until its closing partner shows up.`,
        { i, char, isOpenBracket: true }
      );

      stack.push(char);
      elements[i].state = 'queued';

      addStep(
        6,
        `Push '${char}' onto the stack`,
        `The stack now reads [${stack.join(', ')}] from bottom to top — every entry is a bracket still waiting to be closed.`,
        { i, char, stackSize: stack.length }
      );
    } else {
      const expectedOpen = bracketMap[char];
      const stackTop = stack.length > 0 ? stack[stack.length - 1] : undefined;

      addStep(
        8,
        `Match '${char}' against the stack top`,
        `A closing '${char}' is only valid if the most recent opener is '${expectedOpen}'. The top of the stack holds '${stackTop ?? 'EMPTY'}', so we compare the two.`,
        { i, char, expectedOpen: expectedOpen ?? '', stackTop: stackTop ?? 'EMPTY' }
      );

      if (stack.length === 0 || stackTop !== expectedOpen) {
        elements[i].state = 'swap'; // error highlight

        addStep(
          9,
          'Return False — the brackets clash',
          `'${char}' needed '${expectedOpen}' on top of the stack but found '${stackTop ?? 'EMPTY'}' instead. The nesting order is broken, so the string cannot be valid.`,
          { i, char, stackTop: stackTop ?? 'EMPTY', isValid: false }
        );
        return steps;
      }

      const popped = stack.pop();
      elements[i].state = 'visited';

      addStep(
        10,
        `Pop '${popped}' to close the pair`,
        `'${char}' correctly closes the '${popped}' on top, so we pop that pair away. ${stack.length === 0 ? 'The stack is empty again.' : `Still open: [${stack.join(', ')}].`}`,
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
    isValid
      ? 'Return True — every bracket closed'
      : 'Return False — brackets left open',
    isValid
      ? 'We reached the end and the stack is empty, meaning every opener found its closer in the right order. The string is valid — one pass and one stack was all it took.'
      : `We reached the end but [${stack.join(', ')}] never got closed. Leftover openers mean the string is invalid.`,
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
    'Determine if an input string of brackets () {} [] is valid using a stack: every closing bracket must match the most recently opened bracket.',
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
  complexityAnalysis: {
    time: 'We scan the string once, and each character triggers at most one push or one pop — both constant-time stack operations backed by an O(1) map lookup. That single pass is the entire cost, so the time is O(n); an early mismatch only ends the scan sooner.',
    space: 'The stack is what grows: a string of all openers like "(((((" pushes every character, so in the worst case it holds n brackets — O(n) extra space.',
  },
  defaultInput: DEFAULT_VALID_PARENTHESES_INPUT,
  generateSteps: generateValidParenthesesSteps,
};

