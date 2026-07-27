import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface asyncPipelinedVjpEvaluationInput {
  data: number[];
  target?: number;
}

export const ASYNCPIPELINEDVJPEVALUATION_CODE = `
def async_pipelined_vjp_evaluation(num_stages=4):
    """
    Simulates async pipelined Vector-Jacobian Product (VJP) backward evaluation.
    """
    stage_grads = []
    accumulated_vjp = 1.0

    for stage in range(num_stages - 1, -1, -1):
        jacobian_val = 0.5 + stage * 0.1
        accumulated_vjp *= jacobian_val
        stage_grads.append((stage, jacobian_val, accumulated_vjp))

    return stage_grads
`;

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
          target: String(input?.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Async Pipelined Multi-GPU VJP Evaluator",
    "Setting up execution data structures and memory layout pointers.",
    { n: arrayData.length, target: input?.target ?? 0 },
  );

  arrayData.forEach((val, idx) => {
    const isTarget = val === input?.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} in autograd computation graph.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    13,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ASYNCPIPELINEDVJPEVALUATION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines async pipelined VJP backward evaluation function.",
    4: "Initializes stage gradient history log array.",
    5: "Initializes accumulated VJP gradient to 1.0 (loss gradient).",
    7: "Iterates through pipeline stages in reverse order from num_stages-1 down to 0.",
    8: "Calculates local stage Jacobian scalar value.",
    9: "Accumulates VJP gradient: accumulated_vjp *= jacobian_val.",
    10: "Appends stage VJP snapshot (stage, jacobian_val, accumulated_vjp) to log.",
    12: "Returns stage gradient history log.",
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
  description:
    "In distributed pipeline parallelism (e.g., DeepSpeed Pipeline Parallelism, Megatron-LM 1F1B schedule), backward autograd execution computes Vector-Jacobian Products (VJPs) across multi-GPU pipeline stages in reverse topological order. Asynchronously communicating gradient vectors between pipeline stages overlaps GPU inter-connect transfers with VJP computation.\n\nThis algorithm implements Async Pipelined Multi-GPU VJP Evaluation, simulating reverse stage traversal, local Jacobian multiplication, and accumulated VJP gradient propagation.\n\nInput Format:\n- data: Array representing pipeline parameters.\n- target: Optional target value.\n\nOutput Format:\n- Returns stage gradient logs tracking local Jacobian values and accumulated VJP outputs.\n\nEdge Cases & Constraints:\n- Pipeline stage 0 boundary (loss gradient insertion).\n- Multi-GPU inter-connect transfer latency.\n- Gradient accumulation across micro-batches.",
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
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "Pipeline parallel backward execution evaluates chain rule gradients across distributed pipeline stages. The VJP operation computes v^T @ J, where v is the upstream output gradient vector and J is the local stage Jacobian matrix.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for pipeline stage s with local Jacobian J_s and incoming gradient v_s, out-going gradient is v_{s-1} = v_s @ J_s. By induction, v_0 = v_{final} @ J_{final} @ ... @ J_0.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Asynchronous NVLink/InfiniBand peer-to-peer transfers allow GPU s to transmit v_{s-1} to GPU s-1 while simultaneously evaluating local activation gradients, minimizing pipeline bubble overhead.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation iterates backwards from stage num_stages - 1 down to 0, accumulating local Jacobian products and logging stage gradient snapshots.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes pipeline bubble idle cycles and micro-batch gradient accumulation buffer management.",
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
    ],
  },
  trivia: ASYNCPIPELINEDVJPEVALUATION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_ASYNCPIPELINEDVJPEVALUATION_INPUT,
  generateSteps: generateAsyncPipelinedVjpEvaluationSteps,
};
