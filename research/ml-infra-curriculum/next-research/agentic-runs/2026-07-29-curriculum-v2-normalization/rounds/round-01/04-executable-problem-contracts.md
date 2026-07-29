# 04 Executable Problem Contracts

## 1. Executable Problem Contract Schema

Every executable problem in the ML Infrastructure curriculum must adhere to the following schema to ensure consistency, rigor, and visualizability.

*   **ID:** Unique, kebab-case identifier (e.g., `sram-tiled-gemm`).
*   **Title:** Human-readable name (e.g., "SRAM Tiled GEMM with Edge Tiles").
*   **Primary Reference:** Link to canonical source or paper (e.g., FlashAttention paper, Megatron-LM codebase).
*   **Prompt:** The exact wording of the problem statement presented to the user.
*   **Input Schema:** Exact types, shapes, and constraints for all function arguments.
*   **Output Schema:** Exact types and shapes for the returned value(s).
*   **Constraints:** Time/space complexity bounds, required numerical precision, and restricted operations (e.g., "cannot use `torch.matmul`").
*   **Numerical Tolerances & Tie-Breaking:** Explicit rules for floating-point comparisons (e.g., `atol=1e-5`, `rtol=1e-5`) and deterministic tie-breaking.
*   **Examples:** At least two fully worked out input/output pairs, including one edge case.
*   **Edge Cases:** Specific tricky scenarios the reference implementation and tests must handle (e.g., empty batches, non-divisible tile sizes).
*   **Reference Implementation:** The canonical, optimal, readable Python solution.
*   **Test Strategy:** How the problem will be verified (e.g., property-based testing, specific fuzzing strategies).
*   **Visualizer State:** Data structures required to render the step-by-step execution for the tutorial component.

## 2. Problem Contracts

### Storage Offset & Stride Math (Topic 02)
*   **ID:** `storage-offset-stride`
*   **Title:** Storage Offset & Stride Math
*   **Primary Reference:** PyTorch Internals Tensor View semantics
*   **Prompt:** Given a tensor's shape, strides, and storage offset, compute the 1D flat storage index for a given multi-dimensional coordinate. Implement bounds checking.
*   **Input Schema:** `shape: List[int], strides: List[int], offset: int, coord: List[int]`
*   **Output Schema:** `int` (the flat index) or raise `IndexError`
*   **Constraints:** O(N) where N is the number of dimensions. No imports.
*   **Numerical Tolerances & Tie-Breaking:** N/A (integer math).
*   **Examples:**
    *   Input: `shape=[3, 4], strides=[4, 1], offset=0, coord=[1, 2]` -> Output: `6`
*   **Edge Cases:** Coordinate out of bounds (negative or >= shape), 0-dimensional tensors.
*   **Reference Implementation:**
    ```python
    def compute_flat_index(shape, strides, offset, coord):
        if len(shape) != len(coord) or len(shape) != len(strides):
            raise ValueError("Mismatched dimensions")
        idx = offset
        for dim_size, stride, c in zip(shape, strides, coord):
            if c < 0 or c >= dim_size:
                raise IndexError("Coordinate out of bounds")
            idx += c * stride
        return idx
    ```
*   **Test Strategy:** Randomly generated shapes and strides, both contiguous and non-contiguous.
*   **Visualizer State:** 1D array view alongside N-dimensional grid, highlighting the active coordinate and cumulative offset.

### SRAM Tiled GEMM with Edge Tiles (Topic 03)
*   **ID:** `sram-tiled-gemm`
*   **Title:** SRAM Tiled GEMM with Edge Tiles
*   **Primary Reference:** General blocked matrix multiplication literature
*   **Prompt:** Implement tiled matrix multiplication C = A @ B given matrices A (M x K) and B (K x N) and a tile size T. Handle the cases where M, K, N are not cleanly divisible by T.
*   **Input Schema:** `A: List[List[float]], B: List[List[float]], T: int`
*   **Output Schema:** `List[List[float]]` (the M x N matrix C)
*   **Constraints:** Perform the computation strictly block-by-block.
*   **Numerical Tolerances & Tie-Breaking:** Exact floating-point math as defined by standard IEEE 754 operations.
*   **Examples:**
    *   Input: 2x3 and 3x2 matrices with T=2.
*   **Edge Cases:** T > max(M, N, K), 1x1 matrices.
*   **Reference Implementation:** (Nested loops over blocks, handling partial block boundaries using `min()`).
*   **Test Strategy:** Compare against standard O(N^3) implementation for small arbitrary matrices.
*   **Visualizer State:** Highlight active tiles in A, B, and C.

### Kahan Compensated Summation (Topic 04)
*   **ID:** `kahan-compensated-summation`
*   **Title:** Kahan Compensated Summation
*   **Primary Reference:** Kahan (1965)
*   **Prompt:** Sum a list of floating-point numbers using Kahan summation to minimize numerical error.
*   **Input Schema:** `nums: List[float]`
*   **Output Schema:** `float`
*   **Constraints:** Maintain a running compensation term.
*   **Numerical Tolerances & Tie-Breaking:** Must exactly match IEEE 754 Kahan summation trace.
*   **Examples:** Summing `[1.0, 1e-16, 1e-16]` standard vs Kahan.
*   **Edge Cases:** Empty list (return 0.0), lists with infinities/NaNs.
*   **Reference Implementation:**
    ```python
    def kahan_sum(nums):
        total = 0.0
        c = 0.0
        for num in nums:
            y = num - c
            t = total + y
            c = (t - total) - y
            total = t
        return total
    ```
*   **Test Strategy:** Highly divergent magnitude summation tests comparing to high-precision reference.
*   **Visualizer State:** Variables `total`, `c`, `y`, `t` per iteration.

### Scale & Zero-Point Quantize/Dequantize (Topic 05)
*   **ID:** `scale-zp-quantize`
*   **Title:** Scale & Zero-Point Quantize/Dequantize
*   **Primary Reference:** PyTorch Quantization documentation
*   **Prompt:** Given a list of floats, target min/max integers (e.g., `[-128, 127]`), compute scale and zero-point, quantize the values, and then dequantize them.
*   **Input Schema:** `values: List[float], qmin: int, qmax: int`
*   **Output Schema:** `Tuple[List[int], List[float], float, int]` (quantized, dequantized, scale, zero_point)
*   **Constraints:** O(N) time.
*   **Numerical Tolerances & Tie-Breaking:** Standard half-to-even rounding for quantization.
*   **Examples:** Quantizing `[-10.0, 5.0, 0.0]` to `[-128, 127]`.
*   **Edge Cases:** All input values are identical (handle scale=1.0, ZP offset).
*   **Reference Implementation:** Compute `v_min, v_max`, then `scale = (v_max - v_min) / (qmax - qmin)`, `zp = round(-v_min/scale + qmin)`.
*   **Test Strategy:** Assert quantization bounds and dequantization error limits.
*   **Visualizer State:** Mapping of real number line to discrete integer steps.

### Minimal Autograd Engine Backward Pass (Topic 09)
*   **ID:** `minimal-autograd-backward`
*   **Title:** Minimal Autograd Engine Backward Pass
*   **Primary Reference:** Micrograd (Karpathy)
*   **Prompt:** Implement topological sort and backward accumulation for a minimal computation graph node.
*   **Input Schema:** `root: Node`
*   **Output Schema:** `None` (mutates node `.grad` attributes)
*   **Constraints:** O(V+E) time for the graph size.
*   **Numerical Tolerances & Tie-Breaking:** N/A.
*   **Examples:** A simple `f(x, y) = x * y + z` graph backward pass.
*   **Edge Cases:** Graphs with multiple paths to the same node (gradients must sum).
*   **Reference Implementation:** Toposort via DFS, then iterate in reverse calling `node._backward()`.
*   **Test Strategy:** Build varied DAGs and compare gradients to analytical derivatives.
*   **Visualizer State:** Graph view showing node activation and gradient accumulation propagation.

### Online Softmax State Update & Rescaling (Topic 11)
*   **ID:** `online-softmax-update`
*   **Title:** Online Softmax State Update & Rescaling
*   **Primary Reference:** FlashAttention paper (Algorithm 1)
*   **Prompt:** Maintain a running max and normalizer for an incoming stream of blocks of logits to compute numerically stable softmax.
*   **Input Schema:** `blocks: List[List[float]]`
*   **Output Schema:** `List[List[float]]` (softmaxed blocks)
*   **Constraints:** Must process block-by-block without storing all blocks at once (simulate online).
*   **Numerical Tolerances & Tie-Breaking:** `1e-5` absolute tolerance to standard PyTorch softmax.
*   **Examples:** `[[1.0, 2.0], [5.0, 4.0]]` processed sequentially.
*   **Edge Cases:** Extreme negative/positive values.
*   **Reference Implementation:** Maintain m_new = max(m_old, max(x)), rescale old sum by exp(m_old - m_new).
*   **Test Strategy:** Compare against two-pass softmax over full concatenated input.
*   **Visualizer State:** Running max and normalizer values, rescaling factor per block.

### Top-P Nucleus Sampling (Topic 12)
*   **ID:** `top-p-nucleus-sampling`
*   **Title:** Top-P Nucleus Sampling
*   **Primary Reference:** Holtzman et al. (2019)
*   **Prompt:** Given a probability distribution over vocabulary, filter it to the smallest set of tokens whose cumulative probability exceeds p. Rescale the filtered probabilities.
*   **Input Schema:** `probs: List[float], p: float`
*   **Output Schema:** `List[float]` (filtered and rescaled probs, original indices zeroed if excluded).
*   **Constraints:** O(V log V) time for sorting.
*   **Numerical Tolerances & Tie-Breaking:** Include the token that tips the sum >= p. If multiple tokens tie in probability, sort by index ascending.
*   **Examples:** `probs=[0.1, 0.4, 0.3, 0.2], p=0.6` -> sort to `0.4, 0.3, 0.2, 0.1`, keep `0.4, 0.3` (sum 0.7).
*   **Edge Cases:** p=0.0 (keep only top 1), p=1.0 (keep all).
*   **Reference Implementation:** Sort descending, compute cumsum, find index where cumsum > p, zero out remainder, normalize.
*   **Test Strategy:** Property tests for sum to 1.0, constraints on p thresholds.
*   **Visualizer State:** Sorted bar chart of probabilities, highlighting the "nucleus" region.

### AdamW Decoupled Weight Decay Step (Topic 13)
*   **ID:** `adamw-step`
*   **Title:** AdamW Decoupled Weight Decay Step
*   **Primary Reference:** Loshchilov & Hutter (2019)
*   **Prompt:** Perform a single parameter update step using AdamW rules, ensuring weight decay is applied directly to the parameter, decoupled from the gradient updates.
*   **Input Schema:** `param: float, grad: float, m: float, v: float, t: int, lr: float, beta1: float, beta2: float, eps: float, weight_decay: float`
*   **Output Schema:** `Tuple[float, float, float]` (new_param, new_m, new_v)
*   **Constraints:** O(1) time.
*   **Numerical Tolerances & Tie-Breaking:** Standard IEEE 754.
*   **Examples:** Standard step with typical hyperparameters.
*   **Edge Cases:** t=1, weight_decay=0.0.
*   **Reference Implementation:** Standard Adam equations with bias correction, plus `param -= lr * weight_decay * param`.
*   **Test Strategy:** Compare 100 step trajectory against PyTorch optim.AdamW.
*   **Visualizer State:** M, V, and Param value traces over time.

### HNSW efSearch Beam Search (Topic 16)
*   **ID:** `hnsw-efsearch`
*   **Title:** HNSW efSearch Beam Search
*   **Primary Reference:** Malkov & Yashunin (2018)
*   **Prompt:** Implement the greedy graph search on a single layer of an HNSW index, maintaining a candidate queue of size efSearch.
*   **Input Schema:** `graph: Dict[int, List[int]], points: Dict[int, List[float]], query: List[float], entry_point: int, ef: int`
*   **Output Schema:** `List[int]` (top candidates)
*   **Constraints:** Use standard Euclidean distance.
*   **Numerical Tolerances & Tie-Breaking:** Tie break on node ID ascending.
*   **Examples:** Small 10-node graph search.
*   **Edge Cases:** ef > number of nodes in graph.
*   **Reference Implementation:** Maintain a min-heap of candidates and a max-heap of nearest found.
*   **Test Strategy:** Verify against exhaustive search on small random graphs.
*   **Visualizer State:** Graph visualization with visited nodes and current beam highlighted.

### BPE Merge-Rank Encoder (Topic 19)
*   **ID:** `bpe-merge-rank`
*   **Title:** BPE Merge-Rank Encoder
*   **Primary Reference:** Sennrich et al. (2016)
*   **Prompt:** Given a list of tokens and a dictionary of merge rules (pair -> rank), iteratively merge adjacent tokens that have the lowest rank until no more merges are possible.
*   **Input Schema:** `tokens: List[str], merges: Dict[Tuple[str, str], int]`
*   **Output Schema:** `List[str]`
*   **Constraints:** Tie break left-to-right for equal ranks.
*   **Numerical Tolerances & Tie-Breaking:** Lowest rank executes first. Left-most pair first on tie.
*   **Examples:** `['e', 's', 't', 'e', 'r']` with merges `('e','s'): 1, ('e','r'): 2`.
*   **Edge Cases:** Empty token list, 1 token, no valid merges.
*   **Reference Implementation:** Loop finding the best merge pair, apply it, repeat until minimum rank is infinity.
*   **Test Strategy:** Match standard tokenizer behaviors on edge strings.
*   **Visualizer State:** String sequence shrinking step-by-step.

### Im2Col Index Flattening (Topic 20)
*   **ID:** `im2col-flatten`
*   **Title:** Im2Col Index Flattening
*   **Primary Reference:** Standard CNN implementations
*   **Prompt:** Convert an image tensor (C, H, W) into a matrix where each column represents a flattened spatial patch of size (C, K, K) for a given stride S and padding P.
*   **Input Schema:** `image: List[List[List[float]]], K: int, S: int, P: int`
*   **Output Schema:** `List[List[float]]`
*   **Constraints:** O(output matrix size) time.
*   **Numerical Tolerances & Tie-Breaking:** Zero padding.
*   **Examples:** 1x4x4 image with K=3, S=1, P=0 yields a 9x4 matrix.
*   **Edge Cases:** Padding larger than image size, stride larger than image.
*   **Reference Implementation:** Allocate output matrix, nested loops over output spatial dimensions mapping to input indices.
*   **Test Strategy:** Validate shape and trace elements back to input coordinates.
*   **Visualizer State:** Sliding window over 2D grid projecting into columns of a 2D matrix.

### Scaled Dot-Product Attention & KV Cache Append (Topic 22)
*   **ID:** `sdpa-kv-cache`
*   **Title:** Scaled Dot-Product Attention & KV Cache Append
*   **Primary Reference:** Vaswani et al. (2017)
*   **Prompt:** Given a new query vector, append a new key/value to a KV cache, and compute attention over the entire updated cache.
*   **Input Schema:** `q: List[float], k_new: List[float], v_new: List[float], k_cache: List[List[float]], v_cache: List[List[float]]`
*   **Output Schema:** `Tuple[List[float], List[List[float]], List[List[float]]]` (out_vec, updated_k_cache, updated_v_cache)
*   **Constraints:** N/A.
*   **Numerical Tolerances & Tie-Breaking:** Standard absolute tolerance `1e-5`.
*   **Examples:** Caches of size 2 updated to size 3.
*   **Edge Cases:** Empty cache (first token).
*   **Reference Implementation:** Append to caches, compute q @ K.T / sqrt(d), softmax, multiply by V.
*   **Test Strategy:** Assert matching results with PyTorch F.scaled_dot_product_attention.
*   **Visualizer State:** KV cache growing, attention weight distribution over tokens.

### FlashAttention Forward Tile Loop (Topic 23)
*   **ID:** `flash-attention-loop`
*   **Title:** FlashAttention Forward Tile Loop
*   **Primary Reference:** Dao et al. (2022)
*   **Prompt:** Simulate the block-wise attention computation using the online softmax state update.
*   **Input Schema:** `Q_blocks, K_blocks, V_blocks, block_size`
*   **Output Schema:** `O_blocks`
*   **Constraints:** Do not materialize full N x N attention matrix.
*   **Numerical Tolerances & Tie-Breaking:** `1e-4` absolute tolerance.
*   **Examples:** 4x4 matrices with block size 2.
*   **Edge Cases:** N not divisible by block size.
*   **Reference Implementation:** Nested loops maintaining m_i, l_i, O_i states.
*   **Test Strategy:** Compare exact numerical equivalence to standard SDPA.
*   **Visualizer State:** Q block iterating over K/V blocks, updating accumulator.

### Orca Continuous Batching Iteration Scheduler (Topic 24)
*   **ID:** `orca-scheduler`
*   **Title:** Orca Continuous Batching Iteration Scheduler
*   **Primary Reference:** Yu et al. (2022)
*   **Prompt:** Given a queue of waiting requests and a set of currently running requests, decide which requests to schedule for the next forward pass iteration based on a max batch size constraint.
*   **Input Schema:** `waiting: List[Request], running: List[Request], max_batch_size: int`
*   **Output Schema:** `Tuple[List[Request], List[Request]]` (new_running, new_waiting)
*   **Constraints:** Prioritize FCFS from waiting queue.
*   **Numerical Tolerances & Tie-Breaking:** Tie break by Request ID ascending.
*   **Examples:** Capacity 4, 3 running, 2 waiting -> 1 scheduled.
*   **Edge Cases:** Empty queues.
*   **Reference Implementation:** Move up to max_batch_size - len(running) from waiting to running.
*   **Test Strategy:** Simulate step-by-step trace of multi-request timeline.
*   **Visualizer State:** Gantt chart-like view of slots in the active batch.

### PagedAttention Block Table Lookup (Topic 25)
*   **ID:** `paged-attention-lookup`
*   **Title:** PagedAttention Block Table Lookup
*   **Primary Reference:** Kwon et al. (2023)
*   **Prompt:** Translate a logical token index within a sequence to a physical block index and offset using a block table.
*   **Input Schema:** `seq_logical_idx: int, block_table: List[int], block_size: int`
*   **Output Schema:** `Tuple[int, int]` (physical_block_idx, offset)
*   **Constraints:** O(1) time.
*   **Numerical Tolerances & Tie-Breaking:** N/A.
*   **Examples:** `idx=5, table=[10, 42], size=4` -> `block 42, offset 1`.
*   **Edge Cases:** Index exactly at block boundary.
*   **Reference Implementation:** `return block_table[idx // block_size], idx % block_size`
*   **Test Strategy:** Exhaustive map for various block sizes and lengths.
*   **Visualizer State:** Logical contiguous view mapping to scattered physical blocks.

### Ring-AllReduce Scatter-Reduce / All-Gather Step Trace (Topic 27)
*   **ID:** `ring-allreduce-trace`
*   **Title:** Ring-AllReduce Scatter-Reduce / All-Gather Step Trace
*   **Primary Reference:** Patarasuk & Yuan (2009)
*   **Prompt:** Given N nodes each holding an array partitioned into N chunks, simulate one specific step of the scatter-reduce phase.
*   **Input Schema:** `nodes: List[List[float]], step: int`
*   **Output Schema:** `List[List[float]]` (node state after step)
*   **Constraints:** Do not use all-to-all communication.
*   **Numerical Tolerances & Tie-Breaking:** Standard addition.
*   **Examples:** 3 nodes, 3 chunks, step 1.
*   **Edge Cases:** 1 node.
*   **Reference Implementation:** Node i sends chunk `(i - step) % N` to node `(i + 1) % N`.
*   **Test Strategy:** Trace all steps and verify final sum matches naive sum.
*   **Visualizer State:** Ring topology with active message arrows and updated chunk colors.

### DeepSpeed ZeRO-3 Parameter Partitioning Accountant (Topic 28)
*   **ID:** `zero3-accountant`
*   **Title:** DeepSpeed ZeRO-3 Parameter Partitioning Accountant
*   **Primary Reference:** Rajbhandari et al. (2020)
*   **Prompt:** Given a list of parameter sizes and N GPUs, compute exactly which parameter slices reside on which GPU assuming greedy contiguous flattening.
*   **Input Schema:** `param_sizes: List[int], world_size: int`
*   **Output Schema:** `Dict[int, List[Tuple[int, int, int]]]` (gpu_id -> list of (param_id, start_offset, end_offset))
*   **Constraints:** O(P) time where P is number of parameters.
*   **Numerical Tolerances & Tie-Breaking:** N/A.
*   **Examples:** 2 params of size 5, 2 GPUs -> GPU0 gets param0 and half param1.
*   **Edge Cases:** Params smaller than world_size (some GPUs get nothing or 1 element).
*   **Reference Implementation:** Compute total size, target size per GPU, iterate and split boundaries.
*   **Test Strategy:** Verify total elements assigned per param and per GPU constraints.
*   **Visualizer State:** Stacked bar chart of parameters sliced across GPU buckets.

### Megatron 1F1B Pipeline Schedule Bubble Accountant (Topic 29b)
*   **ID:** `1f1b-pipeline-bubble`
*   **Title:** Megatron 1F1B Pipeline Schedule Bubble Accountant
*   **Primary Reference:** Narayanan et al. (2021)
*   **Prompt:** Calculate the total number of bubble (idle) pipeline stages for a given number of pipeline stages p and microbatches m, under the 1F1B schedule.
*   **Input Schema:** `p: int, m: int`
*   **Output Schema:** `int` (number of bubble slots)
*   **Constraints:** O(1) time.
*   **Numerical Tolerances & Tie-Breaking:** N/A.
*   **Examples:** `p=4, m=8`.
*   **Edge Cases:** `m < p`.
*   **Reference Implementation:** Bubble time is `(p - 1)` forward and backward steps.
*   **Test Strategy:** Compare formula result against full simulation trace.
*   **Visualizer State:** 2D grid of stages vs time slots, highlighting idle bubbles.
