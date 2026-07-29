import { trace } from "./shared";

export const tiledGemmMemoryTrace = trace({
  id: "tiled-gemm-memory-trace",
  title: "Trace Tiled GEMM Memory Reuse",
  topicId: "ml_accelerator_performance",
  entrypoint: "trace_tiled_gemm",
  contract:
    "Return square GEMM tile count, naive reads, tiled reads, and reuse factor as a memory-access model, not a GPU execution.",
  code: `def trace_tiled_gemm(record):
    n = record["n"]
    tile = record["tile"]
    tiles = (n + tile - 1) // tile
    naive = 2 * n * n * n
    tiled = 2 * tiles * n * n
    return {"tile_count": tiles, "naive_reads": naive, "tiled_reads": tiled, "reuse_factor": round(naive / tiled, 6)}`,
  cases: [
    {
      id: "four-by-four",
      label: "Four square tiles",
      input: { n: 8, tile: 2 },
      expected: { tile_count: 4, naive_reads: 1024, tiled_reads: 512, reuse_factor: 2 },
      comparison: "deep-equal",
    },
    {
      id: "one-tile",
      label: "One complete tile",
      input: { n: 4, tile: 4 },
      expected: { tile_count: 1, naive_reads: 128, tiled_reads: 32, reuse_factor: 4 },
      comparison: "deep-equal",
    },
    {
      id: "partial-tile",
      label: "Partial edge tile",
      input: { n: 5, tile: 2 },
      expected: { tile_count: 3, naive_reads: 250, tiled_reads: 150, reuse_factor: 1.666667 },
      comparison: "deep-equal",
    },
  ],
  source: [
    "CUDA matrix multiplication best practices",
    "https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#shared-memory-in-matrix-multiplication-c-ab",
  ],
  values: (r) => {
    const n = Number(r.n);
    const tiles = Math.ceil(n / Number(r.tile));
    const naive = 2 * n ** 3;
    const tiled = 2 * tiles * n ** 2;
    return [
      ["matrix dimension", n],
      ["naive reads", naive],
      ["tiled reads", tiled],
      ["reuse factor", naive / tiled],
    ];
  },
});
