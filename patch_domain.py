import os

in_path = '/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v4-repair/rounds/round-01/domain-06-07-distributed-and-serving.md'
out_path = '/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-07-29-curriculum-v5-patch/rounds/round-01/domain-06-07-distributed-and-serving-v5.md'

with open(in_path, 'r') as f:
    content = f.read()

# 1. Topic 24 Orca Scheduler
orca_old = """### Executable Problem Contract: Orca Iteration-Level Sequence Scheduler

**Description:**
Implement an iteration-level scheduler that admits sequences based on token memory constraints and processes them one iteration at a time, allowing continuous batching.

**Primary Reference:** 
Yu et al., Orca: A Distributed Serving System for Transformer-Based Generative Models (OSDI 2022)
**Literal URL:** https://www.usenix.org/conference/osdi22/presentation/yu

**Input Types:**
- `requests`: `List[Tuple[int, int, int]]` (arrival_iteration, sequence_id, max_tokens)
- `max_batch_size`: `int`
- `max_total_tokens`: `int`

**Output Type:**
- `List[Tuple[int, int, int]]`: (sequence_id, start_iteration, completion_iteration)

**Constraints:**
- Sequences must be scheduled First-Come-First-Serve (FCFS) when memory permits.
- Active sequences consume tokens incrementally (1 token per iteration).
- Total tokens across all active sequences cannot exceed `max_total_tokens`.
- Maximum active sequences cannot exceed `max_batch_size`.

**Python Reference Implementation:**
```python
def orca_scheduler(requests, max_batch_size, max_total_tokens):
    import collections
    requests.sort(key=lambda x: (x[0], x[1])) # sort by arrival, then id
    req_queue = collections.deque(requests)
    
    active = []
    completed = []
    current_iter = 0
    
    while req_queue or active:
        # Admit new requests
        while req_queue and req_queue[0][0] <= current_iter:
            if len(active) < max_batch_size:
                # Each active sequence will consume +1 token in the next iteration.
                # A new request will also consume 1 initial token.
                required_next_tokens = sum(r['tokens'] + 1 for r in active) + 1
                if required_next_tokens <= max_total_tokens:
                    req = req_queue.popleft()
                    active.append({'id': req[1], 'tokens': 1, 'max': req[2], 'start': current_iter})
                    continue
            break
            
        # Execute one step
        next_active = []
        for r in active:
            r['tokens'] += 1
            if r['tokens'] > r['max']:
                completed.append((r['id'], r['start'], current_iter + 1))
            else:
                next_active.append(r)
                
        active = next_active
        current_iter += 1
        
    return sorted(completed)
```

**Worked Examples:**
1. 
Input: `requests = [(0, 1, 2), (0, 2, 3)], max_batch_size = 2, max_total_tokens = 10`
Output: `[(1, 0, 2), (2, 0, 3)]`

2.
Input: `requests = [(0, 1, 5), (1, 2, 2)], max_batch_size = 1, max_total_tokens = 10`
Output: `[(1, 0, 5), (2, 5, 7)]`"""

orca_new = """### Executable Problem Contract: Orca Iteration-Level Sequence Scheduler

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
Output: `[(1, 0, 3), (2, 3, 5)]`"""

if orca_old in content:
    print("Found Orca block")
    content = content.replace(orca_old, orca_new)
else:
    print("WARNING: Did not find Orca block")

# Add CONTRACT-TOPIC-24-ORCA to Rung 4 as well
content = content.replace(
    "**Title:** Orca Iteration-Level Sequence Scheduler\n**Source:** Custom",
    "**Title:** Orca Iteration-Level Sequence Scheduler\n**Contract ID:** CONTRACT-TOPIC-24-ORCA\n**Source:** Custom"
)

# Topic 25
content = content.replace(
    "### Executable Problem Contract: PagedAttention Logical-to-Physical KV Block Lookup\n\n**Description:**",
    "### Executable Problem Contract: PagedAttention Logical-to-Physical KV Block Lookup\n\n**Contract ID:** CONTRACT-TOPIC-25-PAGEDATTENTION\n\n**Description:**"
)
content = content.replace(
    "**Title:** PagedAttention Logical-to-Physical KV Block Lookup\n**Source:** Custom",
    "**Title:** PagedAttention Logical-to-Physical KV Block Lookup\n**Contract ID:** CONTRACT-TOPIC-25-PAGEDATTENTION\n**Source:** Custom"
)

# Topic 26
content = content.replace(
    "**Title:** Optimal GPU Pairwise Mapping\n**Source:** Custom",
    "**Title:** Optimal GPU Pairwise Mapping\n**Contract ID:** CONTRACT-TOPIC-26-NETWORK-PATH\n**Source:** Custom"
)

# Topic 27 
t27_old = """### 1. Foundation: Circular Indexing (Required)
**Title:** Circular Array Loop
**Source:** LeetCode
**URL:** https://leetcode.com/problems/circular-array-loop/
**Difficulty & Rationale:** Medium. Validates modulo arithmetic and index wrapping, which governs ring communications.
**Transfer Rationale:** Nodes in a ring collective pass data to `(i + 1) % P`."""

t27_new = """### 1. Foundation: Circular Queue (Required)
**Title:** Design Circular Queue
**Source:** LeetCode
**URL:** https://leetcode.com/problems/design-circular-queue/
**Difficulty & Rationale:** Medium. Validates modulo arithmetic, head/tail pointers, and capacity state.
**Transfer Rationale:** Exact head/tail and modular-index state required by a ring trace."""

if t27_old in content:
    print("Found T27 block")
    content = content.replace(t27_old, t27_new)
else:
    print("WARNING: Did not find T27 block")

content = content.replace(
    "### Executable Problem Contract: NCCL Ring-AllReduce Trace\n\n**Description:**",
    "### Executable Problem Contract: NCCL Ring-AllReduce Trace\n\n**Contract ID:** CONTRACT-TOPIC-27-RING-ALLREDUCE\n\n**Description:**"
)
content = content.replace(
    "**Title:** NCCL Ring-AllReduce Trace\n**Source:** Custom",
    "**Title:** NCCL Ring-AllReduce Trace\n**Contract ID:** CONTRACT-TOPIC-27-RING-ALLREDUCE\n**Source:** Custom"
)

# Topic 28
t28_r1_old = """### 1. Foundation: Array Partitioning (Required)
**Title:** Partition Array Into N Subsets
**Source:** LeetCode (Modified variation of Partition Equal Subset Sum)
**URL:** https://leetcode.com/problems/partition-equal-subset-sum/
**Difficulty & Rationale:** Medium. Core logic of dividing elements evenly.
**Transfer Rationale:** Sharding requires mapping 1D flattened tensors across N devices."""

t28_r1_new = """### 1. Foundation: Array Partitioning (Required)
**Title:** Split Linked List in Parts
**Source:** LeetCode
**URL:** https://leetcode.com/problems/split-linked-list-in-parts/
**Difficulty & Rationale:** Medium. Core logic of dividing elements evenly into contiguous parts whose sizes differ by at most one.
**Transfer Rationale:** Sharding requires mapping 1D flattened contiguous tensors across N devices."""

if t28_r1_old in content:
    print("Found T28 Rung 1")
    content = content.replace(t28_r1_old, t28_r1_new)
else:
    print("WARNING: Did not find T28 Rung 1")

content = content.replace(
    "### 4. Named Mechanism: ZeRO-3 Partition Accountant (Required)\n**Title:** ZeRO-3 Flat Partition Assignment\n**Source:** Custom",
    "### 4. Named Mechanism: Simplified Contiguous Parameter Sharding (Required)\n**Title:** Simplified Contiguous Parameter Sharding\n**Contract ID:** CONTRACT-TOPIC-28-ZERO3-CONTIGUOUS\n**Source:** Custom"
)

content = content.replace(
    "### Executable Problem Contract: ZeRO-3 Partition Accountant\n\n**Description:**\nGiven a list of parameter sizes and `P` data-parallel ranks, flatten the parameters, pad the total size to be divisible by `P`, and determine the exact start/end elements assigned to a specific rank `R`.",
    "### Executable Problem Contract: Simplified Contiguous Parameter Sharding\n\n**Contract ID:** CONTRACT-TOPIC-28-ZERO3-CONTIGUOUS\n\n**Description:**\nGiven a list of parameter sizes and `P` data-parallel ranks, flatten the parameters, pad the total size to be divisible by `P`, and determine the exact start/end elements assigned to a specific rank `R` using a simplified contiguous strategy."
)
content = content.replace(
    "def zero3_partition(",
    "def simplified_contiguous_partition("
)

# Topic 29a
content = content.replace(
    "**Title:** Tensor Arena Memory Planner\n**Source:** Custom",
    "**Title:** Tensor Arena Memory Planner\n**Contract ID:** CONTRACT-TOPIC-29A-IR-FUSION\n**Source:** Custom"
)

# Topic 29b
t29b_r1_old = """### 1. Foundation: Load Balancing (Required)
**Title:** Fair Distribution of Cookies
**Source:** LeetCode
**URL:** https://leetcode.com/problems/fair-distribution-of-cookies/
**Difficulty & Rationale:** Medium. Backtracking or greedy assignment of workloads."""

t29b_r1_new = """### 1. Foundation: Load Balancing (Optional)
**Title:** Fair Distribution of Cookies
**Source:** LeetCode
**URL:** https://leetcode.com/problems/fair-distribution-of-cookies/
**Difficulty & Rationale:** Medium (Optional). Backtracking or greedy assignment of workloads."""

if t29b_r1_old in content:
    print("Found T29b Rung 1")
    content = content.replace(t29b_r1_old, t29b_r1_new)
else:
    print("WARNING: Did not find T29b Rung 1")

content = content.replace(
    "### Executable Problem Contract: 1F1B Pipeline Bubble Accountant\n\n**Description:**",
    "### Executable Problem Contract: 1F1B Pipeline Bubble Accountant\n\n**Contract ID:** CONTRACT-TOPIC-29B-1F1B\n\n**Description:**"
)
content = content.replace(
    "**Title:** 1F1B Pipeline Bubble Accountant\n**Source:** Custom",
    "**Title:** 1F1B Pipeline Bubble Accountant\n**Contract ID:** CONTRACT-TOPIC-29B-1F1B\n**Source:** Custom"
)


t29b_ex2_old = """2.
Input: `P = 8, M = 4, t_f = 0.5, t_b = 1.0`
Output: `(6.0, 10.5, 1.75)`
*(Ideal = 4 * 1.5 = 6.0. Bubble = 7 * 1.5 = 10.5. Fraction = 7/4 = 1.75. Note: M < P is highly inefficient, resulting in > 100% bubble ratio relative to ideal)*"""

t29b_ex2_new = """2.
Input: `P = 8, M = 4, t_f = 0.5, t_b = 1.0`
Output: `(6.0, 10.5, 0.6363636363636364)`
*(Ideal = 4 * 1.5 = 6.0. Bubble = 7 * 1.5 = 10.5. Total = 16.5. Fraction = 10.5 / 16.5 = 7/11 ≈ 0.63636. Note: M < P is highly inefficient, resulting in high bubble ratio relative to total)*"""

if t29b_ex2_old in content:
    print("Found T29b example 2")
    content = content.replace(t29b_ex2_old, t29b_ex2_new)
else:
    print("WARNING: Did not find T29b example 2")

os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, 'w') as f:
    f.write(content)
print(f"Patched domain file saved to {out_path}")
