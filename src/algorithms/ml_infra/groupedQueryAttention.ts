import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ProblemExample,
} from "../../types/dsa";

export interface GqaInput {
  numQueryHeads: number; // Q
  numKvHeads: number;    // G (Q must be divisible by G)
  seqLen: number;
  headDim: number;
}

export const GROUPED_QUERY_ATTENTION_CODE = `def grouped_query_attention(
    num_query_heads: int,
    num_kv_heads: int,
    seq_len: int,
    head_dim: int
) -> dict:
    group_size = num_query_heads // num_kv_heads
    
    # Map query head index -> shared KV head index
    head_mapping = {}
    for q_idx in range(num_query_heads):
        kv_idx = q_idx // group_size
        head_mapping[q_idx] = kv_idx
        
    memory_compression = num_query_heads / num_kv_heads
    
    return {
        "group_size": group_size,
        "head_mapping": head_mapping,
        "kv_memory_reduction_factor": memory_compression
    }`;

export const DEFAULT_GQA_INPUT: GqaInput = {
  numQueryHeads: 8,
  numKvHeads: 2,
  seqLen: 4,
  headDim: 64,
};

export const GQA_EXAMPLES: ProblemExample<GqaInput>[] = [
  {
    id: "basic",
    kind: "basic",
    title: "LLaMA-2 70B Style GQA (8 Query Heads to 2 KV Heads)",
    input: {
      numQueryHeads: 8,
      numKvHeads: 2,
      seqLen: 4,
      headDim: 64,
    },
    output: "4:1 KV-head compression ratio with 4 Query heads mapped per KV head",
    explanation: "Group size = 8 / 2 = 4. Query heads 0..3 share KV head 0; Query heads 4..7 share KV head 1.",
  },
  {
    id: "complex",
    kind: "complex",
    title: "16-Query Head GQA with 4 KV Groups",
    input: {
      numQueryHeads: 16,
      numKvHeads: 4,
      seqLen: 8,
      headDim: 128,
    },
    output: "4:1 Memory reduction; 4 Query heads per KV group",
    explanation: "Reduces memory footprint of KV-cache by 75% compared to standard MHA.",
  },
  {
    id: "negative",
    kind: "negative",
    title: "Multi-Query Attention (MQA - 8 Query Heads to 1 KV Head)",
    input: {
      numQueryHeads: 8,
      numKvHeads: 1,
      seqLen: 4,
      headDim: 64,
    },
    output: "8:1 Maximum KV compression; all 8 Query heads share 1 KV head",
    explanation: "MQA is the extreme limit of GQA where numKvHeads = 1.",
  },
];

export function generateGqaSteps(input: GqaInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { numQueryHeads: Q, numKvHeads: G, seqLen, headDim } = input;

  if (Q <= 0 || G <= 0 || Q % G !== 0 || seqLen <= 0 || headDim <= 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 1,
      explanation: {
        what: "Invalid GQA Configuration",
        why: "Query heads Q must be a positive multiple of KV heads G.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: { customState: { error: "Q must be divisible by G" } },
      variables: {},
    });
    return steps;
  }

  const groupSize = Q / G;
  const memoryReduction = (Q / G).toFixed(1);

  const elements: ArrayElement[] = Array.from({ length: Q }, (_, idx) => ({
    id: `qhead-${idx}`,
    value: idx,
    state: "default",
  }));

  const headMapping: Record<number, number> = {};

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeQHead: number,
    vars: Record<string, string | number | boolean>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el, idx) => {
          const kvGroup = Math.floor(idx / groupSize);
          return {
            ...el,
            state: idx === activeQHead ? "active" : idx < activeQHead ? "sorted" : "default",
            pointers: [`KV-Group #${kvGroup}`],
          };
        }),
      },
      auxiliaryState: {
        customState: {
          groupSize,
          numQueryHeads: Q,
          numKvHeads: G,
          kvCacheMemorySaved: `${((1 - 1 / (Q / G)) * 100).toFixed(1)}%`,
          headMapping: Object.entries(headMapping)
            .map(([q, g]) => `Q${q}->KV${g}`)
            .join(", "),
        },
      },
      variables: vars,
    });
  };

  addStep(
    1,
    "Initialize Grouped-Query Attention (GQA) Head Partitioning",
    `Configuring ${Q} Query heads into ${G} KV groups. Group size = ${Q}/${G} = ${groupSize} Query heads per KV head pair.`,
    -1,
    { Q, G, groupSize, memoryReduction: `${memoryReduction}x` }
  );

  for (let q = 0; q < Q; q++) {
    const kvIdx = Math.floor(q / groupSize);
    headMapping[q] = kvIdx;

    addStep(
      8,
      `Mapped Query Head #${q} to Shared KV Head #${kvIdx}`,
      `Query head Q${q} belongs to group #${kvIdx} (heads Q${kvIdx * groupSize}..Q${(kvIdx + 1) * groupSize - 1}). Shares Key/Value tensors in fast SRAM.`,
      q,
      { qHead: q, sharedKvHead: kvIdx, groupSize }
    );
  }

  elements.forEach((el) => {
    el.state = "sorted";
  });

  addStep(
    15,
    "GQA Head Mapping Complete",
    `Successfully constructed GQA mapping. Reduced memory bandwidth for KV-cache by ${memoryReduction}x compared to MHA.`,
    Q,
    { totalQueryHeads: Q, totalKvHeads: G, memoryCompressionRatio: `${memoryReduction}x` }
  );

  return steps;
}

export const groupedQueryAttention: AlgorithmDefinition<GqaInput> = {
  id: "grouped-query-attention",
  title: "Grouped-Query Attention (GQA)",
  category: "ml_attention_geometry",
  difficulty: "Medium",
  description:
    "Attention architecture variant that groups query heads into partitions sharing single Key and Value heads, striking an optimal trade-off between MHA quality and MQA KV-cache memory compression.",
  isMlInfra: true,
  mlInfraLevel: 7,
  constraints: [
    "Number of Query heads Q > 0",
    "Number of KV heads G > 0",
    "Q must be divisible by G",
  ],
  examples: GQA_EXAMPLES,
  code: GROUPED_QUERY_ATTENTION_CODE,
  timeComplexity: {
    best: "O(N * d * Q)",
    average: "O(N * d * Q)",
    worst: "O(N * d * Q)",
  },
  spaceComplexity: "O(N * d * G)",
  complexityAnalysis: {
    time: "Compute flops remain proportional to Q query heads (O(N^2 * d * Q)), maintaining model expressive power.",
    space: "KV-cache memory consumption scales down from O(N * d * Q) to O(N * d * G), achieving Q/G factor memory savings.",
  },
  topicGuide: {
    overview:
      "Grouped-Query Attention (GQA, Ainslie et al. 2023) generalizes Multi-Head Attention (MHA) and Multi-Query Attention (MQA). By using G KV heads for Q Query heads (where 1 < G < Q), GQA delivers fast autoregressive inference speeds near MQA while retaining near-MHA model accuracy.",
    sections: [
      {
        heading: "MHA vs MQA vs GQA",
        body: "MHA: Q Key/Value heads (high quality, huge KV-cache). MQA: 1 Key/Value head (fast, low memory, slight quality drop). GQA: G Key/Value heads (best of both worlds).",
      },
      {
        heading: "LLM Serving Impact",
        body: "Reducing KV-cache memory footprint enables significantly larger serving batch sizes on modern GPUs like H100 and A100.",
      },
    ],
    keyTerms: [
      {
        term: "GQA",
        definition: "Grouped-Query Attention, sharing KV heads across subsets of Query heads.",
      },
      {
        term: "KV-Cache",
        definition: "Saved Key and Value tensor representations across decoding iterations.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_GQA_INPUT,
  generateSteps: generateGqaSteps,
};
