import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface autotuneConfigGridSearchEngineInput {
  configs?: Record<string, number>[];
  warmup?: number;
  rep?: number;
  data?: number[];
  target?: number;
}

export const AUTOTUNECONFIGGRIDSEARCHENGINE_CODE = `def autotune_grid_search(configs: list[dict], benchmark_fn, warmup: int = 10, rep: int = 40) -> tuple[dict, float]:
    best_config = None
    best_time_ms = float('inf')
    results = []
    for cfg in configs:
        for _ in range(warmup):
            benchmark_fn(cfg)
        start_event = record_cuda_event()
        for _ in range(rep):
            benchmark_fn(cfg)
        end_event = record_cuda_event()
        elapsed_ms = elapsed_time(start_event, end_event) / rep
        results.append((cfg, elapsed_ms))
        if elapsed_ms < best_time_ms:
            best_time_ms = elapsed_ms
            best_config = cfg
    return best_config, best_time_ms`;

export const DEFAULT_AUTOTUNECONFIGGRIDSEARCHENGINE_INPUT: autotuneConfigGridSearchEngineInput = {
  configs: [
    { BLOCK_M: 64, BLOCK_N: 64, num_warps: 4, num_stages: 2 },
    { BLOCK_M: 128, BLOCK_N: 64, num_warps: 4, num_stages: 3 },
    { BLOCK_M: 128, BLOCK_N: 128, num_warps: 8, num_stages: 4 },
    { BLOCK_M: 256, BLOCK_N: 128, num_warps: 8, num_stages: 5 },
  ],
  warmup: 10,
  rep: 40,
  data: [64, 128, 128, 256],
  target: 0,
};

export const generateAUTOTUNECONFIGGRIDSEARCHENGINESteps = (
  input: autotuneConfigGridSearchEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const configs = input.configs || DEFAULT_AUTOTUNECONFIGGRIDSEARCHENGINE_INPUT.configs!;
  const warmup = input.warmup ?? 10;
  const rep = input.rep ?? 40;
  const n = configs.length;

  const simulatedTimes: number[] = [2.45, 1.12, 0.78, 1.42];

  const getSnapshot = (currentIdx: number = -1, bestIdx: number = -1): MatrixVisualSnapshot => {
    const rows = n + 1;
    const cols = 5;
    const cells: MatrixCellItem[] = [];

    const headers = ["Config ID", "BLOCK_M", "BLOCK_N", "Warps", "Latency (ms)"];
    for (let c = 0; c < 5; c++) {
      cells.push({ row: 0, col: c, value: headers[c], label: "Header", state: "default" });
    }

    for (let r = 0; r < n; r++) {
      const rowIdx = r + 1;
      const cfg = configs[r];
      const isCurrent = r === currentIdx;
      const isBest = r === bestIdx;
      const state = isBest
        ? "sorted"
        : isCurrent
          ? "active"
          : r < currentIdx
            ? "compared"
            : "default";

      cells.push(
        { row: rowIdx, col: 0, value: `Cfg #${r}`, state },
        { row: rowIdx, col: 1, value: cfg.BLOCK_M ?? 64, state },
        { row: rowIdx, col: 2, value: cfg.BLOCK_N ?? 64, state },
        { row: rowIdx, col: 3, value: cfg.num_warps ?? 4, state },
        { row: rowIdx, col: 4, value: r <= currentIdx ? simulatedTimes[r].toFixed(2) : "-", state },
      );
    }

    return {
      kind: "matrix",
      rows,
      cols,
      title: "Triton Autotune Benchmark Matrix",
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentIdx: number = -1,
    bestIdx: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(currentIdx, bestIdx),
      auxiliaryState: {
        customState: {
          Algorithm: "Triton @triton.autotune Grid Search Engine",
          "Candidate Configurations": String(n),
          "Warmup Iterations": String(warmup),
          "Benchmark Repetitions": String(rep),
          "Timer Method": "CUDA Events (cudaEventElapsedTime)",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Triton Autotune Grid Search Engine Entry",
    `Started Triton autotuning across ${n} candidate configurations with warmup=${warmup}, rep=${rep}.`,
    { n, warmup, rep },
  );

  // Step 2: best_config = None (2)
  let bestConfig: Record<string, number> | null = null;
  addStep(2, "Initialize best_config = None", "Set optimal configuration pointer to None.", {
    best_config: "None",
  });

  // Step 3: best_time_ms = inf (3)
  let bestTimeMs = Infinity;
  let bestIdx = -1;
  addStep(
    3,
    "Initialize best_time_ms = inf",
    "Set minimum execution latency accumulator to infinity.",
    { best_time_ms: "inf" },
  );

  // Step 4: results = [] (4)
  const results: [Record<string, number>, number][] = [];
  addStep(
    4,
    "Initialize Empty results [] Buffer",
    "Allocated results array to log configuration benchmarking latencies.",
    { results_count: 0 },
  );

  // Configuration grid loop
  for (let idx = 0; idx < n; idx++) {
    const cfg = configs[idx];

    addStep(
      5,
      `Outer Grid Search Loop: Configuration #${idx}`,
      `Loading candidate configuration #${idx}: BLOCK_M=${cfg.BLOCK_M}, BLOCK_N=${cfg.BLOCK_N}, warps=${cfg.num_warps}, stages=${cfg.num_stages}.`,
      { idx, ...cfg },
      idx,
      bestIdx,
    );

    // Warmup loop
    addStep(
      6,
      `Step 1: Execute Warmup Iterations (warmup = ${warmup})`,
      `Triggered PTX compilation and ${warmup} GPU warmup runs to prime L2 cache and GPU clocks.`,
      { idx, warmup },
      idx,
      bestIdx,
    );

    for (let w = 1; w <= Math.min(3, warmup); w++) {
      addStep(
        7,
        `Warmup Run ${w}/${warmup} for Cfg #${idx}`,
        `Executed GPU kernel warmup run ${w}.`,
        { idx, warmup_step: w },
        idx,
        bestIdx,
      );
    }

    // Benchmark loop
    addStep(
      8,
      "Step 2: Record Start CUDA Event",
      "Inserted cudaEventRecord(start_event) into CUDA stream.",
      { idx, event: "start" },
      idx,
      bestIdx,
    );

    addStep(
      9,
      `Timed Execution Loop (rep = ${rep})`,
      `Initiating ${rep} repetitions for configuration #${idx}.`,
      { idx, rep },
      idx,
      bestIdx,
    );

    for (let r = 1; r <= Math.min(3, rep); r++) {
      addStep(
        10,
        `Timed Execution Run ${r}/${rep} for Cfg #${idx}`,
        `Executed timed kernel repetition ${r}.`,
        { idx, rep_step: r },
        idx,
        bestIdx,
      );
    }

    addStep(
      11,
      "Record End CUDA Event & Synchronize",
      "Inserted cudaEventRecord(end_event) and called cudaEventSynchronize().",
      { idx, event: "end" },
      idx,
      bestIdx,
    );

    const elapsedMs = simulatedTimes[idx];
    addStep(
      12,
      `Calculate Average Latency: elapsed_ms = ${elapsedMs.toFixed(2)} ms`,
      `Evaluated mean latency = cudaEventElapsedTime / ${rep} = ${elapsedMs.toFixed(2)} ms.`,
      { idx, elapsed_ms: elapsedMs },
      idx,
      bestIdx,
    );

    results.push([cfg, elapsedMs]);
    addStep(
      13,
      `Append (Cfg #${idx}, ${elapsedMs.toFixed(2)} ms) to Results`,
      `Recorded benchmarking result into results table.`,
      { idx, elapsed_ms: elapsedMs },
      idx,
      bestIdx,
    );

    addStep(
      14,
      `Check Min Latency Condition: ${elapsedMs.toFixed(2)} ms < ${bestTimeMs === Infinity ? "inf" : bestTimeMs.toFixed(2) + " ms"}`,
      elapsedMs < bestTimeMs
        ? `True (${elapsedMs.toFixed(2)} ms < ${bestTimeMs === Infinity ? "inf" : bestTimeMs.toFixed(2) + " ms"}) -> New optimal configuration!`
        : `False (${elapsedMs.toFixed(2)} ms >= ${bestTimeMs.toFixed(2)} ms) -> Retain current best.`,
      { elapsed_ms: elapsedMs, best_time_ms: bestTimeMs === Infinity ? 999 : bestTimeMs },
      idx,
      bestIdx,
    );

    if (elapsedMs < bestTimeMs) {
      bestTimeMs = elapsedMs;
      bestConfig = cfg;
      bestIdx = idx;

      addStep(
        15,
        `Update Best Latency: best_time_ms = ${bestTimeMs.toFixed(2)} ms`,
        `Set best_time_ms = ${bestTimeMs.toFixed(2)} ms.`,
        { best_time_ms: bestTimeMs },
        idx,
        bestIdx,
      );

      addStep(
        16,
        `Update Best Config: best_config = Cfg #${idx}`,
        `Updated best_config pointer to Cfg #${idx}: BLOCK_M=${cfg.BLOCK_M}, BLOCK_N=${cfg.BLOCK_N}, warps=${cfg.num_warps}.`,
        { best_config: JSON.stringify(bestConfig ?? cfg) },
        idx,
        bestIdx,
      );
    }
  }

  // Return step
  addStep(
    17,
    `Execution Complete: Return Best Config Cfg #${bestIdx} (${bestTimeMs.toFixed(2)} ms)`,
    `Successfully autotuned Triton kernel across ${n} setups. Optimal setup Cfg #${bestIdx} achieved ${bestTimeMs.toFixed(2)} ms latency.`,
    { best_time_ms: bestTimeMs, best_config_id: bestIdx, completed: true },
    -1,
    bestIdx,
  );

  return steps;
};

const AUTOTUNECONFIGGRIDSEARCHENGINE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "best_config = configs[0]",
    "elapsed_ms = elapsed_time * rep",
    "warmup = rep * 2",
    "best_time_ms = sum(results)",
  ],
  hints: [
    {
      line: 12,
      hint: "Average execution latency formula using CUDA events: elapsed_time(start_event, end_event) / rep.",
    },
    { line: 14, hint: "Track minimum latency configuration: if elapsed_ms < best_time_ms." },
  ],
  lineExplanations: {
    1: "Defines entry point for autotune_grid_search function simulating @triton.autotune.",
    2: "Initializes best_config pointer to None.",
    3: "Initializes minimum latency tracker best_time_ms to infinity.",
    4: "Initializes empty results list to log configuration benchmark times.",
    5: "Iterates over candidate kernel configuration cfg in configs list.",
    6: "Executes warmup loop for warmup iterations to prime JIT compiler and L2 cache.",
    7: "Triggers JIT kernel compilation and execution for cfg during warmup.",
    8: "Records start CUDA event start_event = record_cuda_event().",
    9: "Executes repetition benchmark loop for rep iterations.",
    10: "Triggers kernel execution for cfg.",
    11: "Records end CUDA event end_event = record_cuda_event().",
    12: "Calculates mean execution latency elapsed_ms = elapsed_time(start_event, end_event) / rep.",
    13: "Appends tuple of (cfg, elapsed_ms) to results list.",
    14: "Checks if current configuration elapsed_ms < best_time_ms.",
    15: "Updates best_time_ms = elapsed_ms.",
    16: "Updates best_config = cfg.",
    17: "Returns tuple of (best_config, best_time_ms).",
  },
};

export const autotuneConfigGridSearchEngine: AlgorithmDefinition<autotuneConfigGridSearchEngineInput> =
  {
    id: "autotune-config-grid-search-engine",
    title: "Triton Autotune Config Grid Search Engine",
    topicIds: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Medium",
    description:
      "The Triton Autotune Config Grid Search Engine simulates OpenAI Triton's `@triton.autotune` decorator harness. Modern GPU hardware performance (NVIDIA H100, A100) varies drastically based on block tiling dimensions (`BLOCK_M`, `BLOCK_N`, `BLOCK_K`), warp counts (`num_warps`), and pipeline stage depths (`num_stages`). Autotuning compiles PTX kernels for candidate `triton.Config` setups, runs GPU warmup, and measures execution latency using CUDA Events (`cudaEventRecord`) to discover the optimal configuration.\n\n### Why It Exists\nManually tuning GPU kernel tile sizes for different matrix shapes and hardware architectures is labor-intensive and fragile. Triton's `@triton.autotune` automatically benchmarks hundreds of candidate tile configurations at runtime, selecting the exact setup that achieves maximum TFLOPS roofline performance.\n\n### Mathematical Formulation\nFor candidate configuration $c \\in C = \\{\\text{Config}_1, \\text{Config}_2, \\dots, \\text{Config}_K\\}$, warmup iterations $W$, and repetition benchmark count $R$:\n\n$$1. \\quad T_{elapsed}(c) = \\frac{\\text{cudaEventElapsedTime}(\\text{start}, \\text{end})}{R} \\quad (\\text{Mean Latency in ms})$$\n\n$$2. \\quad c^* = \\arg\\min_{c \\in C} T_{elapsed}(c) \\quad (\\text{Optimal Configuration})$$\n\n$$3. \\quad \\text{TFLOPS}(c^*) = \\frac{2 \\cdot M \\cdot N \\cdot K}{T_{elapsed}(c^*) \\cdot 10^9}$$\n\n### Step-by-Step Intuition\n1. **Configuration Iteration**: Loop over candidate tile configurations `cfg` in grid search space.\n2. **JIT Compilation & Warmup**: Run $W$ warmup iterations to trigger JIT PTX compilation, warm L2 GPU cache, and lock GPU clock frequencies.\n3. **CUDA Event Timing**: Record `start_event`, run kernel $R$ times, record `end_event`, and synchronize.\n4. **Mean Latency Calculation**: Compute mean execution time $T_{elapsed} = \\frac{T_{end} - T_{start}}{R}$.\n5. **Min-Latency Tracking**: Track and store the configuration $c^*$ yielding minimum execution time.\n\n### Key Trade-Offs & Hardware Execution\n- **Compilation Overhead vs Runtime TFLOPS**: JIT compiling 50 candidate PTX configurations takes several seconds during cold-start, but yields 20%-50% higher runtime TFLOPS for the remainder of model execution.\n- **L2 Cache Flushing**: To prevent L2 cache warm-up bias during benchmarking, production autotuners flush L2 cache between config runs.",
    constraints: ["1 <= configs.length <= 256", "warmup >= 1", "rep >= 1"],
    examples: [
      {
        kind: "basic",
        title: "Autotuning 4 Triton GEMM Tile Configurations",
        inputDisplay: "4 candidate configs (BLOCK_M=64..256), warmup=10, rep=40",
        outputDisplay: "Best Config: BLOCK_M=128, BLOCK_N=128, warps=8, Latency=0.78 ms",
        input: DEFAULT_AUTOTUNECONFIGGRIDSEARCHENGINE_INPUT,
        output: "({ BLOCK_M: 128, BLOCK_N: 128, num_warps: 8 }, 0.78)",
        explanation:
          "Benchmarks 4 candidate setups using CUDA events. Selects Cfg #2 (128x128 tiles) achieving lowest latency 0.78 ms.",
      },
    ],
    code: AUTOTUNECONFIGGRIDSEARCHENGINE_CODE,
    timeComplexity: {
      best: "O(K \\cdot (W + R))",
      average: "O(K \\cdot (W + R))",
      worst: "O(K \\cdot (W + R))",
    },
    spaceComplexity: "O(K)",
    complexityAnalysis: {
      time: "Linear in number of configurations $K$, warmup iterations $W$, and repetitions $R$: $O(K \\cdot (W + R))$.",
      space: "Requires $O(K)$ memory to log configuration benchmark results.",
    },
    topicGuide: {
      overview:
        "The Triton Autotune Config Grid Search Engine benchmarks candidate GPU tile configurations using CUDA events to find the optimal setup.",
      sections: [
        {
          heading: "Core Concept & Triton Autotuning",
          body: "Triton @triton.autotune automatically benchmarks candidate configurations (BLOCK_M, BLOCK_N, num_warps, num_stages) using CUDA events to discover the optimal tile size.",
        },
        {
          heading: "JIT Compilation & L2 Cache Warmup",
          body: "Running warmup iterations primes the Triton JIT compiler to generate PTX assembly and locks GPU clocks before timing execution.",
        },
        {
          heading: "CUDA Event Benchmarking Precision",
          body: "cudaEventRecord and cudaEventElapsedTime measure execution latency directly on the GPU command queue with microsecond precision, avoiding CPU host overhead.",
        },
        {
          heading: "Cold-Start vs Long-Run Throughput",
          body: "Autotuning incurs a one-time cold-start compilation penalty, but optimizes runtime TFLOPS for millions of downstream inference/training steps.",
        },
      ],
      keyTerms: [
        {
          term: "Autotuning",
          definition:
            "Automatic runtime search for optimal GPU kernel parameters (tile sizes, warp counts).",
        },
        {
          term: "CUDA Event",
          definition:
            "GPU hardware timestamp marker used to measure execution latency with microsecond precision.",
        },
        {
          term: "JIT Compilation",
          definition:
            "Just-In-Time compilation generating PTX assembly for specific tile configurations at runtime.",
        },
        {
          term: "L2 Cache Flushing",
          definition:
            "Clearing GPU L2 cache to prevent benchmark bias during autotune grid search.",
        },
      ],
    },
    trivia: AUTOTUNECONFIGGRIDSEARCHENGINE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_AUTOTUNECONFIGGRIDSEARCHENGINE_INPUT,
    generateSteps: generateAUTOTUNECONFIGGRIDSEARCHENGINESteps,
  };
