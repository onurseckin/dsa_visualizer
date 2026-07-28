import type { AlgorithmDefinition, AlgorithmStep, TreeNodeItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface astExpressionEvalVariablesInput {
  data: number[];
  target?: number;
}

export const ASTEXPRESSIONEVALVARIABLES_CODE = `def ast_expression_eval_variables(node, env):
    if isinstance(node, (int, float)):
        return node
    if isinstance(node, str):
        return env.get(node, 0)

    op, left, right = node["op"], node["left"], node["right"]
    val_l = ast_expression_eval_variables(left, env)
    val_r = ast_expression_eval_variables(right, env)

    if op == "+": return val_l + val_r
    if op == "*": return val_l * val_r
    return 0`;

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
  const target = input?.target ?? 30;

  const val0 = arrayData[0] ?? 10;
  const val1 = arrayData[1] ?? 20;
  const val2 = arrayData[2] ?? 30;
  const val3 = arrayData[3] ?? 40;
  const val4 = arrayData[4] ?? 50;

  const env: Record<string, number> = {
    x_0: val0,
    x_1: val1,
    x_2: val2,
    x_3: val3,
    x_4: val4,
  };

  const initialNodes: TreeNodeItem[] = [
    { id: "root", val: 0, leftId: "op_left", rightId: "op_right", state: "default" },
    { id: "op_left", val: 0, leftId: "var_0", rightId: "var_1", state: "default" },
    { id: "var_0", val: val0, state: "default" },
    { id: "var_1", val: val1, state: "default" },
    { id: "op_right", val: 0, leftId: "op_sub", rightId: "var_4", state: "default" },
    { id: "op_sub", val: 0, leftId: "var_2", rightId: "var_3", state: "default" },
    { id: "var_2", val: val2, state: "default" },
    { id: "var_3", val: val3, state: "default" },
    { id: "var_4", val: val4, state: "default" },
  ];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customNodes?: TreeNodeItem[],
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "tree",
        rootId: "root",
        nodes: (customNodes || initialNodes).map((node) => ({ ...node })),
      },
      auxiliaryState: {
        customState: {
          data: `[${arrayData.join(", ")}]`,
          target: String(target),
          env: JSON.stringify(env),
          ...customState,
        },
      },
      variables,
    });
  };

  // Step 1: Line 1 — Init Evaluator & Environment
  addStep(
    1,
    "Initialize AST Expression Evaluator with Variable Binding",
    "Setting up execution environment table env mapping variable identifiers to runtime scalar values.",
    { envVars: 5, target, phase: "INIT_ENV" },
    initialNodes,
    {
      env_x0: String(val0),
      env_x1: String(val1),
      env_x2: String(val2),
      env_x3: String(val3),
      env_x4: String(val4),
    },
  );

  // Step 2: Line 2 — Inspect Root AST Node
  const nodesStep2 = initialNodes.map((n) =>
    n.id === "root" ? { ...n, state: "compare" as const } : n,
  );
  addStep(
    2,
    "Inspect Root AST Expression Node: op = '+'",
    "Evaluating isinstance(node, (int, float)) for root node. Root is a compound operator dictionary node.",
    { node: "root", op: "+", isNumeric: false },
    nodesStep2,
    { currentNode: "root" },
  );

  // Step 3: Line 4 — Check if Root is String Variable
  addStep(
    4,
    "Check Root Node: isinstance(node, str) -> False",
    "Evaluating isinstance(node, str) for root node. Root is compound operator node, not variable identifier string.",
    { node: "root", isString: false },
    nodesStep2,
  );

  // Step 4: Line 7 — Unpack Root Operator & Children
  const nodesStep4 = initialNodes.map((n) =>
    n.id === "root" ? { ...n, state: "active" as const } : n,
  );
  addStep(
    7,
    "Unpack Root Node: op = '+', left = op_left (*), right = op_right (+)",
    "Extracting operator symbol '+' and child subtree references op_left and op_right for recursive evaluation.",
    { op: "+", leftNode: "op_left", rightNode: "op_right" },
    nodesStep4,
    { op: "+", left: "op_left", right: "op_right" },
  );

  // Step 5: Line 8 — Recurse Left Subtree
  const nodesStep5 = initialNodes.map((n) => {
    if (n.id === "root") return { ...n, state: "active" as const };
    if (n.id === "op_left") return { ...n, state: "active" as const };
    return n;
  });
  addStep(
    8,
    "Evaluate Left Child Subtree of Root: op_left (*)",
    "Invoking recursive call val_l = ast_expression_eval_variables(left, env) on left child node op_left.",
    { callStack: "root -> op_left", activeNode: "op_left" },
    nodesStep5,
  );

  // Step 6: Line 2 — Inspect Left Operator Node
  const nodesStep6 = initialNodes.map((n) => {
    if (n.id === "root") return { ...n, state: "active" as const };
    if (n.id === "op_left") return { ...n, state: "compare" as const };
    return n;
  });
  addStep(
    2,
    "Inspect AST Node op_left: op = '*'",
    "Evaluating isinstance(node, (int, float)) for node op_left. Node is compound operator node.",
    { node: "op_left", op: "*", isNumeric: false },
    nodesStep6,
  );

  // Step 7: Line 4 — Check if op_left is String Variable
  addStep(
    4,
    "Check Node op_left: isinstance(node, str) -> False",
    "Evaluating isinstance(node, str) for node op_left. Node is operator dictionary, not string variable.",
    { node: "op_left", isString: false },
    nodesStep6,
  );

  // Step 8: Line 7 — Unpack op_left Operator Node
  addStep(
    7,
    "Unpack Node op_left: op = '*', left = 'x_0', right = 'x_1'",
    "Extracting left variable operand 'x_0' and right variable operand 'x_1'.",
    { op: "*", left: "x_0", right: "x_1" },
    nodesStep5,
  );

  // Step 9: Line 8 — Recurse into Left Leaf 'x_0'
  const nodesStep9 = initialNodes.map((n) => {
    if (n.id === "root" || n.id === "op_left") return { ...n, state: "active" as const };
    if (n.id === "var_0") return { ...n, state: "active" as const };
    return n;
  });
  addStep(
    8,
    "Evaluate Left Leaf Variable: 'x_0'",
    "Invoking recursive call ast_expression_eval_variables('x_0', env) for variable symbol 'x_0'.",
    { targetVariable: "x_0", callStack: "root -> op_left -> x_0" },
    nodesStep9,
  );

  // Step 10: Line 2 — Check if 'x_0' is Numeric
  const nodesStep10 = initialNodes.map((n) => {
    if (n.id === "root" || n.id === "op_left") return { ...n, state: "active" as const };
    if (n.id === "var_0") return { ...n, state: "compare" as const };
    return n;
  });
  addStep(
    2,
    "Check Leaf Node 'x_0': isinstance('x_0', (int, float)) -> False",
    "Node 'x_0' is string variable identifier, not literal numeric scalar.",
    { node: "x_0", isNumeric: false },
    nodesStep10,
  );

  // Step 11: Line 4 — Check if 'x_0' is String
  addStep(
    4,
    "Check Leaf Node 'x_0': isinstance('x_0', str) -> True",
    "Node 'x_0' is valid string variable identifier.",
    { node: "x_0", isString: true },
    nodesStep9,
  );

  // Step 12: Line 5 — Environment Symbol Lookup for 'x_0'
  const nodesStep12 = initialNodes.map((n) => {
    if (n.id === "root" || n.id === "op_left") return { ...n, state: "active" as const };
    if (n.id === "var_0") return { ...n, val: val0, state: "visited" as const };
    return n;
  });
  addStep(
    5,
    `Environment Symbol Lookup: env.get('x_0') -> ${val0}`,
    `Retrieving scalar value ${val0} bound to symbol 'x_0' from environment map env.`,
    { varName: "x_0", resolvedValue: val0 },
    nodesStep12,
    { lookupResult: String(val0) },
  );

  // Step 13: Line 9 — Recurse into Right Leaf 'x_1'
  const nodesStep13 = nodesStep12.map((n) => {
    if (n.id === "var_1") return { ...n, state: "active" as const };
    return n;
  });
  addStep(
    9,
    "Evaluate Right Leaf Variable: 'x_1'",
    "Invoking recursive call ast_expression_eval_variables('x_1', env) for variable symbol 'x_1'.",
    { targetVariable: "x_1", callStack: "root -> op_left -> x_1" },
    nodesStep13,
  );

  // Step 14: Line 2 — Check if 'x_1' is Numeric
  const nodesStep14 = nodesStep12.map((n) => {
    if (n.id === "var_1") return { ...n, state: "compare" as const };
    return n;
  });
  addStep(
    2,
    "Check Leaf Node 'x_1': isinstance('x_1', (int, float)) -> False",
    "Node 'x_1' is string variable identifier, not literal numeric scalar.",
    { node: "x_1", isNumeric: false },
    nodesStep14,
  );

  // Step 15: Line 4 — Check if 'x_1' is String
  addStep(
    4,
    "Check Leaf Node 'x_1': isinstance('x_1', str) -> True",
    "Node 'x_1' is valid string variable identifier.",
    { node: "x_1", isString: true },
    nodesStep13,
  );

  // Step 16: Line 5 — Environment Symbol Lookup for 'x_1'
  const valLeftSub = val0 * val1;
  const nodesStep16 = nodesStep12.map((n) => {
    if (n.id === "var_1") return { ...n, val: val1, state: "visited" as const };
    return n;
  });
  addStep(
    5,
    `Environment Symbol Lookup: env.get('x_1') -> ${val1}`,
    `Retrieving scalar value ${val1} bound to symbol 'x_1' from environment map env.`,
    { varName: "x_1", resolvedValue: val1 },
    nodesStep16,
    { lookupResult: String(val1) },
  );

  // Step 17: Line 12 — Apply Multiplication on op_left
  const nodesStep17 = nodesStep16.map((n) => {
    if (n.id === "op_left") return { ...n, val: valLeftSub, state: "visited" as const };
    return n;
  });
  addStep(
    12,
    `Apply Binary Operator Math: ${val0} * ${val1} -> ${valLeftSub}`,
    `Executing binary operator op == '*' on left subtree yielding scalar value ${valLeftSub}.`,
    { op: "*", val_l: val0, val_r: val1, result: valLeftSub },
    nodesStep17,
    { op_left_val: String(valLeftSub) },
  );

  // Step 18: Line 9 — Recurse into Right Subtree of Root
  const nodesStep18 = nodesStep17.map((n) => {
    if (n.id === "op_right") return { ...n, state: "active" as const };
    return n;
  });
  addStep(
    9,
    "Evaluate Right Child Subtree of Root: op_right (+)",
    "Invoking recursive call val_r = ast_expression_eval_variables(right, env) on right child node op_right.",
    { callStack: "root -> op_right", activeNode: "op_right" },
    nodesStep18,
  );

  // Step 19: Line 2 — Inspect Right Operator Node
  const nodesStep19 = nodesStep17.map((n) => {
    if (n.id === "op_right") return { ...n, state: "compare" as const };
    return n;
  });
  addStep(
    2,
    "Inspect AST Node op_right: op = '+'",
    "Evaluating isinstance(node, (int, float)) for node op_right. Node is compound operator node.",
    { node: "op_right", op: "+", isNumeric: false },
    nodesStep19,
  );

  // Step 20: Line 4 — Check if op_right is String
  addStep(
    4,
    "Check Node op_right: isinstance(node, str) -> False",
    "Evaluating isinstance(node, str) for node op_right. Node is compound operator dictionary node.",
    { node: "op_right", isString: false },
    nodesStep19,
  );

  // Step 21: Line 7 — Unpack op_right Operator Node
  addStep(
    7,
    "Unpack Node op_right: op = '+', left = op_sub (*), right = 'x_4'",
    "Extracting left child subtree op_sub and right variable leaf 'x_4'.",
    { op: "+", left: "op_sub", right: "x_4" },
    nodesStep18,
  );

  // Step 22: Line 8 — Recurse into Subtree op_sub
  const nodesStep22 = nodesStep18.map((n) => {
    if (n.id === "op_sub") return { ...n, state: "active" as const };
    return n;
  });
  addStep(
    8,
    "Evaluate Subtree op_sub (*)",
    "Recursively visiting child multiplication subtree op_sub.",
    { callStack: "root -> op_right -> op_sub", activeNode: "op_sub" },
    nodesStep22,
  );

  // Step 23: Line 2 — Inspect Node op_sub
  const nodesStep23 = nodesStep18.map((n) => {
    if (n.id === "op_sub") return { ...n, state: "compare" as const };
    return n;
  });
  addStep(
    2,
    "Inspect AST Node op_sub: op = '*'",
    "Evaluating isinstance(node, (int, float)) for node op_sub.",
    { node: "op_sub", op: "*", isNumeric: false },
    nodesStep23,
  );

  // Step 24: Line 7 — Unpack Node op_sub
  addStep(
    7,
    "Unpack Node op_sub: op = '*', left = 'x_2', right = 'x_3'",
    "Extracting left variable operand 'x_2' and right variable operand 'x_3'.",
    { op: "*", left: "x_2", right: "x_3" },
    nodesStep22,
  );

  // Step 25: Line 5 — Environment Symbol Lookup for 'x_2'
  const nodesStep25 = nodesStep22.map((n) => {
    if (n.id === "var_2") return { ...n, val: val2, state: "visited" as const };
    return n;
  });
  addStep(
    5,
    `Environment Symbol Lookup: env.get('x_2') -> ${val2}`,
    `Retrieving scalar value ${val2} bound to variable 'x_2' from environment table.`,
    { varName: "x_2", resolvedValue: val2 },
    nodesStep25,
    { lookupResult: String(val2) },
  );

  // Step 26: Line 5 — Environment Symbol Lookup for 'x_3'
  const valSubMul = val2 * val3;
  const nodesStep26 = nodesStep25.map((n) => {
    if (n.id === "var_3") return { ...n, val: val3, state: "visited" as const };
    return n;
  });
  addStep(
    5,
    `Environment Symbol Lookup: env.get('x_3') -> ${val3}`,
    `Retrieving scalar value ${val3} bound to variable 'x_3' from environment table.`,
    { varName: "x_3", resolvedValue: val3 },
    nodesStep26,
    { lookupResult: String(val3) },
  );

  // Step 27: Line 12 — Compute Multiplication on op_sub
  const nodesStep27 = nodesStep26.map((n) => {
    if (n.id === "op_sub") return { ...n, val: valSubMul, state: "visited" as const };
    return n;
  });
  addStep(
    12,
    `Apply Binary Operator Math: ${val2} * ${val3} -> ${valSubMul}`,
    `Executing operator op == '*' on subtree op_sub yielding scalar value ${valSubMul}.`,
    { op: "*", val_l: val2, val_r: val3, result: valSubMul },
    nodesStep27,
    { op_sub_val: String(valSubMul) },
  );

  // Step 28: Line 5 — Environment Symbol Lookup for 'x_4'
  const valRightSub = valSubMul + val4;
  const nodesStep28 = nodesStep27.map((n) => {
    if (n.id === "var_4") return { ...n, val: val4, state: "visited" as const };
    return n;
  });
  addStep(
    5,
    `Environment Symbol Lookup: env.get('x_4') -> ${val4}`,
    `Retrieving scalar value ${val4} bound to variable 'x_4' from environment table.`,
    { varName: "x_4", resolvedValue: val4 },
    nodesStep28,
    { lookupResult: String(val4) },
  );

  // Step 29: Line 11 — Compute Addition on op_right
  const nodesStep29 = nodesStep28.map((n) => {
    if (n.id === "op_right") return { ...n, val: valRightSub, state: "visited" as const };
    return n;
  });
  addStep(
    11,
    `Apply Binary Operator Math: ${valSubMul} + ${val4} -> ${valRightSub}`,
    `Executing operator op == '+' on right subtree op_right yielding scalar value ${valRightSub}.`,
    { op: "+", val_l: valSubMul, val_r: val4, result: valRightSub },
    nodesStep29,
    { op_right_val: String(valRightSub) },
  );

  // Step 30: Line 11 — Compute Root Addition
  const totalResult = valLeftSub + valRightSub;
  const nodesStep30 = nodesStep29.map((n) => {
    if (n.id === "root") return { ...n, val: totalResult, state: "sorted" as const };
    return n;
  });
  addStep(
    11,
    `Apply Root Operator Math: ${valLeftSub} + ${valRightSub} -> ${totalResult}`,
    `Executing root addition combining left subtree (${valLeftSub}) and right subtree (${valRightSub}).`,
    { op: "+", val_l: valLeftSub, val_r: valRightSub, result: totalResult },
    nodesStep30,
    { root_final_val: String(totalResult) },
  );

  // Step 31: Line 13 — Execution Complete
  const finalNodes = nodesStep30.map((n) => ({ ...n, state: "sorted" as const }));
  addStep(
    13,
    "Execution Complete",
    "Successfully evaluated AST expression tree substituting variable bindings from environment.",
    { completed: true, totalSteps: stepIndex, finalResult: totalResult },
    finalNodes,
  );

  return steps;
};

const ASTEXPRESSIONEVALVARIABLES_TRIVIA: TriviaMeta = {
  skipLines: [6, 10],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "return env[node] if node in env else None",
  ],
  hints: [
    { line: 2, hint: "Check if node is primitive int or float scalar constant." },
    { line: 4, hint: "Look up variable identifier string in environment map env." },
    { line: 7, hint: "Unpack op symbol, left child, and right child from AST node dictionary." },
  ],
  lineExplanations: {
    1: "Defines entry point for ast_expression_eval_variables recursive expression evaluator.",
    2: "Base case: checks if current node is a literal numeric scalar constant (int/float).",
    3: "Returns numeric scalar constant directly without environment lookup.",
    4: "Base case: checks if current node is a variable identifier string.",
    5: "Looks up variable name string in runtime environment map env with default fallback 0.",
    6: "Empty line separating base cases from compound operator unpacking.",
    7: "Unpacks operator symbol 'op', left child node, and right child node from AST dictionary.",
    8: "Recursively evaluates left child node expression under environment env.",
    9: "Recursively evaluates right child node expression under environment env.",
    10: "Empty line separating operand evaluation from binary arithmetic calculation.",
    11: "Applies addition operator returning computed sum (val_l + val_r).",
    12: "Applies multiplication operator returning computed product (val_l * val_r).",
    13: "Fallback case returning 0 for unsupported or unknown operator symbols.",
  },
};

export const astExpressionEvalVariables: AlgorithmDefinition<astExpressionEvalVariablesInput> = {
  id: "ast-expression-eval-variables",
  title: "AST Expression Evaluation with Variables",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  description: `### AST Expression Evaluation with Variable Environment

In deep learning runtime frameworks (**PyTorch autograd**, **SymPy**, **ONNX Runtime**, and **JIT Executors**), evaluating computation graphs requires resolving dynamic tensor variables against a runtime binding environment (\`env\`).

#### Why It Exists & What It Solves
During forward-pass model execution, expression graphs contain both literal scalar constants and symbolic variable nodes (e.g. layer inputs $x$, weight matrices $W$, and bias vectors $b$).

Without structured variable environment lookup:
1. Hardcoded expressions cannot adapt to dynamic batch sizes or changing runtime weight bindings.
2. Symbolic autograd graph definitions cannot execute numeric forward evaluations.

With environment-based AST evaluation:
- The execution engine maintains a environment dictionary mapping variable name strings to scalar values.
- Recursion handles base-case constants, string lookups, and compound operator nodes.
- Evaluates mathematical expressions dynamically during forward propagation.

#### Step-by-Step Mechanism
1. **Base Case Check (Numeric)**: If node is numeric (\`int\`/\`float\`), return its value directly.
2. **Base Case Check (Variable)**: If node is a string identifier, fetch its scalar binding from \`env.get(node, 0)\`.
3. **Unpack Operator Node**: Extract \`op\`, \`left\`, and \`right\` subtrees from AST node dictionary.
4. **Recursive Child Evaluation**: Compute \`val_l\` and \`val_r\` via recursive tree traversal.
5. **Operator Arithmetic**: Execute operator math (\`+\`, \`*\`) and return the resulting scalar.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(V)$ where $V$ is total AST node count. Hash map variable lookup takes $\\mathcal{O}(1)$ average time.
- **Space Complexity**: $\\mathcal{O}(D)$ auxiliary call stack space where $D$ is maximum tree depth.
- **Trade-Off**: Provides dynamic interpretation flexibility at the cost of recursive dispatch overhead compared to compiled kernel binaries.`,
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
    time: "Linear time tree traversal visiting each AST vertex and edge once.",
    space: "Call stack space depth proportional to maximum AST expression depth.",
  },
  topicGuide: {
    overview:
      "AST expression evaluation with dynamic environment bindings enables autograd frameworks to substitute dynamic tensor activations and weight values into symbolic expression trees during model forward execution.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "For node N and environment Env: Value(N) = N if N in Scalars; Value(N) = Env[N] if N in Variables; Value(N) = Op(Value(L), Value(R)) if N = Op(L, R).",
      },
      {
        heading: "Practical Applications & ML Infra Ecosystem",
        body: "Used in PyTorch FX symbolic tracing, JIT expression interpreters, SymPy gradient tree derivations, and ONNX Runtime execution graphs to map variable bindings to physical tensor buffers.",
      },
      {
        heading: "Step-by-Step Walkthrough & Algorithmic Mechanics",
        body: "1. Inspect node type (scalar constant vs variable identifier vs dictionary op).\n2. If variable string, look up value in environment map.\n3. Recursively evaluate left and right child subtrees.\n4. Apply binary operator math.\n5. Return evaluated result.",
      },
      {
        heading: "Hardware/Systems Trade-Offs & Complexity Analysis",
        body: "Executes in O(V) time and O(D) memory stack space. Dictionary lookups run in O(1) expected time, minimizing runtime lookup latency.",
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
      {
        term: "AST Interpreter",
        definition:
          "An execution component that directly walks and evaluates Abstract Syntax Trees without intermediate binary compilation.",
      },
    ],
  },
  trivia: ASTEXPRESSIONEVALVARIABLES_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_ASTEXPRESSIONEVALVARIABLES_INPUT,
  generateSteps: generateAstExpressionEvalVariablesSteps,
};
