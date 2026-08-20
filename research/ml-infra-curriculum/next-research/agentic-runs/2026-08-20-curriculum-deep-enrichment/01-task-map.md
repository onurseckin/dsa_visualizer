# Deep Enrichment Task Map: Multi-Agent Parallel Wave

**Run ID:** `2026-08-20-curriculum-deep-enrichment`  
**Architecture:** $2N + 1$ Triad (4 Implementers + 4 Validators)

---

## 1. Work Lanes & Disjoint Scopes

| Lane | Target Files | Scope | Assigned Implementer | Assigned Validator |
|---|---|---|---|---|
| **Lane 1 (Schema & Types)** | `src/curriculum/mlQuestions/types.ts`<br>`src/curriculum/mlQuestions/index.ts` | Expand `MLTopicQuestionBank` and helper types for `codeVariants`, `complexityAnalysis`, `topicGuide`, `tutorialAlignment`, and `visualizerSchema`. | `Implementer 1 (Types & Architecture)` | `Validator 1 (Types & Architecture)` |
| **Lane 2 (Domains 1 & 2)** | `src/curriculum/mlQuestions/domain01to02.ts` | Author deep models for Topics 01–08 (Linear Algebra, Calculus, Autograd, AdamW, Losses). | `Implementer 2 (Math & Autograd)` | `Validator 2 (Math & Autograd)` |
| **Lane 3 (Domains 3 & 4)** | `src/curriculum/mlQuestions/domain03to04.ts` | Author deep models for Topics 09–18 (Probability, Stats, Classical ML, GBDTs, SVM, ALS). | `Implementer 3 (Stats & Classical ML)` | `Validator 3 (Stats & Classical ML)` |
| **Lane 4 (Domains 5 to 10)** | `src/curriculum/mlQuestions/domain05to10.ts` | Author deep models for Topics 19–41 (Deep Learning, Retrieval, Attention, Transformers, Systems, Kernels, Distributed). | `Implementer 4 (DL & Systems)` | `Validator 4 (DL & Systems)` |
