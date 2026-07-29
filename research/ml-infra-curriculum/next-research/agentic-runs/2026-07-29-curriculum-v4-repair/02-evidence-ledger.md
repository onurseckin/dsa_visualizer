# Curriculum V4 Repair: Evidence Ledger (Round 01 to Round 02)

## Goal
Verify the 5 Domain Specialist reports against the mandatory completion criteria in `CURRICULUM-EVALUATION-V3.md`.

## 1. 31 Complete Module Records
**Claim:** There are exactly 31 complete module records.
**Evidence:** Yes, across the 5 domain files, there are exactly 31 topics: 01 to 16, 17a, 17b, 18 to 28, 29a, and 29b.
**Status:** PASS

## 2. Full 5-Rung Ladders
**Claim:** All 31 modules have full 5-rung ladders (Foundation, Focused Variant, ML Bridge, Named Mechanism, Stress Endpoint).
**Evidence:** No. Several modules in Domain 2 (e.g., Topic 09, 11, 12, 13) are missing the 5th rung (Stress / Tradeoff Endpoint). Topic 09 is missing rung 7 (Stress/Tradeoff) entirely, jumping straight to the contract.
**Status:** FAIL

## 3. Literal Direct URLs for All Foundation Rungs
**Claim:** Direct literal URLs provided for all foundation rungs.
**Evidence:** No. Several foundation rungs specify "Source: Custom" or omit the URL completely (e.g., Topic 09: Scalar Derivatives, Topic 10: Probability Normalization, Topic 13: Running Average, Topic 22: Naive Dot-Product, Topic 23: SRAM Block Matrix Tiling).
**Status:** FAIL

## 4. LeetCode 1458 Removed from Topic 14
**Claim:** LeetCode 1458 is completely absent from Topic 14.
**Evidence:** Yes. Domain 3 explicitly states it was removed and it does not appear in Topic 14's ladder.
**Status:** PASS

## 5. 100% Complete Custom Problem Contracts
**Claim:** The custom problem contracts meet 100% of the schema.
**Evidence:** No. Multiple contracts are missing fields. For example, Topic 06's contract has no ID, no Primary URL, and omits the Python implementation entirely. Topic 16 (HNSW) has no Test Strategy and no Visualizer State. Topic 24 (Orca) lacks an ID, Test Strategy, and Visualizer State.
**Status:** FAIL

## 6. Technical Fixes Accuracy
**Claim:** Technical fixes for Online Softmax, AdamW, HNSW, BPE, Orca, PagedAttention, Ring-AllReduce, ZeRO-3, and 1F1B are mathematically accurate.
**Evidence:** Mostly accurate, but Orca is mathematically incorrect. The continuous batching scheduler in Topic 24 (Orca) checks `current_tokens + 1 <= max_total_tokens` before admitting a new request, but fails to account for the fact that ALL existing active requests will also grow by 1 token in the next iteration. This leads to immediate memory limit violations.
**Status:** FAIL
