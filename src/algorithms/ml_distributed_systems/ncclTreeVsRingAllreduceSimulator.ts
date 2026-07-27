import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ncclTreeVsRingAllreduceSimulatorInput {
  data: number[];
  target?: number;
}

export const NCCLTREEVSRINGALLREDUCESIMULATOR_CODE = `import math

def nccl_tree_vs_ring_allreduce_simulator(tensor_size_bytes: int, num_gpus: int) -> dict:
    """
    Simulates and evaluates NCCL Double Binary Tree vs Ring-AllReduce topology performance metrics.
    Tree latency scales as O(log2 N) with 2*log2(N) steps; Ring bandwidth scales as O(N) with 2*(N-1) steps and 2*(N-1)/N * S volume.

    Input:
        tensor_size_bytes: Size of input tensor payload buffer in bytes.
        num_gpus: Number of GPU ranks participating in the collective operation.

    Output:
        Dictionary containing comparative step counts, network transfer volume, latency bounds, and topology recommendation.
    """
    if num_gpus <= 1 or tensor_size_bytes <= 0:
        return {"recommended_topology": "NONE", "ring_steps": 0, "tree_steps": 0}

    ring_steps = 2 * (num_gpus - 1)
    tree_steps = 2 * math.ceil(math.log2(num_gpus))

    ring_volume_per_gpu = (2 * (num_gpus - 1) / num_gpus) * tensor_size_bytes
    tree_volume_per_gpu = 2.0 * tensor_size_bytes

    # NCCL payload threshold heuristic: <= 256 KB favors Tree topology for lower latency
    threshold_bytes = 256 * 1024
    recommended = "TREE" if tensor_size_bytes <= threshold_bytes and num_gpus > 4 else "RING"

    return {
        "tensor_size_bytes": tensor_size_bytes,
        "num_gpus": num_gpus,
        "ring_steps": ring_steps,
        "tree_steps": tree_steps,
        "ring_volume_bytes": ring_volume_per_gpu,
        "tree_volume_bytes": tree_volume_per_gpu,
        "recommended_topology": recommended
    }
`;

export const DEFAULT_NCCLTREEVSRINGALLREDUCESIMULATOR_INPUT: ncclTreeVsRingAllreduceSimulatorInput =
  {
    data: [64, 256, 1024, 4096, 65536, 1048576],
    target: 16,
  };

export const generateNcclTreeVsRingAllreduceSimulatorSteps = (
  input: ncclTreeVsRingAllreduceSimulatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const payloads = input.data.length > 0 ? input.data : [64, 256, 1024, 4096, 65536, 1048576];
  const numGpus = Math.max(2, input.target ?? 16);
  const ringSteps = 2 * (numGpus - 1);
  const treeSteps = 2 * Math.ceil(Math.log2(numGpus));

  const buildMatrixCells = (
    activeRow?: number,
    completedRows: number[] = [],
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < payloads.length; r++) {
      const bytes = payloads[r];
      const ringVolMB = (((2 * (numGpus - 1)) / numGpus) * bytes) / (1024 * 1024);
      const treeVolMB = (2.0 * bytes) / (1024 * 1024);
      const isSmall = bytes <= 256 * 1024;
      const rec = isSmall && numGpus > 4 ? "TREE" : "RING";

      const isDone = completedRows.includes(r);
      const isActive = r === activeRow;

      const rowValues = [
        bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${bytes} B`,
        `${ringSteps} steps`,
        `${treeSteps} steps`,
        `${ringVolMB < 0.01 ? ringVolMB.toFixed(4) : ringVolMB.toFixed(2)} MB`,
        `${treeVolMB < 0.01 ? treeVolMB.toFixed(4) : treeVolMB.toFixed(2)} MB`,
        rec,
      ];

      for (let c = 0; c < 6; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (isDone) state = "sorted";
        else if (isActive) state = c === 5 ? "active" : "compared";

        cells.push({
          row: r,
          col: c,
          value: rowValues[c],
          label: `Payload ${bytes}B (col ${c})`,
          state,
        });
      }
    }
    return cells;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow?: number,
    completedRows: number[] = [],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: payloads.length,
        cols: 6,
        rowHeaders: payloads.map((b) => (b >= 1024 ? `${b / 1024}KB` : `${b}B`)),
        colHeaders: [
          "Payload Size",
          "Ring Steps (2N-2)",
          "Tree Steps (2logN)",
          "Ring Vol/GPU",
          "Tree Vol/GPU",
          "NCCL Recommendation",
        ],
        cells: buildMatrixCells(activeRow, completedRows),
      },
      auxiliaryState: {
        customState: {
          numGpus: String(numGpus),
          ringSteps: String(ringSteps),
          treeSteps: String(treeSteps),
          activePayload: activeRow !== undefined ? `${payloads[activeRow]} Bytes` : "None",
        },
      },
      variables,
    });
  };

  // Step 1: Module import
  addStep(
    1,
    "Import Math Module",
    "Importing math module for logarithmic step calculations.",
    { module: "math" },
  );

  // Step 2: Function entry
  addStep(
    3,
    "Enter nccl_tree_vs_ring_allreduce_simulator",
    `Initializing NCCL topology evaluation for ${numGpus} GPUs across ${payloads.length} payload buffers.`,
    { num_gpus: numGpus, payload_count: payloads.length },
  );

  // Step 3: Validate GPUs
  addStep(
    15,
    "Validate GPU Count and Tensor Size",
    `Evaluating num_gpus (${numGpus}) <= 1 or tensor_size_bytes <= 0. Validation passed.`,
    { num_gpus: numGpus, valid: true },
  );

  // Step 4: Ring steps formula
  addStep(
    18,
    "Compute Ring All-Reduce Step Count",
    `ring_steps = 2 * (${numGpus} - 1) = ${ringSteps} sequential ring communication steps.`,
    { num_gpus: numGpus, ring_steps: ringSteps },
  );

  // Step 5: Tree steps formula
  addStep(
    19,
    "Compute Double Binary Tree Step Count",
    `tree_steps = 2 * math.ceil(math.log2(${numGpus})) = ${treeSteps} tree depth steps.`,
    { num_gpus: numGpus, tree_steps: treeSteps },
  );

  const completedRows: number[] = [];

  for (let r = 0; r < payloads.length; r++) {
    const bytes = payloads[r];

    // Step: Loop payload entry
    addStep(
      21,
      `Evaluate Payload Size: ${bytes} Bytes on ${numGpus} GPUs`,
      `Processing evaluation for payload_bytes = ${bytes} B.`,
      { payload_idx: r, payload_bytes: bytes },
      r,
      completedRows,
    );

    // Step: Ring volume per GPU
    const ringVolBytes = ((2 * (numGpus - 1)) / numGpus) * bytes;
    addStep(
      21,
      `Compute Ring Data Volume per GPU for ${bytes}B`,
      `ring_volume_per_gpu = (2 * (${numGpus} - 1) / ${numGpus}) * ${bytes} = ${ringVolBytes.toFixed(1)} bytes.`,
      { payload_bytes: bytes, ring_vol_bytes: ringVolBytes },
      r,
      completedRows,
    );

    // Step: Tree volume per GPU
    const treeVolBytes = 2.0 * bytes;
    addStep(
      22,
      `Compute Tree Data Volume per GPU for ${bytes}B`,
      `tree_volume_per_gpu = 2.0 * ${bytes} = ${treeVolBytes} bytes.`,
      { payload_bytes: bytes, tree_vol_bytes: treeVolBytes },
      r,
      completedRows,
    );

    // Step: Threshold check
    const threshold = 256 * 1024;
    const isSmall = bytes <= threshold;
    addStep(
      25,
      `Evaluate 256KB Threshold Heuristic (${bytes} B vs 262144 B)`,
      isSmall
        ? `Payload ${bytes} B <= 256KB threshold; network latency dominates transfer duration.`
        : `Payload ${bytes} B > 256KB threshold; link bandwidth dominates transfer duration.`,
      { payload_bytes: bytes, threshold_bytes: threshold, is_latency_bound: isSmall },
      r,
      completedRows,
    );

    // Step: Recommendation
    const rec = isSmall && numGpus > 4 ? "TREE" : "RING";
    addStep(
      26,
      `NCCL Recommendation for ${bytes}B: ${rec}`,
      rec === "TREE"
        ? `Selected TREE topology because ${treeSteps} tree steps << ${ringSteps} ring steps for small message latency optimization.`
        : `Selected RING topology because ring volume per GPU (${ringVolBytes.toFixed(0)}B) < tree volume (${treeVolBytes}B) for bandwidth optimization.`,
      { payload_bytes: bytes, recommendation: rec, ring_steps: ringSteps, tree_steps: treeSteps },
      r,
      completedRows,
    );

    completedRows.push(r);
  }

  // Step: Constructing output dictionary
  const primaryBytes = payloads[payloads.length - 1];
  const isSmallPrimary = primaryBytes <= 256 * 1024;
  const primaryRec = isSmallPrimary && numGpus > 4 ? "TREE" : "RING";

  addStep(
    28,
    "Construct Return Dictionary",
    "Building final simulation results dictionary payload.",
    { primary_bytes: primaryBytes },
    undefined,
    completedRows,
  );

  addStep(
    29,
    `Set tensor_size_bytes = ${primaryBytes}`,
    `Populating field "tensor_size_bytes": ${primaryBytes}.`,
    { tensor_size_bytes: primaryBytes },
    undefined,
    completedRows,
  );

  addStep(
    30,
    `Set num_gpus = ${numGpus}`,
    `Populating field "num_gpus": ${numGpus}.`,
    { num_gpus: numGpus },
    undefined,
    completedRows,
  );

  addStep(
    31,
    `Set ring_steps = ${ringSteps}`,
    `Populating field "ring_steps": ${ringSteps}.`,
    { ring_steps: ringSteps },
    undefined,
    completedRows,
  );

  addStep(
    32,
    `Set tree_steps = ${treeSteps}`,
    `Populating field "tree_steps": ${treeSteps}.`,
    { tree_steps: treeSteps },
    undefined,
    completedRows,
  );

  addStep(
    35,
    `Set recommended_topology = "${primaryRec}"`,
    `Final recommendation for ${primaryBytes}B on ${numGpus} GPUs is ${primaryRec}.`,
    { recommended_topology: primaryRec },
    undefined,
    completedRows,
  );

  // Return step
  addStep(
    36,
    "Return Topology Evaluation Dictionary",
    `Completed topology comparison across ${payloads.length} payload buffers on ${numGpus} GPUs.`,
    { completed: true, num_gpus: numGpus },
    undefined,
    completedRows,
  );

  return steps;
};

const NCCLTREEVSRINGALLREDUCESIMULATOR_TRIVIA: TriviaMeta = {
  skipLines: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  distractors: [
    "ring_steps = num_gpus ** 2",
    "tree_steps = num_gpus / 2",
    "return payload_bytes[::-1]",
  ],
  hints: [
    {
      line: 26,
      hint: "NCCL selects Tree topology for small payloads (<=256KB) to minimize O(log N) latency.",
    },
  ],
  lineExplanations: {
    1: "Imports Python math library for log2 and ceil functions.",
    2: "Blank line after module imports.",
    3: "Defines entry point for NCCL Tree vs Ring-AllReduce simulator taking tensor size and GPU count.",
    4: "Starts docstring documenting topology comparison.",
    5: "Describes simulating NCCL Double Binary Tree vs Ring-AllReduce topology performance metrics.",
    6: "Details Tree latency O(log2 N) vs Ring bandwidth O(N) trade-off.",
    7: "Blank line in docstring.",
    8: "Docstring section header for input parameters.",
    9: "Docstring describing tensor_size_bytes parameter.",
    10: "Docstring describing num_gpus parameter.",
    11: "Blank line in docstring.",
    12: "Docstring section header for output dictionary.",
    13: "Docstring describing return payload containing comparative step metrics and recommendations.",
    14: "Closes docstring block.",
    15: "Validates positive GPU count (> 1) and positive tensor size.",
    16: "Returns fallback dictionary if input parameters are invalid.",
    17: "Blank line before step count calculations.",
    18: "Calculates Ring topology step count 2*(num_gpus - 1).",
    19: "Calculates Double Binary Tree step count 2*ceil(log2(num_gpus)).",
    20: "Blank line before per-GPU volume calculations.",
    21: "Computes Ring data volume transferred per GPU (2*(N-1)/N * S).",
    22: "Computes Tree data volume transferred per GPU (2.0 * S).",
    23: "Blank line before threshold evaluation.",
    24: "Comment explaining 256KB NCCL threshold heuristic.",
    25: "Defines threshold_bytes as 256 * 1024 = 262144 bytes.",
    26: "Evaluates conditional recommendation returning 'TREE' for small payloads or 'RING' for large payloads.",
    27: "Blank line before return dictionary payload.",
    28: "Starts dictionary construction for evaluation result.",
    29: "Sets tensor_size_bytes key.",
    30: "Sets num_gpus key.",
    31: "Sets ring_steps key.",
    32: "Sets tree_steps key.",
    33: "Sets ring_volume_bytes key.",
    34: "Sets tree_volume_bytes key.",
    35: "Sets recommended_topology string key.",
    36: "Closes return dictionary construct.",
  },
};

export const ncclTreeVsRingAllreduceSimulator: AlgorithmDefinition<ncclTreeVsRingAllreduceSimulatorInput> =
  {
    id: "nccl-tree-vs-ring-allreduce-simulator",
    title: "NCCL Tree vs Ring-AllReduce Topology Simulator",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "NVIDIA Collective Communications Library (NCCL) dynamically selects between **Ring-AllReduce** and **Double Binary Tree AllReduce** algorithms based on message payload size ($S$) and GPU rank count ($N$).\n\n### Why It Exists & Problem Solved\nIn large distributed GPU clusters (e.g. 1,024 GPUs), network transmission time is governed by the Hockney alpha-beta model ($T = \\alpha \\cdot \\text{steps} + \\beta \\cdot \\text{volume}$). For large tensors (like gradient updates in LLM training), bandwidth $\\beta \\cdot \\text{volume}$ dominates, making Ring-AllReduce ideal ($2 \\frac{N-1}{N} S \\approx 2S$ bytes per GPU). However, for small tensors (like gradient norm reductions, 256KB layers, or barrier synchronizations), fixed latency $\\alpha \\cdot \\text{steps}$ dominates. At $N=1,024$, Ring requires 2,046 steps ($O(N)$), while Double Binary Tree requires only 20 steps ($O(\\log_2 N)$)!\n\n### Step-by-Step Intuition\n1. **Ring Topology**: $2(N-1)$ sequential steps. Each rank sends to $(r+1)\\%N$ and receives from $(r-1)\\%N$. Optimal bandwidth utilization, linear latency.\n2. **Double Binary Tree Topology**: Constructs two non-overlapping binary trees over the network graph. Each GPU acts as an internal node in one tree and a leaf node in the other. Reductions travel up child-to-parent links in $\\lceil \\log_2 N \\rceil$ steps, followed by broadcast down in $\\lceil \\log_2 N \\rceil$ steps.\n3. **Heuristic Threshold**: NCCL automatically switches from Tree to Ring when payload size exceeds $256$ KB.\n\n### Trade-offs & Complexity\n- **Time Complexity**: Ring latency $O(N)$ vs Tree latency $O(\\log N)$.\n- **Volume per GPU**: Ring transfers $2 \\frac{N-1}{N} S$ bytes vs Tree transfers $2.0 S$ bytes.\n- **Network Utilization**: Tree uses twice as many link hops, which can cause link congestion on large payloads.",
    constraints: ["2 <= target (num_gpus) <= 1024", "1 <= data.length <= 100"],
    examples: [
      {
        kind: "basic",
        title: "16-GPU Payload Evaluation",
        inputDisplay: "data = [64, 1048576], target = 16",
        outputDisplay: "64B -> TREE (8 steps vs 30 steps); 1MB -> RING (Bandwidth-Bound)",
        input: { data: [64, 1048576], target: 16 },
        output: "64B -> TREE (8 steps vs 30 steps); 1MB -> RING (Bandwidth-Bound)",
        explanation:
          "For 16 GPUs, Tree takes 2*log2(16)=8 steps while Ring takes 2*(16-1)=30 steps. 64B favors Tree; 1MB favors Ring.",
      },
      {
        kind: "complex",
        title: "64-GPU Large Cluster Comparison",
        inputDisplay: "data = [4096, 65536], target = 64",
        outputDisplay:
          "Ring Steps: 126, Tree Steps: 12. Tree topology recommended for small messages.",
        input: { data: [4096, 65536], target: 64 },
        output: "Ring Steps: 126, Tree Steps: 12. Tree topology recommended for small messages.",
        explanation:
          "At 64 GPUs, Tree reduces step count from 126 down to 12 steps, dramatically reducing network handshake latency.",
      },
      {
        kind: "negative",
        title: "2-GPU Small Cluster",
        inputDisplay: "data = [1024], target = 2",
        outputDisplay: "Ring Steps: 2, Tree Steps: 2. Recommended: RING",
        input: { data: [1024], target: 2 },
        output: "Ring Steps: 2, Tree Steps: 2. Recommended: RING",
        explanation: "For 2 GPUs, both topologies perform 2 steps; Ring is chosen by default.",
      },
    ],
    code: NCCLTREEVSRINGALLREDUCESIMULATOR_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Linear time O(N) pass over input payload list to calculate step counts and recommend topologies.",
      space: "O(1) auxiliary space to compute scalar step and volume metrics.",
    },
    topicGuide: {
      overview:
        "NCCL dynamically toggles between Ring-AllReduce (optimal for large tensor throughput) and Double Binary Tree AllReduce (optimal for small message latency).",
      sections: [
        {
          heading: "Why It Exists & Problem Solved",
          body: "Ring-AllReduce executes in 2(N-1) sequential steps. When scaling to 1,000+ GPUs, latency grows unacceptably high for small collective synchronization calls (such as gradient norm reductions or barrier ops). NCCL constructs two non-overlapping binary trees over the GPU network, enabling child-to-parent reductions in 2 * ceil(log2 N) steps.",
        },
        {
          heading: "Step-by-Step Intuition",
          body: "1. For small messages (<= 256KB), network handshake latency dominates. Double Binary Tree reduces latency from O(N) to O(log N).\n2. For large messages (> 256KB), interconnect transfer bandwidth dominates. Ring-AllReduce achieves maximum bus bandwidth utilization.",
        },
        {
          heading: "Distributed Systems & Bandwidth Analysis",
          body: "For a 1,024-GPU cluster, Ring-AllReduce requires 2,046 communication steps, whereas Tree AllReduce requires only 20 steps! For small payload messages, Tree topology yields up to 100x lower latency.",
        },
        {
          heading: "Hardware & Architecture Trade-offs",
          body: "Double Binary Tree routing requires establishing two independent spanning trees where every GPU is an internal node in one tree and a leaf node in the other. This ensures equal workload distribution across all GPU network interface cards (HCAs).",
        },
      ],
      keyTerms: [
        {
          term: "Double Binary Tree",
          definition:
            "NCCL topology partitioning GPUs into two disjoint binary trees to achieve O(log N) latency scaling.",
        },
        {
          term: "NCCL Payload Threshold",
          definition:
            "The byte limit (~256KB) where NCCL switches from latency-optimized Tree to bandwidth-optimized Ring topology.",
        },
        {
          term: "Latency-Bound Regime",
          definition:
            "Communication phase dominated by fixed per-step network latency overhead (alpha) for small payload sizes.",
        },
        {
          term: "Bandwidth-Bound Regime",
          definition:
            "Communication phase dominated by physical link transfer bandwidth (beta) for large tensor payloads.",
        },
      ],
    },
    trivia: NCCLTREEVSRINGALLREDUCESIMULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_NCCLTREEVSRINGALLREDUCESIMULATOR_INPUT,
    generateSteps: generateNcclTreeVsRingAllreduceSimulatorSteps,
  };

