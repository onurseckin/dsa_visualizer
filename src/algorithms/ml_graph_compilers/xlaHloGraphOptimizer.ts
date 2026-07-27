import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface HloInstruction {
  id: string;
  opcode: string;
  operands: string[];
  fusionGroup?: string;
}

export interface XlaHloGraphOptimizerInput {
  instructions: HloInstruction[];
  maxFusionSize: number;
}

export const XLA_HLO_GRAPH_OPTIMIZER_CODE = `def optimize_xla_hlo(instructions: list[dict], max_fusion_size: int) -> dict:
    """
    Optimizes a Google XLA High-Level Optimizer (HLO) computation module.
    Performs instruction-level cluster fusion:
    1. Identifies elementwise and reduction instruction sequences
    2. Groups compatible instructions into a single kLoop or kInput HLO fusion node
    3. Eliminates intermediate HBM allocations, compiling fused region into a single CUDA/TPU kernel
    """
    fused_instructions = []
    current_cluster = []
    
    for inst in instructions:
        if inst["opcode"] in ["multiply", "add", "broadcast", "subtract", "divide"]:
            current_cluster.append(inst)
            if len(current_cluster) >= max_fusion_size:
                fusion_node = {
                    "id": f"fusion_{current_cluster[0]['id']}_{current_cluster[-1]['id']}",
                    "opcode": "fusion",
                    "fusionKind": "kLoop",
                    "instructionsFused": [i["id"] for i in current_cluster],
                    "rootOpcode": current_cluster[-1]["opcode"]
                }
                fused_instructions.append(fusion_node)
                current_cluster = []
        elif inst["opcode"] == "reduce":
            if current_cluster:
                current_cluster.append(inst)
                fusion_node = {
                    "id": f"fusion_{current_cluster[0]['id']}_{current_cluster[-1]['id']}",
                    "opcode": "fusion",
                    "fusionKind": "kInput",
                    "instructionsFused": [i["id"] for i in current_cluster],
                    "rootOpcode": "reduce"
                }
                fused_instructions.append(fusion_node)
                current_cluster = []
            else:
                fused_instructions.append(inst)
        else:
            if current_cluster:
                fusion_node = {
                    "id": f"fusion_{current_cluster[0]['id']}_{current_cluster[-1]['id']}",
                    "opcode": "fusion",
                    "fusionKind": "kLoop",
                    "instructionsFused": [i["id"] for i in current_cluster],
                    "rootOpcode": current_cluster[-1]["opcode"]
                }
                fused_instructions.append(fusion_node)
                current_cluster = []
            fused_instructions.append(inst)
            
    if current_cluster:
        fusion_node = {
            "id": f"fusion_{current_cluster[0]['id']}_{current_cluster[-1]['id']}",
            "opcode": "fusion",
            "fusionKind": "kLoop",
            "instructionsFused": [i["id"] for i in current_cluster],
            "rootOpcode": current_cluster[-1]["opcode"]
        }
        fused_instructions.append(fusion_node)

    return {
        "originalInstructionCount": len(instructions),
        "fusedInstructionCount": len(fused_instructions),
        "fusedInstructions": fused_instructions
    }`;

export const DEFAULT_XLA_HLO_GRAPH_OPTIMIZER_INPUT: XlaHloGraphOptimizerInput = {
  instructions: [
    { id: "p0", opcode: "parameter", operands: [] },
    { id: "p1", opcode: "parameter", operands: [] },
    { id: "m1", opcode: "multiply", operands: ["p0", "p1"] },
    { id: "a1", opcode: "add", operands: ["m1", "p0"] },
    { id: "r1", opcode: "reduce", operands: ["a1"] },
  ],
  maxFusionSize: 4,
};

export const generateXlaHloGraphOptimizerSteps = (
  input: XlaHloGraphOptimizerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { instructions, maxFusionSize } = input;

  const initialElements: ArrayElement[] = instructions.map((inst, idx) => ({
    id: `inst-${idx}`,
    value: inst.opcode,
    state: "default",
    pointers: [inst.id],
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Initialize Google XLA HLO Graph Fusion Compiler",
      why: `Loaded HLO instruction module with ${instructions.length} instructions. Max fusion cluster size: ${maxFusionSize}. Scanning for elementwise & reduction fusion sequences.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: initialElements,
    },
    auxiliaryState: {
      customState: {
        maxFusionSize: String(maxFusionSize),
        totalInstructions: String(instructions.length),
      },
    },
    variables: { totalInstructions: instructions.length, maxFusionSize },
  });

  const fusedInstructions: Array<{
    id: string;
    opcode: string;
    fusionKind?: string;
    instructionsFused?: string[];
  }> = [];

  let currentCluster: HloInstruction[] = [];

  instructions.forEach((inst, idx) => {
    const isElementwise = ["multiply", "add", "broadcast", "subtract", "divide"].includes(
      inst.opcode,
    );

    if (isElementwise) {
      currentCluster.push(inst);
      const elements: ArrayElement[] = instructions.map((item, i) => {
        let state: ElementState = "default";
        if (currentCluster.some((c) => c.id === item.id)) state = "active";
        else if (i < idx) state = "visited";
        return {
          id: `inst-${i}`,
          value: item.opcode,
          state,
          pointers: [item.id],
        };
      });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 15,
        explanation: {
          what: `Add elementwise instruction '${inst.opcode}' (${inst.id}) to active fusion cluster`,
          why: `Current fusion cluster size: ${currentCluster.length}/${maxFusionSize}. Operands evaluated in GPU SRAM registers without DRAM writes.`,
        },
        primarySnapshot: {
          kind: "array",
          elements,
        },
        auxiliaryState: {
          customState: {
            activeClusterSize: String(currentCluster.length),
            clusterOps: currentCluster.map((c) => c.opcode).join(", "),
          },
        },
        variables: { idx, opcode: inst.opcode, clusterSize: currentCluster.length },
      });

      if (currentCluster.length >= maxFusionSize) {
        const fusionNode = {
          id: `fusion_${currentCluster[0].id}_${currentCluster[currentCluster.length - 1].id}`,
          opcode: "fusion",
          fusionKind: "kLoop",
          instructionsFused: currentCluster.map((i) => i.id),
        };
        fusedInstructions.push(fusionNode);
        currentCluster = [];
      }
    } else if (inst.opcode === "reduce") {
      if (currentCluster.length > 0) {
        currentCluster.push(inst);
        const fusionNode = {
          id: `fusion_${currentCluster[0].id}_${inst.id}`,
          opcode: "fusion",
          fusionKind: "kInput",
          instructionsFused: currentCluster.map((i) => i.id),
        };

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 27,
          explanation: {
            what: `Form kInput Reduction Fusion Cluster ending at '${inst.id}'`,
            why: `Fused elementwise producers directly into reduction consumer node '${inst.id}'.`,
          },
          primarySnapshot: {
            kind: "array",
            elements: instructions.map((item, i) => ({
              id: `inst-${i}`,
              value: item.opcode,
              state: i <= idx ? "visited" : "default",
              pointers: [item.id],
            })),
          },
          auxiliaryState: {
            customState: {
              fusedKind: "kInput (Reduction)",
              fusedCount: String(fusionNode.instructionsFused.length),
            },
          },
          variables: { idx, fusionKind: "kInput" },
        });

        fusedInstructions.push(fusionNode);
        currentCluster = [];
      } else {
        fusedInstructions.push(inst);
      }
    } else {
      if (currentCluster.length > 0) {
        const fusionNode = {
          id: `fusion_${currentCluster[0].id}_${currentCluster[currentCluster.length - 1].id}`,
          opcode: "fusion",
          fusionKind: "kLoop",
          instructionsFused: currentCluster.map((i) => i.id),
        };
        fusedInstructions.push(fusionNode);
        currentCluster = [];
      }
      fusedInstructions.push(inst);
    }
  });

  if (currentCluster.length > 0) {
    const fusionNode = {
      id: `fusion_${currentCluster[0].id}_${currentCluster[currentCluster.length - 1].id}`,
      opcode: "fusion",
      fusionKind: "kLoop",
      instructionsFused: currentCluster.map((i) => i.id),
    };
    fusedInstructions.push(fusionNode);
  }

  const finalElements: ArrayElement[] = fusedInstructions.map((f, idx) => ({
    id: `fused-${idx}`,
    value: f.opcode === "fusion" ? `fusion (${f.fusionKind})` : f.opcode,
    state: "sorted",
    pointers: [f.id],
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 50,
    explanation: {
      what: "Google XLA HLO Cluster Fusion Complete",
      why: `Compressed ${instructions.length} original HLO instructions into ${fusedInstructions.length} fused GPU/TPU execution nodes. Memory bandwidth footprint minimized.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: finalElements,
    },
    auxiliaryState: {
      customState: {
        originalCount: String(instructions.length),
        fusedCount: String(fusedInstructions.length),
      },
    },
    variables: { complete: true, finalCount: fusedInstructions.length },
  });

  return steps;
};

const XLA_HLO_GRAPH_OPTIMIZER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8],
  hints: [
    {
      line: 15,
      hint: "Accumulate elementwise instructions (multiply, add, broadcast) into active fusion cluster.",
    },
    {
      line: 27,
      hint: "Fuse elementwise producers directly into reduce consumer forming kInput fusion node.",
    },
    { line: 50, hint: "Return final HLO module instructions after cluster fusion pass." },
  ],
  distractors: [
    "current_cluster.clear()",
    "fusion_kind = 'kInvalid'",
    "fused_instructions = instructions[::-1]",
  ],
  lineExplanations: {
    1: "Defines entry point for XLA HLO cluster fusion optimization compiler.",
    15: "Accumulates elementwise HLO operations into SRAM fusion clusters.",
    27: "Constructs kInput reduction fusion nodes combining producers with reduce operations.",
    50: "Emits final optimized XLA HLO instruction module.",
  },
};

export const xlaHloGraphOptimizer: AlgorithmDefinition<XlaHloGraphOptimizerInput> = {
  id: "xla-hlo-graph-optimizer",
  title: "Google XLA HLO Graph Optimizer & Cluster Fusion Engine",
  category: "ml_graph_compilers",
  categories: ["ml_graph_compilers"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_graph_compilers",
  description:
    "Google Accelerated Linear Algebra (XLA) is a domain-specific compiler for TensorFlow, JAX, and PyTorch. XLA ingests High-Level Optimizer (HLO) IR graphs and applies cluster fusion passes—grouping elementwise operations into `kLoop` fusions and reduction trees into `kInput` fusions. Fused HLO clusters generate single monolithic CUDA kernels or TPU assembly instructions, eliminating DRAM memory roundtrips.\n\nInput Format:\n- instructions: List of HLO instruction metadata objects containing `id`, `opcode`, and `operands` references.\n- maxFusionSize: Maximum number of instructions permitted within a single fused HLO cluster.\n\nOutput Format:\n- Returns dictionary containing original and fused instruction counts alongside the rewritten `fusedInstructions` list.\n\nEdge Cases & Constraints:\n- Non-fusion barriers: Custom call operations, distributed collectives (AllReduce), or memory control-flow ops act as strict fusion barriers.\n- TPU register pressure: Excessive cluster fusion sizes induce register spilling on TPU/GPU hardware, requiring `maxFusionSize` constraints.",
  constraints: ["1 <= instructions.length <= 100", "1 <= maxFusionSize <= 32"],
  examples: [
    {
      kind: "basic",
      title: "Elementwise + Reduce kInput Fusion",
      inputDisplay: "instructions=[parameter, parameter, multiply, add, reduce], maxFusionSize=4",
      outputDisplay: "fused HLO module (1 parameter ops + 1 kInput fusion node)",
      input: DEFAULT_XLA_HLO_GRAPH_OPTIMIZER_INPUT,
      output: "fusion (kInput), parameter",
      explanation:
        "Fuses multiply and add producers directly into the reduce consumer, creating a single kInput reduction kernel.",
    },
    {
      kind: "complex",
      title: "Max Cluster Size Enforced kLoop Fusion",
      inputDisplay: "4 elementwise ops with maxFusionSize=2",
      outputDisplay: "2 separate kLoop fusion nodes",
      input: {
        instructions: [
          { id: "i1", opcode: "multiply", operands: [] },
          { id: "i2", opcode: "add", operands: [] },
          { id: "i3", opcode: "subtract", operands: [] },
          { id: "i4", opcode: "divide", operands: [] },
        ],
        maxFusionSize: 2,
      },
      output: "2 kLoop fusion nodes",
      explanation: "Splits 4 elementwise instructions into two kLoop fusion nodes of size 2.",
    },
    {
      kind: "negative",
      title: "Fusion Barrier Encountered",
      inputDisplay: "instructions=[multiply, parameter]",
      outputDisplay: "1 fusion node + 1 parameter instruction",
      input: {
        instructions: [
          { id: "i1", opcode: "multiply", operands: [] },
          { id: "p0", opcode: "parameter", operands: [] },
        ],
        maxFusionSize: 4,
      },
      output: "fusion (kLoop), parameter",
      explanation: "Parameter instruction acts as a barrier, closing the preceding fusion cluster.",
    },
  ],
  code: XLA_HLO_GRAPH_OPTIMIZER_CODE,
  timeComplexity: {
    best: "O(H)",
    average: "O(H)",
    worst: "O(H)",
  },
  spaceComplexity: "O(H)",
  complexityAnalysis: {
    time: "O(H) single pass sweep across H HLO instructions in module DAG.",
    space: "O(H) memory allocation for rewritten HLO cluster nodes.",
  },
  topicGuide: {
    overview:
      "Google XLA (Accelerated Linear Algebra) optimizes AI workloads across Cloud TPUs and NVIDIA/AMD GPUs. By operating on High-Level Optimizer (HLO) IR graphs, XLA analyzes dataflow patterns and fuses hundreds of fine-grained tensor operations into custom ML target code.",
    sections: [
      {
        heading: "Core Concepts & HLO Fusion Taxonomies (kLoop vs kInput)",
        body: "XLA categorizes instruction fusion into two primary kinds: `kLoop` fusion merges sequences of pure elementwise operations ($x \\cdot y + z$), emitting a single multi-threaded loop. `kInput` fusion merges elementwise producer nodes directly into a reduction consumer node (e.g. $\\text{ReduceSum}(\\text{Abs}(X))$), avoiding writing intermediate absolute values to memory.",
      },
      {
        heading: "Systems & Memory Hierarchy Footprint Optimization",
        body: "In un-fused JAX or PyTorch code, evaluating $A = B \\cdot C + D$ requires two GPU kernel launches and allocating intermediate array $B \\cdot C$ in High Bandwidth Memory (HBM). XLA HLO fusion keeps intermediate values inside fast GPU SRAM registers, lowering memory bandwidth traffic by up to $5\\times$.",
      },
      {
        heading: "Implementation Nuances & Heuristic Cost Modeling",
        body: "XLA uses a cost model to determine whether fusion is advantageous. If fusing an instruction causes it to be recomputed multiple times by separate consumers, XLA compares the memory bandwidth saved against the extra FLOP computation cost before committing to fusion.",
      },
      {
        heading: "Edge Cases & Production Accelerator Hardware Bounds",
        body: "Excessively large fusion clusters exceed available GPU shared memory or TPU vector register file limits, causing 'register spilling' to slow DRAM. XLA limits cluster depth via `maxFusionSize` heuristics and target register availability checks.",
      },
    ],
    keyTerms: [
      {
        term: "Google XLA",
        definition:
          "Accelerated Linear Algebra domain-specific compiler for TensorFlow, JAX, and PyTorch targeting TPUs and GPUs.",
      },
      {
        term: "HLO (High-Level Optimizer) IR",
        definition:
          "Intermediate representation language used by XLA modeling tensor computations prior to target code emission.",
      },
      {
        term: "kLoop Fusion",
        definition:
          "XLA fusion pass combining pure elementwise operations into a single parallel loop kernel.",
      },
      {
        term: "kInput Reduction Fusion",
        definition:
          "XLA fusion pass merging elementwise producer operations directly into a reduction operation.",
      },
    ],
  },
  trivia: XLA_HLO_GRAPH_OPTIMIZER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_XLA_HLO_GRAPH_OPTIMIZER_INPUT,
  generateSteps: generateXlaHloGraphOptimizerSteps,
};
