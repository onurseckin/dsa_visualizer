import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface RecurrentUnrollingBpttInput {
  inputs: number[];
  wX: number;
  wH: number;
  bias: number;
  initH: number;
}

export const RECURRENT_UNROLLING_BPTT_CODE = `import math

def rnn_forward_unroll(inputs: list[float], w_x: float, w_h: float, bias: float, init_h: float) -> list[float]:
    """
    Unrolls a Recurrent Neural Network (RNN) cell forward across T time steps,
    storing intermediate hidden activation states required for Backpropagation
    Through Time (BPTT) gradient calculation.
    """
    hidden_states = []
    h_prev = init_h
    
    for t, x in enumerate(inputs):
        raw_activation = x * w_x + h_prev * w_h + bias
        # Tanh activation function
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

  const { inputs, wX, wH, bias, initH } = input;
  const T = inputs.length;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeT: number | null,
    hiddenStates: number[],
    vars: Record<string, string | number | boolean>,
  ) => {
    const elements: ArrayElement[] = inputs.map((xVal, t) => {
      const hVal = hiddenStates[t];
      let state: ArrayElement["state"] = "default";
      if (t === activeT) state = "active";
      else if (hVal !== undefined) state = "visited";

      return {
        id: `time-${t}`,
        value: hVal !== undefined ? Math.round(hVal * 100) / 100 : xVal,
        state,
        pointers:
          hVal !== undefined ? [`t=${t}: x=${xVal}, h=${hVal.toFixed(2)}`] : [`t=${t}: x=${xVal}`],
      };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements,
      },
      auxiliaryState: {
        customState: {
          wX: String(wX),
          wH: String(wH),
          bias: String(bias),
          initH: String(initH),
          hiddenHistory: `[${hiddenStates.map((h) => h.toFixed(3)).join(", ")}]`,
        },
      },
      variables: vars,
    });
  };

  if (T === 0) {
    addStep(2, "Empty input sequence", "Input sequence length is 0.", null, [], { valid: false });
    return steps;
  }

  addStep(
    10,
    `Initialize Recurrent Unrolling (T=${T} time steps)`,
    `Unrolling RNN cell over ${T} time steps with w_x=${wX}, w_h=${wH}, bias=${bias}, h_0=${initH}.`,
    null,
    [],
    { T, initH },
  );

  const hiddenStates: number[] = [];
  let hPrev = initH;

  for (let t = 0; t < T; t++) {
    const x = inputs[t];
    const rawActivation = x * wX + hPrev * wH + bias;
    const hT = Math.tanh(rawActivation);
    const roundedH = Math.round(hT * 10000) / 10000;
    hiddenStates.push(roundedH);

    addStep(
      14,
      `Time step t=${t}: compute raw activation = ${rawActivation.toFixed(4)}`,
      `Raw activation = x[${t}]*w_x (${x}*${wX}) + h_${t === 0 ? "0" : t - 1}*w_h (${hPrev.toFixed(
        3,
      )}*${wH}) + bias (${bias}) = ${rawActivation.toFixed(4)}.`,
      t,
      [...hiddenStates],
      { t, x, hPrev, rawActivation: Math.round(rawActivation * 10000) / 10000 },
    );

    addStep(
      16,
      `Time step t=${t}: h_${t} = tanh(${rawActivation.toFixed(4)}) = ${roundedH}`,
      `Non-linear tanh activation produces hidden state h_${t} = ${roundedH}. Updated recurrent state.`,
      t,
      [...hiddenStates],
      { t, hT: roundedH },
    );

    hPrev = roundedH;
  }

  const finalElements: ArrayElement[] = hiddenStates.map((hVal, t) => ({
    id: `time-${t}`,
    value: Math.round(hVal * 100) / 100,
    state: "sorted",
    pointers: [`h_${t}=${hVal.toFixed(3)}`],
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Forward Unrolling Complete across T=${T} time steps`,
      why: `Saved full sequence of hidden states [${hiddenStates.join(
        ", ",
      )}] for BPTT backward pass.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: finalElements,
    },
    auxiliaryState: {
      customState: {
        finalHiddenStates: `[${hiddenStates.join(", ")}]`,
      },
    },
    variables: { T, complete: true },
  });

  return steps;
};

export const RECURRENT_UNROLLING_BPTT_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  hints: [
    { line: 14, hint: "Compute linear combination of input x and previous hidden state h_prev" },
    { line: 16, hint: "Apply non-linear tanh activation to obtain current hidden state h_t" },
    { line: 18, hint: "Pass h_t as h_prev for the next time step" },
  ],
  distractors: [
    "raw_activation = x * h_prev + w_x",
    "h_t = math.exp(raw_activation)",
    "hidden_states.append(x * w_x)",
  ],
};

export const recurrentUnrollingBptt: AlgorithmDefinition<RecurrentUnrollingBpttInput> = {
  id: "recurrent-unrolling-bptt",
  title: "Recurrent Unrolling & Backpropagation Through Time (BPTT)",
  category: "ml_recurrent_gates",
  categories: ["ml_recurrent_gates"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 6,
  mlInfraCategory: "ml_recurrent_gates",
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" }],
  description:
    "Recurrent Neural Networks (RNNs) process temporal sequential data by unrolling an RNN cell across T discrete time steps. Forward unrolling evaluates hidden states $h_t = \\tanh(W_x x_t + W_h h_{t-1} + b)$, persisting state history for Backpropagation Through Time (BPTT) gradient calculation across time steps.\n\nInput Format:\n- inputs: Array of input sequence scalars or vectors across T time steps.\n- wX: Input projection weight $W_x$.\n- wH: Recurrent hidden state transition weight $W_h$.\n- bias: Bias term $b$.\n- initH: Initial hidden state $h_0$.\n\nOutput Format:\n- Returns list of unrolled hidden states $[h_1, h_2, \\dots, h_T]$.\n\nEdge Cases & Constraints:\n- Empty input sequence ($T=0$): Returns empty array without error.\n- Large sequence lengths ($T > 1000$): In standard RNNs, backpropagating gradients over large T leads to exploding ($W_h > 1$) or vanishing ($W_h < 1$) gradients.\n- Truncated BPTT: Practice limits backpropagation depth to fixed horizon $k$ steps to prevent gradient explosion.",
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
