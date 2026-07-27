import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface SimdSwizzledAdcDistanceLookupInput {
  queryLut: number[][]; // M subvectors -> 16 quantized centroids (4-bit PQ)
  quantizedCodes: number[][]; // Batch of vectors, each represented as M 4-bit nibbles
}

export const DEFAULT_SIMD_SWIZZLED_ADC_INPUT: SimdSwizzledAdcDistanceLookupInput = {
  queryLut: [
    [0.1, 0.5, 1.2, 0.3, 0.8, 1.0, 0.4, 0.9, 0.2, 0.6, 1.1, 0.7, 1.3, 0.0, 1.4, 1.5],
    [0.2, 0.4, 0.1, 0.9, 0.7, 0.3, 0.8, 0.5, 1.0, 1.2, 0.6, 1.1, 0.0, 1.3, 1.4, 1.5],
  ],
  quantizedCodes: [
    [0, 2],
    [3, 1],
    [5, 4],
    [1, 0],
  ],
};

export const SIMD_SWIZZLED_ADC_CODE = `def simd_swizzled_adc_lookup(query_lut: list[list[float]], quantized_codes: list[list[int]]) -> list[float]:
    """
    SIMD-accelerated ADC Look-Up Table distance evaluation.
    Simulates hardware AVX-512 / ARM Neon 4-bit nibble shuffle lookups (pshufb).
    Processes batches of quantized subvector codes using swizzled L1 registers.
    """
    accumulated_distances = []

    for vec_idx, codes in enumerate(quantized_codes):
        total_dist = 0.0
        for m, sub_code in enumerate(codes):
            # SIMD byte shuffle lookup: LUT[m][sub_code]
            dist_val = query_lut[m][sub_code]
            total_dist += dist_val

        accumulated_distances.append(round(total_dist, 4))

    return accumulated_distances`;

export const generateSimdSwizzledAdcSteps = (
  input: SimdSwizzledAdcDistanceLookupInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { queryLut, quantizedCodes } = input;
  let stepIndex = 0;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize SIMD Swizzled ADC Distance Lookup Kernel",
      why: `Evaluating batch of ${quantizedCodes.length} vectors over M = ${queryLut.length} 4-bit PQ subvector codebooks via SIMD register shuffles.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: quantizedCodes.map((codes, idx) => ({
        id: `v-${idx}`,
        value: idx,
        label: `Vector ${idx} codes:[${codes.join(",")}]`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        numSubvectors: String(queryLut.length),
        batchSize: String(quantizedCodes.length),
        simdMode: "AVX-512 pshufb SIMD Lane",
        status: "Initialized",
      },
    },
    variables: { batchSize: quantizedCodes.length, numSubvectors: queryLut.length },
  });

  const accumulatedDists: number[] = [];

  for (let vIdx = 0; vIdx < quantizedCodes.length; vIdx++) {
    const codes = quantizedCodes[vIdx];
    let totalDist = 0;
    const lookupDetails: string[] = [];

    for (let m = 0; m < codes.length; m++) {
      const nibbleCode = codes[m];
      const distVal = queryLut[m][nibbleCode];
      totalDist += distVal;
      lookupDetails.push(`LUT[${m}][${nibbleCode}] (${distVal.toFixed(2)})`);
    }

    accumulatedDists.push(totalDist);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `SIMD Shuffle Lookup for Vector ${vIdx} (codes: [${codes.join(", ")}])`,
        why: `Hardware register shuffle sum: ${lookupDetails.join(" + ")} = ${totalDist.toFixed(
          3,
        )}. Performed in parallel SIMD lanes.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: quantizedCodes.map((_, idx) => ({
          id: `v-${idx}`,
          value: idx === vIdx ? Math.round(totalDist * 100) : idx,
          label: `Vector ${idx} (${idx <= vIdx ? accumulatedDists[idx].toFixed(2) : "?"})`,
          state:
            idx === vIdx
              ? ("active" as ElementState)
              : idx < vIdx
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === vIdx ? [`dist=${totalDist.toFixed(2)}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          activeVector: `Vector ${vIdx}`,
          codes: `[${codes.join(", ")}]`,
          simdLookupDetails: lookupDetails.join(" + "),
          accumulatedDistance: totalDist.toFixed(3),
        },
      },
      variables: { vIdx, totalDist: Math.round(totalDist * 100) / 100 },
    });
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: "SIMD Swizzled ADC Lookup Complete for Batch",
      why: `Batch accumulated distances: [${accumulatedDists
        .map((d) => d.toFixed(3))
        .join(", ")}]. Ultra-fast SIMD throughput achieved.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: accumulatedDists.map((d, idx) => ({
        id: `res-${idx}`,
        value: Math.round(d * 100),
        label: `Vector ${idx}: ${d.toFixed(3)}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        batchDistances: accumulatedDists.map((d) => d.toFixed(3)).join(", "),
        status: "Completed",
      },
    },
    variables: { batchSize: quantizedCodes.length, complete: true },
  });

  return steps;
};

export const simdSwizzledAdcDistanceLookup: AlgorithmDefinition<SimdSwizzledAdcDistanceLookupInput> =
  {
    id: "simdSwizzledAdcDistanceLookup",
    title: "SIMD Swizzled ADC Distance Lookup",
    category: "ml_vector_search",
    categories: ["ml_vector_search", "ml_hardware_kernels"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_vector_search",
    description:
      "SIMD-accelerated Asymmetric Distance Computation (ADC) using swizzled 4-bit Product Quantization (PQ) codebooks. By fitting 16 sub-centroid distance values into 128-bit SIMD registers, hardware shuffle instructions (`pshufb` on x86, `vtbl` on ARM Neon) perform 16 parallel subvector distance lookups per CPU instruction cycle.\n\nInput Format:\n- queryLut: Precomputed distance Look-Up Table for M subvectors, each with 16 sub-centroids.\n- quantizedCodes: Batch of vectors stored as M 4-bit nibbles.\n\nOutput Format:\n- Returns array of float distances for input vector batch.\n\nEdge Cases & Constraints:\n- 4-bit quantization limits sub-centroid count K_sub to 16 per subvector.",
    constraints: ["queryLut[m].length == 16 for 4-bit PQ swizzling."],
    examples: [
      {
        kind: "basic",
        title: "SIMD Shuffle Lookup over 4 Vectors",
        inputDisplay: "2 subvectors, 4-bit PQ codes, batch of 4 vectors",
        outputDisplay: "Distances: [0.30, 0.70, 1.70, 0.60]",
        input: DEFAULT_SIMD_SWIZZLED_ADC_INPUT,
        output: "[0.30, 0.70, 1.70, 0.60]",
        explanation: "Evaluates nibble code lookups via swizzled register shuffle operations.",
      },
      {
        kind: "complex",
        title: "Zero Code Distance Match",
        inputDisplay: "quantizedCodes = [[0, 0]]",
        outputDisplay: "Distance: 0.30",
        input: {
          ...DEFAULT_SIMD_SWIZZLED_ADC_INPUT,
          quantizedCodes: [[0, 0]],
        },
        output: "[0.30]",
        explanation: "LUT[0][0] + LUT[1][0] = 0.1 + 0.2 = 0.30.",
      },
      {
        kind: "negative",
        title: "Max Nibble Code Match (15, 15)",
        inputDisplay: "quantizedCodes = [[15, 15]]",
        outputDisplay: "Distance: 3.00",
        input: {
          ...DEFAULT_SIMD_SWIZZLED_ADC_INPUT,
          quantizedCodes: [[15, 15]],
        },
        output: "[3.00]",
        explanation: "LUT[0][15] + LUT[1][15] = 1.5 + 1.5 = 3.00.",
      },
    ],
    defaultInput: DEFAULT_SIMD_SWIZZLED_ADC_INPUT,
    code: SIMD_SWIZZLED_ADC_CODE,
    timeComplexity: {
      best: "O(N * M / SIMD_WIDTH)",
      average: "O(N * M / SIMD_WIDTH)",
      worst: "O(N * M / SIMD_WIDTH)",
    },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "O(N * M / SIMD_WIDTH) floating-point SIMD throughput, delivering 10-16x speedup over scalar LUT lookups.",
      space: "O(N) memory to hold batch output distances.",
    },
    topicGuide: {
      overview:
        "Modern vector engines (FAISS FastScan, ScaNN) leverage 4-bit PQ (K_sub = 16) specifically because 16 floating-point (or int8) distance values fit into a single 128-bit SIMD register (XMM). Using byte shuffle instructions (`_mm_shuffle_epi8` / `pshufb`), 16 lookup table operations execute in 1 instruction cycle.",
      sections: [
        {
          heading: "Core Concept & Hardware Swizzling",
          body: "Standard memory lookups cause L1 cache thrashing due to non-contiguous table offsets. Swizzling rearranges LUT matrices into SIMD register layouts so `pshufb` can treat vector byte codes as register shuffle indices.",
        },
        {
          heading: "Systems & Throughput Impact",
          body: "FAISS FastScan achieves 500k+ QPS on single CPU cores by streaming 4-bit PQ byte codes straight through AVX-512 SIMD pipelines.",
        },
        {
          heading: "Implementation Nuances & Nibble Packing",
          body: "Two 4-bit codes are packed into a single uint8 byte. High and low nibbles are unpacked using bitwise masks `byte & 0x0F` and `(byte >> 4) & 0x0F`.",
        },
      ],
      keyTerms: [
        {
          term: "pshufb (Parallel Byte Shuffle)",
          definition:
            "x86 SIMD instruction that shuffles bytes in a destination register based on indices in a control register.",
        },
        {
          term: "4-bit PQ (FastScan)",
          definition:
            "Product Quantization using 16 centroids per subvector to fit into SIMD register tables.",
        },
        {
          term: "Register Swizzling",
          definition:
            "Transposing and interleaving lookup data to enable parallel SIMD lane lookups.",
        },
      ],
    },
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "FAISS FastScan SIMD Architecture" }],
    generateSteps: generateSimdSwizzledAdcSteps,
  };
