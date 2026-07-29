import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  CompositeCanvasSnapshot,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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
  s: "({[()]}())",
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Valid Parentheses problem determines whether a string of bracket characters (), {}, and [] is properly formatted and correctly nested.",
    primarySnapshot: {
      kind: "array",
      name: "chars",
      mode: "box",
      elements: [
        { id: "c1", value: "(", label: "[0]", state: "default" },
        { id: "c2", value: "{", label: "[1]", state: "default" },
        { id: "c3", value: "}", label: "[2]", state: "default" },
        { id: "c4", value: ")", label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Why simple counting fails: integer counters can track equal numbers of openers and closers, but cannot verify nesting order; for example, ([)] has equal counts but is invalid.",
    primarySnapshot: {
      kind: "array",
      name: "chars",
      mode: "box",
      elements: [
        { id: "c1", value: "(", label: "[0]", state: "compare" },
        { id: "c2", value: "[", label: "[1]", state: "compare" },
        { id: "c3", value: ")", label: "[2]", state: "compare", pointers: ["mismatch"] },
        { id: "c4", value: "]", label: "[3]", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "The LIFO (Last-In, First-Out) Nesting Invariant requires that the most recently opened bracket must be the very first one to be closed.",
    primarySnapshot: {
      kind: "array",
      name: "chars",
      mode: "box",
      elements: [
        { id: "c1", value: "(", label: "[0]", state: "visited" },
        { id: "c2", value: "{", label: "[1]", state: "active", pointers: ["must close first"] },
        { id: "c3", value: "}", label: "[2]", state: "active", pointers: ["closer"] },
        { id: "c4", value: ")", label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "We maintain an auxiliary LIFO stack to store active open brackets awaiting their corresponding closing partners as we scan the string left to right.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-chars",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "chars",
            mode: "box",
            elements: [
              { id: "c1", value: "(", label: "[0]", state: "active", pointers: ["i"] },
              { id: "c2", value: "{", label: "[1]", state: "default" },
              { id: "c3", value: "}", label: "[2]", state: "default" },
              { id: "c4", value: ")", label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "intro-stack",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "stack",
            mode: "box",
            elements: [{ id: "st-0", value: "(", label: "top", state: "active" }],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Opener Case (Push): whenever we encounter an opening bracket '(', '{', or '[', we push it onto the top of the stack.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-chars",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "chars",
            mode: "box",
            elements: [
              { id: "c1", value: "(", label: "[0]", state: "visited" },
              { id: "c2", value: "{", label: "[1]", state: "active", pointers: ["i"] },
              { id: "c3", value: "}", label: "[2]", state: "default" },
              { id: "c4", value: ")", label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "intro-stack",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "stack",
            mode: "box",
            elements: [
              { id: "st-0", value: "(", label: "[0]", state: "default" },
              { id: "st-1", value: "{", label: "top", state: "active" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Closer Case (Pop): whenever we encounter a closing bracket ')', '}', or ']', we inspect the top of the stack; if it matches the required opener, we pop it off.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-chars",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "chars",
            mode: "box",
            elements: [
              { id: "c1", value: "(", label: "[0]", state: "visited" },
              { id: "c2", value: "{", label: "[1]", state: "sorted" },
              { id: "c3", value: "}", label: "[2]", state: "sorted", pointers: ["match"] },
              { id: "c4", value: ")", label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "intro-stack",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "stack",
            mode: "box",
            elements: [{ id: "st-0", value: "(", label: "top", state: "active" }],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Underflow & Mismatch Guards: if a closing bracket appears when the stack is empty (underflow) or if the stack top does not match the closer, the string is invalid.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-chars",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "chars",
            mode: "box",
            elements: [
              { id: "c1", value: "(", label: "[0]", state: "visited" },
              { id: "c2", value: "]", label: "[1]", state: "swap", pointers: ["mismatch"] },
            ],
          },
        },
        {
          id: "intro-stack",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "stack",
            mode: "box",
            elements: [{ id: "st-0", value: "(", label: "top", state: "compare" }],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Final Validation: after scanning all characters, if the stack is completely empty, all opened brackets were successfully matched, confirming validity in O(N) time and O(N) space.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-chars",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "chars",
            mode: "box",
            elements: [
              { id: "c1", value: "(", label: "[0]", state: "sorted" },
              { id: "c2", value: "{", label: "[1]", state: "sorted" },
              { id: "c3", value: "}", label: "[2]", state: "sorted" },
              { id: "c4", value: ")", label: "[3]", state: "sorted" },
            ],
          },
        },
        {
          id: "intro-stack",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "stack",
            mode: "box",
            elements: [],
          },
        },
      ],
    },
  },
];

export const generateValidParenthesesSteps = (input: ValidParenthesesInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const s =
    typeof input?.s === "string" && input.s.length > 0
      ? input.s
      : DEFAULT_VALID_PARENTHESES_INPUT.s;
  const chars = s.split("");
  const n = chars.length;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input || (typeof input.s === "string" && input.s === DEFAULT_VALID_PARENTHESES_INPUT.s);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const stack: string[] = [];
  const bracketMap: Record<string, string> = {
    ")": "(",
    "}": "{",
    "]": "[",
  };

  const makeComposite = (
    currentI?: number,
    highlightState: "compare" | "active" | "sorted" | "swap" = "compare",
    matchedIdxPair?: [number, number],
  ): CompositeCanvasSnapshot => {
    const arrayElements: ArrayElement[] = chars.map((ch, idx) => {
      const ptrs: string[] = [];
      if (idx === currentI) ptrs.push("i");

      let state: ArrayElement["state"] = "default";
      if (matchedIdxPair && (idx === matchedIdxPair[0] || idx === matchedIdxPair[1])) {
        state = "sorted";
      } else if (idx === currentI) {
        state = highlightState;
      } else if (currentI !== undefined && idx < currentI) {
        state = "visited";
      }

      return {
        id: `char-${idx}`,
        value: ch,
        label: `[${idx}]`,
        state,
        pointers: ptrs.length > 0 ? ptrs : undefined,
      };
    });

    const stackElements: ArrayElement[] = stack.map((val, pos) => ({
      id: `st-${pos}`,
      value: val,
      label: pos === stack.length - 1 ? "top" : `[${pos}]`,
      state: pos === stack.length - 1 ? "active" : "default",
    }));

    return {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "par-chars",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "chars",
            mode: "box",
            elements: arrayElements,
          },
        },
        {
          id: "par-stack",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "stack",
            mode: "box",
            elements: stackElements,
          },
        },
      ],
    };
  };

  if (n === 0) {
    addStep(
      "The input string is empty, so zero unclosed brackets exist; returning true.",
      makeComposite(),
    );
    return steps;
  }

  addStep(
    `Having established the mental model, let's now transition to our selected input string "${s}" of length ${n}.`,
    makeComposite(),
  );

  let isValid = true;
  for (let i = 0; i < n; i++) {
    const char = chars[i];

    addStep(
      `Inspect character '${char}' at index ${i}: evaluate whether '${char}' is an opening bracket or a closing bracket.`,
      makeComposite(i, "compare"),
    );

    if (char === "(" || char === "{" || char === "[") {
      stack.push(char);
      addStep(
        `Character '${char}' is an opening bracket: push '${char}' onto top of stack (stack size = ${stack.length}).`,
        makeComposite(i, "active"),
      );
    } else {
      const expectedOpen = bracketMap[char];
      const stackTop = stack.length > 0 ? stack[stack.length - 1] : undefined;

      if (stack.length === 0) {
        isValid = false;
        addStep(
          `Closing bracket '${char}' at index ${i} requires opening partner '${expectedOpen}', but stack is EMPTY! Underflow error detected; returning false.`,
          makeComposite(i, "swap"),
        );
        break;
      } else if (stackTop !== expectedOpen) {
        isValid = false;
        addStep(
          `Closing bracket '${char}' at index ${i} requires '${expectedOpen}', but top of stack is '${stackTop}'! Mismatch error detected; returning false.`,
          makeComposite(i, "swap"),
        );
        break;
      } else {
        const popped = stack.pop()!;
        addStep(
          `Closing bracket '${char}' matches top of stack '${popped}'! Pop '${popped}' off stack; bracket pair successfully resolved.`,
          makeComposite(i, "sorted"),
        );
      }
    }
  }

  if (isValid) {
    if (stack.length === 0) {
      addStep(
        `String scan finished and stack is completely EMPTY! All bracket pairs were matched in valid LIFO order; returning true.`,
        makeComposite(undefined, "sorted"),
      );
    } else {
      addStep(
        `String scan finished, but stack still contains ${stack.length} unclosed opening bracket(s) [${stack.join(", ")}]! Returning false.`,
        makeComposite(n - 1, "swap"),
      );
    }
  }

  return steps;
};

const VALID_PARENTHESES_TRIVIA: TriviaMeta = {
  skipLines: [1, 6, 7],
  lineExplanations: {
    1: "Declares function is_valid accepting string s of bracket characters.",
    2: "Initializes empty stack to maintain active open brackets.",
    3: "Initializes lookup dictionary mapping closing brackets to expected opening partners.",
    4: "Iterates through each character in string s.",
    5: "Checks if char is an opening bracket ('(', '{', '[').",
    6: "Pushes opening bracket char onto top of stack.",
    7: "Handles else branch for closing bracket evaluation.",
    8: "Checks if stack is empty OR if stack top stack[-1] fails to match required opener.",
    9: "Returns False immediately upon detecting underflow or mismatch error.",
    10: "Pops matching opening bracket off stack.",
    11: "Returns True if stack is empty after processing all characters, else False.",
  },
};

export const validParentheses: AlgorithmDefinition<ValidParenthesesInput> = {
  id: "valid-parentheses",
  title: "Valid Parentheses",
  topicIds: ["stack_and_queue"],
  difficulty: "Easy",
  description: `<p>Given a string <code>s</code> containing just the characters <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> and <code>']'</code>, determine if the input string is valid.</p>
<h3>Problem Statement</h3>
<p>An input string is valid if:</p>
<ul>
  <li>Open brackets must be closed by the same type of brackets.</li>
  <li>Open brackets must be closed in the correct order.</li>
  <li>Every close bracket has a corresponding open bracket of the same type.</li>
</ul>
<h3>Input Parameters</h3>
<ul>
  <li><code>s</code>: A string consisting of parenthesis characters <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code>, <code>']'</code>.</li>
</ul>
<h3>Output</h3>
<p>Returns boolean <code>true</code> if the string is valid, otherwise <code>false</code>.</p>
<h3>Constraints &amp; Edge Cases</h3>
<ul>
  <li><code>1 &le; s.length &le; 10<sup>4</sup></code>.</li>
  <li><code>s</code> consists of parentheses only: <code>()[]{}</code>.</li>
  <li>Odd length strings can never be valid.</li>
  <li>Empty or incomplete bracket sequences return <code>false</code>.</li>
</ul>`,
  constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only: () {} []"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: 's = "({[()]}())"',
      outputDisplay: "true",
      title: "Standard Balanced Nested String",
      input: DEFAULT_VALID_PARENTHESES_INPUT,
      output: "true",
      explanation: "Nested brackets matching correctly in Last-In, First-Out order.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: 's = "()[]{}()({[]})"',
      outputDisplay: "true",
      title: "Adversarial Sequential & Deep Nesting",
      input: { s: "()[]{}()({[]})" },
      output: "true",
      explanation:
        "Multiple sequential and deeply nested bracket pairs correctly pushing and popping from the stack.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: 's = "(]"',
      outputDisplay: "false",
      title: "Boundary Mismatch Failure",
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
    time: "We perform a single left-to-right pass over string s of length N. For each character, pushing to or popping from the array-backed stack takes O(1) time, and hash map lookup takes O(1) time. Overall time complexity is strictly linear O(N).",
    space:
      "In the worst case (e.g. s = '((((('), all N characters are open brackets pushed onto the stack. Thus auxiliary space complexity is O(N).",
  },
  topicGuide: {
    overview:
      "<p>A stack is the core data structure for problems where the most recent unfinished obligation must be resolved first. In bracket matching, every open bracket establishes a new nested context and every closing bracket must resolve the most recently opened context. This mechanism underpins language compilers, syntax highlighting engines, and structured data parsers (JSON, XML).</p>",
    sections: [
      {
        heading: "The LIFO Nesting Invariant",
        body: "<p>Valid bracket sequences require proper nesting: any pair of brackets must either be completely disjoint from another pair or completely enclosed within it. Partial overlaps like <code>([)]</code> are invalid. Because the most recently opened bracket is always the first one that must be closed, a stack naturally maintains this invariant by keeping active open brackets on top.</p>",
      },
      {
        heading: "Why Simple Counting Fails",
        body: "<p>A common mistake is attempting to count openers and closers with integer counters. While counters can track equal quantities of <code>(</code> and <code>)</code>, they cannot enforce ordering or multi-type bracket matching. For instance, <code>([)]</code> has 1 of each bracket type, but is invalid because <code>]</code> attempts to close before <code>)</code> resolves.</p>",
      },
      {
        heading: "Failure Modes & Underflow Protection",
        body: "<p>Three failure modes must be explicitly guarded:</p><ol><li><strong>Mismatch:</strong> The closing bracket type does not match the stack top (<code>stack[-1] != mapping[c]</code>).</li><li><strong>Underflow:</strong> A closing bracket appears when the stack is empty (<code>len(stack) == 0</code>).</li><li><strong>Unclosed Openers:</strong> Open brackets remain on the stack after string scanning finishes (<code>len(stack) &gt; 0</code>).</li></ol>",
      },
      {
        heading: "Systems Applications & Memory Efficiency",
        body: "<p>In production compilers like Clang and language engines like V8, stack parsing runs at gigabytes per second. Utilizing dynamic array-backed stacks ensures contiguous memory layout, providing optimal L1/L2 CPU cache prefetching performance compared to node-allocated pointer structures.</p>",
      },
      {
        heading: "Trade-Offs & Complexity Analysis",
        body: "<p>Time Complexity: <code>O(N)</code> single pass with constant time push/pop per character.<br />Space Complexity: <code>O(N)</code> stack memory proportional to nesting depth.<br />Optimization: Early parity rejection (<code>if s.length % 2 != 0 return false</code>) allows immediate <code>O(1)</code> exit for odd-length strings.</p>",
      },
    ],
    keyTerms: [
      {
        term: "LIFO (Last-In, First-Out)",
        definition:
          "The data access ordering where the item inserted most recently is the first item to be removed.",
      },
      {
        term: "Pushdown Automaton",
        definition:
          "A state machine equipped with an auxiliary stack, capable of recognizing context-free languages such as nested parenthesis grammars.",
      },
      {
        term: "Proper Nesting",
        definition:
          "The structural condition where open-close delimiter pairs are either completely independent or fully enclosed within one another.",
      },
      {
        term: "Underflow",
        definition:
          "An error state triggered when attempting to pop or inspect an element from an empty stack.",
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

export default validParentheses;
