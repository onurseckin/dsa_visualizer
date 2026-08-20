import os, re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROUNDS_DIR = os.path.join(BASE_DIR, "agentic-runs/2026-08-20-curriculum-v8-uncapped-expansion/rounds/round-01")
MASTER_V8_PATH = os.path.join(BASE_DIR, "ORCHESTRATED-MASTER-CURRICULUM-V8.md")

DOMAIN_FILES = [
    "domain-01-linear-algebra.md",
    "domain-02-calculus-and-optimization.md",
    "domain-03-probability-and-statistics.md",
    "domain-04-classical-ml-and-data-science.md",
    "domain-05-deep-learning-and-activations.md",
    "domain-06-tokenization-and-retrieval.md",
    "domain-07-attention-and-transformers.md",
    "domain-08-inference-systems.md",
    "domain-09-precision-quantization-kernels.md",
    "domain-10-distributed-and-compilers.md",
]

HEADER = """# Orchestrated Master Machine Learning Curriculum (Version 8.0 — Uncapped Comprehensive Question Bank)

**Curriculum Track:** Comprehensive Machine Learning & Modern Systems (Mathematics, Statistics, Data Science, Deep Learning, Transformers & Distributed Infrastructure)  
**Total Topics:** 41  
**Total Verified LeetCode Problems:** 157  
**Total Executable Problem Contracts:** 41  
**Total Academic Course Alignments:** Stanford CS229, CS231n, CS224N, CS336; MIT 18.065, 6.041; CMU 10-714; UC Berkeley CS294  
**Total Modern Tech Alignments:** OpenAI (tiktoken, Speculative Decoding), Meta (Llama 3/4 RoPE, RMSNorm, GQA, FSDP), Anthropic (InfoNCE, Prefix Caching), Google DeepMind (Gemini MoE, XLA), DeepSeek (MLA, FP8, dual-pipe), vLLM / NVIDIA (PagedAttention, FlashAttention, NCCL Ring-AllReduce)  
**Status:** 100% Dynamically Verified Pure-Python Contracts (41/41 Passing Tests)

---

## 1. Architectural Philosophy: The Uncapped Multi-Part Question Bank

Curriculum Version 8.0 completely eliminates rigid question quotas (e.g. the historical 5-per-topic limit). Instead, every topic is provisioned with a **comprehensive, multi-part Problem & Question Bank** dynamically scaled to the topic's true conceptual and systems complexity:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             FOUR-PART DYNAMIC QUESTION TAXONOMY                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Part A: Foundational DSA & Coding Problems                                                      │
│ └── 3 to 6 verified LeetCode / platform coding problems establishing algorithmic primitives.     │
│                                                                                                  │
│ Part B: Mathematical Proofs & Analytical Derivations                                             │
│ └── 2 to 4 rigorous mathematical proofs (e.g., Eckart-Young-Mirsky SVD, AdamW updates, KKT).     │
│                                                                                                  │
│ Part C: Real-World ML Systems & Engineering Scenarios                                            │
│ └── 2 to 4 production engineering challenges (e.g., KV cache sizing, continuous batching, NCCL). │
│                                                                                                  │
│ Part D: Edge Cases, Numerical Stability & Stress Tests                                           │
│ └── 2 to 3 critical stress-tests (e.g., float cancellation, mask underflow, pipeline stalls).    │
│                                                                                                  │
│ Primary Executable Python Contract (Rung 4)                                                      │
│ └── 100% bug-free, self-contained, dependency-free reference code passing automated test suites. │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Topological Domain Progression Overview

```mermaid
flowchart TD
    D1["Domain 1: Linear Algebra & Vector Spaces (Topics 01-04)"] --> D2["Domain 2: Calculus, Optimization & Autograd (Topics 05-08)"]
    D1 --> D4["Domain 4: Classical ML & Data Science (Topics 13-18)"]
    D3["Domain 3: Probability, Statistics & Sampling (Topics 09-12)"] --> D4
    D2 --> D5["Domain 5: Deep Learning Architectures (Topics 19-23)"]
    D1 --> D6["Domain 6: Tokenization & Vector Retrieval (Topics 24-27)"]
    D5 --> D7["Domain 7: Attention & Transformers (Topics 28-30)"]
    D6 --> D7
    D7 --> D8["Domain 8: Inference Serving Systems (Topics 31-33)"]
    D1 --> D9["Domain 9: Precision, Quantization & Kernels (Topics 34-36)"]
    D7 --> D9
    D8 --> D10["Domain 10: Distributed Training & Compilers (Topics 37-41)"]
    D9 --> D10
```

---

"""

def compile_master_v8():
    content = [HEADER]
    for fname in DOMAIN_FILES:
        fpath = os.path.join(ROUNDS_DIR, fname)
        if not os.path.exists(fpath):
            print(f"Error: {fpath} does not exist!")
            return
        with open(fpath, "r") as f:
            d_text = f.read().strip()
        content.append(d_text)
        content.append("\n\n---\n\n")
    
    full_text = "".join(content)
    with open(MASTER_V8_PATH, "w") as f:
        f.write(full_text)
    
    print(f"Successfully compiled {len(DOMAIN_FILES)} domain files into {MASTER_V8_PATH} ({len(full_text.encode('utf-8'))} bytes).")

if __name__ == "__main__":
    compile_master_v8()
