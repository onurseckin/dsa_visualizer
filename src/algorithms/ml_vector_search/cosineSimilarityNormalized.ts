import {
  AlgorithmDefinition,
  AlgorithmStep,
  VectorVisualSnapshot,
  VectorItem,
} from "../../types/dsa";

export interface CosineSimilarityNormalizedInput {
  query: number[];
  database: number[][];
}

export const DEFAULT_COSINE_SIMILARITY_NORMALIZED_INPUT: CosineSimilarityNormalizedInput = {
  query: [0.6, 0.8],
  database: [
    [0.6, 0.8],
    [0.8, 0.6],
    [-0.6, 0.8],
    [1.0, 0.0],
    [0.0, 1.0],
  ],
};

export const COSINE_SIMILARITY_NORMALIZED_CODE = `import math

def cosine_similarity_normalized(query: list[float], database: list[list[float]]) -> list[tuple[int, float]]:
    results = []
    for idx, vec in enumerate(database):
        dot_product = sum(q * v for q, v in zip(query, vec))
        results.append((idx, round(dot_product, 4)))
    
    results.sort(key=lambda x: x[1], reverse=True)
    return results`;

function makeVectorSnapshot(
  query: number[],
  database: number[][],
  currentIdx: number | null,
  computedScores: { idx: number; dotProduct: number }[],
  planeTitle?: string,
  highlightTopMatch: boolean = false,
): VectorVisualSnapshot {
  const is3D = query.length === 3;
  const vectors: VectorItem[] = [
    {
      id: "query",
      label: `Query [${query.join(", ")}]`,
      x: query[0] ?? 0,
      y: query[1] ?? 0,
      z: is3D ? query[2] : undefined,
      color: "#ef4444",
      state: "active",
      subText: "Query Vector (||q|| = 1.0)",
    },
  ];

  const sortedByScore = [...computedScores].sort((a, b) => b.dotProduct - a.dotProduct);
  const topIdx = sortedByScore.length > 0 ? sortedByScore[0].idx : null;

  database.forEach((vec, idx) => {
    let state: "default" | "active" | "compared" | "result" | "inactive" = "default";
    let color = "#3b82f6";
    let subText = `V${idx} [${vec.join(", ")}]`;

    const foundScore = computedScores.find((s) => s.idx === idx);

    if (highlightTopMatch && idx === topIdx) {
      state = "result";
      color = "#10b981";
      subText = `Rank 1: V${idx} (sim: ${foundScore?.dotProduct.toFixed(4)})`;
    } else if (idx === currentIdx) {
      state = "active";
      color = "#f59e0b";
      if (foundScore !== undefined) {
        subText = `Active V${idx} (dot = ${foundScore.dotProduct.toFixed(4)})`;
      }
    } else if (foundScore !== undefined) {
      state = "compared";
      color = "#64748b";
      subText = `V${idx} (sim: ${foundScore.dotProduct.toFixed(4)})`;
    }

    vectors.push({
      id: `v-${idx}`,
      label: `V${idx}`,
      x: vec[0] ?? 0,
      y: vec[1] ?? 0,
      z: is3D ? vec[2] : undefined,
      color,
      state,
      subText,
    });
  });

  return {
    kind: "vector",
    vectors,
    dimensions: is3D ? "3d" : "2d",
    planeTitle: planeTitle ?? "Normalized Embedding Unit Vector Space",
  };
}

export const generateCosineSimilarityNormalizedSteps = (
  input: CosineSimilarityNormalizedInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { query, database } = input;
  let stepIndex = 0;

  // Step 0: Initialization (Line 4)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize Similarity Results List",
      why: `Preparing empty list results = [] to store pairwise (vector_index, cosine_similarity) tuples for ${database.length} pre-normalized candidate vectors against Query [${query.join(
        ", ",
      )}].`,
    },
    primarySnapshot: makeVectorSnapshot(
      query,
      database,
      null,
      [],
      "Initial Vector Space: Pre-Normalized Query & Database Vectors",
    ),
    auxiliaryState: {
      customState: {
        queryVector: `[${query.join(", ")}]`,
        databaseCount: String(database.length),
        status: "Initialized",
        results: "[]",
      },
    },
    variables: { query: query.join(", "), databaseSize: database.length },
  });

  const scores: { idx: number; dotProduct: number }[] = [];

  for (let i = 0; i < database.length; i++) {
    const vec = database[i];
    let dotProduct = 0;
    const products: string[] = [];

    for (let d = 0; d < query.length; d++) {
      const prod = query[d] * vec[d];
      dotProduct += prod;
      products.push(`${query[d]} * ${vec[d]} = ${prod.toFixed(4)}`);
    }

    dotProduct = Math.round(dotProduct * 10000) / 10000;

    // Line 6: Compute dot product
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Compute Dot Product for Candidate Vector V${i}`,
        why: `Because vectors are pre-normalized to unit L2 length (||q|| = 1, ||v|| = 1), cosine similarity equals dot product q · v: (${products.join(
          " + ",
        )}) = ${dotProduct.toFixed(4)}.`,
      },
      primarySnapshot: makeVectorSnapshot(
        query,
        database,
        i,
        scores,
        `Computing Dot Product for Candidate V${i}`,
      ),
      auxiliaryState: {
        customState: {
          activeVector: `V${i} [${vec.join(", ")}]`,
          dotProductSum: dotProduct.toFixed(4),
          elementwiseProducts: products.join(" + "),
          status: `Evaluating V${i}`,
        },
      },
      variables: { idx: i, vector: vec.join(", "), dotProduct },
    });

    scores.push({ idx: i, dotProduct });

    // Line 7: Append tuple to results
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Append Candidate V${i} Score (${dotProduct.toFixed(4)}) to Results`,
        why: `Recorded tuple (V${i}, ${dotProduct.toFixed(4)}) into candidate similarity results list.`,
      },
      primarySnapshot: makeVectorSnapshot(
        query,
        database,
        i,
        scores,
        `Appended Candidate V${i} Score to Results`,
      ),
      auxiliaryState: {
        customState: {
          activeVector: `V${i}`,
          dotProduct: dotProduct.toFixed(4),
          totalEvaluated: String(scores.length),
          results: scores.map((s) => `(V${s.idx}, ${s.dotProduct})`).join(", "),
        },
      },
      variables: { idx: i, similarityScore: dotProduct, resultsCount: scores.length },
    });
  }

  // Line 9: Sort candidates by score descending
  const sortedScores = [...scores].sort((a, b) => b.dotProduct - a.dotProduct);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: "Sort Candidate Vectors by Descending Similarity Score",
      why: `Sorted all candidate similarity tuples in descending order. Top nearest neighbor is candidate V${
        sortedScores[0].idx
      } with cosine similarity ${sortedScores[0].dotProduct.toFixed(4)}.`,
    },
    primarySnapshot: makeVectorSnapshot(
      query,
      database,
      null,
      scores,
      "Sorted Candidates by Cosine Similarity",
      true,
    ),
    auxiliaryState: {
      customState: {
        topMatch: `V${sortedScores[0].idx}`,
        topScore: sortedScores[0].dotProduct.toFixed(4),
        ranking: sortedScores
          .map((s, r) => `#${r + 1}: V${s.idx} (sim: ${s.dotProduct})`)
          .join(" | "),
        status: "Sorted",
      },
    },
    variables: { topMatchIdx: sortedScores[0].idx, topScore: sortedScores[0].dotProduct },
  });

  // Line 10: Return results
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: "Return Ranked Similarity Results",
      why: "Function returns final sorted tuples of (vectorIndex, similarityScore).",
    },
    primarySnapshot: makeVectorSnapshot(
      query,
      database,
      null,
      scores,
      "Final Similarity Rankings Complete",
      true,
    ),
    auxiliaryState: {
      customState: {
        topMatch: `V${sortedScores[0].idx}`,
        topScore: sortedScores[0].dotProduct.toFixed(4),
        status: "Completed",
      },
    },
    variables: { resultsCount: sortedScores.length, topCandidate: sortedScores[0].idx },
  });

  return steps;
};

export const cosineSimilarityNormalized: AlgorithmDefinition<CosineSimilarityNormalizedInput> = {
  id: "cosine-similarity-normalized",
  title: "Cosine Similarity over Normalized Embeddings",
  topicIds: ["ml_vector_search"],
  difficulty: "Easy",
  description:
    "Calculates high-throughput cosine similarity scores between normalized query and database vector embeddings. When vectors are pre-normalized to unit L2 length (||v|| = 1), cosine similarity collapses to exact dot products q · v, eliminating expensive square root and norm divisions during similarity search.\n\nInput Format:\n- query: Unit L2 normalized query embedding vector of dimension D.\n- database: Array of unit L2 normalized candidate embeddings of dimension D.\n\nOutput Format:\n- Returns sorted list of tuples (vectorIndex, similarityScore) in descending order of similarity.\n\nEdge Cases & Constraints:\n- Zero vector input: Triggers norm division safeguard if unnormalized.\n- Orthogonal vectors: Produces dot product = 0.0.\n- Diametrically opposed vectors: Produces dot product = -1.0.",
  constraints: [
    "All input vectors must have identical dimensionality D.",
    "Vectors should be pre-normalized to ||v|| = 1.0.",
  ],
  examples: [
    {
      kind: "basic",
      title: "Identical Vector Perfect Match",
      inputDisplay: "query = [0.6, 0.8], V0 = [0.6, 0.8]",
      outputDisplay: "Score: 1.0000",
      input: DEFAULT_COSINE_SIMILARITY_NORMALIZED_INPUT,
      output: "V0 score = 1.0000",
      explanation: "Vector V0 is identical to query, yielding dot product 0.36 + 0.64 = 1.0000.",
    },
    {
      kind: "complex",
      title: "Orthogonal Vector Zero Similarity",
      inputDisplay: "query = [0.6, 0.8], V4 = [0.0, 1.0]",
      outputDisplay: "Score: 0.8000",
      input: {
        query: [0.6, 0.8],
        database: [
          [-0.8, 0.6],
          [0.0, 1.0],
        ],
      },
      output: "V1 score = 0.8000",
      explanation: "V4 dot product is 0.6*0.0 + 0.8*1.0 = 0.8000.",
    },
    {
      kind: "negative",
      title: "Opposite Direction Vector",
      inputDisplay: "query = [0.6, 0.8], V2 = [-0.6, -0.8]",
      outputDisplay: "Score: -1.0000",
      input: {
        query: [0.6, 0.8],
        database: [[-0.6, -0.8]],
      },
      output: "Score: -1.0000",
      explanation: "Opposite directional vectors result in similarity score of -1.0000.",
    },
  ],
  defaultInput: DEFAULT_COSINE_SIMILARITY_NORMALIZED_INPUT,
  code: COSINE_SIMILARITY_NORMALIZED_CODE,
  timeComplexity: {
    best: "O(N * D)",
    average: "O(N * D)",
    worst: "O(N * D)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N * D) for N database vectors of dimension D, as computing each dot product takes D floating-point additions/multiplications.",
    space: "O(N) auxiliary space to store candidate similarity scores for sorting.",
  },
  topicGuide: {
    overview:
      "Cosine similarity measures the cosine of the angle between two multi-dimensional vectors. In deep learning applications like LLM embeddings (OpenAI text-embedding-3, BERT, Cohere), unit normalization (L2 norm = 1.0) is performed offline during index construction. This transforms cosine similarity into simple matrix-vector dot products (GEMV), enabling massive parallel speedups via GPU Tensor Cores.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Standard cosine similarity is defined as cos(theta) = (A . B) / (||A||_2 * ||B||_2). When ||A||_2 = 1 and ||B||_2 = 1, the denominator equals 1.0, simplifying the expression to cos(theta) = sum_{i=1}^D A_i * B_i.",
      },
      {
        heading: "Systems & Performance Impact",
        body: "Pre-normalizing vectors converts unstructured norm-divided distance calculations into BLAS Level 2/3 matrix operations (GEMV / GEMM). Modern GPU accelerators (NVIDIA H100/A100) achieve near peak TFLOPS on normalized matrix multiplications, whereas unnormalized similarity requires extra register allocation for norm accumulation.",
      },
      {
        heading: "Implementation Nuances & Fused Kernels",
        body: "To maximize cache throughput, query vectors are broadcast across SIMD registers. In C++/CUDA, FP16/BF16 dot products leverage intrinsic operations (`__hfma2`) to evaluate two dimensions per clock cycle while maintaining float32 accumulation.",
      },
    ],
    keyTerms: [
      {
        term: "Cosine Distance",
        definition:
          "Defined as 1.0 - Cosine Similarity, transforming similarity scores into metric distances.",
      },
      {
        term: "Unit L2 Normalization",
        definition:
          "Scaling a vector by 1 / sqrt(sum(v_i^2)) so its total Euclidean length equals 1.0.",
      },
      {
        term: "GEMV (Matrix-Vector Multiply)",
        definition: "A BLAS Level 2 routine computing Y = alpha * A * X + beta * Y.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Vector Search Primitives" }],
  generateSteps: generateCosineSimilarityNormalizedSteps,
};
