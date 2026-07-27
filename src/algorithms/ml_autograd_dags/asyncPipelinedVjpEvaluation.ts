import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface asyncPipelinedVjpEvaluationInput {
  data: number[];
  target?: number;
}

export const ASYNCPIPELINEDVJPEVALUATION_CODE = `def async_pipelined_vjp_evaluation(num_stages=4):
    """
    Simulates async pipelined Vector-Jacobian Product (VJP) backward evaluation.
    """
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

  const elements: ArrayElement[] = arrayData.map((val, idx) => ({
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
    customState?: Record<string, string | number>,
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
          data: `[${arrayData.join(", ")}]`,
          target: String(target),
          accumulated_vjp: String(variables.accumulated_vjp ?? 1.0),
          ...customState,
        },
      },
      variables,
    });
  };

  // Step 1: Init Pipelined Multi-GPU VJP Evaluator
  addStep(
    1,
    "Initialize Async Pipelined Multi-GPU VJP Engine",
    "Setting up 1F1B backward pipeline schedule across distributed GPU ranks (Rank 0 .. Rank N-1).",
    { numStages: 5, target, phase: "PIPELINE_INIT" },
    undefined,
    { pipeline_schedule: "1F1B_ASYNC", total_gpus: "5" },
  );

  // Step 2: Init stage_grads and initial loss VJP gradient
  addStep(
    5,
    "Initialize Gradient Buffer & Loss VJP (v = 1.0)",
    "Allocating stage gradient log `stage_grads = []` and setting initial output loss gradient scalar `accumulated_vjp = 1.0`.",
    { stageGradsCount: 0, accumulated_vjp: 1.0, phase: "LOSS_VJP_SET" },
  );

  // Reverse stage traversal simulation (stage 4 down to 0)
  let vjpAccumulator = 1.0;
  const numStages = arrayData.length;

  for (let sIdx = numStages - 1; sIdx >= 0; sIdx--) {
    const val = arrayData[sIdx];
    const jacobianVal = Number((0.5 + sIdx * 0.1).toFixed(2));
    const isTarget = val === target;

    // Sub-step A: Enter Pipeline Stage
    const stateA: ArrayElement[] = elements.map((el, i) => {
      if (i === sIdx) return { ...el, state: "compare", pointers: [`GPU_${sIdx}`] };
      if (i > sIdx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      8,
      `Enter Pipeline Stage ${sIdx} (GPU Rank ${sIdx})`,
      `Iterating in reverse topological autograd order. Active rank: GPU_${sIdx}.`,
      { stage: sIdx, gpuRank: sIdx, phase: "ENTER_STAGE" },
      stateA,
      { activeStage: `Stage_${sIdx}` },
    );

    // Sub-step B: Compute local stage Jacobian
    const stateB: ArrayElement[] = elements.map((el, i) => {
      if (i === sIdx) return { ...el, state: "active", pointers: [`J_${sIdx}=${jacobianVal}`] };
      if (i > sIdx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      9,
      `Compute Local Jacobian Matrix: J_${sIdx} = ${jacobianVal}`,
      `Evaluating local layer derivatives on GPU_${sIdx} yielding Jacobian factor ${jacobianVal}.`,
      { stage: sIdx, jacobian_val: jacobianVal, phase: "COMPUTE_JACOBIAN" },
      stateB,
      { stageJacobian: String(jacobianVal) },
    );

    // Sub-step C: Vector-Jacobian Product (VJP) Accumulation
    vjpAccumulator = Number((vjpAccumulator * jacobianVal).toFixed(4));
    const stateC: ArrayElement[] = elements.map((el, i) => {
      if (i === sIdx) return { ...el, state: isTarget ? "active" : "sorted", value: vjpAccumulator, pointers: ["vjp_acc"] };
      if (i > sIdx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      10,
      `Vector-Jacobian Product: accumulated_vjp *= J_${sIdx} -> ${vjpAccumulator}`,
      `Propagating gradient backwards: v_{${sIdx}-1} = v_{${sIdx}} @ J_{${sIdx}}. Updated accumulated VJP: ${vjpAccumulator}.`,
      { stage: sIdx, jacobian_val: jacobianVal, accumulated_vjp: vjpAccumulator, phase: "ACCUMULATE_VJP" },
      stateC,
      { accumulated_vjp: String(vjpAccumulator) },
    );

    // Sub-step D: Async NVLink P2P Interconnect Transfer
    addStep(
      11,
      `Async NVLink P2P Transfer: Send Gradient to GPU_${Math.max(0, sIdx - 1)}`,
      `Overlapping P2P tensor transmission across NVLink while GPU_${sIdx} frees activation memory buffers.`,
      { stage: sIdx, srcGpu: sIdx, dstGpu: Math.max(0, sIdx - 1), bytesSent: 4096, phase: "ASYNC_P2P" },
      stateC,
    );
  }

  // Step final-1: Multi-GPU Pipeline Gradient Verification
  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));
  addStep(
    11,
    "Verify All Pipeline GPU Stage Gradients",
    "Checking that reverse topological autograd pass reached GPU Rank 0 and all stage gradients were logged.",
    { stagesCompleted: numStages, finalInputGradient: vjpAccumulator },
    finalElements,
  );

  // Step final: Complete
  addStep(
    13,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const ASYNCPIPELINEDVJPEVALUATION_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 7, 12],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "accumulated_vjp += jacobian_val",
  ],
  hints: [
    { line: 6, hint: "Initialize accumulated loss gradient to 1.0." },
    { line: 8, hint: "Iterate pipeline stages in reverse topological order." },
    { line: 10, hint: "Multiply accumulated VJP by local stage Jacobian matrix factor." },
  ],
  lineExplanations: {
    1: "Defines entry point for async_pipelined_vjp_evaluation function.",
    2: "Docstring opening: describes async pipelined backward Vector-Jacobian Product calculation.",
    3: "Docstring body: simulates backward autograd pass across pipelined GPU stages.",
    4: "Docstring closing.",
    5: "Initializes stage gradient history array to store per-GPU gradient snapshots.",
    6: "Sets initial accumulated Vector-Jacobian Product (VJP) loss gradient scalar to 1.0.",
    7: "Empty line separating initial gradient setup from reverse stage traversal loop.",
    8: "Iterates through pipeline parallel GPU stages in reverse topological autograd order (num_stages-1 down to 0).",
    9: "Calculates local stage Jacobian derivative factor J_s for current GPU rank.",
    10: "Accumulates VJP by multiplying incoming gradient by local stage Jacobian matrix factor.",
    11: "Appends stage gradient tuple (stage, jacobian_val, accumulated_vjp) to tracking log.",
    12: "Empty line before returning completed pipeline stage gradient history.",
    13: "Returns stage gradient history array containing VJP outputs across all GPU ranks.",
  },
};

export const asyncPipelinedVjpEvaluation: AlgorithmDefinition<asyncPipelinedVjpEvaluationInput> = {
  id: "async-pipelined-vjp-evaluation",
  title: "Async Pipelined Multi-GPU VJP Evaluator",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
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

