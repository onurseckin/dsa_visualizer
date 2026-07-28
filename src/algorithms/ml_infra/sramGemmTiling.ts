import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SramGemmTilingInput {
  M: number;
  N: number;
  K: number;
  tileM: number;
  tileN: number;
  tileK: number;
}

export const SRAM_GEMM_TILING_CODE = `def sram_gemm_tiling(M: int, N: int, K: int, tile_m: int, tile_n: int, tile_k: int) -> dict:
    num_tiles_m = (M + tile_m - 1) // tile_m
    num_tiles_n = (N + tile_n - 1) // tile_n
    num_tiles_k = (K + tile_k - 1) // tile_k

    total_tile_steps = num_tiles_m * num_tiles_n * num_tiles_k
    hbm_read_bytes = (num_tiles_m * num_tiles_n * num_tiles_k) * (tile_m * tile_k + tile_k * tile_n) * 2
    flop_count = 2 * M * N * K

    arithmetic_intensity = flop_count / max(1, hbm_read_bytes)

    return {
        "grid_dim": [num_tiles_m, num_tiles_n],
        "k_iterations": num_tiles_k,
        "total_tiles": total_tile_steps,
        "flop_count": flop_count,
        "arithmetic_intensity": round(arithmetic_intensity, 4)
    }`;

export const DEFAULT_SRAM_GEMM_TILING_INPUT: SramGemmTilingInput = {
  M: 64,
  N: 64,
  K: 64,
  tileM: 32,
  tileN: 32,
  tileK: 32,
};

export const generateSramGemmTilingSteps = (input: SramGemmTilingInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { M, N, K, tileM, tileN, tileK } = input;

  const numTilesM = Math.ceil(M / Math.max(1, tileM));
  const numTilesN = Math.ceil(N / Math.max(1, tileN));
  const numTilesK = Math.ceil(K / Math.max(1, tileK));

  const totalTileSteps = numTilesM * numTilesN * numTilesK;
  const flopCount = 2 * M * N * K;
  const hbmReadBytes = totalTileSteps * (tileM * tileK + tileK * tileN) * 2;
  const intensity = flopCount / Math.max(1, hbmReadBytes);

  const getMatrixSnapshot = (
    cellState: "default" | "active" | "compared" | "sorted" | "pivot" | "inactive" = "default",
    activeRow?: number,
    activeCol?: number,
    titleExt?: string,
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numTilesM; r++) {
      for (let c = 0; c < numTilesN; c++) {
        const isCurrent =
          (activeRow !== undefined && r === activeRow) ||
          (activeCol !== undefined && c === activeCol);
        cells.push({
          row: r,
          col: c,
          value: `Tile[${r},${c}]`,
          label: `${tileM}x${tileN}`,
          state: isCurrent ? "active" : cellState,
        });
      }
    }

    return {
      kind: "matrix",
      rows: numTilesM,
      cols: numTilesN,
      title: titleExt
        ? `Threadblock Grid: ${titleExt}`
        : `Threadblock Tile Grid (${numTilesM}x${numTilesN} Tiles, K-Iter=${numTilesK})`,
      rowHeaders: Array.from({ length: numTilesM }, (_, idx) => `Tile Row ${idx}`),
      colHeaders: Array.from({ length: numTilesN }, (_, idx) => `Tile Col ${idx}`),
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    cellState: "default" | "active" | "compared" | "sorted" | "pivot" | "inactive" = "default",
    activeRow?: number,
    activeCol?: number,
    titleExt?: string,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getMatrixSnapshot(cellState, activeRow, activeCol, titleExt),
      auxiliaryState: {
        customState: {
          matrixDimensions: `${M} x ${N} x ${K} (MxNxK)`,
          tileSize: `${tileM} x ${tileN} x ${tileK} (tileM x tileN x tileK)`,
          gridDimensions: `[${numTilesM}, ${numTilesN}] Threadblock Grid`,
          kIterations: `${numTilesK} Reduction Steps`,
          totalSramTilePasses: totalTileSteps,
          flopCount: `${(flopCount / 1e6).toFixed(2)} MFLOPs`,
          hbmReadKb: `${(hbmReadBytes / 1024).toFixed(1)} KB`,
          arithmeticIntensity: `${intensity.toFixed(4)} FLOP/Byte`,
        },
      },
      variables,
    });
  };

  // Line 1: Function signature / setup
  addStep(
    1,
    "Initialize SRAM GEMM Tiling Calculation",
    `Target matrix dimensions M=${M}, N=${N}, K=${K} with SRAM tile size T_M=${tileM}, T_N=${tileN}, T_K=${tileK}.`,
    { M, N, K, tile_m: tileM, tile_n: tileN, tile_k: tileK },
    "default",
    undefined,
    undefined,
    `Matrix ${M}x${N}x${K}, Tile ${tileM}x${tileN}x${tileK}`,
  );

  // Line 2: num_tiles_m
  addStep(
    2,
    `Compute Tile Grid M-Dimension: num_tiles_m = ${numTilesM}`,
    `num_tiles_m = (${M} + ${tileM} - 1) // ${tileM} = ${numTilesM}. Determines the number of threadblock tile rows.`,
    { M, tile_m: tileM, num_tiles_m: numTilesM },
    "compared",
    undefined,
    undefined,
    `Grid Rows num_tiles_m = ${numTilesM}`,
  );

  // Line 3: num_tiles_n
  addStep(
    3,
    `Compute Tile Grid N-Dimension: num_tiles_n = ${numTilesN}`,
    `num_tiles_n = (${N} + ${tileN} - 1) // ${tileN} = ${numTilesN}. Determines the number of threadblock tile columns.`,
    { N, tile_n: tileN, num_tiles_n: numTilesN },
    "compared",
    undefined,
    undefined,
    `Grid Cols num_tiles_n = ${numTilesN}`,
  );

  // Line 4: num_tiles_k
  addStep(
    4,
    `Compute K Contraction Iterations: num_tiles_k = ${numTilesK}`,
    `num_tiles_k = (${K} + ${tileK} - 1) // ${tileK} = ${numTilesK}. Number of sub-block reduction steps along K dimension.`,
    { K, tile_k: tileK, num_tiles_k: numTilesK },
    "active",
    undefined,
    undefined,
    `K Reduction Steps num_tiles_k = ${numTilesK}`,
  );

  // Line 6: total_tile_steps
  addStep(
    6,
    `Compute Total SRAM Tile Loading Steps: total_tile_steps = ${totalTileSteps}`,
    `total_tile_steps = ${numTilesM} * ${numTilesN} * ${numTilesK} = ${totalTileSteps} total sub-matrix SRAM loads.`,
    {
      num_tiles_m: numTilesM,
      num_tiles_n: numTilesN,
      num_tiles_k: numTilesK,
      total_tile_steps: totalTileSteps,
    },
    "active",
    undefined,
    undefined,
    `Total Tile Iterations = ${totalTileSteps}`,
  );

  // Line 7: hbm_read_bytes
  addStep(
    7,
    `Compute Off-Chip HBM Traffic: hbm_read_bytes = ${hbmReadBytes} bytes`,
    `hbm_read_bytes = ${totalTileSteps} * (${tileM}*${tileK} + ${tileK}*${tileN}) * 2 bytes (FP16) = ${hbmReadBytes} bytes (${(hbmReadBytes / 1024).toFixed(1)} KB).`,
    {
      total_tile_steps: totalTileSteps,
      tile_m: tileM,
      tile_n: tileN,
      tile_k: tileK,
      hbm_read_bytes: hbmReadBytes,
    },
    "compared",
    undefined,
    undefined,
    `HBM Accesses = ${(hbmReadBytes / 1024).toFixed(1)} KB`,
  );

  // Line 8: flop_count
  addStep(
    8,
    `Compute Total FLOP Volume: flop_count = ${flopCount}`,
    `flop_count = 2 * ${M} * ${N} * ${K} = ${flopCount} FLOPs (${(flopCount / 1e6).toFixed(2)} MFLOPs). Matrix multiply requires 2 multiply-accumulate ops per element.`,
    { M, N, K, flop_count: flopCount },
    "compared",
    undefined,
    undefined,
    `Compute Operations = ${(flopCount / 1e6).toFixed(2)} MFLOPs`,
  );

  // Line 10: arithmetic_intensity
  addStep(
    10,
    `Compute Arithmetic Intensity: arithmetic_intensity = ${intensity.toFixed(4)} FLOP/byte`,
    `arithmetic_intensity = flop_count / hbm_read_bytes = ${flopCount} / ${hbmReadBytes} = ${intensity.toFixed(4)} FLOP/byte. Roofline metric enabled by SRAM block reuse.`,
    {
      flop_count: flopCount,
      hbm_read_bytes: hbmReadBytes,
      arithmetic_intensity: Number(intensity.toFixed(4)),
    },
    "sorted",
    undefined,
    undefined,
    `Roofline Intensity = ${intensity.toFixed(4)} FLOP/Byte`,
  );

  // Line 12: return
  addStep(
    12,
    `Return Complete SRAM GEMM Tiling Configuration`,
    `Returning dict with grid_dim=[${numTilesM}, ${numTilesN}], k_iterations=${numTilesK}, total_tiles=${totalTileSteps}, flop_count=${flopCount}, and intensity=${intensity.toFixed(4)} FLOP/byte.`,
    {
      grid_dim: `[${numTilesM}, ${numTilesN}]`,
      k_iterations: numTilesK,
      total_tiles: totalTileSteps,
      flop_count: flopCount,
      arithmetic_intensity: Number(intensity.toFixed(4)),
    },
    "sorted",
    undefined,
    undefined,
    `Tiling Scheduler Finished (${intensity.toFixed(4)} FLOP/B)`,
  );

  return steps;
};

const SRAM_GEMM_TILING_TRIVIA: TriviaMeta = {
  skipLines: [1, 5, 9, 11],
  distractors: [
    "total_tile_steps = M * N * K",
    "flop_count = M * N * K",
    "num_tiles_m = M // tile_m",
    "arithmetic_intensity = hbm_read_bytes / flop_count",
  ],
  hints: [
    {
      line: 2,
      hint: "Use ceiling division (M + tile_m - 1) // tile_m to determine threadblock grid counts along each dimension.",
    },
    {
      line: 8,
      hint: "Matrix multiplication performs 2 * M * N * K floating point operations (multiply-accumulate FMA).",
    },
    {
      line: 10,
      hint: "Arithmetic intensity equals total FLOPs divided by HBM memory bytes accessed.",
    },
  ],
  lineExplanations: {
    1: "Defines function for SRAM/Shared Memory GEMM block tile scheduling.",
    2: "Calculates total Threadblock tiles along M dimension.",
    3: "Calculates total Threadblock tiles along N dimension.",
    4: "Calculates total K reduction steps along contraction dimension.",
    6: "Calculates total SRAM block loading steps across grid and K steps.",
    7: "Determines total bytes fetched from High-Bandwidth Memory (HBM).",
    8: "Determines total FLOP volume (2 * M * N * K).",
    10: "Derives Operational Intensity (FLOP/byte) enabled by SRAM tile reuse.",
    12: "Returns dictionary containing GEMM tiling parameters and Roofline metrics.",
  },
};

export const sramGemmTiling: AlgorithmDefinition<SramGemmTilingInput> = {
  id: "sram-gemm-tiling",
  title: "SRAM / On-Chip GEMM Block Tiling Scheduler",
  topicIds: ["ml_gemm_roofline"],
  difficulty: "Medium",
  description:
    "Simulates matrix multiplication GEMM tiling (Cutlass / Triton style), loading sub-matrix blocks from HBM to high-speed SRAM (Shared Memory) to maximize memory reuse and arithmetic intensity.",
  constraints: ["M, N, K > 0", "tileM, tileN, tileK > 0"],
  examples: [
    {
      kind: "basic",
      title: "Symmetric 64x64x64 GEMM (32x32x32 Tiles)",
      inputDisplay: "M=64, N=64, K=64, tileM=32, tileN=32, tileK=32",
      outputDisplay: "grid = [2, 2], k_iter = 2, total_tiles = 8, intensity ≈ 16.0",
      input: DEFAULT_SRAM_GEMM_TILING_INPUT,
      output: "{grid_dim: [2, 2], k_iterations: 2, total_tiles: 8, arithmetic_intensity: 16.0}",
      explanation:
        "Divides 64x64 output into a 2x2 grid of threadblocks with 2 K-reduction steps. Total FLOPs = 2*64^3 = 524,288.",
    },
    {
      kind: "complex",
      title: "Asymmetric 128x256x512 GEMM (64x64x128 Tiles)",
      inputDisplay: "M=128, N=256, K=512, tileM=64, tileN=64, tileK=128",
      outputDisplay: "grid = [2, 4], k_iter = 4, total_tiles = 32",
      input: {
        M: 128,
        N: 256,
        K: 512,
        tileM: 64,
        tileN: 64,
        tileK: 128,
      },
      output: "{grid_dim: [2, 4], k_iterations: 4, total_tiles: 32}",
      explanation: "Large GEMM workload tiled across 8 threadblocks doing 4 K-accumulations each.",
    },
    {
      kind: "negative",
      title: "Tile Size Larger Than Matrix Dimension",
      inputDisplay: "M=16, N=16, K=16, tileM=32, tileN=32, tileK=32",
      outputDisplay: "grid = [1, 1], k_iter = 1, total_tiles = 1",
      input: {
        M: 16,
        N: 16,
        K: 16,
        tileM: 32,
        tileN: 32,
        tileK: 32,
      },
      output: "{grid_dim: [1, 1], k_iterations: 1, total_tiles: 1}",
      explanation: "Tile sizes exceeding matrix bounds clamp to a single tile execution.",
    },
  ],
  code: SRAM_GEMM_TILING_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(1)",
    worst: "O(1)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Direct closed-form arithmetic calculation running in constant O(1) time.",
    space: "Uses constant auxiliary space to hold tile schedule metadata.",
  },
  topicGuide: {
    overview:
      "Modern GPU matrix multiplication engines (NVIDIA Tensor Cores, AMD Matrix Core) rely on SRAM/Shared Memory tiling to overcome HBM memory bandwidth bottlenecks. Instead of streaming individual scalar elements from VRAM, threadblocks load 2D tile blocks into 228KB+ L1/Shared Memory and perform hundreds of FMA ops per byte loaded.",
    sections: [
      {
        heading: "Memory Hierarchy & Tiling",
        body: "Registers (Fastest) < SRAM / Shared Memory < L2 Cache < HBM / VRAM (Slowest). Tiling loads sub-blocks of A (T_M x T_K) and B (T_K x T_N) into SRAM once, allowing each loaded element to be reused T_N or T_M times in register FMA pipelines.",
      },
      {
        heading: "Roofline Impact",
        body: "Increasing tile sizes T_M and T_N increases arithmetic intensity I = 2 * T_M * T_N / (2 * (T_M + T_N)), shifting the kernel from memory-bound to compute-bound.",
      },
    ],
    keyTerms: [
      {
        term: "SRAM / Shared Memory",
        definition: "On-chip high-speed memory local to a GPU Streaming Multiprocessor (SM).",
      },
      {
        term: "Threadblock Grid",
        definition:
          "2D lattice of GPU threadblocks assigned to compute distinct output tiles of matrix C.",
      },
    ],
  },
  trivia: SRAM_GEMM_TILING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra" }],
  defaultInput: DEFAULT_SRAM_GEMM_TILING_INPUT,
  generateSteps: generateSramGemmTilingSteps,
};
