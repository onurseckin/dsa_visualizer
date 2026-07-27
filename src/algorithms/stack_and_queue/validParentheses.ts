import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ValidParenthesesInput {
  s: string;
}

export const VALID_PARENTHESES_CODE = `def is_valid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in "({[":
            stack.append(char)
        else:
            if not stack or stack[-1] != mapping[char]:
                return False
            stack.pop()
    return len(stack) == 0`;

export const DEFAULT_VALID_PARENTHESES_INPUT: ValidParenthesesInput = {
  s: "({[]})",
};

export const generateValidParenthesesSteps = (input: ValidParenthesesInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const s = input.s;
  const chars = s.split("");
  const n = chars.length;

  const elements: ArrayElement[] = chars.map((ch, idx) => ({
    id: `char-${idx}`,
    value: ch.charCodeAt(0),
    state: "default",
    pointers: [ch],
  }));

  const stack: string[] = [];
  const bracketMap: Record<string, string> = {
    ")": "(",
    "}": "{",
    "]": "[",
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => ({
          ...el,
          pointers: [...el.pointers!],
        })),
      },
      auxiliaryState: {
        stack: [...stack],
        customState: {
          stackTop: stack.length > 0 ? stack[stack.length - 1] : "EMPTY",
          stringLength: n,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Set up the bracket check",
    `We'll read "${s}" left to right, using a stack to remember which brackets are still open. The rule we're enforcing: the last bracket opened must be the first one closed.`,
    { inputString: s, length: n },
  );

  addStep(
    2,
    "Create an empty stack",
    "The stack holds open brackets that are waiting for a partner. Whenever a closer appears, the most recently opened bracket sits right on top, ready to be checked.",
    { stackSize: 0 },
  );

  addStep(
    3,
    "Map each closer to its opener",
    'We pair ")" with "(", "}" with "{", and "]" with "[" up front, so checking a match later is a single lookup instead of a chain of comparisons.',
    { map: '")":"(", "}":"{", "]":"["' },
  );

  for (let i = 0; i < n; i++) {
    const char = chars[i];
    elements[i].state = "active";

    addStep(
      4,
      `Read '${char}' at index ${i}`,
      `We take the next character, '${char}', and decide what it means: an opener starts a new nested context, while a closer must resolve the most recent one. The stack currently holds ${stack.length} unclosed bracket(s).`,
      { i, char, stackSize: stack.length },
    );

    if (char === "(" || char === "{" || char === "[") {
      addStep(
        5,
        `Recognize '${char}' as an opener`,
        `'${char}' starts a new nested context that isn't resolved yet, so we'll park it on the stack until its closing partner shows up.`,
        { i, char, isOpenBracket: true },
      );

      stack.push(char);
      elements[i].state = "queued";

      addStep(
        6,
        `Push '${char}' onto the stack`,
        `The stack now reads [${stack.join(", ")}] from bottom to top — every entry is a bracket still waiting to be closed.`,
        { i, char, stackSize: stack.length },
      );
    } else {
      const expectedOpen = bracketMap[char];
      const stackTop = stack.length > 0 ? stack[stack.length - 1] : undefined;

      addStep(
        8,
        `Match '${char}' against the stack top`,
        `A closing '${char}' is only valid if the most recent opener is '${expectedOpen}'. The top of the stack holds '${stackTop ?? "EMPTY"}', so we compare the two.`,
        { i, char, expectedOpen: expectedOpen ?? "", stackTop: stackTop ?? "EMPTY" },
      );

      if (stack.length === 0 || stackTop !== expectedOpen) {
        elements[i].state = "swap"; // error highlight

        addStep(
          9,
          "Return False — the brackets clash",
          `'${char}' needed '${expectedOpen}' on top of the stack but found '${stackTop ?? "EMPTY"}' instead. The nesting order is broken, so the string cannot be valid.`,
          { i, char, stackTop: stackTop ?? "EMPTY", isValid: false },
        );
        return steps;
      }

      const popped = stack.pop();
      elements[i].state = "visited";

      addStep(
        10,
        `Pop '${popped}' to close the pair`,
        `'${char}' correctly closes the '${popped}' on top, so we pop that pair away. ${stack.length === 0 ? "The stack is empty again." : `Still open: [${stack.join(", ")}].`}`,
        { i, char, poppedChar: popped!, stackSize: stack.length },
      );
    }
  }

  const isValid = stack.length === 0;

  for (let i = 0; i < n; i++) {
    elements[i].state = isValid ? "sorted" : "swap";
  }

  addStep(
    11,
    isValid ? "Return True — every bracket closed" : "Return False — brackets left open",
    isValid
      ? "We reached the end and the stack is empty, meaning every opener found its closer in the right order. The string is valid — one pass and one stack was all it took."
      : `We reached the end but [${stack.join(", ")}] never got closed. Leftover openers mean the string is invalid.`,
    { isValid, remainingStackSize: stack.length },
  );

  return steps;
};

const VALID_PARENTHESES_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines is_valid(s) -> bool: checks whether the bracket string s is properly nested using a stack of open brackets.",
    2: "Starts with an empty stack — it will hold every opener that hasn't found its closing partner yet, most recent on top.",
    3: "Builds a lookup from each closing bracket to the opener it must match, so verifying a pair later is a single dictionary lookup instead of a chain of if/elif comparisons.",
    4: "Walks the string left to right, visiting each character (and its index) exactly once.",
    5: "Checks whether the current character is one of the three openers.",
    6: "An opener can't be resolved yet, so it's pushed onto the stack to wait for its closing partner — the most recently pushed opener will be the first one checked against a later closer.",
    7: "Otherwise the character must be a closer, since the string only ever contains brackets, so falls through to the matching logic.",
    8: 'A closer is only valid if the stack isn\'t empty and its top matches the opener this closer requires — checking both conditions here catches both "nothing to close" and "wrong bracket type" in one guard.',
    9: "Either failure — an empty stack or a mismatched opener — means the nesting is broken beyond repair, so bails out immediately with False.",
    10: "The top of the stack correctly matches, so that opener's job is done — pops it off, closing the pair.",
    11: "After the whole string is consumed, the string is valid only if the stack is empty — any leftover opener never found its closer, which a mid-loop check could never catch.",
  },
};

export const validParentheses: AlgorithmDefinition<ValidParenthesesInput> = {
  id: "valid-parentheses",
  title: "Valid Parentheses",
  category: "stack_and_queue",
  categories: ["stack_and_queue"],
  difficulty: "Easy",
  description:
    "Determine if an input string composed of bracket characters (), {}, and [] is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct Last-In, First-Out (LIFO) order.\n3. Every close bracket has a corresponding open bracket of the same type.\n\n### Input Parameters\n- s: A string composed entirely of parenthesis characters '(', ')', '{', '}', '[', ']'.\n\n### Output\n- Returns true if the string is validly formatted and properly nested, otherwise false.\n\n### Edge Cases & Constraints\n- 1 <= s.length <= 10^4\n- s consists of parentheses only: ()[]{}.\n- Strings of odd length (e.g. s = '(') can never be valid and fail early.\n- Closing bracket arriving when stack is empty (e.g. s = ')').\n- Leftover open brackets remaining after scanning entire string (e.g. s = '((').",
  constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only: () {} []"],
  examples: [
    {
      kind: "basic",
      inputDisplay: 's = "({[]})"',
      outputDisplay: "true",
      title: "Basic Example",
      input: { s: "({[]})" },
      output: "true",
      explanation: "Nested brackets matching correctly in last-in-first-out order.",
    },
    {
      kind: "complex",
      inputDisplay: 's = "()[]{}()({[]})"',
      outputDisplay: "true",
      title: "Complex Edge Case",
      input: { s: "()[]{}()({[]})" },
      output: "true",
      explanation:
        "Multiple sequential and deeply nested bracket pairs correctly pushing and popping from the stack.",
    },
    {
      kind: "negative",
      inputDisplay: 's = "(]"',
      outputDisplay: "false",
      title: "Failing / Boundary Case",
      input: { s: "(]" },
      output: "false",
      explanation:
        "Closing bracket ']' does not match top of stack '('; returns false immediately.",
    },
  ],
  code: VALID_PARENTHESES_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "We scan the string once, and each character triggers at most one push or one pop — both constant-time stack operations backed by an O(1) map lookup. That single pass is the entire cost, so the time is O(n); an early mismatch only ends the scan sooner.",
    space:
      'The stack is what grows: a string of all openers like "(((((" pushes every character, so in the worst case it holds n brackets — O(n) extra space.',
  },
  topicGuide: {
    overview:
      "A stack is the core data structure for problems where the most recent unfinished obligation must be resolved first, and bracket matching is its canonical example. You scan the string left to right once, pushing every opener onto a Last-In, First-Out (LIFO) stack and popping to verify each closer against the top opener. Beyond string matching, this exact structural mechanism underpins compiler AST syntax parsing, HTML/JSX tag validation, PyTorch autograd block context managers, and CPU call stack frames.",
    sections: [
      {
        heading: "Core Concept & LIFO Nesting Invariant",
        body: `Valid bracket strings are properly nested, meaning any pair either sits entirely inside another pair or entirely beside it, and pairs never partially overlap. That is why a string like "([)]" is invalid even though the counts of each bracket balance perfectly. Proper nesting means the bracket you must close next is always the most recently opened one still waiting, which is precisely what the top of a stack provides. Simple counting cannot detect ordering violations because you must record the exact identity and sequence of open contexts in reverse. Each push enters a context, each pop exits it, and the stack represents the active hierarchy of obligations.`,
      },
      {
        heading: "Systems & Performance Impact",
        body: `In production compiler front-ends (such as Clang or Babel) and HTML engines (Blink/Gecko), stack-based parsing handles lexical token matching at gigabytes per second. A stack array operating on sequential cache lines maximizes CPU L1/L2 cache locality compared to pointer-heavy tree allocations. Furthermore, runtime execution environments like the V8 JavaScript engine or Python's CPython interpreter track execution contexts using an internal C-level call stack that follows the exact same push/pop pushdown automaton model.`,
      },
      {
        heading: "Implementation Nuances & Failure Modes",
        body: `Walk the characters left to right starting with an empty stack. Maintain an O(1) dictionary mapping each closing bracket to its required opener. Three distinct failure modes must be handled: (1) A closer arrives while the stack is empty (underflow), (2) A closer mismatches the top opener, or (3) Openers remain on the stack after processing all characters. Returning true requires both completing the loop without mismatch AND confirming the stack is completely empty.`,
      },
      {
        heading: "Edge Case & Complexity Analysis",
        body: `If the input string length is odd, it can never be balanced; an early parity check s.length % 2 != 0 allows instant O(1) rejection. Space complexity is O(N) in the worst case (e.g. s = "((((("), while time complexity is strictly linear O(N) as each character experiences at most 1 push and 1 pop operation.`,
      },
    ],
    keyTerms: [
      {
        term: "LIFO (Last-In, First-Out)",
        definition:
          "The access policy of a stack data structure where the most recently inserted item is the first one removed.",
      },
      {
        term: "Pushdown Automaton",
        definition:
          "A state machine augmented with a stack that allows parsing context-free grammars, such as nested parentheses and programming language syntax.",
      },
      {
        term: "Proper Nesting",
        definition:
          "The condition that pairs of delimiters are either completely disjoint or fully enclosed within one another without partial overlap.",
      },
    ],
  },
  trivia: VALID_PARENTHESES_TRIVIA,
  leetcode: {
    id: 20,
    url: "https://leetcode.com/problems/valid-parentheses/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #20",
      leetcodeId: 20,
      url: "https://leetcode.com/problems/valid-parentheses/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 4",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 4,
      section: "4.5 Stack",
    },
  ],
  defaultInput: DEFAULT_VALID_PARENTHESES_INPUT,
  generateSteps: generateValidParenthesesSteps,
};
