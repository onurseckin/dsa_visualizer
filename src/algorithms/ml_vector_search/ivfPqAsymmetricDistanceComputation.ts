import { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";

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
    sub_dim = len(query) // num_subvectors
    query_subvectors = [query[m * sub_dim : (m + 1) * sub_dim] for m in range(num_subvectors)]

    lut = []
    for m in range(num_subvectors):
        m_lut = []
        for k_idx, centroid in enumerate(codebooks[m]):
            dist_sq = l2_distance_sq(query_subvectors[m], centroid)
            m_lut.append(dist_sq)
        lut.append(m_lut)

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

  const querySubvectors: number[][] = [];
  for (let m = 0; m < numSubvectors; m++) {
    querySubvectors.push(query.slice(m * subDim, (m + 1) * subDim));
  }

  const maxCentroids = Math.max(...codebooks.map((cb) => cb.length));
  const lutRowHeaders = Array.from({ length: numSubvectors }, (_, m) => `Subvector ${m}`);
  const lutColHeaders = Array.from({ length: maxCentroids }, (_, k) => `Centroid ${k}`);

  const buildLutCells = (
    currentM?: number,
    currentK?: number,
    lutState: number[][] = [],
    isComplete = false,
    selectedCodes?: number[],
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numSubvectors; r++) {
      for (let c = 0; c < (codebooks[r]?.length || 0); c++) {
        let cellValue: string | number = "-";
        let cellState: MatrixCellItem["state"] = "default";
        let label: string | undefined = undefined;

        if (lutState[r] !== undefined && lutState[r][c] !== undefined) {
          cellValue = Number(lutState[r][c].toFixed(3));
        }

        if (isComplete) {
          if (selectedCodes && selectedCodes[r] === c) {
            cellState = "active";
            label = `Sub ${r} Lookup`;
          } else {
            cellState = "sorted";
          }
        } else if (currentM === r && currentK === c) {
          cellState = "active";
          label = "Computing";
        } else if (
          currentM !== undefined &&
          currentK !== undefined &&
          (r < currentM || (r === currentM && c < currentK))
        ) {
          cellState = "compared";
        }

        cells.push({
          row: r,
          col: c,
          value: cellValue,
          label,
          state: cellState,
        });
      }
    }
    return cells;
  };

  // Step 0: Partition query vector into subvectors & Init LUT
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: "Partition Query Vector & Initialize Look-Up Table (LUT)",
      why: `Uncompressed query Q of dimension D=${query.length} is split into M=${numSubvectors} subvectors of dimension d_sub=${subDim}. Query subvectors: [${querySubvectors.map((s) => `[${s.join(", ")}]`).join(", ")}].`,
    },
    primarySnapshot: {
      kind: "matrix",
      rows: numSubvectors,
      cols: maxCentroids,
      rowHeaders: lutRowHeaders,
      colHeaders: lutColHeaders,
      title: "Query-to-Codebook Distance Look-Up Table (LUT)",
      cells: buildLutCells(),
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

  // Step 1: Precompute Look-Up Table (LUT) cell-by-cell
  const lut: number[][] = [];
  for (let m = 0; m < numSubvectors; m++) {
    const qSub = querySubvectors[m];
    const mLut: number[] = [];

    for (let k = 0; k < codebooks[m].length; k++) {
      const cent = codebooks[m][k];
      const dSq = l2DistSq(qSub, cent);
      mLut.push(dSq);

      const currentLutState = [...lut, mLut];

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 14,
        explanation: {
          what: `Compute LUT[m=${m}][k=${k}] Squared Euclidean Distance`,
          why: `Squared distance from query subvector ${m} [${qSub.join(", ")}] to centroid ${k} [${cent.join(", ")}] is ||q_${m} - c_{${m},${k}}||^2 = ${dSq.toFixed(4)}.`,
        },
        primarySnapshot: {
          kind: "matrix",
          rows: numSubvectors,
          cols: maxCentroids,
          rowHeaders: lutRowHeaders,
          colHeaders: lutColHeaders,
          title: `Precomputing LUT Matrix (Subvector ${m}, Centroid ${k})`,
          cells: buildLutCells(m, k, currentLutState),
        },
        auxiliaryState: {
          customState: {
            subvector: String(m),
            centroidIdx: String(k),
            querySubvector: `[${qSub.join(", ")}]`,
            centroidVector: `[${cent.join(", ")}]`,
            distSq: dSq.toFixed(4),
          },
        },
        variables: { m, k, distSq: Math.round(dSq * 10000) / 10000 },
      });
    }
    lut.push(mLut);
  }

  // Step 1 Completed: LUT Fully Built
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: "ADC Distance Look-Up Table (LUT) Precomputation Completed",
      why: `Precomputed distance LUT matrix for all M=${numSubvectors} subvectors across codebook centroids. Total size: ${numSubvectors}x${maxCentroids}.`,
    },
    primarySnapshot: {
      kind: "matrix",
      rows: numSubvectors,
      cols: maxCentroids,
      rowHeaders: lutRowHeaders,
      colHeaders: lutColHeaders,
      title: "Precomputed Query Distance Look-Up Table (LUT)",
      cells: buildLutCells(undefined, undefined, lut, true),
    },
    auxiliaryState: {
      customState: {
        numSubvectors: String(numSubvectors),
        maxCentroids: String(maxCentroids),
        status: "LUT Built",
      },
    },
    variables: { completeLut: true },
  });

  // Step 2: Evaluate Quantized Vectors via Fast LUT Lookups
  const results: { id: number; dist: number; totalDistSq: number; codes: number[] }[] = [];

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
    results.push({ id, dist: finalDist, totalDistSq, codes });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 22,
      explanation: {
        what: `Compute ADC Distance for Quantized Vector ID ${id} (codes: [${codes.join(", ")}])`,
        why: `Fast O(M) lookup summation: ${subDists.join(" + ")} = ${totalDistSq.toFixed(
          4,
        )} (sqrt = ${finalDist.toFixed(4)}). Vector remains compressed as byte codes!`,
      },
      primarySnapshot: {
        kind: "matrix",
        rows: numSubvectors,
        cols: maxCentroids,
        rowHeaders: lutRowHeaders,
        colHeaders: lutColHeaders,
        title: `ADC Lookup for Vector ID ${id} (codes: [${codes.join(", ")}]) -> dist = ${finalDist.toFixed(4)}`,
        cells: buildLutCells(undefined, undefined, lut, true, codes),
      },
      auxiliaryState: {
        customState: {
          activeVectorId: String(id),
          codes: `[${codes.join(", ")}]`,
          totalDistSq: totalDistSq.toFixed(4),
          finalDist: finalDist.toFixed(4),
        },
      },
      variables: { vectorId: id, dist: Math.round(finalDist * 10000) / 10000 },
    });
  }

  // Step Final: Sort Candidate Results
  results.sort((a, b) => a.dist - b.dist);

  const resultRowHeaders = results.map((_, rank) => `Rank ${rank + 1}`);
  const resultColHeaders = ["Vector ID", "PQ Codes", "ADC Distance"];

  const resultCells: MatrixCellItem[] = [];
  results.forEach((res, rank) => {
    const isTop = rank === 0;
    const cellState: MatrixCellItem["state"] = isTop ? "sorted" : "compared";
    resultCells.push(
      {
        row: rank,
        col: 0,
        value: `ID ${res.id}`,
        state: cellState,
        label: isTop ? "Top Match" : undefined,
      },
      {
        row: rank,
        col: 1,
        value: `[${res.codes.join(", ")}]`,
        state: cellState,
      },
      {
        row: rank,
        col: 2,
        value: res.dist.toFixed(4),
        state: cellState,
      },
    );
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 25,
    explanation: {
      what: "IVF-PQ Asymmetric Distance Computation Complete",
      why: `Top match: Vector ID ${results[0]?.id} with distance ${results[0]?.dist.toFixed(
        4,
      )}. Database search performed entirely via fast table lookups without vector dequantization.`,
    },
    primarySnapshot: {
      kind: "matrix",
      rows: results.length,
      cols: 3,
      rowHeaders: resultRowHeaders,
      colHeaders: resultColHeaders,
      title: "Sorted Database Candidates by ADC Distance",
      cells: resultCells,
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
    id: "ivf-pq-asymmetric-distance-computation",
    title: "IVF-PQ Asymmetric Distance Computation (ADC)",
    topicIds: ["ml_vector_search", "ml_precision_quantization"],
    difficulty: "Hard",
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
