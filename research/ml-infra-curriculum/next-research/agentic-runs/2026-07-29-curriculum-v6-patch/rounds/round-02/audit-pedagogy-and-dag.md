# Pedagogy & DAG Audit Report

## 1. Module and Rungs Verification
- **PASSED**: All 31 modules exist.
  - **FAILED**: Module 14 has rungs [] instead of 5 explicit rungs.
  - **FAILED**: Module 15 has rungs [] instead of 5 explicit rungs.
  - **FAILED**: Module 16 has rungs [] instead of 5 explicit rungs.
  - **FAILED**: Module 17a has rungs [] instead of 5 explicit rungs.
  - **FAILED**: Module 17b has rungs [] instead of 5 explicit rungs.
  - **FAILED**: Module 18 has rungs [] instead of 5 explicit rungs.
  - **FAILED**: Module 19 has rungs [] instead of 5 explicit rungs.
  - **FAILED**: Module 20 has rungs [] instead of 5 explicit rungs.
  - **FAILED**: Module 21 has rungs [] instead of 5 explicit rungs.
  - **FAILED**: Module 22 has rungs [] instead of 5 explicit rungs.
  - **FAILED**: Module 23 has rungs [] instead of 5 explicit rungs.

## 2. Prerequisites Verification
- **FAILED**: Module 01 prereq mismatch.
  Expected: `None (Foundational Module).`
  Actual: `Basic array iteration and pointer arithmetic.`
- **FAILED**: Module 02 prereq mismatch.
  Expected: `Topic 01 (Matrix Layout).`
  Actual: `Topic 01 (Matrix Shape, Indexing & Layout Foundations).`
- **FAILED**: Module 03 prereq mismatch.
  Expected: `Topic 01 (Matrix Layout), Topic 02 (Strides & Views).`
  Actual: `Topic 02 (Tensor Strides, Views, Broadcasting & Aliasing).`
- **FAILED**: Module 04 prereq mismatch.
  Expected: `None (Foundational Module).`
  Actual: `Basic arithmetic and array iterations.`
- **FAILED**: Module 05 prereq mismatch.
  Expected: `Topic 04 (FP Precision & Reductions), Topic 03 (Dense MatMul & Tiling).`
  Actual: `Topic 04 (Floating-Point Precision).`
- **FAILED**: Module 06 prereq mismatch.
  Expected: `None (Foundational Module).`
  Actual: `Topic 01 (Basic array/list operations for graph adjacency lists).`
- **FAILED**: Module 07 prereq mismatch.
  Expected: `Topic 06 (Topological Ordering).`
  Actual: `Topic 06 (DAG Topological Ordering).`
- **FAILED**: Module 08 prereq mismatch.
  Expected: `Topic 06 (Topological Ordering).`
  Actual: `Topic 06.`
- **FAILED**: Module 09 prereq mismatch.
  Expected: `Topic 01 (Matrix Layout), Topic 02 (Strides & Views), Topic 06 (Topological Ordering), Topic 08 (AST & Operator IR).`
  Actual: `Topic 08 (AST/Tape), Topic 02 (Tensor Broadcasting).`
- **FAILED**: Module 10 prereq mismatch.
  Expected: `Topic 04 (FP Precision & Reductions).`
  Actual: `Topic 09 (Autograd).`
- **FAILED**: Module 11 prereq mismatch.
  Expected: `Topic 04 (FP Precision & Reductions).`
  Actual: `Topic 10 (Loss Math), Topic 04 (FP Precision).`
- **FAILED**: Module 12 prereq mismatch.
  Expected: `Topic 04 (FP Precision & Reductions), Topic 10 (Loss Functions & Probability), Topic 11 (LogSumExp & Softmax).`
  Actual: `Topic 10 (Probability), Topic 11 (Stable Softmax).`
- **FAILED**: Module 13 prereq mismatch.
  Expected: `Topic 09 (Autograd Engine), Topic 10 (Loss Functions & Probability), Topic 11 (LogSumExp & Softmax).`
  Actual: `Topic 09 (Autograd), Topic 10 (Loss).`
- **FAILED**: Module 14 prereq mismatch.
  Expected: `None (Foundational Module).`
  Actual: `- Topic 03: Dense & Sparse Matrix Multiplication (Dot products)`
- **FAILED**: Module 15 prereq mismatch.
  Expected: `Topic 14 (Exact Vector Search).`
  Actual: `- Topic 14: Exact Vector Search`
- **FAILED**: Module 16 prereq mismatch.
  Expected: `Topic 14 (Exact Vector Search).`
  Actual: `- Topic 14: Exact Vector Search (Priority Queues)`
- **FAILED**: Module 17a prereq mismatch.
  Expected: `Topic 14 (Exact Vector Search).`
  Actual: `- Topic 14: Exact Vector Search`
- **FAILED**: Module 17b prereq mismatch.
  Expected: `Topic 14 (Exact Vector Search).`
  Actual: `- Topic 14: Exact Vector Search`
- **FAILED**: Module 18 prereq mismatch.
  Expected: `None (Foundational Module).`
  Actual: `Basic Trees.`
- **FAILED**: Module 19 prereq mismatch.
  Expected: `Topic 18 (String Matching & Tries).`
  Actual: `Topic 18 (String Matching).`
- **FAILED**: Module 20 prereq mismatch.
  Expected: `Topic 01 (Matrix Layout), Topic 03 (Dense MatMul & Tiling), Topic 04 (FP Precision & Reductions).`
  Actual: `Topic 01 (Matrix Shapes).`
- **FAILED**: Module 21 prereq mismatch.
  Expected: `Topic 03 (Dense MatMul & Tiling), Topic 04 (FP Precision & Reductions), Topic 10 (Loss Functions & Probability).`
  Actual: `Topic 10 (Loss Functions).`
- **FAILED**: Module 22 prereq mismatch.
  Expected: `Topic 03 (Dense MatMul & Tiling), Topic 04 (FP Precision & Reductions), Topic 11 (LogSumExp & Softmax).`
  Actual: `Topic 03 (Matrix Multiplication), Topic 11 (Softmax).`
- **FAILED**: Module 23 prereq mismatch.
  Expected: `Topic 03 (Dense MatMul & Tiling), Topic 11 (LogSumExp & Softmax), Topic 22 (SDPA & KV Cache).`
  Actual: `Topic 22 (Attention), Topic 11 (Online Softmax).`
- **FAILED**: Module 24 prereq mismatch.
  Expected: `Topic 22 (SDPA & KV Cache).`
  Actual: `- Topic 06 (Topological Ordering)`
- **FAILED**: Module 25 prereq mismatch.
  Expected: `Topic 22 (SDPA & KV Cache).`
  Actual: `- Topic 24 (Discrete-Event Scheduling)`
- **FAILED**: Module 26 prereq mismatch.
  Expected: `None (Foundational Module).`
  Actual: `- Topic 06 (Topological Ordering)`
- **FAILED**: Module 27 prereq mismatch.
  Expected: `Topic 26 (Interconnect Topology).`
  Actual: `- Topic 26 (Network Topology)`
- **FAILED**: Module 28 prereq mismatch.
  Expected: `Topic 13 (Optimizers & State), Topic 27 (Ring Collectives).`
  Actual: `- Topic 13 (Optimizers)`
- **FAILED**: Module 29a prereq mismatch.
  Expected: `Topic 02 (Strides & Views), Topic 06 (Topological Ordering), Topic 07 (DAG DP & Liveness), Topic 08 (AST & Operator IR).`
  Actual: `- Topic 08 (Expression Parsing & AST)`
- **FAILED**: Module 29b prereq mismatch.
  Expected: `Topic 03 (Dense MatMul & Tiling), Topic 22 (SDPA & KV Cache), Topic 26 (Interconnect Topology), Topic 27 (Ring Collectives), Topic 28 (Distributed State & ZeRO), Topic 29a (Compiler Passes & Fusion).`
  Actual: `- Topic 29a (Graph Compiler Passes)`

## 3. Topic 07 Verification
- **FAILED**: Topic 07 verification failed. Rungs: 5, Has Contract: False

## 4. Weak Analogy Replacements Verification
- Topic 11 (LogSumExp): **PASSED**
- Topic 27 (Circular Queue): **PASSED**
- Topic 28 (Split List): **PASSED**
- Topic 29b (Cookies): **PASSED**