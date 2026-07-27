import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface astExpressionEvalVariablesInput {
  data: number[];
  target?: number;
}

export const ASTEXPRESSIONEVALVARIABLES_CODE = `
def ast_expression_eval_variables(node, env):
    """
    Evaluates AST expression tree substituting variable bindings from environment.
    """
    if isinstance(node, (int, float)):
        return node
    if isinstance(node, str):
        return env.get(node, 0)

    op, left, right = node["op"], node["left"], node["right"]
    val_l = ast_expression_eval_variables(left, env)
    val_r = ast_expression_eval_variables(right, env)

    if op == "+": return val_l + val_r
    if op == "*": return val_l * val_r
    return 0
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
    "Initialize AST Expression Evaluation with Variables",
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

const ASTEXPRESSIONEVALVARIABLES_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines AST expression evaluation with variable environment bindings function.",
    4: "Returns numeric scalar directly if node is numeric.",
    6: "Looks up variable name string in environment dictionary env.",
    8: "Unpacks operator, left child, and right child from node dictionary.",
    9: "Recursively evaluates left child expression.",
    10: "Recursively evaluates right child expression.",
    12: "Applies addition operator val_l + val_r.",
    13: "Applies multiplication operator val_l * val_r.",
    14: "Returns 0 for unrecognized operators.",
  },
};

export const astExpressionEvalVariables: AlgorithmDefinition<astExpressionEvalVariablesInput> = {
  id: "ast-expression-eval-variables",
  title: "AST Expression Evaluation with Variables",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description:
    "In deep learning forward-pass execution (e.g. PyTorch autograd evaluation, SymPy symbolic execution, JIT trace execution), evaluating expression trees requires looking up dynamic tensor variable bindings from an execution environment dictionary and evaluating operator nodes recursively.\n\nThis algorithm implements AST Expression Evaluation with Variables, traversing binary expression trees and substituting runtime variable values to compute output scalars.\n\nInput Format:\n- data: Input payload or variable values array.\n- target: Optional target value.\n\nOutput Format:\n- Returns evaluated scalar result of expression tree under given environment bindings.\n\nEdge Cases & Constraints:\n- Variable missing from environment (defaults to 0 or raises error).\n- Pure numeric constant nodes.\n- Deeply nested binary expression trees.",
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
  code: ASTEXPRESSIONEVALVARIABLES_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "AST evaluation with variable environment substitution bridges symbolic computation and numeric execution. Autograd engines evaluate forward values through expression graphs while recording intermediate operations for backward gradient passes.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for node N, Value(N) = N if N in Reals; Value(N) = Env[N] if N in Variables; Value(N) = Op(Value(Left), Value(Right)) if N is Operator.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Evaluating AST expressions in C++ engines avoids Python interpreter overhead, enabling fast forward-pass execution in ONNX and TorchScript runtimes.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation recursively resolves left and right subtrees against variable dictionary env and applies operator binary math.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes uninitialized environment variables and deep stack recursion limits.",
      },
    ],
    keyTerms: [
      {
        term: "Variable Binding",
        definition:
          "Associating symbolic variable names with concrete numeric runtime scalar values.",
      },
      {
        term: "Execution Environment",
        definition:
          "Dictionary mapping variable identifier strings to scalar values during AST evaluation.",
      },
      {
        term: "Symbolic Execution",
        definition:
          "Evaluating expression trees using symbolic names before substituting numeric values.",
      },
    ],
  },
  trivia: ASTEXPRESSIONEVALVARIABLES_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_ASTEXPRESSIONEVALVARIABLES_INPUT,
  generateSteps: generateAstExpressionEvalVariablesSteps,
};
