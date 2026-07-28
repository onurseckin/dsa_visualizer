import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface LstmGateWeights {
  Wf: number[][]; // forget gate weight matrix (dim x input_dim)
  Wi: number[][]; // input gate weight matrix
  Wc: number[][]; // candidate cell state weight matrix
  Wo: number[][]; // output gate weight matrix
  bf: number[]; // forget bias
  bi: number[]; // input bias
  bc: number[]; // candidate bias
  bo: number[]; // output bias
}

export interface LstmConstantErrorCarouselInput {
  x: number[]; // input vector at step t
  hPrev: number[]; // hidden state at step t-1
  cPrev: number[]; // cell state at step t-1
  weights: LstmGateWeights;
}

export const LSTM_CONSTANT_ERROR_CAROUSEL_CODE = `import math

def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))

def lstm_cec_step(x: list[float], h_prev: list[float], c_prev: list[float], weights: dict) -> tuple[list[float], list[float]]:
    dim = len(c_prev)
    Wf, Wi, Wc, Wo = weights["Wf"], weights["Wi"], weights["Wc"], weights["Wo"]
    bf, bi, bc, bo = weights["bf"], weights["bi"], weights["bc"], weights["bo"]
    
    f_t = [sigmoid(sum(Wf[d][j] * x[j] for j in range(len(x))) + bf[d]) for d in range(dim)]
    i_t = [sigmoid(sum(Wi[d][j] * x[j] for j in range(len(x))) + bi[d]) for d in range(dim)]
    
    c_tilde = [math.tanh(sum(Wc[d][j] * x[j] for j in range(len(x))) + bc[d]) for d in range(dim)]
    
    c_t = [f_t[d] * c_prev[d] + i_t[d] * c_tilde[d] for d in range(dim)]
    
    o_t = [sigmoid(sum(Wo[d][j] * x[j] for j in range(len(x))) + bo[d]) for d in range(dim)]
    h_t = [o_t[d] * math.tanh(c_t[d]) for d in range(dim)]
    
    return c_t, h_t`;

export const DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT: LstmConstantErrorCarouselInput = {
  x: [1.0, 0.5],
  hPrev: [0.0, 0.0],
  cPrev: [2.0, 1.0],
  weights: {
    Wf: [
      [2.0, 0.0],
      [1.0, 1.0],
    ],
    Wi: [
      [0.0, 1.0],
      [-1.0, 0.0],
    ],
    Wc: [
      [0.5, 0.5],
      [1.0, 0.0],
    ],
    Wo: [
      [1.0, 0.0],
      [0.0, 2.0],
    ],
    bf: [1.0, 0.0],
    bi: [-1.0, 0.0],
    bc: [0.0, 0.0],
    bo: [0.0, 0.0],
  },
};

const sigmoid = (v: number) => 1.0 / (1.0 + Math.exp(-v));

export const generateLstmConstantErrorCarouselSteps = (
  input: LstmConstantErrorCarouselInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const dim = input.cPrev.length;
  const { Wf, Wi, Wc, Wo, bf, bi, bc, bo } = input.weights;

  // Step 1: Compute Forget gate and Input gate
  const f_t = Array.from({ length: dim }, (_, d) =>
    sigmoid(input.x.reduce((sum, xj, j) => sum + Wf[d][j] * xj, 0) + bf[d]),
  );
  const i_t = Array.from({ length: dim }, (_, d) =>
    sigmoid(input.x.reduce((sum, xj, j) => sum + Wi[d][j] * xj, 0) + bi[d]),
  );

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: "Compute Forget (f_t) and Input (i_t) Gates",
      why: `Forget gate f_t = [${f_t.map((v) => v.toFixed(3)).join(", ")}], Input gate i_t = [${i_t.map((v) => v.toFixed(3)).join(", ")}]. Forget gate controls retention of previous cell memory c_{t-1}, while input gate controls absorption of new candidate features.`,
    },
    primarySnapshot: {
      kind: "vector",
      planeTitle: "Forget (f_t) & Input (i_t) Gate Vectors",
      vectors: [
        {
          id: "f_t",
          label: `f_t [${f_t.map((v) => v.toFixed(2)).join(", ")}]`,
          x: f_t[0],
          y: f_t[1] ?? 0,
          state: "active",
        },
        {
          id: "i_t",
          label: `i_t [${i_t.map((v) => v.toFixed(2)).join(", ")}]`,
          x: i_t[0],
          y: i_t[1] ?? 0,
          state: "compared",
        },
      ],
    },
    auxiliaryState: {
      distanceTable: Object.fromEntries([
        ...f_t.map((v, d) => [`f_t_${d}`, Number(v.toFixed(3))]),
        ...i_t.map((v, d) => [`i_t_${d}`, Number(v.toFixed(3))]),
      ]),
    },
    variables: {
      f_t_0: Number(f_t[0].toFixed(3)),
      i_t_0: Number(i_t[0].toFixed(3)),
    },
  });

  // Step 2: Compute Candidate cell state
  const c_tilde = Array.from({ length: dim }, (_, d) =>
    Math.tanh(input.x.reduce((sum, xj, j) => sum + Wc[d][j] * xj, 0) + bc[d]),
  );

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 14,
    explanation: {
      what: "Compute Candidate Cell State (c_tilde)",
      why: `Candidate cell state c_tilde = [${c_tilde.map((v) => v.toFixed(3)).join(", ")}]. Candidate activation c_tilde uses tanh to compress non-linear input features into [-1.0, 1.0].`,
    },
    primarySnapshot: {
      kind: "vector",
      planeTitle: "Candidate Cell State Vector (c_tilde)",
      vectors: [
        {
          id: "c_tilde",
          label: `c_tilde [${c_tilde.map((v) => v.toFixed(2)).join(", ")}]`,
          x: c_tilde[0],
          y: c_tilde[1] ?? 0,
          state: "active",
        },
      ],
    },
    auxiliaryState: {
      distanceTable: Object.fromEntries(
        c_tilde.map((v, d) => [`c_tilde_${d}`, Number(v.toFixed(3))]),
      ),
    },
    variables: {
      c_tilde_0: Number(c_tilde[0].toFixed(3)),
    },
  });

  // Step 3: Cell state CEC update
  const c_t = Array.from({ length: dim }, (_, d) => f_t[d] * input.cPrev[d] + i_t[d] * c_tilde[d]);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: "Update Constant Error Carousel (CEC) Cell State",
      why: `Updated cell state c_t = f_t * c_{t-1} + i_t * c_tilde = [${c_t.map((v) => v.toFixed(3)).join(", ")}]. The Constant Error Carousel (CEC) provides a linear additive shortcut for internal memory, ensuring constant gradient propagation.`,
    },
    primarySnapshot: {
      kind: "vector",
      planeTitle: "Constant Error Carousel (CEC) Cell State (c_t)",
      vectors: [
        {
          id: "c_prev",
          label: `c_{t-1} [${input.cPrev.map((v) => v.toFixed(2)).join(", ")}]`,
          x: input.cPrev[0],
          y: input.cPrev[1] ?? 0,
          state: "inactive",
        },
        {
          id: "c_t",
          label: `c_t [${c_t.map((v) => v.toFixed(2)).join(", ")}]`,
          x: c_t[0],
          y: c_t[1] ?? 0,
          state: "result",
        },
      ],
    },
    auxiliaryState: {
      distanceTable: Object.fromEntries(c_t.map((v, d) => [`c_t[${d}]`, Number(v.toFixed(3))])),
    },
    variables: {
      c_t_0: Number(c_t[0].toFixed(3)),
    },
  });

  // Step 4: Output gate and hidden state
  const o_t = Array.from({ length: dim }, (_, d) =>
    sigmoid(input.x.reduce((sum, xj, j) => sum + Wo[d][j] * xj, 0) + bo[d]),
  );
  const h_t = Array.from({ length: dim }, (_, d) => o_t[d] * Math.tanh(c_t[d]));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 18,
    explanation: {
      what: "Compute Output Gate (o_t) and Hidden State (h_t)",
      why: `Output gate o_t = [${o_t.map((v) => v.toFixed(3)).join(", ")}], New Hidden state h_t = [${h_t.map((v) => v.toFixed(3)).join(", ")}]. Output gate o_t filters tanh-compressed cell memory c_t into the exposed recurrent hidden state h_t.`,
    },
    primarySnapshot: {
      kind: "vector",
      planeTitle: "Output Gate (o_t) & Hidden State Vector (h_t)",
      vectors: [
        {
          id: "o_t",
          label: `o_t [${o_t.map((v) => v.toFixed(2)).join(", ")}]`,
          x: o_t[0],
          y: o_t[1] ?? 0,
          state: "compared",
        },
        {
          id: "h_t",
          label: `h_t [${h_t.map((v) => v.toFixed(2)).join(", ")}]`,
          x: h_t[0],
          y: h_t[1] ?? 0,
          state: "result",
        },
      ],
    },
    auxiliaryState: {
      distanceTable: Object.fromEntries([
        ...c_t.map((v, d) => [`c_t[${d}]`, Number(v.toFixed(3))]),
        ...h_t.map((v, d) => [`h_t[${d}]`, Number(v.toFixed(3))]),
      ]),
    },
    variables: {
      h_t_0: Number(h_t[0].toFixed(3)),
      o_t_0: Number(o_t[0].toFixed(3)),
    },
  });

  return steps;
};

const LSTM_CONSTANT_ERROR_CAROUSEL_TRIVIA: TriviaMeta = {
  skipLines: [1, 3, 4],
  distractors: [
    "c_t = [f_t[d] * c_tilde[d] + i_t[d] * c_prev[d] for d in range(dim)]",
    "h_t = [o_t[d] + math.tanh(c_t[d]) for d in range(dim)]",
    "f_t = [math.tanh(sum(Wf[d][j] * x[j] for j in range(len(x))) + bf[d]) for d in range(dim)]",
  ],
  hints: [
    {
      line: 11,
      hint: "Compute forget gate f_t and input gate i_t activations using sigmoid activation.",
    },
    {
      line: 16,
      hint: "Update cell state via Constant Error Carousel: c_t = f_t * c_prev + i_t * c_tilde.",
    },
    {
      line: 18,
      hint: "Filter cell state into hidden representation h_t = o_t * tanh(c_t).",
    },
  ],
  lineExplanations: {
    1: "Defines LSTM Constant Error Carousel (CEC) cell update step.",
    11: "Calculates forget gate f_t and input gate i_t sigmoid probabilities.",
    16: "Executes linear cell memory update preventing gradient vanishing.",
    18: "Produces output gate and final recurrent hidden state h_t.",
  },
};

export const lstmConstantErrorCarousel: AlgorithmDefinition<LstmConstantErrorCarouselInput> = {
  id: "lstm-constant-error-carousel",
  title: "LSTM Constant Error Carousel (CEC) & Gate Activations",
  topicIds: ["ml_attention_geometry", "ml_recurrent_gates"],
  difficulty: "Hard",
  description:
    "Long Short-Term Memory (LSTM) networks introduced by Hochreiter & Schmidhuber (1997) solve the vanishing gradient problem using the Constant Error Carousel (CEC). The CEC provides an linear additive shortcut for internal cell memory $c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t$, preserving error signals through backpropagation across arbitrary sequence lengths.\n\nInput Format:\n- x: Input vector at time step t.\n- hPrev: Hidden state vector from step t-1.\n- cPrev: Internal cell state vector from step t-1.\n- weights: Dict containing weight matrices (Wf, Wi, Wc, Wo) and bias vectors (bf, bi, bc, bo).\n\nOutput Format:\n- Returns tuple (c_t, h_t) containing updated cell state $c_t$ and output hidden state $h_t$.\n\nEdge Cases & Constraints:\n- Extreme bias values: Forget bias $b_f \\ll 0$ flushes cell state memory, resetting history context.\n- Vanishing candidate input: Input gate $i_t \\to 0$ blocks new input information from altering cell state.\n- Dimension matching: Dimensionality of inputs and weights must be consistent across state vectors.",
  constraints: ["len(x) == len(cPrev)", "weights dimensions match state vector length"],
  examples: [
    {
      kind: "basic",
      title: "2D LSTM Step with Constant Memory Preservation",
      inputDisplay: "x=[1.0, 0.5], cPrev=[2.0, 1.0], f_t ~ 0.95",
      outputDisplay: "c_t = [2.145, 1.157], h_t = [0.711, 0.600]",
      input: DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT,
      output: "c_t = [2.145, 1.157], h_t = [0.711, 0.600]",
      explanation:
        "Forget gate f_t is close to 0.95, allowing previous cell state memory (2.0, 1.0) to pass through the Constant Error Carousel with virtually zero gradient degradation.",
    },
    {
      kind: "complex",
      title: "Active Forget Gate Flushing (f_t ~ 0.0)",
      inputDisplay: "High negative forget bias bf=[-10.0, -10.0]",
      outputDisplay: "Cell state flushed, c_t dominated by new candidate c_tilde",
      input: {
        ...DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT,
        weights: {
          ...DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT.weights,
          bf: [-10.0, -10.0],
        },
      },
      output: "Cell memory cleared (f_t = 0.0)",
      explanation:
        "When forget gate f_t drops to 0.0, the CEC carousel clears historic memory c_{t-1}, resetting the unit's context.",
    },
    {
      kind: "negative",
      title: "Zero Input Gate Blocking (i_t = 0.0)",
      inputDisplay: "Large negative input bias bi=[-10.0, -10.0]",
      outputDisplay: "New inputs blocked, c_t depends purely on preserved cPrev",
      input: {
        ...DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT,
        weights: {
          ...DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT.weights,
          bi: [-10.0, -10.0],
        },
      },
      output: "c_t = f_t * cPrev (inputs blocked)",
      explanation:
        "Input gate i_t = 0 blocks new input candidates from altering the cell state memory.",
    },
  ],
  code: LSTM_CONSTANT_ERROR_CAROUSEL_CODE,
  timeComplexity: {
    best: "O(dim * input_dim)",
    average: "O(dim * input_dim)",
    worst: "O(dim * input_dim)",
  },
  spaceComplexity: "O(dim)",
  complexityAnalysis: {
    time: "Matrix-vector multiplications for 4 gates take O(4 * dim * input_dim) scalar operations.",
    space: "Requires O(dim) memory to store gate vectors and cell state activations.",
  },
  topicGuide: {
    overview:
      "Introduced by Hochreiter & Schmidhuber (1997), the Long Short-Term Memory (LSTM) network resolved the vanishing gradient problem in RNNs through the Constant Error Carousel (CEC). By separating internal cell state memory from external hidden activations, error signals propagate across long sequence time steps without exponential decay.",
    sections: [
      {
        heading: "Core Concepts & Mathematical Formulation",
        body: "The core of the LSTM cell is the linear update equation: $c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t$, where $f_t = \\sigma(W_f x_t + U_f h_{t-1} + b_f)$ is the forget gate, $i_t = \\sigma(W_i x_t + U_i h_{t-1} + b_i)$ is the input gate, and $\\tilde{c}_t = \\tanh(W_c x_t + U_c h_{t-1} + b_c)$ is the candidate state. When $f_t = 1$, $\\frac{\\partial c_t}{\\partial c_{t-1}} = 1$, creating a constant gradient shortcut (Constant Error Carousel) through time.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "In high-throughput deep learning hardware (GPUs and TPUs), evaluating 4 separate gate weight projections per time step incurs significant instruction dispatch and DRAM memory access overhead. Custom fused LSTM kernels concatenate gate matrices into a single matrix multiplication $W_{[f, i, c, o]} \\cdot [x_t, h_{t-1}]$, performing elementwise gating in SRAM in a single pass.",
      },
      {
        heading: "Implementation Nuances & Gradient Dynamics",
        body: "Forget gate biases $b_f$ are initialized to positive values (e.g. $+1.0$ or $+2.0$) by convention (Gers et al.). This ensures $f_t \\approx 1.0$ at start of training, enabling the CEC to preserve historical context before gates learn selective filtering.",
      },
      {
        heading: "Edge Cases & Gated Memory Degradation",
        body: "If forget bias $b_f \\to -\\infty$, $f_t \\to 0$, forcing the carousel to flush memory. Conversely, if input gate $i_t \\to 0$, no new sequence elements modify the internal state vector $c_t$. Proper numerical clipping of logit sums prevents overflow in exponentiation.",
      },
    ],
    keyTerms: [
      {
        term: "Constant Error Carousel (CEC)",
        definition:
          "Linear additive cell state memory shortcut ensuring constant gradient propagation over arbitrary sequence steps.",
      },
      {
        term: "Forget Gate",
        definition:
          "Sigmoid-activated gate vector controlling what fraction of past cell memory $c_{t-1}$ is retained.",
      },
      {
        term: "Input Gate",
        definition:
          "Sigmoid-activated gate vector controlling how much new candidate information $\\tilde{c}_t$ is written to cell state.",
      },
      {
        term: "Fused Gate Matrix Projection",
        definition:
          "GPU optimization bundling $W_f, W_i, W_c, W_o$ into a single matrix multiply to maximize memory bandwidth.",
      },
    ],
  },
  trivia: LSTM_CONSTANT_ERROR_CAROUSEL_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 6" }],
  defaultInput: DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT,
  generateSteps: generateLstmConstantErrorCarouselSteps,
};
