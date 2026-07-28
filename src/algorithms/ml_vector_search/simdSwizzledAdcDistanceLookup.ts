import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";

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
    accumulated_distances = []

    for vec_idx, codes in enumerate(quantized_codes):
        total_dist = 0.0
        for m, sub_code in enumerate(codes):
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

  const numSubvectors = queryLut.length;
  const numVectors = quantizedCodes.length;
  const numCols = numSubvectors + 1; // Subvector columns + Total Distance column

  const rowHeaders = quantizedCodes.map((_, idx) => `Vec ${idx}`);
  const colHeaders = [...queryLut.map((_, m) => `Subvec ${m}`), "Total Dist"];

  const buildMatrixCells = (
    activeRow: number | null,
    activeCol: number | null,
    stepStage: "init" | "init_vector" | "lookup" | "accumulate" | "appended" | "complete",
    computedDists: (number | null)[],
    runningTotals: (number | null)[],
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < numVectors; r++) {
      const codes = quantizedCodes[r];
      const isPastRow = activeRow !== null && r < activeRow;
      const isCurrentRow = activeRow === r;

      for (let m = 0; m < numSubvectors; m++) {
        const subCode = codes[m];
        const lutVal = queryLut[m][subCode];
        let cellState: MatrixCellItem["state"] = "default";

        if (stepStage === "complete" || isPastRow) {
          cellState = "sorted";
        } else if (isCurrentRow) {
          if (m === activeCol) {
            cellState = "active";
          } else if (activeCol !== null && m < activeCol) {
            cellState = "compared";
          } else {
            cellState = "default";
          }
        }

        cells.push({
          row: r,
          col: m,
          value: `${subCode} (L=${lutVal.toFixed(2)})`,
          label: `LUT[${m}][${subCode}]`,
          state: cellState,
        });
      }

      const totalCellCol = numSubvectors;
      const computed = computedDists[r];
      const running = runningTotals[r];
      let totalState: MatrixCellItem["state"] = "default";
      let displayValue: string | number = "?";

      if (stepStage === "complete" || (computed !== null && computed !== undefined)) {
        totalState = "sorted";
        displayValue = computed !== null && computed !== undefined ? computed.toFixed(4) : "?";
      } else if (isCurrentRow) {
        if (stepStage === "accumulate" || stepStage === "lookup") {
          totalState = "active";
        } else if (stepStage === "init_vector") {
          totalState = "compared";
        }
        displayValue = running !== null && running !== undefined ? running.toFixed(4) : "0.0000";
      }

      cells.push({
        row: r,
        col: totalCellCol,
        value: displayValue,
        label: `Vector ${r} Total`,
        state: totalState,
      });
    }

    return cells;
  };

  const completedDists: (number | null)[] = new Array(numVectors).fill(null);
  const runningTotals: (number | null)[] = new Array(numVectors).fill(null);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Initialize SIMD Swizzled ADC Distance Lookup Kernel",
      why: `Preparing batch evaluation for ${numVectors} quantized vectors across M = ${numSubvectors} 4-bit PQ subvector codebooks via SIMD register shuffles.`,
    },
    primarySnapshot: {
      kind: "matrix",
      rows: numVectors,
      cols: numCols,
      rowHeaders,
      colHeaders,
      title: "SIMD Swizzled ADC Register Lookups",
      cells: buildMatrixCells(null, null, "init", completedDists, runningTotals),
    },
    auxiliaryState: {
      customState: {
        numSubvectors: String(numSubvectors),
        batchSize: String(numVectors),
        simdMode: "AVX-512 pshufb SIMD Lane",
        status: "Initialized",
      },
    },
    variables: { batchSize: numVectors, numSubvectors },
  });

  const accumulatedDists: number[] = [];

  for (let vIdx = 0; vIdx < numVectors; vIdx++) {
    const codes = quantizedCodes[vIdx];
    let totalDist = 0.0;
    runningTotals[vIdx] = 0.0;

    // Step: Init vector accum
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Initialize Accumulator for Vector ${vIdx} (codes: [${codes.join(", ")}])`,
        why: `Set total_dist = 0.0 for Vector ${vIdx}. Preparing inner loop over ${codes.length} subvectors.`,
      },
      primarySnapshot: {
        kind: "matrix",
        rows: numVectors,
        cols: numCols,
        rowHeaders,
        colHeaders,
        title: `Processing Vector ${vIdx}`,
        cells: buildMatrixCells(vIdx, null, "init_vector", completedDists, runningTotals),
      },
      auxiliaryState: {
        customState: {
          activeVector: `Vector ${vIdx}`,
          codes: `[${codes.join(", ")}]`,
          currentTotal: "0.0000",
        },
      },
      variables: { vIdx, totalDist: 0 },
    });

    for (let m = 0; m < codes.length; m++) {
      const subCode = codes[m];
      const distVal = queryLut[m][subCode];

      // Step: Lookup
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 7,
        explanation: {
          what: `Vector ${vIdx}, Subvector ${m}: Fetch LUT[${m}][${subCode}]`,
          why: `SIMD byte shuffle (pshufb) retrieves query LUT distance ${distVal.toFixed(4)} for nibble code ${subCode}.`,
        },
        primarySnapshot: {
          kind: "matrix",
          rows: numVectors,
          cols: numCols,
          rowHeaders,
          colHeaders,
          title: `Vector ${vIdx} Subvector ${m} SIMD Shuffle`,
          cells: buildMatrixCells(vIdx, m, "lookup", completedDists, runningTotals),
        },
        auxiliaryState: {
          customState: {
            activeVector: `Vector ${vIdx}`,
            subvector: String(m),
            subCode: String(subCode),
            distVal: distVal.toFixed(4),
            currentTotal: totalDist.toFixed(4),
          },
        },
        variables: { vIdx, m, subCode, distVal: Math.round(distVal * 10000) / 10000 },
      });

      totalDist += distVal;
      runningTotals[vIdx] = totalDist;

      // Step: Accumulate
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Vector ${vIdx}, Subvector ${m}: Accumulate distance +${distVal.toFixed(4)}`,
          why: `Added subvector ${m} distance to running total. New total distance: ${totalDist.toFixed(4)}.`,
        },
        primarySnapshot: {
          kind: "matrix",
          rows: numVectors,
          cols: numCols,
          rowHeaders,
          colHeaders,
          title: `Vector ${vIdx} Subvector ${m} Accumulated`,
          cells: buildMatrixCells(vIdx, m, "accumulate", completedDists, runningTotals),
        },
        auxiliaryState: {
          customState: {
            activeVector: `Vector ${vIdx}`,
            subvector: String(m),
            subCode: String(subCode),
            accumulatedTotal: totalDist.toFixed(4),
          },
        },
        variables: { vIdx, m, totalDist: Math.round(totalDist * 10000) / 10000 },
      });
    }

    const roundedDist = Math.round(totalDist * 10000) / 10000;
    accumulatedDists.push(roundedDist);
    completedDists[vIdx] = roundedDist;

    // Step: Append
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Store Final Distance ${roundedDist.toFixed(4)} for Vector ${vIdx}`,
        why: `Appended accumulated SIMD distance ${roundedDist.toFixed(4)} for Vector ${vIdx} into batch result array.`,
      },
      primarySnapshot: {
        kind: "matrix",
        rows: numVectors,
        cols: numCols,
        rowHeaders,
        colHeaders,
        title: `Vector ${vIdx} Completed`,
        cells: buildMatrixCells(vIdx, null, "appended", completedDists, runningTotals),
      },
      auxiliaryState: {
        customState: {
          activeVector: `Vector ${vIdx}`,
          finalDistance: roundedDist.toFixed(4),
          batchProgress: `${vIdx + 1}/${numVectors}`,
        },
      },
      variables: { vIdx, finalDist: roundedDist },
    });
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: "SIMD Swizzled ADC Distance Lookup Complete for Batch",
      why: `Batch accumulated distances: [${accumulatedDists
        .map((d) => d.toFixed(4))
        .join(", ")}]. Microsecond SIMD throughput achieved across all vectors.`,
    },
    primarySnapshot: {
      kind: "matrix",
      rows: numVectors,
      cols: numCols,
      rowHeaders,
      colHeaders,
      title: "SIMD Swizzled ADC Lookup Batch Completed",
      cells: buildMatrixCells(null, null, "complete", completedDists, runningTotals),
    },
    auxiliaryState: {
      customState: {
        batchDistances: accumulatedDists.map((d) => d.toFixed(4)).join(", "),
        status: "Completed",
      },
    },
    variables: { batchSize: numVectors, complete: true },
  });

  return steps;
};

export const simdSwizzledAdcDistanceLookup: AlgorithmDefinition<SimdSwizzledAdcDistanceLookupInput> =
  {
    id: "simd-swizzled-adc-distance-lookup",
    title: "SIMD Swizzled ADC Distance Lookup",
    topicIds: ["ml_vector_search", "ml_hardware_kernels"],
    difficulty: "Hard",
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
