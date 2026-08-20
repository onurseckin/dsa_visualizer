# Run Contract: Curriculum Version 8.0 — Uncapped Comprehensive ML Question Bank

**Run ID:** `2026-08-20-curriculum-v8-uncapped-expansion`  
**Date:** 2026-08-20  
**Protocol:** `orchestrating-long-tasks` & `iterative-multi-agent-evaluation`  
**Harness Mode:** Multi-Agent Wave Deployment ($2N + 1$ Triad Floor Architecture)

---

## 1. Primary Objectives & Invariants

1. **Uncapped & Generous Question Density**:
   - Strictly abolish the artificial "5-per-topic" constraint.
   - Topics scale dynamically according to their real-world depth and pedagogical significance (from 10–15 questions on foundational topics to 30–40+ questions on core systems like Attention, Transformers, Classical ML, and Distributed Training).
2. **Comprehensive Question Taxonomy per Topic**:
   - **Foundational DSA & Math Problems**: Authentically verified LeetCode (Easy/Medium/Hard), CSES, and Project Euler problems with direct URLs.
   - **Theoretical Derivations & Analytical Questions**: Step-by-step mathematical proofs, gradient derivations, and computational complexity questions.
   - **Production & System Design Questions**: Real-world interview and systems engineering questions (e.g. KV-cache VRAM sizing, network latency under Ring-AllReduce, SRAM tile register spills).
   - **Executable Machine Learning Contracts**: Pure Python executable mechanism implementations with complete test strategies and worked numerical examples.
   - **Failure Modes, Stress Tests & Boundary Cases**: Edge case behaviors, numerical underflow/overflow, floating-point cancellations, and out-of-distribution handling.
3. **Academic & Industry Grounding**:
   - Explicitly mapped to Stanford CS229, CS231n, CS224N, CS336; MIT 18.065, 6.041; CMU 10-714; UC Berkeley CS294.
   - Grounded in modern frontier tech stacks: OpenAI (tiktoken, speculative decoding), Meta (Llama 3/4 RoPE, RMSNorm, GQA, FSDP), Anthropic (InfoNCE, prefix caching), DeepSeek (MLA, FP8, dual-pipe), Google Gemini (MoE routing, XLA), vLLM / NVIDIA (PagedAttention, FlashAttention, NCCL).
4. **Codebase Boundary**:
   - All research remains isolated under `research/ml-infra-curriculum/next-research/`.
   - Zero modifications to production source code in `src/`.
