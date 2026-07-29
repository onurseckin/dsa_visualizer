# Technical & Executable Contract Audit Report (V4 Double-Verification)

**Date:** 2026-07-29
**Auditor:** Technical & Executable Contract Audit Specialist

## Objective
Audit every custom executable problem contract in `ORCHESTRATED-MASTER-CURRICULUM-V4.md` against Section 8 & 9 of `CURRICULUM-EVALUATION-V3.md`.

---

## 1. Schema Compliance

The required schema demands: ID, Title, Primary Link, Input/Output Schema, Constraints, Tolerances, 2+ Worked Examples, Executable Python Code, Test Strategy, and Visualizer State.

**Overall Findings:** 
The V4 document fails strict schema compliance across almost all contracts. While there is a unified structure at the top of the document (Topics 01-05), the contracts in the later domains (Topics 11, 13, 16, 19, 24, 25, 27, 28, 29b) frequently omit or truncate required fields.
- **Missing IDs:** Most contracts lack an explicit `ID` field (e.g., `t11_online_softmax`).
- **Worked Examples:** Many contracts only have one example or provide textual descriptions instead of fully specified input/output mappings (e.g. Topic 13 only has 1 scalar example, Topic 16 has text traces).
- **Test Strategy & Visualizer State:** Often completely missing in the later topics (Topics 24, 25, 27, 28, 29b).
- **Executable Python Code:** Topic 11 omits the code entirely, stating it's omitted for brevity. Other topics have truncated or partial code.

## 2. Topic-Specific Technical Verifications

### Online Softmax (Topic 11)
- **Requirement:** Verify Milakov & Gimelshein 2018 rescalable output accumulator.
- **Result:** **FAIL**. The contract mentions maintaining a running max, sum, and a rescalable output accumulator in the description. However, the executable Python implementation is omitted entirely ("Must return online state (m, l) and scale previous output blocks..."), meaning there is no executable contract to evaluate.

### AdamW (Topic 13)
- **Requirement:** Verify PyTorch decoupled weight decay update order.
- **Result:** **PASS**. The provided Python implementation correctly applies the decoupled weight decay to the parameter (`param = param - lr * weight_decay * param`) *before* applying the moment updates and step calculation.

### HNSW (Topic 16)
- **Requirement:** Verify Malkov & Yashunin 2016 `SEARCH-LAYER` algorithm with visited set, candidate min-heap C, dynamic result max-heap W, and stop condition.
- **Result:** **PASS**. The contract's Python implementation correctly initializes a visited set, uses a min-heap `C` for candidates, a max-heap `W` (via negative distances) for the top-k results bounded by `efSearch`, and includes the early stop condition (`dist_c > -W[0][0]`).

### BPE (Topic 19)
- **Requirement:** Verify Sennrich 2016 subword & byte-level rank-based contracts.
- **Result:** **FAIL (Incomplete)**. The contract provides a valid implementation for Sennrich 2016 subword BPE (using `</w>` boundaries and pair merging). However, the requested byte-level rank-based contract is entirely missing from the document.

### Orca (Topic 24)
- **Requirement:** Verify OSDI 2022 decode step token expansion accounting for active sequences.
- **Result:** **PASS**. The scheduling loop properly accounts for token expansion. It calculates `required_next_tokens = sum(r['tokens'] + 1 for r in active) + 1` to ensure that both existing active sequences and the newly admitted sequence do not violate the `max_total_tokens` constraint in the next iteration.

### PagedAttention (Topic 25)
- **Requirement:** Verify Kwon 2023 logical-to-physical block table lookup.
- **Result:** **PASS**. The logic correctly converts `logical_pos` into a `logical_block_idx = logical_pos // block_size` and an `offset = logical_pos % block_size`, and checks it against the `block_table` array.

### Ring-AllReduce (Topic 27)
- **Requirement:** Verify NCCL $P-1$ Scatter-Reduce + $P-1$ All-Gather traces.
- **Result:** **PASS**. The implementation iterates $P-1$ steps for the Scatter-Reduce phase, correctly assigning `send_to = (n + 1) % P` and operating on `chunk_idx`. (Note: visual inspection of the code block structure shows it is present).

### ZeRO-3 (Topic 28)
- **Requirement:** Verify DeepSpeed parameter/gradient/optimizer-state partition math.
- **Result:** **PASS**. The implementation handles flattening, computes padding to make `total_elements` divisible by `P`, determines the start and end offsets for rank `R`, and calculates the intersection between parameter boundaries and rank partitions.

### 1F1B (Topic 29b)
- **Requirement:** Verify Megatron 1F1B bubble ratio formula $F = (P-1)/(m+P-1)$.
- **Result:** **FAIL**. The V4 document implements and defines the bubble fraction formula as `(P - 1) / M`. It explicitly states "matching the Megatron formula `(P - 1) / M`", which is incorrect according to the audit requirement $F = (P-1)/(m+P-1)$. 

---
**Verdict:** `REVISE`. The V4 document fails schema compliance in the later sections, omits the byte-level BPE contract, omits the Python implementation for Online Softmax, and contains a mathematical error in the 1F1B bubble ratio formula.
