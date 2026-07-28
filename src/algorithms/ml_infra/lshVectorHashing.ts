import type {
  AlgorithmDefinition,
  AlgorithmStep,
  VectorItem,
  VectorVisualSnapshot,
} from "../../types/dsa";
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
    query_code = ""
    for hp in hyperplanes:
        dot = sum(q * h for q, h in zip(query, hp))
        query_code += "1" if dot >= 0 else "0"
    results = []
    for vec in vectors:
        vid = vec["id"]
        vals = vec["values"]
        v_code = ""
        for hp in hyperplanes:
            dot = sum(v * h for v, h in zip(vals, hp))
            v_code += "1" if dot >= 0 else "0"
        hamming_dist = sum(1 for qb, vb in zip(query_code, v_code) if qb != vb)
        results.append((vid, v_code, hamming_dist))
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

const createVectorSnapshot = (
  query: number[],
  hyperplanes: number[][],
  vectors: LshVectorItem[],
  currentQueryCode: string,
  processedVectors: Map<string, { code: string; hamming: number }>,
  activeContext?: {
    type: "query-dot" | "vector-dot" | "vector-dist" | "sorting" | "complete";
    hpIdx?: number;
    vecId?: string;
    currentVCode?: string;
  },
): VectorVisualSnapshot => {
  const is3D = query.length >= 3;
  const vectorItems: VectorItem[] = [];

  // Query vector
  const queryState: VectorItem["state"] = activeContext?.type === "query-dot" ? "active" : "result";
  vectorItems.push({
    id: "query",
    label: `Query [${query.join(", ")}]`,
    x: query[0] ?? 0,
    y: query[1] ?? 0,
    z: is3D ? query[2] : undefined,
    color: "#ef4444",
    state: queryState,
    subText: currentQueryCode ? `Hash: '${currentQueryCode}'` : "Query Vector",
  });

  // Hyperplanes
  hyperplanes.forEach((hp, idx) => {
    const isHpActive = activeContext?.hpIdx === idx;
    vectorItems.push({
      id: `hp-${idx}`,
      label: `HP${idx} [${hp.join(", ")}]`,
      x: hp[0] ?? 0,
      y: hp[1] ?? 0,
      z: is3D ? hp[2] : undefined,
      color: "#8b5cf6",
      state: isHpActive ? "active" : "inactive",
      subText: `Hyperplane ${idx + 1} normal`,
    });
  });

  // Candidate dataset vectors
  vectors.forEach((v) => {
    const proc = processedVectors.get(v.id);
    const isVecActive = activeContext?.vecId === v.id;
    let state: VectorItem["state"] = "default";
    let subText = `Vals: [${v.values.join(", ")}]`;

    if (isVecActive) {
      if (activeContext?.type === "vector-dist") {
        state = "compared";
      } else {
        state = "active";
      }
      if (activeContext?.currentVCode !== undefined) {
        subText = `Hash: '${activeContext.currentVCode}'`;
      }
    } else if (proc) {
      if (proc.hamming === 0) {
        state = "result";
      } else {
        state = "compared";
      }
      subText = `Hash: '${proc.code}' (d=${proc.hamming})`;
    }

    vectorItems.push({
      id: `vec-${v.id}`,
      label: `${v.id}`,
      x: v.values[0] ?? 0,
      y: v.values[1] ?? 0,
      z: is3D ? v.values[2] : undefined,
      color: "#3b82f6",
      state,
      subText,
    });
  });

  return {
    kind: "vector",
    vectors: vectorItems,
    planeTitle: `Random Projection LSH Space (${is3D ? "3D" : "2D"})`,
    dimensions: is3D ? "3d" : "2d",
  };
};

export const generateLshVectorHashingSteps = (input: LshVectorHashingInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const processedVectors = new Map<string, { code: string; hamming: number }>();

  // Line 2: query_code = ""
  let queryCode = "";
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Initialize Query Hash Code",
      why: `Start computing binary hash code for query vector [${input.query.join(", ")}] across ${input.hyperplanes.length} hyperplanes.`,
    },
    primarySnapshot: createVectorSnapshot(
      input.query,
      input.hyperplanes,
      input.vectors,
      queryCode,
      processedVectors,
      { type: "query-dot" },
    ),
    auxiliaryState: {
      hashMap: { QueryCode: "" },
    },
    variables: {
      queryCode: "",
      query: `[${input.query.join(", ")}]`,
    },
  });

  // Compute query hash code line-by-line
  for (let h = 0; h < input.hyperplanes.length; h++) {
    const hp = input.hyperplanes[h];
    const dot = input.query.reduce((sum, q, idx) => sum + q * (hp[idx] ?? 0), 0);

    // Line 4: dot = sum(q * h for q, h in zip(query, hp))
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: `Compute Query Dot Product on HP${h}`,
        why: `Dot product <query, HP${h}> = ${dot.toFixed(2)}. Indicates position relative to hyperplane normal [${hp.join(", ")}].`,
      },
      primarySnapshot: createVectorSnapshot(
        input.query,
        input.hyperplanes,
        input.vectors,
        queryCode,
        processedVectors,
        { type: "query-dot", hpIdx: h },
      ),
      auxiliaryState: {
        hashMap: { QueryCode: queryCode, CurrentDot: dot.toFixed(2) },
      },
      variables: {
        hpIndex: h,
        dotProduct: Math.round(dot * 100) / 100,
        queryCode,
      },
    });

    const bit = dot >= 0 ? "1" : "0";
    queryCode += bit;

    // Line 5: query_code += "1" if dot >= 0 else "0"
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Append Bit '${bit}' to Query Hash Code`,
        why: `Dot product ${dot.toFixed(2)} ${dot >= 0 ? ">= 0 (bit '1')" : "< 0 (bit '0')"}, updating query_code to '${queryCode}'.`,
      },
      primarySnapshot: createVectorSnapshot(
        input.query,
        input.hyperplanes,
        input.vectors,
        queryCode,
        processedVectors,
        { type: "query-dot", hpIdx: h },
      ),
      auxiliaryState: {
        hashMap: { QueryCode: queryCode, LastBit: bit },
      },
      variables: {
        hpIndex: h,
        bit,
        queryCode,
      },
    });
  }

  // Line 6: results = []
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Complete Query Hash Code & Initialize Results",
      why: `Query vector hash code is '${queryCode}'. Initializing candidate vector processing list results = [].`,
    },
    primarySnapshot: createVectorSnapshot(
      input.query,
      input.hyperplanes,
      input.vectors,
      queryCode,
      processedVectors,
    ),
    auxiliaryState: {
      hashMap: { QueryCode: queryCode },
      distanceTable: {},
    },
    variables: {
      queryCode,
      resultsCount: 0,
    },
  });

  // Loop over candidate vectors
  const resultsList: Array<{ id: string; code: string; hamming: number }> = [];

  for (let i = 0; i < input.vectors.length; i++) {
    const vec = input.vectors[i];

    // Line 7: for vec in vectors:
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Select Candidate Vector ${vec.id}`,
        why: `Evaluating candidate vector ${vec.id} = [${vec.values.join(", ")}] against random hyperplanes.`,
      },
      primarySnapshot: createVectorSnapshot(
        input.query,
        input.hyperplanes,
        input.vectors,
        queryCode,
        processedVectors,
        { type: "vector-dot", vecId: vec.id },
      ),
      auxiliaryState: {
        hashMap: { QueryCode: queryCode, ActiveVector: vec.id },
        distanceTable: Object.fromEntries(
          Array.from(processedVectors.entries()).map(([id, res]) => [id, res.hamming]),
        ),
      },
      variables: {
        vectorId: vec.id,
        values: `[${vec.values.join(", ")}]`,
      },
    });

    // Line 10: v_code = ""
    let vCode = "";
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Initialize Hash String for ${vec.id}`,
        why: `Prepare empty bitstring v_code for hyperplane projections of vector ${vec.id}.`,
      },
      primarySnapshot: createVectorSnapshot(
        input.query,
        input.hyperplanes,
        input.vectors,
        queryCode,
        processedVectors,
        { type: "vector-dot", vecId: vec.id, currentVCode: vCode },
      ),
      auxiliaryState: {
        hashMap: { QueryCode: queryCode, ActiveVector: vec.id, CurrentVCode: "" },
        distanceTable: Object.fromEntries(
          Array.from(processedVectors.entries()).map(([id, res]) => [id, res.hamming]),
        ),
      },
      variables: {
        vectorId: vec.id,
        vCode: "",
      },
    });

    for (let h = 0; h < input.hyperplanes.length; h++) {
      const hp = input.hyperplanes[h];
      const dot = vec.values.reduce((sum, v, idx) => sum + v * (hp[idx] ?? 0), 0);

      // Line 12: dot = sum(v * h for v, h in zip(vals, hp))
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 12,
        explanation: {
          what: `Compute ${vec.id} Projection on HP${h}`,
          why: `Dot product <${vec.id}, HP${h}> = ${dot.toFixed(2)}.`,
        },
        primarySnapshot: createVectorSnapshot(
          input.query,
          input.hyperplanes,
          input.vectors,
          queryCode,
          processedVectors,
          { type: "vector-dot", vecId: vec.id, hpIdx: h, currentVCode: vCode },
        ),
        auxiliaryState: {
          hashMap: { QueryCode: queryCode, ActiveVector: vec.id, CurrentDot: dot.toFixed(2) },
          distanceTable: Object.fromEntries(
            Array.from(processedVectors.entries()).map(([id, res]) => [id, res.hamming]),
          ),
        },
        variables: {
          vectorId: vec.id,
          hpIndex: h,
          dotProduct: Math.round(dot * 100) / 100,
        },
      });

      const bit = dot >= 0 ? "1" : "0";
      vCode += bit;

      // Line 13: v_code += "1" if dot >= 0 else "0"
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 13,
        explanation: {
          what: `Append Bit '${bit}' to ${vec.id} Hash Code`,
          why: `Dot product ${dot.toFixed(2)} ${dot >= 0 ? ">= 0 (bit '1')" : "< 0 (bit '0')"}, v_code is now '${vCode}'.`,
        },
        primarySnapshot: createVectorSnapshot(
          input.query,
          input.hyperplanes,
          input.vectors,
          queryCode,
          processedVectors,
          { type: "vector-dot", vecId: vec.id, hpIdx: h, currentVCode: vCode },
        ),
        auxiliaryState: {
          hashMap: { QueryCode: queryCode, ActiveVector: vec.id, CurrentVCode: vCode },
          distanceTable: Object.fromEntries(
            Array.from(processedVectors.entries()).map(([id, res]) => [id, res.hamming]),
          ),
        },
        variables: {
          vectorId: vec.id,
          hpIndex: h,
          bit,
          vCode,
        },
      });
    }

    let hamming = 0;
    for (let b = 0; b < queryCode.length; b++) {
      if (queryCode[b] !== vCode[b]) hamming++;
    }

    // Line 14: hamming_dist = sum(1 for qb, vb in zip(query_code, v_code) if qb != vb)
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 14,
      explanation: {
        what: `Calculate Hamming Distance for ${vec.id}`,
        why: `Query code '${queryCode}' vs vector code '${vCode}' yields Hamming distance = ${hamming} bit flip(s).`,
      },
      primarySnapshot: createVectorSnapshot(
        input.query,
        input.hyperplanes,
        input.vectors,
        queryCode,
        processedVectors,
        { type: "vector-dist", vecId: vec.id, currentVCode: vCode },
      ),
      auxiliaryState: {
        hashMap: { QueryCode: queryCode, ActiveVector: vec.id, VCode: vCode, HammingDist: hamming },
        distanceTable: Object.fromEntries(
          Array.from(processedVectors.entries()).map(([id, res]) => [id, res.hamming]),
        ),
      },
      variables: {
        vectorId: vec.id,
        queryCode,
        vCode,
        hammingDistance: hamming,
      },
    });

    processedVectors.set(vec.id, { code: vCode, hamming });
    resultsList.push({ id: vec.id, code: vCode, hamming });

    // Line 15: results.append((vid, v_code, hamming_dist))
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 15,
      explanation: {
        what: `Append (${vec.id}, '${vCode}', ${hamming}) to Results`,
        why: `Saved candidate ${vec.id} hash result to output list.`,
      },
      primarySnapshot: createVectorSnapshot(
        input.query,
        input.hyperplanes,
        input.vectors,
        queryCode,
        processedVectors,
      ),
      auxiliaryState: {
        hashMap: { QueryCode: queryCode },
        distanceTable: Object.fromEntries(
          Array.from(processedVectors.entries()).map(([id, res]) => [id, res.hamming]),
        ),
      },
      variables: {
        vectorId: vec.id,
        vCode,
        hammingDistance: hamming,
        resultsLength: resultsList.length,
      },
    });
  }

  // Line 16: results.sort(key=lambda x: x[2])
  resultsList.sort((a, b) => a.hamming - b.hamming);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: "Rank Candidates by Hamming Distance",
      why: `Candidates sorted by Hamming distance: ${resultsList.map((r) => `${r.id} (d=${r.hamming})`).join(", ")}. Candidates with minimum distance are prioritized for exact distance evaluation.`,
    },
    primarySnapshot: createVectorSnapshot(
      input.query,
      input.hyperplanes,
      input.vectors,
      queryCode,
      processedVectors,
      { type: "sorting" },
    ),
    auxiliaryState: {
      hashMap: { QueryCode: queryCode, TopCandidate: resultsList[0]?.id ?? "" },
      distanceTable: Object.fromEntries(resultsList.map((r) => [r.id, r.hamming])),
    },
    variables: {
      topCandidate: resultsList[0]?.id ?? "",
      minDist: resultsList[0]?.hamming ?? 0,
    },
  });

  // Line 17: return results
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: "Return Ranked Candidate List",
      why: `Returned ${resultsList.length} ranked candidates. ${resultsList.filter((r) => r.hamming === 0).length} vector(s) matched the query hash code exactly.`,
    },
    primarySnapshot: createVectorSnapshot(
      input.query,
      input.hyperplanes,
      input.vectors,
      queryCode,
      processedVectors,
      { type: "complete" },
    ),
    auxiliaryState: {
      hashMap: { QueryCode: queryCode, TopCandidate: resultsList[0]?.id ?? "" },
      distanceTable: Object.fromEntries(resultsList.map((r) => [r.id, r.hamming])),
    },
    variables: {
      topCandidate: resultsList[0]?.id ?? "",
      minDist: resultsList[0]?.hamming ?? 0,
      totalCandidates: resultsList.length,
    },
  });

  return steps;
};

const LSH_VECTOR_HASHING_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "query_code += '1' if dot <= 0 else '0'",
    "hamming_dist = sum(1 for qb, vb in zip(query_code, v_code) if qb == vb)",
    "results.sort(key=lambda x: -x[2])",
  ],
  hints: [
    {
      line: 5,
      hint: "Use the sign of the random hyperplane dot product to set binary hash code bit (1 if dot >= 0 else 0).",
    },
    {
      line: 14,
      hint: "Compute Hamming distance by counting mismatched bit positions between query and vector codes.",
    },
    {
      line: 16,
      hint: "Sort candidate vectors by Hamming distance ascending to rank nearest hash bucket items.",
    },
  ],
  lineExplanations: {
    1: "Defines Locality-Sensitive Hashing candidate retrieval algorithm.",
    5: "Determines query hash code bit from hyperplane dot product sign.",
    14: "Counts bitwise differences (Hamming distance) between binary hash codes.",
    16: "Orders candidate vectors by Hamming distance for ANN query filtering.",
  },
};

export const lshVectorHashing: AlgorithmDefinition<LshVectorHashingInput> = {
  id: "lsh-vector-hashing",
  title: "Locality-Sensitive Hashing (Random Projection LSH)",
  topicIds: ["ml_vector_search"],
  difficulty: "Medium",
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
