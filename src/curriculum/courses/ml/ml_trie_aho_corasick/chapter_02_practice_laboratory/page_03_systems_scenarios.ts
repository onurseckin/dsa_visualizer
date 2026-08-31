import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_trie_aho_corasick_c2_p3",
  pageNumber: 4,
  title: "4-Part Socratic Diagnostic Suite: Multi-Pattern Automata",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_trie_aho_corasick",
      title: "Trie & Aho-Corasick Multi-Pattern Systems Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Double-Array Trie (DAT) Base-Check Dynamic Allocator",
          description:
            "Implement a compact Double-Array Trie builder that places 10,000 dictionary keys into contiguous `base` and `check` integer arrays using the First-Fit / Best-Fit row displacement algorithm.",
          problemStatement:
            "Given a list of strings, construct flat base and check int32 arrays and verify that state transitions require zero pointer dereferences.",
        },
      ],
      partB_mathProofs: [
        {
          title: "DFA Transition Matrix Sparsity and Memory Compression",
          prompt:
            "Prove that for an alphabet $|\\Sigma| = 256$ and $S$ trie states, the full DFA transition matrix requires $256 \\cdot S \\cdot 4$ bytes. Prove that Double-Array Trie compression reduces memory to $2 \\cdot (S + \\text{max\\_alphabet}) \\cdot 4$ bytes while preserving $O(1)$ transition time.",
          statement:
            "Quantify the memory compression ratio of Double-Array Tries over full DFA matrices.",
          proofOutline:
            "1. Full DFA requires storing 256 next-state integers per state ($1024 S$ bytes).\\n2. Double-Array Trie stores only 2 arrays: `base` and `check` of length $L \\approx 1.1 S$ to $1.3 S$ under good load factor.\\n3. Memory footprint is $2 \\times 1.2 S \\times 4 = 9.6 S$ bytes.\\n4. Compression ratio is $\\frac{1024 S}{9.6 S} \\approx 106\\times$ memory reduction!",
          engineeringContext:
            "Enables embedding full 128k tokenizer vocabularies inside small GPU L2 or CPU L3 caches.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Aho-Corasick SIMD Vectorization on AVX-512 / NEON",
          prompt:
            "How do high-performance string matching engines (e.g. Hyperscan, Rust `aho-corasick`) use SIMD vector instructions (AVX-512 `_mm512_cmpeq_epi8_mask`) to scan 64 input bytes in a single clock cycle to accelerate skipping un-matched text regions?",
          engineeringContext:
            "Accelerates pre-tokenization screening and dataset deduplication by 10x-25x.",
        },
      ],
      partD_stressTests: [
        {
          title: "Cyclic Output Link Memory Explosion in Pathological Dictionaries",
          scenario:
            "A dictionary contains $N$ highly overlapping nested prefixes (`a`, `aa`, `aaa`, `aaaa`, ..., `a^1000`). If dictionary output links are propagated by copying list elements rather than using shared pointer nodes, state $u$ at depth $1000$ duplicates 1,000 pattern strings, causing quadratic $O(N^2)$ memory explosion during trie construction.",
          failureMode:
            "Out-of-memory crash during tokenizer initialization on pathological subword dictionaries.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
