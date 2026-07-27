import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
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
  const numGpus = Math.max(2, input.target ?? 16);
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
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
          payloadSizes: `[${input.data.join(", ")}]`,
          numGpus: String(numGpus),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize NCCL Tree vs Ring-AllReduce Topology Simulator",
    `Evaluating Double Binary Tree vs Ring topologies across ${numGpus} GPUs.`,
    { num_gpus: numGpus, payload_buffers: input.data.length },
  );

  const ringSteps = 2 * (numGpus - 1);
  const treeSteps = 2 * Math.ceil(Math.log2(numGpus));

  input.data.forEach((bytes, idx) => {
    const isSmall = bytes <= 256 * 1024;
    const isTreeRec = isSmall && numGpus > 4;
    const recTopology = isTreeRec ? "TREE" : "RING";

    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTreeRec ? "active" : "compare",
          pointers: [`Rec:${recTopology}`],
        };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      22,
      `Evaluate ${bytes} Bytes Payload on ${numGpus} GPUs: Ring Steps=${ringSteps}, Tree Steps=${treeSteps}`,
      `Payload ${bytes} B ${isSmall ? "<= 256KB threshold (latency-bound)." : "> 256KB threshold (bandwidth-bound)."}. NCCL Recommendation: ${recTopology}.`,
      {
        payload_bytes: bytes,
        ring_steps: ringSteps,
        tree_steps: treeSteps,
        recommendation: recTopology,
      },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    27,
    "Execution Complete",
    `NCCL topology evaluation finished. Tree topology minimizes latency (2*log2(${numGpus})=${treeSteps} steps) for small payloads; Ring maximizes bandwidth (2*(${numGpus}-1)=${ringSteps} steps) for large payloads.`,
    { completed: true, num_gpus: numGpus, ring_steps: ringSteps, tree_steps: treeSteps },
    finalElements,
  );

  return steps;
};

const NCCLTREEVSRINGALLREDUCESIMULATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  distractors: [
    "ring_steps = num_gpus ** 2",
    "tree_steps = num_gpus / 2",
    "return payload_bytes[::-1]",
  ],
  hints: [
    {
      line: 22,
      hint: "NCCL selects Tree topology for small payloads (<=256KB) to minimize O(log N) latency.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for NCCL Tree vs Ring-AllReduce topology simulator.",
    16: "Calculates Ring step count 2*(N-1).",
    17: "Calculates Tree step count 2*ceil(log2(N)).",
    22: "Applies 256KB payload byte threshold heuristic.",
    27: "Returns dictionary of step metrics and recommended NCCL topology.",
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
      "NVIDIA Collective Communications Library (NCCL) dynamically selects between **Ring** and **Double Binary Tree** All-Reduce algorithms based on message payload size ($S$) and GPU rank count ($N$).\n\nKey Trade-offs:\n- **Ring Topology**: Requires $2(N-1)$ communication steps. Latency scales linearly $O(N)$ with rank count, but achieves maximum bandwidth efficiency $\\frac{2(N-1)}{N} S \\approx 2S$ per GPU. Ideal for large tensor buffers ($>256$ KB).\n- **Double Binary Tree Topology**: Requires $2 \\lceil \\log_2 N \\rceil$ communication steps. Latency scales logarithmically $O(\\log N)$, making it significantly faster for small payloads (${\\le} 256$ KB) across large clusters (e.g. $N=128$ GPUs).\n\nInput Format:\n- data: Array of tensor payload buffer sizes in bytes (e.g. `[64, 256, 1024, 1048576]`).\n- target: Number of GPU ranks participating in the collective ($N$).\n\nOutput Format:\n- Returns comparative metrics including step counts, volume transferred per GPU, latency scaling factors, and recommended NCCL topology.\n\nEdge Cases & Constraints:\n- Threshold switching: NCCL typically switches from Tree to Ring around $256$ KB to $512$ KB payloads.\n- GPU scale $N$: For $N \\le 4$, Ring and Tree step counts are comparable, so Ring is preferred for simpler routing.\n- Power of 2 ranks: Double Binary Tree constructs balanced binary trees when $N$ is a power of 2.",
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
          heading: "Core Concepts",
          body: "Ring-AllReduce executes in $2(N-1)$ sequential steps. When scaling to 1,000+ GPUs, latency grows unacceptably high for small collective synchronization calls (such as gradient norm reductions or barrier ops). NCCL constructs two non-overlapping binary trees over the GPU network, enabling child-to-parent reductions in $2 \\lceil \\log_2 N \\rceil$ steps.",
        },
        {
          heading: "Systems & Bandwidth Impact",
          body: "For a 1,024-GPU cluster, Ring-AllReduce requires 2,046 communication steps, whereas Tree AllReduce requires only 20 steps! For small payload messages (where fixed link latency $\\alpha$ dominates transfer time $\\beta \\cdot S$), Tree topology yields up to 100x lower latency.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Double Binary Tree routing requires establishing two independent spanning trees where every GPU is an internal node in one tree and a leaf node in the other. This ensures equal workload distribution across all GPU network cards (HCAs).",
        },
        {
          heading: "Architecture & Topology Trade-offs",
          body: "Tree topology uses twice as many network link hops for full reduction compared to Ring. For large gradient tensors (e.g. $>256$ KB in modern LLMs), link bandwidth $\\beta$ dominates, making Ring topology the clear winner for maximum training throughput.",
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
