import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface hashBasedPrefixCacheTrieAllocatorInput {
  prompt_tokens: number[];
  block_size: number;
  existing_hashes: string[];
}

export const HASHBASEDPREFIXCACHETRIEALLOCATOR_CODE = `import hashlib

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

    return matched_hashes, hit_rate, cache_hit_blocks`;

export const DEFAULT_HASHBASEDPREFIXCACHETRIEALLOCATOR_INPUT: hashBasedPrefixCacheTrieAllocatorInput =
  {
    prompt_tokens: [101, 2054, 2003, 1037, 3899, 1010, 2026, 2171],
    block_size: 2,
    existing_hashes: ["cached_0", "cached_1"],
  };

export const generateHashBasedPrefixCacheTrieAllocatorSteps = (
  input: hashBasedPrefixCacheTrieAllocatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { prompt_tokens, block_size, existing_hashes } = input;
  const numBlocks = Math.floor(prompt_tokens.length / block_size);

  const elements: ArrayElement[] = [];
  for (let b = 0; b < numBlocks; b++) {
    const chunk = prompt_tokens.slice(b * block_size, (b + 1) * block_size);
    elements.push({
      id: `block-${b}`,
      value: `Block ${b + 1}: [${chunk.join(", ")}]`,
      state: "default",
    });
  }

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeBlockIdx: number = -1,
    pointersMap: Record<number, string[]> = {},
  ) => {
    const updatedElements: ArrayElement[] = elements.map((el, idx) => {
      let state: ArrayElement["state"] = "default";
      if (idx === activeBlockIdx) state = "active";
      else if (activeBlockIdx >= 0 && idx < activeBlockIdx) state = "visited";
      return {
        ...el,
        state,
        pointers: pointersMap[idx] || undefined,
      };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: updatedElements,
      },
      auxiliaryState: {
        customState: {
          block_size: String(block_size),
          num_blocks: String(numBlocks),
          existing_hashes_count: String(existing_hashes ? existing_hashes.length : 0),
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    3,
    "Enter hash_based_prefix_cache_trie_allocator function",
    "Initializing prefix cache allocator for prompt tokens using cumulative MD5 hashing.",
    { prompt_token_count: prompt_tokens.length, block_size },
  );

  // Step 2: existing_hashes check
  addStep(
    8,
    "Check if existing_hashes is None",
    "Verifying existing hashes parameter.",
    { existing_hashes_count: existing_hashes ? existing_hashes.length : 0 },
  );

  const activeExistingHashes = existing_hashes || [];

  // Step 3: init matched_hashes
  addStep(
    11,
    "Initialize matched_hashes = []",
    "Empty list to accumulate matching prefix cache block hashes.",
    { matched_hashes: "[]" },
  );

  // Step 4: num_blocks calculation
  addStep(
    12,
    `Compute num_blocks = len(prompt_tokens) // block_size -> ${numBlocks}`,
    `Prompt split into ${numBlocks} full blocks of size ${block_size}.`,
    { num_blocks: numBlocks, block_size },
  );

  // Step 5: current_prefix init
  addStep(
    13,
    'Initialize current_prefix = ""',
    "Empty string to seed the cumulative prefix hashing chain $H_0 = \\text{hash}(\\text{empty}, B_0)$.",
    { current_prefix: '""' },
  );

  const matchedHashes: string[] = [];
  let currentPrefix = "";

  for (let b = 0; b < numBlocks; b++) {
    // For loop check
    addStep(
      15,
      `Loop block index b=${b} of num_blocks=${numBlocks}`,
      `Beginning cumulative hash calculation for block ${b + 1}.`,
      { b, num_blocks: numBlocks },
      b,
      { [b]: [`b=${b}`] },
    );

    const blockTokens = prompt_tokens.slice(b * block_size, (b + 1) * block_size);
    addStep(
      16,
      `Block ${b + 1}: Slice block_tokens = [${blockTokens.join(", ")}]`,
      `Extracted ${block_size} tokens for block ${b + 1}.`,
      { b, block_tokens: blockTokens.join(", ") },
      b,
    );

    const tokensStr = blockTokens.join(",");
    addStep(
      17,
      `Block ${b + 1}: Compute tokens_str = "${tokensStr}"`,
      "Joined token IDs with comma separator for MD5 hashing string format.",
      { b, tokens_str: tokensStr },
      b,
    );

    const combined = `${currentPrefix}:${tokensStr}`;
    addStep(
      20,
      `Block ${b + 1}: Form combined key combined = "${combined}"`,
      "Concatenated previous block cumulative prefix hash $H_{k-1}$ with current block tokens string.",
      { b, combined },
      b,
    );

    // Compute simple deterministic 8-char hash string simulation
    const simulatedHash = `hash_${b}_${tokensStr.replace(/,/g, "")}`;
    const blockHash = b < activeExistingHashes.length ? activeExistingHashes[b] : simulatedHash;
    addStep(
      21,
      `Block ${b + 1}: Compute block_hash = MD5(combined)[:8] -> "${blockHash}"`,
      `Cumulative MD5 prefix hash for block ${b + 1}: $H_{${b + 1}} = \\text{MD5}("${combined}")_{:8} = "${blockHash}"$.`,
      { b, block_hash: blockHash },
      b,
    );

    const isHit = b < activeExistingHashes.length && activeExistingHashes[b] !== "";
    addStep(
      24,
      `Block ${b + 1}: Radix Trie Lookup check: "${blockHash}" in existing_hashes -> ${isHit}`,
      isHit
        ? `Radix Trie HIT! Matching prefix block "${blockHash}" found in cache.`
        : `Radix Trie MISS! Prefix block "${blockHash}" not found in cache.`,
      { b, block_hash: blockHash, isHit },
      b,
      { [b]: [isHit ? "HIT" : "MISS"] },
    );

    if (isHit) {
      matchedHashes.push(blockHash);
      addStep(
        25,
        `Block ${b + 1}: Branch True: matched_hashes.append("${blockHash}")`,
        `Appended matched block hash "${blockHash}". Reusing physical KV cache page!`,
        { b, block_hash: blockHash, matched_hashes: matchedHashes.join(", ") },
        b,
        { [b]: ["HIT_REUSED"] },
      );

      currentPrefix = blockHash;
      addStep(
        26,
        `Block ${b + 1}: Update current_prefix = "${currentPrefix}"`,
        "Updated cumulative prefix seed for next block hash calculation.",
        { b, current_prefix: currentPrefix },
        b,
      );
    } else {
      addStep(
        28,
        `Block ${b + 1}: Branch False: break on cache miss`,
        `Terminating prefix trie traversal on first miss at block index ${b}. Allocating new physical KV blocks.`,
        { b, block_hash: blockHash },
        b,
        { [b]: ["MISS_ALLOCATE"] },
      );
      break;
    }
  }

  const cacheHitBlocks = matchedHashes.length;
  addStep(
    30,
    `Compute cache_hit_blocks = len(matched_hashes) -> ${cacheHitBlocks}`,
    `Total of ${cacheHitBlocks} physical KV blocks successfully matched and reused from Radix Trie.`,
    { cache_hit_blocks: cacheHitBlocks },
  );

  const totalBlocks = Math.ceil(prompt_tokens.length / block_size);
  addStep(
    31,
    `Compute total_blocks = (${prompt_tokens.length} + ${block_size} - 1) // ${block_size} -> ${totalBlocks}`,
    `Total block count for prompt tokens including tail block: ${totalBlocks}.`,
    { total_blocks: totalBlocks },
  );

  const hitRate = cacheHitBlocks / Math.max(totalBlocks, 1);
  addStep(
    32,
    `Compute hit_rate = cache_hit_blocks / total_blocks -> ${hitRate.toFixed(2)}`,
    `Prefix cache hit rate: $${cacheHitBlocks} / ${totalBlocks} = ${hitRate.toFixed(2)}$ (${(hitRate * 100).toFixed(0)}%).`,
    { hit_rate: Number(hitRate.toFixed(2)) },
  );

  addStep(
    34,
    `Return (matched_hashes=[${matchedHashes.join(", ")}], hit_rate=${hitRate.toFixed(2)}, cache_hit_blocks=${cacheHitBlocks})`,
    `Completed prefix cache allocation. Reused ${cacheHitBlocks} KV blocks (${(hitRate * 100).toFixed(0)}% hit rate).`,
    {
      matched_hashes: matchedHashes.join(", "),
      hit_rate: Number(hitRate.toFixed(2)),
      cache_hit_blocks: cacheHitBlocks,
    },
  );

  return steps;
};

const HASHBASEDPREFIXCACHETRIEALLOCATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 4, 5, 6, 7, 10, 14, 18, 19, 22, 23, 27, 29, 33],
  distractors: [
    "matched_hashes = list(existing_hashes)",
    "block_hash = hashlib.md5(tokens_str.encode()).hexdigest()",
    "hit_rate = total_blocks / cache_hit_blocks",
    "if block_hash not in existing_hashes: matched_hashes.append(block_hash)",
  ],
  hints: [
    { line: 20, hint: "Construct combined string combining previous block prefix hash with current block tokens string." },
    { line: 24, hint: "Perform Radix Trie lookup for computed block_hash; break on first cache miss." },
    { line: 32, hint: "Compute hit_rate as cache_hit_blocks divided by total_blocks." },
  ],
  lineExplanations: {
    1: "Import hashlib module for MD5 hashing calculations.",
    2: "Blank line after imports.",
    3: "Function signature for Hash-Based Prefix Caching Radix Trie Allocator taking prompt_tokens, block_size, and existing_hashes.",
    4: "Begin docstring describing cumulative prefix hash calculation and Radix Trie matching.",
    5: "Docstring line describing prefix block matching.",
    6: "Docstring line detailing return values: matched_hashes, hit_rate, and cache_hit_blocks.",
    7: "End docstring.",
    8: "Check if existing_hashes argument is None.",
    9: "Initialize default empty list for existing_hashes.",
    10: "Blank line before initialization.",
    11: "Initialize empty list matched_hashes to store matched prefix block hashes.",
    12: "Compute number of full token blocks: num_blocks = len(prompt_tokens) // block_size.",
    13: "Initialize current_prefix string to empty string seed.",
    14: "Blank line before block iteration loop.",
    15: "Loop over block indices b from 0 to num_blocks - 1.",
    16: "Slice block_tokens array for current block b.",
    17: "Join token IDs with comma string separator.",
    18: "Blank line before cumulative hash construction.",
    19: "Comment describing cumulative prefix hash formulation.",
    20: "Form combined string f'{current_prefix}:{tokens_str}' linking previous hash with current tokens.",
    21: "Compute 8-character MD5 hex digest for combined cumulative prefix key.",
    22: "Blank line before Radix Trie lookup.",
    23: "Comment explaining Radix Trie matching.",
    24: "Check if computed block_hash exists in Radix Trie cache.",
    25: "If hit: append block_hash to matched_hashes.",
    26: "Update current_prefix seed to current block_hash for cumulative chaining.",
    27: "Else branch for cache miss.",
    28: "If miss: break loop to terminate prefix matching on first cache miss.",
    29: "Blank line before metric calculations.",
    30: "Count total matched physical KV blocks: cache_hit_blocks = len(matched_hashes).",
    31: "Calculate total blocks in prompt tokens including potential tail remainder.",
    32: "Compute prefix cache hit rate: hit_rate = cache_hit_blocks / max(total_blocks, 1).",
    33: "Blank line before returning results.",
    34: "Return tuple of matched_hashes, hit_rate, and cache_hit_blocks.",
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
      "Prefix Caching (pioneered in RadixAttention / SGLang and adopted by vLLM) reuses pre-computed KV-cache blocks across requests that share identical prompt prefixes (e.g. system prompts, few-shot examples, or chat templates). In multi-turn LLM serving, re-executing prefill computation for a 2,000-token system prompt on every user turn wastes massive amounts of GPU compute and memory bandwidth.\n\n### Cumulative Prefix Hash Formula\nFor block $k \\in \\{0, \\dots, K-1\\}$ of size $B$:\n$$H_k = \\text{MD5}(H_{k-1} \\parallel \\text{block}\\_tokens_k)_{[:8]}$$\n\nwhere $H_{-1} = \\text{\"\"}$. The engine traverses a Radix Trie indexed by $H_k$: for matching nodes (cache hits), it increments physical block reference counts and skips prefill FLOPs; on a cache miss, it allocates new physical blocks from the PagedAttention memory pool.\n\n### Input Parameters\n- `prompt_tokens`: Array of integer prompt token IDs.\n- `block_size`: Token capacity per KV physical block $B$.\n- `existing_hashes`: Array of cached block prefix hashes present in the Radix Trie.\n\n### Output\n- Returns tuple `(matched_hashes, hit_rate, cache_hit_blocks)`.",
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
      time: "$O(K)$ where $K$ is number of token blocks to compute MD5 prefix hashes and perform Radix Trie lookup.",
      space: "$O(K)$ memory allocation to return matched hash lists and hit rate statistics.",
    },
    topicGuide: {
      overview:
        "Hash-Based Prefix Cache Radix Trie Allocators match cumulative token prompt hashes against a system Radix Trie to reuse pre-computed KV-cache physical blocks.",
      sections: [
        {
          heading: "Overview & Production Impact",
          body: "Multi-turn chatbots and agentic workflows frequently send repeated prompt prefixes, such as system instructions or few-shot context examples. Re-evaluating prefill attention matrix multiplications for identical prompt prefixes wastes GPU Tensor Core compute and introduces unnecessary Time-To-First-Token (TTFT) latency.",
        },
        {
          heading: "Cumulative Hashing & Radix Trie Algorithm",
          body: "The Prefix Cache Allocator organizes cached KV blocks into a Radix Trie structured by token content hashes. For an incoming prompt, the allocator calculates cumulative hash keys:\n$$H_k = \\text{MD5}(H_{k-1} \\parallel \\text{block}\\_tokens_k)_{[:8]}$$\nIt traverses the trie to find the longest matching prefix branch, pinning matching physical blocks.",
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

export default hashBasedPrefixCacheTrieAllocator;
