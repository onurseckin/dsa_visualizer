import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface autotuneConfigGridSearchEngineInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const AUTOTUNECONFIGGRIDSEARCHENGINE_CODE = `
def autotune_grid_search(
    configs: list[dict],
    benchmark_fn,
    warmup: int = 10,
    rep: int = 40
) -> tuple[dict, float]:
    """
    Simulates Triton @triton.autotune config grid search engine.
    Benchmarks candidate triton.Config setups (BLOCK_M, BLOCK_N, num_warps, num_stages),
    times kernel execution with CUDA events, and returns the optimal config.
    """
    best_config = None
    best_time_ms = float('inf')
    results = []

    for cfg in configs:
        # Step 1: Warmup kernel compilation & L2 cache warm-up
        for _ in range(warmup):
            benchmark_fn(cfg)

        # Step 2: Time execution across rep iterations using CUDA events
        start_event = record_cuda_event()
        for _ in range(rep):
            benchmark_fn(cfg)
        end_event = record_cuda_event()
        
        elapsed_ms = elapsed_time(start_event, end_event) / rep
        results.append((cfg, elapsed_ms))

        # Step 3: Track minimum execution latency configuration
        if elapsed_ms < best_time_ms:
            best_time_ms = elapsed_ms
            best_config = cfg

    return best_config, best_time_ms
`;

export const DEFAULT_AUTOTUNECONFIGGRIDSEARCHENGINE_INPUT: autotuneConfigGridSearchEngineInput = {
  data: [16, 32, 64, 128],
};

export const generateAUTOTUNECONFIGGRIDSEARCHENGINESteps = (
  input: autotuneConfigGridSearchEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const arrayData = input.data || [16, 32, 64, 128];

  const elements: ArrayElement[] = arrayData.map((val: number, idx: number) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
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
        customState: {
          configs_count: String(arrayData.length),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Triton Autotune Grid Search Engine",
    "Setting up benchmarking harness: evaluating candidate triton.Config setups.",
    { num_configs: arrayData.length },
  );

  arrayData.forEach((val: number, idx: number) => {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`cfg=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      16,
      `Benchmark triton.Config ${idx} (BLOCK_SIZE=${val})`,
      `Warming up JIT compiler, timing 40 benchmark reps, and measuring TFLOPS throughput.`,
      { cfgIdx: idx, blockTileSize: val },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    30,
    "Execution Complete",
    "Successfully identified fastest triton.Config and cached parameters in autotune table.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const AUTOTUNECONFIGGRIDSEARCHENGINE_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  distractors: ["best_config = configs[0]", "elapsed_ms = start_event - end_event", "warmup = 0"],
  hints: [
    { line: 16, hint: "Warmup kernel compilation to avoid measuring PyTorch/Triton JIT overhead." },
    { line: 20, hint: "Record CUDA events start_event and end_event around execution loop." },
    { line: 29, hint: "Update best_config when elapsed_ms < best_time_ms." },
  ],
  lineExplanations: {
    1: "Defines entry point for Triton @triton.autotune grid search engine.",
    16: "Executes warmup iterations to trigger JIT PTX compilation.",
    20: "Records CUDA start event prior to benchmark loop.",
    23: "Records CUDA end event after benchmark loop.",
    25: "Calculates average per-iteration execution latency in milliseconds.",
    29: "Selects minimum latency configuration.",
  },
};

export const autotuneConfigGridSearchEngine: AlgorithmDefinition<autotuneConfigGridSearchEngineInput> =
  {
    id: "autotune-config-grid-search-engine",
    title: "Triton `@triton.autotune` Configuration Search Engine",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "In Triton kernel programming, GPU performance (TFLOPS) is highly sensitive to hardware configuration parameters: tile dimensions (`BLOCK_SIZE_M`, `BLOCK_SIZE_N`, `BLOCK_SIZE_K`), warp count (`num_warps`), and pipeline stage depth (`num_stages`). Because optimal parameters depend on matrix shapes and specific GPU architecture (e.g. H100 vs A100 vs L40S), hardcoding tile sizes leads to sub-optimal throughput.\n\nTriton `@triton.autotune` automates hardware tuning by running a grid search benchmark across candidate `triton.Config` setups. For each candidate, it performs warm-up compilations, measures execution latency using CUDA events (`cudaEventRecord`), flushes L2 caches to ensure cold cache benchmarking, and caches the fastest configuration in a persistent lookup table.\n\nInput Format:\n- data: Array of block tile sizes or candidate configurations.\n- target: Target matrix dimension or TFLOPS benchmark goal.\n\nOutput Format:\n- Optimal `triton.Config` instance and minimum measured kernel execution latency.",
    constraints: ["1 <= configs.length <= 64", "1 <= num_warps <= 16"],
    examples: [
      {
        kind: "basic",
        title: "Standard Autotune Grid",
        inputDisplay: "configs = [BLOCK_M=64, BLOCK_M=128, BLOCK_M=256]",
        outputDisplay: "Optimal: BLOCK_M=128 (1.42 ms)",
        input: { data: [64, 128, 256] },
        output: "Optimal: BLOCK_M=128",
        explanation: "Benchmarks 3 tile configurations and selects fastest runtime configuration.",
      },
      {
        kind: "complex",
        title: "4-Tile Size Benchmark",
        inputDisplay: "configs = [16, 32, 64, 128]",
        outputDisplay: "Optimal: 64 (0.89 ms)",
        input: { data: [16, 32, 64, 128] },
        output: "Optimal: 64",
        explanation: "Evaluates grid search across 4 candidate tile configurations.",
      },
      {
        kind: "negative",
        title: "Single Config Fallback",
        inputDisplay: "configs = [64]",
        outputDisplay: "Optimal: 64",
        input: { data: [64] },
        output: "Optimal: 64",
        explanation: "When single config is provided, autotuner skips grid search comparison.",
      },
    ],
    code: AUTOTUNECONFIGGRIDSEARCHENGINE_CODE,
    timeComplexity: { best: "O(C \\cdot R)", average: "O(C \\cdot R)", worst: "O(C \\cdot R)" },
    spaceComplexity: "O(C)",
    complexityAnalysis: {
      time: "Requires $O(C \\cdot R)$ total benchmark time for $C$ candidate configurations evaluated over $R$ reps.",
      space:
        "Requires $O(C)$ memory for storing benchmark latency results in autotune lookup table.",
    },
    topicGuide: {
      overview:
        "`@triton.autotune` is the primary performance tuning tool in OpenAI Triton. It guarantees maximum GPU FLOPs utilization across heterogeneous GPU architectures without requiring manual kernel re-writing.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Given candidate configuration space $\\mathcal{C} = \\{ c_1, c_2, \\dots, c_k \\}$, where $c_i = (B_m, B_n, B_k, w, s)$, autotuning evaluates kernel execution time $T(c_i)$ and computes throughput $G_i = \\frac{2 M N K}{10^9 \\cdot T(c_i)} \\text{ TFLOPS}$. The optimal configuration is $c^* = \\arg\\min_{c_i \\in \\mathcal{C}} T(c_i)$.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Tile sizes determine SRAM occupancy per Streaming Multiprocessor (SM). Choosing $B_m \\times B_n$ too large exceeds available shared memory (leading to launch failure or low occupancy); choosing it too small reduces arithmetic intensity, causing memory bandwidth bottlenecks.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "L2 cache flushing: To prevent subsequent benchmark runs from benefiting from data cached in L2 DRAM during previous runs, `@triton.autotune` can flush the L2 cache using a dummy memory allocation prior to measuring CUDA events.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Config key dynamic matching: Autotuner keys configs by input matrix shapes (e.g. `key=['M', 'N', 'K']`). When shape dimensions change dynamically at inference time, autotuner checks if exact key exists; if missing, it falls back to nearest shape entry or re-runs tuning.",
        },
      ],
      keyTerms: [
        {
          term: "@triton.autotune",
          definition:
            "A Python decorator in OpenAI Triton that automatically benchmarks and selects optimal GPU kernel configurations.",
        },
        {
          term: "triton.Config",
          definition:
            "A data structure specifying tile sizes, warp counts, and pipeline stage parameters for a kernel launch.",
        },
        {
          term: "CUDA Event Timing",
          definition:
            "Hardware event markers (cudaEventRecord) providing sub-microsecond GPU timing accuracy.",
        },
        {
          term: "L2 Cache Flushing",
          definition: "Evicting cached DRAM lines to measure cold-cache kernel execution latency.",
        },
      ],
    },
    trivia: AUTOTUNECONFIGGRIDSEARCHENGINE_TRIVIA,
    sources: [],
    defaultInput: DEFAULT_AUTOTUNECONFIGGRIDSEARCHENGINE_INPUT,
    generateSteps: generateAUTOTUNECONFIGGRIDSEARCHENGINESteps,
  };
