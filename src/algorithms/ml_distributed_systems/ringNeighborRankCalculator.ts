import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ringNeighborRankCalculatorInput {
  data: number[];
  target?: number;
}

export const RINGNEIGHBORRANKCALCULATOR_CODE = `def calculate_ring_neighbors(rank, world_size, stride=1):
    """
    Calculates the left (predecessor) and right (successor) neighbor ranks
    in a logical or physical communication ring topology under circular modulo arithmetic.

    Args:
        rank: Current GPU rank index (0 <= rank < world_size)
        world_size: Total number of ranks in the ring (N)
        stride: Optional stride multiplier for multi-ring or hierarchical topologies

    Returns:
        Tuple (left_neighbor, right_neighbor)
    """
    if world_size <= 1:
        return (rank, rank)

    left_neighbor = (rank - stride + world_size) % world_size
    right_neighbor = (rank + stride) % world_size
    return (left_neighbor, right_neighbor)
`;

export const DEFAULT_RINGNEIGHBORRANKCALCULATOR_INPUT: ringNeighborRankCalculatorInput = {
  data: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
  target: 50,
};

export const generateRingNeighborRankCalculatorSteps = (
  input: ringNeighborRankCalculatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const N = input.data.length;
  const elements: ArrayElement[] = input.data.map((_, idx) => ({
    id: `rank-${idx}`,
    value: `Rank ${idx}`,
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
          world_size: String(N),
          data: `[${input.data.join(", ")}]`,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Ring Topology Neighbor Rank Calculator",
    `Setting up GPU rank topology structures for world_size = ${N}.`,
    { world_size: N },
    [...elements],
  );

  addStep(
    14,
    "Check Single Rank Guard (world_size <= 1)",
    `Validating ring world size: ${N} > 1. Proceeding with circular neighbor calculation.`,
    { world_size: N, is_single_node: false },
    [...elements],
  );

  input.data.forEach((val, rank) => {
    const left = (rank - 1 + N) % N;
    const right = (rank + 1) % N;
    const isTarget = val === input.target;

    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === rank)
        return {
          ...el,
          state: isTarget ? ("active" as const) : ("compare" as const),
          pointers: [`rank=${rank}`, `L=${left}`, `R=${right}`],
        };
      if (i === left || i === right)
        return { ...el, state: "visited" as const, pointers: [i === left ? "Left" : "Right"] };
      return el;
    });

    addStep(
      17,
      `Compute Left Neighbor for Rank ${rank}: (${rank} - 1 + ${N}) % ${N} = ${left}`,
      `Evaluating circular predecessor rank under modulo arithmetic to handle rank 0 wrap-around safely.`,
      { rank, stride: 1, world_size: N, left_neighbor: left, isTarget },
      currentElements,
    );

    addStep(
      18,
      `Compute Right Neighbor for Rank ${rank}: (${rank} + 1) % ${N} = ${right}`,
      `Evaluating circular successor rank under modulo arithmetic: (${rank} + 1) % ${N} = ${right}.`,
      { rank, stride: 1, world_size: N, right_neighbor: right, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted" as const,
    pointers: ["Mapped"],
  }));

  addStep(
    19,
    "Return Predecessor and Successor Neighbor Tuple",
    `Successfully resolved circular neighbor rank mapping across all ${N} participating nodes.`,
    { completed: true, world_size: N },
    finalElements,
  );

  return steps;
};

const RINGNEIGHBORRANKCALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16],
  distractors: [
    "left_neighbor = (rank - 1) % world_size",
    "right_neighbor = (rank + 1) / world_size",
    "left_neighbor = rank - stride",
    "right_neighbor = (rank + world_size) % stride",
  ],
  hints: [
    {
      line: 17,
      hint: "Add world_size before modulo when computing left neighbor: (rank - stride + world_size) % world_size.",
    },
    {
      line: 18,
      hint: "Compute right neighbor using circular modulo arithmetic: (rank + stride) % world_size.",
    },
  ],
  lineExplanations: {
    1: "Function signature for calculate_ring_neighbors taking rank, world_size, and optional stride.",
    2: "Docstring start describing predecessor and successor neighbor rank calculations.",
    3: "Describes left and right neighbor calculation in logical/physical ring topology.",
    4: "Explains circular modulo arithmetic properties.",
    5: "Blank line in docstring.",
    6: "Docstring args section header.",
    7: "Explains rank parameter representing current GPU rank index.",
    8: "Explains world_size parameter representing total ranks in the ring (N).",
    9: "Explains stride parameter for multi-ring or hierarchical topologies.",
    10: "Blank line in docstring.",
    11: "Docstring returns section header.",
    12: "Explains return tuple of (left_neighbor, right_neighbor).",
    13: "Docstring close.",
    14: "Checks edge case guard if world_size is less than or equal to 1.",
    15: "Returns self tuple (rank, rank) for single-node topologies.",
    16: "Blank line before neighbor calculation.",
    17: "Calculates left neighbor with positive modulo wrapping: (rank - stride + world_size) % world_size.",
    18: "Calculates right neighbor with modulo wrapping: (rank + stride) % world_size.",
    19: "Returns tuple (left_neighbor, right_neighbor).",
  },
};

export const ringNeighborRankCalculator: AlgorithmDefinition<ringNeighborRankCalculatorInput> = {
  id: "ring-neighbor-rank-calculator",
  title: "Ring Topology Neighbor Rank Calculator",
  category: "ml_distributed_systems",
  categories: ["ml_distributed_systems", "ml_hardware_kernels"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 11,
  mlInfraCategory: "ml_distributed_systems",
  description:
    "Calculates the immediate predecessor (left) and successor (right) GPU rank indices in a logical circular communication ring for distributed deep learning operations (e.g. PyTorch DDP, NVIDIA NCCL, DeepSpeed).\n\n### Mathematical Formulation & Modulo Wrap-Around\nIn a distributed cluster of $N$ GPU ranks numbered $0, 1, \\dots, N-1$:\n- **Right Neighbor (Successor)**:\n$$\\text{Right}(r) = (r + \\text{stride}) \\pmod N$$\n- **Left Neighbor (Predecessor)**:\n$$\\text{Left}(r) = (r - \\text{stride} + N) \\pmod N$$\n\nAdding $N$ before applying modulo when computing the left neighbor prevents negative modulo results in languages like C++/Python when rank $r=0$.\n\nIn hierarchical hardware topologies (e.g., 8-GPU nodes connected via NVLink internally and InfiniBand externally), multi-ring algorithms use non-unit strides (e.g., $\\text{stride} = 8$ for inter-node rings across corresponding GPUs) to construct distinct, non-overlapping communication rings that saturate available interconnect bandwidth.\n\nInput Format:\n- `data`: Array representing GPU rank indices or shard identifiers in the ring.\n- `target`: Optional target rank or search marker.\n\nOutput Format:\n- Returns predecessor and successor rank pairs for each node in the ring.\n\nEdge Cases & Constraints:\n- Single GPU ($N=1$): Left and right neighbors both resolve to self ($r$).\n- Rank 0 Wrap-around: Predecessor of rank 0 resolves to rank $N-1$.\n- Multi-rail Ring Strides: Strided topologies must satisfy $\\gcd(\\text{stride}, N) = 1$ or operate over coprime subgroups to form closed single rings.",
  constraints: ["1 <= data.length <= 1000", "0 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "16-GPU Ring Neighbor Lookup",
      inputDisplay: "16 rank blocks, target = 50",
      outputDisplay: "Calculated left and right neighbors for all 16 ranks",
      input: DEFAULT_RINGNEIGHBORRANKCALCULATOR_INPUT,
      output: "Neighbor tuple mappings generated",
      explanation: "Evaluates circular neighbor ring mapping across 16 ranks.",
    },
    {
      kind: "complex",
      title: "5-GPU Cluster Neighbor Routing",
      inputDisplay: "data = [10, 20, 30, 40, 50], target = 30",
      outputDisplay: "Rank 2 -> Left: 1, Right: 3",
      input: { data: [10, 20, 30, 40, 50], target: 30 },
      output: "Left: 1, Right: 3",
      explanation: "Computes circular neighbor connections across a 5-node cluster.",
    },
    {
      kind: "negative",
      title: "Single-GPU Standalone Topology",
      inputDisplay: "data = [100], target = 100",
      outputDisplay: "Rank 0 -> Left: 0, Right: 0",
      input: { data: [100], target: 100 },
      output: "Left: 0, Right: 0",
      explanation: "A single GPU is its own predecessor and successor.",
    },
  ],
  code: RINGNEIGHBORRANKCALCULATOR_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "O(1) closed-form modular arithmetic calculation per rank.",
    space: "O(1) auxiliary space for neighbor pair tuple.",
  },
  topicGuide: {
    overview:
      "Ring Topology Neighbor Rank Calculator is a fundamental utility in distributed communication libraries like NCCL. It establishes peer-to-peer sending and receiving channels across logical ring topologies for Ring-AllReduce, Scatter-Reduce, and All-Gather operations.",
    sections: [
      {
        heading: "Overview & Problem Context",
        body: "High-performance collective communication primitives require GPUs to stream data in ring pipelines without incurring dynamic routing lookup penalties. Each rank must determine its static send and receive peer ranks prior to memory buffer registration and CUDA IPC/InfiniBand queue pair creation.",
      },
      {
        heading: "Core Concepts & Circular Modulo Routing",
        body: "In a ring of size $N$, data flows in one direction (e.g. rank $r \\to (r+1) \\pmod N$). To receive incoming chunks, rank $r$ listens to $(r-1+N) \\pmod N$. Adding $N$ to $(r-1)$ ensures positive dividend arithmetic before modulo evaluation. When strided rings are used for multi-rail topology traversal, the equation generalizes to $\\text{Next} = (r + S) \\pmod N$ and $\\text{Prev} = (r - S + N) \\pmod N$.",
      },
      {
        heading: "Systems & Interconnect Topology Performance",
        body: "Hardware topology discovery tools (e.g. `nvidia-smi topo -m` or NCCL XML topology parsers) analyze NVLink, NVSwitch, PCIe switches, and InfiniBand HCAs. They generate optimal ring orderings (e.g., 0-1-2-3-7-6-5-4) that maximize intra-node NVLink bandwidth before traversing inter-node NICs, avoiding PCI bus contention.",
      },
      {
        heading: "Implementation Nuances & Production Safeguards",
        body: "In production NCCL implementations:\n- Peer ranks are mapped to pre-allocated CUDA IPC shared memory pointers for intra-node ranks, and InfiniBand Queue Pairs (QPs) for inter-node ranks.\n- Deadlock prevention guarantees require every rank to initiate its non-blocking `ncclSend` and `ncclRecv` operations symmetrically to prevent ring dependency deadlocks.",
      },
    ],
    keyTerms: [
      {
        term: "Ring Topology",
        definition:
          "A logical network structure where nodes are connected in a closed circular loop for sequential data pipelining.",
      },
      {
        term: "Predecessor Rank",
        definition:
          "The upstream node in the ring from which the current rank receives incoming data chunks.",
      },
      {
        term: "Successor Rank",
        definition:
          "The downstream node in the ring to which the current rank forwards outgoing data chunks.",
      },
      {
        term: "NCCL Topology Detection",
        definition:
          "Automated physical link discovery performed by NCCL to construct optimal communication rings across NVLink and PCIe buses.",
      },
    ],
  },
  trivia: RINGNEIGHBORRANKCALCULATOR_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
  defaultInput: DEFAULT_RINGNEIGHBORRANKCALCULATOR_INPUT,
  generateSteps: generateRingNeighborRankCalculatorSteps,
};
