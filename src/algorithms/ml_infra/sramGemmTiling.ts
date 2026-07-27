import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
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
    # Memory loaded from HBM in FP16 (2 bytes/elem)
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

  const elements: ArrayElement[] = [
    { id: "dim-m", value: M, state: "default", pointers: ["M"] },
    { id: "dim-n", value: N, state: "default", pointers: ["N"] },
    { id: "dim-k", value: K, state: "default", pointers: ["K"] },
  ];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: customState || {
          matrixShape: `${M}x${N}x${K}`,
          tileShape: `${tileM}x${tileN}x${tileK}`,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize SRAM GEMM Tiling Calculation",
    `Matrix dimensions M=${M}, N=${N}, K=${K} with SRAM tile size T_M=${tileM}, T_N=${tileN}, T_K=${tileK}.`,
    { M, N, K, tileM, tileN, tileK },
  );

  const numTilesM = Math.ceil(M / Math.max(1, tileM));
  const numTilesN = Math.ceil(N / Math.max(1, tileN));
  const numTilesK = Math.ceil(K / Math.max(1, tileK));

  addStep(
    2,
    `Compute Tile Grid: num_tiles_m=${numTilesM}, num_tiles_n=${numTilesN}, num_tiles_k=${numTilesK}`,
    `num_tiles_m = ceil(${M} / ${tileM}) = ${numTilesM}. num_tiles_n = ceil(${N} / ${tileN}) = ${numTilesN}. num_tiles_k = ceil(${K} / ${tileK}) = ${numTilesK}. Grid: [${numTilesM} × ${numTilesN}] Threadblocks.`,
    { numTilesM, numTilesN, numTilesK },
    elements.map((el) => ({ ...el, state: "active" })),
    { gridDim: `[${numTilesM}, ${numTilesN}]`, k_iterations: numTilesK },
  );

  const totalTileSteps = numTilesM * numTilesN * numTilesK;
  const flopCount = 2 * M * N * K;
  const hbmReadBytes = totalTileSteps * (tileM * tileK + tileK * tileN) * 2;
  const intensity = flopCount / Math.max(1, hbmReadBytes);

  addStep(
    6,
    `Compute total_tile_steps = ${totalTileSteps}, flop_count = ${flopCount}`,
    `total_tile_steps = ${numTilesM} × ${numTilesN} × ${numTilesK} = ${totalTileSteps} SRAM tile load iterations. flop_count = 2 × ${M} × ${N} × ${K} = ${flopCount} FLOPs.`,
    { totalTileSteps, flopCount },
    elements.map((el) => ({ ...el, state: "sorted" })),
    { totalTileSteps, flopCount: `${(flopCount / 1e6).toFixed(2)} MFLOPs` },
  );

  addStep(
    8,
    `Compute hbm_read_bytes = ${hbmReadBytes} (${(hbmReadBytes / 1024).toFixed(1)} KB)`,
    `hbm_read_bytes = ${totalTileSteps} iterations × (${tileM}×${tileK} + ${tileK}×${tileN}) × 2 bytes (FP16) = ${hbmReadBytes} bytes. This is memory loaded from HBM (off-chip) to SRAM per tile.`,
    { totalTileSteps, hbmReadBytes },
    elements.map((el) => ({ ...el, state: "sorted" })),
    { hbmReadKb: (hbmReadBytes / 1024).toFixed(1) },
  );

  addStep(
    11,
    `Compute arithmetic_intensity = ${intensity.toFixed(4)} FLOP/byte`,
    `arithmetic_intensity = ${flopCount} FLOPs / ${hbmReadBytes} bytes = ${intensity.toFixed(4)} FLOP/byte. Higher intensity = better GPU utilization (roofline model).`,
    { arithmetic_intensity: Number(intensity.toFixed(4)), total_tiles: totalTileSteps },
    elements.map((el) => ({ ...el, state: "sorted", pointers: ["TILED GEMM DONE"] })),
    { arithmetic_intensity: intensity.toFixed(4), total_tiles: totalTileSteps },
  );

  addStep(
    13,
    `return {grid_dim, k_iterations, total_tiles, flop_count, arithmetic_intensity}`,
    `Returning complete GEMM tiling configuration: ${numTilesM}×${numTilesN} grid, ${numTilesK} K-iterations, ${intensity.toFixed(2)} FLOP/byte intensity.`,
    { arithmetic_intensity: Number(intensity.toFixed(4)), total_tiles: totalTileSteps, numTilesM, numTilesN, numTilesK },
    elements.map((el) => ({ ...el, state: "sorted", pointers: ["TILED GEMM DONE"] })),
    { result: "complete" },
  );

  return steps;
};

const SRAM_GEMM_TILING_TRIVIA: TriviaMeta = {
  skipLines: [1],
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
      line: 7,
      hint: "Matrix multiplication performs 2 * M * N * K floating point operations (multiply-accumulate FMA).",
    },
    {
      line: 10,
      hint: "Arithmetic intensity equals total FLOPs divided by HBM memory bytes accessed.",
    },
  ],
  lineExplanations: {
    1: "Defines function for SRAM/Shared Memory GEMM block tile scheduling.",
    2: "Calculates total Threadblock tiles along M, N, and inner K contraction dimension.",
    7: "Determines total FLOP volume and total bytes fetched from High-Bandwidth Memory (HBM).",
    10: "Derives Operational Intensity (FLOP/byte) enabled by SRAM tile reuse.",
  },
};

export const sramGemmTiling: AlgorithmDefinition<SramGemmTilingInput> = {
  id: "sram-gemm-tiling",
  title: "SRAM / On-Chip GEMM Block Tiling Scheduler",
  category: "ml_gemm_roofline",
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 1,
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
