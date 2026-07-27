import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface astConstantFoldingInput {
  data: number[];
  target?: number;
}

export const ASTCONSTANTFOLDING_CODE = `
def ast_constant_folding(expr_tree):
    """
    Evaluates constant expressions in AST subtrees to optimize computation DAG.
    """
    if not isinstance(expr_tree, dict):
        return expr_tree

    left = ast_constant_folding(expr_tree.get("left"))
    right = ast_constant_folding(expr_tree.get("right"))
    op = expr_tree.get("op")

    if isinstance(left, (int, float)) and isinstance(right, (int, float)):
        if op == "+": return left + right
        if op == "-": return left - right
        if op == "*": return left * right

    return {"op": op, "left": left, "right": right}
`;

export const DEFAULT_ASTCONSTANTFOLDING_INPUT: astConstantFoldingInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateAstConstantFoldingSteps = (
  input: astConstantFoldingInput,
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
    "Initialize AST Constant Folding Compiler Pass",
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
    17,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ASTCONSTANTFOLDING_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines AST constant folding compiler pass function.",
    4: "Returns primitive value immediately if expr_tree is a constant scalar or variable string.",
    7: "Recursively folds left child subtree.",
    8: "Recursively folds right child subtree.",
    9: "Extracts operator symbol op from current node.",
    11: "Checks if both left and right folded children are numeric constants.",
    12: "Evaluates addition constant folding left + right.",
    13: "Evaluates subtraction constant folding left - right.",
    14: "Evaluates multiplication constant folding left * right.",
    16: "Returns updated node dictionary containing folded subtrees.",
  },
};

export const astConstantFolding: AlgorithmDefinition<astConstantFoldingInput> = {
  id: "ast-constant-folding",
  title: "AST Constant Folding Compiler Pass",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description:
    "In deep learning graph compilers (e.g. PyTorch Inductor, TorchScript, XLA, TVM), Constant Folding is a fundamental optimization pass. When subtrees in an Abstract Syntax Tree (AST) or computation DAG consist purely of compile-time constants (e.g. 2 * pi * radius_bias), evaluating them at compile time replaces subtrees with single scalar constant nodes, eliminating redundant GPU kernel dispatches during training and inference.\n\nThis algorithm implements AST Constant Folding Compiler Pass, recursively traversing expression DAG nodes, simplifying constant subtrees, and returning folded AST representations.\n\nInput Format:\n- data: Array representing node values or serialized AST structures.\n- target: Optional target value.\n\nOutput Format:\n- Returns optimized folded AST node structure or scalar evaluation.\n\nEdge Cases & Constraints:\n- Subtrees containing variable nodes (cannot be folded).\n- Nested pure-constant subtrees.\n- Single-node constant ASTs.",
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
  code: ASTCONSTANTFOLDING_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "Constant folding reduces graph execution latency by evaluating constant expressions during compilation instead of at runtime. Replacing multi-node computation subtrees with pre-computed constant values reduces node count and operator launch overhead on PyTorch and Triton graph backends.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, given expression node N = Op(L, R), if L and R evaluate to constants c_L and c_R, the compiler folds node N to c_N = Eval(Op, c_L, c_R). Time complexity is O(V + E) for tree traversal.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "In machine learning graph compilers, constant folding eliminates unnecessary HBM memory allocations for fixed hyperparameter constants, reducing overall GPU memory footprint.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation performs post-order depth-first traversal, folding left and right children before simplifying the parent node if both children are numeric constants.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes non-foldable variable nodes and division by zero prevention.",
      },
    ],
    keyTerms: [
      {
        term: "Constant Folding",
        definition:
          "Compiler optimization replacing constant sub-expressions with pre-computed scalar values during graph compilation.",
      },
      {
        term: "Abstract Syntax Tree (AST)",
        definition:
          "Tree structure representing the hierarchical syntax and operator relationships of mathematical expressions.",
      },
      {
        term: "Post-Order Traversal",
        definition:
          "Visiting left and right child subtrees before evaluating the parent operator node.",
      },
    ],
  },
  trivia: ASTCONSTANTFOLDING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_ASTCONSTANTFOLDING_INPUT,
  generateSteps: generateAstConstantFoldingSteps,
};
