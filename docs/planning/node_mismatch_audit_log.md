# Knowledge Tree & ML Infra Node Problem Count Audit Log

This document tracks all 34 nodes across the DSA Knowledge Tree and ML Infrastructure Knowledge Tree, recording node definition counts, slide-over drawer counts, actual registry counts, and fix status.

## Audit Matrix & Verification Status

### 1. ML Infrastructure Knowledge Tree Nodes (13 Clusters)

| Node ID | Category Folder | Stored `algorithmCount` | Stored `questions.length` | Registry Count | Original Status | Drawer Fix Status | Data Def Fix Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `ml_tensor_algebra` | `ml_tensor_algebra` | **27** | 15 | **27** | ⚠️ Mismatch (15 vs 27) | ✅ Resolved (27 listed) | ✅ Updated to 27 |
| `ml_gemm_roofline` | `ml_gemm_roofline` | **46** | 17 | **46** | ⚠️ Mismatch (17 vs 46) | ✅ Resolved (46 listed) | ✅ Updated to 46 |
| `ml_autograd_dags` | `ml_autograd_dags` | **20** | 16 | **20** | ⚠️ Mismatch (16 vs 20) | ✅ Resolved (20 listed) | ✅ Updated to 20 |
| `ml_precision_quantization` | `ml_precision_quantization` | **22** | 15 | **22** | ⚠️ Mismatch (15 vs 22) | ✅ Resolved (22 listed) | ✅ Updated to 22 |
| `ml_vector_search` | `ml_vector_search` | **20** | 16 | **20** | ⚠️ Mismatch (16 vs 20) | ✅ Resolved (20 listed) | ✅ Updated to 20 |
| `ml_tokenization` | `ml_tokenization` | **19** | 16 | **19** | ⚠️ Mismatch (16 vs 19) | ✅ Resolved (19 listed) | ✅ Updated to 19 |
| `ml_attention_geometry` | `ml_attention_geometry` | **29** | 16 | **29** | ⚠️ Mismatch (16 vs 29) | ✅ Resolved (29 listed) | ✅ Updated to 29 |
| `ml_convolutions` | `ml_convolutions` | **18** | 16 | **18** | ⚠️ Mismatch (16 vs 18) | ✅ Resolved (18 listed) | ✅ Updated to 18 |
| `ml_tree_ensembles` | `ml_tree_ensembles` | **17** | 15 | **17** | ⚠️ Mismatch (15 vs 17) | ✅ Resolved (17 listed) | ✅ Updated to 17 |
| `ml_hardware_kernels` | `ml_hardware_kernels` | **35** | 16 | **35** | ⚠️ Mismatch (16 vs 35) | ✅ Resolved (35 listed) | ✅ Updated to 35 |
| `ml_distributed_systems` | `ml_distributed_systems` | **20** | 16 | **20** | ⚠️ Mismatch (16 vs 20) | ✅ Resolved (20 listed) | ✅ Updated to 20 |
| `ml_llm_serving` | `ml_llm_serving` | **25** | 16 | **25** | ⚠️ Mismatch (16 vs 25) | ✅ Resolved (25 listed) | ✅ Updated to 25 |
| `ml_graph_compilers` | `ml_graph_compilers` | **4** | 4 | **4** | ✅ Match (4 vs 4) | ✅ Resolved (4 listed) | ✅ Verified 4 |

### 2. DSA Knowledge Tree Nodes (21 Clusters)

| Node ID | Category Folder | Stored `algorithmCount` | Registry Count | Original Status | Card Render Status | Data Def Fix Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `arrays-and-hashing` | `arrays_and_hashing` | **37** | **37** | ⚠️ Mismatch (4 vs 37) | ✅ 37 rendered | ✅ Updated to 37 |
| `two-pointers` | `two_pointers` | **4** | **4** | ⚠️ Mismatch (3 vs 4) | ✅ 4 rendered | ✅ Updated to 4 |
| `stack-and-queue` | `stack_and_queue` | **2** | **2** | ⚠️ Mismatch (3 vs 2) | ✅ 2 rendered | ✅ Updated to 2 |
| `binary-search` | `binary_search` | **4** | **4** | ⚠️ Mismatch (3 vs 4) | ✅ 4 rendered | ✅ Updated to 4 |
| `sliding-window` | `sliding_window` | **1** | **1** | ⚠️ Mismatch (3 vs 1) | ✅ 1 rendered | ✅ Updated to 1 |
| `linked-list` | `linked_list` | **1** | **1** | ⚠️ Mismatch (3 vs 1) | ✅ 1 rendered | ✅ Updated to 1 |
| `tree-fundamentals` | `tree_fundamentals` | **1** | **1** | ⚠️ Mismatch (4 vs 1) | ✅ 1 rendered | ✅ Updated to 1 |
| `tries-and-strings` | `tries_and_strings` | **11** | **11** | ⚠️ Mismatch (4 vs 11) | ✅ 11 rendered | ✅ Updated to 11 |
| `heap-and-priority-queue` | `heap_and_priority_queue` | **1** | **1** | ⚠️ Mismatch (3 vs 1) | ✅ 1 rendered | ✅ Updated to 1 |
| `backtracking` | `backtracking` | **5** | **5** | ⚠️ Mismatch (4 vs 5) | ✅ 5 rendered | ✅ Updated to 5 |
| `graph-traversal` | `graph_traversal` | **24** | **24** | ⚠️ Mismatch (4 vs 24) | ✅ 24 rendered | ✅ Updated to 24 |
| `graph-shortest-paths` | `graph_shortest_paths` | **3** | **3** | ✅ Match (3 vs 3) | ✅ 3 rendered | ✅ Verified 3 |
| `graph-spanning-trees` | `graph_spanning_trees` | **3** | **3** | ✅ Match (3 vs 3) | ✅ 3 rendered | ✅ Verified 3 |
| `graph-directed-and-scc` | `graph_directed_and_scc` | **7** | **7** | ⚠️ Mismatch (3 vs 7) | ✅ 7 rendered | ✅ Updated to 7 |
| `graph-flows-and-cuts` | `graph_flows_and_cuts` | **3** | **3** | ✅ Match (3 vs 3) | ✅ 3 rendered | ✅ Verified 3 |
| `dp-1d` | `dp_1d` | **5** | **5** | ⚠️ Mismatch (4 vs 5) | ✅ 5 rendered | ✅ Updated to 5 |
| `dp-2d` | `dp_2d` | **4** | **4** | ✅ Match (4 vs 4) | ✅ 4 rendered | ✅ Verified 4 |
| `advanced-range-queries` | `advanced_range_queries` | **23** | **23** | ⚠️ Mismatch (4 vs 23) | ✅ 23 rendered | ✅ Updated to 23 |
| `bit-manipulation` | `bit_manipulation` | **17** | **17** | ⚠️ Mismatch (3 vs 17) | ✅ 17 rendered | ✅ Updated to 17 |
| `math-and-number-theory` | `math_and_number_theory` | **19** | **19** | ⚠️ Mismatch (4 vs 19) | ✅ 19 rendered | ✅ Updated to 19 |
| `geometry-and-sweep-line` | `geometry_and_sweep_line` | **5** | **5** | ⚠️ Mismatch (2 vs 5) | ✅ 5 rendered | ✅ Updated to 5 |

## Summary
- Total Nodes Audited: **34** (21 DSA + 13 ML Infra)
- Initial Mismatches Found: **30**
- Remaining Mismatches: **0**
- All 34 nodes verified matching 1:1 between data definitions, card badges, topic drawer lists, and algorithm registry entries.
