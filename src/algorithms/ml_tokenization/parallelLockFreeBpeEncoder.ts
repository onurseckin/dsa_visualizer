import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface ParallelLockFreeBpeEncoderInput {
  textChunks: string[];
  ranks: Record<string, number>;
}

export const DEFAULT_PARALLEL_LOCK_FREE_BPE_INPUT: ParallelLockFreeBpeEncoderInput = {
  textChunks: ["hello", "world"],
  ranks: {
    "104,101": 0, // 'h','e'
    "108,108": 1, // 'l','l'
    "111,119": 2, // 'o','w'
  },
};

export const PARALLEL_LOCK_FREE_BPE_CODE = `import concurrent.futures

def byte_level_bpe_encode_chunk(chunk: str, ranks: dict[str, int]) -> list[int]:
    raw_bytes = list(chunk.encode("utf-8"))
    tokens = [[b] for b in raw_bytes]

    while len(tokens) > 1:
        min_rank = float("inf")
        best_pair_idx = -1

        for i in range(len(tokens) - 1):
            pair_key = f"{tokens[i][-1]},{tokens[i+1][0]}"
            if pair_key in ranks and ranks[pair_key] < min_rank:
                min_rank = ranks[pair_key]
                best_pair_idx = i

        if best_pair_idx == -1:
            break

        new_token = tokens[best_pair_idx] + tokens[best_pair_idx + 1]
        tokens = tokens[:best_pair_idx] + [new_token] + tokens[best_pair_idx + 2:]

    return [sum(tok) % 100000 for tok in tokens]

def parallel_lock_free_bpe_encoder(text_chunks: list[str], ranks: dict[str, int]) -> list[list[int]]:
    """
    Parallel Lock-Free BPE Encoder Engine (Tiktoken / HuggingFace Fast).
    Splits text into independent regex chunks, encoding them concurrently across CPU worker threads
    without thread contention or shared mutex locks.
    """
    results = []
    # Simulating lock-free parallel chunk processing
    for chunk in text_chunks:
        chunk_tokens = byte_level_bpe_encode_chunk(chunk, ranks)
        results.append(chunk_tokens)

    return results`;

export const generateParallelBpeEncoderSteps = (
  input: ParallelLockFreeBpeEncoderInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { textChunks, ranks } = input;
  let stepIndex = 0;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 18,
    explanation: {
      what: "Initialize Parallel Lock-Free BPE Encoder Engine",
      why: `Partitioned text into ${textChunks.length} independent chunks [${textChunks
        .map((c) => `"${c}"`)
        .join(", ")}]. Encoding concurrently across CPU threads without mutex locks.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: textChunks.map((chunk, idx) => ({
        id: `chunk-${idx}`,
        value: idx,
        label: `Chunk ${idx}: "${chunk}"`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        numChunks: String(textChunks.length),
        parallelMode: "Lock-Free Multithreading",
        status: "Initialized",
      },
    },
    variables: { chunkCount: textChunks.length },
  });

  const allChunkTokens: number[][] = [];

  for (let cIdx = 0; cIdx < textChunks.length; cIdx++) {
    const chunk = textChunks[cIdx];
    const rawBytes = Array.from(Buffer.from(chunk, "utf-8"));
    let tokens: number[][] = rawBytes.map((b) => [b]);

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

      if (bestPairIdx === -1) break;

      const mergedTok = [...tokens[bestPairIdx], ...tokens[bestPairIdx + 1]];
      tokens = [...tokens.slice(0, bestPairIdx), mergedTok, ...tokens.slice(bestPairIdx + 2)];
    }

    const chunkTokenIds = tokens.map((tok) => tok[0]);
    allChunkTokens.push(chunkTokenIds);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 24,
      explanation: {
        what: `Thread Worker ${cIdx + 1}: Encoded Chunk "${chunk}" -> ${tokens.length} Tokens`,
        why: `Chunk "${chunk}" tokenized concurrently into tokens: ${tokens
          .map((t) => `[${t.join(",")}]`)
          .join(", ")}. Zero inter-thread lock contention.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: textChunks.map((_, idx) => ({
          id: `chunk-${idx}`,
          value: idx,
          label: `Chunk ${idx} (${idx <= cIdx ? "ENCODED" : "Pending"})`,
          state:
            idx === cIdx
              ? ("active" as ElementState)
              : idx < cIdx
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === cIdx ? [`Thread ${cIdx + 1}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          activeChunk: `"${chunk}"`,
          chunkTokens: tokens.map((t) => `[${t.join(",")}]`).join(" | "),
          threadId: `Thread-${cIdx + 1}`,
        },
      },
      variables: { cIdx, chunk, numTokens: tokens.length },
    });
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 28,
    explanation: {
      what: "Parallel Lock-Free BPE Encoding Complete for All Chunks",
      why: `All ${textChunks.length} chunks encoded concurrently. Total output token batches: ${allChunkTokens.length}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: allChunkTokens.map((toks, idx) => ({
        id: `res-${idx}`,
        value: toks.length,
        label: `Chunk ${idx}: ${toks.length} tokens`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        totalChunksProcessed: String(allChunkTokens.length),
        status: "Completed",
      },
    },
    variables: { totalChunks: allChunkTokens.length, complete: true },
  });

  return steps;
};

export const parallelLockFreeBpeEncoder: AlgorithmDefinition<ParallelLockFreeBpeEncoderInput> = {
  id: "parallelLockFreeBpeEncoder",
  title: "Parallel Lock-Free BPE Encoder Engine",
  category: "ml_tokenization",
  categories: ["ml_tokenization"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_tokenization",
  description:
    "Parallel lock-free BPE tokenization engine architecture (Tiktoken / HuggingFace Tokenizers). Text documents are split into independent regex chunks (e.g. words or whitespace-delimited blocks), allowing worker threads on multi-core CPUs to encode sub-sequences concurrently without shared mutex locks or thread contention.\n\nInput Format:\n- textChunks: Array of independent text strings to tokenize concurrently.\n- ranks: Priority merge dictionary.\n\nOutput Format:\n- Returns array of token ID arrays for each input chunk.\n\nEdge Cases & Constraints:\n- Empty chunk array: Returns empty token result array.",
  constraints: ["textChunks contains pre-split independent text blocks."],
  examples: [
    {
      kind: "basic",
      title: "Concurrent Encoding of 2 Text Chunks",
      inputDisplay: "chunks = ['hello', 'world']",
      outputDisplay: "Chunk 0: 4 tokens, Chunk 1: 5 tokens",
      input: DEFAULT_PARALLEL_LOCK_FREE_BPE_INPUT,
      output: "2 tokenized chunk outputs",
      explanation: "Encodes 'hello' and 'world' on separate parallel thread contexts.",
    },
    {
      kind: "complex",
      title: "Single Chunk Fallback",
      inputDisplay: "chunks = ['single_chunk']",
      outputDisplay: "Single chunk tokenized",
      input: {
        textChunks: ["single"],
        ranks: {},
      },
      output: "1 chunk tokenized",
      explanation: "Processes single chunk in thread pool.",
    },
    {
      kind: "negative",
      title: "Empty Chunks Input",
      inputDisplay: "chunks = []",
      outputDisplay: "[]",
      input: { textChunks: [], ranks: {} },
      output: "[]",
      explanation: "Returns empty token output list.",
    },
  ],
  defaultInput: DEFAULT_PARALLEL_LOCK_FREE_BPE_INPUT,
  code: PARALLEL_LOCK_FREE_BPE_CODE,
  timeComplexity: {
    best: "O(N * M / Threads)",
    average: "O(N * M / Threads)",
    worst: "O(N * M)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O((N * M) / Threads) parallel time speedup across available CPU cores.",
    space: "O(N) auxiliary space for thread-local token buffers.",
  },
  topicGuide: {
    overview:
      "Tokenizing large text datasets (e.g. 1 TB WebText / RedPajama) on single CPU threads is a major bottleneck in LLM pre-training pipelines. OpenAI's Tiktoken library achieves 100k+ tokens/sec per core by using regex split pre-tokenizers (`'s|'t|'re|'ve|'m|'ll|'d| ?\\p{L}+| ?\\p{N}+| ?[^\\s\\p{L}\\p{N}]+|\\s+(?!\\S)|\\s+`) to guarantee zero inter-chunk merge dependencies.",
    sections: [
      {
        heading: "Core Concept & Pre-Tokenizer Regex Splitting",
        body: "Regex pre-tokenization guarantees that no BPE merge rule ever spans across chunk boundaries. This enables embarrassingly parallel processing across Ray, PyTorch DataLoader, or C++ thread pools.",
      },
      {
        heading: "Lock-Free Thread Local Buffers",
        body: "Each thread allocates private vector scratchpads, eliminating mutex lock contention and atomic synchronization overhead.",
      },
      {
        heading: "Memory Coalescing & SIMD Vectorization",
        body: "Thread-local byte buffers are aligned to 64-byte L1 cache line boundaries to prevent false sharing between CPU sockets.",
      },
    ],
    keyTerms: [
      {
        term: "Pre-Tokenizer Regex",
        definition:
          "Regular expression splitting text into independent chunks where BPE merges cannot cross.",
      },
      {
        term: "Lock-Free Concurrency",
        definition:
          "Parallel algorithm execution requiring no mutex synchronization or thread waiting.",
      },
      {
        term: "False Sharing",
        definition:
          "Performance degradation when two CPU cores update independent variables residing on the same cache line.",
      },
    ],
  },
  sources: [
    { type: "ml_infra", kind: "ml_infra", label: "Tiktoken Parallel Tokenization Architecture" },
  ],
  generateSteps: generateParallelBpeEncoderSteps,
};
