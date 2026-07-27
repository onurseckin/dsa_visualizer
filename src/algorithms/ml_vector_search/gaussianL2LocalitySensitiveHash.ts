import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

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
    """
    Computes p-stable Gaussian L2 Locality-Sensitive Hash (LSH) bucket keys.
    h_{a,b}(v) = floor((a . v + b) / W)
    where 'a' is a Gaussian projection vector, 'b' is a random offset in [0, W), and W is bin width.
    """
    hash_keys = []
    for idx, (a, b) in enumerate(zip(projection_vectors, offsets)):
        # Compute dot product (a . v)
        dot_product = sum(ai * vi for ai, vi in zip(a, vector))
        # Compute scalar projection with offset
        projected_val = dot_product + b
        # Quantize into bin index
        bin_idx = math.floor(projected_val / bin_width)
        hash_keys.append(bin_idx)

    return hash_keys`;

export const generateGaussianL2LshSteps = (
  input: GaussianL2LocalitySensitiveHashInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { vector, projectionVectors, offsets, binWidth } = input;
  let stepIndex = 0;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize Gaussian L2 Locality-Sensitive Hash (LSH)",
      why: `Hashing vector [${vector.join(", ")}] across ${projectionVectors.length} random Gaussian projections with bin width W = ${binWidth}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: projectionVectors.map((a, idx) => ({
        id: `proj-${idx}`,
        value: idx,
        label: `Func ${idx}: a=[${a.join(",")}], b=${offsets[idx]}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        inputVector: `[${vector.join(", ")}]`,
        binWidth: String(binWidth),
        funcCount: String(projectionVectors.length),
        status: "Initialized",
      },
    },
    variables: { binWidth, funcCount: projectionVectors.length },
  });

  const hashKeys: number[] = [];

  for (let i = 0; i < projectionVectors.length; i++) {
    const a = projectionVectors[i];
    const b = offsets[i];

    const dotProduct = a.reduce((acc, ai, d) => acc + ai * vector[d], 0);
    const projVal = dotProduct + b;
    const binIdx = Math.floor(projVal / binWidth);
    hashKeys.push(binIdx);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Evaluate Hash Function h_${i}(v)`,
        why: `Dot product (a . v) = ${dotProduct.toFixed(3)}. Adding offset b=${b} yields ${projVal.toFixed(
          3,
        )}. Dividing by W=${binWidth} and flooring gives bin index ${binIdx}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: projectionVectors.map((_, idx) => ({
          id: `proj-${idx}`,
          value: idx === i ? binIdx : idx < i ? hashKeys[idx] : idx,
          label: `h_${idx}: bin ${idx <= i ? (hashKeys[idx] ?? binIdx) : "?"}`,
          state:
            idx === i
              ? ("active" as ElementState)
              : idx < i
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === i ? [`bin=${binIdx}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          activeFunc: `h_${i}`,
          dotProduct: dotProduct.toFixed(3),
          projValWithOffset: projVal.toFixed(3),
          binIndex: String(binIdx),
          formula: `floor((${dotProduct.toFixed(3)} + ${b}) / ${binWidth}) = ${binIdx}`,
        },
      },
      variables: { i, dotProduct: Math.round(dotProduct * 100) / 100, binIdx },
    });
  }

  // Step Final: Hash Composite Key Constructed
  const compositeKey = hashKeys.join("-");

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `LSH Key Construction Complete: [${hashKeys.join(", ")}]`,
      why: `Composite LSH hash bucket key string: "${compositeKey}". Vectors with close Euclidean distances collisionally map to the same key.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: hashKeys.map((k, idx) => ({
        id: `key-${idx}`,
        value: k,
        label: `h_${idx} = ${k}`,
        state: "sorted" as ElementState,
        pointers: idx === 0 ? [`Key: "${compositeKey}"`] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        hashKeys: `[${hashKeys.join(", ")}]`,
        compositeKey,
        status: "Completed",
      },
    },
    variables: { compositeKey, complete: true },
  });

  return steps;
};

export const gaussianL2LocalitySensitiveHash: AlgorithmDefinition<GaussianL2LocalitySensitiveHashInput> =
  {
    id: "gaussianL2LocalitySensitiveHash",
    title: "Gaussian L2 Locality-Sensitive Hashing (p-Stable LSH)",
    category: "ml_vector_search",
    categories: ["ml_vector_search"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_vector_search",
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
