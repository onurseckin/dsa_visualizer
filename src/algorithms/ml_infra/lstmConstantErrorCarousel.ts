import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
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
    
    # Step 1: Compute Forget gate (f_t) and Input gate (i_t) activations
    f_t = [sigmoid(sum(Wf[d][j] * x[j] for j in range(len(x))) + bf[d]) for d in range(dim)]
    i_t = [sigmoid(sum(Wi[d][j] * x[j] for j in range(len(x))) + bi[d]) for d in range(dim)]
    
    # Step 2: Compute Candidate cell state (c_tilde)
    c_tilde = [math.tanh(sum(Wc[d][j] * x[j] for j in range(len(x))) + bc[d]) for d in range(dim)]
    
    # Step 3: Constant Error Carousel (CEC) cell state update: c_t = f_t * c_prev + i_t * c_tilde
    c_t = [f_t[d] * c_prev[d] + i_t[d] * c_tilde[d] for d in range(dim)]
    
    # Step 4: Compute Output gate (o_t) and new Hidden state h_t = o_t * tanh(c_t)
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
      why: `Forget gate f_t = [${f_t.map((v) => v.toFixed(3)).join(", ")}], Input gate i_t = [${i_t.map((v) => v.toFixed(3)).join(", ")}]. Forget gate f_t controls retention of previous cell state c_{t-1}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: [
        ...f_t.map((v, d) => ({
          id: `f-${d}`,
          value: Number((v * 100).toFixed(0)),
          state: "active" as ElementState,
        })),
        ...i_t.map((v, d) => ({
          id: `i-${d}`,
          value: Number((v * 100).toFixed(0)),
          state: "visited" as ElementState,
        })),
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
    codeLine: 15,
    explanation: {
      what: "Compute Candidate Cell State (c_tilde)",
      why: `Candidate cell state c_tilde = [${c_tilde.map((v) => v.toFixed(3)).join(", ")}]. Candidate activation c_tilde compresses current input x_t and h_{t-1} via tanh into [-1.0, 1.0].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: c_tilde.map((v, d) => ({
        id: `ctilde-${d}`,
        value: Number((v * 100).toFixed(0)),
        state: "active" as ElementState,
      })),
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
    codeLine: 18,
    explanation: {
      what: "Update Constant Error Carousel (CEC) Cell State",
      why: `Updated cell state c_t = f_t * c_{t-1} + i_t * c_tilde = [${c_t.map((v) => v.toFixed(3)).join(", ")}]. The Constant Error Carousel (CEC) adds linear memory shortcut c_t.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: c_t.map((v, d) => ({
        id: `c-${d}`,
        value: Number((v * 100).toFixed(0)),
        state: "sorted" as ElementState,
      })),
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
    codeLine: 22,
    explanation: {
      what: "Compute Output Gate (o_t) and Hidden State (h_t)",
      why: `Output gate o_t = [${o_t.map((v) => v.toFixed(3)).join(", ")}], New Hidden state h_t = [${h_t.map((v) => v.toFixed(3)).join(", ")}]. Output gate o_t filters cell memory c_t into visible hidden state h_t.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: h_t.map((v, d) => ({
        id: `h-${d}`,
        value: Number((v * 100).toFixed(0)),
        state: "sorted" as ElementState,
      })),
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
      line: 18,
      hint: "Update cell state via Constant Error Carousel: c_t = f_t * c_prev + i_t * c_tilde.",
    },
    {
      line: 22,
      hint: "Filter cell state into hidden representation h_t = o_t * tanh(c_t).",
    },
  ],
  lineExplanations: {
    1: "Defines LSTM Constant Error Carousel (CEC) cell update step.",
    11: "Calculates forget gate f_t and input gate i_t sigmoid probabilities.",
    18: "Executes linear cell memory update preventing gradient vanishing.",
    22: "Produces output gate and final recurrent hidden state h_t.",
  },
};

export const lstmConstantErrorCarousel: AlgorithmDefinition<LstmConstantErrorCarouselInput> = {
  id: "lstm-constant-error-carousel",
  title: "LSTM Constant Error Carousel (CEC) & Gate Activations",
  category: "ml_recurrent_gates",
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 6,
  description:
    "Simulates Hochreiter & Schmidhuber's Long Short-Term Memory (LSTM) Constant Error Carousel (CEC) linear cell state memory update and gate activations.",
  constraints: ["len(x) == len(cPrev)", "weights dimension matches x and cPrev dimension"],
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
      "Introduced by Hochreiter & Schmidhuber (1997), the Long Short-Term Memory (LSTM) network resolved the vanishing gradient problem in RNNs through the Constant Error Carousel (CEC).",
    sections: [
      {
        heading: "Constant Error Carousel (CEC)",
        body: "By maintaining a linear error flow d(c_t)/d(c_{t-1}) = f_t through addition rather than matrix multiplication, gradients propagate across long time horizons without exponential decay.",
      },
      {
        heading: "Gating Architecture",
        body: "Forget (f), Input (i), and Output (o) gates act as multiplicative soft-switches regulating information write, store, and read access to cell memory.",
      },
    ],
    keyTerms: [
      {
        term: "Constant Error Carousel",
        definition:
          "Linear additive cell state update that prevents gradient vanishing during backpropagation through time.",
      },
      {
        term: "Forget Gate",
        definition:
          "Sigmoid multiplicative gate controlling what fraction of historic cell memory to retain.",
      },
    ],
  },
  trivia: LSTM_CONSTANT_ERROR_CAROUSEL_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 6" }],
  defaultInput: DEFAULT_LSTM_CONSTANT_ERROR_CAROUSEL_INPUT,
  generateSteps: generateLstmConstantErrorCarouselSteps,
};
