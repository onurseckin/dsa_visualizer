# Domain 10: Distributed Training, Parallelism & Compiler Planning

## Topic 37: Interconnect Topologies & Network Path Cost ($\alpha$-$\beta$ Model)
### 1. Learning Outcome
Model inter-GPU network latency and bandwidth costs using the classical $\alpha$-$\beta$ Hockney communication model across PCIe, NVLink, and InfiniBand cluster topologies.

### 2. Prerequisites & Dependencies
- Graph representation and shortest paths
- Linear cost modeling

### 3. Decision Rationales & Alignments
**Decision Rationale:** Distributed training scaling efficiency is governed by communication overhead. Modeling transfer times ($T = \alpha + S / \beta$) determines optimal parallelism strategy (TP vs PP vs DP).
**Academic Course Alignment:** Stanford CS336 - Distributed training and network topology; CMU 10-714 - Distributed communication.
**Industry SOTA Alignment:** NVIDIA NVLink 4.0/5.0, Mellanox InfiniBand, Google Cloud TPU Torus networks, AWS EFA.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [Network Delay Time](https://leetcode.com/problems/network-delay-time/) - Dijkstra graph path latency calculation sets the intuitive base for network propagation.
- **Rung 2 (Mechanics)**: [Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/) - Constrained multi-hop transfer path costs build the model for routing through complex switch layers.
- **Rung 3 (ML Bridge)**: [Analytical Modeling of GPU Interconnects](https://en.wikipedia.org/wiki/Network_topology) - Introducing latency ($\alpha$) and bandwidth ($\beta$) as independent communication bottlenecks.
- **Rung 4 (Pure Python Contract)**: Alpha-Beta Network Path Cost Calculator (Contract ID: `CONTRACT-TOPIC-37-NETWORK-ALPHA-BETA`) - Students calculate the exact expected transfer times to understand when bandwidth dominates vs when latency dominates.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We explore bandwidth saturation and packet contention on multi-tier fat-tree switches (Clos networks), contrasting PCIe intra-node vs InfiniBand inter-node constraints.

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-37-NETWORK-ALPHA-BETA`
**Title**: Interconnect Alpha-Beta Transfer Cost Model
**Primary Reference URL**: https://en.wikipedia.org/wiki/LogP_machine
**Prompt**: Given payload message size $S$ (in bytes), link latency $\alpha$ (in seconds), link bandwidth $\beta$ (in bytes/sec), and number of transfer hops $H$, compute the total communication transfer time $T = H \cdot \alpha + S / \beta$.
**Input Schema**: `size_bytes: int, alpha: float, beta: float, hops: int`
**Output Schema**: `transfer_time: float`
**Constraints**: `size_bytes >= 0`, `alpha >= 0`, `beta > 0`, `hops >= 1`.
**Tolerances**: Absolute error < 1e-9.
**Worked Examples**:
- Input: `size_bytes=10^6, alpha=1e-6, beta=1e9, hops=2` => Output: $2 \times 10^{-6} + 10^6 / 10^9 = 0.001002$ seconds.
**Canonical Python Code**:
```python
def alpha_beta_transfer_time(msg_bytes: int, alpha: float, beta: float, hops: int = 1) -> float:
    size_bytes = msg_bytes
    return hops * alpha + (size_bytes / beta)
```
**Test Strategy**: Validate with zero-byte ping latency and high-volume tensor transfers across NVLink vs Ethernet parameters.
**Visualizer State Schema**: `{ payload_size_bytes: int, network_hops: int, latency_component: float, bandwidth_component: float, total_time: float }`

---


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [Network Delay Time](https://leetcode.com/problems/network-delay-time/) - Shortest paths.
2. [Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/) - Hop-constrained costs.
3. Implement a topology-aware distance matrix calculator for a 3D Torus interconnect.
4. Simulate packet routing latency over a two-tier Fat-Tree switch hierarchy.

**Part B: Mathematical Proofs & Analytical Derivations**
1. Hockney Model: Prove the crossover point where bandwidth $\beta$ dominates latency $\alpha$ for message size $S$.
2. Derive the total communication time for a Tree-AllReduce broadcast on a balanced binary tree of $P$ nodes.
3. Compute the bisection bandwidth of a non-blocking Clos network topology connecting 1024 GPUs.

**Part C: Real-World ML Systems & Engineering Questions**
1. InfiniBand vs Ethernet: Contrast the latency overhead of RoCE (RDMA over Converged Ethernet) vs native InfiniBand for 100GB/s ML workloads.
2. How does NVLink 4.0's 900 GB/s bandwidth alter the optimal parallelization strategy (TP inside node, DP/PP across nodes)?
3. Discuss the impact of network jitter and packet loss on synchronous training steps at cluster scales > 10,000 GPUs.

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. Straggler Effects: Stress test a synchronous AllReduce where one node experiences a $100\mu s$ latency spike.
2. Link Saturation: Deadlocks and tail latency explosion when network topology is oversubscribed (e.g., 3:1 blocking ratio).
3. Asymmetric routing paths causing out-of-order packet delivery overheads.


## Topic 38: Collective Communication Primitives (Ring-AllReduce, Tree-AllReduce)
### 1. Learning Outcome
Understand and trace collective communication algorithms: Ring-AllReduce (Scatter-Reduce + All-Gather), Tree-AllReduce, and All-to-All communication schedules used in NCCL.

### 2. Prerequisites & Dependencies
- Interconnect Cost Modeling (Topic 37)
- Distributed Training Foundations

### 3. Decision Rationales & Alignments
**Decision Rationale:** Ring-AllReduce allows $P$ GPUs to reduce and share gradients in $2(P-1)$ communication steps independent of cluster size, providing optimal bandwidth utilization.
**Academic Course Alignment:** Stanford CS336 - Data parallelism and collectives; CMU 10-714 - System optimization.
**Industry SOTA Alignment:** NVIDIA NCCL Ring-AllReduce and Tree-AllReduce, PyTorch DistributedDataParallel (DDP), MPI Collectives.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [Circular Array Loop](https://leetcode.com/problems/circular-array-loop/) - Ring index math $(r + 1) \pmod P$ prepares students for logical ring topologies.
- **Rung 2 (Mechanics)**: [Rotating the Box](https://leetcode.com/problems/rotating-the-box/) - Synchronized parallel state shifts model the simultaneous step-wise data transfers across workers.
- **Rung 3 (ML Bridge)**: [NCCL Collective Operations Guide](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html) - Formalizing Scatter-Reduce and All-Gather phases in a distributed collective.
- **Rung 4 (Pure Python Contract)**: Ring-AllReduce Trace Simulation (Contract ID: `CONTRACT-TOPIC-38-RING-ALLREDUCE`) - Students simulate the exact chunk passing between ranks, witnessing how all ranks achieve identical sums without a central bottleneck.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We contrast ring latency overhead for small payload sizes against recursive-doubling trees, explaining why NCCL switches algorithms dynamically based on message size.

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-38-RING-ALLREDUCE`
**Title**: Ring-AllReduce Simulation
**Primary Reference URL**: https://docs.nvidia.com/deeplearning/nccl/
**Prompt**: Simulate the complete Ring-AllReduce algorithm on $P$ worker ranks, each starting with an array of $P$ numbers. Perform $P-1$ steps of Scatter-Reduce followed by $P-1$ steps of All-Gather along a logical ring. Return the synchronized array on each rank (where each element contains the exact sum across all ranks).
**Input Schema**: `ranks_data: list[list[float]]` (shape $P \times P$)
**Output Schema**: `synchronized_data: list[list[float]]` (shape $P \times P$)
**Constraints**: Number of ranks $P \ge 2$. Array size on each rank equals $P$.
**Tolerances**: Absolute error < 1e-5.
**Worked Examples**:
- Input: `[[1.0, 2.0], [3.0, 4.0]]` (Rank 0: [1, 2], Rank 1: [3, 4])
- Output: `[[4.0, 6.0], [4.0, 6.0]]` on all ranks.
**Canonical Python Code**:
```python
def ring_allreduce_simulation(node_buffers: list[list[float]]) -> list[list[list[float]]]:
    initial_state = node_buffers
    P = len(node_buffers)
    import copy
    state = copy.deepcopy(initial_state)
    trace = []
    
    # Phase 1: Scatter-Reduce (P-1 steps)
    for step in range(P - 1):
        next_state = copy.deepcopy(state)
        for n in range(P):
            send_to = (n + 1) % P
            chunk_idx = (n - step) % P
            next_state[send_to][chunk_idx] += state[n][chunk_idx]
        state = next_state
        trace.append(copy.deepcopy(state))
        
    # Phase 2: All-Gather (P-1 steps)
    for step in range(P - 1):
        next_state = copy.deepcopy(state)
        for n in range(P):
            send_to = (n + 1) % P
            chunk_idx = (n + 1 - step) % P
            next_state[send_to][chunk_idx] = state[n][chunk_idx]
        state = next_state
        trace.append(copy.deepcopy(state))
        
    return trace
```
**Test Strategy**: Validate across 2, 4, and 8 ranks. Assert that all ranks end with identical sums matching global vector reduction.
**Visualizer State Schema**: `{ rank_ring_layout: list, active_transfers: list, chunk_reduction_status: int[][] }`

---


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [Circular Array Loop](https://leetcode.com/problems/circular-array-loop/) - Ring topology indices.
2. [Rotating the Box](https://leetcode.com/problems/rotating-the-box/) - State shifts.
3. Simulate a Scatter-Reduce step on 4 nodes with manual chunk assignments.
4. Implement an All-Gather algorithm using a recursive doubling communication pattern.

**Part B: Mathematical Proofs & Analytical Derivations**
1. Ring-AllReduce Bandwidth: Prove that the data transferred per node in Ring-AllReduce is $2 \frac{P-1}{P} S$, approaching $2S$ as $P \to \infty$.
2. Tree vs Ring: Derive the mathematical threshold of message size $S$ where Tree-AllReduce (lower latency) outperforms Ring-AllReduce (higher bandwidth).
3. Show why a naive central parameter server model bottlenecks at $O(P \cdot S)$ bandwidth for the master node.

**Part C: Real-World ML Systems & Engineering Questions**
1. NCCL Collectives: Explain how NCCL dynamically segments giant gradient tensors to pipeline transfers through the ring.
2. Describe how PyTorch DDP overlaps gradient computation with Ring-AllReduce communication via backward hooks.
3. What is the role of InfiniBand SHARP (Scalable Hierarchical Aggregation and Reduction Protocol) in offloading collectives to switch hardware?

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. Precision Loss: How does the order of summation in Ring-AllReduce affect final float parity across different nodes?
2. Node Failures: Simulating ring collapse and timeout when rank 5 crashes midway through the scatter-reduce phase.
3. Network contention causing uneven chunk arrival times and idle blocking.


## Topic 39: Distributed Parameter Sharding (ZeRO-1, ZeRO-2, ZeRO-3 / FSDP)
### 1. Learning Outcome
Understand memory footprints in large-scale model training (model weights, gradients, optimizer states) and implement ZeRO-3 parameter sharding, AllGather prefetch, and ReduceScatter sharded gradients.

### 2. Prerequisites & Dependencies
- Adaptive Optimizers & State (Topic 07)
- Ring Collective Communication (Topic 38)

### 3. Decision Rationales & Alignments
**Decision Rationale:** ZeRO-3 / Fully Sharded Data Parallel (FSDP) eliminates memory redundancy across data-parallel ranks, enabling training models larger than single-GPU memory without model parallelism.
**Academic Course Alignment:** Stanford CS336 - Advanced scaling; UC Berkeley CS294 / SkyLab - Memory optimization.
**Industry SOTA Alignment:** Microsoft DeepSpeed ZeRO-3, PyTorch FSDP (Fully Sharded Data Parallel), Google Pax.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [Partition Labels](https://leetcode.com/problems/partition-labels/) - Splitting continuous arrays into disjoint partitions introduces non-overlapping ownership.
- **Rung 2 (Mechanics)**: [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/) - Balanced capacity sharding across workers ensures even memory loads.
- **Rung 3 (ML Bridge)**: [ZeRO: Memory Optimizations Toward Training Trillion Parameter Models](https://arxiv.org/abs/1910.02054) (Rajbhandari et al., SC 2020) - Applying sharding to optimizer states (ZeRO-1), gradients (ZeRO-2), and parameters (ZeRO-3).
- **Rung 4 (Pure Python Contract)**: ZeRO-3 Contiguous Parameter Sharding & Rebuilding (Contract ID: `CONTRACT-TOPIC-39-ZERO3-SHARDING`) - Students implement the partitioning scheme and reconstruction logic for sharded weights.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We analyze the 50% communication overhead increase (2 AllGather + 1 ReduceScatter vs 1 AllReduce) exchanged for infinite memory scalability.

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-39-ZERO3-SHARDING`
**Title**: ZeRO-3 Parameter Sharding & Reconstruction
**Primary Reference URL**: https://deepspeed.readthedocs.io/en/stable/zero3.html
**Prompt**: Given a flattened model parameter vector $W$ of length $N$ and cluster world size $P$, partition $W$ into $P$ disjoint rank shards with zero padding. Implement `shard(W, rank)` and `allgather_reconstruct(shards)` returning the restored original parameter tensor.
**Input Schema**: `weights: list[float], world_size: int`
**Output Schema**: `shards: list[list[float]]`
**Constraints**: $N \le 10^5$, $P \le 64$.
**Tolerances**: Exact float equality.
**Worked Examples**:
- Input: `W=[1.0, 2.0, 3.0, 4.0], world_size=2` => Shard 0: `[1.0, 2.0]`, Shard 1: `[3.0, 4.0]`. Reconstruction restores `[1.0, 2.0, 3.0, 4.0]`.
**Canonical Python Code**:
```python
def zero3_parameter_shard_and_allgather(param_weights: list[float], world_size: int, rank: int) -> tuple[list[float], list[float]]:
    N = len(param_weights)
    chunk_size = (N + world_size - 1) // world_size
    padded_len = chunk_size * world_size
    
    padded_weights = param_weights + [0.0] * (padded_len - N)
    
    start = rank * chunk_size
    end = start + chunk_size
    shard = padded_weights[start:end]
    
    # Allgather simulate
    reconstructed = []
    for r in range(world_size):
        r_start = r * chunk_size
        r_end = r_start + chunk_size
        reconstructed.extend(padded_weights[r_start:r_end])
        
    return shard, reconstructed[:N]
```
**Test Strategy**: Validate with uneven parameter counts where $N$ is not divisible by $P$, checking clean padding and reconstruction.
**Visualizer State Schema**: `{ global_model_weights: float[], rank_shards: float[][], memory_savings_ratio: float }`

---


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [Partition Labels](https://leetcode.com/problems/partition-labels/) - Non-overlapping bounds.
2. [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/) - Capacity balancing.
3. Implement a dynamic parameter fetcher that gathers sharded weights only when required by the forward pass layer.
4. Write a script to convert a single standard PyTorch checkpoint into $N$ rank-specific ZeRO-3 sharded checkpoints.

**Part B: Mathematical Proofs & Analytical Derivations**
1. ZeRO Memory States: Derive the exact per-GPU memory footprint reduction for Optimizer States, Gradients, and Parameters for a $\Psi$ parameter model on $P$ GPUs.
2. Communication Overhead: Prove that ZeRO-3 increases total communication volume by $1.5\times$ compared to standard Data Parallelism.
3. Show mathematically how ZeRO-Offload computes gradient updates on the CPU while preventing PCIe bandwidth from bottlenecking the training step.

**Part C: Real-World ML Systems & Engineering Questions**
1. Prefetching: How does PyTorch FSDP schedule `AllGather` operations for layer $L+1$ while layer $L$ is computing?
2. Compare Megatron Tensor Parallelism (TP) vs ZeRO-3. When is TP strictly required over ZeRO-3 due to communication boundaries?
3. Discuss the difficulties of serving LLM inference directly from ZeRO-3 sharded weights.

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. Unbalanced Shards: What happens when parameter count is highly prime and shards mismatch in size, causing collective hangs?
2. OOM during AllGather: Stress test where rebuilding the full layer parameter exceeds the remaining active VRAM.
3. Gradient synchronization bugs where sharded optimizers apply inconsistent weight decay.


## Topic 40: Compiler Graph Passes, Kernel Fusion & Buffer Liveness Memory Arenas (TVM/Triton)
### 1. Learning Outcome
Understand deep learning graph compilers: Abstract Syntax Tree (AST) intermediate representations, Common Subexpression Elimination (CSE), vertical/horizontal operator fusion, and memory arena buffer liveness planning.

### 2. Prerequisites & Dependencies
- Computation Graph DAGs & Autograd (Topic 06)
- Memory Layout & Strides (Topic 02)

### 3. Decision Rationales & Alignments
**Decision Rationale:** Compilers (XLA, TVM, PyTorch Inductor, Triton) eliminate intermediate memory trips to HBM by fusing back-to-back operators into a single GPU kernel.
**Academic Course Alignment:** CMU 10-714 - Graph compilers, autodiff, and memory management.
**Industry SOTA Alignment:** PyTorch Inductor, Google XLA, Apache TVM, OpenAI Triton.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/) - Interval overlap scheduling sets the stage for calculating concurrent memory requirements.
- **Rung 2 (Mechanics)**: [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/) - Interval conflict resolution applies scheduling to constrained resources (memory buffers).
- **Rung 3 (ML Bridge)**: [TVM: An End-to-End Compiler Stack for Deep Learning](https://arxiv.org/abs/1802.04799) (Chen et al., OSDI 2018) - Connecting interval scheduling to tensor lifespans and memory arena planning.
- **Rung 4 (Pure Python Contract)**: Operator Liveness Arena Memory Planner (Contract ID: `CONTRACT-TOPIC-40-IR-FUSION-LIVENESS`) - Students compute the peak memory required by simulating tensor allocations and deallocations throughout execution.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We discuss memory fragmentation in dynamic tensor shapes vs static compilation ahead-of-time (JIT vs AOT), and why kernel fusion drastically increases arithmetic intensity.

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-40-IR-FUSION-LIVENESS`
**Title**: Compiler Tensor Liveness Arena Planner
**Primary Reference URL**: https://tvm.apache.org/
**Prompt**: Given a dictionary of tensor intermediate lifespans mapping tensor name to `(birth_step, death_step, size_bytes)`, compute the maximum peak memory required in an arena allocator by finding the maximum concurrent memory overlap at any execution step.
**Input Schema**: `liveness: dict[str, tuple[int, int, int]]` (tensor_name -> (start, end, bytes))
**Output Schema**: `peak_memory_bytes: int`
**Constraints**: $1 \le \text{lifespans} \le 10^4$. Execution steps $0 \le t \le 10^5$.
**Tolerances**: Exact integer byte match.
**Worked Examples**:
- Input: `{"t1": (0, 2, 100), "t2": (2, 4, 100)}` => Output: 100 bytes (t1 dies before/at t2 allocation).
- Input: `{"t1": (0, 3, 100), "t2": (1, 4, 200)}` => Peak at step 1-2: 300 bytes.
**Canonical Python Code**:
```python
def greedy_buffer_liveness_allocator(intervals: dict[str, tuple[int, int, int]]) -> int:
    liveness = intervals
    events = []
    for tensor_name, (start, end, size) in liveness.items():
        events.append((start, size))    # Allocation event
        events.append((end, -size))    # Free event
        
    # Sort events by timestep. If equal, free before allocate
    events.sort(key=lambda x: (x[0], x[1]))
    
    current_mem = 0
    peak_mem = 0
    
    for _, delta in events:
        current_mem += delta
        if current_mem > peak_mem:
            peak_mem = current_mem
            
    return peak_mem
```
**Test Strategy**: Validate with disjoint lifespans, completely nested lifespans, and simultaneous allocations/frees.
**Visualizer State Schema**: `{ timeline_steps: int[], active_tensors: list, memory_profile_curve: int[], peak_arena_bytes: int }`

---


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/) - Liveness overlap.
2. [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/) - Conflict resolution.
3. Write a parser to convert a simple sequence of operations into a computational DAG.
4. Implement a greedy memory arena allocator that reuses memory blocks for tensors whose lifespans do not overlap.

**Part B: Mathematical Proofs & Analytical Derivations**
1. Peak Memory Bounds: Prove the worst-case peak memory complexity for a sequential vs a branching neural network graph.
2. Operator Fusion FLOPs: Derive the HBM read/write volume saved by fusing `Linear -> Gelu -> Dropout` into a single Triton kernel.
3. Show how Common Subexpression Elimination (CSE) alters the topological sort constraints of an autograd DAG.

**Part C: Real-World ML Systems & Engineering Questions**
1. PyTorch Inductor: Explain how `torch.compile` traces the graph and offloads subgraph compilation to OpenAI Triton.
2. Contrast static shape ahead-of-time (AOT) compilation in XLA/TPUs vs dynamic shape JIT compilation.
3. How do compilers handle horizontal fusion (batching multiple independent matrix multiplications into a single Batched GEMM)?

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. Fragmentation: Arena memory fragmentation when dynamic shapes continuously request varying block sizes.
2. Autograd Liveness: Why do tensors required for the backward pass destroy memory reuse opportunities in the forward pass arena?
3. Compilation Timeouts: Graph tracing loops blowing up to exponential complexity on massive MoE architectures.


## Topic 41: 3D Parallelism, 1F1B Pipeline Bubble Analysis & MoE Capacity Routing
### 1. Learning Outcome
Master modern 3D parallelism (combining Data Parallelism, Megatron Tensor Parallelism, and Pipeline Parallelism), 1F1B schedule bubble ratio accounting, and Mixture of Experts (MoE) top-k capacity token routing.

### 2. Prerequisites & Dependencies
- Collective Primitives & ZeRO (Topic 38, Topic 39)
- Attention Heads & GQA (Topic 29)

### 3. Decision Rationales & Alignments
**Decision Rationale:** Training trillion-parameter models (GPT-4, LLaMA 3, DeepSeek) requires simultaneous 3D parallelism and sparse MoE routing to balance memory, compute, and communication bandwidth.
**Academic Course Alignment:** Stanford CS336 - 3D Parallelism (Megatron-LM); UC Berkeley CS294 / SkyLab - Mixture of Experts.
**Industry SOTA Alignment:** Google DeepSeek MoE 3D parallelism, Megatron-LM Pipeline Parallelism (1F1B), Google Gemini MoE routing, Switch Transformers.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [Top K Frequent Words](https://leetcode.com/problems/top-k-frequent-words/) - Top-k selection logic prepares students for sparse routing mechanisms.
- **Rung 2 (Mechanics)**: [Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/) - Bounded buffer capacity balancing introduces the constraints expert nodes face in MoE architectures.
- **Rung 3 (ML Bridge)**: [Megatron-LM](https://arxiv.org/abs/1909.08053) & [Switch Transformers](https://arxiv.org/abs/2101.03961) - Linking schedules and capacity constraints to pipeline bubble calculations and token routing.
- **Rung 4 (Pure Python Contract)**: 1F1B Pipeline Bubble Calculator & MoE Capacity Router (Contract ID: `CONTRACT-TOPIC-41-MOE-1F1B`) - Students calculate exact bubble inefficiencies for 1F1B schedules and enforce top-1 expert routing with strict overflow dropping.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We weigh the cost of token dropping vs load-balancing auxiliary loss in expert capacity limits, and how pipeline bubbles interact with batch sizes.

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-41-MOE-1F1B`
**Title**: 1F1B Pipeline Schedule Bubble Accounting & MoE Routing
**Primary Reference URL**: https://arxiv.org/abs/2101.03961
**Prompt**: Implement two functions: (1) `calculate_1f1b_bubble_ratio(num_stages, num_microbatches)` computing the pipeline bubble fraction $F = (P - 1) / (M + P - 1)$, and (2) `moe_token_dispatch(gate_logits, num_experts, capacity)` assigning tokens to top-1 expert while enforcing maximum expert capacity (overflow tokens assigned to -1).
**Input Schema**: `num_stages: int, num_microbatches: int` for bubble, `gate_logits: list[list[float]], num_experts: int, capacity: int` for MoE.
**Output Schema**: Float bubble ratio for (1), List of assigned expert IDs for (2).
**Constraints**: $P \ge 1$, $M \ge P$.
**Tolerances**: Absolute error < 1e-6.
**Worked Examples**:
- `calculate_1f1b_bubble_ratio(4, 16)` => $3 / 19 = 0.15789$ (15.79% bubble overhead).
- MoE with capacity 1: 2 tokens pick expert 0 -> Token 0 assigned to 0, Token 1 dropped (-1).
**Canonical Python Code**:
```python
def calculate_1f1b_bubble_ratio(num_stages: int, num_microbatches: int) -> float:
    P = num_stages
    M = num_microbatches
    if M + P - 1 == 0:
        return 0.0
    return float(P - 1) / float(M + P - 1)

def moe_topk_routing_with_capacity(
    gate_logits: list[list[float]], 
    top_k: int, 
    capacity_limit: int
) -> list[list[int]]:
    num_experts = len(gate_logits[0]) if gate_logits else 0
    expert_counts = {e: 0 for e in range(num_experts)}
    assignments = []
    
    for token_logits in gate_logits:
        indexed_logits = list(enumerate(token_logits))
        indexed_logits.sort(key=lambda x: x[1], reverse=True)
        top_experts = [idx for idx, _ in indexed_logits[:top_k]]
        
        token_assignments = []
        for expert in top_experts:
            if expert_counts[expert] < capacity_limit:
                expert_counts[expert] += 1
                token_assignments.append(expert)
            else:
                token_assignments.append(-1)
        assignments.append(token_assignments)
            
    return assignments
```
**Test Strategy**: Validate bubble ratio reaches 0 as $M \to \infty$, and assert MoE enforces strict capacity constraints.
**Visualizer State Schema**: `{ pipeline_timeline: list, stage_utilizations: float[], expert_capacity_meters: int[], dispatched_tokens: int[] }`


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [Top K Frequent Words](https://leetcode.com/problems/top-k-frequent-words/) - Top-k routing.
2. [Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/) - Capacity limits.
3. Implement a 1F1B (One-Forward-One-Backward) execution queue for a 4-stage pipeline.
4. Write a load-balancing auxiliary loss function calculating the variance of token assignments across experts.

**Part B: Mathematical Proofs & Analytical Derivations**
1. Bubble Ratio: Derive the pipeline bubble fraction $F = (P - 1) / (M + P - 1)$ for the 1F1B schedule.
2. MoE FLOPs vs Memory: Prove that an $N$-expert MoE increases memory by $O(N)$ but keeps inference FLOPs constant relative to a dense model.
3. Dropped Tokens: Formulate the probability of token dropping given a Poisson distribution of token expert preferences and strict capacity $C$.

**Part C: Real-World ML Systems & Engineering Questions**
1. 3D Parallelism: How are Data Parallelism (DP), Tensor Parallelism (TP), and Pipeline Parallelism (PP) mapped onto a cluster of 1024 GPUs across 128 nodes?
2. DeepSeek MoE: Explain the concept of "auxiliary-loss-free" load balancing via expert bias updates.
3. Discuss the communication bottlenecks when expert capacity routing requires an All-to-All collective across the InfiniBand network.

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. Pipeline Stalls: Deadlocks when microbatch gradients are synchronized out-of-order in PP schedules.
2. Expert Collapse: Stress testing MoE where all tokens route to Expert 0, maximizing the dropped token penalty.
3. Memory spikes during All-to-All token dispatch exceeding the pre-allocated communication buffers.


