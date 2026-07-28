import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
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
    inv_freq = [1.0 / (base ** (2 * i / dim)) for i in range(dim // 2)]
    
    rotations = []
    for pos in positions:
        pos_rotations = []
        for i, freq in enumerate(inv_freq):
            theta = pos * freq
            cos_theta = math.cos(theta)
            sin_theta = math.sin(theta)
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
    explanation:
      "Computes frequency angles theta = pos / base^(2i/d) and rotational values (cos theta, sin theta) for relative position representation.",
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
    explanation:
      "Higher dimension pairs rotate at slower frequencies, preserving long-range positional decay.",
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
        kind: "matrix",
        rows: 0,
        cols: 0,
        cells: [],
        title: "RoPE Matrix (Invalid Configuration)",
      },
      auxiliaryState: { customState: { error: "Invalid dimension or positions" } },
      variables: {},
    });
    return steps;
  }

  const numPairs = dim / 2;
  const numPositions = positions.length;

  const invFreq: number[] = [];
  for (let i = 0; i < numPairs; i++) {
    invFreq.push(1.0 / Math.pow(base, (2 * i) / dim));
  }

  const cellValues: string[][] = Array.from({ length: numPositions }, () =>
    Array.from({ length: numPairs }, () => "-"),
  );
  const cellStates: MatrixCellItem["state"][][] = Array.from({ length: numPositions }, () =>
    Array.from({ length: numPairs }, () => "default"),
  );

  const getSnapshot = (activeRow?: number, activeCol?: number): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numPositions; r++) {
      for (let c = 0; c < numPairs; c++) {
        let state = cellStates[r][c] || "default";
        if (r === activeRow && c === activeCol && state !== "sorted") {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: cellValues[r][c],
          label: `Pos ${positions[r]}, Pair ${c}`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: numPositions,
      cols: numPairs,
      title: `RoPE Rotary Position Embeddings Matrix (${numPositions} Positions × ${numPairs} Feature Pairs)`,
      rowHeaders: positions.map((p) => `Pos ${p}`),
      colHeaders: Array.from({ length: numPairs }, (_, i) => `Pair ${i} (${2 * i}, ${2 * i + 1})`),
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow?: number,
    activeCol?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeRow, activeCol),
      auxiliaryState: {
        customState: {
          invFrequencies: invFreq.map((f, idx) => `Pair ${idx}: ${f.toExponential(3)}`).join(", "),
          dimPairs: `${numPairs} 2D rotation pairs (dim=${dim})`,
          baseFrequency: base.toString(),
          activePosition:
            activeRow !== undefined && activeRow >= 0 && activeRow < positions.length
              ? `pos=${positions[activeRow]}`
              : "N/A",
          activePair: activeCol !== undefined && activeCol >= 0 ? `Pair ${activeCol}` : "N/A",
        },
      },
      variables,
    });
  };

  addStep(
    8,
    "Initialize Inverse Frequencies for Dimension Pairs",
    `Computed inverse frequencies inv_freq = 1 / base^(2i/d) for ${numPairs} dimension pairs using base=${base}.`,
    { dim, numPairs, base },
  );

  addStep(
    10,
    "Initialize Rotations Matrix Output Buffer",
    `Created empty list rotations to hold positional embeddings for ${numPositions} token positions.`,
    { totalPositions: numPositions, rotations: "[]" },
  );

  for (let pIdx = 0; pIdx < numPositions; pIdx++) {
    const pos = positions[pIdx];

    addStep(
      11,
      `Begin Processing Token Position ${pos}`,
      `Starting 2D rotation parameter calculation for position index ${pos}.`,
      { pos, posIndex: pIdx },
      pIdx,
    );

    addStep(
      12,
      `Initialize pos_rotations List for Position ${pos}`,
      `Created empty list pos_rotations for token at position ${pos}.`,
      { pos, pos_rotations: "[]" },
      pIdx,
    );

    for (let i = 0; i < numPairs; i++) {
      const freq = invFreq[i];
      const theta = pos * freq;
      cellValues[pIdx][i] = `θ=${theta.toFixed(3)}`;
      cellStates[pIdx][i] = "pivot";

      addStep(
        14,
        `Calculate Frequency Angle theta for Position ${pos}, Pair ${i}`,
        `Multiply position pos=${pos} by inverse frequency freq=${freq.toExponential(3)} to get angle theta=${theta.toFixed(4)}.`,
        { pos, pair: i, freq: +freq.toExponential(3), theta: +theta.toFixed(4) },
        pIdx,
        i,
      );

      const cosVal = Math.cos(theta);
      const sinVal = Math.sin(theta);
      cellValues[pIdx][i] = `c:${cosVal.toFixed(3)}, s:${sinVal.toFixed(3)}`;
      cellStates[pIdx][i] = "compared";

      addStep(
        15,
        `Compute Cosine and Sine for Position ${pos}, Pair ${i}`,
        `Evaluated cos(${theta.toFixed(3)}) = ${cosVal.toFixed(4)} and sin(${theta.toFixed(3)}) = ${sinVal.toFixed(4)}.`,
        { theta: +theta.toFixed(4), cos_theta: +cosVal.toFixed(4), sin_theta: +sinVal.toFixed(4) },
        pIdx,
        i,
      );

      cellValues[pIdx][i] = `(${cosVal.toFixed(3)}, ${sinVal.toFixed(3)})`;
      cellStates[pIdx][i] = "sorted";

      addStep(
        17,
        `Store Rotation Tuple for Position ${pos}, Pair ${i}`,
        `Appended rotation tuple (cos, sin) = (${cosVal.toFixed(3)}, ${sinVal.toFixed(3)}) to pos_rotations.`,
        { pair: i, rotation: `(${cosVal.toFixed(3)}, ${sinVal.toFixed(3)})` },
        pIdx,
        i,
      );
    }

    addStep(
      18,
      `Append Rotations for Position ${pos} to Output Matrix`,
      `Stored full set of ${numPairs} 2D rotation pairs for token position ${pos}.`,
      { pos, pairsComputed: numPairs },
      pIdx,
    );
  }

  addStep(
    20,
    "RoPE Rotary Position Encoding Complete",
    `Successfully generated rotary position embeddings for all ${numPositions} sequence positions across ${numPairs} feature dimension pairs.`,
    { totalPositions: numPositions, dim, numPairs },
  );

  return steps;
}

export const ropeRotaryPosition: AlgorithmDefinition<RopeInput> = {
  id: "rope-rotary-position",
  title: "Rotary Position Embedding (RoPE)",
  topicIds: ["ml_attention_geometry"],
  difficulty: "Medium",
  description:
    "Encodes relative positional information into Transformer query and key vectors by applying position-dependent 2D rotational matrices in complex space across feature dimension pairs.",
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
        definition:
          "Rotary Position Embedding, rotating vector pairs in complex space for relative positional attention.",
      },
      {
        term: "Inverse Frequency",
        definition:
          "1 / (base ^ (2i / d)), establishing multiscale rotational speeds across head dimensions.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_ROPE_INPUT,
  generateSteps: generateRopeSteps,
};
