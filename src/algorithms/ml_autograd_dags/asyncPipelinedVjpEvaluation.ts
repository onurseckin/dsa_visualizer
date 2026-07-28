import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface asyncPipelinedVjpEvaluationInput {
  data: number[];
  target?: number;
}

export const ASYNCPIPELINEDVJPEVALUATION_CODE = `def async_pipelined_vjp_evaluation(num_stages=4):
    stage_grads = []
    accumulated_vjp = 1.0

    for stage in range(num_stages - 1, -1, -1):
        jacobian_val = 0.5 + stage * 0.1
        accumulated_vjp *= jacobian_val
        stage_grads.append((stage, jacobian_val, accumulated_vjp))

    return stage_grads`;

export const DEFAULT_ASYNCPIPELINEDVJPEVALUATION_INPUT: asyncPipelinedVjpEvaluationInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateAsyncPipelinedVjpEvaluationSteps = (
  input: asyncPipelinedVjpEvaluationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayData = input?.data || [10, 20, 30, 40, 50];
  const target = input?.target ?? 30;
  const numStages = arrayData.length || 5;

  const buildGraphSnapshot = (
    activeStage: number | null,
    computedJacobianStage: number | null,
    processedStages: Set<number>,
    stageJacobians: Record<number, number>,
    stageVjps: Record<number, number>,
    activeEdge: string | null,
    isComplete = false,
  ): { nodes: GraphNodeItem[]; edges: GraphEdgeItem[] } => {
    const nodes: GraphNodeItem[] = [];
    for (let s = 0; s < numStages; s++) {
      let state: ElementState = "default";
      if (isComplete) {
        state = "sorted";
      } else if (s === activeStage) {
        state = "active";
      } else if (s === computedJacobianStage) {
        state = "compare";
      } else if (processedStages.has(s)) {
        state = "visited";
      }

      const jStr = stageJacobians[s] !== undefined ? `J:${stageJacobians[s]}` : `J:?`;
      const vjpStr = stageVjps[s] !== undefined ? `vjp:${stageVjps[s]}` : `vjp:?`;

      nodes.push({
        id: `gpu-${s}`,
        label: `GPU_${s} (${jStr}, ${vjpStr})`,
        val: stageVjps[s] ?? 0,
        state,
        x: 80 + s * 140,
        y: 150,
      });
    }

    const edges: GraphEdgeItem[] = [];
    for (let s = numStages - 1; s > 0; s--) {
      const edgeKey = `gpu-${s}->gpu-${s - 1}`;
      const isPath = activeEdge === edgeKey;
      const isTraversed = processedStages.has(s) || isComplete;
      edges.push({
        from: `gpu-${s}`,
        to: `gpu-${s - 1}`,
        isTraversed,
        isPath,
      });
    }

    return { nodes, edges };
  };

  const processedStages = new Set<number>();
  const stageJacobians: Record<number, number> = {};
  const stageVjps: Record<number, number> = {};
  const stageGrads: Array<[number, number, number]> = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeStage: number | null = null,
    computedJacobianStage: number | null = null,
    activeEdge: string | null = null,
    customState?: Record<string, string | number>,
    isComplete = false,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
        ...buildGraphSnapshot(
          activeStage,
          computedJacobianStage,
          processedStages,
          stageJacobians,
          stageVjps,
          activeEdge,
          isComplete,
        ),
      },
      auxiliaryState: {
        customState: {
          pipeline_schedule: "1F1B_ASYNC",
          total_gpus: String(numStages),
          data: `[${arrayData.join(", ")}]`,
          target: String(target),
          stage_grads_count: String(stageGrads.length),
          accumulated_vjp: String(variables.accumulated_vjp ?? 1.0),
          ...customState,
        },
      },
      variables,
    });
  };

  // Step 1: Line 1 - Init Pipelined Multi-GPU VJP Engine
  addStep(
    1,
    "Initialize Async Pipelined Multi-GPU VJP Engine",
    "Setting up 1F1B backward pipeline schedule across distributed GPU ranks (Rank 0 .. Rank N-1).",
    { numStages, target, phase: "PIPELINE_INIT" },
  );

  // Step 2: Line 2 - stage_grads = []
  addStep(
    2,
    "Initialize Stage Gradient Buffer `stage_grads = []`",
    "Allocating buffer to record per-GPU stage VJP tuples (stage, jacobian_val, accumulated_vjp).",
    { stageGradsCount: 0, phase: "ALLOC_BUFFER" },
  );

  // Step 3: Line 3 - accumulated_vjp = 1.0
  addStep(
    3,
    "Initialize Initial Loss Gradient `accumulated_vjp = 1.0`",
    "Seeding output loss node VJP gradient scalar v = dL/dL = 1.0 at final GPU rank.",
    { accumulated_vjp: 1.0, phase: "LOSS_VJP_SET" },
  );

  // Reverse stage traversal simulation (stage numStages-1 down to 0)
  let vjpAccumulator = 1.0;

  for (let sIdx = numStages - 1; sIdx >= 0; sIdx--) {
    const jacobianVal = Number((0.5 + sIdx * 0.1).toFixed(2));

    // Sub-step A: Enter Pipeline Stage (Line 5)
    addStep(
      5,
      `Enter Pipeline Stage ${sIdx} (GPU Rank ${sIdx})`,
      `Iterating in reverse topological autograd order. Active rank: GPU_${sIdx}.`,
      { stage: sIdx, gpuRank: sIdx, phase: "ENTER_STAGE" },
      sIdx,
    );

    // Sub-step B: Compute local stage Jacobian (Line 6)
    stageJacobians[sIdx] = jacobianVal;
    addStep(
      6,
      `Compute Local Stage Jacobian: jacobian_val = ${jacobianVal}`,
      `Evaluating local layer derivative factor J_${sIdx} = 0.5 + ${sIdx} * 0.1 = ${jacobianVal} on GPU_${sIdx}.`,
      { stage: sIdx, jacobian_val: jacobianVal, phase: "COMPUTE_JACOBIAN" },
      null,
      sIdx,
      null,
      { stageJacobian: String(jacobianVal) },
    );

    // Sub-step C: Vector-Jacobian Product (VJP) Accumulation (Line 7)
    vjpAccumulator = Number((vjpAccumulator * jacobianVal).toFixed(4));
    stageVjps[sIdx] = vjpAccumulator;
    const p2pEdge = sIdx > 0 ? `gpu-${sIdx}->gpu-${sIdx - 1}` : null;
    addStep(
      7,
      `Vector-Jacobian Product: accumulated_vjp *= ${jacobianVal} -> ${vjpAccumulator}`,
      `Propagating gradient backwards across pipeline: v_{${sIdx}-1} = v_{${sIdx}} * J_{${sIdx}}. Updated accumulated VJP: ${vjpAccumulator}.`,
      {
        stage: sIdx,
        jacobian_val: jacobianVal,
        accumulated_vjp: vjpAccumulator,
        phase: "ACCUMULATE_VJP",
      },
      sIdx,
      null,
      p2pEdge,
      { accumulated_vjp: String(vjpAccumulator) },
    );

    // Sub-step D: Log Stage Gradient & Async P2P Transfer (Line 8)
    stageGrads.push([sIdx, jacobianVal, vjpAccumulator]);
    processedStages.add(sIdx);
    addStep(
      8,
      `Log Stage Gradient & Async P2P Transfer to GPU_${Math.max(0, sIdx - 1)}`,
      `Appended (${sIdx}, ${jacobianVal}, ${vjpAccumulator}) to stage_grads while overlapping NVLink P2P tensor transmission.`,
      {
        stage: sIdx,
        srcGpu: sIdx,
        dstGpu: Math.max(0, sIdx - 1),
        loggedCount: stageGrads.length,
        phase: "LOG_STAGE_GRAD",
      },
      null,
      null,
      p2pEdge,
    );
  }

  // Line 10: Return stage_grads
  addStep(
    10,
    "Return Stage Gradient History `stage_grads`",
    "All GPU pipeline stages evaluated in reverse topological order. Returning recorded VJP stage gradient tuples.",
    { stagesCompleted: numStages, finalVjp: vjpAccumulator, phase: "RETURN_RESULTS" },
    null,
    null,
    null,
    undefined,
    true,
  );

  // Line 10: Execution Complete
  addStep(
    10,
    "Execution Complete",
    "Successfully completed async pipelined Vector-Jacobian Product backward pass across all GPU ranks.",
    { completed: true, totalSteps: stepIndex },
    null,
    null,
    null,
    undefined,
    true,
  );

  return steps;
};

const ASYNCPIPELINEDVJPEVALUATION_TRIVIA: TriviaMeta = {
  skipLines: [4, 9],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "accumulated_vjp += jacobian_val",
  ],
  hints: [
    { line: 3, hint: "Initialize initial accumulated loss gradient to 1.0." },
    { line: 5, hint: "Iterate pipeline stages in reverse topological order." },
    { line: 7, hint: "Multiply accumulated VJP by local stage Jacobian matrix factor." },
  ],
  lineExplanations: {
    1: "Defines entry point for async_pipelined_vjp_evaluation function.",
    2: "Initializes stage_grads list to store per-GPU stage gradient tuples.",
    3: "Sets initial accumulated Vector-Jacobian Product (VJP) loss gradient scalar to 1.0.",
    4: "Blank line separating initial gradient setup from reverse stage traversal loop.",
    5: "Iterates through pipeline parallel GPU stages in reverse topological autograd order (num_stages-1 down to 0).",
    6: "Calculates local stage Jacobian derivative factor J_stage for current GPU rank.",
    7: "Accumulates VJP by multiplying incoming gradient scalar by local stage Jacobian factor.",
    8: "Appends stage gradient tuple (stage, jacobian_val, accumulated_vjp) to stage_grads history log.",
    9: "Blank line before returning completed pipeline stage gradient history.",
    10: "Returns stage_grads list containing recorded VJP outputs across all GPU ranks.",
  },
};

export const asyncPipelinedVjpEvaluation: AlgorithmDefinition<asyncPipelinedVjpEvaluationInput> = {
  id: "async-pipelined-vjp-evaluation",
  title: "Async Pipelined Multi-GPU VJP Evaluator",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Hard",
  description: `### Async Pipelined Multi-GPU VJP Evaluator

In large language model distributed training (**Megatron-LM**, **DeepSpeed Pipeline Parallelism**, and **1F1B Schedules**), backward autograd execution relies on Vector-Jacobian Product (VJP) evaluation across multi-GPU pipeline ranks.

#### Why It Exists & What It Solves
When deep learning models exceed the memory capacity of a single GPU, layers are partitioned sequentially across multiple GPU ranks ($GPU_0 \\to GPU_1 \\to \\dots \\to GPU_{N-1}$).

During the backward pass:
1. Gradients must travel in reverse topological order ($GPU_{N-1} \\to GPU_0$).
2. Computing vector-matrix products $v^T J_s$ at each stage yields the incoming gradient $v_{s-1}$ for the preceding stage.
3. Synchronous communication stalls GPU compute engines during inter-rank NVLink transfers (pipeline bubbles).

With async pipelined VJP evaluation:
- Peer-to-Peer (P2P) async transfers transmit gradient vectors $v_{s-1}$ over high-speed NVLink interconnects concurrently with local activation gradient kernel launches.
- Pipeline bubble overhead is minimized under 1F1B (One Forward, One Backward) schedules.

#### Step-by-Step Mechanism
1. **Initialize Loss Gradient**: Set $v_{loss} = 1.0$ at output GPU rank $GPU_{N-1}$.
2. **Reverse Stage Iteration**: Loop backwards from stage $N-1$ down to stage $0$.
3. **Local Jacobian Computation**: Evaluate local layer derivatives $J_s = \\frac{\\partial h_s}{\\partial h_{s-1}}$.
4. **VJP Accumulation**: Compute Vector-Jacobian Product $v_{s-1} = v_s \\cdot J_s$.
5. **Async P2P Transmission**: Dispatch asynchronous inter-GPU tensor send/recv buffers while logging stage gradient history.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(S)$ where $S$ is number of pipeline stages. Async P2P communication hides $\\mathcal{O}(\\text{transfer time})$.
- **Space Complexity**: $\\mathcal{O}(S)$ memory for staging activation gradients per micro-batch.
- **Trade-Off**: Requires careful micro-batch memory management to avoid Out-Of-Memory (OOM) errors during peak micro-batch accumulation.`,
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Autograd Pass",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "Evaluated Graph State",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Standard execution pass over computation graph.",
    },
    {
      kind: "complex",
      title: "Larger DAG Input",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "Evaluated Graph State",
      input: { data: [10, 20, 30, 40, 50] },
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates multi-node computation graph DAG.",
    },
    {
      kind: "negative",
      title: "Edge Case DAG",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "Evaluated Graph State",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Edge case handling completes safely.",
    },
  ],
  code: ASYNCPIPELINEDVJPEVALUATION_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across pipeline stage vertices and tensor communication edges.",
    space: "Linear memory allocation for stage gradient tracking buffers.",
  },
  topicGuide: {
    overview:
      "Async pipelined VJP evaluation enables distributed model training by propagating Vector-Jacobian Products backward across GPU ranks while overlapping NVLink communication with GPU compute kernels.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "For pipeline stage s with local Jacobian J_s and incoming gradient v_s, out-going gradient is v_{s-1} = v_s @ J_s. By induction, v_0 = v_{final} @ J_{final} @ ... @ J_0.",
      },
      {
        heading: "Practical Applications & ML Infra Ecosystem",
        body: "Used in Megatron-LM 1F1B schedule, DeepSpeed Pipeline Parallelism, PyTorch Distributed RPC, and FSDP+PP hybrid execution topologies to scale multi-billion parameter transformer models.",
      },
      {
        heading: "Step-by-Step Walkthrough & Algorithmic Mechanics",
        body: "1. Set initial loss gradient v = 1.0 at final GPU rank.\n2. Iterate through pipeline stages in reverse topological order.\n3. Compute local stage Jacobian matrix J_s.\n4. Perform Vector-Jacobian Product accumulation v *= J_s.\n5. Issue non-blocking NVLink P2P transmit to preceding GPU rank.",
      },
      {
        heading: "Hardware/Systems Trade-Offs & Complexity Analysis",
        body: "Runs in O(S) time across S pipeline stages. Asynchronous peer-to-peer transfers eliminate GPU idle bubbles, maximizing tensor core utilization.",
      },
    ],
    keyTerms: [
      {
        term: "Vector-Jacobian Product (VJP)",
        definition:
          "Mathematical operation v^T @ J propagating output gradients backward through a vector function.",
      },
      {
        term: "Pipeline Parallelism",
        definition:
          "Splitting model layers across multiple GPUs in a sequential processing pipeline.",
      },
      {
        term: "1F1B Schedule",
        definition:
          "Pipeline scheduling pattern executing One Forward pass followed by One Backward pass per GPU.",
      },
      {
        term: "Async P2P Communication",
        definition:
          "Non-blocking peer-to-peer GPU memory transfers over high-speed NVLink or InfiniBand interconnects.",
      },
    ],
  },
  trivia: ASYNCPIPELINEDVJPEVALUATION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_ASYNCPIPELINEDVJPEVALUATION_INPUT,
  generateSteps: generateAsyncPipelinedVjpEvaluationSteps,
};
