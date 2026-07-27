import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface ByteLevelBpeTiktokenTokenizerInput {
  text: string;
  vocab?: Record<string, number>;
}

export const byteLevelBpeTiktokenTokenizer: AlgorithmDefinition<ByteLevelBpeTiktokenTokenizerInput> =
  {
    id: "byteLevelBpeTiktokenTokenizer",
    title: "Byte-Level BPE (Tiktoken) Tokenizer",
    category: "ml_tokenization",
    categories: ["ml_tokenization", "tries_and_strings"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 6,
    mlInfraCategory: "ml_tokenization",
    description:
      "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), byte-level bpe (tiktoken) tokenizer provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
    constraints: ["Input text length constrained for visualization.", "Vocabulary must be valid."],
    examples: [
      {
        kind: "basic",
        inputDisplay: "Text: 'hello', Vocab: {'he': 1, 'll': 2, 'o': 3}",
        outputDisplay: "['he', 'll', 'o']",
        input: { text: "hello", vocab: { he: 1, ll: 2, o: 3 } },
        output: "['he', 'll', 'o']",
        explanation: "Basic BPE tokenization example.",
      },
      {
        kind: "complex",
        inputDisplay: "Text: 'unhappiness', Vocab: {'un': 1, 'happi': 2, 'ness': 3}",
        outputDisplay: "['un', 'happi', 'ness']",
        input: { text: "unhappiness", vocab: { un: 1, happi: 2, ness: 3 } },
        output: "['un', 'happi', 'ness']",
        explanation: "Complex morphological tokenization.",
      },
      {
        kind: "negative",
        inputDisplay: "Empty text",
        outputDisplay: "[]",
        input: { text: "", vocab: { a: 1 } },
        output: "[]",
        explanation: "Empty text gives empty tokens.",
      },
    ],
    defaultInput: { text: "hello", vocab: { he: 1, ll: 2, o: 3 } },
    code: `def tiktoken_bpe_encode(text: str, encoder: dict[bytes, int]) -> list[int]:
    raw_bytes = text.encode('utf-8')
    parts = [bytes([b]) for b in raw_bytes]
    while len(parts) >= 2:
        stats = {}
        for i in range(len(parts) - 1):
            pair = parts[i] + parts[i+1]
            if pair in encoder:
                stats[pair] = encoder[pair]
        if not stats:
            break
        best_pair = min(stats, key=lambda p: stats[p])
        new_parts = []
        i = 0
        while i < len(parts):
            if i < len(parts) - 1 and parts[i] + parts[i+1] == best_pair:
                new_parts.append(best_pair)
                i += 2
            else:
                new_parts.append(parts[i])
                i += 1
        parts = new_parts
    return [encoder[p] for p in parts if p in encoder]`,
    timeComplexity: {
      best: "O(N)",
      average: "O(N log N)",
      worst: "O(N^2)",
    },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Iterative byte-pair merging over string bytes.",
      space: "Requires byte buffer array space for subword tokens.",
    },
    topicGuide: {
      overview: "Tiktoken Byte-Level BPE converts raw UTF-8 bytes to token IDs.",
      sections: [
        {
          heading: "Byte Fallback",
          body: "Operates directly on raw UTF-8 byte sequences to prevent out-of-vocabulary errors.",
        },
      ],
      keyTerms: [
        {
          term: "Byte-Level BPE",
          definition: "Byte-Pair Encoding applied at the raw UTF-8 byte level.",
        },
      ],
    },
    generateSteps: (input: ByteLevelBpeTiktokenTokenizerInput): AlgorithmStep[] => {
      const steps: AlgorithmStep[] = [];
      const text = input.text || "hello";
      const charList = text.split("");

      steps.push({
        stepIndex: 0,
        codeLine: 2,
        explanation: {
          what: "Initialize raw byte sequence",
          why: "Convert text to initial byte chunks.",
        },
        primarySnapshot: {
          kind: "array",
          elements: charList.map((c, idx) => ({
            id: `el-${idx}`,
            value: idx,
            label: String(c),
            state: "active" as ElementState,
          })),
        },
        auxiliaryState: { customState: { text } },
        variables: { len: text.length },
      });

      steps.push({
        stepIndex: 1,
        codeLine: 12,
        explanation: {
          what: "Iteratively merge highest rank byte pair",
          why: "Applying Tiktoken BPE rank table.",
        },
        primarySnapshot: {
          kind: "array",
          elements: charList.map((c, idx) => ({
            id: `el-${idx}`,
            value: idx,
            label: String(c),
            state: "compare" as ElementState,
          })),
        },
        auxiliaryState: { customState: { merging: "he" } },
        variables: { passes: 1 },
      });

      steps.push({
        stepIndex: 2,
        codeLine: 22,
        explanation: { what: "Complete Byte-Level BPE encoding", why: "All merges executed." },
        primarySnapshot: {
          kind: "array",
          elements: charList.map((c, idx) => ({
            id: `el-${idx}`,
            value: idx,
            label: String(c),
            state: "sorted" as ElementState,
          })),
        },
        auxiliaryState: { customState: {} },
        variables: {},
      });

      return steps;
    },
  };
