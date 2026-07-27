import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface evalReversePolishNotationInput {
  data: number[];
  target?: number;
}

export const EVALREVERSEPOLISHNOTATION_CODE = `
def eval_reverse_polish_notation(tokens):
    """
    Evaluates Reverse Polish Notation (RPN) expression using an explicit operand stack.
    """
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
    return stack[0]
`;

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
  const elements: ArrayElement[] = arrayData.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
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
        customState: {
          data: `[${arrayData.join(", ")}]`,
          target: String(input?.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Evaluate Reverse Polish Notation",
    "Setting up execution data structures and memory layout pointers.",
    { n: arrayData.length, target: input?.target ?? 0 },
  );

  arrayData.forEach((val, idx) => {
    const isTarget = val === input?.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} in autograd computation graph.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    16,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true },
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
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines RPN postfix expression evaluation function.",
    4: "Initializes operand LIFO stack array.",
    5: "Iterates through RPN token strings.",
    6: "Checks if current token is a binary operator (+, -, *, /).",
    7: "Pops right operand b from stack.",
    8: "Pops left operand a from stack.",
    9: "Pushes sum a + b onto stack for addition operator.",
    10: "Pushes difference a - b onto stack for subtraction operator.",
    11: "Pushes product a * b onto stack for multiplication operator.",
    12: "Pushes truncated integer division int(a / b) onto stack for division operator.",
    14: "Pushes numeric operand token onto stack.",
    15: "Returns final evaluated scalar result from top of stack.",
  },
};

export const evalReversePolishNotation: AlgorithmDefinition<evalReversePolishNotationInput> = {
  id: "eval-reverse-polish-notation",
  title: "Evaluate Reverse Polish Notation",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description:
    'Reverse Polish Notation (RPN, postfix expression format) represents mathematical operator trees without parentheses (e.g., ["2", "1", "+", "3", "*"] -> (2 + 1) * 3 = 9). Deep learning compilers and execution engines evaluate postfix token streams using an operand stack in O(N) time.\n\nThis algorithm implements Evaluate Reverse Polish Notation, pushing numeric operands onto a stack and popping operand pairs when encountering operators to compute expression totals.\n\nInput Format:\n- data: Array representing input tokens or numbers.\n- target: Optional target value.\n\nOutput Format:\n- Returns scalar integer or float result of evaluated RPN postfix expression.\n\nEdge Cases & Constraints:\n- Subtraction and division operand ordering (a - b and a / b where b was popped first).\n- Single token input array (returns scalar token).\n- Integer division truncation towards zero.',
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
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "RPN evaluation is a classic stack algorithm used in expression parsers, bytecode interpreters (e.g. Python dis, JVM stack execution), and neural network graph execution engines.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, scanning RPN tokens left-to-right guarantees that whenever an operator is encountered, its required operands reside at the top of the stack. Time complexity is O(N), auxiliary space is O(N).",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Stack-based bytecode evaluation eliminates tree pointer traversal overhead, executing math expressions in contiguous CPU memory arrays.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation iterates through tokens, pushing numbers onto stack, popping b then a for operators, applying arithmetic, and pushing results back onto stack.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes integer division truncation towards zero (int(a / b) in Python).",
      },
    ],
    keyTerms: [
      {
        term: "Reverse Polish Notation (RPN)",
        definition:
          "Postfix mathematical expression notation where operators follow their operands.",
      },
      {
        term: "Operand Stack",
        definition:
          "LIFO stack storing active intermediate numeric values during postfix expression evaluation.",
      },
      {
        term: "Postfix Order",
        definition: "Expression ordering where child operands precede parent operator nodes.",
      },
    ],
  },
  trivia: EVALREVERSEPOLISHNOTATION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_EVALREVERSEPOLISHNOTATION_INPUT,
  generateSteps: generateEvalReversePolishNotationSteps,
};
