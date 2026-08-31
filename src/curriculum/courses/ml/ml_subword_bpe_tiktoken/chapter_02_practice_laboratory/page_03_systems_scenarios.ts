import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_subword_bpe_tiktoken_c2_p3",
  pageNumber: 4,
  title: "4-Part Socratic Diagnostic Suite: Byte-Level BPE & Tiktoken",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_subword_bpe_tiktoken",
      title: "Subword Tokenization & Tiktoken Systems Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Tiktoken Direct Pair-Rank Hash Table Engine",
          description:
            "Implement a high-throughput BPE tokenizer that stores 100,000 merge rules in a direct 64-bit integer hash table `(u32_left << 32 | u32_right)` and executes greedy pair contractions over in-memory byte slices.",
          problemStatement:
            "Given text and a dictionary of merge ranks, emit exact token IDs without allocating intermediate strings.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Tokenizer Compression Ratio and KV Cache Footprint",
          prompt:
            "Prove that increasing the tokenizer compression ratio from $R_1 = 3.2$ bytes/token (e.g. Llama-2 with 32k vocab) to $R_2 = 4.8$ bytes/token (e.g. Llama-3 with 128k vocab) reduces KV cache memory consumption and inference prefill compute by exactly $33.3\\%$ for a fixed document of size $B$ bytes.",
          statement:
            "Derive the relationship between token compression and autoregressive decoding cost.",
          proofOutline:
            "1. Document of $B$ bytes requires $T_1 = B / R_1$ tokens under vocab 1 and $T_2 = B / R_2$ tokens under vocab 2.\\n2. Total KV cache memory is $M = 2 \\times n_{\\text{layers}} \\times d_{\\text{model}} \\times T$.\\n3. Ratio of memory is $\\frac{M_2}{M_1} = \\frac{T_2}{T_1} = \\frac{R_1}{R_2} = \\frac{3.2}{4.8} = \\frac{2}{3} = 66.7\\%$.\\n4. Memory and compute are reduced by $1 - 2/3 = 33.3\\%$.",
          engineeringContext:
            "Explains why frontier LLMs transitioned from 32k to 128k/256k vocabularies.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Special Token Prompt Injection & Raw Byte Disallowance",
          prompt:
            "How does Tiktoken prevent prompt injection when user text contains `<|im_start|>` or `<|endoftext|>`? Why does treating special tokens as literal raw bytes during encoding prevent malicious control flow hijacking in chat templates?",
          engineeringContext:
            "Essential for securing enterprise LLM applications against jailbreak attacks.",
        },
      ],
      partD_stressTests: [
        {
          title: "Multi-Core Thread Race on Un-Synchronized Regex Slices",
          scenario:
            "A developer parallelizes tokenization by splitting text at arbitrary byte indices `chunk_size = len(text) // num_threads`. A 4-byte Chinese UTF-8 character is sliced at byte 2, creating two malformed byte fragments. Thread 0 emits a broken byte fallback token, and Thread 1 emits another broken token, permanently corrupting multilingual embeddings.",
          failureMode:
            "Corrupted tokenization and downstream model hallucination on multilingual inputs.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
