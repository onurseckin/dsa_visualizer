import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface SubvectorDecompositionCodebookInput {
  vector: number[];
  subvectorDim: number;
  codebooks: number[][][]; // M subvectors -> K_sub centroids -> d_sub dim
}

export const DEFAULT_SUBVECTOR_DECOMPOSITION_INPUT: SubvectorDecompositionCodebookInput = {
  vector: [1.2, 0.8, -0.4, 0.6],
  subvectorDim: 2,
  codebooks: [
    [
      [1.0, 1.0], // Centroid 0 for subvector 0
      [0.0, 0.0], // Centroid 1 for subvector 0
    ],
    [
      [0.0, 0.5], // Centroid 0 for subvector 1
      [-0.5, 0.5], // Centroid 1 for subvector 1
    ],
  ],
};

export const SUBVECTOR_DECOMPOSITION_CODE = `import math

def l2_distance_sq(v1: list[float], v2: list[float]) -> float:
    return sum((a - b) ** 2 for a, b in zip(v1, v2))

def subvector_decomposition_quantize(vector: list[float], subvector_dim: int, codebooks: list[list[list[float]]]) -> list[int]:
    """
    Product Quantization (PQ) vector encoding.
    Splits input vector of dimension D into M subvectors of dimension subvector_dim.
    Quantizes each subvector to its closest centroid in subbook m, returning byte codes.
    """
    num_subvectors = len(vector) // subvector_dim
    quantized_codes = []

    for m in range(num_subvectors):
        subvec = vector[m * subvector_dim : (m + 1) * subvector_dim]
        best_code = -1
        min_dist_sq = float('inf')

        for k_idx, centroid in enumerate(codebooks[m]):
            dist_sq = l2_distance_sq(subvec, centroid)
            if dist_sq < min_dist_sq:
                min_dist_sq = dist_sq
                best_code = k_idx

        quantized_codes.append(best_code)

    return quantized_codes`;

export const generateSubvectorDecompositionSteps = (
  input: SubvectorDecompositionCodebookInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { vector, subvectorDim, codebooks } = input;
  let stepIndex = 0;

  const numSubvectors = Math.floor(vector.length / subvectorDim);
  const l2DistSq = (v1: number[], v2: number[]) =>
    v1.reduce((sum, val, idx) => sum + (val - v2[idx]) ** 2, 0);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Initialize Product Quantization (PQ) Subvector Decomposition`,
      why: `Vector dimension D = ${vector.length}, splitting into M = ${numSubvectors} subvectors of dimension d_sub = ${subvectorDim}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: vector.map((val, idx) => ({
        id: `v-${idx}`,
        value: val,
        label: `x[${idx}]`,
        state: "default" as ElementState,
        pointers: idx % subvectorDim === 0 ? [`Subvector ${Math.floor(idx / subvectorDim)}`] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        vector: `[${vector.join(", ")}]`,
        numSubvectors: String(numSubvectors),
        subvectorDim: String(subvectorDim),
        status: "Initialized",
      },
    },
    variables: { numSubvectors, subvectorDim },
  });

  const codes: number[] = [];

  for (let m = 0; m < numSubvectors; m++) {
    const subvec = vector.slice(m * subvectorDim, (m + 1) * subvectorDim);
    let bestCode = -1;
    let minDSq = Infinity;

    for (let k = 0; k < codebooks[m].length; k++) {
      const cent = codebooks[m][k];
      const dSq = l2DistSq(subvec, cent);
      if (dSq < minDSq) {
        minDSq = dSq;
        bestCode = k;
      }
    }

    codes.push(bestCode);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 14,
      explanation: {
        what: `Quantize Subvector ${m} [${subvec.join(", ")}] -> Assigned Centroid ${bestCode}`,
        why: `Subvector ${m} matches closest codebook centroid ${bestCode} [${codebooks[m][
          bestCode
        ].join(", ")}] (squared dist = ${minDSq.toFixed(3)}). Assigned code index ${bestCode}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: vector.map((v, idx) => {
          const isSub = Math.floor(idx / subvectorDim) === m;
          return {
            id: `v-${idx}`,
            value: v,
            label: `x[${idx}]`,
            state: isSub
              ? ("active" as ElementState)
              : Math.floor(idx / subvectorDim) < m
                ? ("visited" as ElementState)
                : ("default" as ElementState),
            pointers: isSub ? [`Code ${bestCode}`] : [],
          };
        }),
      },
      auxiliaryState: {
        customState: {
          activeSubvector: `Subvector ${m} [${subvec.join(", ")}]`,
          assignedCentroid: `Centroid ${bestCode} [${codebooks[m][bestCode].join(", ")}]`,
          minSquaredDist: minDSq.toFixed(3),
          quantizedCodesSoFar: `[${codes.join(", ")}]`,
        },
      },
      variables: { subvector: m, code: bestCode, minDSq: Math.round(minDSq * 100) / 100 },
    });
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 20,
    explanation: {
      what: `Product Quantization Complete: Compressed Code [${codes.join(", ")}]`,
      why: `Vector [${vector.join(", ")}] encoded into ${codes.length}-byte discrete code array [${codes.join(
        ", ",
      )}]. Storage compressed from float32 array to byte indices.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: codes.map((c, idx) => ({
        id: `code-${idx}`,
        value: c,
        label: `Subvector ${idx} Code: ${c}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        compressedCodes: `[${codes.join(", ")}]`,
        originalVector: `[${vector.join(", ")}]`,
        status: "Completed",
      },
    },
    variables: { codes: codes.join(", "), complete: true },
  });

  return steps;
};

export const subvectorDecompositionCodebook: AlgorithmDefinition<SubvectorDecompositionCodebookInput> =
  {
    id: "subvectorDecompositionCodebook",
    title: "Product Quantization Subvector Decomposition & Codebook Encoding",
    category: "ml_vector_search",
    categories: ["ml_vector_search", "ml_precision_quantization"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_vector_search",
    description:
      "Product Quantization (PQ, Jegou et al. 2011) vector encoding engine. Splits a high-dimensional vector x in R^D into M lower-dimensional subvectors in R^(D/M). Maps each subvector to its nearest codebook centroid, compressing a floating-point vector into M 1-byte integer codebook indices.\n\nInput Format:\n- vector: Continuous floating-point vector of dimension D.\n- subvectorDim: Dimension d_sub = D / M of each subvector.\n- codebooks: M subvector codebooks containing K_sub centroids.\n\nOutput Format:\n- Returns array of M quantized integer code indices `[c_0, c_1, ..., c_{M-1}]`.\n\nEdge Cases & Constraints:\n- subvectorDim must evenly divide vector length D.",
    constraints: [
      "vector.length % subvectorDim == 0.",
      "codebooks.length == vector.length / subvectorDim.",
    ],
    examples: [
      {
        kind: "basic",
        title: "Quantizing 4-Dim Vector into 2 Codes",
        inputDisplay: "vector = [1.2, 0.8, -0.4, 0.6], d_sub = 2",
        outputDisplay: "Quantized Code Array: [0, 0]",
        input: DEFAULT_SUBVECTOR_DECOMPOSITION_INPUT,
        output: "[0, 0]",
        explanation:
          "Subvector 0 [1.2, 0.8] maps to Centroid 0 [1.0, 1.0]. Subvector 1 [-0.4, 0.6] maps to Centroid 0 [0.0, 0.5].",
      },
      {
        kind: "complex",
        title: "Negative Subvector Matching Centroid 1",
        inputDisplay: "vector = [0.0, 0.0, -0.5, 0.5]",
        outputDisplay: "Quantized Code Array: [1, 1]",
        input: {
          ...DEFAULT_SUBVECTOR_DECOMPOSITION_INPUT,
          vector: [0.0, 0.0, -0.5, 0.5],
        },
        output: "[1, 1]",
        explanation:
          "Subvector 0 matches [0.0, 0.0] (code 1), Subvector 1 matches [-0.5, 0.5] (code 1).",
      },
      {
        kind: "negative",
        title: "Exact Centroid Coordinates Input",
        inputDisplay: "vector identical to centroids [1.0, 1.0, 0.0, 0.5]",
        outputDisplay: "Quantized Code Array: [0, 0] (zero error)",
        input: {
          ...DEFAULT_SUBVECTOR_DECOMPOSITION_INPUT,
          vector: [1.0, 1.0, 0.0, 0.5],
        },
        output: "[0, 0]",
        explanation: "Zero quantization distortion error.",
      },
    ],
    defaultInput: DEFAULT_SUBVECTOR_DECOMPOSITION_INPUT,
    code: SUBVECTOR_DECOMPOSITION_CODE,
    timeComplexity: {
      best: "O(M * K_sub * d_sub)",
      average: "O(M * K_sub * d_sub)",
      worst: "O(M * K_sub * d_sub)",
    },
    spaceComplexity: "O(M)",
    complexityAnalysis: {
      time: "O(M * K_sub * d_sub) where M is subvector count, K_sub is centroid count per codebook (usually 256), and d_sub is subvector dimension.",
      space: "O(M) auxiliary space to store output byte codes.",
    },
    topicGuide: {
      overview:
        "Product Quantization (PQ) is the core vector compression technique used in FAISS, ScaNN, and Milvus. By dividing vector spaces into Cartesian product subspaces R^D = R^d1 x R^d2 x ... x R^dM, PQ reduces a 1536-dimensional float32 vector (6144 bytes) down to a 64-byte integer array (99% memory compression).",
      sections: [
        {
          heading: "Core Concept & Cartesian Decomposition",
          body: "The vector space R^D is decomposed into M orthogonal subspaces. Independent K-Means clustering is run on each subspace to generate codebook centroids C_m.",
        },
        {
          heading: "Quantization Distortion Error",
          body: "Distortion error is defined as E[||x - q(x)||^2] = sum_{m=1}^M ||x_m - C_m[c_m]||^2. Increasing subvector count M or centroid count K_sub decreases quantization error.",
        },
        {
          heading: "Systems & Memory Alignment",
          body: "Using K_sub = 256 allows each code index to fit into exactly 1 byte (`uint8_t`), enabling tight memory packing and SIMD byte shuffle lookups.",
        },
      ],
      keyTerms: [
        {
          term: "Product Quantization (PQ)",
          definition:
            "Vector quantization scheme decomposing vector space into Cartesian product sub-quantizers.",
        },
        {
          term: "Codebook / Sub-Centroid",
          definition: "Set of representative vectors trained via K-Means on a subvector space.",
        },
        {
          term: "Quantization Distortion",
          definition:
            "Squared L2 error introduced by approximating a continuous vector with its codebook centroid.",
        },
      ],
    },
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label: "Product Quantization (Jegou et al. IEEE TPAMI 2011)",
      },
    ],
    generateSteps: generateSubvectorDecompositionSteps,
  };
