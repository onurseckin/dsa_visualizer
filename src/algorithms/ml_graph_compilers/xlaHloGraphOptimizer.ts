import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
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
    { id: "s1", opcode: "subtract", operands: ["a1", "p1"] },
    { id: "d1", opcode: "divide", operands: ["s1", "p0"] },
    { id: "r1", opcode: "reduce", operands: ["d1"] },
    { id: "m2", opcode: "multiply", operands: ["r1", "p0"] },
    { id: "r2", opcode: "reduce", operands: ["m2"] },
    { id: "out", opcode: "parameter", operands: ["r2"] },
  ],
  maxFusionSize: 4,
};

function buildXlaMatrixSnapshot(
  instructions: HloInstruction[],
  currentIndex: number,
  clusterInstIds: string[],
): MatrixVisualSnapshot {
  const colHeaders = ["Idx", "ID", "Opcode", "Operands", "Cluster State"];
  const rows = instructions.length;
  const cells: MatrixCellItem[] = [];

  instructions.forEach((inst, r) => {
    let state: MatrixCellItem["state"] = "default";
    let statusText = "Pending";

    if (clusterInstIds.includes(inst.id)) {
      state = "active";
      statusText = "In Cluster";
    } else if (r < currentIndex) {
      state = "sorted";
      statusText = "Processed";
    } else if (r === currentIndex) {
      state = "pivot";
      statusText = "Evaluating";
    }

    cells.push(
      { row: r, col: 0, value: r, state },
      { row: r, col: 1, value: inst.id, state },
      { row: r, col: 2, value: inst.opcode, state },
      { row: r, col: 3, value: inst.operands.join(", "), state },
      { row: r, col: 4, value: statusText, state },
    );
  });

  return {
    kind: "matrix",
    rows,
    cols: 5,
    colHeaders,
    cells,
    title: `XLA HLO Cluster Fusion Matrix`,
  };
}

export const generateXlaHloGraphOptimizerSteps = (
  input: XlaHloGraphOptimizerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { instructions, maxFusionSize } = input;
  const n = instructions.length;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentIndex: number,
    clusterInstIds: string[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: buildXlaMatrixSnapshot(instructions, currentIndex, clusterInstIds),
      auxiliaryState: {
        customState: {
          maxFusionSize: String(maxFusionSize),
          totalInstructions: String(n),
          activeClusterSize: String(clusterInstIds.length),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Google XLA HLO Fusion Compiler",
    `Loaded HLO module with ${n} instructions. Max cluster size = ${maxFusionSize}. Scanning for kLoop and kInput fusions.`,
    { n, maxFusionSize },
    0,
    [],
  );

  addStep(
    8,
    "Initialize Container fused_instructions",
    "Creating empty list to accumulate fused HLO nodes.",
    { n },
    0,
    [],
  );

  addStep(
    9,
    "Initialize Container current_cluster",
    "Creating cluster buffer to group compatible elementwise instructions.",
    { n },
    0,
    [],
  );

  const fusedInstructions: Array<{
    id: string;
    opcode: string;
    fusionKind?: string;
    instructionsFused?: string[];
  }> = [];

  let currentCluster: HloInstruction[] = [];

  instructions.forEach((inst, idx) => {
    addStep(
      11,
      `Inspect Instruction '${inst.id}' (${inst.opcode})`,
      `Evaluating instruction opcode '${inst.opcode}' for fusion compatibility.`,
      { idx, inst_id: inst.id, opcode: inst.opcode },
      idx,
      currentCluster.map((c) => c.id),
    );

    const isElementwise = ["multiply", "add", "broadcast", "subtract", "divide"].includes(
      inst.opcode,
    );

    if (isElementwise) {
      currentCluster.push(inst);

      addStep(
        13,
        `Add '${inst.opcode}' (${inst.id}) to Active Fusion Cluster`,
        `Cluster size is now ${currentCluster.length}/${maxFusionSize}. Operands cached in GPU SRAM registers.`,
        { idx, inst_id: inst.id, clusterSize: currentCluster.length },
        idx,
        currentCluster.map((c) => c.id),
      );

      if (currentCluster.length >= maxFusionSize) {
        const fusionNode = {
          id: `fusion_${currentCluster[0].id}_${currentCluster[currentCluster.length - 1].id}`,
          opcode: "fusion",
          fusionKind: "kLoop",
          instructionsFused: currentCluster.map((i) => i.id),
        };

        fusedInstructions.push(fusionNode);

        addStep(
          22,
          `Form kLoop Fusion Node '${fusionNode.id}' (Size ${maxFusionSize})`,
          `Saturated max_fusion_size limit. Emitting kLoop parallel kernel for [${fusionNode.instructionsFused.join(", ")}].`,
          { idx, fusion_id: fusionNode.id, kind: "kLoop" },
          idx,
          [],
        );

        currentCluster = [];

        addStep(
          23,
          "Reset Active Cluster Buffer to Empty",
          "Flushed full cluster into fused_instructions; ready for new cluster.",
          { idx },
          idx,
          [],
        );
      }
    } else if (inst.opcode === "reduce") {
      addStep(
        24,
        `Encountered Reduction Instruction '${inst.id}'`,
        "Checking if an active elementwise producer cluster exists to form a kInput reduction fusion.",
        { idx, inst_id: inst.id, hasCluster: currentCluster.length > 0 },
        idx,
        currentCluster.map((c) => c.id),
      );

      if (currentCluster.length > 0) {
        currentCluster.push(inst);
        const fusionNode = {
          id: `fusion_${currentCluster[0].id}_${inst.id}`,
          opcode: "fusion",
          fusionKind: "kInput",
          instructionsFused: currentCluster.map((i) => i.id),
        };

        fusedInstructions.push(fusionNode);

        addStep(
          34,
          `Form kInput Reduction Fusion Node '${fusionNode.id}'`,
          `Fused elementwise producers [${currentCluster.slice(0, -1).map((c) => c.id).join(", ")}] directly into reduction consumer '${inst.id}'.`,
          { idx, fusion_id: fusionNode.id, kind: "kInput" },
          idx,
          [],
        );

        currentCluster = [];

        addStep(
          35,
          "Reset Cluster Buffer After kInput Fusion",
          "Flushed reduction cluster; resetting buffer.",
          { idx },
          idx,
          [],
        );
      } else {
        fusedInstructions.push(inst);

        addStep(
          37,
          `Pass Through Unfused Reduction '${inst.id}'`,
          "No producer cluster available; appending standalone reduce instruction.",
          { idx, inst_id: inst.id },
          idx,
          [],
        );
      }
    } else {
      addStep(
        38,
        `Encountered Non-Fusable Barrier '${inst.id}' (${inst.opcode})`,
        "Instruction acts as fusion boundary; flushing active cluster.",
        { idx, inst_id: inst.id, opcode: inst.opcode },
        idx,
        currentCluster.map((c) => c.id),
      );

      if (currentCluster.length > 0) {
        const fusionNode = {
          id: `fusion_${currentCluster[0].id}_${currentCluster[currentCluster.length - 1].id}`,
          opcode: "fusion",
          fusionKind: "kLoop",
          instructionsFused: currentCluster.map((i) => i.id),
        };

        fusedInstructions.push(fusionNode);

        addStep(
          47,
          `Flush Cluster Before Barrier into '${fusionNode.id}'`,
          `Emitted kLoop fusion node for preceding elements [${fusionNode.instructionsFused.join(", ")}].`,
          { idx, fusion_id: fusionNode.id },
          idx,
          [],
        );

        currentCluster = [];
      }

      fusedInstructions.push(inst);

      addStep(
        49,
        `Append Barrier Instruction '${inst.id}' (${inst.opcode})`,
        "Appended unfused instruction directly to output module.",
        { idx, inst_id: inst.id },
        idx,
        [],
      );
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

    addStep(
      59,
      `Flush Trailing Cluster into '${fusionNode.id}'`,
      `Emitted trailing kLoop fusion node for [${fusionNode.instructionsFused.join(", ")}].`,
      { fusion_id: fusionNode.id },
      n,
      [],
    );
  }

  addStep(
    66,
    "Google XLA HLO Cluster Fusion Complete",
    `Successfully optimized HLO module from ${n} original instructions to ${fusedInstructions.length} fused GPU/TPU nodes.`,
    { complete: true, origCount: n, fusedCount: fusedInstructions.length },
    n,
    [],
  );

  return steps;
};

const XLA_HLO_GRAPH_OPTIMIZER_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 10, 21, 23, 24, 33, 35, 36, 38, 46, 48, 50, 51, 58, 60, 61, 65, 66],
  distractors: [
    "current_cluster.clear()",
    "fusion_kind = 'kInvalid'",
    "fused_instructions = instructions[::-1]",
    "max_fusion_size = 0",
  ],
  hints: [
    {
      line: 13,
      hint: "Accumulate elementwise instructions (multiply, add, broadcast) into active fusion cluster.",
    },
    {
      line: 26,
      hint: "Fuse elementwise producers directly into reduce consumer forming kInput fusion node.",
    },
    { line: 49, hint: "Append non-fusable barrier instruction directly to fused_instructions." },
    { line: 66, hint: "Return final optimized HLO module instruction payload." },
  ],
  lineExplanations: {
    1: "Function signature for optimize_xla_hlo receiving instructions and max_fusion_size.",
    2: "Docstring start describing XLA HLO module optimization pass.",
    3: "Describes instruction-level cluster fusion pass.",
    4: "Describes identification of elementwise and reduction instruction sequences.",
    5: "Describes grouping into kLoop or kInput fusion nodes.",
    6: "Describes elimination of intermediate HBM allocations.",
    7: "Docstring close.",
    8: "Initializes fused_instructions list to store rewritten HLO instructions.",
    9: "Initializes current_cluster list to track active elementwise instruction window.",
    10: "Blank line before main loop.",
    11: "Loop iterating over each instruction inst in instructions list.",
    12: "Checks if opcode is elementwise operation (multiply, add, broadcast, subtract, divide).",
    13: "Appends elementwise instruction inst to current_cluster.",
    14: "Checks if current_cluster length has reached max_fusion_size threshold.",
    15: "Opens fusion_node dictionary payload.",
    16: "Sets composite fusion node identifier.",
    17: "Sets opcode to fusion.",
    18: "Sets fusionKind to kLoop for elementwise parallel loop execution.",
    19: "Collects list of instruction IDs included in fusion cluster.",
    20: "Sets rootOpcode to last instruction's opcode.",
    21: "Closes fusion_node dictionary.",
    22: "Appends fused kLoop node to fused_instructions.",
    23: "Resets current_cluster to empty list.",
    24: "Elif branch checking if opcode is reduce.",
    25: "Checks if an active producer cluster current_cluster exists.",
    26: "Appends reduce instruction inst to current_cluster.",
    27: "Opens reduction fusion_node dictionary.",
    28: "Sets composite fusion node identifier.",
    29: "Sets opcode to fusion.",
    30: "Sets fusionKind to kInput for producer-reduction fusion.",
    31: "Collects fused instruction IDs.",
    32: "Sets rootOpcode to reduce.",
    33: "Closes reduction fusion_node payload.",
    34: "Appends kInput fusion node to fused_instructions.",
    35: "Resets current_cluster to empty list.",
    36: "Else branch when reduce has no preceding elementwise cluster.",
    37: "Appends unfused reduce instruction to fused_instructions.",
    38: "Else branch for non-fusable barrier instructions (parameter, custom-call).",
    39: "Checks if active cluster current_cluster exists before barrier.",
    40: "Opens kLoop fusion_node dictionary for active cluster.",
    41: "Sets composite fusion node identifier.",
    42: "Sets opcode to fusion.",
    43: "Sets fusionKind to kLoop.",
    44: "Collects fused instruction IDs.",
    45: "Sets rootOpcode to last cluster instruction opcode.",
    46: "Closes fusion_node dictionary.",
    47: "Appends fusion node to fused_instructions.",
    48: "Resets current_cluster to empty list.",
    49: "Appends non-fusable instruction inst directly to fused_instructions.",
    50: "Blank line after main loop.",
    51: "Checks if trailing un-flushed cluster current_cluster remains after loop.",
    52: "Opens trailing fusion_node dictionary.",
    53: "Sets composite fusion node identifier.",
    54: "Sets opcode to fusion.",
    55: "Sets fusionKind to kLoop.",
    56: "Collects fused instruction IDs.",
    57: "Sets rootOpcode to last cluster instruction opcode.",
    58: "Closes trailing fusion_node payload.",
    59: "Appends trailing fusion node to fused_instructions.",
    60: "Blank line before final return.",
    61: "Opens return dictionary payload.",
    62: "Returns originalInstructionCount.",
    63: "Returns fusedInstructionCount.",
    64: "Returns fusedInstructions list.",
    65: "Closes return dictionary payload.",
    66: "Return statement end.",
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
    "Google Accelerated Linear Algebra (XLA) is a domain-specific compiler framework designed for high-performance execution of TensorFlow, JAX, and PyTorch models across Cloud TPUs and NVIDIA GPUs. In un-fused computation graphs, evaluating complex expressions requires executing separate kernel launches for every math operation. Each kernel launch incurs launch latency and forces intermediate tensor results to be written to and read back from High Bandwidth Memory (HBM/DRAM).\n\n### Mathematical Formulation & Fusion Passes\n1. **`kLoop` Fusion**: Combines a chain of $K$ elementwise instructions $f_1, f_2, \\dots, f_K$ acting on element $x_j$:\n$$y_j = (f_K \\circ \\dots \\circ f_2 \\circ f_1)(x_j)$$\nIn an un-fused graph, this requires $K$ GPU/TPU kernel launches and $2K$ DRAM accesses per element. `kLoop` fusion collapses this into a single loop kernel executing in $1$ DRAM write and $1$ DRAM read, achieving memory traffic reduction ratio:\n$$\\text{Traffic Reduction} = \\frac{2K}{2} = K\\times$$\n\n2. **`kInput` Reduction Fusion**: Fuses elementwise producer instructions $g(x_j)$ directly into a downstream reduction consumer $\\text{Reduce}_{\\oplus}$ over axis $\\Omega$:\n$$S = \\bigoplus_{j \\in \\Omega} g(x_j)$$\nThe reduction kernel computes $g(x_j)$ on-the-fly in SRAM registers before accumulating into reduction register state $S$, bypassing intermediate vector storage entirely.\n\n3. **Fusion Boundaries & Register Constraints**: Non-fusable ops (such as `parameter` or `all-reduce`) act as fusion barriers, closing the active cluster and bounding maximum fusion size ($N_{\\text{cluster}} \\le N_{\\text{max}}$) to prevent register spilling.\n\nInput Format:\n- `instructions`: List of HLO instruction metadata objects containing `id`, `opcode`, and `operands` references.\n- `maxFusionSize`: Maximum number of instructions permitted within a single fused HLO cluster.\n\nOutput Format:\n- Returns dictionary containing original and fused instruction counts alongside rewritten `fusedInstructions` list.\n\nEdge Cases & Constraints:\n- Non-fusion barriers: Custom call operations, distributed collectives (AllReduce), or memory control-flow ops act as strict fusion barriers.\n- TPU register pressure: Excessive cluster fusion sizes ($N_{\\text{cluster}} > N_{\\text{max}}$) induce register spilling on TPU/GPU hardware, requiring `maxFusionSize` constraints.",
  constraints: ["1 <= instructions.length <= 100", "1 <= maxFusionSize <= 32"],
  examples: [
    {
      kind: "basic",
      title: "10 HLO Instructions with kLoop & kInput Fusions",
      inputDisplay:
        "10 instructions: 2 parameters, 4 elementwise ops (multiply/add/sub/div), 1 reduce, 1 multiply, 1 reduce, 1 output parameter",
      outputDisplay: "Compressed HLO module with kLoop and kInput fusion nodes",
      input: DEFAULT_XLA_HLO_GRAPH_OPTIMIZER_INPUT,
      output: "Optimized HLO module with 5 fused/parameter nodes",
      explanation:
        "Fuses elementwise producers into kLoop and kInput reduction nodes, eliminating intermediate DRAM writes.",
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
      "Google XLA (Accelerated Linear Algebra) is the underlying compilation engine for JAX, TensorFlow, and PyTorch/XLA. It targets Cloud TPUs (v4, v5p, v6e) and NVIDIA/AMD GPUs, optimizing compute graphs to extract maximum hardware utilization.",
    sections: [
      {
        heading: "Why It Exists",
        body: "High-level ML frameworks build flexible dataflow graphs where every primitive function is decoupled. When executed naively, memory bandwidth bounds severely restrict GPU/TPU performance. XLA compiles entire computational subgraphs into custom machine code, eliminating memory roundtrips.",
      },
      {
        heading: "What It Solves",
        body: "XLA addresses memory bandwidth saturation and kernel launch overheads. By combining elementwise operations into `kLoop` kernels and reductions into `kInput` kernels, XLA drastically reduces memory traffic and accelerates tensor computations by $3\\times - 7\\times$.",
      },
      {
        heading: "Step-by-Step Intuition",
        body: "The compiler pass iterates through HLO instructions sequentially. It accumulates elementwise operations into an active cluster up to `maxFusionSize` ($N_{\\text{cluster}} \\le N_{\\text{max}}$). If a reduction operation is encountered, it fuses the cluster into a `kInput` reduction node. If a barrier (e.g. parameter or collective) is hit, it flushes the active cluster into a `kLoop` fusion node.",
      },
      {
        heading: "Trade-offs & Systems Impact",
        body: "Fusing too many operations into a single kernel increases register usage on GPU/TPU hardware. If register demand exceeds physical register file size ($R_{\\text{allocated}} > R_{\\text{max}}$), the compiler spills registers to slow memory, degrading performance. `maxFusionSize` limits prevent register pressure overflow.",
      },
      {
        heading: "Complexity & Scalability",
        body: "HLO cluster fusion executes in linear $\\mathcal{O}(H)$ time relative to instruction count $H$. Memory complexity is $\\mathcal{O}(H)$ for the transformed module.",
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
          "XLA fusion pass combining pure elementwise operations into a single parallel loop kernel: $y_j = (f_K \\circ \\dots \\circ f_1)(x_j)$.",
      },
      {
        term: "kInput Reduction Fusion",
        definition:
          "XLA fusion pass merging elementwise producer operations directly into a reduction operation: $S = \\bigoplus_{j \\in \\Omega} g(x_j)$.",
      },
    ],
  },
  trivia: XLA_HLO_GRAPH_OPTIMIZER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_XLA_HLO_GRAPH_OPTIMIZER_INPUT,
  generateSteps: generateXlaHloGraphOptimizerSteps,
};
