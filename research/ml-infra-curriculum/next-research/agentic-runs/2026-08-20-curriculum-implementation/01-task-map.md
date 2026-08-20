# Implementation Task Map: Machine Learning Curriculum Integration

**Run ID:** `2026-08-20-curriculum-implementation`  
**Architecture:** $2N + 1$ Triad (4 Implementers + 4 Validators)

---

## 1. Disjoint Work Lanes

| Lane | Scope Files | Description | Assigned Implementer | Assigned Validator |
|---|---|---|---|---|
| **Lane 1 (Topics & Types)** | `src/curriculum/topics.ts`<br>`src/components/knowledge-graph/data/mlInfraTypes.ts`<br>`scripts/auditCatalog.ts` | Update `TOPIC_CATALOG` with 41 ML topics, define 10 Domain Families, and update catalog audit bounds. | `Implementer 1 (Topics & Catalog)` | `Validator 1 (Topics & Catalog)` |
| **Lane 2 (DAG & Layout)** | `src/components/knowledge-graph/mlInfraTree.ts` | Author the 41-node topological placement DAG with non-overlapping SVG coordinates and authentic prerequisite edges. | `Implementer 2 (DAG Layout)` | `Validator 2 (DAG Layout)` |
| **Lane 3 (Question Bank A & B)** | `src/curriculum/mlQuestionBank.ts` (Domains 1–5: Topics 01–23) | Author TypeScript data structures for Topics 01–23 with all fields of questions (Parts A, B, C, D, Contracts). | `Implementer 3 (Question Bank 1)` | `Validator 3 (Question Bank 1)` |
| **Lane 4 (Question Bank C & D)** | `src/curriculum/mlQuestionBank.ts` (Domains 6–10: Topics 24–41) | Author TypeScript data structures for Topics 24–41 with all fields of questions (Parts A, B, C, D, Contracts). | `Implementer 4 (Question Bank 2)` | `Validator 4 (Question Bank 2)` |
