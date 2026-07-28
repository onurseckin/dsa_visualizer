import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface RecurrentUnrollingBpttInput {
  inputs: number[];
  wX: number;
  wH: number;
  bias: number;
  initH: number;
}

export const RECURRENT_UNROLLING_BPTT_CODE = `def rnn_forward_unroll(inputs, w_x, w_h, bias, init_h):
    import math
    hidden_states = []
    h_prev = init_h
    for t, x in enumerate(inputs):
        raw_activation = x * w_x + h_prev * w_h + bias
        h_t = math.tanh(raw_activation)
        hidden_states.append(round(h_t, 4))
        h_prev = h_t
    return hidden_states`;

export const DEFAULT_RECURRENT_UNROLLING_BPTT_INPUT: RecurrentUnrollingBpttInput = {
  inputs: [1.0, 0.5, -0.5],
  wX: 0.8,
  wH: 0.5,
  bias: 0.0,
  initH: 0.0,
};

export const generateRecurrentUnrollingBpttSteps = (
  input: RecurrentUnrollingBpttInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const inputs = input?.inputs || [1.0, 0.5, -0.5];
  const wX = input?.wX ?? 0.8;
  const wH = input?.wH ?? 0.5;
  const bias = input?.bias ?? 0.0;
  const initH = input?.initH ?? 0.0;
  const T = inputs.length;

  const hiddenStates: number[] = [];
  const rawActivations: (number | undefined)[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeT: number | null,
    vars: Record<string, string | number | boolean>,
  ) => {
    const cells: MatrixCellItem[] = [];
    inputs.forEach((x, col) => {
      cells.push({
        row: 0,
        col,
        value: x,
        state: col === activeT ? "active" : "default",
      });

      const raw = rawActivations[col];
      cells.push({
        row: 1,
        col,
        value: raw !== undefined ? Number(raw.toFixed(4)) : "-",
        state: col === activeT ? "active" : "default",
      });

      const h = hiddenStates[col];
      cells.push({
        row: 2,
        col,
        value: h !== undefined ? Number(h.toFixed(4)) : "-",
        state: col === activeT ? "active" : h !== undefined ? "sorted" : "default",
      });
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: 3,
        cols: Math.max(1, inputs.length),
        rowHeaders: ["Input (x_t)", "Raw Activation", "Hidden State (h_t)"],
        colHeaders: inputs.map((_, i) => `t=${i}`),
        title: "RNN Unrolling & Hidden State History (BPTT)",
        cells,
      },
      auxiliaryState: {
        customState: {
          wX: String(wX),
          wH: String(wH),
          bias: String(bias),
          initH: String(initH),
          hiddenHistory: `[${hiddenStates.map((h) => h.toFixed(4)).join(", ")}]`,
        },
      },
      variables: vars,
    });
  };

  if (T === 0) {
    addStep(
      1,
      "Empty Input Sequence",
      "Input sequence length is 0. Returning empty hidden states list.",
      null,
      { valid: false, T: 0 },
    );
    return steps;
  }

  // Step 1: Def
  addStep(
    1,
    `Initialize RNN Forward Unroll Engine across T=${T} Time Steps`,
    `Unrolling RNN cell over ${T} time steps with w_x=${wX}, w_h=${wH}, bias=${bias}, h_0=${initH}.`,
    null,
    { T, wX, wH, bias, initH },
  );

  // Step 2: Import math
  addStep(
    2,
    "Import math Module",
    "Importing standard math library for tanh non-linear activation calculation.",
    null,
    { module: "math" },
  );

  // Step 3: hidden_states = []
  addStep(
    3,
    "Allocate Empty hidden_states History List `hidden_states = []`",
    "Initializing empty list `hidden_states = []` to store intermediate activation vectors required for BPTT gradient calculation.",
    null,
    { hiddenCount: 0 },
  );

  // Step 4: h_prev = init_h
  let hPrev = initH;
  addStep(
    4,
    `Set Initial Recurrent State: h_prev = init_h = ${initH}`,
    `Setting initial hidden state seed h_prev = init_h = ${initH} prior to processing time step t=0.`,
    null,
    { hPrev },
  );

  // Time-step unrolling loop
  for (let t = 0; t < T; t++) {
    const x = inputs[t];

    addStep(
      5,
      `Loop Header: Process Time Step t=${t} (x[${t}] = ${x})`,
      `Reading input x_${t} = ${x} at sequence time index t=${t}.`,
      t,
      { t, x, hPrev },
    );

    const xProj = x * wX;
    addStep(
      6,
      `Time Step t=${t}: Compute Input Projection x*w_x = ${x} * ${wX} = ${xProj.toFixed(4)}`,
      `Computed input projection component x_${t} * w_x = ${xProj.toFixed(4)}.`,
      t,
      { t, x, wX, xProj: Number(xProj.toFixed(4)) },
    );

    const hProj = hPrev * wH;
    addStep(
      6,
      `Time Step t=${t}: Compute Recurrent Transition h_prev*w_h = ${hPrev.toFixed(4)} * ${wH} = ${hProj.toFixed(4)}`,
      `Computed recurrent transition component h_${t === 0 ? "0" : t - 1} * w_h = ${hProj.toFixed(4)}.`,
      t,
      { t, hPrev, wH, hProj: Number(hProj.toFixed(4)) },
    );

    const rawActivation = xProj + hProj + bias;
    const roundedRaw = Number(rawActivation.toFixed(4));
    rawActivations.push(roundedRaw);

    addStep(
      6,
      `Time Step t=${t}: Sum Raw Activation = ${xProj.toFixed(4)} + ${hProj.toFixed(4)} + ${bias} = ${roundedRaw}`,
      `Summed linear components to form raw pre-activation value raw_activation = ${roundedRaw}.`,
      t,
      { t, x, hPrev, rawActivation: roundedRaw },
    );

    const hT = Math.tanh(rawActivation);
    const roundedH = Number(hT.toFixed(4));

    addStep(
      7,
      `Time Step t=${t}: Apply Tanh Activation h_${t} = tanh(${roundedRaw}) = ${roundedH}`,
      `Non-linear tanh activation produces hidden state activation h_${t} = ${roundedH} in range (-1, 1).`,
      t,
      { t, rawActivation: roundedRaw, hT: roundedH },
    );

    hiddenStates.push(roundedH);

    addStep(
      8,
      `Time Step t=${t}: Append h_${t} (${roundedH}) to hidden_states`,
      `Banked hidden state activation h_${t} = ${roundedH} into hidden_states history array for BPTT gradient propagation.`,
      t,
      { t, hT: roundedH, hiddenCount: hiddenStates.length },
    );

    hPrev = roundedH;

    addStep(
      9,
      `Time Step t=${t}: Update Recurrent State h_prev = ${roundedH}`,
      `Updated recurrent state tracker h_prev = ${roundedH} to seed next time step t=${t + 1}.`,
      t,
      { t, hPrev },
    );
  }

  // Step 10: Return result
  addStep(
    10,
    `Return Complete Hidden States List: [${hiddenStates.join(", ")}]`,
    `Forward unrolling complete across T=${T} time steps. Output hidden states: [${hiddenStates.join(", ")}]. Saved for BPTT.`,
    null,
    { T, complete: true, valid: true },
  );

  return steps;
};

export const RECURRENT_UNROLLING_BPTT_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "raw_activation = x * h_prev + w_x",
    "h_t = math.exp(raw_activation)",
    "hidden_states.append(x * w_x)",
    "h_prev = x * w_x",
  ],
  hints: [
    { line: 4, hint: "Initialize recurrent state tracker h_prev with initial state init_h." },
    { line: 5, hint: "Iterate through input sequence elements x and time indices t." },
    { line: 6, hint: "Compute linear combination of input x, previous state h_prev, and bias." },
    { line: 7, hint: "Apply non-linear tanh activation to obtain current hidden state h_t." },
    { line: 8, hint: "Append rounded hidden state h_t to hidden_states history array." },
    { line: 9, hint: "Update recurrent state tracker h_prev = h_t for the next time step." },
  ],
  lineExplanations: {
    1: "Declares function signature rnn_forward_unroll accepting inputs list, w_x, w_h, bias, and init_h.",
    2: "Imports standard Python math module for non-linear hyperbolic tangent tanh() activation function.",
    3: "Initializes empty accumulator list hidden_states to store unrolled hidden state activation vectors.",
    4: "Initializes recurrent state tracker h_prev to seed initial hidden state init_h (h_0).",
    5: "Iterates sequentially through time steps t and input values x in input sequence inputs.",
    6: "Computes linear raw activation sum raw_activation = x * w_x + h_prev * w_h + bias.",
    7: "Applies non-linear tanh activation function to produce current hidden state h_t = tanh(raw_activation).",
    8: "Appends rounded hidden state h_t to hidden_states history array for BPTT gradient calculation.",
    9: "Updates recurrent state tracker h_prev = h_t to seed the next time step t+1.",
    10: "Returns complete array of unrolled hidden states [h_1, h_2, ..., h_T] across all time steps.",
  },
};

export const recurrentUnrollingBptt: AlgorithmDefinition<RecurrentUnrollingBpttInput> = {
  id: "recurrent-unrolling-bptt",
  title: "Recurrent Unrolling & Backpropagation Through Time (BPTT)",
  topicIds: ["ml_attention_geometry", "ml_recurrent_gates"],
  difficulty: "Hard",
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" }],
  description: `### Recurrent Unrolling & Backpropagation Through Time (BPTT)

Recurrent Neural Networks (RNNs) process temporal sequential data by unrolling a shared RNN cell across $T$ discrete time steps. Forward unrolling evaluates hidden states:
$$h_t = \\tanh(W_x x_t + W_h h_{t-1} + b)$$
persisting state history for Backpropagation Through Time (BPTT) gradient calculation across time steps.

#### Why It Exists & What It Solves
Unlike feedforward networks, sequence data (speech, text, time-series) possesses variable temporal dependencies. BPTT unrolls the recurrent computational graph across time to backpropagate loss gradients from $t=T$ down to $t=1$, enabling neural networks to learn temporal dependencies.

#### Mathematical Formulation & BPTT Gradients
During the backward pass of BPTT, the gradient of loss $L$ with respect to recurrent weight matrix $W_h$ expands via the chain rule as:
$$\\frac{\\partial L}{\\partial W_h} = \\sum_{t=1}^T \\frac{\\partial L}{\\partial h_t} \\sum_{k=1}^t \\left( \\prod_{j=k+1}^t \\frac{\\partial h_j}{\\partial h_{j-1}} \\right) \\frac{\\partial h_k}{\\partial W_h}$$

Where the step-to-step state Jacobian is:
$$\\frac{\\partial h_j}{\\partial h_{j-1}} = \\text{diag}\\left(1 - h_j^2\\right) \\cdot W_h^T$$

#### Exploding & Vanishing Gradients
The product of Jacobians $\\prod_{j=k+1}^t W_h^T \\text{diag}(1 - h_j^2)$ causes exponential gradient magnitude shifts:
1. **Exploding Gradients ($\\|W_h\\| > 1$)**: Gradients grow exponentially $\\propto \\|W_h\\|^{t-k}$, causing $\\text{NaN}$ loss crashes. Requires **Gradient Norm Clipping**:
   $$\\mathbf{g} \\leftarrow \\mathbf{g} \\cdot \\frac{\\text{threshold}}{\\max(\\text{threshold}, \\|\\mathbf{g}\\|)}$$
2. **Vanishing Gradients ($\\|W_h\\| < 1$)**: Gradients decay exponentially to zero, preventing the network from learning long-term dependencies beyond $\\approx 10$ steps.

#### Truncated BPTT (TBPTT)
To manage memory consumption and prevent gradient explosion, **Truncated BPTT** restricts gradient backpropagation to a fixed temporal window $k$ (e.g. $k=32$). Gradients are computed only within the active chunk, while final hidden state $h_k$ is passed detached to seed the next sequence chunk.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(T)$ linear time steps evaluated sequentially during forward pass.
- **Space Complexity**: $\\mathcal{O}(T)$ memory required to store all $T$ intermediate hidden activation states for BPTT.
- **Trade-Off**: Provides temporal sequence modeling capability at the cost of sequential $O(T)$ forward execution and linear memory scaling.`,
  code: RECURRENT_UNROLLING_BPTT_CODE,
  defaultInput: DEFAULT_RECURRENT_UNROLLING_BPTT_INPUT,
  examples: [
    {
      kind: "basic",
      title: "3 Time-Step RNN Forward Unroll",
      input: DEFAULT_RECURRENT_UNROLLING_BPTT_INPUT,
      output: "[0.664, 0.6231, -0.0881]",
      explanation:
        "h1 = tanh(0.8) = 0.664; h2 = tanh(0.4 + 0.332) = 0.6231; h3 = tanh(-0.4 + 0.3116) = -0.0881.",
    },
    {
      kind: "complex",
      title: "Non-Zero Bias and Initial Hidden State",
      input: {
        inputs: [0.5, 0.5],
        wX: 1.0,
        wH: 0.5,
        bias: 0.1,
        initH: 0.2,
      },
      output: "[0.6044, 0.7171]",
      explanation: "h0=0.2 feeds into step 1, producing h1=0.6044 and h2=0.7171.",
    },
    {
      kind: "negative",
      title: "Empty Input Sequence",
      input: {
        inputs: [],
        wX: 1.0,
        wH: 0.5,
        bias: 0.0,
        initH: 0.0,
      },
      output: "[]",
      explanation: "Empty input sequence produces no unrolled hidden states.",
    },
  ],
  timeComplexity: {
    best: "O(T)",
    average: "O(T)",
    worst: "O(T)",
  },
  spaceComplexity: "O(T)",
  complexityAnalysis: {
    time: "O(T) time steps evaluated sequentially during forward pass.",
    space: "O(T) space required to store all T intermediate hidden activation states for BPTT.",
  },
  topicGuide: {
    overview:
      "Recurrent Neural Networks (RNNs) maintain state across time by feeding previous hidden vector $h_{t-1}$ into current step evaluation. Backpropagation Through Time (BPTT) unrolls the recurrent computational graph across time to backpropagate loss gradients from $t=T$ down to $t=1$.",
    sections: [
      {
        heading: "Core Concepts & Mathematical Formulation",
        body: "Forward unrolling computes $h_t = \\tanh(W_x x_t + W_h h_{t-1} + b)$. During backward pass, the loss gradient w.r.t $W_h$ expands as $\\frac{\\partial L}{\\partial W_h} = \\sum_{t=1}^T \\frac{\\partial L}{\\partial h_t} \\sum_{k=1}^t \\left( \\prod_{j=k+1}^t \\frac{\\partial h_j}{\\partial h_{j-1}} \\right) \\frac{\\partial h_k}{\\partial W_h}$. The product of Jacobians $\\prod_{j=k+1}^t W_h^T \\text{diag}(1 - h_j^2)$ causes exponential gradient magnitude shifts.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Because each step depends on $h_{t-1}$, naive RNN evaluation is inherently sequential ($O(T)$ sequential GPU kernel launches). Deep learning compilers use sequence chunking or memory activation recomputation (checkpointing) to reduce peak DRAM usage during long sequence unrolling.",
      },
      {
        heading: "Implementation Nuances & Sequence Parallelism",
        body: "Truncated BPTT (TBPTT) splits long sequences into chunks of size $k$ (e.g., $k=32$). Gradients are computed only within the active chunk, while final hidden state $h_k$ is passed detached to seed the next sequence chunk.",
      },
      {
        heading: "Edge Cases & Gradient Exploding/Vanishing Bounds",
        body: "When weight matrix spectral radius $\\rho(W_h) > 1$, gradients explode exponentially, requiring gradient norm clipping $\\mathbf{g} \\leftarrow \\mathbf{g} \\frac{\\text{threshold}}{\\|\\mathbf{g}\\|}$. When $\\rho(W_h) < 1$, gradients vanish, necessitating gating architectures like LSTM/GRU.",
      },
    ],
    keyTerms: [
      {
        term: "Backpropagation Through Time (BPTT)",
        definition:
          "Algorithm that unrolls temporal graphs over time steps to compute weight gradients back through sequence history.",
      },
      {
        term: "Truncated BPTT",
        definition:
          "Optimization limiting gradient backpropagation to a fixed temporal window $k$ to manage memory and prevent explosion.",
      },
      {
        term: "Gradient Norm Clipping",
        definition:
          "Technique rescaling gradient vectors when their norm exceeds a threshold, guarding against exploding gradients.",
      },
      {
        term: "Jacobian Chain Product",
        definition:
          "Product of step-to-step state derivative matrices responsible for vanishing or exploding gradient behavior.",
      },
    ],
  },
  trivia: RECURRENT_UNROLLING_BPTT_TRIVIA,
  generateSteps: generateRecurrentUnrollingBpttSteps,
};
