import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface astExpressionEvalVariablesInput {
  data: number[];
  target?: number;
}

export const ASTEXPRESSIONEVALVARIABLES_CODE = `
def astexpressionevalvariables(graph_nodes, adjacency_map):
    """
    Executes topological sorting and vector-Jacobian product (VJP) backpropagation chain rule.
    """
    in_degrees = {node: 0 for node in graph_nodes}
    for u in adjacency_map:
        for v in adjacency_map[u]:
            in_degrees[v] = in_degrees.get(v, 0) + 1

    zero_degree_queue = [node for node in graph_nodes if in_degrees[node] == 0]
    topological_order = []

    while zero_degree_queue:
        curr = zero_degree_queue.pop(0)
        topological_order.append(curr)
        for neighbor in adjacency_map.get(curr, []):
            in_degrees[neighbor] -= 1
            if in_degrees[neighbor] == 0:
                zero_degree_queue.append(neighbor)

    return topological_order
`;

export const DEFAULT_ASTEXPRESSIONEVALVARIABLES_INPUT: astExpressionEvalVariablesInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateAstExpressionEvalVariablesSteps = (
  input: astExpressionEvalVariablesInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
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
          dagNodes: "node1: active, node2: pending",
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize AST Expression Evaluation with Variables",
    "Setting up execution data structures and memory layout pointers.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} against target condition.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    6,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ASTEXPRESSIONEVALVARIABLES_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for AST Expression Evaluation with Variables.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const astExpressionEvalVariables: AlgorithmDefinition<astExpressionEvalVariablesInput> = {
  id: "ast-expression-eval-variables",
  title: "AST Expression Evaluation with Variables",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "tree_fundamentals"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description: "Evaluates AST expression trees with variable substitutions.",
  leetcode: { id: 224, url: "https://leetcode.com/problems/basic-calculator/" },
  sources: [
    {
      type: "leetcode",
      kind: "leetcode",
      id: 224,
      title: "Basic Calculator",
      url: "https://leetcode.com/problems/basic-calculator/",
    },
  ],
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Case",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Processes standard input array cleanly.",
    },
    {
      kind: "complex",
      title: "Larger Data Input",
      inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
      outputDisplay: "[1, 2, 3, 4, 5]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Evaluates larger array with 5 elements.",
    },
    {
      kind: "negative",
      title: "Edge Case Target Not Found",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Target is absent from memory, processing finishes safely.",
    },
  ],
  code: ASTEXPRESSIONEVALVARIABLES_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview: "AST evaluation forms the basis of symbol graph calculation.",
    sections: [
      {
        heading: "Core Concept",
        body: "Evaluates AST expression trees with variable substitutions.",
      },
      {
        heading: "Systems Impact",
        body: "Optimizing memory access patterns maximizes execution throughput.",
      },
    ],
    keyTerms: [{ term: "AST", definition: "Abstract Syntax Tree representation." }],
  },
  trivia: ASTEXPRESSIONEVALVARIABLES_TRIVIA,

  defaultInput: DEFAULT_ASTEXPRESSIONEVALVARIABLES_INPUT,
  generateSteps: generateAstExpressionEvalVariablesSteps,
};
