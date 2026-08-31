import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_subword_bpe_tiktoken_c1_p1_concepts",
  pageNumber: 2,
  title: "Core Concepts: Regex Pre-Tokenization & Special Token Security",
  sections: [
    {
      type: "prose",
      title: "The Pre-Tokenization Boundary Firewall",
      content:
        "Standard BPE without pre-tokenization merges spaces, punctuation, and digits into words (e.g. `'dog.'`, `'dog,'`, `'dog!'`, `'123dog'`), causing severe vocabulary fragmentation where the root concept `'dog'` is duplicated dozens of times across different punctuation variants. OpenAI GPT-4 and Tiktoken use a **deterministic Unicode regular expression** to isolate tokens before BPE merges are evaluated:\\n\\n`(?i:'s|'t|'re|'ve|'m|'ll|'d)|[^\\r\\n\\p{L}\\p{N}]?\\p{L}+|\\p{N}{1,3}| ?[^\\s\\p{L}\\p{N}]+[\\r\\n]*|\\s*[\\r\\n]+|\\s+(?!\\S)|\\s+`\\n\\nThis regex isolates:\\n1. Common English contractions (`'s`, `'re`, `'ve`, `'ll`)\\n2. Sequences of letters with optional leading whitespace\\n3. Sequences of 1 to 3 digits (preventing arbitrary numbers like `12345678` from polluting the vocabulary)\\n4. Punctuation clusters and trailing newlines.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Special Token Disambiguation & Injection Security",
      visualIntuition:
        "User Prompt: 'Please translate <|im_start|>system...'\\nIf treated as raw bytes: '<', '|', 'i', 'm' are merged into control token ID 100264 (<|im_start|>), hijacking model control flow! (Prompt Injection Hazard)\\nTiktoken Security Policy: Special control tokens are disallowed by default, encoding them as literal raw text characters unless explicitly enabled by backend API.",
      invariant:
        "Regex Boundary Isolation Invariant: No BPE merge can ever cross a regex chunk boundary. Merges are evaluated strictly and independently within each regex token slice.",
      stateTransitions:
        "Input String -> Special Token Scanner (Aho-Corasick / Exact Match) -> Split into User Segments and Control Tokens -> Regex Split on User Segments -> Byte-Level BPE on each sub-chunk -> Concatenate Token IDs.",
      naiveBottleneck:
        "Evaluating regular expressions naively on multi-megabyte strings triggers backtracking and high regex engine overhead.",
      optimalInsight:
        "Pre-compiling the pre-tokenization regex with a DFA-based regex engine (e.g. Rust `regex` crate) executes chunk splitting in a single linear pass over the UTF-8 bytes.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Greedy BPE Merge Determinism Theorem",
      theorem:
        "Given a fixed ordered dictionary of BPE merge rules $\\mathcal{R} = (r_1, r_2, \\dots, r_K)$ with priority ranks $\\text{rank}(r_i) = i$, the greedy strategy of repeatedly contracting the adjacent token pair with the lowest rank $\\min_j \\text{rank}(t_j, t_{j+1})$ produces a unique, deterministic token sequence for any input byte string.",
      proof:
        "1. Let $S = (t_1, t_2, \\dots, t_n)$ be a sequence of tokens at step $t$.\\n\\n2. Rank Function Properties:\\nEach merge rule $r = (a, b) \\to c$ has a strictly unique integer rank $1 \\le \\text{rank}(r) \\le K$. Non-mergeable pairs have rank $\\infty$.\\n\\n3. Unique Minimal Rank:\\nAt any step where at least one merge is possible, the set of adjacent pairs has a well-defined unique minimum rank $R^* = \\min_{1 \\le j < n} \\text{rank}(t_j, t_{j+1}) < \\infty$.\\nIf multiple identical pairs share minimum rank $R^*$, processing them in left-to-right order produces non-overlapping contractions because a merge contracts disjoint pairs $(t_j, t_{j+1})$.\\n\\n4. Finite Termination:\\nEach merge decreases the length of the token sequence by exactly 1 ($n \\leftarrow n - 1$). Since the initial byte sequence has finite length $N$, the algorithm must terminate in at most $N - 1$ contraction steps.\\n\\n5. Deterministic Fixed Point:\\nAt termination, $\\min_j \\text{rank}(t_j, t_{j+1}) = \\infty$. Since each intermediate contraction step is uniquely determined by the global rank ordering, the final output sequence is unique and deterministic, proving reproducible tokenizer behavior across all computing architectures.",
    },
  ],
};
