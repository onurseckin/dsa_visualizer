import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
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

function buildXlaGraphSnapshot(
  instructions: HloInstruction[],
  currentIndex: number,
  clusterInstIds: string[],
): GraphVisualSnapshot {
  const levelMap = new Map<string, number>();

  const getLevel = (id: string): number => {
    if (levelMap.has(id)) return levelMap.get(id)!;
    const inst = instructions.find((i) => i.id === id);
    if (!inst || !inst.operands || inst.operands.length === 0) {
      levelMap.set(id, 0);
      return 0;
    }
    let maxP = 0;
    for (const opId of inst.operands) {
      maxP = Math.max(maxP, getLevel(opId));
    }
    const lvl = maxP + 1;
    levelMap.set(id, lvl);
    return lvl;
  };

  instructions.forEach((inst) => getLevel(inst.id));

  const levelNodes: Record<number, string[]> = {};
  instructions.forEach((inst) => {
    const lvl = levelMap.get(inst.id) || 0;
    if (!levelNodes[lvl]) levelNodes[lvl] = [];
    levelNodes[lvl].push(inst.id);
  });

  const nodes: GraphNodeItem[] = instructions.map((inst, r) => {
    let state: GraphNodeItem["state"] = "default";

    if (clusterInstIds.includes(inst.id)) {
      state = "active";
    } else if (r === currentIndex) {
      state = "pivot";
    } else if (r < currentIndex) {
      state = "sorted";
    }

    const lvl = levelMap.get(inst.id) || 0;
    const nodesInLevel = levelNodes[lvl] || [inst.id];
    const idxInLevel = nodesInLevel.indexOf(inst.id);
    const totalInLevel = nodesInLevel.length;

    const startY = 180 - ((totalInLevel - 1) * 90) / 2;
    const x = 100 + lvl * 160;
    const y = Math.max(60, startY + (idxInLevel >= 0 ? idxInLevel : 0) * 90);

    return {
      id: inst.id,
      label: `${inst.id}: ${inst.opcode}`,
      x,
      y,
      state,
      val: r,
    };
  });

  const edges: GraphEdgeItem[] = [];
  instructions.forEach((inst) => {
    inst.operands.forEach((opId) => {
      if (instructions.some((i) => i.id === opId)) {
        const isClusterEdge = clusterInstIds.includes(inst.id) && clusterInstIds.includes(opId);
        edges.push({
          from: opId,
          to: inst.id,
          isTraversed: isClusterEdge,
          isPath: isClusterEdge,
        });
      }
    });
  });

  return {
    kind: "graph",
    nodes,
    edges,
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
      primarySnapshot: buildXlaGraphSnapshot(instructions, currentIndex, clusterInstIds),
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
    2,
    "Initialize Container fused_instructions",
    "Creating empty list to accumulate fused HLO nodes.",
    { n },
    0,
    [],
  );

  addStep(
    3,
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
      5,
      `Inspect Instruction '${inst.id}' (${inst.opcode})`,
      `Evaluating instruction opcode '${inst.opcode}' for fusion compatibility.`,
      { idx, inst_id: inst.id, opcode: inst.opcode },
      idx,
      currentCluster.map((c) => c.id),
    );

    const isElementwise = ["multiply", "add", "broadcast", "subtract", "divide"].includes(
      inst.opcode,
    );

    addStep(
      6,
      `Evaluate is_elementwise for '${inst.id}' (${inst.opcode})`,
      `is_elementwise = ${["multiply", "add", "broadcast", "subtract", "divide"].includes(inst.opcode)}.`,
      { idx, inst_id: inst.id, is_elementwise: isElementwise },
      idx,
      currentCluster.map((c) => c.id),
    );

    if (isElementwise) {
      currentCluster.push(inst);

      addStep(
        7,
        `Add '${inst.opcode}' (${inst.id}) to Active Fusion Cluster`,
        `Cluster size is now ${currentCluster.length}/${maxFusionSize}. Operands cached in GPU SRAM registers.`,
        { idx, inst_id: inst.id, clusterSize: currentCluster.length },
        idx,
        currentCluster.map((c) => c.id),
      );

      if (currentCluster.length >= maxFusionSize) {
        addStep(
          8,
          `Cluster Size ${currentCluster.length} >= max_fusion_size ${maxFusionSize}: emit kLoop fusion`,
          `Saturated max_fusion_size limit. Emitting kLoop fusion now.`,
          { idx, clusterSize: currentCluster.length, maxFusionSize },
          idx,
          currentCluster.map((c) => c.id),
        );

        const fusionNode = {
          id: `fusion_${currentCluster[0].id}_${currentCluster[currentCluster.length - 1].id}`,
          opcode: "fusion",
          fusionKind: "kLoop",
          instructionsFused: currentCluster.map((i) => i.id),
        };

        fusedInstructions.push(fusionNode);

        addStep(
          16,
          `Form kLoop Fusion Node '${fusionNode.id}' (Size ${maxFusionSize})`,
          `Appended kLoop fusion to fused_instructions: [${fusionNode.instructionsFused.join(", ")}].`,
          { idx, fusion_id: fusionNode.id, kind: "kLoop" },
          idx,
          [],
        );

        currentCluster = [];

        addStep(
          17,
          "Reset Active Cluster Buffer to Empty",
          "Flushed full cluster into fused_instructions; ready for new cluster.",
          { idx },
          idx,
          [],
        );
      }
    } else if (inst.opcode === "reduce") {
      addStep(
        18,
        `Encountered Reduction Instruction '${inst.id}'`,
        "Checking if an active elementwise producer cluster exists to form a kInput reduction fusion.",
        { idx, inst_id: inst.id, hasCluster: currentCluster.length > 0 },
        idx,
        currentCluster.map((c) => c.id),
      );

      if (currentCluster.length > 0) {
        currentCluster.push(inst);

        addStep(
          20,
          `Append Reduction '${inst.id}' to Cluster for kInput Fusion`,
          `Cluster has ${currentCluster.length - 1} elementwise producers; including reduce makes kInput candidate.`,
          { idx, inst_id: inst.id, clusterSize: currentCluster.length },
          idx,
          currentCluster.map((c) => c.id),
        );

        const fusionNode = {
          id: `fusion_${currentCluster[0].id}_${inst.id}`,
          opcode: "fusion",
          fusionKind: "kInput",
          instructionsFused: currentCluster.map((i) => i.id),
        };

        fusedInstructions.push(fusionNode);

        addStep(
          28,
          `Form kInput Reduction Fusion Node '${fusionNode.id}'`,
          `Fused elementwise producers [${currentCluster
            .slice(0, -1)
            .map((c) => c.id)
            .join(", ")}] directly into reduction consumer '${inst.id}'.`,
          { idx, fusion_id: fusionNode.id, kind: "kInput" },
          idx,
          [],
        );

        currentCluster = [];

        addStep(
          29,
          "Reset Cluster Buffer After kInput Fusion",
          "Flushed reduction cluster; resetting buffer.",
          { idx },
          idx,
          [],
        );
      } else {
        fusedInstructions.push(inst);

        addStep(
          31,
          `Pass Through Unfused Reduction '${inst.id}'`,
          "No producer cluster available; appending standalone reduce instruction.",
          { idx, inst_id: inst.id },
          idx,
          [],
        );
      }
    } else {
      addStep(
        32,
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
          41,
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
        43,
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
      53,
      `Flush Trailing Cluster into '${fusionNode.id}'`,
      `Emitted trailing kLoop fusion node for [${fusionNode.instructionsFused.join(", ")}].`,
      { fusion_id: fusionNode.id },
      n,
      [],
    );
  }

  addStep(
    55,
    "Google XLA HLO Cluster Fusion Complete",
    `Successfully optimized HLO module from ${n} original instructions to ${fusedInstructions.length} fused GPU/TPU nodes.`,
    { complete: true, origCount: n, fusedCount: fusedInstructions.length },
    n,
    [],
  );

  return steps;
};

const XLA_HLO_GRAPH_OPTIMIZER_TRIVIA: TriviaMeta = {
  skipLines: [4, 9, 15, 18, 21, 27, 29, 30, 32, 34, 40, 44, 46, 52, 54, 55, 59],
  distractors: [
    "current_cluster.clear()",
    "fusion_kind = 'kInvalid'",
    "fused_instructions = instructions[::-1]",
    "max_fusion_size = 0",
  ],
  hints: [
    {
      line: 6,
      hint: "Accumulate elementwise instructions (multiply, add, broadcast) into active fusion cluster.",
    },
    {
      line: 19,
      hint: "Fuse elementwise producers directly into reduce consumer forming kInput fusion node.",
    },
    { line: 42, hint: "Append non-fusable barrier instruction directly to fused_instructions." },
    { line: 55, hint: "Return final optimized HLO module instruction payload." },
  ],
  lineExplanations: {
    1: "Function signature for optimize_xla_hlo receiving instructions and max_fusion_size.",
    2: "Initializes fused_instructions list to store rewritten HLO instructions.",
    3: "Initializes current_cluster list to track active elementwise instruction window.",
    4: "Blank line before main loop.",
    5: "Loop iterating over each instruction inst in instructions list.",
    6: "Checks if opcode is elementwise operation (multiply, add, broadcast, subtract, divide).",
    7: "Appends elementwise instruction inst to current_cluster.",
    8: "Checks if current_cluster length has reached max_fusion_size threshold.",
    9: "Opens fusion_node dictionary payload.",
    10: "Sets composite fusion node identifier.",
    11: "Sets opcode to fusion.",
    12: "Sets fusionKind to kLoop for elementwise parallel loop execution.",
    13: "Collects list of instruction IDs included in fusion cluster.",
    14: "Sets rootOpcode to last instruction's opcode.",
    15: "Closes fusion_node dictionary.",
    16: "Appends fused kLoop node to fused_instructions.",
    17: "Resets current_cluster to empty list.",
    18: "Elif branch checking if opcode is reduce.",
    19: "Checks if an active producer cluster current_cluster exists.",
    20: "Appends reduce instruction inst to current_cluster.",
    21: "Opens reduction fusion_node dictionary.",
    22: "Sets composite fusion node identifier.",
    23: "Sets opcode to fusion.",
    24: "Sets fusionKind to kInput for producer-reduction fusion.",
    25: "Collects fused instruction IDs.",
    26: "Sets rootOpcode to reduce.",
    27: "Closes reduction fusion_node payload.",
    28: "Appends kInput fusion node to fused_instructions.",
    29: "Resets current_cluster to empty list.",
    30: "Else branch when reduce has no preceding elementwise cluster.",
    31: "Appends unfused reduce instruction to fused_instructions.",
    32: "Else branch for non-fusable barrier instructions (parameter, custom-call).",
    33: "Checks if active cluster current_cluster exists before barrier.",
    34: "Opens kLoop fusion_node dictionary for active cluster.",
    35: "Sets composite fusion node identifier.",
    36: "Sets opcode to fusion.",
    37: "Sets fusionKind to kLoop.",
    38: "Collects fused instruction IDs.",
    39: "Sets rootOpcode to last cluster instruction opcode.",
    40: "Closes fusion_node dictionary.",
    41: "Appends fusion node to fused_instructions.",
    42: "Resets current_cluster to empty list.",
    43: "Appends non-fusable instruction inst directly to fused_instructions.",
    44: "Blank line after main loop.",
    45: "Checks if trailing un-flushed cluster current_cluster remains after loop.",
    46: "Opens trailing fusion_node dictionary.",
    47: "Sets composite fusion node identifier.",
    48: "Sets opcode to fusion.",
    49: "Sets fusionKind to kLoop.",
    50: "Collects fused instruction IDs.",
    51: "Sets rootOpcode to last cluster instruction opcode.",
    52: "Closes trailing fusion_node payload.",
    53: "Appends trailing fusion node to fused_instructions.",
    54: "Blank line before final return.",
    55: "Opens return dictionary payload.",
    56: "Returns originalInstructionCount.",
    57: "Returns fusedInstructionCount.",
    58: "Returns fusedInstructions list.",
    59: "Closes return dictionary payload.",
  },
};

export const xlaHloGraphOptimizer: AlgorithmDefinition<XlaHloGraphOptimizerInput> = {
  id: "xla-hlo-graph-optimizer",
  title: "Google XLA HLO Graph Optimizer & Cluster Fusion Engine",
  topicIds: ["ml_graph_compilers"],
  difficulty: "Hard",
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
