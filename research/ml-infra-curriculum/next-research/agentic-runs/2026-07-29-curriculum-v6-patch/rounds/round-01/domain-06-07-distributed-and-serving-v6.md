# Domain 6: Inference Scheduling and Memory (Topics 24-25)

## Topic 24: Priority Queues, Discrete-Event Scheduling & Continuous Batching (Orca)

**Learning Outcome:**
Master iteration-level sequence admission and discrete-event scheduling. Transfer priority queue mechanisms to Orca-style continuous batching, managing token memory constraints and step execution dynamically.

**Prerequisites:** 
- Topic 06 (Topological Ordering)
- Topic 11 (Stable Softmax)

**5-Rung Ladder:**

### 1. Foundation: Basic Priority Queues (Required)
**Title:** Merge k Sorted Lists
**Source:** LeetCode
**URL:** https://leetcode.com/problems/merge-k-sorted-lists/
**Difficulty & Rationale:** Medium. Teaches the core `O(log k)` insertion and minimum extraction operations of a heap, which is the engine of any discrete-event scheduler.
**Transfer Rationale:** Scheduling systems rely on priority queues to determine the next task to execute (e.g., the sequence with the fewest remaining tokens or highest priority).

### 2. Focused Variant: CPU Task Scheduling (Required)
**Title:** Task Scheduler
**Source:** LeetCode
**URL:** https://leetcode.com/problems/task-scheduler/
**Difficulty & Rationale:** Medium. Introduces cooldowns and dynamic re-insertion of tasks into a ready queue, transitioning from static heap processing to continuous loops.
**Transfer Rationale:** Mimics the continuous batching cycle where a sequence is processed for one step and then re-evaluated for readiness.

### 3. ML Bridge: Event-Driven Simulation (Required)
**Title:** Single-Threaded CPU
**Source:** LeetCode
**URL:** https://leetcode.com/problems/single-threaded-cpu/
**Difficulty & Rationale:** Medium. Focuses on discrete-event simulation with an explicit time variable and a waiting queue.
**Transfer Rationale:** Replaces abstract CPU ticks with iterations and batch slots, handling asynchronous sequence arrivals.

### 4. Named Mechanism: Orca Continuous Batching Scheduler (Required)
**Title:** Orca Iteration-Level Sequence Scheduler
**Contract ID:** CONTRACT-TOPIC-24-ORCA
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Requires maintaining multiple states (prefill vs decode) and dynamic memory bounds across active sequences per iteration.
**Transfer Rationale:** Implements the core insight of the Orca paper (OSDI 2022): iteration-level scheduling instead of static sequence batching.

### 5. Stress/Tradeoff: Preemption and Swapping (Optional)
**Title:** Multi-Queue Scheduler with Preemption
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Introduces memory pressure that forces the scheduler to evict running sequences and swap them to CPU memory, restoring them later.

---

### Executable Problem Contract: Orca Iteration-Level Sequence Scheduler

**Contract ID:** CONTRACT-TOPIC-24-ORCA

**Description:**
Implement an iteration-level scheduler that admits sequences based on token memory constraints and processes them one iteration at a time, allowing continuous batching.

**Primary Reference:** 
Yu et al., Orca: A Distributed Serving System for Transformer-Based Generative Models (OSDI 2022)
**Literal URL:** https://www.usenix.org/conference/osdi22/presentation/yu

**Input Types:**
- `requests`: `List[Tuple[int, int, int, int]]` (arrival_iteration, sequence_id, prompt_tokens, max_total_tokens)
- `max_batch_size`: `int`
- `max_total_tokens_limit`: `int`

**Output Type:**
- `List[Tuple[int, int, int]]`: (sequence_id, start_iteration, completion_iteration)

**Constraints:**
- Sequences must be scheduled First-Come-First-Serve (FCFS) when memory permits.
- Active sequences consume tokens incrementally (1 token per decode iteration).
- Total tokens across all active sequences cannot exceed `max_total_tokens_limit`.
- Maximum active sequences cannot exceed `max_batch_size`.
- Prefill vs Decode semantics: Newly admitted sequences are in the prefill phase and consume `prompt_tokens` immediately. In subsequent iterations, they are in the decode phase and consume `+1` token per iteration.

**Python Reference Implementation:**
```python
def orca_scheduler(requests, max_batch_size, max_total_tokens_limit):
    import collections
    requests.sort(key=lambda x: (x[0], x[1])) 
    req_queue = collections.deque(requests)
    
    active = []
    completed = []
    current_iter = 0
    
    while req_queue or active:
        if req_queue and req_queue[0][2] > max_total_tokens_limit:
            raise ValueError("Prompt exceeds total token limit")
            
        # Phase 1: Selective Batching & Admission
        while req_queue and req_queue[0][0] <= current_iter:
            if len(active) < max_batch_size:
                req = req_queue[0]
                prompt_tokens = req[2]
                required_next_tokens = sum(r['tokens'] + 1 for r in active) + prompt_tokens
                if required_next_tokens <= max_total_tokens_limit:
                    req_queue.popleft()
                    active.append({'id': req[1], 'tokens': prompt_tokens, 'max': req[3], 'start': current_iter, 'phase': 'prefill'})
                    continue
            break
            
        # Ensure active sequences growing by +1 token in decode phase are bounded by max_total_tokens
        # If they exceed, we would normally preempt, but here we just bound them.
        next_active_tokens = sum(r['tokens'] + (1 if r['phase'] == 'decode' else 0) for r in active)
        if next_active_tokens > max_total_tokens_limit:
            # Preempt the most recently added to fit within memory
            while next_active_tokens > max_total_tokens_limit and active:
                preempted = active.pop()
                # simplified: we just drop it or put it back, but wait, the prompt just says 
                # "ensure active sequences growing by +1 token in decode phase are bounded by max_total_tokens".
                # To prevent deadlock, we could put it at the front of req_queue
                req_queue.appendleft((preempted['start'], preempted['id'], preempted['tokens'], preempted['max']))
                next_active_tokens = sum(r['tokens'] + (1 if r['phase'] == 'decode' else 0) for r in active)

        # Phase 2: Execution Step
        next_active = []
        for r in active:
            if r['phase'] == 'prefill':
                r['phase'] = 'decode'
            else:
                r['tokens'] += 1
                
            if r['tokens'] >= r['max']:
                completed.append((r['id'], r['start'], current_iter + 1))
            else:
                next_active.append(r)
                
        active = next_active
        current_iter += 1
        
    return sorted(completed)
```

**Worked Examples:**
1. 
Input: `requests = [(0, 1, 2, 4), (0, 2, 2, 3)], max_batch_size = 2, max_total_tokens_limit = 5`
Output: `[(1, 0, 3), (2, 0, 2)]`

2.
Input: `requests = [(0, 1, 2, 4), (1, 2, 2, 3)], max_batch_size = 1, max_total_tokens_limit = 5`
Output: `[(1, 0, 3), (2, 3, 5)]`

---

## Topic 25: Block Allocation, KV-Cache Paging & PagedAttention

**Learning Outcome:**
Master non-contiguous memory management via block tables. Implement logical-to-physical block resolution and block-walk exercises leading to PagedAttention KV-cache gatherings.

**Prerequisites:** 
- Topic 24 (Discrete-Event Scheduling)
- Topic 02 (Tensor Strides)

**5-Rung Ladder:**

### 1. Foundation: Memory Allocator Basics (Required)
**Title:** Design a Memory Allocator
**Source:** LeetCode
**URL:** https://leetcode.com/problems/design-a-memory-allocator/
**Difficulty & Rationale:** Medium. Teaches fundamental contiguous memory allocation and freeing logic.
**Transfer Rationale:** Understanding contiguous fragmentation motivates the need for paged block allocation.

### 2. Focused Variant: Paged Memory and Block Tables (Required)
**Title:** Implement Paged Memory Logical-to-Physical Lookup
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Medium. Manages an array of blocks and a block table to map logical sequence indices to physical blocks.
**Transfer Rationale:** Directly implements the block table architecture used by the vLLM PagedAttention engine.

### 3. ML Bridge: Block-Walk for Non-Contiguous KV Vectors (Required)
**Title:** Block-Walk KV Gather
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Medium. Given a logical sequence, walk its block table to gather scattered key/value tokens into a contiguous tensor for standard attention.
**Transfer Rationale:** Demonstrates how non-contiguous memory is handled prior to custom fused kernels.

### 4. Named Mechanism: PagedAttention Block Table Lookup (Required)
**Title:** PagedAttention Logical-to-Physical KV Block Lookup
**Contract ID:** CONTRACT-TOPIC-25-PAGEDATTENTION
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Performs exact logical to physical addressing within a multi-head, blocked KV cache.
**Transfer Rationale:** Tests the core index resolution of Kwon et al. 2023.

### 5. Stress/Tradeoff: Copy-on-Write (CoW) for Shared Prefixes (Optional)
**Title:** Paged CoW Forking
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Implements reference counting on physical blocks to allow multiple generated sequences (beam search) to share a prompt without duplicating memory until mutation.

---

### Executable Problem Contract: PagedAttention Logical-to-Physical KV Block Lookup

**Contract ID:** CONTRACT-TOPIC-25-PAGEDATTENTION

**Description:**
Implement the mapping of a logical sequence position `pos` to its physical block index and offset in a block-paged KV cache.

**Primary Reference:**
Kwon et al., Efficient Memory Management for Large Language Model Serving with PagedAttention (SOSP 2023)
**Literal URL:** https://arxiv.org/abs/2309.06180

**Input Types:**
- `block_table`: `List[int]` (mapping of logical block index to physical block index)
- `block_size`: `int`
- `logical_pos`: `int`

**Output Type:**
- `Tuple[int, int]`: (physical_block_index, offset_within_block)
- Raise `IndexError` if `logical_pos` exceeds the mapped capacity.

**Constraints:**
- `block_size > 0`
- `logical_pos >= 0`

**Python Reference Implementation:**
```python
def paged_attention_lookup(block_table, block_size, logical_pos):
    logical_block_idx = logical_pos // block_size
    offset = logical_pos % block_size
    
    if logical_block_idx >= len(block_table):
        raise IndexError("Position out of sequence bounds")
        
    physical_block = block_table[logical_block_idx]
    return (physical_block, offset)
```

**Worked Examples:**
1.
Input: `block_table = [7, 2, 9], block_size = 16, logical_pos = 35`
Output: `(9, 3)`
*(35 // 16 = 2, block_table[2] = 9, 35 % 16 = 3)*

2.
Input: `block_table = [4], block_size = 8, logical_pos = 10`
Output: `IndexError`

---
# Domain 7: Distributed Execution and Compiler Planning (Topics 26-29b)


---

### Executable Problem Contract: Block-Walk KV Gather & Copy-on-Write

**Contract ID:** CONTRACT-TOPIC-25-BLOCK-WALK-COW

**Description:**
Implement block-walk KV gather for a logical sequence and copy-on-write fork logic for shared prefixes.

**Python Reference Implementation:**
```python
def block_walk_kv_gather(block_table, block_size, sequence_length, physical_cache):
    gathered = []
    for logical_pos in range(sequence_length):
        logical_block = logical_pos // block_size
        offset = logical_pos % block_size
        physical_block = block_table[logical_block]
        gathered.append(physical_cache[physical_block][offset])
    return gathered

def copy_on_write_fork(block_table, ref_counts):
    new_table = list(block_table)
    for physical_block in new_table:
        ref_counts[physical_block] += 1
    return new_table, ref_counts
```

## Topic 26: Weighted Graphs, Interconnect Topology & Network Communication Cost

**Learning Outcome:**
Master latency-plus-transfer interconnect cost modeling using weighted shortest paths to evaluate topology mappings.

**Prerequisites:** 
- Topic 06 (Topological Ordering)

**5-Rung Ladder:**

### 1. Foundation: Weighted Shortest Path (Required)
**Title:** Network Delay Time
**Source:** LeetCode
**URL:** https://leetcode.com/problems/network-delay-time/
**Difficulty & Rationale:** Medium. Core Dijkstra's algorithm for minimum delay in a weighted graph.
**Transfer Rationale:** Network delay is the fundamental primitive for calculating communication overhead.

### 2. Focused Variant: Bottleneck Bandwidth (Required)
**Title:** Path With Maximum Minimum Value
**Source:** LeetCode
**URL:** https://leetcode.com/problems/path-with-maximum-minimum-value/
**Difficulty & Rationale:** Medium. Finding the path with the largest bottleneck capacity.
**Transfer Rationale:** Models the throughput constraint of physical interconnects (PCIe, NVLink).

### 3. ML Bridge: Alpha-Beta Cost Model (Required)
**Title:** Latency + Transfer Cost Calculator
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Medium. Compute the cost of sending `S` bytes over a path: `Cost = \sum (alpha) + S / min(bandwidth)`.
**Transfer Rationale:** Models the realistic `alpha-beta` performance model used in distributed systems (latency + bandwidth limit).

### 4. Named Mechanism: PCIe / NVLink Topology Mapping (Required)
**Title:** Optimal GPU Pairwise Mapping
**Contract ID:** CONTRACT-TOPIC-26-NETWORK-PATH
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Given an algorithm's communication matrix and a hardware topology graph, map algorithmic ranks to physical nodes to minimize max communication cost.
**Transfer Rationale:** Reflects how DeepSpeed and Megatron place ranks on physical GPUs.

### 5. Stress/Tradeoff: Multi-Rail Networking (Optional)
**Title:** Multi-path Flow Scheduling
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Splitting a tensor transfer across multiple disjoint paths to maximize throughput.

---


---

### Executable Problem Contract: Topology Path Cost

**Contract ID:** CONTRACT-TOPIC-26-NETWORK-PATH

**Description:**
Calculate the communication cost of transferring S bytes over a weighted graph topology using alpha-beta modeling.

**Python Reference Implementation:**
```python
def topology_path_cost(path, alpha_latencies, bandwidth_limits, message_size_bytes):
    # path is a list of node indices
    # alpha_latencies[(u, v)] is the latency of edge u->v
    # bandwidth_limits[(u, v)] is the bandwidth of edge u->v
    
    total_latency = 0.0
    min_bandwidth = float('inf')
    
    for i in range(len(path) - 1):
        u, v = path[i], path[i+1]
        total_latency += alpha_latencies[(u, v)]
        min_bandwidth = min(min_bandwidth, bandwidth_limits[(u, v)])
        
    if min_bandwidth == 0:
        return float('inf')
        
    return total_latency + (message_size_bytes / min_bandwidth)
```

## Topic 27: Circular Buffers, Modular Indexing & Ring Collectives (NCCL)

**Learning Outcome:**
Master step-by-step traces of NCCL Ring-AllReduce collectives, understanding Scatter-Reduce and All-Gather chunk permutations.

**Prerequisites:** 
- Topic 26 (Network Topology)
- Topic 04 (Stable Reductions)

**5-Rung Ladder:**

### 1. Foundation: Circular Queue (Required)
**Title:** Design Circular Queue
**Source:** LeetCode
**URL:** https://leetcode.com/problems/design-circular-queue/
**Difficulty & Rationale:** Medium. Validates modulo arithmetic, head/tail pointers, and capacity state.
**Transfer Rationale:** Exact head/tail and modular-index state required by a ring trace.

### 2. Focused Variant: Pipelined Ring Traversal (Required)
**Title:** Token Ring Message Passing
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Medium. Trace the state of message chunks as they traverse a ring of `P` nodes over `T` steps.
**Transfer Rationale:** Teaches step-wise tracking of data across distributed buffers.

### 3. ML Bridge: Ring Reduce-Scatter (Required)
**Title:** Ring Reduce-Scatter Trace
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Perform exactly `P-1` steps where chunks are shifted and reduced.
**Transfer Rationale:** Half of the AllReduce operation.

### 4. Named Mechanism: NCCL Ring-AllReduce Trace (Required)
**Title:** Ring-AllReduce Trace
**Contract ID:** CONTRACT-TOPIC-27-RING-ALLREDUCE
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Implements the full `P-1` Scatter-Reduce followed by `P-1` All-Gather step sequence.
**Transfer Rationale:** Models one of several NCCL algorithms. Algorithm choice (Ring, Tree, etc) depends on hardware topology and is an area for comparison.

### 5. Stress/Tradeoff: Tree vs Ring Collectives (Optional)
**Title:** Double-Binary Tree AllReduce
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Tracing reductions on a tree topology, comparing latency and bandwidth vs the ring.

---

### Executable Problem Contract: NCCL Ring-AllReduce Trace

**Contract ID:** CONTRACT-TOPIC-27-RING-ALLREDUCE

**Description:**
Trace the state of memory buffers across `P` nodes during a standard Ring-AllReduce operation consisting of a Scatter-Reduce phase and an All-Gather phase.

**Primary Reference:**
NVIDIA NCCL Documentation (Ring Algorithms)
**Literal URL:** https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/operations.html#allreduce

**Input Types:**
- `P`: `int` (number of nodes, `P > 1`)
- `initial_state`: `List[List[int]]` (Initial values: `initial_state[n][c]` is the scalar value of chunk `c` on node `n`. Shape is `P x P`.)

**Output Type:**
- `List[List[List[int]]]`: The exact buffer state of all nodes after *every* step. 
  - Length of output should be `2*(P-1)`. 
  - Output[step][n][c] contains the computed sum for that chunk at that step.

**Constraints:**
- `P <= 16`
- Values are exact integers.
- Node `n` sends to `(n+1)%P` and receives from `(n-1)%P`.
- Step 1 to `P-1`: Scatter-Reduce (chunks are summed).
- Step `P` to `2P-2`: All-Gather (chunks are copied/overwritten).

**Python Reference Implementation:**
```python
def ring_allreduce_trace(P, initial_state):
    import copy
    state = copy.deepcopy(initial_state)
    trace = []
    
    # Phase 1: Scatter-Reduce (P-1 steps)
    for step in range(P - 1):
        next_state = copy.deepcopy(state)
        for n in range(P):
            send_to = (n + 1) % P
            chunk_idx = (n - step) % P
            # n sends chunk_idx to send_to, who adds it to their own chunk
            next_state[send_to][chunk_idx] += state[n][chunk_idx]
        state = next_state
        trace.append(copy.deepcopy(state))
        
    # Phase 2: All-Gather (P-1 steps)
    for step in range(P - 1):
        next_state = copy.deepcopy(state)
        for n in range(P):
            send_to = (n + 1) % P
            chunk_idx = (n + 1 - step) % P
            # n sends the completed chunk_idx to send_to, overwriting
            next_state[send_to][chunk_idx] = state[n][chunk_idx]
        state = next_state
        trace.append(copy.deepcopy(state))
        
    return trace
```

**Worked Examples:**
1.
Input: `P = 2`, `initial_state = [[1, 2], [3, 4]]`
Output: 
Step 1 (Scatter-Reduce): `[[1, 6], [4, 4]]`  (Node 0 sends chunk 0 to Node 1. Node 1 sends chunk 1 to Node 0.)
Step 2 (All-Gather): `[[4, 6], [4, 6]]`      (Node 0 sends completed chunk 1 to Node 1. Node 1 sends completed chunk 0 to Node 0.)

---

## Topic 28: Distributed Training State, Sharding & DeepSpeed ZeRO-1/2/3

**Learning Outcome:**
Master the arithmetic of state partitioning across data parallel ranks. Calculate exact padding, alignment, and assignment of parameters, gradients, and optimizer states.

**Prerequisites:** 
- Topic 13 (Optimizers)
- Topic 27 (Ring Collectives)

**5-Rung Ladder:**

### 1. Foundation: Array Partitioning (Required)
**Title:** Split Linked List in Parts
**Source:** LeetCode
**URL:** https://leetcode.com/problems/split-linked-list-in-parts/
**Difficulty & Rationale:** Medium. Core logic of dividing elements evenly into contiguous parts whose sizes differ by at most one.
**Transfer Rationale:** Sharding requires mapping 1D flattened contiguous tensors across N devices.

### 2. Focused Variant: Contiguous Block Assignment (Required)
**Title:** Contiguous Fair Sharding
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Medium. Given a list of variable-length arrays, flatten them and divide the flat array into `P` equal contiguous chunks (padding if necessary).
**Transfer Rationale:** Parameters are flattened before being divided among GPUs.

### 3. ML Bridge: Optimizer State Arithmetic (Required)
**Title:** Mixed-Precision Memory Accountant
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Medium. Calculate the exact byte size of weights, gradients, and Adam state for a given model architecture.
**Transfer Rationale:** Required to understand *why* ZeRO is needed.

### 4. Named Mechanism: Simplified Contiguous Parameter Sharding (Required)
**Title:** Simplified Contiguous Parameter Sharding
**Contract ID:** CONTRACT-TOPIC-28-ZERO3-CONTIGUOUS
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Compute inclusive/exclusive offsets using a generic simplified contiguous sharding strategy across ranks.
**Transfer Rationale:** Teaches generic contiguous sharding principles to distribute models gracefully across devices.

### 5. Stress/Tradeoff: ZeRO-Offload (Optional)
**Title:** CPU Offload Bandwidth Modeler
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Calculate training iteration time given PCIe bandwidth limits when swapping optimizer states to CPU RAM.

---

### Executable Problem Contract: Simplified Contiguous Parameter Sharding

**Contract ID:** CONTRACT-TOPIC-28-ZERO3-CONTIGUOUS

**Description:**
Given a list of parameter sizes and `P` data-parallel ranks, flatten the parameters, pad the total size to be divisible by `P`, and determine the exact start/end elements assigned to a specific rank `R` using a simplified contiguous strategy.

**Primary Reference:**
DeepSpeed ZeRO-3 Documentation
**Literal URL:** https://deepspeed.readthedocs.io/en/stable/zero3.html

**Input Types:**
- `param_sizes`: `List[int]` (e.g. number of elements per parameter tensor)
- `P`: `int` (number of ranks)
- `R`: `int` (target rank to query, `0 <= R < P`)

**Output Type:**
- `Tuple[int, int]`: (inclusive_start_index, exclusive_end_index) in the flattened padded array.
- `Dict[int, Tuple[int, int]]`: Mapping of parameter indices (0-based) that have at least one element residing on rank `R`, to their `(start_offset_in_rank, end_offset_in_rank)` relative to Rank `R`'s partition.

**Constraints:**
- `P > 0`
- Elements are padded with 0s at the end of the flattened array to ensure `sum(param_sizes) + padding` is a multiple of `P`.

**Python Reference Implementation:**
```python
def simplified_contiguous_partition(param_sizes, P, R):
    total_elements = sum(param_sizes)
    remainder = total_elements % P
    padding = (P - remainder) if remainder != 0 else 0
    padded_total = total_elements + padding
    
    partition_size = padded_total // P
    rank_start = R * partition_size
    rank_end = rank_start + partition_size
    
    owned_params = {}
    current_offset = 0
    
    for i, size in enumerate(param_sizes):
        param_start = current_offset
        param_end = current_offset + size
        
        # Check intersection
        overlap_start = max(rank_start, param_start)
        overlap_end = min(rank_end, param_end)
        
        if overlap_start < overlap_end:
            # Map to rank-local offsets
            local_start = overlap_start - rank_start
            local_end = overlap_end - rank_start
            owned_params[i] = (local_start, local_end)
            
        current_offset += size
        
    return (rank_start, rank_end), owned_params
```

**Worked Examples:**
1.
Input: `param_sizes = [5, 5]`, `P = 2`, `R = 0`
Output: `(0, 5), {0: (0, 5)}`
*(Total 10, partition size 5. Rank 0 gets indices 0..5. Parameter 0 is fully on Rank 0.)*

2.
Input: `param_sizes = [7, 2]`, `P = 2`, `R = 1`
Output: `(5, 10), {0: (0, 2), 1: (2, 4)}`
*(Total 9, padded to 10. Partition size 5. Rank 1 gets flat indices 5..10. Param 0 spans 0..7, so flat indices 5..7 are on Rank 1 locally at 0..2. Param 1 spans 7..9, which is locally 2..4. Flat index 9 is padding.)*

---

## Topic 29a: Graph Compiler Transforms, CSE, Fusion & Memory Allocation Planning

**Learning Outcome:**
Master computational graph intermediate representations, topological dataflow analysis, and static memory allocation algorithms (e.g. interval coloring) prior to execution.

**Prerequisites:** 
- Topic 08 (Expression Parsing & AST)
- Topic 07 (Liveness on DAGs)

**5-Rung Ladder:**

### 1. Foundation: Interval Intersections (Required)
**Title:** Merge Intervals
**Source:** LeetCode
**URL:** https://leetcode.com/problems/merge-intervals/
**Difficulty & Rationale:** Medium. Base knowledge for memory lifetime analysis.
**Transfer Rationale:** Tensor memory lifetimes are intervals `[creation_step, last_use_step]`.

### 2. Focused Variant: Register Allocation / Graph Coloring (Required)
**Title:** Meeting Rooms II (Interval Coloring)
**Source:** LeetCode
**URL:** https://leetcode.com/problems/meeting-rooms-ii/
**Difficulty & Rationale:** Medium. Finding the peak number of overlapping intervals.
**Transfer Rationale:** Determines the peak memory allocation required during graph execution.

### 3. ML Bridge: Common Subexpression Elimination (CSE) (Required)
**Title:** Identify Duplicate Subtrees
**Source:** LeetCode
**URL:** https://leetcode.com/problems/find-duplicate-subtrees/
**Difficulty & Rationale:** Medium. Hashing subtrees to find redundancy.
**Transfer Rationale:** The most basic compiler optimization to reduce computation in an operator DAG.

### 4. Named Mechanism: Static Memory Arena Planner (Required)
**Title:** Tensor Arena Memory Planner
**Contract ID:** CONTRACT-TOPIC-29A-IR-FUSION
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Given a topologically sorted list of operations, tensor sizes, and their lifetimes, allocate them into a linear memory arena minimizing total size using a greedy offset allocator.
**Transfer Rationale:** Models the XLA / TVM static memory planner for neural networks.

### 5. Stress/Tradeoff: Operator Fusion (Optional)
**Title:** DAG Node Fusion for Memory Bandwidth
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Merging element-wise DAG nodes to reduce intermediate tensor materialization (horizontal and vertical fusion).

---


---

### Executable Problem Contract: Operator CSE & Buffer Liveness Planning

**Contract ID:** CONTRACT-TOPIC-29A-IR-FUSION

**Description:**
Identify common subexpressions in an execution DAG and calculate memory buffer lifetimes for static planning.

**Python Reference Implementation:**
```python
def cse_and_liveness_planner(execution_dag):
    # execution_dag: list of tuples (op_id, op_type, input_ids, output_size)
    # Returns deduplicated operations and their memory lifetimes [start_op_idx, end_op_idx]
    
    expr_map = {}
    dedup_ops = []
    id_mapping = {}
    
    # Pass 1: CSE
    for op_id, op_type, input_ids, out_size in execution_dag:
        mapped_inputs = tuple(id_mapping.get(i, i) for i in input_ids)
        expr_key = (op_type, mapped_inputs)
        
        if expr_key in expr_map:
            id_mapping[op_id] = expr_map[expr_key]
        else:
            expr_map[expr_key] = op_id
            dedup_ops.append((op_id, op_type, mapped_inputs, out_size))
            id_mapping[op_id] = op_id
            
    # Pass 2: Liveness
    lifetimes = {}
    for idx, (op_id, _, inputs, _) in enumerate(dedup_ops):
        if op_id not in lifetimes:
            lifetimes[op_id] = [idx, idx]
        for inp in inputs:
            if inp in lifetimes:
                lifetimes[inp][1] = max(lifetimes[inp][1], idx)
                
    return dedup_ops, lifetimes
```

## Topic 29b: Tensor, Pipeline (1F1B Schedule) & Expert Parallelism (MoE Routing)

**Learning Outcome:**
Master 3D parallelism scheduling and routing logic. Trace the 1F1B (One-Forward-One-Backward) pipeline schedule and calculate exact micro-batch bubble overheads.

**Prerequisites:** 
- Topic 29a (Graph Compiler Passes)
- Topic 26 (Network Topology)

**5-Rung Ladder:**

### 1. Foundation: Load Balancing (Optional)
**Title:** Fair Distribution of Cookies
**Source:** LeetCode
**URL:** https://leetcode.com/problems/fair-distribution-of-cookies/
**Difficulty & Rationale:** Medium (Optional). Backtracking or greedy assignment of workloads.
**Transfer Rationale:** Foundational concept for MoE expert routing and pipeline stage balancing.

### 2. Focused Variant: Sequence Scheduling (Required)
**Title:** Pipeline Execution Trace
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Medium. Trace execution of a sequence of dependent tasks across linear stages with a delay.
**Transfer Rationale:** Demonstrates pipeline fill and drain phases.

### 3. ML Bridge: MoE Token Routing (Required)
**Title:** Sparse Mixture-of-Experts Router
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Medium. Given token affinities and expert capacities, route tokens to top-K experts and handle dropped tokens.
**Transfer Rationale:** Implements the core forward pass of MoE routing (e.g. Switch Transformer / Mixtral).

### 4. Named Mechanism: Megatron 1F1B Pipeline Schedule (Required)
**Title:** 1F1B Pipeline Bubble Accountant
**Contract ID:** CONTRACT-TOPIC-29B-1F1B
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Calculate the schedule and bubble ratio of a non-interleaved 1F1B schedule.
**Transfer Rationale:** Models the definitive NVIDIA Megatron pipeline parallel schedule.

### 5. Stress/Tradeoff: Interleaved 1F1B Schedule (Optional)
**Title:** Interleaved 1F1B Pipeline Trace
**Source:** Custom
**URL:** N/A
**Difficulty & Rationale:** Hard. Extending 1F1B by assigning multiple disjoint model chunks to the same device to reduce the bubble size further.

---

### Executable Problem Contract: 1F1B Pipeline Bubble Accountant

**Contract ID:** CONTRACT-TOPIC-29B-1F1B

**Description:**
Calculate the bubble (idle) time fraction of a standard (non-interleaved) One-Forward-One-Backward (1F1B) pipeline parallel schedule.

**Primary Reference:**
NVIDIA Megatron-LM Pipeline Parallelism
**Literal URL:** https://developer.nvidia.com/blog/scaling-language-model-training-to-a-trillion-parameters-using-megatron/

**Input Types:**
- `P`: `int` (Number of pipeline stages/devices)
- `M`: `int` (Number of micro-batches)
- `t_f`: `float` (Time taken for one micro-batch forward pass)
- `t_b`: `float` (Time taken for one micro-batch backward pass)

**Output Type:**
- `Tuple[float, float, float]`: (total_ideal_time, total_bubble_time, bubble_fraction)
  - `total_ideal_time`: Time if devices were 100% utilized (`M * (t_f + t_b)`)
  - `total_bubble_time`: The total idle time injected by the pipeline warmup and cooldown (`(P - 1) * (t_f + t_b)`)
  - `bubble_fraction`: The ratio of bubble time to total time $F = \frac{P - 1}{M + P - 1}$.

**Constraints:**
- `P > 0`
- `M > 0`
- Assume homogenous stages and symmetric communication hidden by compute.

**Python Reference Implementation:**
```python
def pipeline_1f1b_bubble(P, M, t_f, t_b):
    ideal_time = M * (t_f + t_b)
    bubble_time = (P - 1) * (t_f + t_b)
    total_time = ideal_time + bubble_time
    
    # Bubble fraction over total schedule time = (P - 1) / (M + P - 1)
    bubble_fraction = (P - 1) / (M + P - 1)
    
    return float(ideal_time), float(bubble_time), float(bubble_fraction)
```

**Worked Examples:**
1.
Input: `P = 4, M = 8, t_f = 1.0, t_b = 2.0`
Output: `(24.0, 9.0, 0.2727272727272727)`
*(Ideal time = 8 * 3.0 = 24.0. Bubble time = 3 * 3.0 = 9.0. Total time = 33.0. Fraction = 9 / 33 = 3 / 11 ~ 0.2727)*

2.
Input: `P = 8, M = 4, t_f = 0.5, t_b = 1.0`
Output: `(6.0, 10.5, 0.6363636363636364)`
*(Ideal = 4 * 1.5 = 6.0. Bubble = 7 * 1.5 = 10.5. Total = 16.5. Fraction = 10.5 / 16.5 = 7/11 ≈ 0.63636. Note: M < P is highly inefficient, resulting in high bubble ratio relative to total)*

---

### Executable Problem Contract: Capacity-Constrained MoE Token Routing

**Contract ID:** CONTRACT-TOPIC-29B-MOE-ROUTER

**Description:**
Route tokens to top-K experts based on affinities, enforcing expert capacity limits and tracking dropped tokens.

**Python Reference Implementation:**
```python
def moe_token_routing(token_affinities, top_k, expert_capacity):
    # token_affinities: List[List[float]] - shape (num_tokens, num_experts)
    # Returns: List[List[int]] (expert assignments per token), and int (dropped token count)
    
    num_tokens = len(token_affinities)
    num_experts = len(token_affinities[0])
    
    expert_loads = [0] * num_experts
    assignments = [[] for _ in range(num_tokens)]
    dropped_tokens = 0
    
    for token_id in range(num_tokens):
        # Sort experts by affinity descending
        scores = token_affinities[token_id]
        ranked_experts = sorted(range(num_experts), key=lambda i: scores[i], reverse=True)
        
        assigned = 0
        for exp_id in ranked_experts:
            if assigned == top_k:
                break
            if expert_loads[exp_id] < expert_capacity:
                expert_loads[exp_id] += 1
                assignments[token_id].append(exp_id)
                assigned += 1
                
        if assigned < top_k:
            # Token is partially or fully dropped if it can't find top_k experts with capacity
            dropped_tokens += 1
            
    return assignments, dropped_tokens
```
