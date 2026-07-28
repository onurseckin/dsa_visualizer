import {
  AlgorithmDefinition,
  AlgorithmStep,
  VectorVisualSnapshot,
  VectorItem,
  QuantizationVisualSnapshot,
} from "../../types/dsa";

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

  const makeVectorSnapshot = (
    subvectorIdx: number,
    subvec: number[],
    currentK: number | null,
    bestK: number | null,
    title: string,
  ): VectorVisualSnapshot => {
    const vectors: VectorItem[] = [];

    vectors.push({
      id: `subvec-${subvectorIdx}`,
      label: `Subvec ${subvectorIdx}`,
      x: subvec[0] ?? 0,
      y: subvec[1] ?? 0,
      state: "active",
      subText: `[${subvec.map((v) => v.toFixed(2)).join(", ")}]`,
    });

    if (codebooks[subvectorIdx]) {
      codebooks[subvectorIdx].forEach((cent, k) => {
        let state: VectorItem["state"] = "default";
        if (k === currentK) {
          state = "compared";
        } else if (k === bestK) {
          state = "result";
        } else {
          state = "inactive";
        }

        vectors.push({
          id: `cent-${subvectorIdx}-${k}`,
          label: `Centroid ${k}`,
          x: cent[0] ?? 0,
          y: cent[1] ?? 0,
          state,
          subText: `[${cent.map((v) => v.toFixed(2)).join(", ")}]`,
        });
      });
    }

    return {
      kind: "vector",
      planeTitle: title,
      vectors,
    };
  };

  // Step 0: Init
  const initVectors: VectorItem[] = [];
  for (let m = 0; m < numSubvectors; m++) {
    const sv = vector.slice(m * subvectorDim, (m + 1) * subvectorDim);
    initVectors.push({
      id: `init-subvec-${m}`,
      label: `Subvec ${m}`,
      x: sv[0] ?? 0,
      y: sv[1] ?? 0,
      state: "default",
      subText: `[${sv.map((v) => v.toFixed(2)).join(", ")}]`,
    });
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Initialize Product Quantization (PQ) Vector Encoding`,
      why: `Input vector of dim D = ${vector.length} is decomposed into M = ${numSubvectors} subvectors of dimension d_sub = ${subvectorDim}. Initializing empty output array quantized_codes = [].`,
    },
    primarySnapshot: {
      kind: "vector",
      planeTitle: `PQ Vector Subspace Decomposition (D=${vector.length}, M=${numSubvectors})`,
      vectors: initVectors,
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

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Extract Subvector m=${m}: [${subvec.join(", ")}]`,
        why: `Sliced vector indices [${m * subvectorDim} : ${(m + 1) * subvectorDim}]. Preparing to search Codebook ${m} (${codebooks[m]?.length ?? 0} centroids) for nearest match.`,
      },
      primarySnapshot: makeVectorSnapshot(
        m,
        subvec,
        null,
        null,
        `Subspace m=${m}: Extracted Subvector [${subvec.join(", ")}]`,
      ),
      auxiliaryState: {
        customState: {
          activeSubvector: `Subvector ${m} [${subvec.join(", ")}]`,
          bestCode: "None",
          minDistSq: "Infinity",
          codesSoFar: `[${codes.join(", ")}]`,
        },
      },
      variables: { m, subvectorDim },
    });

    for (let k = 0; k < (codebooks[m]?.length ?? 0); k++) {
      const cent = codebooks[m][k];
      const dSq = l2DistSq(subvec, cent);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 16,
        explanation: {
          what: `Compute L2 Distance Sq: Subvector ${m} to Centroid ${k}`,
          why: `Calculated squared distance ||subvec - C_${m}[${k}]||^2 = ${dSq.toFixed(4)} between [${subvec.join(", ")}] and Centroid ${k} [${cent.join(", ")}].`,
        },
        primarySnapshot: makeVectorSnapshot(
          m,
          subvec,
          k,
          bestCode >= 0 ? bestCode : null,
          `Subspace m=${m}: Comparing Centroid ${k} (dist_sq = ${dSq.toFixed(4)})`,
        ),
        auxiliaryState: {
          customState: {
            activeSubvector: `Subvector ${m} [${subvec.join(", ")}]`,
            testingCentroid: `Centroid ${k} [${cent.join(", ")}]`,
            distSq: dSq.toFixed(4),
            currentMinDistSq: minDSq === Infinity ? "inf" : minDSq.toFixed(4),
            bestCode: bestCode >= 0 ? String(bestCode) : "None",
          },
        },
        variables: { m, k_idx: k, dist_sq: Math.round(dSq * 1000) / 1000 },
      });

      if (dSq < minDSq) {
        const prevMin = minDSq;
        minDSq = dSq;
        bestCode = k;

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 18,
          explanation: {
            what: `Found Closer Centroid: Update best_code = ${bestCode} (dist_sq = ${minDSq.toFixed(4)})`,
            why: `Squared distance ${minDSq.toFixed(4)} is strictly less than previous minimum ${prevMin === Infinity ? "infinity" : prevMin.toFixed(4)}. Updated best_code to ${bestCode}.`,
          },
          primarySnapshot: makeVectorSnapshot(
            m,
            subvec,
            null,
            bestCode,
            `Subspace m=${m}: Updated Best Centroid -> Code ${bestCode}`,
          ),
          auxiliaryState: {
            customState: {
              activeSubvector: `Subvector ${m} [${subvec.join(", ")}]`,
              bestCentroid: `Centroid ${bestCode} [${cent.join(", ")}]`,
              minDistSq: minDSq.toFixed(4),
              codesSoFar: `[${codes.join(", ")}]`,
            },
          },
          variables: { m, best_code: bestCode, min_dist_sq: Math.round(minDSq * 1000) / 1000 },
        });
      }
    }

    codes.push(bestCode);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 21,
      explanation: {
        what: `Quantize Subvector ${m} -> Quantized Code Index ${bestCode}`,
        why: `Completed codebook search for subvector ${m}. Assigned discrete byte code ${bestCode}. Appended ${bestCode} to quantized_codes array.`,
      },
      primarySnapshot: makeVectorSnapshot(
        m,
        subvec,
        null,
        bestCode,
        `Subspace m=${m}: Quantized to Code ${bestCode}`,
      ),
      auxiliaryState: {
        customState: {
          quantizedSubvector: `Subvector ${m} -> Code ${bestCode}`,
          quantizedCodesSoFar: `[${codes.join(", ")}]`,
        },
      },
      variables: { m, bestCode, codes: codes.join(", ") },
    });
  }

  const quantizationSnapshot: QuantizationVisualSnapshot = {
    kind: "quantization",
    title: "Product Quantization Complete: Codebook Indices",
    originalValue: `[${vector.join(", ")}]`,
    quantizedValue: `[${codes.join(", ")}]`,
    bits: codes.map((c, idx) => ({
      index: idx,
      label: `Subvec ${idx}`,
      value: `Code ${c}`,
      state: "quantized",
    })),
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 23,
    explanation: {
      what: `Product Quantization Complete: Output Code Array [${codes.join(", ")}]`,
      why: `Continuous ${vector.length}-dim float32 vector compressed into ${codes.length}-element byte index code array [${codes.join(", ")}].`,
    },
    primarySnapshot: quantizationSnapshot,
    auxiliaryState: {
      customState: {
        compressedCodes: `[${codes.join(", ")}]`,
        originalVector: `[${vector.join(", ")}]`,
        compressionRatio: `${(vector.length * 4) / codes.length}x`,
        status: "Completed",
      },
    },
    variables: { codes: codes.join(", "), complete: true },
  });

  return steps;
};

export const subvectorDecompositionCodebook: AlgorithmDefinition<SubvectorDecompositionCodebookInput> =
  {
    id: "subvector-decomposition-codebook",
    title: "Product Quantization Subvector Decomposition & Codebook Encoding",
    topicIds: ["ml_vector_search", "ml_precision_quantization"],
    difficulty: "Medium",
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
