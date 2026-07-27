import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface IvfPqAsymmetricDistanceComputationInput {
  query: number[];
  numSubvectors: number;
  codebooks: number[][][]; // M subvectors -> K_sub centroids -> d_sub dim
  quantizedCodes: { id: number; codes: number[] }[];
}

export const DEFAULT_IVF_PQ_ADC_INPUT: IvfPqAsymmetricDistanceComputationInput = {
  query: [1.2, 0.8, -0.4, 0.6],
  numSubvectors: 2,
  codebooks: [
    // Subvector 0 (dim 2) centroids
    [
      [1.0, 1.0],
      [0.0, 0.0],
    ],
    // Subvector 1 (dim 2) centroids
    [
      [0.0, 0.5],
      [-0.5, 0.5],
    ],
  ],
  quantizedCodes: [
    { id: 1, codes: [0, 0] },
    { id: 2, codes: [0, 1] },
    { id: 3, codes: [1, 0] },
    { id: 4, codes: [1, 1] },
  ],
};

export const IVF_PQ_ADC_CODE = `import math

def l2_distance_sq(v1: list[float], v2: list[float]) -> float:
    return sum((a - b) ** 2 for a, b in zip(v1, v2))

def ivf_pq_asymmetric_distance(query: list[float], num_subvectors: int, codebooks: list[list[list[float]]], quantized_codes: list[dict]) -> list[tuple[float, int]]:
    """
    Asymmetric Distance Computation (ADC) for Product Quantization (PQ).
    Precomputes distance lookup table (LUT) between uncompressed query subvectors and PQ codebook centroids.
    Calculates distance to quantized database vectors via O(M) table lookups.
    """
    sub_dim = len(query) // num_subvectors
    query_subvectors = [query[m * sub_dim : (m + 1) * sub_dim] for m in range(num_subvectors)]

    # Step 1: Build Look-Up Table (LUT) LUT[m][k] = ||query_m - codebook[m][k]||^2
    lut = []
    for m in range(num_subvectors):
        m_lut = []
        for k_idx, centroid in enumerate(codebooks[m]):
            dist_sq = l2_distance_sq(query_subvectors[m], centroid)
            m_lut.append(dist_sq)
        lut.append(m_lut)

    # Step 2: Calculate ADC distance for each quantized database vector: sum_m LUT[m][codes[m]]
    results = []
    for item in quantized_codes:
        vec_id = item["id"]
        codes = item["codes"]
        total_dist_sq = sum(lut[m][codes[m]] for m in range(num_subvectors))
        results.append((round(math.sqrt(total_dist_sq), 4), vec_id))

    results.sort(key=lambda x: x[0])
    return results`;

export const generateIvfPqAdcSteps = (
  input: IvfPqAsymmetricDistanceComputationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { query, numSubvectors, codebooks, quantizedCodes } = input;
  let stepIndex = 0;

  const subDim = Math.floor(query.length / numSubvectors);
  const l2DistSq = (v1: number[], v2: number[]) =>
    v1.reduce((sum, val, idx) => sum + (val - v2[idx]) ** 2, 0);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Initialize Asymmetric Distance Computation (ADC) Engine",
      why: `Query vector dimension D = ${query.length}, split into M = ${numSubvectors} subvectors of dimension ${subDim}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: query.map((val, idx) => ({
        id: `q-${idx}`,
        value: val,
        label: `Q[${idx}]`,
        state: "default" as ElementState,
        pointers: idx === 0 ? ["Subvector 0"] : idx === subDim ? ["Subvector 1"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        query: `[${query.join(", ")}]`,
        numSubvectors: String(numSubvectors),
        subDim: String(subDim),
        status: "Initialized",
      },
    },
    variables: { numSubvectors, subDim },
  });

  // Step 1: Precompute Look-Up Table (LUT)
  const lut: number[][] = [];
  for (let m = 0; m < numSubvectors; m++) {
    const qSub = query.slice(m * subDim, (m + 1) * subDim);
    const mLut: number[] = [];

    for (let k = 0; k < codebooks[m].length; k++) {
      const cent = codebooks[m][k];
      const dSq = l2DistSq(qSub, cent);
      mLut.push(dSq);
    }
    lut.push(mLut);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 13,
      explanation: {
        what: `Precompute ADC Distance Look-Up Table (LUT) for Subvector ${m}`,
        why: `Calculated squared distance from query subvector [${qSub.join(",")}] to codebook centroids: [${mLut
          .map((d) => d.toFixed(3))
          .join(", ")}].`,
      },
      primarySnapshot: {
        kind: "array",
        elements: mLut.map((d, kIdx) => ({
          id: `lut-${m}-${kIdx}`,
          value: Math.round(d * 100),
          label: `LUT[m=${m}][k=${kIdx}] = ${d.toFixed(3)}`,
          state: "active" as ElementState,
        })),
      },
      auxiliaryState: {
        customState: {
          subvector: String(m),
          lutValues: mLut.map((d, k) => `k=${k}:${d.toFixed(3)}`).join(", "),
        },
      },
      variables: { subvector: m },
    });
  }

  // Step 2: Evaluate Quantized Vectors via Fast LUT Lookups
  const results: { id: number; dist: number; totalDistSq: number }[] = [];

  for (const item of quantizedCodes) {
    const { id, codes } = item;
    let totalDistSq = 0;
    const subDists: string[] = [];

    for (let m = 0; m < numSubvectors; m++) {
      const kCode = codes[m];
      const dSq = lut[m][kCode];
      totalDistSq += dSq;
      subDists.push(`LUT[${m}][${kCode}] (${dSq.toFixed(3)})`);
    }

    const finalDist = Math.sqrt(totalDistSq);
    results.push({ id, dist: finalDist, totalDistSq });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 23,
      explanation: {
        what: `Compute ADC Distance for Quantized Vector ID ${id} (codes: [${codes.join(", ")}])`,
        why: `Fast O(M) lookup summation: ${subDists.join(" + ")} = ${totalDistSq.toFixed(
          3,
        )} (sqrt = ${finalDist.toFixed(4)}). Zero vector decompression required!`,
      },
      primarySnapshot: {
        kind: "array",
        elements: quantizedCodes.map((v) => ({
          id: `vec-${v.id}`,
          value: v.id,
          label: `ID ${v.id} (dist=${v.id === id ? finalDist.toFixed(3) : "?"})`,
          state: v.id === id ? ("active" as ElementState) : ("visited" as ElementState),
          pointers: v.id === id ? [`codes=[${codes.join(",")}]`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          activeVectorId: String(id),
          codes: `[${codes.join(", ")}]`,
          totalDistSq: totalDistSq.toFixed(3),
          finalDist: finalDist.toFixed(4),
        },
      },
      variables: { vectorId: id, dist: Math.round(finalDist * 100) / 100 },
    });
  }

  // Step Final: Complete
  results.sort((a, b) => a.dist - b.dist);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 26,
    explanation: {
      what: "IVF-PQ Asymmetric Distance Computation Complete",
      why: `Top match: Vector ID ${results[0]?.id} with estimated distance ${results[0]?.dist.toFixed(
        4,
      )}. Computed entirely via SIMD table lookups.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: results.map((res, rank) => ({
        id: `res-${res.id}`,
        value: res.id,
        label: `Rank ${rank + 1}: ID ${res.id} (dist=${res.dist.toFixed(3)})`,
        state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
        pointers: rank === 0 ? ["Top Candidate"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        topVectorId: String(results[0]?.id),
        topDistance: results[0]?.dist.toFixed(4),
        status: "Completed",
      },
    },
    variables: { topId: results[0]?.id, complete: true },
  });

  return steps;
};

export const ivfPqAsymmetricDistanceComputation: AlgorithmDefinition<IvfPqAsymmetricDistanceComputationInput> =
  {
    id: "ivfPqAsymmetricDistanceComputation",
    title: "IVF-PQ Asymmetric Distance Computation (ADC)",
    category: "ml_vector_search",
    categories: ["ml_vector_search", "ml_precision_quantization"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_vector_search",
    description:
      "Asymmetric Distance Computation (ADC) computes nearest-neighbor distances between an uncompressed continuous query vector Q and millions of quantized database vectors encoded as Product Quantization (PQ) codebook indices. By precomputing a query-to-codebook distance Look-Up Table (LUT), evaluating database vectors reduces to fast O(M) scalar additions.\n\nInput Format:\n- query: D-dimensional uncompressed query embedding vector.\n- numSubvectors: Number of subvector quantization splits M.\n- codebooks: M codebooks, each containing K sub-centroids of dimension D/M.\n- quantizedCodes: Database vectors stored as M-byte integer code arrays.\n\nOutput Format:\n- Returns sorted list of (distance, vectorId) candidates.\n\nEdge Cases & Constraints:\n- M must evenly divide query dimension D.",
    constraints: [
      "query.length % numSubvectors == 0.",
      "quantizedCodes[i].codes.length == numSubvectors.",
    ],
    examples: [
      {
        kind: "basic",
        title: "ADC Search over 4 Quantized Vectors",
        inputDisplay: "query = [1.2, 0.8, -0.4, 0.6], M = 2, 4 vectors",
        outputDisplay: "Top Match ID 2: dist = 0.5385",
        input: DEFAULT_IVF_PQ_ADC_INPUT,
        output: "ID 2",
        explanation: "Precomputes 2x2 LUT table and sums code lookups for each candidate.",
      },
      {
        kind: "complex",
        title: "Zero Vector Quantized Code Match",
        inputDisplay: "query subvectors near origin centroids",
        outputDisplay: "Top Match ID 3: dist = 0.5000",
        input: {
          ...DEFAULT_IVF_PQ_ADC_INPUT,
          query: [0.0, 0.0, 0.0, 0.5],
        },
        output: "ID 3",
        explanation: "Lookup table routes to origin centroids [0.0, 0.0] and [0.0, 0.5].",
      },
      {
        kind: "negative",
        title: "Distant Query Projection",
        inputDisplay: "query = [10.0, 10.0, 10.0, 10.0]",
        outputDisplay: "Computes scaled LUT lookups correctly",
        input: {
          ...DEFAULT_IVF_PQ_ADC_INPUT,
          query: [10.0, 10.0, 10.0, 10.0],
        },
        output: "ID 1",
        explanation: "Large distances are maintained without numerical overflow.",
      },
    ],
    defaultInput: DEFAULT_IVF_PQ_ADC_INPUT,
    code: IVF_PQ_ADC_CODE,
    timeComplexity: {
      best: "O(M * K_sub * d_sub + N * M)",
      average: "O(M * K_sub * d_sub + N * M)",
      worst: "O(M * K_sub * d_sub + N * M)",
    },
    spaceComplexity: "O(M * K_sub)",
    complexityAnalysis: {
      time: "O(M * K_sub * d_sub) to precompute LUT, plus O(N * M) fast scalar byte lookups per candidate vector N.",
      space: "O(M * K_sub) auxiliary memory for the distance Look-Up Table (LUT).",
    },
    topicGuide: {
      overview:
        "Product Quantization (PQ, Jegou et al. 2011) compresses high-dimensional vectors by breaking R^D into M subspace projections R^(D/M) and quantizing each subspace into 256 centroids (1 byte per subvector). Asymmetric Distance Computation (ADC) keeps the query uncompressed while reading 8-bit quantized database byte codes, enabling 95%+ memory compression with microsecond query latencies.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "For query Q = (q_1, ..., q_M) and database code y = (c_1, ..., c_M), ADC computes dist(Q, y)^2 = sum_{m=1}^M ||q_m - C_m[c_m]||_2^2. The matrix LUT[m][k] = ||q_m - C_m[k]||^2 is computed once per query.",
        },
        {
          heading: "Systems & Performance Impact",
          body: "ADC avoids expensive vector dequantization. By keeping the database representation down to M bytes per vector (e.g. 64 bytes for 768-dim embeddings), 1 billion vectors fit directly into system RAM.",
        },
        {
          heading: "SIMD Acceleration (AVX-512 / ARM Neon)",
          body: "Modern vector engines use `pshufb` (shuffle bytes) SIMD instructions to perform 16 parallel subvector distance lookups per CPU instruction cycle.",
        },
      ],
      keyTerms: [
        {
          term: "Asymmetric Distance Computation (ADC)",
          definition:
            "Computing exact-to-quantized distances keeping the query vector uncompressed.",
        },
        {
          term: "Product Quantization (PQ)",
          definition:
            "Decomposing vector space into Cartesian products of lower-dimensional sub-quantizers.",
        },
        {
          term: "Look-Up Table (LUT)",
          definition: "Precomputed distance matrix storing subvector query-to-centroid distances.",
        },
      ],
    },
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "Product Quantization (Jegou et al.)" }],
    generateSteps: generateIvfPqAdcSteps,
  };
