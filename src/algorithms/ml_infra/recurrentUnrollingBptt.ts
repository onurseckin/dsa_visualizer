import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface RecurrentUnrollingBpttInput {
  inputs: number[];
  wX: number;
  wH: number;
  bias: number;
  initH: number;
}

export const RECURRENT_UNROLLING_BPTT_CODE = `def rnn_forward_unroll(inputs: list[float], w_x: float, w_h: float, bias: float, init_h: float) -> list[float]:
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
    4,
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
      8,
      `Time step t=${t}: compute raw activation = ${rawActivation.toFixed(4)}`,
      `Raw activation = x[${t}]*w_x (${x}*${wX}) + h_${t === 0 ? "0" : t - 1}*w_h (${hPrev.toFixed(
        3,
      )}*${wH}) + bias (${bias}) = ${rawActivation.toFixed(4)}.`,
      t,
      [...hiddenStates],
      { t, x, hPrev, rawActivation: Math.round(rawActivation * 10000) / 10000 },
    );

    addStep(
      10,
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
    codeLine: 12,
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
  skipLines: [2],
  hints: [
    { line: 6, hint: "Compute linear combination of input x and previous hidden state h_prev" },
    { line: 8, hint: "Apply non-linear tanh activation to obtain current hidden state h_t" },
    { line: 10, hint: "Pass h_t as h_prev for the next time step" },
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
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 6,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" }],
  description:
    "Unroll a Recurrent Neural Network (RNN) cell across T time steps forward to track hidden state history for BPTT gradient updates.",
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
      "Recurrent Neural Networks (RNNs) process sequential input by maintaining an internal hidden state h_t across time steps. Backpropagation Through Time (BPTT) unrolls the computational graph across time to propagate loss gradients backwards.",
    sections: [
      {
        heading: "Vanishing & Exploding Gradients",
        body: "Because gradients propagate back through T matrix multiplications by w_h, long time steps cause gradients to decay exponentially (vanishing) or blow up (exploding), motivating LSTM/GRU gating mechanisms.",
      },
    ],
    keyTerms: [
      {
        term: "BPTT",
        definition:
          "Backpropagation Through Time: gradient computation algorithm for recurrent networks.",
      },
      { term: "Hidden State", definition: "Memory vector h_t passed from time step t-1 to t." },
    ],
  },
  trivia: RECURRENT_UNROLLING_BPTT_TRIVIA,
  generateSteps: generateRecurrentUnrollingBpttSteps,
};
