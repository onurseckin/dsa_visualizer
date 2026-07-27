import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface ByteLevelBpeTiktokenInput {
  text: string;
  ranks: Record<string, number>; // byte token pair string "b1,b2" -> priority rank integer
}

export const DEFAULT_BYTE_LEVEL_BPE_INPUT: ByteLevelBpeTiktokenInput = {
  text: "hi",
  ranks: {
    "104,105": 0, // 'h' (104) + 'i' (105) -> merge rank 0
  },
};

export const BYTE_LEVEL_BPE_CODE = `def byte_level_bpe_tokenize(text: str, ranks: dict[str, int]) -> list[int]:
    """
    Byte-Level BPE Tokenizer (Tiktoken / GPT-4).
    Converts raw UTF-8 string into byte tokens (0-255), then iteratively merges adjacent byte pairs
    having the lowest rank score in the rank dictionary until no further merges apply.
    """
    # Step 1: Convert UTF-8 text to initial byte token list
    raw_bytes = list(text.encode("utf-8"))
    tokens = [[b] for b in raw_bytes]

    while len(tokens) > 1:
        # Find adjacent pair with minimum rank
        min_rank = float("inf")
        best_pair_idx = -1

        for i in range(len(tokens) - 1):
            # Pair key formatted as comma-separated byte string
            pair_key = f"{tokens[i][-1]},{tokens[i+1][0]}"
            if pair_key in ranks and ranks[pair_key] < min_rank:
                min_rank = ranks[pair_key]
                best_pair_idx = i

        if best_pair_idx == -1:
            break // No more valid merges

        # Merge tokens at best_pair_idx and best_pair_idx + 1
        new_token = tokens[best_pair_idx] + tokens[best_pair_idx + 1]
        tokens = tokens[:best_pair_idx] + [new_token] + tokens[best_pair_idx + 2:]

    # Map merged byte arrays to token IDs
    token_ids = [sum(tok) % 100000 for tok in tokens]
    return token_ids`;

export const generateByteLevelBpeSteps = (input: ByteLevelBpeTiktokenInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { text, ranks } = input;
  let stepIndex = 0;

  const rawBytes = Array.from(Buffer.from(text, "utf-8"));
  let tokens: number[][] = rawBytes.map((b) => [b]);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initialize Byte-Level BPE Tokenizer (Tiktoken / GPT-4)`,
      why: `Converted input text "${text}" into ${rawBytes.length} raw UTF-8 byte tokens: [${rawBytes.join(
        ", ",
      )}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: rawBytes.map((b, idx) => ({
        id: `byte-${idx}`,
        value: b,
        label: `'${String.fromCharCode(b)}' (0x${b.toString(16).toUpperCase()})`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        text: `"${text}"`,
        rawBytes: rawBytes.map((b) => `${b}`).join(", "),
        ranksCount: String(Object.keys(ranks).length),
        status: "Initialized",
      },
    },
    variables: { byteCount: rawBytes.length },
  });

  while (tokens.length > 1) {
    let minRank = Infinity;
    let bestPairIdx = -1;

    for (let i = 0; i < tokens.length - 1; i++) {
      const pairKey = `${tokens[i][tokens[i].length - 1]},${tokens[i + 1][0]}`;
      if (pairKey in ranks && ranks[pairKey] < minRank) {
        minRank = ranks[pairKey];
        bestPairIdx = i;
      }
    }

    if (bestPairIdx === -1) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 18,
        explanation: {
          what: "No Further Valid BPE Merges Available",
          why: "No adjacent token pair exists in the priority merge rank table. Halting iterative merges.",
        },
        primarySnapshot: {
          kind: "array",
          elements: tokens.map((tok, idx) => ({
            id: `tok-${idx}`,
            value: tok[0],
            label: `[${tok.join(",")}]`,
            state: "sorted" as ElementState,
          })),
        },
        auxiliaryState: { customState: { status: "No further merges" } },
        variables: { numTokens: tokens.length },
      });
      break;
    }

    const mergedTok = [...tokens[bestPairIdx], ...tokens[bestPairIdx + 1]];
    const pairStr = `${tokens[bestPairIdx][tokens[bestPairIdx].length - 1]},${
      tokens[bestPairIdx + 1][0]
    }`;

    tokens = [...tokens.slice(0, bestPairIdx), mergedTok, ...tokens.slice(bestPairIdx + 2)];

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 22,
      explanation: {
        what: `Merge Pair (${pairStr}) with Rank ${minRank}`,
        why: `Merged token at index ${bestPairIdx} and ${bestPairIdx + 1} into combined token [${mergedTok.join(
          ", ",
        )}].`,
      },
      primarySnapshot: {
        kind: "array",
        elements: tokens.map((tok, idx) => ({
          id: `tok-${idx}`,
          value: tok[0],
          label: `[${tok.join(",")}]`,
          state: idx === bestPairIdx ? ("active" as ElementState) : ("visited" as ElementState),
          pointers: idx === bestPairIdx ? [`Merged (Rank ${minRank})`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          mergedPair: pairStr,
          rank: String(minRank),
          newToken: `[${mergedTok.join(", ")}]`,
          currentTokensCount: String(tokens.length),
        },
      },
      variables: { bestPairIdx, minRank, numTokens: tokens.length },
    });
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 25,
    explanation: {
      what: `Byte-Level BPE Tokenization Complete: ${tokens.length} Tokens Produced`,
      why: `Final subword token sequences: ${tokens
        .map((tok) => `[${tok.join(",")}]`)
        .join(" | ")}. Encoded into LLM input IDs.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: tokens.map((tok, rank) => ({
        id: `res-${rank}`,
        value: tok[0],
        label: `Token ${rank}: [${tok.join(",")}]`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        finalTokens: tokens.map((tok) => `[${tok.join(",")}]`).join(" | "),
        totalTokens: String(tokens.length),
        status: "Completed",
      },
    },
    variables: { finalTokenCount: tokens.length, complete: true },
  });

  return steps;
};

export const byteLevelBpeTiktokenTokenizer: AlgorithmDefinition<ByteLevelBpeTiktokenInput> = {
  id: "byteLevelBpeTiktokenTokenizer",
  title: "Byte-Level BPE Tiktoken Tokenizer (GPT-4)",
  category: "ml_tokenization",
  categories: ["ml_tokenization"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_tokenization",
  description:
    "Byte-Level Byte-Pair Encoding (BBPE) tokenizer algorithm used by OpenAI Tiktoken (cl100k_base / o200k_base for GPT-3.5, GPT-4, and GPT-4o). Operates directly on raw UTF-8 byte streams (0-255), completely eliminating Out-Of-Vocabulary (OOV) errors by falling back to byte tokens when no merge rule matches.\n\nInput Format:\n- text: Raw input string to tokenize.\n- ranks: Priority merge dictionary mapping byte pair string 'b1,b2' to integer rank score.\n\nOutput Format:\n- Returns list of final token IDs.\n\nEdge Cases & Constraints:\n- Multi-byte UTF-8 characters (emoji, CJK characters): Encoded as sequences of 2 to 4 raw byte tokens prior to merging.",
  constraints: ["ranks stores priority integer ranks (lower rank = higher merge priority)."],
  examples: [
    {
      kind: "basic",
      title: "Byte-Pair Merge of 'hi' into Single Token",
      inputDisplay: "text = 'hi', rank for '104,105' = 0",
      outputDisplay: "Single merged token [104, 105]",
      input: DEFAULT_BYTE_LEVEL_BPE_INPUT,
      output: "1 token produced",
      explanation: "Byte 104 ('h') and byte 105 ('i') merge into single BPE token [104, 105].",
    },
    {
      kind: "complex",
      title: "Unmerged Bytes Fallback",
      inputDisplay: "text = 'hi', empty ranks dictionary",
      outputDisplay: "2 byte tokens [104], [105]",
      input: { text: "hi", ranks: {} },
      output: "[104], [105]",
      explanation: "Without merge ranks, falls back to raw individual UTF-8 byte tokens.",
    },
    {
      kind: "negative",
      title: "Multi-Byte Unicode UTF-8 Text",
      inputDisplay: "text = '€' (UTF-8 bytes: [226, 130, 172])",
      outputDisplay: "3 raw byte tokens [226], [130], [172]",
      input: { text: "€", ranks: {} },
      output: "3 byte tokens",
      explanation: "Splits 3-byte UTF-8 symbol into individual byte tokens.",
    },
  ],
  defaultInput: DEFAULT_BYTE_LEVEL_BPE_INPUT,
  code: BYTE_LEVEL_BPE_CODE,
  timeComplexity: {
    best: "O(N * M)",
    average: "O(N * M)",
    worst: "O(N^2)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N * M) where N is number of UTF-8 bytes and M is number of iterative merge passes.",
    space: "O(N) auxiliary space to store token byte arrays.",
  },
  topicGuide: {
    overview:
      "Traditional BPE tokenizers (RoBERTa, GPT-2) operates on Unicode characters, requiring complex pre-tokenization regexes and large OOV fallback maps. OpenAI Tiktoken (2022) popularized pure Byte-Level BPE, which treats arbitrary text, code, and binary as raw UTF-8 byte streams, ensuring 100% tokenization coverage across all world languages.",
    sections: [
      {
        heading: "Core Concept & Rank Priority Table",
        body: "Byte pairs are assigned explicit integer ranks during BPE vocabulary training. At runtime, the tokenizer iteratively selects the adjacent pair with the lowest rank index.",
      },
      {
        heading: "Systems & Performance Optimization (Tiktoken Rust/C++)",
        body: "Tiktoken achieves 10x-100x speedups over Python HuggingFace tokenizers by using a lock-free priority queue of valid pair merges and pre-split regex chunks.",
      },
      {
        heading: "Eliminating Out-Of-Vocabulary (OOV)",
        body: "Because every text string can be decomposed into UTF-8 bytes (0..255), the base vocabulary size starts at 256 byte tokens. Any unknown word gracefully degrades to byte-level representations without throwing OOV errors.",
      },
    ],
    keyTerms: [
      {
        term: "Byte-Level BPE (BBPE)",
        definition:
          "BPE algorithm operating on raw UTF-8 byte streams rather than Unicode character strings.",
      },
      {
        term: "Tiktoken",
        definition:
          "Fast BPE tokenizer engine developed by OpenAI for GPT-3.5, GPT-4, and embeddings models.",
      },
      {
        term: "Merge Rank",
        definition:
          "Priority integer assigned to each byte-pair merge rule in the tokenizer vocabulary.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "OpenAI Tiktoken & Byte-Level BPE" }],
  generateSteps: generateByteLevelBpeSteps,
};
