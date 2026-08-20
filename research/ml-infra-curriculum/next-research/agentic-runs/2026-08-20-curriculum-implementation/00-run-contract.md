# Implementation Run Contract: Machine Learning Curriculum Integration

**Run ID:** `2026-08-20-curriculum-implementation`  
**Protocol:** `orchestrating-long-tasks`  
**Target:** Full integration of the 10-domain, 41-topic Machine Learning curriculum, question banks, and DAG visualization into the application codebase.

---

## 1. System Invariants & Rules

1. **TypeScript Law**: Zero `any` types (annotations, casts, generic defaults). 100% strict type safety.
2. **Catalog Integrity**: 
   - `src/curriculum/topics.ts` defines all 41 ML topics under track `"ml-infra"`.
   - `src/components/knowledge-graph/data/mlInfraTypes.ts` defines the 10 Domain Families.
   - `src/components/knowledge-graph/mlInfraTree.ts` defines the 41-node topological placement DAG with non-overlapping coordinates and authentic prerequisites (0 cycles).
   - `src/curriculum/mlQuestionBank.ts` houses the full 4-part uncapped Question Bank for all 41 topics with complete field representations.
   - `scripts/auditCatalog.ts` audits and enforces 41 ML topics and 41 ML tree placements.
3. **No-Code Edit Law for Coordinator**: The Coordinator operates strictly in Tier 2 orchestration; all source file edits and verifications are dispatched to Tier 3 Implementers and Validators via `invoke_subagent`.
4. **Verification Gate**:
   - `bun run typecheck`
   - `bun run lint`
   - `bun run audit:catalog`
   - `bun run build`
