# Code Modularity, Type Deduplication & 500-Line Limit Run Contract

**Run ID:** `2026-08-20-code-modularity-and-hardening`  
**Protocol:** `orchestrating-long-tasks`  

---

## 1. Objectives
1. **Strict 500-Line Limit**: Decompose all curriculum question bank files and related modules so every `.ts` file is strictly $\le 500$ lines.
2. **Type Deduplication & Single Source of Truth**: Eliminate duplicate type definitions between `src/types/dsa.ts` and `src/curriculum/mlQuestions/types.ts`. Unify `TopicGuide`, `CodeVariant`, `ComplexityAnalysis`, `TopicGuideTerm`, and `TopicGuideSection`.
3. **Complete 486+ Question Richness Across All 41 Topics**:
   - $\ge 3$ verified LeetCode problems (Part A) with real URLs and rationales.
   - $\ge 2$ mathematical proofs (Part B) with structured outlines.
   - $\ge 2$ real-world systems questions (Part C) with production engineering contexts.
   - $\ge 2$ stress tests (Part D) with failure modes.
   - 1 Executable Python contract with pure Python code.
   - $\ge 2$ executable code variants per topic with time/space complexities.
   - Big-O complexity analysis and hardware memory breakdown.
   - Topic guide with overview, key terms, and section explanations.
   - 3-phase tutorial alignment matching `TUTORIAL_GUIDE.md`.
   - Visualizer schema with canvas types, state variables, and token mappings.
4. **Adversarial Verification**: Zero empty arrays, 100% Python compilation, strict TypeScript (`tsc --noEmit`) with zero `any`, and clean pass across all repository gates.
