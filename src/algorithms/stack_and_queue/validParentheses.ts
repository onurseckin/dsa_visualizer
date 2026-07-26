import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  TopicGuide,
} from '../../types/dsa';
import type { TriviaMeta } from '../../types/trivia';

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

const VALID_PARENTHESES_TOPIC_GUIDE: TopicGuide = {
  overview:
    'A stack is the data structure for problems where the most recent unfinished thing must be resolved first, and bracket matching is its canonical example. You read the string once, remember every opener that has not yet been closed, and check each closer against the single opener that is legally allowed to close it, which is always the newest one. The structural idea being tested is nesting: brackets form a hierarchy rather than a list of independent pairs, and a stack is exactly the shape of that hierarchy.',
  sections: [
    {
      heading: 'Why nesting demands last-in-first-out',
      body: `Valid bracket strings are properly nested, meaning any pair either sits entirely inside another pair or entirely beside it, and pairs never partially overlap. That is why a string like "([)]" is invalid even though the counts of each bracket balance perfectly. Proper nesting means the bracket you must close next is always the most recently opened one still waiting, which is precisely what the top of a stack gives you for free. Counting cannot detect the violation, because you need to remember the order in which contexts were entered and you need to remember it in reverse. Each push records that you have entered a context and each pop records that you have left it, so the stack is a live picture of how deep you currently are.`,
    },
    {
      heading: 'The one-pass procedure',
      body: `Walk the characters from left to right starting with an empty stack. If the character is an opener you push it and move on, since nothing about it can be decided yet. If it is a closer you look up the opener it requires, and a small map from each closer to its partner makes that a single constant-time lookup instead of a chain of comparisons. Then you compare that requirement against the top of the stack: a mismatch, or an empty stack when a closer arrives, means the string is invalid and you can stop right there. A match means you pop, retiring both brackets together, and at the end the string is valid only if the stack is empty.`,
    },
    {
      heading: 'Three failure modes, three different checks',
      body: `There are exactly three ways a bracket string can be wrong, and each is caught in a different place. A closer arriving with nothing open fails the empty-stack test, a closer meeting the wrong opener fails the comparison, and openers that are never closed survive all the way to the end. That third case is why returning true requires an empty stack rather than merely surviving the loop, and forgetting it is the single most common bug in this problem, since a string of three open parentheses passes every in-loop test. The mirror mistake is returning true as soon as the stack becomes empty, which would wrongly accept a closer followed by an opener. You must reach the end of the string with no obligations left.`,
    },
    {
      heading: 'The invariant it maintains',
      body: `At every point in the scan the stack holds, from bottom to top, exactly the openers of the contexts you are currently inside, in the order you entered them. That is a strong statement and it is worth checking against the animation: the stack's depth is the nesting depth and its top is the pending obligation. Both branches preserve it, since a valid pair pushes and later pops, leaving the stack exactly as it found it. Given the invariant the correctness argument becomes one sentence: the string is valid precisely when every closer satisfies the obligation on top and no obligations remain when the input runs out.`,
    },
    {
      heading: 'When a stack is the right instinct',
      body: `Reach for a stack when a problem involves nesting, matching, undo, or the phrase "the most recent unresolved item". With only one kind of bracket a plain counter would suffice, incrementing on open, decrementing on close, failing on a negative value and requiring zero at the end, and it is worth seeing that the counter is just the degenerate case of a stack over a single symbol. Multiple bracket types break the counter because you must remember identity as well as depth. The same instinct explains why compilers, expression evaluators, and recursion itself lean on stacks, since the call stack is this exact structure recording which invocations are still unfinished.`,
    },
    {
      heading: 'How it generalizes',
      body: `Once brackets make sense, the sibling problems read as variations on one theme. Min Stack keeps an auxiliary stack of running minima so the extreme value is available in constant time. Evaluate Reverse Polish Notation pushes operands and pops two of them whenever an operator arrives, and Simplify Path pushes directory names and pops when it meets a parent reference. Decode String and Basic Calculator push the pending context, such as a repeat count or a partial sum, before entering a bracket and restore it on the way out, which is the nesting idea with a payload attached. Longest Valid Parentheses uses the same matching but stores indices so it can report which positions were at fault.`,
    },
  ],
  keyTerms: [
    {
      term: 'Stack',
      definition:
        'A last-in-first-out collection where the item pushed most recently is the first one popped. Here it holds openers awaiting their partners, newest on top.',
    },
    {
      term: 'Top of stack',
      definition:
        'The most recently pushed item that is still unresolved. It is the only opener a closing bracket is permitted to match.',
    },
    {
      term: 'Properly nested',
      definition:
        'The condition that bracket pairs are either fully contained within one another or completely disjoint, never partially overlapping. This is what separates validity from merely balanced counts.',
    },
    {
      term: 'Nesting depth',
      definition:
        'How many bracket contexts you are currently inside, which is exactly the size of the stack at that moment in the scan.',
    },
    {
      term: 'Bracket map',
      definition:
        'The lookup table from each closing bracket to the opener it requires, which turns the match test into one constant-time comparison.',
    },
  ],
};

const VALID_PARENTHESES_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: 'Defines is_valid(s) -> bool: checks whether the bracket string s is properly nested using a stack of open brackets.',
    2: "Starts with an empty stack — it will hold every opener that hasn't found its closing partner yet, most recent on top.",
    3: "Builds a lookup from each closing bracket to the opener it must match, so verifying a pair later is a single dictionary lookup instead of a chain of if/elif comparisons.",
    4: 'Walks the string left to right, visiting each character (and its index) exactly once.',
    5: 'Checks whether the current character is one of the three openers.',
    6: "An opener can't be resolved yet, so it's pushed onto the stack to wait for its closing partner — the most recently pushed opener will be the first one checked against a later closer.",
    7: "Otherwise the character must be a closer, since the string only ever contains brackets, so falls through to the matching logic.",
    8: 'A closer is only valid if the stack isn\'t empty and its top matches the opener this closer requires — checking both conditions here catches both "nothing to close" and "wrong bracket type" in one guard.',
    9: 'Either failure — an empty stack or a mismatched opener — means the nesting is broken beyond repair, so bails out immediately with False.',
    10: "The top of the stack correctly matches, so that opener's job is done — pops it off, closing the pair.",
    11: 'After the whole string is consumed, the string is valid only if the stack is empty — any leftover opener never found its closer, which a mid-loop check could never catch.',
  },
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
  topicGuide: VALID_PARENTHESES_TOPIC_GUIDE,
  trivia: VALID_PARENTHESES_TRIVIA,
  defaultInput: DEFAULT_VALID_PARENTHESES_INPUT,
  generateSteps: generateValidParenthesesSteps,
};

