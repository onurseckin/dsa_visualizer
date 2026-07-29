import { trace } from "./shared";

export const tiledGemmMemoryTrace = trace({
  id: "tiled-gemm-memory-trace",
  title: "Trace Tiled GEMM Memory Reuse",
  topicId: "ml_accelerator_performance",
  entrypoint: "trace_tiled_gemm",
  contract:
    "Compare naïve per-output operand accesses with modeled tiled loads and reuse, returning total reads, reads saved, and reuse factor; this is a memory-access model, not a GPU execution.",
  code: `def trace_tiled_gemm(record):
    n = record["n"]
    tile = record["tile"]
    tiles = (n + tile - 1) // tile
    naive = 2 * n * n * n
    tiled = 2 * tiles * n * n
    return {"tiles_per_axis": tiles, "naive_reads": naive, "tiled_reads": tiled, "naive_reads_per_output": 2 * n, "tiled_reads_per_output": 2 * tiles, "reads_saved": naive - tiled, "reuse_factor": round(naive / tiled, 6)}`,
  cases: [
    {
      id: "four-by-four",
      label: "Four square tiles",
      input: { n: 8, tile: 2 },
      expected: {
        tiles_per_axis: 4,
        naive_reads: 1024,
        tiled_reads: 512,
        naive_reads_per_output: 16,
        tiled_reads_per_output: 8,
        reads_saved: 512,
        reuse_factor: 2,
      },
      comparison: "deep-equal",
    },
    {
      id: "one-tile",
      label: "One complete tile",
      input: { n: 4, tile: 4 },
      expected: {
        tiles_per_axis: 1,
        naive_reads: 128,
        tiled_reads: 32,
        naive_reads_per_output: 8,
        tiled_reads_per_output: 2,
        reads_saved: 96,
        reuse_factor: 4,
      },
      comparison: "deep-equal",
    },
    {
      id: "partial-tile",
      label: "Partial edge tile",
      input: { n: 5, tile: 2 },
      expected: {
        tiles_per_axis: 3,
        naive_reads: 250,
        tiled_reads: 150,
        naive_reads_per_output: 10,
        tiled_reads_per_output: 6,
        reads_saved: 100,
        reuse_factor: 1.666667,
      },
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
    const naiveAccesses = Array.from({ length: n }, (_, index) => `A[0,${index}]+B[${index},0]`);
    const tileRanges = Array.from({ length: tiles }, (_, index) => {
      const start = index * Number(r.tile);
      return `[${start}:${Math.min(start + Number(r.tile), n)})`;
    });
    return [
      ["matrix dimension", n],
      ["naive C[0,0] operand accesses", naiveAccesses.join(" -> ")],
      ["tiled k-ranges", tileRanges.join(",")],
      ["operands reused within full tile", Math.min(Number(r.tile), n)],
      ["naive reads", naive],
      ["tiled reads", tiled],
      ["reads saved", naive - tiled],
      ["reuse factor", naive / tiled],
    ];
  },
});
