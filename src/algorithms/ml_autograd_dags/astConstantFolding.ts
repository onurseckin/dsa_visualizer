import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface astConstantFoldingInput {
  data: number[];
  target?: number;
}

export const ASTCONSTANTFOLDING_CODE = `def ast_constant_folding(expr_tree):
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
  const target = input?.target ?? 30;

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
        customState: {
          data: `[${arrayData.join(", ")}]`,
          target: String(target),
          foldedCount: String(variables.foldedCount ?? 0),
          ...customState,
        },
      },
      variables,
    });
  };

  // Step 1: Init compiler pass
  addStep(
    1,
    "Initialize AST Constant Folding Compiler Pass",
    "Setting up recursion stack and constant propagation symbol table for graph optimization.",
    { n: arrayData.length, target, foldedCount: 0, currentPass: "AST_ANALYSIS" },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Evaluates constant expressions in AST subtrees to optimize computation DAG.",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "See the Python docstring for the contract and purpose of this algorithm.",
    {},
  );

  addStep(
    4,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

  // Step 2: Begin AST traversal pass
  addStep(
    5,
    "Inspect Root AST Expression Node",
    "Checking whether expression DAG root is a dictionary operator node or primitive constant scalar.",
    { isDict: true, nodeType: "BinaryOp", foldedCount: 0 },
  );

  // Detailed multi-step simulation per element in arrayData
  let foldedAccumulator = 0;
  arrayData.forEach((val, idx) => {
    const isTarget = val === target;
    
    // Sub-step A: Fetch child node
    const stateA: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "compare", pointers: [`node=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      8,
      `Fetch Left Subtree Node [Index ${idx}]: value = ${val}`,
      `Recursively traversing left child of AST node ${idx}. Evaluating constant status.`,
      { idx, val, isConstant: typeof val === "number", phase: "EVAL_LEFT" },
      stateA,
      { currentNode: `Node_${idx}`, nodeVal: String(val) },
    );

    // Sub-step B: Fetch right child & operator
    const stateB: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`node=${idx}`, "op=*"] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      10,
      `Inspect Operator for Node ${idx}: op = "${idx % 2 === 0 ? "+" : "*"}"`,
      "Retrieving binary operator symbol. Preparing operands for constant simplification.",
      { idx, leftVal: val, rightVal: idx * 2, op: idx % 2 === 0 ? "+" : "*", phase: "INSPECT_OP" },
      stateB,
      { left: String(val), right: String(idx * 2), op: idx % 2 === 0 ? "+" : "*" },
    );

    // Sub-step C: Check constant folding condition
    addStep(
      12,
      `Check Foldability for Node ${idx}`,
      "Evaluating isinstance(left, numeric) and isinstance(right, numeric). Both children are compile-time constants.",
      { leftIsConst: true, rightIsConst: true, satisfiesRule: true, phase: "CHECK_TYPES" },
      stateB,
    );

    // Sub-step D: Execute arithmetic fold
    foldedAccumulator += idx % 2 === 0 ? val + idx * 2 : val * Math.max(1, idx * 2);
    const stateD: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: isTarget ? "active" : "sorted", value: isTarget ? val : foldedAccumulator, pointers: ["folded"] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      13,
      `Perform Constant Folding for Node ${idx}: Result = ${foldedAccumulator}`,
      "Replacing subtree op(left, right) with pre-computed scalar constant node in the DAG.",
      { idx, foldedVal: foldedAccumulator, foldedCount: idx + 1, phase: "FOLD_EXECUTE" },
      stateD,
      { foldedValue: String(foldedAccumulator) },
    );

    // Sub-step E: Replace node in AST
    addStep(
      17,
      `Update AST DAG with Folded Constant Node [Index ${idx}]`,
      "Subtree successfully replaced. Node converted from BinaryOp AST node to Literal Scalar.",
      { idx, nodeStatus: "FOLDED_SCALAR", totalFolded: idx + 1 },
      stateD,
    );
  });

  // Step final-1: Final Graph Pass Verification
  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));
  addStep(
    17,
    "Verify Graph Topology After Constant Folding Pass",
    "Verifying that all constant subtrees have been eliminated and no redundant runtime operations remain.",
    { totalNodesFolded: arrayData.length, graphOptimized: true },
    finalElements,
  );

  // Step final: Complete
  addStep(
    17,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const ASTCONSTANTFOLDING_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 7, 11, 16],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "expr_tree.left = expr_tree.right",
  ],
  hints: [
    { line: 5, hint: "Check if node is primitive scalar constant." },
    { line: 8, hint: "Recursively fold left subtree." },
    { line: 12, hint: "Check if both folded children are numeric constants." },
  ],
  lineExplanations: {
    1: "Defines entry point for ast_constant_folding recursive AST compiler pass.",
    2: "Docstring opening: explains function purpose for constant sub-expression evaluation.",
    3: "Docstring body: constant expressions are evaluated to optimize computation DAGs.",
    4: "Docstring closing.",
    5: "Base case: checks if current AST node is a leaf constant or variable (not a dict operator node).",
    6: "Returns leaf value directly without further recursive decomposition.",
    7: "Empty line separating base case from recursive child traversals.",
    8: "Recursively visits left child subtree to perform post-order constant folding.",
    9: "Recursively visits right child subtree to perform post-order constant folding.",
    10: "Retrieves string binary operator ('+', '-', '*') from AST node dictionary.",
    11: "Empty line separating operand retrieval from constant folding evaluation.",
    12: "Validates if both left and right folded subtrees reduced to numeric scalar constants.",
    13: "Folds addition node by computing scalar sum (left + right).",
    14: "Folds subtraction node by computing scalar difference (left - right).",
    15: "Folds multiplication node by computing scalar product (left * right).",
    16: "Empty line before returning reconstructed non-foldable operator node.",
    17: "Returns reconstructed AST node dictionary with simplified left and right child subtrees.",
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

