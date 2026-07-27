import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface astExpressionEvalVariablesInput {
  data: number[];
  target?: number;
}

export const ASTEXPRESSIONEVALVARIABLES_CODE = `def ast_expression_eval_variables(node, env):
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
          ...customState,
        },
      },
      variables,
    });
  };

  // Step 1: Initialize AST Evaluation Environment Pass
  addStep(
    1,
    "Initialize AST Expression Evaluator with Variable Binding",
    "Setting up execution environment table `env` mapping variable identifiers (e.g. 'x_0', 'w_1') to runtime tensor scalars.",
    { n: arrayData.length, envVars: 5, target, phase: "INIT_ENV" },
    undefined,
    { env_x0: "10", env_w1: "20", env_b: "5" },
  );

  // Step 2: Begin AST root traversal
  addStep(
    5,
    "Inspect Root AST Expression Node",
    "Checking whether node is a literal numeric constant, variable identifier string, or binary operator dictionary.",
    { nodeKind: "BinaryOpDict", isNumeric: false, isString: false },
  );

  // Detailed multi-step simulation per element in arrayData
  let evalAccumulator = 0;
  arrayData.forEach((val, idx) => {
    const varName = `var_${idx}`;
    const isTarget = val === target;

    // Sub-step A: Check if numeric
    const stateA: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "compare", pointers: [`node=${varName}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      5,
      `Check Node [Index ${idx}]: Type Check`,
      `Evaluating isinstance(node, (int, float)) for variable '${varName}'. Is non-numeric AST variable node.`,
      { idx, nodeVal: varName, isNumeric: false, phase: "TYPE_CHECK_NUMERIC" },
      stateA,
      { currentNode: varName },
    );

    // Sub-step B: Variable environment lookup
    const stateB: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`env[${varName}]=${val}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      7,
      `Environment Symbol Lookup: env.get("${varName}") -> ${val}`,
      `Retrieving runtime tensor scalar bound to symbol '${varName}' from variable table env.`,
      { idx, varName, resolvedValue: val, phase: "ENV_LOOKUP" },
      stateB,
      { lookupKey: varName, lookupVal: String(val) },
    );

    // Sub-step C: Unpack operator & children
    addStep(
      10,
      `Unpack Node Structure: op = "${idx % 2 === 0 ? "+" : "*"}", left = "${varName}", right = ${idx * 5}`,
      "Extracting operator symbol and child subtrees for recursive evaluation.",
      { op: idx % 2 === 0 ? "+" : "*", left: varName, right: idx * 5, phase: "UNPACK_NODE" },
      stateB,
    );

    // Sub-step D: Recursive children evaluation
    evalAccumulator += idx % 2 === 0 ? val + idx * 5 : val * Math.max(1, idx * 5);
    const stateD: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: isTarget ? "active" : "sorted", value: evalAccumulator, pointers: ["eval_result"] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      11,
      `Evaluate Left Child Subtree: val_l = ${val}`,
      `Recursively evaluated left child expression yielding scalar value ${val}.`,
      { idx, val_l: val, phase: "EVAL_LEFT_CHILD" },
      stateD,
    );

    addStep(
      12,
      `Evaluate Right Child Subtree: val_r = ${idx * 5}`,
      `Recursively evaluated right child expression yielding scalar value ${idx * 5}.`,
      { idx, val_r: idx * 5, phase: "EVAL_RIGHT_CHILD" },
      stateD,
    );

    // Sub-step E: Compute operator math
    addStep(
      14,
      `Apply Binary Operator Math: ${val} ${idx % 2 === 0 ? "+" : "*"} ${idx * 5} -> ${evalAccumulator}`,
      `Executing binary arithmetic operator resulting in cumulative output state ${evalAccumulator}.`,
      { op: idx % 2 === 0 ? "+" : "*", val_l: val, val_r: idx * 5, result: evalAccumulator, phase: "COMPUTE_MATH" },
      stateD,
      { evalAccumulator: String(evalAccumulator) },
    );
  });

  // Step final-1: Final Graph Verification
  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));
  addStep(
    14,
    "Verify Full AST Expression Tree Evaluation Result",
    "Checking that all variable bindings were resolved and intermediate scalar results accumulated correctly.",
    { totalEvaluated: arrayData.length, finalScalarOutput: evalAccumulator },
    finalElements,
  );

  // Step final: Complete
  addStep(
    16,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const ASTEXPRESSIONEVALVARIABLES_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 9, 13],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "return env[node] if node in env else None",
  ],
  hints: [
    { line: 5, hint: "Check if node is primitive int or float scalar." },
    { line: 7, hint: "Look up string variable name in environment env." },
    { line: 10, hint: "Unpack op, left, and right from node dictionary." },
  ],
  lineExplanations: {
    1: "Defines entry point for ast_expression_eval_variables recursive expression evaluator.",
    2: "Docstring opening: describes AST evaluation with dynamic environment bindings.",
    3: "Docstring body: evaluates AST tree by replacing variable strings with env lookups.",
    4: "Docstring closing.",
    5: "Base case: checks if current node is a literal numeric scalar constant (int/float).",
    6: "Returns numeric scalar constant directly without environment lookup.",
    7: "Base case: checks if current node is a variable identifier string.",
    8: "Looks up variable name string in runtime environment map env with default fallback 0.",
    9: "Empty line separating base cases from compound operator unpacking.",
    10: "Unpacks operator symbol 'op', left child node, and right child node from AST dictionary.",
    11: "Recursively evaluates left child node expression under environment env.",
    12: "Recursively evaluates right child node expression under environment env.",
    13: "Empty line separating operand evaluation from binary arithmetic calculation.",
    14: "Applies addition operator returning computed sum (val_l + val_r).",
    15: "Applies multiplication operator returning computed product (val_l * val_r).",
    16: "Fallback case returning 0 for unsupported or unknown operator symbols.",
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

