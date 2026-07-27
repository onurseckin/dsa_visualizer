import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface IvfPqCoarseCentroid {
  id: string;
  vector: number[];
}

export interface IvfPqVectorItem {
  id: string;
  coarseId: string;
  pqCodes: number[]; // M sub-space codebook indices
}

export interface IvfPqAdcInput {
  coarseCentroids: IvfPqCoarseCentroid[];
  codebook: number[][][]; // M sub-codebooks, each containing K sub-centroids
  vectors: IvfPqVectorItem[];
  query: number[];
  nprobe: number;
}

export const IVF_PQ_ADC_SEARCH_CODE = `def ivf_pq_adc_search(coarse_centroids: list[dict], codebook: list[list[list[float]]], vectors: list[dict], query: list[float], nprobe: int) -> list[tuple[str, float]]:
    # Step 1: Probe nearest coarse inverted list centroids
    coarse_dists = []
    for c in coarse_centroids:
        d_sq = sum((q - x) ** 2 for q, x in zip(query, c["vector"]))
        coarse_dists.append((c["id"], c["vector"], d_sq))
    coarse_dists.sort(key=lambda x: x[2])
    probed = coarse_dists[:nprobe]
    
    results = []
    for c_id, c_vec, _ in probed:
        # Step 2: Compute query residual w.r.t coarse centroid
        q_res = [q - c for q, c in zip(query, c_vec)]
        sub_len = len(q_res) // len(codebook)
        
        # Step 3: Build Asymmetric Distance Lookup Table (LUT)
        lut = []
        for m, sub_cb in enumerate(codebook):
            q_sub = q_res[m * sub_len : (m + 1) * sub_len]
            sub_lut = []
            for k_centroid in sub_cb:
                dist_sq = sum((qs - ks) ** 2 for qs, ks in zip(q_sub, k_centroid))
                sub_lut.append(dist_sq)
            lut.append(sub_lut)
            
        # Step 4: Sum precomputed sub-space LUT distances for IVF vectors
        ivf_list = [v for v in vectors if v["coarseId"] == c_id]
        for v in ivf_list:
            adc_dist = sum(lut[m][code] for m, code in enumerate(v["pqCodes"]))
            results.append((v["id"], adc_dist))
            
    results.sort(key=lambda x: x[1])
    return results`;

export const DEFAULT_IVF_PQ_ADC_INPUT: IvfPqAdcInput = {
  coarseCentroids: [
    { id: "C0", vector: [0.0, 0.0] },
    { id: "C1", vector: [10.0, 10.0] },
  ],
  codebook: [
    // Sub-quantizer 0 (for x dimension)
    [[0.0], [2.0]],
    // Sub-quantizer 1 (for y dimension)
    [[0.0], [3.0]],
  ],
  vectors: [
    { id: "V0", coarseId: "C0", pqCodes: [0, 0] }, // [0, 0]
    { id: "V1", coarseId: "C0", pqCodes: [1, 1] }, // [2, 3]
    { id: "V2", coarseId: "C1", pqCodes: [0, 1] },
  ],
  query: [3.0, 4.0],
  nprobe: 1,
};

export const generateIvfPqAdcSearchSteps = (
  input: IvfPqAdcInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Step 1: Probe coarse centroids
  const coarseDists = input.coarseCentroids.map((c) => {
    const dSq = input.query.reduce((sum, q, idx) => sum + (q - c.vector[idx]) ** 2, 0);
    return { id: c.id, vector: c.vector, distSq: dSq };
  });

  coarseDists.sort((a, b) => a.distSq - b.distSq);
  const probed = coarseDists.slice(0, input.nprobe);
  const probedIds = new Set(probed.map((p) => p.id));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: `Probe Inverted File (nprobe=${input.nprobe})`,
      why: `Query [${input.query.join(", ")}] probed nearest coarse centroid ${probed[0].id} (dist²=${probed[0].distSq.toFixed(1)}). IVF search limits candidate scanning.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: input.coarseCentroids.map((c) => ({
        id: `coarse-${c.id}`,
        value: coarseDists.find((cd) => cd.id === c.id)?.distSq ?? 0,
        state: probedIds.has(c.id) ? ("sorted" as ElementState) : ("default" as ElementState),
      })),
    },
    auxiliaryState: {
      distanceTable: Object.fromEntries(coarseDists.map((cd) => [`Coarse_${cd.id}`, cd.distSq])),
    },
    variables: {
      nprobe: input.nprobe,
      probedCentroid: probed[0].id,
    },
  });

  const results: Array<{ id: string; adcDist: number }> = [];

  for (const p of probed) {
    const qRes = input.query.map((q, idx) => q - p.vector[idx]);
    const subLen = Math.floor(qRes.length / input.codebook.length);

    // Build LUT
    const lut: number[][] = [];
    for (let m = 0; m < input.codebook.length; m++) {
      const qSub = qRes.slice(m * subLen, (m + 1) * subLen);
      const subCb = input.codebook[m];
      const subLut: number[] = [];
      for (const kCentroid of subCb) {
        const dSq = qSub.reduce((sum, qs, idx) => sum + (qs - kCentroid[idx]) ** 2, 0);
        subLut.push(dSq);
      }
      lut.push(subLut);
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 20,
      explanation: {
        what: `Build ADC Lookup Table (LUT) for ${p.id}`,
        why: `Product Quantization (PQ) splits residual vectors into M=${input.codebook.length} sub-spaces. The M x K lookup table caches distances to codebook sub-centroids.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: input.vectors.map((v) => ({
          id: `vec-${v.id}`,
          value: 0,
          state: v.coarseId === p.id ? ("active" as ElementState) : ("default" as ElementState),
        })),
      },
      auxiliaryState: {
        distanceTable: Object.fromEntries(
          lut.flatMap((subLut, m) => subLut.map((val, k) => [`LUT_m${m}_k${k}`, val]))
        ),
      },
      variables: {
        coarseId: p.id,
        subSpaces: input.codebook.length,
      },
    });

    const ivfList = input.vectors.filter((v) => v.coarseId === p.id);
    for (const v of ivfList) {
      let adcDist = 0;
      v.pqCodes.forEach((code, m) => {
        adcDist += lut[m][code];
      });
      results.push({ id: v.id, adcDist });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 26,
        explanation: {
          what: `Compute ADC Distance for Vector ${v.id}`,
          why: `Vector ${v.id} (pqCodes:[${v.pqCodes.join(",")}]) yields ADC distance² = ${adcDist.toFixed(2)}. Summing LUT values approximates Euclidean distance.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: input.vectors.map((item) => {
            const res = results.find((r) => r.id === item.id);
            let state: ElementState = "default";
            if (item.id === v.id) state = "active";
            else if (res) state = "visited";
            return {
              id: `vec-${item.id}`,
              value: res?.adcDist ?? 0,
              state,
            };
          }),
        },
        auxiliaryState: {
          distanceTable: Object.fromEntries(results.map((r) => [r.id, r.adcDist])),
        },
        variables: {
          vecId: v.id,
          adcDist,
        },
      });
    }
  }

  results.sort((a, b) => a.adcDist - b.adcDist);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 29,
    explanation: {
      what: `Rank Probed IVF-PQ Nearest Neighbors`,
      why: `Final ranked candidates: ${results.map((r) => `${r.id} (dist²=${r.adcDist.toFixed(2)})`).join(", ")}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: results.map((r, idx) => ({
        id: `vec-${r.id}`,
        value: r.adcDist,
        state: idx === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
      })),
    },
    auxiliaryState: {
      distanceTable: Object.fromEntries(results.map((r) => [r.id, r.adcDist])),
    },
    variables: {
      nearestId: results[0]?.id ?? "",
      minAdcDist: results[0]?.adcDist ?? 0,
    },
  });

  return steps;
};

const IVF_PQ_ADC_SEARCH_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "coarse_dists.sort(key=lambda x: -x[2]) # Sort descending",
    "sub_lut.append(sum((qs - ks) for qs, ks in zip(q_sub, k_centroid)))",
    "adc_dist = sum(lut[m][0] for m, code in enumerate(v['pqCodes']))",
  ],
  hints: [
    {
      line: 8,
      hint: "Sort coarse inverted list centroids by distance to query and take top nprobe lists.",
    },
    {
      line: 20,
      hint: "Precompute sub-space distance lookup table (LUT) between query residual and codebook centroids.",
    },
    {
      line: 26,
      hint: "Accumulate sub-space LUT values using vector's quantized PQ indices to calculate ADC distance.",
    },
  ],
  lineExplanations: {
    1: "Defines IVF-PQ Asymmetric Distance Computation (ADC) vector search.",
    8: "Selects nprobe coarse centroids closest to query vector.",
    20: "Populates asymmetric lookup table (LUT) for PQ sub-vectors.",
    26: "Sums LUT entries indexed by vector PQ codes to get approximate distance.",
  },
};

export const ivfPqAdcSearch: AlgorithmDefinition<IvfPqAdcInput> = {
  id: "ivf-pq-adc-search",
  title: "IVF-PQ Asymmetric Distance Computation (ADC)",
  category: "ml_vector_search",
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 4,
  description:
    "Accelerates vector database search (Faiss IVF-PQ) by coarse centroid pruning (IVF) and asymmetric distance calculation (ADC) using precomputed sub-quantizer lookup tables (LUT).",
  constraints: [
    "len(coarseCentroids) >= 1",
    "len(codebook) >= 1",
    "nprobe >= 1",
    "query vector dimension matches centroid and codebook sub-space sum",
  ],
  examples: [
    {
      kind: "basic",
      title: "2-Quantizer IVF-PQ ADC Search (nprobe=1)",
      inputDisplay: "Query [3.0, 4.0], coarse C0 [0,0], C1 [10,10], nprobe=1",
      outputDisplay: "V1: dist²=2.0, V0: dist²=25.0",
      input: DEFAULT_IVF_PQ_ADC_INPUT,
      output: "V1: dist²=2.0, V0: dist²=25.0",
      explanation: "Probing C0 [0,0] yields residual [3,4]. Sub-space 0 (x=3) dist to sub-centroid 1 (x=2) is 1. Sub-space 1 (y=4) dist to sub-centroid 1 (y=3) is 1. V1 with codes [1,1] has ADC dist 1+1=2.",
    },
    {
      kind: "complex",
      title: "Multi-List Probing with nprobe=2",
      inputDisplay: "Query [5.0, 5.0], nprobe=2 scanning C0 and C1",
      outputDisplay: "V2: ADC dist² evaluated across multiple probed lists",
      input: {
        ...DEFAULT_IVF_PQ_ADC_INPUT,
        query: [5.0, 5.0],
        nprobe: 2,
      },
      output: "V2: ADC dist² evaluated across multiple probed lists",
      explanation: "Setting nprobe=2 probes both coarse centroids C0 and C1, building separate LUTs and combining candidate lists.",
    },
    {
      kind: "negative",
      title: "Single Candidate Inverted List Retrieval",
      inputDisplay: "Single coarse centroid C0, single vector V0",
      outputDisplay: "V0: dist²=25.0",
      input: {
        coarseCentroids: [{ id: "C0", vector: [0.0, 0.0] }],
        codebook: [[[0.0]], [[0.0]]],
        vectors: [{ id: "V0", coarseId: "C0", pqCodes: [0, 0] }],
        query: [3.0, 4.0],
        nprobe: 1,
      },
      output: "V0: dist²=25.0",
      explanation: "Minimum single-node IVF list executes ADC lookup against single codebook centroid.",
    },
  ],
  code: IVF_PQ_ADC_SEARCH_CODE,
  timeComplexity: {
    best: "O(nprobe * M * K)",
    average: "O(nprobe * M * K + N_list * M)",
    worst: "O(N_coarse * d + nprobe * M * K + N_list * M)",
  },
  spaceComplexity: "O(M * K)",
  complexityAnalysis: {
    time: "Coarse probing takes O(N_coarse * d). Constructing LUT takes O(M * K). Evaluating N_list IVF vectors takes O(N_list * M) addition ops.",
    space: "Requires O(M * K) space to store the asymmetric distance lookup table.",
  },
  topicGuide: {
    overview:
      "IVF-PQ (Inverted File with Product Quantization) powered by ADC (Asymmetric Distance Computation) is the industry-standard indexing algorithm for billion-scale vector databases like Meta Faiss.",
    sections: [
      {
        heading: "Inverted File (IVF) Coarse Quantization",
        body: "Coarse k-means centroids cluster vectors into inverted lists. Queries only probe nearest nprobe centroids, pruning >95% of candidates.",
      },
      {
        heading: "Asymmetric Distance Computation (ADC)",
        body: "Rather than decompressing vector byte codes, ADC computes exact distances from the query to codebook sub-centroids into an M x K lookup table (LUT), transforming vector distance evaluation into M fast memory lookups and additions.",
      },
    ],
    keyTerms: [
      {
        term: "nprobe",
        definition: "Number of coarse inverted file lists searched during query execution.",
      },
      {
        term: "ADC Lookup Table (LUT)",
        definition: "Precomputed matrix storing squared distances between query sub-vectors and PQ codebook sub-centroids.",
      },
    ],
  },
  trivia: IVF_PQ_ADC_SEARCH_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_IVF_PQ_ADC_INPUT,
  generateSteps: generateIvfPqAdcSearchSteps,
};
