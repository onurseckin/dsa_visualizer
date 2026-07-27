import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface prefixToPostfixConversionInput {
  data: number[];
  target?: number;
}

export const PREFIXTOPOSTFIXCONVERSION_CODE = `def prefix_to_postfix_conversion(tokens):
    """
    Converts Polish prefix notation tokens to RPN postfix expression format.
    """
    stack = []
    for token in reversed(tokens):
        if token in ["+", "-", "*", "/"]:
            op1 = stack.pop()
            op2 = stack.pop()
            stack.append(f"{op1} {op2} {token}")
        else:
            stack.append(token)
    return stack[0]`;

export const DEFAULT_PREFIXTOPOSTFIXCONVERSION_INPUT: prefixToPostfixConversionInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generatePrefixToPostfixConversionSteps = (
  input: prefixToPostfixConversionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayData = input?.data || [10, 20, 30, 40, 50];
  const target = input?.target ?? 30;

  // Construct a prefix expression token sequence: ["*", "+", "A", "B", "-", "C", "D"]
  const prefixTokens: string[] = ["*", "+", String(arrayData[0] ?? 10), String(arrayData[1] ?? 20), "-", String(arrayData[2] ?? 30), String(arrayData[3] ?? 40)];

  const elements: ArrayElement[] = prefixTokens.map((tok, idx) => ({
    id: `p-tok-${idx}`,
    value: tok,
    state: "default",
  }));

  const stack: string[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        stack: [...stack],
        customState: {
          prefixTokens: `[${prefixTokens.join(", ")}]`,
          stack: `[${stack.join(", ")}]`,
          ...customState,
        },
      },
      variables,
    });
  };

  // Step 1: Init Prefix to Postfix Converter
  addStep(
    1,
    "Initialize Prefix to Postfix Expression Converter Engine",
    "Setting up stack execution environment for right-to-left prefix token translation.",
    { tokenCount: prefixTokens.length, target, phase: "INIT_PREFIX_CONVERTER" },
    undefined,
    { status: "INITIALIZING", stack_depth: "0" },
  );

  // Step 2: Init stack array
  addStep(
    5,
    "Allocate String Stack `stack = []`",
    "Initializing stack to hold intermediate sub-expression string tokens.",
    { phase: "ALLOC_STRING_STACK" },
  );

  // Reverse right-to-left traversal pass
  const reversedTokens = [...prefixTokens].reverse();
  reversedTokens.forEach((tok, rIdx) => {
    const origIdx = prefixTokens.length - 1 - rIdx;
    const isOp = ["+", "-", "*", "/"].includes(tok);

    const stateA: ArrayElement[] = elements.map((el, i) => {
      if (i === origIdx) return { ...el, state: "compare", pointers: [`reversed_${rIdx}`] };
      if (i > origIdx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      6,
      `Reversed Iteration ${rIdx}: Read Token "${tok}"`,
      `Scanning prefix token stream right-to-left. Token at index ${origIdx} is "${tok}".`,
      { rIdx, origIdx, token: tok, isOperator: isOp, phase: "READ_REVERSED_TOKEN" },
      stateA,
      { activeToken: tok },
    );

    addStep(
      7,
      `Check Token Type: token in ["+", "-", "*", "/"] -> ${isOp}`,
      isOp
        ? `Token "${tok}" is an operator. Popping top two sub-expressions from stack.`
        : `Token "${tok}" is an operand. Pushing operand string onto stack.`,
      { token: tok, isOperator: isOp, phase: "CHECK_TOKEN_TYPE" },
      stateA,
    );

    if (isOp) {
      const op1 = stack.pop() || "0";
      addStep(
        8,
        `Pop First Sub-expression: op1 = "${op1}"`,
        `Popped left operand sub-expression "${op1}" from stack.`,
        { op1, stackDepth: stack.length, phase: "POP_OP1" },
        stateA,
        { popped_op1: op1 },
      );

      const op2 = stack.pop() || "0";
      addStep(
        9,
        `Pop Second Sub-expression: op2 = "${op2}"`,
        `Popped right operand sub-expression "${op2}" from stack.`,
        { op1, op2, stackDepth: stack.length, phase: "POP_OP2" },
        stateA,
        { popped_op1: op1, popped_op2: op2 },
      );

      const combined = `${op1} ${op2} ${tok}`;
      stack.push(combined);

      const stateB: ArrayElement[] = elements.map((el, i) => {
        if (i === origIdx) return { ...el, state: "active", pointers: [`RPN="${combined}"`] };
        if (i > origIdx) return { ...el, state: "visited" };
        return el;
      });

      addStep(
        10,
        `Format Postfix Sub-expression: f"{op1} {op2} {tok}" -> "${combined}"`,
        `Combined sub-expression into postfix format "${combined}" and pushed onto stack.`,
        { combined, stackDepth: stack.length, phase: "FORMAT_POSTFIX" },
        stateB,
        { stackTop: combined },
      );
    } else {
      stack.push(tok);
      const stateC: ArrayElement[] = elements.map((el, i) => {
        if (i === origIdx) return { ...el, state: "active", pointers: [`push("${tok}")`] };
        if (i > origIdx) return { ...el, state: "visited" };
        return el;
      });

      addStep(
        12,
        `Push Operand String onto Stack: "${tok}"`,
        `Pushed operand token "${tok}" onto stack. Stack depth now ${stack.length}.`,
        { token: tok, stackDepth: stack.length, phase: "PUSH_OPERAND" },
        stateC,
        { stackTop: tok },
      );
    }
  });

  const finalResult = stack[0] || "";
  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  // Step final-1: Return final postfix expression string
  addStep(
    13,
    `Return Final Converted Postfix Expression: stack[0] = "${finalResult}"`,
    `Prefix to Postfix conversion complete. Resulting RPN string: "${finalResult}".`,
    { postfixResult: finalResult },
    finalElements,
    { result_rpn: finalResult },
  );

  // Step final: Complete
  addStep(
    13,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const PREFIXTOPOSTFIXCONVERSION_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 11],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "stack.append(f'{token} {op1} {op2}')",
  ],
  hints: [
    { line: 5, hint: "Initialize empty string stack." },
    { line: 6, hint: "Iterate through input prefix tokens in reverse right-to-left order." },
    { line: 10, hint: "Format postfix string as f'{op1} {op2} {token}' and push onto stack." },
  ],
  lineExplanations: {
    1: "Defines entry point for prefix_to_postfix_conversion RPN compiler pass.",
    2: "Docstring opening: describes Polish prefix notation to RPN postfix format conversion.",
    3: "Docstring body: converts prefix expression tokens to RPN postfix format using a right-to-left stack traversal.",
    4: "Docstring closing.",
    5: "Initializes empty string list stack to hold intermediate postfix sub-expression strings.",
    6: "Iterates through tokens in reversed right-to-left order (reversed(tokens)).",
    7: "Checks if current token is one of the four binary operator symbols (+, -, *, /).",
    8: "Pops top left sub-expression string op1 from stack.",
    9: "Pops top right sub-expression string op2 from stack.",
    10: "Formats postfix sub-expression f'{op1} {op2} {token}' and pushes result onto stack.",
    11: "Else branch handling non-operator operand token strings.",
    12: "Pushes operand token string directly onto stack.",
    13: "Returns final fully assembled postfix expression string from stack[0].",
  },
};

export const prefixToPostfixConversion: AlgorithmDefinition<prefixToPostfixConversionInput> = {
  id: "prefix-to-postfix-conversion",
  title: "Prefix to Postfix Expression Converter",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description: `### Prefix to Postfix Expression Converter

In machine learning graph compilers (**PyTorch TorchScript**, **XLA IR Transpilers**, and **Syntax Tree Rewriters**), converting mathematical expressions between **Polish Prefix Notation** (operators precede operands: \`+ A B\`) and **Reverse Polish Notation (RPN Postfix)** (operators follow operands: \`A B +\`) enables stack-based execution optimization.

#### Why It Exists & What It Solves
Prefix expressions write operators before their operands:
$$* \\ + \\ A \\ B \\ - \\ C \\ D \\quad \\implies \\quad (A + B) \\times (C - D)$$
Scanning prefix expressions left-to-right requires recursive AST parsing or lookahead buffering.

By converting Prefix to Postfix via a right-to-left stack pass:
1. **Right-to-Left Traversal**: Processing tokens in reverse right-to-left order ensures operands ($A, B, C, D$) are encountered and stacked *before* encountering their parent operators ($+, -, *$).
2. **Sub-expression Formatting**: Upon encountering operator \`op\`, popping \`op1\` and \`op2\` and assembling \`f"{op1} {op2} {op}"\` directly builds valid RPN postfix strings without explicit tree creation.

#### Step-by-Step Mechanism
1. **Initialize Stack**: Allocate empty string stack \`stack = []\`.
2. **Reverse Right-to-Left Loop**: Iterate through tokens in \`reversed(tokens)\`:
   - **Operand Token**: Push token string directly onto \`stack\`.
   - **Operator Token** (\`+\`, \`-\`, \`*\`, \`/\`):
     - Pop first sub-expression $\\text{op1} = \\text{stack.pop()}$.
     - Pop second sub-expression $\\text{op2} = \\text{stack.pop()}$.
     - Format postfix string: \`f"{op1} {op2} {token}"\`.
     - Push formatted string onto \`stack\`.
3. **Return Result**: Return top sub-expression string \`stack[0]\`.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(N)$ linear time over $N$ expression tokens.
- **Space Complexity**: $\\mathcal{O}(N)$ auxiliary stack memory for intermediate sub-expression strings.
- **Trade-Off**: Eliminates complex expression tree parsing logic in exchange for string formatting operations during compiler lowering passes.`,
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Autograd Pass",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "Evaluated Graph State",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Standard execution pass over computation graph.",
    },
    {
      kind: "complex",
      title: "Larger DAG Input",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "Evaluated Graph State",
      input: { data: [10, 20, 30, 40, 50] },
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates multi-node computation graph DAG.",
    },
    {
      kind: "negative",
      title: "Edge Case DAG",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "Evaluated Graph State",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Edge case handling completes safely.",
    },
  ],
  code: PREFIXTOPOSTFIXCONVERSION_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Single-pass right-to-left scan processes each token in O(1) time.",
    space: "Linear memory allocation for string stack and formatted sub-expressions.",
  },
  topicGuide: {
    overview:
      "Prefix to Postfix conversion rewrites operator hierarchy without requiring explicit parenthesis parsing. Right-to-left traversal ensures operands are stacked before encountering their parent operator.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Scanning prefix tokens right-to-left processes leaves before operators. Encountering operator $\\text{Op}$ pops top two operands $\\text{op1}$ and $\\text{op2}$ and pushes combined string \`f\"{op1} {op2} {Op}\"\`. Time complexity is $\\mathcal{O}(N)$.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "Converting expression intermediate representations (IRs) to postfix format simplifies downstream evaluation in stack-based GPU bytecodes and autograd engines.",
      },
      {
        heading: "Implementation Details & Stack Order",
        body: "Implementation iterates through reversed tokens, pushing operands onto stack, popping op1 and op2 when seeing operators, and pushing formatted postfix strings.",
      },
      {
        heading: "Edge Case Analysis & Validation",
        body: "Edge cases include single-operand expressions (no operators present) where the stack simply returns the single operand string.",
      },
    ],
    keyTerms: [
      {
        term: "Polish Prefix Notation",
        definition: "Expression format where operators precede their operands (e.g. + A B).",
      },
      {
        term: "Reverse Polish Notation (RPN)",
        definition: "Postfix format where operators follow their operands (e.g. A B +).",
      },
      {
        term: "IR Translation",
        definition: "Converting mathematical expressions between intermediate compiler formats.",
      },
    ],
  },
  trivia: PREFIXTOPOSTFIXCONVERSION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_PREFIXTOPOSTFIXCONVERSION_INPUT,
  generateSteps: generatePrefixToPostfixConversionSteps,
};
