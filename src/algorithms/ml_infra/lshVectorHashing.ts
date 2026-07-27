import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface LshVectorItem {
  id: string;
  values: number[];
}

export interface LshVectorHashingInput {
  vectors: LshVectorItem[];
  hyperplanes: number[][]; // K hyperplanes, each of length d
  query: number[];
}

export const LSH_VECTOR_HASHING_CODE = `def lsh_vector_hashing(vectors: list[dict], hyperplanes: list[list[float]], query: list[float]) -> list[tuple[str, str, int]]:
    # Step 1: Compute query binary hash code
    query_code = ""
    for hp in hyperplanes:
        dot = sum(q * h for q, h in zip(query, hp))
        query_code += "1" if dot >= 0 else "0"
        
    results = []
    # Step 2: Compute LSH code for each candidate vector
    for vec in vectors:
        vid = vec["id"]
        vals = vec["values"]
        v_code = ""
        for hp in hyperplanes:
            dot = sum(v * h for v, h in zip(vals, hp))
            v_code += "1" if dot >= 0 else "0"
            
        # Step 3: Calculate Hamming distance to query hash code
        hamming_dist = sum(1 for qb, vb in zip(query_code, v_code) if qb != vb)
        results.append((vid, v_code, hamming_dist))
        
    # Step 4: Rank candidates by Hamming distance
    results.sort(key=lambda x: x[2])
    return results`;

export const DEFAULT_LSH_VECTOR_HASHING_INPUT: LshVectorHashingInput = {
  vectors: [
    { id: "V0", values: [2.0, 3.0] },
    { id: "V1", values: [-2.0, 4.0] },
    { id: "V2", values: [-3.0, -1.0] },
    { id: "V3", values: [1.5, -2.5] },
  ],
  hyperplanes: [
    [1.0, 0.0], // x = 0 plane
    [0.0, 1.0], // y = 0 plane
  ],
  query: [2.5, 1.5],
};

export const generateLshVectorHashingSteps = (input: LshVectorHashingInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Compute query hash code
  let queryCode = "";
  for (const hp of input.hyperplanes) {
    const dot = input.query.reduce((sum, q, idx) => sum + q * hp[idx], 0);
    queryCode += dot >= 0 ? "1" : "0";
  }

  // Step 1: Query hash computation step
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Compute Query Binary Hash Code`,
      why: `Query [${input.query.join(", ")}] projected onto ${input.hyperplanes.length} hyperplanes yields binary hash code '${queryCode}'.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: input.vectors.map((v) => ({
        id: `vec-${v.id}`,
        value: 0,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      distanceTable: {
        QueryCode: parseInt(queryCode, 2),
      },
    },
    variables: {
      queryCode,
      hyperplanes: input.hyperplanes.length,
    },
  });

  const vectorResults: Array<{ id: string; code: string; hamming: number }> = [];

  for (let i = 0; i < input.vectors.length; i++) {
    const vec = input.vectors[i];
    let vCode = "";
    for (const hp of input.hyperplanes) {
      const dot = vec.values.reduce((sum, v, idx) => sum + v * hp[idx], 0);
      vCode += dot >= 0 ? "1" : "0";
    }

    let hamming = 0;
    for (let b = 0; b < queryCode.length; b++) {
      if (queryCode[b] !== vCode[b]) hamming++;
    }

    vectorResults.push({ id: vec.id, code: vCode, hamming });

    const isMatch = hamming === 0;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Hash Vector ${vec.id}`,
        why: `Projecting ${vec.id} against hyperplanes produces bitstring '${vCode}'. Hamming distance from '${queryCode}' is ${hamming} bit flips${isMatch ? " (Exact Hash Match!)" : ""}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: input.vectors.map((v, idx) => {
          let state: ElementState = "default";
          if (idx === i) state = isMatch ? "sorted" : "active";
          else if (idx < i) state = "visited";
          return {
            id: `vec-${v.id}`,
            value: vectorResults[idx]?.hamming ?? 0,
            state,
          };
        }),
      },
      auxiliaryState: {
        distanceTable: Object.fromEntries(vectorResults.map((r) => [r.id, r.hamming])),
      },
      variables: {
        vectorId: vec.id,
        vCode,
        hamming,
      },
    });
  }

  // Sort by Hamming distance
  const sorted = [...vectorResults].sort((a, b) => a.hamming - b.hamming);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 22,
    explanation: {
      what: `Rank LSH Bucket Candidates`,
      why: `Candidates ranked by Hamming distance: ${sorted.map((s) => `${s.id} (d=${s.hamming})`).join(", ")}. LSH candidates with minimal distance are prioritized for exact evaluation.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: sorted.map((s) => ({
        id: `vec-${s.id}`,
        value: s.hamming,
        state: s.hamming === 0 ? "sorted" : "active",
      })),
    },
    auxiliaryState: {
      distanceTable: Object.fromEntries(sorted.map((r) => [r.id, r.hamming])),
    },
    variables: {
      topCandidate: sorted[0]?.id ?? "",
      minDist: sorted[0]?.hamming ?? 0,
    },
  });

  return steps;
};

const LSH_VECTOR_HASHING_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "query_code += '1' if dot <= 0 else '0'",
    "hamming_dist = sum(1 for qb, vb in zip(query_code, v_code) if qb == vb)",
    "results.sort(key=lambda x: -x[2]) # Sort descending by distance",
  ],
  hints: [
    {
      line: 6,
      hint: "Use the sign of the random hyperplane dot product to set binary hash code bit (1 if dot >= 0 else 0).",
    },
    {
      line: 18,
      hint: "Compute Hamming distance by counting mismatched bit positions between query and vector codes.",
    },
    {
      line: 22,
      hint: "Sort candidate vectors by Hamming distance ascending to rank nearest hash bucket items.",
    },
  ],
  lineExplanations: {
    1: "Defines Locality-Sensitive Hashing candidate retrieval algorithm.",
    6: "Determines query hash code bit from hyperplane dot product sign.",
    18: "Counts bitwise differences (Hamming distance) between binary hash codes.",
    22: "Orders candidate vectors by Hamming distance for ANN query filtering.",
  },
};

export const lshVectorHashing: AlgorithmDefinition<LshVectorHashingInput> = {
  id: "lsh-vector-hashing",
  title: "Locality-Sensitive Hashing (Random Projection LSH)",
  category: "ml_vector_search",
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 4,
  description:
    "Hashes high-dimensional continuous vectors into short binary codes via random hyperplane projections, partitioning space so similar vectors share identical or low-Hamming-distance hash buckets.",
  constraints: [
    "len(vectors) >= 1",
    "len(hyperplanes) >= 1",
    "query dimension matches vector dimensions",
  ],
  examples: [
    {
      kind: "basic",
      title: "2D Random Projection LSH (4 Quadrants)",
      inputDisplay: "4 vectors in 2D, 2 orthogonal hyperplanes, query [2.5, 1.5]",
      outputDisplay: "V0: code 11 (d=0), V1: 01 (d=1), V3: 10 (d=1), V2: 00 (d=2)",
      input: DEFAULT_LSH_VECTOR_HASHING_INPUT,
      output: "V0: code 11 (d=0), V1: 01 (d=1), V3: 10 (d=1), V2: 00 (d=2)",
      explanation:
        "Hyperplanes along coordinate axes partition 2D space into 4 quadrants. Query [2.5, 1.5] lands in quadrant '11'. Vector V0 [2.0, 3.0] matches '11' with Hamming distance 0.",
    },
    {
      kind: "complex",
      title: "3D Multi-Hyperplane Partitioning",
      inputDisplay: "3 hyperplanes, 3D vectors, query [1.0, 1.0, 1.0]",
      outputDisplay: "V0: code 111 (d=0), V1: 101 (d=1), V2: 000 (d=3)",
      input: {
        vectors: [
          { id: "V0", values: [1.0, 2.0, 1.0] },
          { id: "V1", values: [1.0, -1.0, 1.0] },
          { id: "V2", values: [-2.0, -2.0, -2.0] },
        ],
        hyperplanes: [
          [1.0, 0.0, 0.0],
          [0.0, 1.0, 0.0],
          [0.0, 0.0, 1.0],
        ],
        query: [1.0, 1.0, 1.0],
      },
      output: "V0: code 111 (d=0), V1: 101 (d=1), V2: 000 (d=3)",
      explanation:
        "3 orthogonal hyperplanes generate 3-bit hash codes. V0 shares exact code '111', V1 differs by 1 bit, and V2 differs by 3 bits.",
    },
    {
      kind: "negative",
      title: "Opposite Octant Maximum Distance Search",
      inputDisplay: "query [5.0, 5.0], target [-5.0, -5.0]",
      outputDisplay: "V0: code 00 (d=2)",
      input: {
        vectors: [{ id: "V0", values: [-5.0, -5.0] }],
        hyperplanes: [
          [1.0, 0.0],
          [0.0, 1.0],
        ],
        query: [5.0, 5.0],
      },
      output: "V0: code 00 (d=2)",
      explanation:
        "Query in quadrant '11' and vector in quadrant '00' yield maximum possible Hamming distance equal to the number of hyperplanes.",
    },
  ],
  code: LSH_VECTOR_HASHING_CODE,
  timeComplexity: {
    best: "O(K * d)",
    average: "O(N * K * d)",
    worst: "O(N * K * d)",
  },
  spaceComplexity: "O(N * K)",
  complexityAnalysis: {
    time: "Computing K scalar dot products of dimension d for N vectors takes O(N * K * d) time, followed by fast Hamming distance comparisons.",
    space: "Stores K-bit binary hash code for each of the N vectors in dataset.",
  },
  topicGuide: {
    overview:
      "Locality-Sensitive Hashing (LSH) is a foundational probabilistic technique for approximate nearest neighbor search in high dimensions. Unlike cryptographic hashes designed to minimize collisions, LSH intentionally maximizes hash collisions for near-neighbor vectors.",
    sections: [
      {
        heading: "Random Hyperplane Projections",
        body: "Random unit vectors act as hyperplanes splitting space into half-spaces. The sign of the dot product <w, v> indicates which side of the hyperplane vector v resides on.",
      },
      {
        heading: "Hamming Distance & Bucket Filtering",
        body: "Bitwise XOR and population count give the Hamming distance between binary codes, enabling sub-linear ANN candidate filtering prior to exact Euclidean distance computation.",
      },
    ],
    keyTerms: [
      {
        term: "Random Projection",
        definition:
          "Dimension reduction technique multiplying vectors by random normal projection matrices.",
      },
      {
        term: "Hamming Distance",
        definition: "Number of bit positions at which two binary strings of equal length differ.",
      },
    ],
  },
  trivia: LSH_VECTOR_HASHING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_LSH_VECTOR_HASHING_INPUT,
  generateSteps: generateLshVectorHashingSteps,
};
