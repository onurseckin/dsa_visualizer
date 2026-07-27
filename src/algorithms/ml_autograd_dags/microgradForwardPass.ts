import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface microgradForwardPassInput {
  data: number[];
  target?: number;
}

export const MICROGRADFORWARDPASS_CODE = `def micrograd_forward_pass(a, b, op="+"):
    """
    Evaluates forward pass scalar value and binds backward gradient function.
    """
    if op == "+":
        out_val = a + b
        local_grad_a, local_grad_b = 1.0, 1.0
    elif op == "*":
        out_val = a * b
        local_grad_a, local_grad_b = b, a
    else:
        out_val, local_grad_a, local_grad_b = a, 1.0, 0.0

    return out_val, local_grad_a, local_grad_b`;

export const DEFAULT_MICROGRADFORWARDPASS_INPUT: microgradForwardPassInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateMicrogradForwardPassSteps = (
  input: microgradForwardPassInput,
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

  // Step 1: Init Micrograd Forward Engine
  addStep(
    1,
    "Initialize Micrograd Computational Graph Forward Engine",
    "Setting up scalar `Value` node evaluation pass for dynamic autograd graph execution.",
    { n: arrayData.length, target, phase: "INIT_MICROGRAD_FORWARD" },
    undefined,
    { engine_mode: "EAGER_EXECUTION", grad_enabled: "True" },
  );

  // Step 2: Begin DAG operation traversal
  addStep(
    5,
    "Inspect Operator Input Parameters (a, b, op)",
    "Preparing to evaluate forward mathematical operation and compute local partial derivatives.",
    { operandCount: arrayData.length, phase: "INSPECT_OPERANDS" },
  );

  // Multi-step evaluation per pair of values in input data
  arrayData.forEach((val, idx) => {
    const a = val;
    const b = (idx + 1) * 5;
    const op = idx % 2 === 0 ? "+" : "*";
    const isTarget = val === target;

    const stateA: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "compare", pointers: [`a=${a}`, `b=${b}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      5,
      `Check Op Type for Pair ${idx}: op == "${op}"`,
      `Evaluating operator condition for operands a = ${a}, b = ${b}.`,
      { idx, a, b, op, phase: "CHECK_OP_TYPE" },
      stateA,
      { active_a: String(a), active_b: String(b), active_op: op },
    );

    let outVal = 0;
    let localGradA = 0;
    let localGradB = 0;

    if (op === "+") {
      outVal = a + b;
      localGradA = 1.0;
      localGradB = 1.0;

      addStep(
        6,
        `Compute Forward Addition Sum: out_val = ${a} + ${b} -> ${outVal}`,
        "Executing forward scalar addition operator: out_val = a + b.",
        { a, b, op: "+", outVal, phase: "COMPUTE_ADD_SUM" },
        stateA,
        { out_val: String(outVal) },
      );

      addStep(
        7,
        `Set Addition Local Derivatives: (d_out/d_a = 1.0, d_out/d_b = 1.0)`,
        "For addition, derivative with respect to both input operands is identity factor 1.0.",
        { localGradA: 1.0, localGradB: 1.0, phase: "SET_ADD_DERIVS" },
        stateA,
        { d_out_d_a: "1.0", d_out_d_b: "1.0" },
      );
    } else {
      outVal = a * b;
      localGradA = b;
      localGradB = a;

      addStep(
        9,
        `Compute Forward Multiplication Product: out_val = ${a} * ${b} -> ${outVal}`,
        "Executing forward scalar multiplication operator: out_val = a * b.",
        { a, b, op: "*", outVal, phase: "COMPUTE_MUL_PROD" },
        stateA,
        { out_val: String(outVal) },
      );

      addStep(
        10,
        `Set Multiplication Local Derivatives: (d_out/d_a = ${b}, d_out/d_b = ${a})`,
        `For multiplication, d(a*b)/da = b (${b}) and d(a*b)/db = a (${a}).`,
        { localGradA: b, localGradB: a, phase: "SET_MUL_DERIVS" },
        stateA,
        { d_out_d_a: String(b), d_out_d_b: String(a) },
      );
    }

    const stateResult: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: isTarget ? "active" : "sorted", value: outVal, pointers: ["Value_Node"] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      14,
      `Return Value Node [Node_${idx}]: (out_val=${outVal}, local_grad_a=${localGradA}, local_grad_b=${localGradB})`,
      `Constructed Micrograd Value node with computed forward scalar ${outVal} and backward derivative closures.`,
      { idx, outVal, localGradA, localGradB, phase: "RETURN_VALUE_NODE" },
      stateResult,
      { node_out: String(outVal), node_d_a: String(localGradA), node_d_b: String(localGradB) },
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    14,
    "Verify Full Forward Pass Computational Graph",
    "Checking that all scalar Value objects were instantiated with forward data and backward derivative hooks.",
    { totalNodesEvaluated: arrayData.length, graphBuilt: true },
    finalElements,
  );

  addStep(
    14,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const MICROGRADFORWARDPASS_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 13],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "local_grad_a, local_grad_b = a, b",
  ],
  hints: [
    { line: 5, hint: "Check if binary operator is addition (+) or multiplication (*)." },
    { line: 7, hint: "Addition derivatives d(a+b)/da and d(a+b)/db are both 1.0." },
    { line: 10, hint: "Multiplication derivative d(a*b)/da equals opponent operand b, d(a*b)/db equals a." },
  ],
  lineExplanations: {
    1: "Defines entry point for micrograd_forward_pass scalar autograd function.",
    2: "Docstring opening: describes scalar value forward pass and backward gradient function binding.",
    3: "Docstring body: computes forward pass scalar data and records local partial derivatives.",
    4: "Docstring closing.",
    5: "Checks if binary operator string symbol is addition ('+').",
    6: "Computes forward scalar addition sum (out_val = a + b).",
    7: "Sets local partial derivatives for addition: d_out/d_a = 1.0, d_out/d_b = 1.0.",
    8: "Checks if binary operator string symbol is multiplication ('*').",
    9: "Computes forward scalar multiplication product (out_val = a * b).",
    10: "Sets local partial derivatives for multiplication: d_out/d_a = b, d_out/d_b = a.",
    11: "Else fallback branch for identity or custom operator pass.",
    12: "Sets fallback identity values: out_val = a, local_grad_a = 1.0, local_grad_b = 0.0.",
    13: "Empty line before returning computed tuple.",
    14: "Returns triple tuple containing forward output scalar and local partial derivative factors.",
  },
};

export const microgradForwardPass: AlgorithmDefinition<microgradForwardPassInput> = {
  id: "micrograd-forward-pass",
  title: "Micrograd Computational Graph Forward Pass",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description: `### Micrograd Computational Graph Forward Pass

In Andrej Karpathy's **Micrograd** autograd engine and PyTorch's C++ **ATen core**, every scalar \`Value\` object records its forward mathematical data payload alongside local derivative rules ($\\frac{\\partial \\text{out}}{\\partial a}$ and $\\frac{\\partial \\text{out}}{\\partial b}$) for reverse-mode automatic differentiation.

#### Why It Exists & What It Solves
Eager-mode deep learning frameworks (PyTorch "define-by-run") construct computation graphs dynamically as Python code executes forward instructions.

Without recording local derivatives during the forward pass:
1. The autograd engine cannot determine partial derivative rules for individual math ops during backpropagation.
2. Symbolic derivative generators require complex expression trees, whereas local derivative rules can be computed instantly from forward operand values.

With forward pass local gradient binding:
- **Addition ($z = a + b$)**:
  $$\\frac{\\partial z}{\\partial a} = 1.0, \\quad \\frac{\\partial z}{\\partial b} = 1.0$$
- **Multiplication ($z = a \\times b$)**:
  $$\\frac{\\partial z}{\\partial a} = b, \\quad \\frac{\\partial z}{\\partial b} = a$$
- Each \`Value\` node encapsulates its scalar output \`out_val\` and a \`_backward\` closure that multiplies upstream incoming gradients by these local derivative factors.

#### Step-by-Step Mechanism
1. **Operator Inspection**: Check operator type (\`+\`, \`*\`, or identity fallback).
2. **Forward Value Evaluation**: Compute scalar output \`out_val\` (e.g. $a + b$ or $a \\times b$).
3. **Local Derivative Calculation**:
   - For addition: set \`local_grad_a = 1.0\`, \`local_grad_b = 1.0\`.
   - For multiplication: set \`local_grad_a = b\`, \`local_grad_b = a\`.
4. **Return Value Node Tuple**: Return \`(out_val, local_grad_a, local_grad_b)\`.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(1)$ constant time per scalar operator evaluation ($\\mathcal{O}(N)$ for $N$ graph ops).
- **Space Complexity**: $\\mathcal{O}(1)$ space per \`Value\` object ($\\mathcal{O}(V)$ for storing activation graph nodes).
- **Trade-Off**: Enables seamless eager-mode execution at the cost of allocating graph node wrappers for every intermediate forward calculation.`,
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
  code: MICROGRADFORWARDPASS_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Constant time O(1) evaluation for individual scalar arithmetic operations.",
    space: "Constant memory O(1) per scalar Value node instantiation.",
  },
  topicGuide: {
    overview:
      "Micrograd demonstrates automatic differentiation in its simplest form. Each arithmetic operation returns a new Value object storing its forward data value, child pointers, and local derivative rules.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "For $z = a + b$, $\\frac{\\partial z}{\\partial a} = 1.0, \\frac{\\partial z}{\\partial b} = 1.0$. For $z = a \\times b$, $\\frac{\\partial z}{\\partial a} = b, \\frac{\\partial z}{\\partial b} = a$. Backpropagation multiplies upstream gradient $\\text{grad}\\_z$ by these local derivatives.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Building forward computation graphs dynamically enables PyTorch's eager-mode define-by-run autograd execution model with near-zero overhead.",
      },
      {
        heading: "Implementation Details & Local Gradients",
        body: "Implementation evaluates operator math, computes local partial derivatives, and returns output value node wrappers.",
      },
      {
        heading: "Edge Case Analysis & Zero Operands",
        body: "Edge cases include zero operands in multiplication (where local derivative $\\frac{\\partial (a \\times b)}{\\partial a} = b = 0$).",
      },
    ],
    keyTerms: [
      {
        term: "Micrograd Value",
        definition:
          "A scalar wrapper object storing data value, gradient, children, and backward derivative function.",
      },
      {
        term: "Local Derivative",
        definition:
          "Partial derivative of an operation with respect to its immediate input operands.",
      },
      {
        term: "Eager Autograd",
        definition:
          "Building autograd computation graphs dynamically on-the-fly during forward execution.",
      },
    ],
  },
  trivia: MICROGRADFORWARDPASS_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_MICROGRADFORWARDPASS_INPUT,
  generateSteps: generateMicrogradForwardPassSteps,
};
