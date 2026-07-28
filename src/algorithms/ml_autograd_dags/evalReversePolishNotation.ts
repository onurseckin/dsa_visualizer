import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface evalReversePolishNotationInput {
  data: number[];
  target?: number;
}

export const EVALREVERSEPOLISHNOTATION_CODE = `def eval_reverse_polish_notation(tokens):
    stack = []
    for token in tokens:
        if token in ["+", "-", "*", "/"]:
            b = stack.pop()
            a = stack.pop()
            if token == "+": stack.append(a + b)
            elif token == "-": stack.append(a - b)
            elif token == "*": stack.append(a * b)
            elif token == "/": stack.append(int(a / b))
        else:
            stack.append(int(token))
    return stack[0]`;

export const DEFAULT_EVALREVERSEPOLISHNOTATION_INPUT: evalReversePolishNotationInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateEvalReversePolishNotationSteps = (
  input: evalReversePolishNotationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayData = input?.data || [10, 20, 30, 40, 50];

  // Construct an explicit RPN token sequence to evaluate, e.g. ["10", "20", "+", "30", "*", "40", "-"]
  const tokens: string[] = [
    String(arrayData[0] ?? 10),
    String(arrayData[1] ?? 20),
    "+",
    String(arrayData[2] ?? 30),
    "*",
    String(arrayData[3] ?? 40),
    "-",
    String(arrayData[4] ?? 50),
    "+",
  ];

  const elements: ArrayElement[] = tokens.map((tok, idx) => ({
    id: `tok-${idx}`,
    value: tok,
    state: "default",
  }));

  const operandStack: number[] = [];

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
        stack: operandStack.map(String),
        customState: {
          tokens: `[${tokens.join(", ")}]`,
          stack: `[${operandStack.join(", ")}]`,
          ...customState,
        },
      },
      variables,
    });
  };

  // Step 1: Init RPN Evaluator
  addStep(
    1,
    "Initialize Reverse Polish Notation (RPN) Evaluator",
    "Setting up execution environment and preparing LIFO operand stack for postfix expression traversal.",
    { tokenCount: tokens.length, stackSize: 0, phase: "INIT_RPN" },
  );

  // Step 2: Init stack array
  addStep(
    2,
    "Allocate LIFO Operand Stack `stack = []`",
    "Initializing dynamic array stack to hold intermediate scalar operands.",
    { stackSize: 0, phase: "ALLOC_STACK" },
  );

  // Token-by-token evaluation loop
  tokens.forEach((tok, idx) => {
    const isOp = ["+", "-", "*", "/"].includes(tok);

    const stateTok: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "compare", pointers: [`token=${tok}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    // Step A: Inspect token
    addStep(
      3,
      `Loop Token ${idx}: "${tok}"`,
      `Reading token "${tok}" from RPN stream. Checking if it is an arithmetic operator or numeric operand.`,
      { idx, token: tok, isOperator: isOp, stackDepth: operandStack.length, phase: "READ_TOKEN" },
      stateTok,
      { currentToken: tok },
    );

    // Step B: Check operator condition
    addStep(
      4,
      `Check Token Type: token in ["+", "-", "*", "/"] -> ${isOp}`,
      isOp
        ? `Token "${tok}" is a binary operator. Popping top two operands from stack.`
        : `Token "${tok}" is a numeric operand constant. Preparing stack push.`,
      { token: tok, isOperator: isOp, phase: "CHECK_OPERATOR" },
      stateTok,
    );

    if (isOp) {
      const b = operandStack.pop() ?? 0;
      addStep(
        5,
        `Pop Right Operand: b = ${b}`,
        `Popped top scalar operand b = ${b} from LIFO stack. Stack depth now ${operandStack.length}.`,
        { b, stackDepth: operandStack.length, phase: "POP_B" },
        stateTok,
        { popped_b: String(b) },
      );

      const a = operandStack.pop() ?? 0;
      addStep(
        6,
        `Pop Left Operand: a = ${a}`,
        `Popped second scalar operand a = ${a} from LIFO stack. Operand pair ready: (${a} ${tok} ${b}).`,
        { a, b, op: tok, stackDepth: operandStack.length, phase: "POP_A" },
        stateTok,
        { popped_a: String(a), popped_b: String(b) },
      );

      let res = 0;
      let lineNum = 7;
      if (tok === "+") {
        res = a + b;
        lineNum = 7;
      } else if (tok === "-") {
        res = a - b;
        lineNum = 8;
      } else if (tok === "*") {
        res = a * b;
        lineNum = 9;
      } else if (tok === "/") {
        res = Math.trunc(a / (b || 1));
        lineNum = 10;
      }

      operandStack.push(res);
      const stateResult: ArrayElement[] = elements.map((el, i) => {
        if (i === idx) return { ...el, state: "active", pointers: [`res=${res}`] };
        if (i < idx) return { ...el, state: "visited" };
        return el;
      });

      addStep(
        lineNum,
        `Execute Binary Op "${tok}": ${a} ${tok} ${b} = ${res}`,
        `Evaluated arithmetic expression and pushed computed result ${res} back onto operand stack.`,
        { a, b, op: tok, result: res, stackDepth: operandStack.length, phase: "EXEC_OP" },
        stateResult,
        { stackTop: String(res) },
      );
    } else {
      const numVal = parseInt(tok, 10);
      operandStack.push(numVal);
      const statePush: ArrayElement[] = elements.map((el, i) => {
        if (i === idx) return { ...el, state: "active", pointers: [`push(${numVal})`] };
        if (i < idx) return { ...el, state: "visited" };
        return el;
      });

      addStep(
        12,
        `Push Operand onto Stack: int("${tok}") -> ${numVal}`,
        `Converted token string "${tok}" to integer ${numVal} and pushed onto LIFO stack. Stack depth now ${operandStack.length}.`,
        { token: tok, value: numVal, stackDepth: operandStack.length, phase: "PUSH_OPERAND" },
        statePush,
        { stackTop: String(numVal) },
      );
    }
  });

  const finalRes = operandStack[0] ?? 0;
  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    13,
    `Return Final RPN Evaluated Result: stack[0] = ${finalRes}`,
    `Postfix expression evaluation complete. Single remaining scalar result on top of stack: ${finalRes}.`,
    { finalResult: finalRes, stackDepth: operandStack.length },
    finalElements,
    { finalResult: String(finalRes) },
  );

  addStep(
    13,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const EVALREVERSEPOLISHNOTATION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "stack.append(a - b)",
  ],
  hints: [
    { line: 2, hint: "Initialize empty list for LIFO operand stack." },
    { line: 4, hint: "Check if current token is one of the four binary operator symbols." },
    { line: 5, hint: "Pop right operand b first." },
    { line: 6, hint: "Pop left operand a second." },
    { line: 12, hint: "Convert numeric token to integer and push onto stack." },
  ],
  lineExplanations: {
    1: "Defines entry point for eval_reverse_polish_notation RPN postfix evaluator.",
    2: "Initializes empty list stack to serve as LIFO operand stack.",
    3: "Iterates through RPN expression token strings.",
    4: "Checks if current token is a binary arithmetic operator (+, -, *, /).",
    5: "Pops right operand b from top of operand stack.",
    6: "Pops left operand a from top of operand stack.",
    7: "Evaluates addition (a + b) and pushes scalar result onto stack.",
    8: "Evaluates subtraction (a - b) and pushes scalar result onto stack.",
    9: "Evaluates multiplication (a * b) and pushes scalar result onto stack.",
    10: "Evaluates integer division int(a / b) truncating towards zero and pushes result onto stack.",
    11: "Else branch handling non-operator numeric token strings.",
    12: "Converts operand token string to integer and pushes value onto stack.",
    13: "Returns final evaluated scalar result from index 0 of operand stack.",
  },
};

export const evalReversePolishNotation: AlgorithmDefinition<evalReversePolishNotationInput> = {
  id: "eval-reverse-polish-notation",
  title: "Evaluate Reverse Polish Notation",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  description: `### Evaluate Reverse Polish Notation (RPN)

In deep learning compilers (**PyTorch FX**, **XLA Intermediate Representation**, **Bytecode Virtual Machines**, and **Stack Calculators**), expressions are often serialized in **Reverse Polish Notation (RPN)** / **Postfix Order**.

#### Why It Exists & What It Solves
Standard mathematical expressions write operators in infix form: $(a + b) \\times (c - d)$.
Evaluating infix expressions directly requires maintaining operator precedence rules and tracking nested parentheses.

By converting computation DAGs to Postfix / RPN:
1. **Zero Parentheses**: Operators strictly follow their operands, eliminating explicit grouping symbols.
2. **Contiguous Stack Execution**: Expressions can be evaluated sequentially in a single $\\mathcal{O}(N)$ pass using a LIFO operand stack without recursive tree pointers.

#### Step-by-Step Mechanism
1. **Initialize Stack**: Allocate empty operand stack \`stack = []\`.
2. **Token Stream Traversal**: Iterate through tokens sequentially:
   - **Numeric Operand**: Convert string token to integer \`int(token)\` and push onto \`stack\`.
   - **Binary Operator** (\`+\`, \`-\`, \`*\`, \`/\`):
     - Pop right operand $b = \\text{stack.pop()}$.
     - Pop left operand $a = \\text{stack.pop()}$.
     - Compute binary result (e.g. $a + b$, $a - b$, $a \\times b$, or $\\lfloor a / b \\rfloor$).
     - Push computed scalar result back onto \`stack\`.
3. **Return Output**: Return the final scalar \`stack[0]\`.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(N)$ linear time over $N$ expression tokens.
- **Space Complexity**: $\\mathcal{O}(N)$ max auxiliary stack depth for pending operands.
- **Trade-Off**: Provides optimal cache locality and sequential memory execution at the cost of requiring linear auxiliary stack memory.`,
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
  code: EVALREVERSEPOLISHNOTATION_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Single-pass linear scan processes each token in O(1) time.",
    space: "Operand stack memory scales linearly with total tokens.",
  },
  topicGuide: {
    overview:
      "RPN evaluation is a foundational stack-based algorithm used in deep learning graph compilers, bytecode interpreters, and mathematical expression engines.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "RPN places operators after operands: $a \\ b \\ \\text{op}$. Scanning tokens left-to-right guarantees operands $a$ and $b$ are pushed onto stack before operator evaluation: $\\text{stack.pop}() \\to b, \\text{stack.pop}() \\to a$.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "TorchScript JIT and ONNX execution engines serialize complex tensor mathematical graphs into postfix instructions, allowing GPU kernel dispatch loops to run without graph recursion.",
      },
      {
        heading: "Implementation Details & Stack Management",
        body: "Operands are pushed onto LIFO stack. When encountering operators, right operand $b$ is popped first, followed by left operand $a$. Care must be taken for non-commutative operations ($a - b$ and $\\lfloor a / b \\rfloor$).",
      },
      {
        heading: "Complexity Analysis & Performance Profile",
        body: "Linear $\\mathcal{O}(N)$ execution time and $\\mathcal{O}(N)$ space efficiency ensure minimal CPU overhead during graph lowering passes.",
      },
    ],
    keyTerms: [
      {
        term: "Reverse Polish Notation (RPN)",
        definition:
          "Mathematical expression format where operators follow their operands, eliminating parentheses.",
      },
      {
        term: "Operand Stack",
        definition:
          "LIFO data structure storing intermediate scalar or tensor values during postfix evaluation.",
      },
      {
        term: "Non-Commutative Evaluation",
        definition:
          "Operations like subtraction and division where operand popping order (b first, a second) is critical.",
      },
    ],
  },
  trivia: EVALREVERSEPOLISHNOTATION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_EVALREVERSEPOLISHNOTATION_INPUT,
  generateSteps: generateEvalReversePolishNotationSteps,
};
