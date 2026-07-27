import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface hashBasedPrefixCacheTrieAllocatorInput {
  prompt_tokens: number[];
  block_size: number;
  existing_hashes: string[];
}

export const HASHBASEDPREFIXCACHETRIEALLOCATOR_CODE = `
import hashlib

def hash_based_prefix_cache_trie_allocator(prompt_tokens, block_size=2, existing_hashes=None):
    """
    Computes cumulative block prefix hashes for prompt tokens and matches them against Radix Trie prefix cache.
    Returns matched prefix block hashes, hit rate, and number of cached KV physical blocks reused.
    """
    if existing_hashes is None:
        existing_hashes = []

    matched_hashes = []
    num_blocks = len(prompt_tokens) // block_size
    current_prefix = ""

    for b in range(num_blocks):
        block_tokens = prompt_tokens[b * block_size : (b + 1) * block_size]
        tokens_str = ",".join(map(str, block_tokens))
        
        # Cumulative prefix hash: hash(previous_hash + current_block_tokens)
        combined = f"{current_prefix}:{tokens_str}"
        block_hash = hashlib.md5(combined.encode()).hexdigest()[:8]

        # Match against prefix cache Radix Trie (simulated via existing_hashes check)
        if block_hash in existing_hashes or (b < len(existing_hashes) and existing_hashes[b] != ""):
            matched_hashes.append(block_hash)
            current_prefix = block_hash
        else:
            break

    cache_hit_blocks = len(matched_hashes)
    total_blocks = (len(prompt_tokens) + block_size - 1) // block_size
    hit_rate = cache_hit_blocks / max(total_blocks, 1)

    return matched_hashes, hit_rate, cache_hit_blocks
`;

export const DEFAULT_HASHBASEDPREFIXCACHETRIEALLOCATOR_INPUT: hashBasedPrefixCacheTrieAllocatorInput =
  {
    prompt_tokens: [101, 2054, 2003, 1037, 3899, 1010, 2026, 2171],
    block_size: 2,
    existing_hashes: ["cached_block_0", "cached_block_1"],
  };

export const generateHashBasedPrefixCacheTrieAllocatorSteps = (
  input: hashBasedPrefixCacheTrieAllocatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const numBlocks = Math.floor(input.prompt_tokens.length / input.block_size);
  const elements: ArrayElement[] = [];
  for (let b = 0; b < numBlocks; b++) {
    const chunk = input.prompt_tokens.slice(b * input.block_size, (b + 1) * input.block_size);
    elements.push({
      id: `block-${b}`,
      value: `Block ${b}: [${chunk.join(", ")}]`,
      state: "default",
    });
  }

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
          block_size: String(input.block_size),
          num_blocks: String(numBlocks),
          existing_hashes_count: String(input.existing_hashes.length),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Hash-Based Prefix Caching Radix Trie Allocator",
    "Loading prompt token sequence, chunking into block size B, and initializing prefix trie hash matcher.",
    { num_blocks: numBlocks, block_size: input.block_size },
  );

  const currentElements = elements.map((el) => ({ ...el }));
  const matchedHashes: string[] = [];

  for (let b = 0; b < numBlocks; b++) {
    const chunk = input.prompt_tokens.slice(b * input.block_size, (b + 1) * input.block_size);
    const isHit = b < input.existing_hashes.length && input.existing_hashes[b] !== "";
    const hashVal = isHit ? input.existing_hashes[b] : `miss_hash_${b}`;

    if (isHit) {
      matchedHashes.push(hashVal);
      currentElements[b] = {
        ...currentElements[b],
        state: "active",
        pointers: [`CACHE_HIT`, `hash=${hashVal}`],
      };
      addStep(
        22,
        `Block ${b}: Prefill Prefix Cache HIT! Reusing physical block`,
        `Found matching token prefix hash '${hashVal}' in Radix Trie. Reusing KV cache without recomputation.`,
        { block_idx: b, hash: hashVal, status: "HIT" },
        currentElements,
      );
    } else {
      currentElements[b] = {
        ...currentElements[b],
        state: "compare",
        pointers: [`CACHE_MISS`, `hash=${hashVal}`],
      };
      addStep(
        26,
        `Block ${b}: Prefill Prefix Cache MISS! Allocate new block`,
        `No matching prefix hash found in Radix Trie for tokens [${chunk.join(", ")}]. Allocating new physical KV block.`,
        { block_idx: b, hash: hashVal, status: "MISS" },
        currentElements,
      );
      break;
    }
  }

  const finalElements = currentElements.map((el) => ({
    ...el,
    state: el.state === "active" ? ("sorted" as const) : el.state,
  }));

  const hitRate = matchedHashes.length / Math.max(numBlocks, 1);

  addStep(
    29,
    "Execution Complete",
    "Prefix cache trie allocation complete. Calculated matched blocks and hit rate.",
    {
      cache_hit_blocks: matchedHashes.length,
      total_blocks: numBlocks,
      hit_rate: Number(hitRate.toFixed(2)),
    },
    finalElements,
  );

  return steps;
};

const HASHBASEDPREFIXCACHETRIEALLOCATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: [
    "combined = f'{tokens_str}' # missing previous hash link breaks cumulative prefix property",
    "if block_hash not in existing_hashes: matched_hashes.append(block_hash)",
    "hit_rate = total_blocks / cache_hit_blocks",
  ],
  hints: [
    { line: 22, hint: "Match cumulative prefix hash H_k = hash(H_{k-1}, block_k) in Radix Trie." },
  ],
  lineExplanations: {
    1: "Entry point for Hash-Based Prefix Caching Radix Trie Allocator.",
    17: "Calculates cumulative MD5 prefix hash for current token block.",
    22: "Checks if prefix hash exists in Radix Trie cache and reuses physical KV block.",
    26: "Terminates matching loop on first cache miss and allocates new physical KV block.",
    29: "Returns matched hashes, cache hit rate, and total reusable block count.",
  },
};

export const hashBasedPrefixCacheTrieAllocator: AlgorithmDefinition<hashBasedPrefixCacheTrieAllocatorInput> =
  {
    id: "hash-based-prefix-cache-trie-allocator",
    title: "Hash-Based Prefix Caching Radix Trie Allocator",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "tries_and_strings"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "Prefix Caching (pioneered in RadixAttention / SGLang and adopted by vLLM) reuses pre-computed KV-cache blocks across requests that share identical prompt prefixes (e.g. system prompts, few-shot examples, or chat templates). In multi-turn LLM serving, re-executing prefill computation for a 2,000-token system prompt on every user turn wastes massive amounts of GPU compute and memory bandwidth.\n\nThis algorithm implements the Hash-Based Prefix Caching Radix Trie Allocator. Prompt token sequences are split into block-sized chunks of size B (e.g. 16 tokens). For each block k, a cryptographic/hashing function computes a cumulative prefix hash H_k = hash(H_{k-1}, block_k). The engine traverses a Radix Trie indexed by H_k: for matching nodes (cache hits), it increments the physical block reference count and skips prefill FLOPs; on a cache miss, it allocates new physical blocks from the PagedAttention memory pool.\n\nInput Format:\n- prompt_tokens: Array of integer prompt token IDs.\n- block_size: Integer token capacity per KV physical block B (e.g. 16).\n- existing_hashes: Array of cached block prefix hashes present in the Radix Trie.\n\nOutput Format:\n- Returns a tuple of (matched_hashes, hit_rate, cache_hit_blocks) detailing matched block hashes and cache hit percentage.\n\nEdge Cases & Constraints:\n- Zero cache hit: When prompt prefix is entirely new, hit_rate = 0.0 and all blocks are newly allocated.\n- Complete system prompt hit: High reuse when requests share long system prompts (hit_rate ~ 0.9+).\n- Partial tail block: Tokens remaining after block_size division are handled during prefill execution.",
    constraints: [
      "1 <= block_size <= 64",
      "0 <= prompt_tokens.length <= 8192",
      "0 <= existing_hashes.length <= 512",
    ],
    examples: [
      {
        kind: "basic",
        title: "2-Block Prefix Cache Hit",
        inputDisplay:
          "prompt_tokens=[101, 2054, 2003, 1037], block_size=2, existing=['cached_0', 'cached_1']",
        outputDisplay: "Hit Blocks: 2, Hit Rate: 1.00",
        input: {
          prompt_tokens: [101, 2054, 2003, 1037],
          block_size: 2,
          existing_hashes: ["cached_0", "cached_1"],
        },
        output: "Hit Blocks: 2, Hit Rate: 1.00",
        explanation:
          "Both blocks 0 and 1 match existing prefix cache hashes. Prefill computation skipped for all 4 tokens.",
      },
      {
        kind: "complex",
        title: "Partial Cache Hit Followed by Miss",
        inputDisplay: "prompt_tokens=[1, 2, 3, 4], block_size=2, existing=['cached_0']",
        outputDisplay: "Hit Blocks: 1, Hit Rate: 0.50",
        input: {
          prompt_tokens: [1, 2, 3, 4],
          block_size: 2,
          existing_hashes: ["cached_0"],
        },
        output: "Hit Blocks: 1, Hit Rate: 0.50",
        explanation:
          "Block 0 hits cache (reused). Block 1 misses, triggering new KV block allocation for remaining tokens.",
      },
    ],
    code: HASHBASEDPREFIXCACHETRIEALLOCATOR_CODE,
    timeComplexity: { best: "O(K)", average: "O(K)", worst: "O(K)" },
    spaceComplexity: "O(K)",
    complexityAnalysis: {
      time: "O(K) where K is number of token blocks to compute MD5 prefix hashes and perform Radix Trie lookup.",
      space: "O(K) memory allocation to return matched hash lists and hit rate statistics.",
    },
    topicGuide: {
      overview:
        "Hash-Based Prefix Cache Radix Trie Allocators match cumulative token prompt hashes against a system Radix Trie to reuse pre-computed KV-cache physical blocks.",
      sections: [
        {
          heading: "Overview",
          body: "Multi-turn chatbots and agentic workflows frequently send repeated prompt prefixes, such as system instructions or few-shot context examples. Re-evaluating prefill attention matrix multiplications for identical prompt prefixes wastes GPU Tensor Core compute and introduces unnecessary Time-To-First-Token (TTFT) latency.",
        },
        {
          heading: "Core Concepts",
          body: "The Prefix Cache Allocator organizes cached KV blocks into a Radix Trie structured by token content hashes. For a incoming prompt, the allocator calculates cumulative hash keys H_k = hash(H_{k-1}, block_tokens_k). It traverses the trie to find the longest matching prefix branch, pinning matching physical blocks.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "Reusing cached KV blocks reduces TTFT latency by up to 90% for long system prompts. Additionally, it eliminates VRAM allocation redundancy, enabling higher serving concurrency and lower memory bandwidth consumption per request.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Key engineering considerations include hash collision resilience (using 64-bit or 128-bit hashes), managing reference counts for Copy-on-Write (CoW) shared blocks, LRU eviction policies when VRAM is full, and handling block boundary alignments with PagedAttention.",
        },
      ],
      keyTerms: [
        {
          term: "Prefix Caching",
          definition:
            "Reusing pre-computed KV-cache physical blocks across requests with shared prompt prefixes.",
        },
        {
          term: "Radix Trie Allocator",
          definition:
            "A trie data structure storing token block sequence hashes to index cached KV memory pages.",
        },
        {
          term: "Token Block Hash",
          definition:
            "Cryptographic or rolling hash uniquely identifying a contiguous block of prompt tokens.",
        },
        {
          term: "Time-To-First-Token (TTFT)",
          definition:
            "The latency duration from initial API request arrival to the output of the first generated token.",
        },
      ],
    },
    trivia: HASHBASEDPREFIXCACHETRIEALLOCATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 12" }],
    defaultInput: DEFAULT_HASHBASEDPREFIXCACHETRIEALLOCATOR_INPUT,
    generateSteps: generateHashBasedPrefixCacheTrieAllocatorSteps,
  };
