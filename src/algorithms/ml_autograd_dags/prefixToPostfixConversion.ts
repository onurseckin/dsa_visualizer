import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface prefixToPostfixConversionInput {
  data: number[];
  target?: number;
}

export const PREFIXTOPOSTFIXCONVERSION_CODE = `
def prefix_to_postfix_conversion(tokens):
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
    return stack[0]
`;

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
    "Initialize Prefix to Postfix Expression Converter",
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
    13,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const PREFIXTOPOSTFIXCONVERSION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines prefix to postfix conversion function.",
    4: "Initializes string stack array.",
    5: "Iterates through tokens in reversed right-to-left order.",
    6: "Checks if current token is an operator (+, -, *, /).",
    7: "Pops top operand op1 from stack.",
    8: "Pops second operand op2 from stack.",
    9: "Pushes formatted postfix string f'{op1} {op2} {token}' onto stack.",
    11: "Pushes operand token string directly onto stack.",
    12: "Returns converted postfix expression string from top of stack.",
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
  description:
    'Translating mathematical expression formats between Polish prefix notation (operators precede operands, e.g., ["*", "+", "A", "B", "C"]) and Reverse Polish Notation (RPN postfix, e.g., "A B + C *") is a foundational step in expression parsers and compiler intermediate representation (IR) translators.\n\nThis algorithm implements Prefix to Postfix Expression Converter, scanning prefix tokens in reverse right-to-left order using a stack to assemble postfix expression strings.\n\nInput Format:\n- data: Array representing input tokens or values.\n- target: Optional target value.\n\nOutput Format:\n- Returns formatted postfix expression string.\n\nEdge Cases & Constraints:\n- Single token expression (no operators).\n- Nested multi-operator expressions.\n- Operator precedence handling implicit in prefix format.',
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
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "Prefix to Postfix conversion rewrites operator hierarchy without requiring explicit parenthesis parsing. Right-to-left traversal ensures operands are stacked before encountering their parent operator.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: 'Mathematically, scanning prefix tokens right-to-left processes leaves before operators. Encountering operator Op pops top two operands op1 and op2 and pushes combined string "op1 op2 Op". Time complexity is O(N).',
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Converting expression IRs to postfix format simplifies downstream evaluation in stack-based GPU bytecodes and autograd engines.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation iterates through reversed tokens, pushing operands onto stack, popping op1 and op2 when seeing operators, and pushing formatted postfix strings.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes handling single-operand expressions and token validation.",
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
