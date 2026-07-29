# Curriculum V2 Normalization: Architecture and Splits

## 1. 7-Domain Organization & Topological Prerequisite DAG

- **Domain 1: Tensor representation and numerical kernels** (Topics 01–05)
- **Domain 2: Computation graphs, differentiation, and training mathematics** (Topics 06–13)
- **Domain 3: Retrieval and vector indexing** (Topics 14–17b: 14, 15, 16, 17a IVF-PQ-ADC, 17b LSH)
- **Domain 4: Tokenization and local spatial operators** (Topics 18–20)
- **Domain 5: Model algorithm internals** (Topics 21–23)
- **Domain 6: Inference scheduling and memory** (Topics 24–25)
- **Domain 7: Distributed execution and compiler planning** (Topics 26–29b: 26, 27, 28, 29a Compiler Passes, 29b 3D Parallelism)

### Topological Prerequisite DAG

```mermaid
graph TD
    %% Domain 1 (Topics 01-05)
    T01[Topic 01] --> T02[Topic 02]
    T02 --> T03[Topic 03]
    T03 --> T04[Topic 04]
    T04 --> T05[Topic 05]

    %% Domain 2 (Topics 06-13)
    T05 --> T06[Topic 06]
    T06 --> T07[Topic 07]
    T07 --> T08[Topic 08]
    T08 --> T09[Topic 09]
    T09 --> T10[Topic 10]
    T10 --> T11[Topic 11]
    T11 --> T12[Topic 12]
    T12 --> T13[Topic 13]

    %% Domain 3 (Topics 14-17b)
    T05 --> T14[Topic 14]
    T14 --> T15[Topic 15]
    T15 --> T16[Topic 16]
    T16 --> T17a["Topic 17a: IVF-PQ-ADC"]
    T16 --> T17b["Topic 17b: LSH"]

    %% Domain 4 (Topics 18-20)
    T05 --> T18[Topic 18]
    T18 --> T19[Topic 19]
    T19 --> T20[Topic 20]

    %% Domain 5 (Topics 21-23)
    T13 --> T21[Topic 21]
    T20 --> T21
    T21 --> T22[Topic 22]
    T22 --> T23[Topic 23]

    %% Domain 6 (Topics 24-25)
    T23 --> T24[Topic 24]
    T24 --> T25[Topic 25]

    %% Domain 7 (Topics 26-29b)
    T23 --> T26[Topic 26]
    T26 --> T27[Topic 27]
    T27 --> T28[Topic 28]
    T28 --> T29a["Topic 29a: Compiler Transforms"]
    T28 --> T29b["Topic 29b: 3D Parallelism"]
```

## 2. Topic 17 Split Execution

- **Topic 17a: Inverted File Index (IVF), Product Quantization (PQ) & Asymmetric Distance Computation (ADC)**
  *Scope:* Space-partitioning indexes, compressing vectors via quantization, and performing approximate distance calculations between uncompressed queries and compressed centroids.
  
- **Topic 17b: Locality-Sensitive Hashing (LSH)**
  *Scope:* Hash-based approximate nearest neighbors, probability collision maximization for similar vectors, random projections, and MinHash.

## 3. Topic 29 Split Execution

- **Topic 29a: Graph Compiler Transforms, Fusion & Memory Planning**
  *Scope:* Tracing/compiling computation graphs, operator fusion, kernel code generation, memory layout optimizations, and ahead-of-time buffer allocation.
  
- **Topic 29b: Tensor, Pipeline & Expert Parallel Algorithms (Megatron-LM & 1F1B)**
  *Scope:* Large-scale model distribution, tensor model parallelism (TP), pipeline parallelism (PP) schedules like 1F1B, and mixture-of-experts (MoE) token routing.
