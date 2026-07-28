import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface computeScalarChainRuleInput {
  data: number[];
  target?: number;
}

export const COMPUTESCALARCHAINRULE_CODE = `def compute_scalar_chain_rule(op_history, upstream_grad=1.0):
    gradients = {}
    curr_grad = upstream_grad

    for op, var_name, local_deriv in reversed(op_history):
        curr_grad = curr_grad * local_deriv
        gradients[var_name] = gradients.get(var_name, 0.0) + curr_grad

    return gradients`;

export const DEFAULT_COMPUTESCALARCHAINRULE_INPUT: computeScalarChainRuleInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateComputeScalarChainRuleSteps = (
  input: computeScalarChainRuleInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayData = input?.data || [10, 20, 30, 40, 50];
  const target = input?.target ?? 30;
  const numOps = arrayData.length;

  const buildGraphSnapshot = (
    activeIdx: number | null,
    phase: "FETCH" | "PRODUCT" | "ACCUMULATE" | "INIT" | "DONE",
    gradientsMap: Record<string, number>,
  ): { nodes: GraphNodeItem[]; edges: GraphEdgeItem[] } => {
    const nodes: GraphNodeItem[] = arrayData.map((val, idx) => {
      const varName = `w_${idx}`;
      const gradVal = gradientsMap[varName] ?? 0.0;
      let state: GraphNodeItem["state"] = "default";

      if (idx === activeIdx) {
        if (phase === "FETCH") state = "compare";
        else if (phase === "PRODUCT") state = "active";
        else if (phase === "ACCUMULATE") state = "sorted";
      } else if (activeIdx !== null && idx > activeIdx) {
        state = "visited";
      } else if (phase === "DONE") {
        state = "sorted";
      }

      return {
        id: `node-${idx}`,
        label: `${varName} (v:${val}, dL:${gradVal})`,
        val: gradVal,
        state,
        x: 80 + idx * 130,
        y: idx % 2 === 0 ? 120 : 200,
      };
    });

    const edges: GraphEdgeItem[] = [];
    for (let i = numOps - 1; i > 0; i--) {
      const localDeriv = Number((0.1 * (i + 1)).toFixed(2));
      const isCurrent = activeIdx === i;
      const isTraversed = activeIdx !== null ? i > activeIdx : phase === "DONE";

      edges.push({
        from: `node-${i}`,
        to: `node-${i - 1}`,
        weight: localDeriv,
        isTraversed,
        isPath: isCurrent,
      });
    }

    return { nodes, edges };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIdx: number | null = null,
    phase: "FETCH" | "PRODUCT" | "ACCUMULATE" | "INIT" | "DONE" = "INIT",
    gradientsMap: Record<string, number> = {},
    customState?: Record<string, string | number>,
  ) => {
    const graphSnap = buildGraphSnapshot(activeIdx, phase, gradientsMap);

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
        nodes: graphSnap.nodes,
        edges: graphSnap.edges,
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

  // Step 1: Init Chain Rule Accumulator
  addStep(
    1,
    "Initialize Scalar Chain Rule Gradient Accumulator Engine",
    "Setting up reverse autograd tape pass and preparing scalar chain rule evaluation.",
    { opCount: arrayData.length, target, curr_grad: 1.0, phase: "INIT_CHAIN_RULE" },
    null,
    "INIT",
    {},
    { upstream_grad: "1.0", tape_status: "REVERSE_TRAVERSAL" },
  );

  // Step 2: Init gradients dictionary
  addStep(
    2,
    "Initialize Gradient Dictionary",
    "Allocating empty dictionary gradients = {} to store parameter variable names and their accumulated partial derivatives.",
    { gradientsCount: 0, phase: "INIT_GRADIENTS" },
    null,
    "INIT",
    {},
  );

  // Step 3: Seed upstream grad
  addStep(
    3,
    "Seed Upstream Loss Gradient dL/dL = 1.0",
    "Setting running derivative seed curr_grad = upstream_grad (default 1.0).",
    { curr_grad: 1.0, phase: "SEED_UPSTREAM" },
    null,
    "INIT",
    {},
  );

  // Detailed multi-step simulation per operation in reverse history
  let currGrad = 1.0;
  const gradMap: Record<string, number> = {};

  for (let idx = numOps - 1; idx >= 0; idx--) {
    const val = arrayData[idx];
    const varName = `w_${idx}`;
    const localDeriv = Number((0.1 * (idx + 1)).toFixed(2));
    const opName = idx % 2 === 0 ? "MUL" : "ADD";

    // Sub-step A: Fetch operation from tape (Line 5)
    addStep(
      5,
      `Fetch Operation ${idx} from Tape: (${opName}, "${varName}", local_deriv=${localDeriv})`,
      `Popping operation tuple from execution tape in reverse chronological order.`,
      { idx, op: opName, var_name: varName, local_deriv: localDeriv, phase: "FETCH_TAPE_OP" },
      idx,
      "FETCH",
      gradMap,
      { currentVar: varName, opType: opName, val: String(val) },
    );

    // Sub-step B: Apply Chain Rule Multiplication (Line 6)
    const prevGrad = currGrad;
    currGrad = Number((currGrad * localDeriv).toFixed(4));
    addStep(
      6,
      `Chain Rule Multiplication: curr_grad = ${prevGrad} * ${localDeriv} -> ${currGrad}`,
      `Applying chain rule product rule: dL/d(${varName}) = (dL/dOut) * dOut/d(${varName}) = ${currGrad}.`,
      { idx, varName, prevGrad, localDeriv, curr_grad: currGrad, phase: "CHAIN_RULE_PRODUCT" },
      idx,
      "PRODUCT",
      gradMap,
      { curr_grad: String(currGrad) },
    );

    // Sub-step C: Accumulate Multivariable Gradient (Line 7)
    const prevVarGrad = gradMap[varName] || 0.0;
    gradMap[varName] = Number((prevVarGrad + currGrad).toFixed(4));
    addStep(
      7,
      `Accumulate Gradient: gradients["${varName}"] = ${prevVarGrad} + ${currGrad} -> ${gradMap[varName]}`,
      `Summing gradient contribution into variable table to handle multivariable dependencies.`,
      {
        idx,
        varName,
        prevVarGrad,
        currGrad,
        totalGrad: gradMap[varName],
        phase: "ACCUMULATE_VAR_GRAD",
      },
      idx,
      "ACCUMULATE",
      gradMap,
      { [varName]: String(gradMap[varName]) },
    );
  }

  // Step final-1: Return gradients (Line 9)
  addStep(
    9,
    "Return Accumulated Parameter Gradients",
    "Returning dictionary containing final scalar partial derivatives for all recorded variables.",
    { totalOpsProcessed: numOps, finalLeafGrad: currGrad },
    null,
    "DONE",
    gradMap,
  );

  // Step final: Complete (Line 9)
  addStep(
    9,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    null,
    "DONE",
    gradMap,
  );

  return steps;
};

const COMPUTESCALARCHAINRULE_TRIVIA: TriviaMeta = {
  skipLines: [4, 8],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "curr_grad = curr_grad + local_deriv",
  ],
  hints: [
    { line: 2, hint: "Initialize gradients map to store parameter gradient totals." },
    { line: 3, hint: "Set running gradient curr_grad to upstream_grad (default 1.0)." },
    { line: 6, hint: "Multiply running gradient by local derivative: curr_grad *= local_deriv." },
    { line: 7, hint: "Accumulate computed gradient into gradients[var_name]." },
  ],
  lineExplanations: {
    1: "Defines entry point for compute_scalar_chain_rule autograd backward pass function.",
    2: "Initializes gradients dictionary map storing parameter variable names to scalar gradient values.",
    3: "Sets running gradient accumulator curr_grad to upstream loss gradient seed (default 1.0).",
    4: "Empty line separating initializations from reverse tape iteration loop.",
    5: "Iterates in reverse chronological order through recorded operation history tape tuples.",
    6: "Applies chain rule derivative multiplication: curr_grad = curr_grad * local_deriv.",
    7: "Accumulates running gradient into variable map gradients[var_name] to handle multi-path dependencies.",
    8: "Empty line before returning accumulated gradient dictionary.",
    9: "Returns dictionary map containing accumulated scalar gradients for all graph variables.",
  },
};

export const computeScalarChainRule: AlgorithmDefinition<computeScalarChainRuleInput> = {
  id: "compute-scalar-chain-rule",
  title: "Scalar Chain Rule Gradient Accumulator",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Easy",
  description: `### Scalar Chain Rule Gradient Accumulator

In automatic differentiation scalar engines (**Micrograd**, **PyTorch scalar autograd**, and **Custom Backpropagation Tapes**), partial derivatives are evaluated backwards using the multivariable calculus **Chain Rule**.

#### Why It Exists & What It Solves
Training neural networks requires computing the partial derivative of the scalar loss $L$ with respect to every weight parameter $w_i$: $\\frac{\\partial L}{\\partial w_i}$.

Without structured chain rule backpropagation:
1. Deriving closed-form symbolic gradient expressions for complex neural network graphs becomes intractable.
2. Multivariable branch convergence (where variable $x$ feeds into both paths $y_1$ and $y_2$) leads to incorrect single-path derivative calculation.

With chain rule gradient accumulation:
- Reverse-mode autograd steps backwards along the recorded execution tape.
- Applies the chain rule product formula:
  $$\\frac{\\partial L}{\\partial x} = \\frac{\\partial L}{\\partial y} \\cdot \\frac{\\partial y}{\\partial x}$$
- Accumulates gradients for shared variables ($sum_i \\frac{\\partial L}{\\partial y_i} \\frac{\\partial y_i}{\\partial x}$), guaranteeing exact parameter updates for gradient descent.

#### Step-by-Step Mechanism
1. **Initialize Upstream Gradient**: Seed running derivative \`curr_grad = 1.0\` ($dL/dL$).
2. **Reverse Tape Traversal**: Iterate backwards through operation history \`(op, var_name, local_deriv)\`.
3. **Chain Rule Product**: Compute updated running gradient \`curr_grad = curr_grad * local_deriv\`.
4. **Multivariable Accumulation**: Sum gradient contribution \`gradients[var_name] += curr_grad\`.
5. **Return Parameter Gradients**: Return dictionary mapping variable names to accumulated partial derivatives.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(N)$ where $N$ is the number of recorded tape operations.
- **Space Complexity**: $\\mathcal{O}(V)$ memory for gradient storage dictionary.
- **Trade-Off**: Backward pass execution speed is bounded by memory accesses to stored forward activation values.`,
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
  code: COMPUTESCALARCHAINRULE_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal stepping backward through recorded execution tape operations.",
    space: "Linear memory allocation for parameter gradient tracking dictionaries.",
  },
  topicGuide: {
    overview:
      "The multivariable chain rule computes exact partial derivatives dL/dx by accumulating backward gradient products across all computational paths connecting node x to loss L.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "For composite functions L = f(g(x)), reverse pass computes dL/dg = 1.0 * f'(g) and dL/dx = dL/dg * g'(x). For multivariate branches L = f(y_1(x), y_2(x)), dL/dx = (dL/dy_1)(dy_1/dx) + (dL/dy_2)(dy_2/dx).",
      },
      {
        heading: "Practical Applications & ML Infra Ecosystem",
        body: "Used as the core autograd mechanism in PyTorch Autograd C++ engine, Micrograd, JAX primitive VJPs, and TensorFlow gradient tape interpreters.",
      },
      {
        heading: "Step-by-Step Walkthrough & Algorithmic Mechanics",
        body: "1. Seed upstream loss gradient curr_grad = 1.0.\n2. Iterate through operation tape in reverse order.\n3. Compute chain rule product curr_grad *= local_deriv.\n4. Accumulate into variable gradient map gradients[var_name] += curr_grad.\n5. Return parameter gradient dictionary.",
      },
      {
        heading: "Hardware/Systems Trade-Offs & Complexity Analysis",
        body: "Executes in O(N) time and O(V) space. High memory locality during reverse tape scanning minimizes cache misses during backpropagation.",
      },
    ],
    keyTerms: [
      {
        term: "Chain Rule",
        definition:
          "Calculus rule computing derivative of composite functions via product of intermediate derivatives.",
      },
      {
        term: "Gradient Accumulation",
        definition: "Summing partial derivative contributions across multiple computational paths.",
      },
      {
        term: "Local Derivative",
        definition: "The partial derivative dy/dx of a single isolated mathematical operation.",
      },
      {
        term: "Execution Tape",
        definition:
          "Data structure recording forward-pass operations and local derivative functions for reverse autograd.",
      },
    ],
  },
  trivia: COMPUTESCALARCHAINRULE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_COMPUTESCALARCHAINRULE_INPUT,
  generateSteps: generateComputeScalarChainRuleSteps,
};
