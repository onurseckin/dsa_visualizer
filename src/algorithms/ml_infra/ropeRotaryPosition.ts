import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ProblemExample,
} from "../../types/dsa";

export interface RopeInput {
  seqLen: number;
  dim: number; // Head dimension (must be even)
  base: number; // e.g. 10000.0
  positions: number[]; // Position indices to embed
}

export const ROPE_ROTARY_POSITION_CODE = `import math

def rope_rotary_position(
    positions: list[int],
    dim: int,
    base: float = 10000.0
) -> list[list[float]]:
    # Compute inverse frequencies for d/2 pairs
    inv_freq = [1.0 / (base ** (2 * i / dim)) for i in range(dim // 2)]
    
    rotations = []
    for pos in positions:
        pos_rotations = []
        for i, freq in enumerate(inv_freq):
            theta = pos * freq
            cos_theta = math.cos(theta)
            sin_theta = math.sin(theta)
            # 2D rotation matrix: [[cos, -sin], [sin, cos]]
            pos_rotations.append((cos_theta, sin_theta))
        rotations.append(pos_rotations)
        
    return rotations`;

export const DEFAULT_ROPE_INPUT: RopeInput = {
  seqLen: 3,
  dim: 4,
  base: 10000.0,
  positions: [0, 1, 2],
};

export const ROPE_EXAMPLES: ProblemExample<RopeInput>[] = [
  {
    id: "basic",
    kind: "basic",
    title: "3-Token Sequence RoPE Embedding (4-Dim)",
    input: {
      seqLen: 3,
      dim: 4,
      base: 10000.0,
      positions: [0, 1, 2],
    },
    output: "Complex rotation factors (cos, sin) for 3 positions across 2 feature pairs",
    explanation: "Computes frequency angles theta = pos / base^(2i/d) and rotational values (cos theta, sin theta) for relative position representation.",
  },
  {
    id: "complex",
    kind: "complex",
    title: "Long Context Position Embedding (Position 0, 1024, 4096)",
    input: {
      seqLen: 3,
      dim: 8,
      base: 10000.0,
      positions: [0, 1024, 4096],
    },
    output: "High-frequency and low-frequency rotations across 4 dimension pairs",
    explanation: "Higher dimension pairs rotate at slower frequencies, preserving long-range positional decay.",
  },
  {
    id: "negative",
    kind: "negative",
    title: "Single Token Position 0 Rotation",
    input: {
      seqLen: 1,
      dim: 4,
      base: 10000.0,
      positions: [0],
    },
    output: "Identity rotation cos(0)=1.0, sin(0)=0.0",
    explanation: "At position 0, all rotation angles are 0, resulting in identity transformation.",
  },
];

export function generateRopeSteps(input: RopeInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { seqLen, dim, base, positions } = input;

  if (seqLen <= 0 || dim <= 0 || dim % 2 !== 0 || !positions || positions.length === 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 1,
      explanation: {
        what: "Invalid RoPE Configuration",
        why: "Dimension must be an even positive integer and positions must be non-empty.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: { customState: { error: "Invalid dimension or positions" } },
      variables: {},
    });
    return steps;
  }

  const numPairs = dim / 2;
  const invFreq: number[] = [];
  for (let i = 0; i < numPairs; i++) {
    invFreq.push(1.0 / Math.pow(base, (2 * i) / dim));
  }

  const elements: ArrayElement[] = positions.map((pos) => ({
    id: `pos-${pos}`,
    value: pos,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activePosIdx: number,
    vars: Record<string, string | number | boolean>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el, idx) => ({
          ...el,
          state: idx === activePosIdx ? "active" : idx < activePosIdx ? "sorted" : "default",
          pointers: idx === activePosIdx ? [`Pos ${positions[idx]}`] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          invFrequencies: invFreq.map((f) => f.toExponential(3)).join(", "),
          dimPairs: `${numPairs} 2D rotation pairs per token`,
          baseFrequency: base.toString(),
        },
      },
      variables: vars,
    });
  };

  addStep(
    1,
    "Initialize RoPE Rotary Position Frequencies",
    `Computed inverse frequencies for ${numPairs} dimension pairs using base=${base}.`,
    -1,
    { dim, numPairs, base }
  );

  for (let pIdx = 0; pIdx < positions.length; pIdx++) {
    const pos = positions[pIdx];
    const pairsInfo: string[] = [];

    for (let i = 0; i < numPairs; i++) {
      const freq = invFreq[i];
      const theta = pos * freq;
      const cosVal = Math.cos(theta).toFixed(3);
      const sinVal = Math.sin(theta).toFixed(3);
      pairsInfo.push(`Pair ${i}: (cos=${cosVal}, sin=${sinVal})`);
    }

    addStep(
      8,
      `Calculated Rotations for Position ${pos}`,
      `Generated 2D rotation parameters theta = ${pos} * inv_freq across all ${numPairs} pairs. (${pairsInfo.join("; ")})`,
      pIdx,
      { pos, posIndex: pIdx, pairsComputed: numPairs }
    );
  }

  elements.forEach((el) => {
    el.state = "sorted";
    el.pointers = undefined;
  });

  addStep(
    18,
    "RoPE Rotary Position Encoding Complete",
    `Successfully generated rotary embeddings for all ${positions.length} position indices.`,
    positions.length,
    { totalPositions: positions.length, dim }
  );

  return steps;
}

export const ropeRotaryPosition: AlgorithmDefinition<RopeInput> = {
  id: "rope-rotary-position",
  title: "Rotary Position Embedding (RoPE)",
  category: "ml_attention_geometry",
  difficulty: "Medium",
  description:
    "Encodes relative positional information into Transformer query and key vectors by applying position-dependent 2D rotational matrices in complex space across feature dimension pairs.",
  isMlInfra: true,
  mlInfraLevel: 7,
  constraints: [
    "Head dimension d must be an even integer > 0",
    "Base frequency > 0 (typically 10000.0 or higher)",
    "Position indices must be non-negative integers",
  ],
  examples: ROPE_EXAMPLES,
  code: ROPE_ROTARY_POSITION_CODE,
  timeComplexity: {
    best: "O(N * d)",
    average: "O(N * d)",
    worst: "O(N * d)",
  },
  spaceComplexity: "O(N * d)",
  complexityAnalysis: {
    time: "Requires calculating d/2 frequency angles and sines/cosines per position for N tokens, resulting in O(N * d) total computation.",
    space: "Requires storing d/2 (cos, sin) pairs per position vector in memory.",
  },
  topicGuide: {
    overview:
      "Rotary Position Embedding (RoPE, Su et al. 2021) replaces absolute position embeddings by multiplying 2D slices of Query/Key vectors by a 2D rotation matrix. The inner product between RoPE-embedded Query and Key vectors depends naturally on their relative distance (m - n).",
    sections: [
      {
        heading: "Complex Plane Rotations",
        body: "By grouping head features into pairs (x_2i, x_2i+1) and treating them as complex numbers x_2i + i*x_2i+1, RoPE rotates each pair by angle pos * theta_i.",
      },
      {
        heading: "Extensibility & Long Context",
        body: "RoPE gracefully decays attention score magnitude with distance while allowing sequence length extrapolation techniques (e.g. RoPE scaling / YaRN).",
      },
    ],
    keyTerms: [
      {
        term: "RoPE",
        definition: "Rotary Position Embedding, rotating vector pairs in complex space for relative positional attention.",
      },
      {
        term: "Inverse Frequency",
        definition: "1 / (base ^ (2i / d)), establishing multiscale rotational speeds across head dimensions.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_ROPE_INPUT,
  generateSteps: generateRopeSteps,
};
