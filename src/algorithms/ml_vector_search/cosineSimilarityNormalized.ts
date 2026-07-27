import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

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
    """
    Computes cosine similarity dot products between pre-normalized query and database vectors.
    Since vectors are unit L2 normalized (||v|| = 1), cosine_sim(q, v) = q . v.
    """
    results = []
    for idx, vec in enumerate(database):
        # Compute dot product sum(q_i * v_i)
        dot_product = sum(q * v for q, v in zip(query, vec))
        results.append((idx, round(dot_product, 4)))
    
    # Sort candidates by descending similarity score
    results.sort(key=lambda x: x[1], reverse=True)
    return results`;

export const generateCosineSimilarityNormalizedSteps = (
  input: CosineSimilarityNormalizedInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { query, database } = input;
  let stepIndex = 0;

  // Step 0: Initialization
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: "Initialize Normalized Cosine Similarity Engine",
      why: `Preparing to compute cosine similarities for query vector [${query.join(
        ", ",
      )}] against ${database.length} pre-normalized database vectors.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: database.map((vec, idx) => ({
        id: `v-${idx}`,
        value: Number(idx),
        label: `V${idx} [${vec.join(",")}]`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        queryVector: `[${query.join(", ")}]`,
        databaseCount: String(database.length),
        status: "Initialized",
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
      products.push(`${query[d]} * ${vec[d]} = ${prod.toFixed(2)}`);
    }

    dotProduct = Math.round(dotProduct * 10000) / 10000;
    scores.push({ idx: i, dotProduct });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Compute dot product for Vector V${i} [${vec.join(", ")}]`,
        why: `Dot product sum: (${products.join(" + ")}) = ${dotProduct.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: database.map((_, idx) => ({
          id: `v-${idx}`,
          value: idx === i ? Math.round(dotProduct * 100) : idx,
          label: `V${idx} (sim: ${idx <= i ? (scores[idx]?.dotProduct ?? 0).toFixed(2) : "?"})`,
          state:
            idx === i
              ? ("active" as ElementState)
              : idx < i
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === i ? [`dot=${dotProduct.toFixed(4)}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          activeVector: `V${i} [${vec.join(", ")}]`,
          dotProduct: dotProduct.toFixed(4),
          products: products.join(" + "),
        },
      },
      variables: { i, vector: vec.join(", "), dotProduct },
    });
  }

  // Step: Sorting by score
  const sortedScores = [...scores].sort((a, b) => b.dotProduct - a.dotProduct);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 15,
    explanation: {
      what: "Sort Candidate Vectors by Descending Cosine Similarity",
      why: `Top match is V${sortedScores[0].idx} with cosine similarity score ${sortedScores[0].dotProduct.toFixed(
        4,
      )}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: sortedScores.map((item, rank) => ({
        id: `v-${item.idx}`,
        value: Math.round(item.dotProduct * 100),
        label: `Rank ${rank + 1}: V${item.idx} (sim: ${item.dotProduct.toFixed(4)})`,
        state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
        pointers: rank === 0 ? ["Top Candidate"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        topMatch: `V${sortedScores[0].idx}`,
        topScore: sortedScores[0].dotProduct.toFixed(4),
        ranking: sortedScores.map((s, r) => `#${r + 1}: V${s.idx} (${s.dotProduct})`).join(" | "),
        status: "Completed",
      },
    },
    variables: { topMatchIdx: sortedScores[0].idx, topScore: sortedScores[0].dotProduct },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: "Return Ranked Candidate Similarity Results",
      why: "Function returns final sorted tuples of (vectorIndex, similarityScore).",
    },
    primarySnapshot: {
      kind: "array",
      elements: sortedScores.map((item, rank) => ({
        id: `v-${item.idx}`,
        value: Math.round(item.dotProduct * 100),
        label: `Rank ${rank + 1}: V${item.idx} (${item.dotProduct.toFixed(4)})`,
        state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
        pointers: rank === 0 ? ["Top Match"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        status: "Completed",
      },
    },
    variables: { results: sortedScores },
  });

  return steps;
};

export const cosineSimilarityNormalized: AlgorithmDefinition<CosineSimilarityNormalizedInput> = {
  id: "cosineSimilarityNormalized",
  title: "Cosine Similarity over Normalized Embeddings",
  category: "ml_vector_search",
  categories: ["ml_vector_search"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_vector_search",
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
