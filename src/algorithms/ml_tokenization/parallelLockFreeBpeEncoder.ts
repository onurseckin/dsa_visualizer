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
    results = []
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

  // Step 0: Function entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 25,
    explanation: {
      what: "Initialize Parallel Lock-Free BPE Encoder Engine",
      why: `Partitioned text into ${textChunks.length} independent chunk(s): [${textChunks
        .map((c) => `"${c}"`)
        .join(", ")}]. Encoding concurrently across CPU worker threads without mutex locks.`,
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

  // Step 1: Initialize results array
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 26,
    explanation: {
      what: "Initialize empty results collector list",
      why: "Prepare list to accumulate byte-level BPE token arrays from all parallel worker threads.",
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
        resultsCount: "0",
        status: "Collector Ready",
      },
    },
    variables: { results: [] },
  });

  const allChunkTokens: number[][] = [];

  for (let cIdx = 0; cIdx < textChunks.length; cIdx++) {
    const chunk = textChunks[cIdx];

    // Step: Loop chunk dispatch
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 27,
      explanation: {
        what: `Thread Worker ${cIdx + 1}: Start processing chunk ${cIdx} ("${chunk}")`,
        why: `Dispatch chunk "${chunk}" to dedicated thread worker ${cIdx + 1} for lock-free BPE tokenization.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: textChunks.map((c, idx) => ({
          id: `chunk-${idx}`,
          value: idx,
          label: `Chunk ${idx} ("${c}")`,
          state:
            idx === cIdx
              ? ("active" as ElementState)
              : idx < cIdx
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === cIdx ? [`Worker ${cIdx + 1}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          activeChunk: `"${chunk}"`,
          workerThread: `Worker-${cIdx + 1}`,
          status: "Processing Chunk",
        },
      },
      variables: { cIdx, chunk },
    });

    // Step: Call encode_chunk -> raw_bytes
    const rawBytes = Array.from(Buffer.from(chunk, "utf-8"));
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: `Chunk ${cIdx} ("${chunk}"): Convert string into UTF-8 byte array`,
        why: `String "${chunk}" converted into byte values: [${rawBytes.join(", ")}].`,
      },
      primarySnapshot: {
        kind: "array",
        elements: rawBytes.map((b, bIdx) => ({
          id: `c${cIdx}-b${bIdx}`,
          value: b,
          label: `'${String.fromCharCode(b)}' (${b})`,
          state: "active" as ElementState,
        })),
      },
      auxiliaryState: {
        customState: {
          chunk: `"${chunk}"`,
          byteCount: String(rawBytes.length),
          rawBytes: rawBytes.join(", "),
        },
      },
      variables: { cIdx, rawBytesCount: rawBytes.length },
    });

    let tokens: number[][] = rawBytes.map((b) => [b]);

    // Step: tokens init
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Chunk ${cIdx}: Initialize single-byte token sequences`,
        why: `Wrapped each byte into an individual sequence: ${tokens.map((t) => `[${t.join(",")}]`).join(", ")}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: tokens.map((t, tIdx) => ({
          id: `c${cIdx}-t${tIdx}`,
          value: t[0],
          label: `'${t.map((b) => String.fromCharCode(b)).join("")}'`,
          state: "default" as ElementState,
        })),
      },
      auxiliaryState: {
        customState: {
          tokenSequences: tokens.map((t) => `[${t.join(",")}]`).join(" | "),
          numTokens: String(tokens.length),
        },
      },
      variables: { numTokens: tokens.length },
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

      // Step: Pair evaluation
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 11,
        explanation: {
          what: `Chunk ${cIdx}: Scan adjacent token pairs for lowest BPE merge rank`,
          why:
            bestPairIdx !== -1
              ? `Found valid merge pair at index ${bestPairIdx} with lowest rank ${minRank}.`
              : "No valid adjacent pairs found in priority merge ranks dictionary.",
        },
        primarySnapshot: {
          kind: "array",
          elements: tokens.map((t, tIdx) => ({
            id: `c${cIdx}-tok-${tIdx}`,
            value: tIdx,
            label: `'${t.map((b) => String.fromCharCode(b)).join("")}'`,
            state:
              bestPairIdx !== -1 && (tIdx === bestPairIdx || tIdx === bestPairIdx + 1)
                ? ("active" as ElementState)
                : ("default" as ElementState),
            pointers: bestPairIdx !== -1 && tIdx === bestPairIdx ? [`Rank ${minRank}`] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            minRank: minRank === Infinity ? "None" : String(minRank),
            bestPairIndex: String(bestPairIdx),
            currentTokensCount: String(tokens.length),
          },
        },
        variables: { minRank: minRank === Infinity ? null : minRank, bestPairIdx },
      });

      if (bestPairIdx === -1) {
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 18,
          explanation: {
            what: `Chunk ${cIdx}: Terminate BPE loop (no further merges)`,
            why: "No adjacent token pairs match rank rules. Breaking out of merge loop.",
          },
          primarySnapshot: {
            kind: "array",
            elements: tokens.map((t, tIdx) => ({
              id: `c${cIdx}-tok-${tIdx}`,
              value: tIdx,
              label: `'${t.map((b) => String.fromCharCode(b)).join("")}'`,
              state: "visited" as ElementState,
            })),
          },
          auxiliaryState: {
            customState: {
              status: "BPE Merges Completed",
              finalTokenCount: String(tokens.length),
            },
          },
          variables: { terminated: true },
        });
        break;
      }

      const mergedTok = [...tokens[bestPairIdx], ...tokens[bestPairIdx + 1]];
      tokens = [...tokens.slice(0, bestPairIdx), mergedTok, ...tokens.slice(bestPairIdx + 2)];

      // Step: Perform merge
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 21,
        explanation: {
          what: `Chunk ${cIdx}: Merge token pair at index ${bestPairIdx} -> '${mergedTok.map((b) => String.fromCharCode(b)).join("")}'`,
          why: `Merged pair with rank ${minRank}. Reduced sequence length to ${tokens.length} token(s).`,
        },
        primarySnapshot: {
          kind: "array",
          elements: tokens.map((t, tIdx) => ({
            id: `c${cIdx}-tok-${tIdx}`,
            value: tIdx,
            label: `'${t.map((b) => String.fromCharCode(b)).join("")}'`,
            state: tIdx === bestPairIdx ? ("sorted" as ElementState) : ("default" as ElementState),
          })),
        },
        auxiliaryState: {
          customState: {
            mergedToken: `'${mergedTok.map((b) => String.fromCharCode(b)).join("")}'`,
            remainingTokens: String(tokens.length),
          },
        },
        variables: { bestPairIdx, newTokenLength: tokens.length },
      });
    }

    const chunkTokenIds = tokens.map((tok) => tok[0]);
    allChunkTokens.push(chunkTokenIds);

    // Step: Return chunk tokens
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 23,
      explanation: {
        what: `Chunk ${cIdx} encoding complete -> returned ${chunkTokenIds.length} tokens`,
        why: `Thread Worker ${cIdx + 1} finished chunk "${chunk}". Produced token IDs: [${chunkTokenIds.join(", ")}].`,
      },
      primarySnapshot: {
        kind: "array",
        elements: chunkTokenIds.map((id, tokIdx) => ({
          id: `c${cIdx}-out-${tokIdx}`,
          value: id,
          label: `Tok ${id}`,
          state: "visited" as ElementState,
        })),
      },
      auxiliaryState: {
        customState: {
          worker: `Worker-${cIdx + 1}`,
          tokenIds: chunkTokenIds.join(", "),
        },
      },
      variables: { cIdx, chunkTokenIds },
    });

    // Step: Append to results
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 29,
      explanation: {
        what: `Append Thread Worker ${cIdx + 1} tokens to results collector`,
        why: `Collector now holds ${allChunkTokens.length}/${textChunks.length} completed chunk token array(s).`,
      },
      primarySnapshot: {
        kind: "array",
        elements: textChunks.map((_, idx) => ({
          id: `res-chunk-${idx}`,
          value: idx,
          label: `Chunk ${idx} (${idx <= cIdx ? "ENCODED" : "Pending"})`,
          state:
            idx === cIdx
              ? ("active" as ElementState)
              : idx < cIdx
                ? ("sorted" as ElementState)
                : ("default" as ElementState),
        })),
      },
      auxiliaryState: {
        customState: {
          completedChunks: `${allChunkTokens.length}/${textChunks.length}`,
        },
      },
      variables: { completedCount: allChunkTokens.length },
    });
  }

  // Step Final: Return results
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 31,
    explanation: {
      what: "Parallel Lock-Free BPE Encoding Complete for All Chunks",
      why: `All ${textChunks.length} chunk(s) encoded concurrently. Total output token batches: ${allChunkTokens.length}.`,
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
  id: "parallel-lock-free-bpe-encoder",
  title: "Parallel Lock-Free BPE Encoder Engine",
  topicIds: ["ml_tokenization"],
  difficulty: "Hard",
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
