import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface astConstantFoldingInput {
  data: number[];
  target?: number;
}

export const ASTCONSTANTFOLDING_CODE = `def ast_constant_folding(expr_tree):
    if not isinstance(expr_tree, dict):
        return expr_tree

    left = ast_constant_folding(expr_tree.get("left"))
    right = ast_constant_folding(expr_tree.get("right"))
    op = expr_tree.get("op")

    if isinstance(left, (int, float)) and isinstance(right, (int, float)):
        if op == "+": return left + right
        if op == "-": return left - right
        if op == "*": return left * right

    return {"op": op, "left": left, "right": right}`;

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

  const v0 = arrayData[0] ?? 10;
  const v1 = arrayData[1] ?? 20;
  const v2 = arrayData[2] ?? 30;
  const v3 = arrayData[3] ?? 40;

  const leftFolded = v0 + v1;
  const rightFolded = v2 - v3;
  const rootFolded = leftFolded * rightFolded;

  const initialNodes: GraphNodeItem[] = [
    { id: "root", label: "*", state: "default", x: 300, y: 50 },
    { id: "left_op", label: "+", state: "default", x: 180, y: 150 },
    { id: "right_op", label: "-", state: "default", x: 420, y: 150 },
    { id: "leaf_0", label: String(v0), state: "default", x: 120, y: 250 },
    { id: "leaf_1", label: String(v1), state: "default", x: 240, y: 250 },
    { id: "leaf_2", label: String(v2), state: "default", x: 360, y: 250 },
    { id: "leaf_3", label: String(v3), state: "default", x: 480, y: 250 },
  ];

  const initialEdges: GraphEdgeItem[] = [
    { from: "root", to: "left_op" },
    { from: "root", to: "right_op" },
    { from: "left_op", to: "leaf_0" },
    { from: "left_op", to: "leaf_1" },
    { from: "right_op", to: "leaf_2" },
    { from: "right_op", to: "leaf_3" },
  ];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customNodes?: GraphNodeItem[],
    customEdges?: GraphEdgeItem[],
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
        nodes: customNodes || initialNodes,
        edges: customEdges || initialEdges,
      },
      auxiliaryState: {
        customState: {
          expression: `(${v0} + ${v1}) * (${v2} - ${v3})`,
          leftFolded: String(leftFolded),
          rightFolded: String(rightFolded),
          rootFolded: String(rootFolded),
          ...customState,
        },
      },
      variables,
    });
  };

  // 1: Function Entry
  addStep(
    1,
    "Initialize AST Constant Folding Compiler Pass",
    "Setting up post-order recursive AST traversal to evaluate compile-time constant expressions in the computation DAG.",
    { expr_tree: "Op(*)", phase: "INIT" },
  );

  // 2: Inspect root
  addStep(
    2,
    "Inspect Root Node `expr_tree`",
    "Checking whether root AST node is a primitive scalar constant or an operator dictionary node `{'op': '*', ...}`.",
    { isDict: true, op: "*" },
  );

  // 3: Recurse left child of root
  const edgesStep3: GraphEdgeItem[] = initialEdges.map((e) =>
    e.from === "root" && e.to === "left_op" ? { ...e, isTraversed: true, isPath: true } : e,
  );
  const nodesStep3: GraphNodeItem[] = initialNodes.map((n) =>
    n.id === "root"
      ? { ...n, state: "visited" }
      : n.id === "left_op"
        ? { ...n, state: "active" }
        : n,
  );
  addStep(
    5,
    "Recurse into Left Subtree of Root (`+`)",
    "Post-order traversal requires evaluating children before parent operator evaluation. Calling ast_constant_folding(expr_tree.left).",
    { currentSubtree: "left", op: "+" },
    nodesStep3,
    edgesStep3,
  );

  // 4: Inspect left_op
  addStep(
    2,
    "Inspect Left Subtree Node `+`",
    "Checking whether left subtree node `+` is a primitive scalar constant or operator dictionary.",
    { isDict: true, op: "+" },
    nodesStep3,
    edgesStep3,
  );

  // 5: Recurse into leaf_0
  const edgesStep5: GraphEdgeItem[] = edgesStep3.map((e) =>
    e.from === "left_op" && e.to === "leaf_0" ? { ...e, isTraversed: true, isPath: true } : e,
  );
  const nodesStep5: GraphNodeItem[] = nodesStep3.map((n) =>
    n.id === "left_op"
      ? { ...n, state: "visited" }
      : n.id === "leaf_0"
        ? { ...n, state: "active" }
        : n,
  );
  addStep(
    5,
    `Recurse into Left Operand of \`+\` (\`leaf_0\` = ${v0})`,
    "Navigating to leaf node containing scalar constant value.",
    { currentLeaf: v0 },
    nodesStep5,
    edgesStep5,
  );

  // 6: Inspect leaf_0
  const nodesStep6: GraphNodeItem[] = nodesStep5.map((n) =>
    n.id === "leaf_0" ? { ...n, state: "compare" } : n,
  );
  addStep(
    2,
    `Inspect Leaf Node \`leaf_0\` (${v0})`,
    "Checking type of leaf_0: it is a primitive numeric scalar constant.",
    { isDict: false, leafVal: v0 },
    nodesStep6,
    edgesStep5,
  );

  // 7: Base case return leaf_0
  const nodesStep7: GraphNodeItem[] = nodesStep5.map((n) =>
    n.id === "leaf_0"
      ? { ...n, state: "visited" }
      : n.id === "left_op"
        ? { ...n, state: "active" }
        : n,
  );
  addStep(
    3,
    `Base Case: Return Leaf Constant ${v0}`,
    "isinstance(leaf_0, dict) is False. Returning primitive scalar value directly to caller.",
    { returnedVal: v0 },
    nodesStep7,
    edgesStep5,
  );

  // 8: Recurse into leaf_1
  const edgesStep8: GraphEdgeItem[] = edgesStep5.map((e) =>
    e.from === "left_op" && e.to === "leaf_1" ? { ...e, isTraversed: true, isPath: true } : e,
  );
  const nodesStep8: GraphNodeItem[] = nodesStep7.map((n) =>
    n.id === "leaf_1" ? { ...n, state: "active" } : n,
  );
  addStep(
    6,
    `Recurse into Right Operand of \`+\` (\`leaf_1\` = ${v1})`,
    "Navigating to right leaf node of addition operator.",
    { currentLeaf: v1 },
    nodesStep8,
    edgesStep8,
  );

  // 9: Inspect leaf_1
  const nodesStep9: GraphNodeItem[] = nodesStep8.map((n) =>
    n.id === "leaf_1" ? { ...n, state: "compare" } : n,
  );
  addStep(
    2,
    `Inspect Leaf Node \`leaf_1\` (${v1})`,
    "Checking type of leaf_1: it is a primitive numeric scalar constant.",
    { isDict: false, leafVal: v1 },
    nodesStep9,
    edgesStep8,
  );

  // 10: Base case return leaf_1
  const nodesStep10: GraphNodeItem[] = nodesStep8.map((n) =>
    n.id === "leaf_1"
      ? { ...n, state: "visited" }
      : n.id === "left_op"
        ? { ...n, state: "active" }
        : n,
  );
  addStep(
    3,
    `Base Case: Return Leaf Constant ${v1}`,
    "isinstance(leaf_1, dict) is False. Returning primitive scalar value directly to caller.",
    { returnedVal: v1 },
    nodesStep10,
    edgesStep8,
  );

  // 11: Get operator for left_op
  addStep(
    7,
    "Retrieve Operator for Left Subtree: `op = '+'`",
    "Both child operands left and right returned. Extracting binary operator symbol '+'.",
    { left: v0, right: v1, op: "+" },
    nodesStep10,
    edgesStep8,
  );

  // 12: Check type for left_op
  const nodesStep12: GraphNodeItem[] = nodesStep10.map((n) =>
    n.id === "left_op"
      ? { ...n, state: "compare" }
      : n.id === "leaf_0" || n.id === "leaf_1"
        ? { ...n, state: "compare" }
        : n,
  );
  addStep(
    9,
    "Validate Constant Fold Condition for Subtree `+`",
    "Checking isinstance(left, (int, float)) and isinstance(right, (int, float)). Both operands are pre-computed scalar constants.",
    { leftIsConst: true, rightIsConst: true, satisfiesFoldRule: true },
    nodesStep12,
    edgesStep8,
  );

  // 13: Fold addition
  const nodesStep13: GraphNodeItem[] = nodesStep10.map((n) =>
    n.id === "left_op"
      ? { ...n, label: String(leftFolded), state: "sorted" }
      : n.id === "leaf_0" || n.id === "leaf_1"
        ? { ...n, state: "visited" }
        : n,
  );
  addStep(
    10,
    `Execute Constant Fold: ${v0} + ${v1} = ${leftFolded}`,
    "Evaluating addition at compile time. Subtree '+' collapses into a single scalar literal node in the AST.",
    { foldedValue: leftFolded, totalFolded: 1 },
    nodesStep13,
    edgesStep8,
  );

  // 14: Recurse into right subtree of root
  const edgesStep14: GraphEdgeItem[] = edgesStep8.map((e) =>
    e.from === "root" && e.to === "right_op" ? { ...e, isTraversed: true, isPath: true } : e,
  );
  const nodesStep14: GraphNodeItem[] = nodesStep13.map((n) =>
    n.id === "root"
      ? { ...n, state: "visited" }
      : n.id === "right_op"
        ? { ...n, state: "active" }
        : n,
  );
  addStep(
    6,
    "Recurse into Right Subtree of Root (`-`)",
    "Left child of root folded to scalar constant. Now recursing into right child expression subtree 30 - 40.",
    { currentSubtree: "right", op: "-" },
    nodesStep14,
    edgesStep14,
  );

  // 15: Inspect right_op
  addStep(
    2,
    "Inspect Right Subtree Node `-`",
    "Checking whether right subtree node `-` is a primitive scalar constant or operator dictionary.",
    { isDict: true, op: "-" },
    nodesStep14,
    edgesStep14,
  );

  // 16: Recurse leaf_2
  const edgesStep16: GraphEdgeItem[] = edgesStep14.map((e) =>
    e.from === "right_op" && e.to === "leaf_2" ? { ...e, isTraversed: true, isPath: true } : e,
  );
  const nodesStep16: GraphNodeItem[] = nodesStep14.map((n) =>
    n.id === "right_op"
      ? { ...n, state: "visited" }
      : n.id === "leaf_2"
        ? { ...n, state: "active" }
        : n,
  );
  addStep(
    5,
    `Recurse into Left Operand of \`-\` (\`leaf_2\` = ${v2})`,
    "Navigating to left leaf node of subtraction operator.",
    { currentLeaf: v2 },
    nodesStep16,
    edgesStep16,
  );

  // 17: Inspect leaf_2
  const nodesStep17: GraphNodeItem[] = nodesStep16.map((n) =>
    n.id === "leaf_2" ? { ...n, state: "compare" } : n,
  );
  addStep(
    2,
    `Inspect Leaf Node \`leaf_2\` (${v2})`,
    "Checking type of leaf_2: it is a primitive numeric scalar constant.",
    { isDict: false, leafVal: v2 },
    nodesStep17,
    edgesStep16,
  );

  // 18: Base case return leaf_2
  const nodesStep18: GraphNodeItem[] = nodesStep16.map((n) =>
    n.id === "leaf_2"
      ? { ...n, state: "visited" }
      : n.id === "right_op"
        ? { ...n, state: "active" }
        : n,
  );
  addStep(
    3,
    `Base Case: Return Leaf Constant ${v2}`,
    "isinstance(leaf_2, dict) is False. Returning primitive scalar value directly to caller.",
    { returnedVal: v2 },
    nodesStep18,
    edgesStep16,
  );

  // 19: Recurse leaf_3
  const edgesStep19: GraphEdgeItem[] = edgesStep16.map((e) =>
    e.from === "right_op" && e.to === "leaf_3" ? { ...e, isTraversed: true, isPath: true } : e,
  );
  const nodesStep19: GraphNodeItem[] = nodesStep18.map((n) =>
    n.id === "leaf_3" ? { ...n, state: "active" } : n,
  );
  addStep(
    6,
    `Recurse into Right Operand of \`-\` (\`leaf_3\` = ${v3})`,
    "Navigating to right leaf node of subtraction operator.",
    { currentLeaf: v3 },
    nodesStep19,
    edgesStep19,
  );

  // 20: Inspect leaf_3
  const nodesStep20: GraphNodeItem[] = nodesStep19.map((n) =>
    n.id === "leaf_3" ? { ...n, state: "compare" } : n,
  );
  addStep(
    2,
    `Inspect Leaf Node \`leaf_3\` (${v3})`,
    "Checking type of leaf_3: it is a primitive numeric scalar constant.",
    { isDict: false, leafVal: v3 },
    nodesStep20,
    edgesStep19,
  );

  // 21: Base case return leaf_3
  const nodesStep21: GraphNodeItem[] = nodesStep19.map((n) =>
    n.id === "leaf_3"
      ? { ...n, state: "visited" }
      : n.id === "right_op"
        ? { ...n, state: "active" }
        : n,
  );
  addStep(
    3,
    `Base Case: Return Leaf Constant ${v3}`,
    "isinstance(leaf_3, dict) is False. Returning primitive scalar value directly to caller.",
    { returnedVal: v3 },
    nodesStep21,
    edgesStep19,
  );

  // 22: Get operator right_op
  addStep(
    7,
    "Retrieve Operator for Right Subtree: `op = '-'`",
    "Both child operands left and right returned. Extracting binary operator symbol '-'.",
    { left: v2, right: v3, op: "-" },
    nodesStep21,
    edgesStep19,
  );

  // 23: Check type for right_op
  const nodesStep23: GraphNodeItem[] = nodesStep21.map((n) =>
    n.id === "right_op"
      ? { ...n, state: "compare" }
      : n.id === "leaf_2" || n.id === "leaf_3"
        ? { ...n, state: "compare" }
        : n,
  );
  addStep(
    9,
    "Validate Constant Fold Condition for Subtree `-`",
    "Checking isinstance(left, (int, float)) and isinstance(right, (int, float)). Both operands are pre-computed scalar constants.",
    { leftIsConst: true, rightIsConst: true, satisfiesFoldRule: true },
    nodesStep23,
    edgesStep19,
  );

  // 24: Fold subtraction
  const nodesStep24: GraphNodeItem[] = nodesStep21.map((n) =>
    n.id === "right_op"
      ? { ...n, label: String(rightFolded), state: "sorted" }
      : n.id === "leaf_2" || n.id === "leaf_3"
        ? { ...n, state: "visited" }
        : n,
  );
  addStep(
    11,
    `Execute Constant Fold: ${v2} - ${v3} = ${rightFolded}`,
    "Evaluating subtraction at compile time. Subtree '-' collapses into a single scalar literal node in the AST.",
    { foldedValue: rightFolded, totalFolded: 2 },
    nodesStep24,
    edgesStep19,
  );

  // 25: Retrieve operator for root node
  const nodesStep25: GraphNodeItem[] = nodesStep24.map((n) =>
    n.id === "root" ? { ...n, state: "active" } : n,
  );
  addStep(
    7,
    "Retrieve Operator for Root Node: `op = '*'`",
    "Both child subtrees collapsed to scalars (left = " +
      leftFolded +
      ", right = " +
      rightFolded +
      "). Reading root operator '*'.",
    { left: leftFolded, right: rightFolded, op: "*" },
    nodesStep25,
    edgesStep19,
  );

  // 26: Validate fold for root
  const nodesStep26: GraphNodeItem[] = nodesStep25.map((n) =>
    n.id === "root" || n.id === "left_op" || n.id === "right_op" ? { ...n, state: "compare" } : n,
  );
  addStep(
    9,
    "Validate Constant Fold Condition for Root Node `*`",
    "Both evaluated child values (" +
      leftFolded +
      " and " +
      rightFolded +
      ") are numeric constants. Satisfies fold rule.",
    { leftIsConst: true, rightIsConst: true, satisfiesFoldRule: true },
    nodesStep26,
    edgesStep19,
  );

  // 27: Fold root
  const nodesStep27: GraphNodeItem[] = nodesStep24.map((n) =>
    n.id === "root"
      ? { ...n, label: String(rootFolded), state: "sorted" }
      : { ...n, state: "visited" },
  );
  addStep(
    12,
    `Execute Constant Fold for Root: ${leftFolded} * ${rightFolded} = ${rootFolded}`,
    "Evaluating multiplication at compile time. Entire AST DAG collapses into a single scalar literal " +
      rootFolded +
      ".",
    { rootValue: rootFolded, totalFolded: 3, passCompleted: true },
    nodesStep27,
    edgesStep19,
  );

  // 28: Execution Complete
  addStep(
    12,
    "Execution Complete",
    "Successfully performed post-order AST constant folding pass across all computation DAG nodes.",
    { completed: true, result: rootFolded, totalSteps: stepIndex },
    nodesStep27,
    edgesStep19,
  );

  return steps;
};

const ASTCONSTANTFOLDING_TRIVIA: TriviaMeta = {
  skipLines: [4, 8, 13],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "expr_tree.left = expr_tree.right",
  ],
  hints: [
    { line: 2, hint: "Check if node is primitive scalar constant." },
    { line: 5, hint: "Recursively fold left subtree." },
    { line: 9, hint: "Check if both folded children are numeric constants." },
  ],
  lineExplanations: {
    1: "Defines entry point for ast_constant_folding recursive AST compiler pass.",
    2: "Base case: checks if current AST node is a primitive constant scalar (not a dict operator node).",
    3: "Returns leaf constant scalar directly without further recursive decomposition.",
    4: "Empty line separating base case check from recursive child node traversals.",
    5: "Recursively visits left child subtree to evaluate and fold constant sub-expressions.",
    6: "Recursively visits right child subtree to evaluate and fold constant sub-expressions.",
    7: "Retrieves binary operator string ('+', '-', '*') from current AST node dictionary.",
    8: "Empty line separating operator retrieval from constant folding type checks.",
    9: "Validates whether both left and right folded subtrees reduced to numeric scalar constants.",
    10: "Folds addition node by computing scalar sum (left + right).",
    11: "Folds subtraction node by computing scalar difference (left - right).",
    12: "Folds multiplication node by computing scalar product (left * right).",
    13: "Empty line before returning reconstructed non-foldable operator node.",
    14: "Returns reconstructed AST node dictionary with recursively simplified children.",
  },
};

export const astConstantFolding: AlgorithmDefinition<astConstantFoldingInput> = {
  id: "ast-constant-folding",
  title: "AST Constant Folding Compiler Pass",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  description: `### AST Constant Folding Compiler Pass

In modern deep learning graph compilers (**PyTorch Inductor**, **TorchScript**, **XLA**, and **TVM**), **Constant Folding** is an essential static optimization pass executed before code generation (Triton/CUDA).

#### Why It Exists & What It Solves
When building computation DAGs via automatic differentiation or PyTorch FX tracing, model definitions frequently contain expressions composed entirely of compile-time constants—such as hyperparameter scale factors, normalisation constants ($2 \\times \\pi \\times \\sigma$), or positional encoding offsets.

Without constant folding:
1. Every constant arithmetic expression translates into an explicit GPU kernel dispatch or elementwise Triton operation.
2. High Memory Bandwidth (HBM) is wasted reading fixed scalar inputs and storing intermediate constant tensors.

With constant folding:
- The graph compiler traverses the Abstract Syntax Tree (AST) post-order.
- Subtrees where all operands are known constants are evaluated once at compile time.
- The entire subtree is replaced by a single scalar literal node, reducing operator launch overhead and total DAG depth.

#### Step-by-Step Mechanism
1. **Post-Order Traversal**: Recursively visit the left and right children of an expression node.
2. **Type Checking**: Inspect whether both left and right simplified subtrees are numeric scalar constants (\`int\` or \`float\`).
3. **Operator Evaluation**: If both operands are constants, compute the arithmetic result (\`+\`, \`-\`, \`*\`) and return the resulting scalar value.
4. **Node Reconstruction**: If either child depends on a dynamic variable, preserve the operator node with its recursively simplified children.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(V + E)$ where $V$ is the number of AST nodes and $E$ is the number of child edges.
- **Space Complexity**: $\\mathcal{O}(D)$ auxiliary call stack space where $D$ is maximum tree depth.
- **Trade-Off**: Incurs minor compilation time cost in exchange for zero-overhead runtime kernel execution.`,
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Autograd Pass",
      inputDisplay: "data = [10, 20, 30, 40], target = 30",
      outputDisplay: "Evaluated Graph State",
      input: { data: [10, 20, 30, 40], target: 30 },
      output: "[10, 20, 30, 40]",
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
      inputDisplay: "data = [5, 10, 15, 20], target = 99",
      outputDisplay: "Evaluated Graph State",
      input: { data: [5, 10, 15, 20], target: 99 },
      output: "[5, 10, 15, 20]",
      explanation: "Edge case handling completes safely.",
    },
  ],
  code: ASTCONSTANTFOLDING_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear post-order traversal visits every AST vertex and edge exactly once.",
    space: "Call-stack memory depth is proportional to maximum expression tree height.",
  },
  topicGuide: {
    overview:
      "Constant folding is a foundational AST compilation pass in ML systems that evaluates static expression subtrees at compile time. Eliminating constant arithmetic nodes minimizes GPU kernel launch latency and reduces memory traffic across high-bandwidth memory (HBM).",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Given a binary AST expression node N = Op(L, R), if post-order traversal yields scalar constants c_L and c_R for subtrees L and R, the compiler evaluates c_N = Eval(Op, c_L, c_R). The node N is replaced by c_N, pruning the subtree.",
      },
      {
        heading: "Practical Applications & ML Infra Ecosystem",
        body: "PyTorch FX GraphModule and TorchScript compilation pipelines use constant folding to collapse static tensor shape calculations, bias additions, and fixed hyperparameter formulas before lowering graphs to Triton or C++ backends.",
      },
      {
        heading: "Step-by-Step Walkthrough & Algorithmic Mechanics",
        body: "1. Perform depth-first post-order recursion on expression tree.\n2. Evaluate left child node.\n3. Evaluate right child node.\n4. If both children are primitive scalars, compute binary operation result.\n5. Return folded scalar node to parent caller.",
      },
      {
        heading: "Hardware/Systems Trade-Offs & Complexity Analysis",
        body: "Constant folding executes in O(V + E) time and O(D) stack space. By computing constant subtrees ahead of runtime, it eliminates DRAM reads and reduces GPU instruction cache pressure during model inference.",
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
          "Hierarchical tree representation of expression syntax and operator precedence.",
      },
      {
        term: "Post-Order Traversal",
        definition:
          "Visiting left and right child subtrees before evaluating the parent operator node.",
      },
      {
        term: "Compiler Pass",
        definition:
          "An individual transformation pipeline step in a graph compiler that rewrites intermediate representations.",
      },
    ],
  },
  trivia: ASTCONSTANTFOLDING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_ASTCONSTANTFOLDING_INPUT,
  generateSteps: generateAstConstantFoldingSteps,
};
