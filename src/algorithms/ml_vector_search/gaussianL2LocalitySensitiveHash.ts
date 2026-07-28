import {
  AlgorithmDefinition,
  AlgorithmStep,
  VectorItem,
  VectorVisualSnapshot,
} from "../../types/dsa";

export interface GaussianL2LocalitySensitiveHashInput {
  vector: number[];
  projectionVectors: number[][];
  offsets: number[];
  binWidth: number;
}

export const DEFAULT_GAUSSIAN_L2_LSH_INPUT: GaussianL2LocalitySensitiveHashInput = {
  vector: [2.5, 1.2],
  projectionVectors: [
    [0.8, -0.6],
    [0.5, 0.5],
    [-0.2, 0.9],
  ],
  offsets: [1.2, 0.5, 2.0],
  binWidth: 2.0,
};

export const GAUSSIAN_L2_LSH_CODE = `import math

def gaussian_l2_lsh(vector: list[float], projection_vectors: list[list[float]], offsets: list[float], bin_width: float) -> list[int]:
    hash_keys = []
    for idx, (a, b) in enumerate(zip(projection_vectors, offsets)):
        dot_product = sum(ai * vi for ai, vi in zip(a, vector))
        projected_val = dot_product + b
        bin_idx = math.floor(projected_val / bin_width)
        hash_keys.append(bin_idx)

    return hash_keys`;

const createVectorSnapshot = (
  vector: number[],
  projectionVectors: number[][],
  offsets: number[],
  hashKeys: number[],
  activeIndex?: number,
  activeStage?: "select" | "dot" | "offset" | "quantize" | "append" | "done",
): VectorVisualSnapshot => {
  const vectors: VectorItem[] = [];

  // Query vector
  vectors.push({
    id: "query-v",
    label: `v = [${vector.join(", ")}]`,
    x: vector[0] ?? 0,
    y: vector[1] ?? 0,
    color: "#ec4899",
    state: activeStage === "done" ? "result" : "active",
    subText: "Query Vector",
  });

  // Projection vectors
  projectionVectors.forEach((a, idx) => {
    let state: VectorItem["state"] = "default";
    let color: string | undefined = undefined;

    if (activeIndex === idx) {
      if (activeStage === "append") {
        state = "result";
        color = "#10b981";
      } else {
        state = "active";
        color = "#f59e0b";
      }
    } else if (idx < hashKeys.length) {
      state = "compared";
      color = "#3b82f6";
    } else {
      state = "default";
      color = "#6b7280";
    }

    const keyVal =
      hashKeys[idx] !== undefined
        ? `bin = ${hashKeys[idx]}`
        : activeIndex === idx && activeStage === "quantize"
          ? "bin ?"
          : `b = ${offsets[idx]}`;

    vectors.push({
      id: `proj-${idx}`,
      label: `a_${idx} = [${a.join(", ")}]`,
      x: a[0] ?? 0,
      y: a[1] ?? 0,
      color,
      state,
      subText: `h_${idx}: ${keyVal}`,
    });
  });

  return {
    kind: "vector",
    vectors,
    planeTitle: "Gaussian L2 LSH Projection Space",
    dimensions: "2d",
  };
};

export const generateGaussianL2LshSteps = (
  input: GaussianL2LocalitySensitiveHashInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { vector, projectionVectors, offsets, binWidth } = input;
  let stepIndex = 0;
  const hashKeys: number[] = [];

  // Line 4: hash_keys = []
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize empty hash_keys list",
      why: `Preparing to compute ${projectionVectors.length} p-stable Gaussian L2 hash functions for query vector v = [${vector.join(", ")}] with bin width W = ${binWidth}.`,
    },
    primarySnapshot: createVectorSnapshot(vector, projectionVectors, offsets, hashKeys),
    auxiliaryState: {
      customState: {
        queryVector: `[${vector.join(", ")}]`,
        binWidth: String(binWidth),
        numProjections: String(projectionVectors.length),
        hashKeys: "[]",
        status: "Initialized",
      },
    },
    variables: { hash_keys: "[]", bin_width: binWidth },
  });

  for (let i = 0; i < projectionVectors.length; i++) {
    const a = projectionVectors[i];
    const b = offsets[i];

    // Line 5: for idx, (a, b) in enumerate(zip(projection_vectors, offsets)):
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Select projection function h_${i} (a_${i} and offset b_${i})`,
        why: `Function h_${i} uses projection vector a_${i} = [${a.join(", ")}] sampled from Gaussian N(0, I) and uniform offset b_${i} = ${b} in range [0, ${binWidth}).`,
      },
      primarySnapshot: createVectorSnapshot(
        vector,
        projectionVectors,
        offsets,
        hashKeys,
        i,
        "select",
      ),
      auxiliaryState: {
        customState: {
          activeFunction: `h_${i}`,
          projectionVector: `[${a.join(", ")}]`,
          offset: String(b),
          hashKeys: `[${hashKeys.join(", ")}]`,
        },
      },
      variables: { idx: i, a: `[${a.join(", ")}]`, b },
    });

    // Line 6: dot_product = sum(ai * vi for ai, vi in zip(a, vector))
    const dotProduct = a.reduce((acc, ai, d) => acc + ai * (vector[d] ?? 0), 0);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Compute dot product (a_${i} · v) = ${dotProduct.toFixed(3)}`,
        why: `Calculated sum of products: ${a.map((ai, d) => `(${ai} * ${vector[d] ?? 0})`).join(" + ")} = ${dotProduct.toFixed(3)}. Projects continuous space vector v onto random vector a_${i}.`,
      },
      primarySnapshot: createVectorSnapshot(vector, projectionVectors, offsets, hashKeys, i, "dot"),
      auxiliaryState: {
        customState: {
          activeFunction: `h_${i}`,
          dotProduct: dotProduct.toFixed(3),
          formula: `a_${i} · v = ${dotProduct.toFixed(3)}`,
        },
      },
      variables: { idx: i, dot_product: Math.round(dotProduct * 1000) / 1000 },
    });

    // Line 7: projected_val = dot_product + b
    const projVal = dotProduct + b;
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Add random offset b_${i}: ${dotProduct.toFixed(3)} + ${b} = ${projVal.toFixed(3)}`,
        why: `Uniform random shift b_${i} = ${b} ensures the continuous L2 collision probability p(d) remains invariant under coordinate translations.`,
      },
      primarySnapshot: createVectorSnapshot(
        vector,
        projectionVectors,
        offsets,
        hashKeys,
        i,
        "offset",
      ),
      auxiliaryState: {
        customState: {
          activeFunction: `h_${i}`,
          dotProduct: dotProduct.toFixed(3),
          offset: String(b),
          projected_val: projVal.toFixed(3),
          formula: `${dotProduct.toFixed(3)} + ${b} = ${projVal.toFixed(3)}`,
        },
      },
      variables: { idx: i, projected_val: Math.round(projVal * 1000) / 1000 },
    });

    // Line 8: bin_idx = math.floor(projected_val / bin_width)
    const binIdx = Math.floor(projVal / binWidth);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: `Quantize into integer bin index: floor(${projVal.toFixed(3)} / ${binWidth}) = ${binIdx}`,
        why: `Dividing projected scalar value by bin width W = ${binWidth} and taking floor yields integer bin index ${binIdx}.`,
      },
      primarySnapshot: createVectorSnapshot(
        vector,
        projectionVectors,
        offsets,
        hashKeys,
        i,
        "quantize",
      ),
      auxiliaryState: {
        customState: {
          activeFunction: `h_${i}`,
          projected_val: projVal.toFixed(3),
          binWidth: String(binWidth),
          bin_idx: String(binIdx),
          formula: `floor(${projVal.toFixed(3)} / ${binWidth}) = ${binIdx}`,
        },
      },
      variables: { idx: i, bin_idx: binIdx },
    });

    // Line 9: hash_keys.append(bin_idx)
    hashKeys.push(binIdx);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what: `Append bucket index ${binIdx} for h_${i} to hash_keys`,
        why: `Hash function h_${i} produces bin index ${binIdx}. Updated hash_keys: [${hashKeys.join(", ")}].`,
      },
      primarySnapshot: createVectorSnapshot(
        vector,
        projectionVectors,
        offsets,
        hashKeys,
        i,
        "append",
      ),
      auxiliaryState: {
        customState: {
          activeFunction: `h_${i}`,
          bin_idx: String(binIdx),
          hash_keys: `[${hashKeys.join(", ")}]`,
        },
      },
      variables: { idx: i, hash_keys: `[${hashKeys.join(", ")}]` },
    });
  }

  // Line 11: return hash_keys
  const compositeKey = hashKeys.join("-");
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: `Return hash_keys: [${hashKeys.join(", ")}] (Composite key: "${compositeKey}")`,
      why: `All ${projectionVectors.length} hash function indices evaluated. Vector v is assigned to hash bucket key "${compositeKey}". Nearby L2 vectors will collide in the same hash bucket with high probability.`,
    },
    primarySnapshot: createVectorSnapshot(
      vector,
      projectionVectors,
      offsets,
      hashKeys,
      undefined,
      "done",
    ),
    auxiliaryState: {
      customState: {
        hashKeys: `[${hashKeys.join(", ")}]`,
        compositeKey,
        status: "Completed",
      },
    },
    variables: { hash_keys: `[${hashKeys.join(", ")}]`, complete: true },
  });

  return steps;
};

export const gaussianL2LocalitySensitiveHash: AlgorithmDefinition<GaussianL2LocalitySensitiveHashInput> =
  {
    id: "gaussian-l2-locality-sensitive-hash",
    title: "Gaussian L2 Locality-Sensitive Hashing (p-Stable LSH)",
    topicIds: ["ml_vector_search"],
    difficulty: "Medium",
    description:
      "Implements p-stable Gaussian Locality-Sensitive Hashing (LSH) for L2 Euclidean distance spaces. Uses random projections sampled from a standard Gaussian distribution N(0, I) and scalar binning to map high-dimensional vectors into discrete hash bucket keys. Vectors close in Euclidean distance collide in the same hash bucket with high probability.\n\nInput Format:\n- vector: Multi-dimensional query vector of dimension D.\n- projectionVectors: K random vectors sampled from N(0, I).\n- offsets: K random offsets sampled uniformly from [0, binWidth).\n- binWidth: Scalar quantization bin width W.\n\nOutput Format:\n- Returns array of K integer hash bin keys `[h_0, h_1, ..., h_{K-1}]`.\n\nEdge Cases & Constraints:\n- Small binWidth: Decreases collision probability (higher precision, lower recall).\n- Large binWidth: Increases bucket collision size (higher recall, lower filtering efficiency).",
    constraints: [
      "projectionVectors and vector must share dimension D.",
      "binWidth W must be strictly positive (W > 0.0).",
    ],
    examples: [
      {
        kind: "basic",
        title: "Standard 3-Function Hash Generation",
        inputDisplay: "vector = [2.5, 1.2], 3 projections, W = 2.0",
        outputDisplay: "Hash Keys: [1, 1, 1]",
        input: DEFAULT_GAUSSIAN_L2_LSH_INPUT,
        output: "[1, 1, 1]",
        explanation: "Calculates projections and bin divisions for each of the 3 hash functions.",
      },
      {
        kind: "complex",
        title: "Divergent Vector Distant Buckets",
        inputDisplay: "vector = [-10.0, 15.0], same projections",
        outputDisplay: "Hash Keys: [-9, 1, 7]",
        input: {
          ...DEFAULT_GAUSSIAN_L2_LSH_INPUT,
          vector: [-10.0, 15.0],
        },
        output: "[-9, 1, 7]",
        explanation:
          "Distant vector maps to completely different hash bin indices, avoiding hash collision.",
      },
      {
        kind: "negative",
        title: "Zero Vector Bucket Mapping",
        inputDisplay: "vector = [0.0, 0.0], offsets = [1.2, 0.5, 2.0], W = 2.0",
        outputDisplay: "Hash Keys: [0, 0, 1]",
        input: {
          ...DEFAULT_GAUSSIAN_L2_LSH_INPUT,
          vector: [0.0, 0.0],
        },
        output: "[0, 0, 1]",
        explanation: "Zero vector projection simplifies to floor(b / W).",
      },
    ],
    defaultInput: DEFAULT_GAUSSIAN_L2_LSH_INPUT,
    code: GAUSSIAN_L2_LSH_CODE,
    timeComplexity: {
      best: "O(K * D)",
      average: "O(K * D)",
      worst: "O(K * D)",
    },
    spaceComplexity: "O(K)",
    complexityAnalysis: {
      time: "O(K * D) where K is the number of hash functions and D is vector dimension.",
      space: "O(K) auxiliary space to hold generated hash keys.",
    },
    topicGuide: {
      overview:
        "Locality-Sensitive Hashing (LSH) for L2 metrics (Datar et al., 2004) uses p-stable random projections to preserve geometric distances under hash functions. Unlike cryptographic hashing which avoids collisions, LSH maximizes collision probability for spatially near vectors, reducing sub-linear nearest-neighbor search to hash table lookups.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "A 2-stable distribution (Gaussian) guarantees that for vector difference v_1 - v_2, the scalar projection a . (v_1 - v_2) follows a Gaussian distribution with variance ||v_1 - v_2||_2^2. The probability of collision p(d) decreases monotonically with L2 distance d.",
        },
        {
          heading: "Systems & Performance Impact",
          body: "LSH enables sub-linear O(L * K * D + |Bucket|) approximate vector search by filtering non-matching candidates prior to computing costly exact floating-point distances.",
        },
        {
          heading: "Implementation Nuances & Multi-Table AND/OR Logic",
          body: "In production, multiple hash tables (L tables) each containing K hash functions are combined. Concatenating K hash keys forms an AND-construction (increasing precision), while checking across L tables forms an OR-construction (increasing recall).",
        },
      ],
      keyTerms: [
        {
          term: "p-Stable Distribution",
          definition:
            "A probability distribution where linear combinations of random variables maintain the same distribution family.",
        },
        {
          term: "Hash Collision Probability",
          definition: "The likelihood that two vectors map to the exact same discrete hash bin.",
        },
        {
          term: "AND/OR Amplification",
          definition:
            "Combining multiple hash functions and tables to tune the ROC curve of vector retrieval.",
        },
      ],
    },
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "Approximate Nearest Neighbor Theory" }],
    generateSteps: generateGaussianL2LshSteps,
  };
