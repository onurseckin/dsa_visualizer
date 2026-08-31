import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_subword_bpe_tiktoken_c1_p1",
  pageNumber: 1,
  title: "Subword Tokenization: Byte-Level BPE & Tiktoken Mechanics",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Tokenization Throughput Crisis: Multi-Gigabyte Pretraining Pipelines",
      content:
        "Modern frontier LLMs are trained on 10 to 15 trillion tokens (over 40 Terabytes of raw text). In data ingestion pipelines, tokenization must operate at over **10-50 MB/sec per CPU core** to avoid stalling distributed data loaders across thousands of GPU training nodes. Legacy character-level and word-level tokenizers suffered from the **Out-Of-Vocabulary (OOV)** catastrophe or uncontrolled vocabulary explosion. **Byte-Level Byte Pair Encoding (BPE, Sennrich et al., 2016; Radford et al., 2019; Tiktoken)** initializes its base vocabulary with the 256 fundamental UTF-8 raw bytes ($0x00$ to $0xFF$). By iteratively merging the most frequent adjacent byte pairs according to a deterministic rank table, Byte-Level BPE guarantees that **any arbitrary binary data can be tokenized with 100% vocabulary coverage and zero OOV tokens**.",
    },
    {
      type: "mental_model",
      title: "Mental Model: UTF-8 Raw Byte Stream to Subword Token IDs",
      visualIntuition:
        "Raw String: 'low' -> UTF-8 Bytes: [ 0x6c, 0x6f, 0x77 ] (Tokens: 108, 111, 119)\\nPre-Tokenization Regex: Splits text into isolated chunks (words, punctuation, whitespace)\\nMerge Rule Priority: Check adjacent pairs in rank dictionary -> merge ('l', 'o') -> 'lo' (rank 12) -> merge ('lo', 'w') -> 'low' (rank 452)\\nFinal Token ID: 452 (Single subword token!)",
      invariant:
        "Universal Byte Coverage Invariant: Because all 256 byte values [0..255] are permanently included in the base vocabulary, every possible UTF-8 sequence, foreign language character, emoji, or malformed byte stream has a valid finite token decomposition.",
      stateTransitions:
        "Raw Unicode Text -> Regex Chunking (Pre-tokenization) -> Convert chunk to Byte List -> Scan adjacent pairs -> Find pair with lowest merge rank -> Merge into single compound token -> Repeat until no mergeable pairs remain -> Emit integer Token IDs.",
      naiveBottleneck:
        "Naive BPE implementations perform string-level search-and-replace across the entire corpus for each merge rule, resulting in O(V * N) polynomial slowdowns.",
      optimalInsight:
        "Modern tokenizers (Tiktoken) store merge ranks in a flat hash table or direct lookup array, applying greedy lowest-rank merges in a single linear pass over the byte array.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: BPE Information Entropy Reduction Bound",
      theorem:
        "Let a corpus $C$ of $N_0$ bytes have empirical symbol distribution $P_0$ over initial alphabet $\\Sigma_0$ ($|\\Sigma_0| = 256$) with Shannon entropy $H(P_0) = -\\sum_{c \\in \\Sigma_0} p(c) \\log_2 p(c)$. Merging the most frequent pair $(a, b)$ with joint frequency $f_{ab}$ into a new token reduces total sequence length $N$ by exactly $f_{ab}$ and decreases total sequence description length.",
      proof:
        "1. Sequence Length Reduction:\\nLet adjacent pair $(a, b)$ appear $f_{ab}$ non-overlapping times in corpus $C$.\\nReplacing every occurrence of $(a, b)$ with a single new symbol $w_{\\text{new}}$ replaces 2 tokens with 1 token for each occurrence.\\nThe new corpus length is:\\n$$N_1 = N_0 - f_{ab}$$\\n\\n2. Description Length Minimization:\\nUnder optimal arithmetic coding, the total bits required to transmit the corpus is $L(C) = \\sum_{s} f(s) \\log_2 \\frac{N}{f(s)}$.\\nBy choosing the pair $(a, b)$ that maximizes joint frequency $f_{ab}$, BPE maximizes the reduction in total token count $\\Delta N = f_{ab}$ at each greedy step.\\n\\n3. Monotonic Sequence Compression:\\nFor $K$ merge operations, the total number of tokens in the corpus decreases monotonically:\\n$$N_K = N_0 - \\sum_{k=1}^K f_{a_k b_k}$$\\nFor standard natural language corpora, $K = 50{,}000$ to $100{,}000$ merges achieves a compression ratio of $3.5\\times$ to $4.5\\times$ (i.e. $\\approx 4.0$ bytes per token in English), strictly bounding the downstream context window consumption of large language models.",
    },
  ],
};

export const page_01_core = page1;
