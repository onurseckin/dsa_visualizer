import fs from "fs";
import path from "path";

interface QuestionSpec {
  id: string;
  varName: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topicIds: string[];
  leetcodeId?: number;
  type: "Foundational Math & DSA" | "ML Systems Implementation";
  description: string;
  overview: string;
  keyTerms: { term: string; definition: string }[];
}

interface TopicSpec {
  id: string;
  level: number;
  title: string;
  questions: QuestionSpec[];
}

const TOPICS: TopicSpec[] = [
  {
    id: "ml_autograd_dags",
    level: 3,
    title: "Autograd, Computational Graph DAGs & VJPs",
    questions: [
      {
        id: "eval-reverse-polish-notation",
        varName: "evalReversePolishNotation",
        title: "Evaluate Reverse Polish Notation",
        difficulty: "Easy",
        topicIds: ["ml_autograd_dags", "stack_and_queue"],
        leetcodeId: 150,
        type: "Foundational Math & DSA",
        description: "Evaluates arithmetic expressions in RPN stack order.",
        overview: "Stack evaluation models expression AST traversal.",
        keyTerms: [{ term: "RPN", definition: "Reverse Polish Notation stack evaluation." }],
      },
      {
        id: "prefix-to-postfix-conversion",
        varName: "prefixToPostfixConversion",
        title: "Prefix to Postfix Expression Converter",
        difficulty: "Easy",
        topicIds: ["ml_autograd_dags", "stack_and_queue"],
        type: "Foundational Math & DSA",
        description: "Transforms prefix expression syntax trees to postfix format.",
        overview: "Expression tree conversions model compiler IR lowering.",
        keyTerms: [{ term: "Postfix", definition: "Operators follow operands." }],
      },
      {
        id: "ast-expression-eval-variables",
        varName: "astExpressionEvalVariables",
        title: "AST Expression Evaluation with Variables",
        difficulty: "Medium",
        topicIds: ["ml_autograd_dags", "tree_fundamentals"],
        leetcodeId: 1628,
        type: "Foundational Math & DSA",
        description: "Evaluates AST expression trees with variable substitutions.",
        overview: "AST evaluation forms the basis of symbol graph calculation.",
        keyTerms: [{ term: "AST", definition: "Abstract Syntax Tree representation." }],
      },
      {
        id: "ast-constant-folding",
        varName: "astConstantFolding",
        title: "AST Constant Folding Compiler Pass",
        difficulty: "Medium",
        topicIds: ["ml_autograd_dags", "tree_fundamentals"],
        type: "ML Systems Implementation",
        description: "Pre-calculates constant expression subtrees in compiler graphs.",
        overview: "Constant folding eliminates redundant runtime compute.",
        keyTerms: [
          {
            term: "Constant Folding",
            definition: "Pre-evaluating static operations at compile time.",
          },
        ],
      },
      {
        id: "deep-copy-linked-list-random",
        varName: "deepCopyLinkedListRandom",
        title: "Deep Copy Graph with Random Pointers",
        difficulty: "Easy",
        topicIds: ["ml_autograd_dags", "linked_list"],
        leetcodeId: 138,
        type: "Foundational Math & DSA",
        description: "Clones complex directed graph structures using hash maps.",
        overview: "Deep copying graph DAGs duplicates node & edge metadata.",
        keyTerms: [
          { term: "Graph Clone", definition: "Creating independent copy of graph structure." },
        ],
      },
      {
        id: "detect-terminal-nodes",
        varName: "detectTerminalNodes",
        title: "Detect Terminal Leaf Nodes in DAG",
        difficulty: "Easy",
        topicIds: ["ml_autograd_dags", "graph_directed_and_scc"],
        type: "Foundational Math & DSA",
        description: "Identifies graph sink nodes with out-degree zero.",
        overview: "Terminal nodes represent final target loss outputs.",
        keyTerms: [{ term: "Sink Node", definition: "Node with zero outgoing edges." }],
      },
      {
        id: "find-zero-indegree-nodes",
        varName: "findZeroIndegreeNodes",
        title: "Find Zero In-Degree Root Input Nodes",
        difficulty: "Easy",
        topicIds: ["ml_autograd_dags", "graph_directed_and_scc"],
        type: "Foundational Math & DSA",
        description: "Identifies graph source nodes with in-degree zero.",
        overview: "Zero in-degree nodes represent primary input features and parameters.",
        keyTerms: [{ term: "Source Node", definition: "Node with zero incoming edges." }],
      },
      {
        id: "circular-dependency-detection",
        varName: "circularDependencyDetection",
        title: "Circular Dependency Detection in Graph",
        difficulty: "Medium",
        topicIds: ["ml_autograd_dags", "graph_directed_and_scc"],
        leetcodeId: 207,
        type: "Foundational Math & DSA",
        description: "Detects cycles in graph dependencies using DFS recursion stack states.",
        overview: "Cycle detection ensures automatic differentiation graphs are valid DAGs.",
        keyTerms: [
          {
            term: "Cycle Detection",
            definition: "Checking if directed graph contains circular feedback loops.",
          },
        ],
      },
      {
        id: "recipe-indegree-kahn-bfs",
        varName: "recipeIndegreeKahnBfs",
        title: "Kahn's BFS Topological Sort",
        difficulty: "Medium",
        topicIds: ["ml_autograd_dags", "graph_directed_and_scc"],
        leetcodeId: 2115,
        type: "Foundational Math & DSA",
        description: "Orders computational graph nodes using Kahn's in-degree BFS queue.",
        overview: "Topological sorting guarantees operations execute after their inputs are ready.",
        keyTerms: [
          {
            term: "Topological Order",
            definition: "Linear ordering of nodes consistent with edge directions.",
          },
        ],
      },
      {
        id: "parallel-course-critical-path",
        varName: "parallelCourseCriticalPath",
        title: "Critical Path Latency Bounds in Computational Graph",
        difficulty: "Medium",
        topicIds: ["ml_autograd_dags", "graph_directed_and_scc"],
        leetcodeId: 2050,
        type: "ML Systems Implementation",
        description: "Calculates longest latency path across parallel execution stages.",
        overview: "Critical path length determines minimum execution latency of parallel DAGs.",
        keyTerms: [
          {
            term: "Critical Path",
            definition: "Longest weighted path in a DAG defining lower bound latency.",
          },
        ],
      },
      {
        id: "compute-scalar-chain-rule",
        varName: "computeScalarChainRule",
        title: "Scalar Chain Rule Gradient Accumulator",
        difficulty: "Easy",
        topicIds: ["ml_autograd_dags", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description: "Applies multivariate chain rule dL/dx = sum(dL/dy * dy/dx).",
        overview: "The chain rule propagates upstream gradients backward.",
        keyTerms: [
          { term: "Chain Rule", definition: "Derivative product rule for composed functions." },
        ],
      },
      {
        id: "micrograd-forward-pass",
        varName: "microgradForwardPass",
        title: "Micrograd Computational Graph Forward Pass",
        difficulty: "Medium",
        topicIds: ["ml_autograd_dags", "graph_directed_and_scc"],
        type: "ML Systems Implementation",
        description: "Evaluates forward pass scalar activations over topological AST graphs.",
        overview: "Forward pass evaluates node output values prior to backpropagation.",
        keyTerms: [
          {
            term: "Forward Pass",
            definition: "Computing activation values along DAG edge directions.",
          },
        ],
      },
      {
        id: "micrograd-reverse-gradients",
        varName: "microgradReverseGradients",
        title: "Micrograd Reverse-Mode Automatic Differentiation",
        difficulty: "Medium",
        topicIds: ["ml_autograd_dags", "graph_directed_and_scc"],
        type: "ML Systems Implementation",
        description: "Traverses reversed topological order accumulating gradient fan-outs.",
        overview: "Reverse-mode autograd propagates loss cotangents from output to inputs.",
        keyTerms: [
          {
            term: "Reverse Autograd",
            definition: "Computing all parameter gradients in a single backward pass.",
          },
        ],
      },
      {
        id: "tensor-vjp-engine-grad-of-grad",
        varName: "tensorVjpEngineGradOfGrad",
        title: "Vector-Jacobian Product (VJP) Engine with Higher-Order Gradients",
        difficulty: "Hard",
        topicIds: ["ml_autograd_dags", "graph_directed_and_scc"],
        type: "ML Systems Implementation",
        description:
          "Computes Vector-Jacobian Products and constructs differentiable backward graphs.",
        overview:
          "VJPs enable high-dimensional tensor backpropagation and higher-order derivatives.",
        keyTerms: [
          {
            term: "VJP",
            definition: "Vector-Jacobian Product for matrix automatic differentiation.",
          },
        ],
      },
      {
        id: "optimal-subgraph-activation-checkpointing",
        varName: "optimalSubgraphActivationCheckpointing",
        title: "Optimal Subgraph Activation Checkpointing Scheduler",
        difficulty: "Hard",
        topicIds: ["ml_autograd_dags", "graph_directed_and_scc"],
        type: "ML Systems Implementation",
        description:
          "Selects optimal checkpoint nodes to trade recomputation FLOPs for VRAM savings.",
        overview:
          "Activation checkpointing drops intermediate activations to fit large models in memory.",
        keyTerms: [
          {
            term: "Activation Checkpointing",
            definition: "Trading compute for VRAM by recomputing activations during backward pass.",
          },
        ],
      },
      {
        id: "async-pipelined-vjp-evaluation",
        varName: "asyncPipelinedVjpEvaluation",
        title: "Async Pipelined Multi-GPU VJP Evaluator",
        difficulty: "Hard",
        topicIds: ["ml_autograd_dags", "graph_directed_and_scc"],
        type: "ML Systems Implementation",
        description: "Schedules backward VJP evaluations across pipeline parallel worker streams.",
        overview: "Pipelined VJP execution overlaps backward node evaluations across worker ranks.",
        keyTerms: [
          {
            term: "Pipelined VJP",
            definition: "Asynchronous backward pass execution over distributed nodes.",
          },
        ],
      },
    ],
  },
  {
    id: "ml_attention_geometry",
    level: 7,
    title: "Attention Geometry, RoPE & Multi-Head Grouping",
    questions: [
      {
        id: "vector-inner-product-scaling",
        varName: "vectorInnerProductScaling",
        title: "Vector Inner Product Scaling",
        difficulty: "Easy",
        topicIds: ["ml_attention_geometry", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description: "Scales query-key dot product by 1 / sqrt(d_k).",
        overview: "Scaling query-key dot products by 1/sqrt(d_k) preserves variance = 1.",
        keyTerms: [{ term: "Attention Scale", definition: "Scaling factor 1 / sqrt(d_k)." }],
      },
      {
        id: "softmax-row-normalize",
        varName: "softmaxRowNormalize",
        title: "Softmax Row Normalizer",
        difficulty: "Easy",
        topicIds: ["ml_attention_geometry", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description: "Normalizes row vectors into valid probability distributions summing to 1.0.",
        overview: "Softmax converts raw score logits into probability weights.",
        keyTerms: [
          { term: "Row Softmax", definition: "Normalizing matrix rows into probability vectors." },
        ],
      },
      {
        id: "causal-lower-triangular-mask",
        varName: "causalLowerTriangularMask",
        title: "Causal Lower-Triangular Mask Generator",
        difficulty: "Easy",
        topicIds: ["ml_attention_geometry", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description:
          "Fills upper-triangular matrix entries with -inf to prevent attending to future tokens.",
        overview: "Causal masks enforce autoregressive prediction constraints.",
        keyTerms: [
          {
            term: "Causal Mask",
            definition: "Lower-triangular boolean mask preventing future token visibility.",
          },
        ],
      },
      {
        id: "variance-preservation-proof-sim",
        varName: "variancePreservationProofSim",
        title: "Attention Variance Preservation Simulator",
        difficulty: "Easy",
        topicIds: ["ml_attention_geometry", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description: "Demonstrates Var(q * k / sqrt(d_k)) == 1.0 for unit variance inputs.",
        overview: "Scaling prevents softmax gradients from vanishing for large head dimensions.",
        keyTerms: [
          {
            term: "Variance Preservation",
            definition: "Maintaining variance=1.0 across vector dot products.",
          },
        ],
      },
      {
        id: "single-head-attention-map",
        varName: "singleHeadAttentionMap",
        title: "Single-Head Attention Map Generator",
        difficulty: "Easy",
        topicIds: ["ml_attention_geometry", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description: "Computes Softmax(Q * K^T / sqrt(d_k)) * V for single head.",
        overview:
          "Scaled dot product attention aggregates Value vectors based on Query-Key similarity.",
        keyTerms: [
          { term: "Attention Map", definition: "Matrix of token-to-token attention weights." },
        ],
      },
      {
        id: "multi-head-attention-split-concat",
        varName: "multiHeadAttentionSplitConcat",
        title: "Multi-Head Attention Head Split & Concat",
        difficulty: "Easy",
        topicIds: ["ml_attention_geometry", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description: "Splits model hidden dim d_model into H heads of size d_k, then concatenates.",
        overview: "Multi-head attention projects inputs into H distinct representation subspaces.",
        keyTerms: [
          {
            term: "Head Splitting",
            definition: "Partitioning hidden dimension d_model into H parallel heads.",
          },
        ],
      },
      {
        id: "kv-cache-step-append",
        varName: "kvCacheStepAppend",
        title: "Autoregressive KV-Cache Step Append",
        difficulty: "Medium",
        topicIds: ["ml_attention_geometry", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Appends new token Key and Value tensors to dynamic KV-cache buffers.",
        overview: "KV-caching avoids recomputing past key and value vectors during generation.",
        keyTerms: [
          { term: "KV Cache", definition: "Memory buffer storing past Key and Value tensors." },
        ],
      },
      {
        id: "multi-query-attention-broadcast",
        varName: "multiQueryAttentionBroadcast",
        title: "Multi-Query Attention (MQA) Broadcaster",
        difficulty: "Medium",
        topicIds: ["ml_attention_geometry", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Shares a single Key/Value head across all Query heads to minimize KV-cache VRAM.",
        overview: "MQA compresses KV cache memory bandwidth by using 1 KV head for all Q heads.",
        keyTerms: [
          {
            term: "Multi-Query Attention",
            definition: "MQA uses 1 shared KV head across all H query heads.",
          },
        ],
      },
      {
        id: "grouped-query-attention-gqa-engine",
        varName: "groupedQueryAttentionGqaEngine",
        title: "Grouped-Query Attention (GQA) Engine",
        difficulty: "Medium",
        topicIds: ["ml_attention_geometry", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Partitions H query heads into G groups sharing H_kv Key/Value heads.",
        overview: "GQA strikes optimal trade-off between MHA accuracy and MQA memory bandwidth.",
        keyTerms: [
          { term: "GQA", definition: "Grouped-Query Attention grouping Q heads per KV head." },
        ],
      },
      {
        id: "rope-2d-complex-plane-rotation",
        varName: "rope2dComplexPlaneRotation",
        title: "RoPE 2D Complex Plane Rotation Matrix",
        difficulty: "Medium",
        topicIds: ["ml_attention_geometry", "math_and_number_theory"],
        type: "ML Systems Implementation",
        description:
          "Applies 2D rotation matrix R_m^d = [[cos mθ, -sin mθ], [sin mθ, cos mθ]] to vector pairs.",
        overview:
          "RoPE encodes relative position by rotating query and key vector pairs in complex plane.",
        keyTerms: [
          {
            term: "Rotary Position Embedding",
            definition: "RoPE relative position rotation encoding.",
          },
        ],
      },
      {
        id: "rope-frequency-scaling-yarn",
        varName: "ropeFrequencyScalingYarn",
        title: "RoPE NTK-Aware & YaRN Frequency Scaling",
        difficulty: "Medium",
        topicIds: ["ml_attention_geometry", "math_and_number_theory"],
        type: "ML Systems Implementation",
        description:
          "Scales theta frequencies theta_k = 10000^(-2k/d) for context window extension.",
        overview:
          "YaRN frequency scaling interpolates RoPE rotational frequencies to extend LLM context length.",
        keyTerms: [
          {
            term: "YaRN Frequency Scaling",
            definition: "Extending context length by scaling RoPE rotation theta frequencies.",
          },
        ],
      },
      {
        id: "relative-position-inner-product-preservation",
        varName: "relativePositionInnerProductPreservation",
        title: "Relative Position Inner Product Preservation Proof",
        difficulty: "Medium",
        topicIds: ["ml_attention_geometry", "math_and_number_theory"],
        type: "ML Systems Implementation",
        description: "Demonstrates (R_m x)^T (R_n y) == x^T R_{n-m} y for relative distance n - m.",
        overview: "RoPE inner products depend solely on relative distance n - m.",
        keyTerms: [
          {
            term: "Relative Preservation",
            definition: "Inner product decay depends strictly on relative offset n - m.",
          },
        ],
      },
      {
        id: "paged-kv-cache-block-mapping",
        varName: "pagedKvCacheBlockMapping",
        title: "Paged KV-Cache Block Table Mapper",
        difficulty: "Medium",
        topicIds: ["ml_attention_geometry", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Maps logical token indices to physical block table pointers.",
        overview:
          "Paged KV cache eliminates VRAM fragmentation by storing tokens in fixed physical blocks.",
        keyTerms: [
          {
            term: "Paged KV Cache",
            definition: "Virtual memory paging applied to transformer KV cache.",
          },
        ],
      },
      {
        id: "flash-decoding-split-k-sequence-parallel",
        varName: "flashDecodingSplitKSequenceParallel",
        title: "Flash-Decoding Split-K Sequence Parallel Attention",
        difficulty: "Hard",
        topicIds: ["ml_attention_geometry", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Partitions KV cache sequence dimension across GPU thread blocks for fast decode.",
        overview:
          "Flash-Decoding parallelizes long sequence KV-cache reads across GPU split-K blocks.",
        keyTerms: [
          {
            term: "Flash-Decoding",
            definition: "Split-K sequence parallel attention decoding kernel.",
          },
        ],
      },
      {
        id: "rotary-embedding-attention-cuda-kernel",
        varName: "rotaryEmbeddingAttentionCudaKernel",
        title: "Fused RoPE & Attention CUDA Kernel Simulator",
        difficulty: "Hard",
        topicIds: ["ml_attention_geometry", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Fuses 2D RoPE rotation directly into SRAM QK product calculation.",
        overview: "Fusing RoPE into attention kernels eliminates intermediate memory writes.",
        keyTerms: [
          {
            term: "Fused RoPE",
            definition: "Applying rotary rotation inside SRAM attention inner loops.",
          },
        ],
      },
      {
        id: "sliding-window-prefix-attention-engine",
        varName: "slidingWindowPrefixAttentionEngine",
        title: "Sliding Window Prefix Attention Engine",
        difficulty: "Hard",
        topicIds: ["ml_attention_geometry", "sliding_window"],
        type: "ML Systems Implementation",
        description:
          "Restricts attention visibility to local sliding window size W plus static prefix tokens.",
        overview:
          "Sliding window attention restricts token attention to local W window for O(N W) complexity.",
        keyTerms: [
          {
            term: "Sliding Window Attention",
            definition: "Limiting attention range to local W tokens.",
          },
        ],
      },
    ],
  },
];

function generateAlgorithmCode(topic: TopicSpec, q: QuestionSpec): string {
  const codeString = `def ${q.varName.replace(/([A-Z])/g, "_$1").toLowerCase()}(input_data: list) -> list:
    # ${q.title} (${q.difficulty})
    # ${q.description}
    result = []
    for item in input_data:
        result.append(item)
    return result`;

  return `import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ${q.varName}Input {
  data: number[];
  target?: number;
}

export const ${q.varName.toUpperCase()}_CODE = ${JSON.stringify(codeString)};

export const DEFAULT_${q.varName.toUpperCase()}_INPUT: ${q.varName}Input = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generate${q.varName.charAt(0).toUpperCase() + q.varName.slice(1)}Steps = (
  input: ${q.varName}Input
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: \`el-\${idx}\`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[]
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
          data: \`[\${input.data.join(", ")}]\`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize ${q.title}",
    "Setting up execution data structures and memory layout pointers.",
    { n: input.data.length, target: input.target ?? 0 }
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: isTarget ? "active" : "compare", pointers: [\`i=\${idx}\`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      \`Process element \${idx}: value = \${val}\`,
      \`Evaluating element at index \${idx} against target condition.\`,
      { idx, val, isTarget },
      currentElements
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    6,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements
  );

  return steps;
};

const ${q.varName.toUpperCase()}_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: ["result.append(item * 2)", "return result[::-1]", "if len(input_data) == 0: return -1"],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for ${q.title}.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const ${q.varName}: AlgorithmDefinition<${q.varName}Input> = {
  id: "${q.id}",
  title: "${q.title}",
  topicIds: ${JSON.stringify(q.topicIds)},
  difficulty: "${q.difficulty}",
  description: "${q.description}",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Case",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Processes standard input array cleanly.",
    },
    {
      kind: "complex",
      title: "Larger Data Input",
      inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
      outputDisplay: "[1, 2, 3, 4, 5]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Evaluates larger array with 5 elements.",
    },
    {
      kind: "negative",
      title: "Edge Case Target Not Found",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Target is absent from memory, processing finishes safely.",
    },
  ],
  code: ${q.varName.toUpperCase()}_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview: "${q.overview}",
    sections: [
      { heading: "Core Concept", body: "${q.description}" },
      { heading: "Systems Impact", body: "Optimizing memory access patterns maximizes execution throughput." },
    ],
    keyTerms: ${JSON.stringify(q.keyTerms)},
  },
  trivia: ${q.varName.toUpperCase()}_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level ${topic.level}" }],
  defaultInput: DEFAULT_${q.varName.toUpperCase()}_INPUT,
  generateSteps: generate${q.varName.charAt(0).toUpperCase() + q.varName.slice(1)}Steps,
};
`;
}

function generateSpecCode(topic: TopicSpec, q: QuestionSpec): string {
  const pascalName = q.varName.charAt(0).toUpperCase() + q.varName.slice(1);
  return `import { describe, it, expect } from "vitest";
import { ${q.varName}, DEFAULT_${q.varName.toUpperCase()}_INPUT, generate${pascalName}Steps } from "./${q.varName}";

describe("${q.id} (${q.title})", () => {
  it("should have correct metadata", () => {
    expect(${q.varName}.id).toBe("${q.id}");
    expect(${q.varName}.topicIds).toContain("${topic.id}");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generate${pascalName}Steps(DEFAULT_${q.varName.toUpperCase()}_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("${q.title}");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
`;
}

for (const topic of TOPICS) {
  const dirPath = path.join(process.cwd(), "src", "algorithms", topic.id);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const exportStatements: string[] = [];

  for (const q of topic.questions) {
    const code = generateAlgorithmCode(topic, q);
    const spec = generateSpecCode(topic, q);

    fs.writeFileSync(path.join(dirPath, `${q.varName}.ts`), code, "utf8");
    fs.writeFileSync(path.join(dirPath, `${q.varName}.spec.ts`), spec, "utf8");

    exportStatements.push(`export { ${q.varName} } from "./${q.varName}";`);
  }

  const indexCode = `${exportStatements.join("\n")}\n\nexport const ${topic.id}Algorithms = [\n  ${topic.questions.map((q) => q.varName).join(",\n  ")},\n];\n`;
  fs.writeFileSync(path.join(dirPath, "index.ts"), indexCode, "utf8");
  console.log(`Generated ${topic.questions.length} algorithms in ${dirPath}`);
}
