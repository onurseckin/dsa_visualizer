# Domain 8: Inference Serving & Memory Systems

## Topic 31: Iteration-Level Continuous Batching (Orca Scheduler)
### 1. Learning Outcome
Understand iteration-level batching dynamics, preventing head-of-line blocking and GPU idle cycles caused by sequence length variance in autoregressive LLM serving.

### 2. Prerequisites & Dependencies
- Causal Attention & KV-Cache (Topic 28)
- Priority Queues & Schedulers

### 3. Decision Rationales & Alignments
**Decision Rationale:** Static batching causes severe GPU underutilization when sequences finish at different lengths. Orca's iteration-level scheduling is the standard for high-throughput serving systems (vLLM, TGI, TensorRT-LLM).
**Academic Course Alignment:** UC Berkeley CS294 / SkyLab - LLM inference serving; CMU 10-714 - System optimization for deep learning.
**Industry SOTA Alignment:** vLLM Continuous Batching, HuggingFace TGI, NVIDIA TensorRT-LLM, Orca scheduler design.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [Task Scheduler](https://leetcode.com/problems/task-scheduler/) - We start with iterative round-robin slot filling with priority constraints to understand basic throughput.
- **Rung 2 (Mechanics)**: [Design Hit Counter](https://leetcode.com/problems/design-hit-counter/) - Timestamped event processing and queue evictions provide the mechanics for tracking request lifecycles.
- **Rung 3 (ML Bridge)**: [Orca: A Distributed Serving System for Transformer-Based Generative Models](https://www.usenix.org/conference/osdi22/presentation/yu) (Yu et al., OSDI 2022) - Bridging basic scheduling to iteration-level continuous batching, preventing head-of-line blocking in LLMs.
- **Rung 4 (Pure Python Contract)**: Orca Iteration-Level Scheduler (Contract ID: `CONTRACT-TOPIC-31-ORCA-SCHEDULER`) - Students implement the precise state machine of a continuous batching scheduler handling variable-length generation.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We analyze the tension between prefill token budget saturation (TTFT - Time To First Token) vs decode token latency guarantees (TPOT - Time Per Output Token).

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-31-ORCA-SCHEDULER`
**Title**: Orca Continuous Batching Iteration Scheduler
**Primary Reference URL**: https://www.usenix.org/conference/osdi22/presentation/yu
**Prompt**: Implement a continuous batching scheduler that maintains active decoding requests and admits waiting prefill requests up to a maximum batch size `max_batch_size`. At each iteration `schedule_step()`, advance active requests by 1 token, evict finished requests (where generated tokens reach target length), and admit new requests into available batch slots.
**Input Schema**: Sequence of request arrivals with prompt and generation lengths.
**Output Schema**: List of active request IDs executed at each scheduling step.
**Constraints**: Pure Python with collections.
**Tolerances**: Exact deterministic step schedule match.
**Worked Examples**:
- Batch size 2. Req 1 (gen len 2) and Req 2 (gen len 1) arrive. Step 1 executes [Req 1, Req 2]. Req 2 finishes. Step 2 admits Req 3 and executes [Req 1, Req 3].
**Canonical Python Code**:
```python
from collections import deque

class Request:
    def __init__(self, req_id: str, prompt_len: int, max_tokens: int):
        self.req_id = req_id
        self.prompt_len = prompt_len
        self.max_tokens = max_tokens
        self.tokens_generated = 0

    @property
    def is_finished(self) -> bool:
        return self.tokens_generated >= self.max_tokens

class OrcaContinuousBatchingScheduler:
    def __init__(self, max_batch_size: int):
        self.max_batch_size = max_batch_size
        self.waiting_queue = deque()
        self.running_batch = []

    def add_request(self, req_id: str, prompt_len: int, max_tokens: int) -> None:
        self.waiting_queue.append(Request(req_id, prompt_len, max_tokens))

    def schedule_step(self) -> list[str]:
        # 1. Evict finished requests
        self.running_batch = [r for r in self.running_batch if not r.is_finished]
        
        # 2. Admit new requests from waiting queue if slots available
        while len(self.running_batch) < self.max_batch_size and self.waiting_queue:
            self.running_batch.append(self.waiting_queue.popleft())
            
        # 3. Advance each running request by 1 token
        executed_ids = []
        for req in self.running_batch:
            req.tokens_generated += 1
            executed_ids.append(req.req_id)
            
        return executed_ids
```
**Test Strategy**: Validate zero idle slots when queue is saturated, and verify immediate admission upon sequence completion.
**Visualizer State Schema**: `{ waiting_requests: list, active_batch_slots: list, completed_requests: list, iteration_step: int }`

---


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [Task Scheduler](https://leetcode.com/problems/task-scheduler/) - Slot filling constraints.
2. [Design Hit Counter](https://leetcode.com/problems/design-hit-counter/) - Event expiration.
3. Implement a priority queue for batched sequence execution based on remaining tokens.
4. Simulate a round-robin continuous batching scheduler for 10 sequences of varying lengths.

**Part B: Mathematical Proofs & Analytical Derivations**
1. Prove that continuous iteration-level batching provides strict upper bounds on GPU idle time compared to static batching.
2. Derive the expected throughput increase of Orca over static batching given a Poisson distribution of sequence lengths.
3. Calculate the maximum theoretical batch size before Time-Per-Output-Token (TPOT) exceeds human reading speed (e.g., 50 ms/token).

**Part C: Real-World ML Systems & Engineering Questions**
1. Prefill vs Decode Interleaving: Analyze the tradeoffs of chunked prefill (vLLM) on TTFT vs decode tail latency.
2. How does the Orca scheduler handle out-of-memory (OOM) preemptions and recomputations?
3. Compare the request latency distributions in vLLM vs TGI under heavy burst traffic.

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. Deadlock in scheduling: Head-of-line blocking when a massive prefill request starves existing decodes.
2. Thrashing: Constant swapping of KV cache when the active batch size exceeds physical VRAM.
3. Token generation limits: Handling adversarial infinite-generation loops in the scheduler.


## Topic 32: Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM)
### 1. Learning Outcome
Learn virtual memory paging applied to KV-cache management, eliminating internal/external memory fragmentation and implementing Copy-on-Write for parallel sampling and beam search.

### 2. Prerequisites & Dependencies
- Causal SDPA & KV-Cache (Topic 28)
- Hash tables and Block allocation (Topic 01)

### 3. Decision Rationales & Alignments
**Decision Rationale:** Static pre-allocation of maximum KV-cache memory wastes 60-80% of GPU memory. PagedAttention enables near-zero memory waste.
**Academic Course Alignment:** UC Berkeley CS294 / SkyLab - PagedAttention; Stanford CS336 - Advanced inference systems.
**Industry SOTA Alignment:** vLLM PagedAttention, NVIDIA TensorRT-LLM, HuggingFace Text Generation Inference.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [LRU Cache](https://leetcode.com/problems/lru-cache/) - Doubly-linked block list and page replacement establish the OS-level primitives of memory management.
- **Rung 2 (Mechanics)**: [Design Memory Allocator](https://leetcode.com/problems/design-memory-allocator/) - Segment tracking and defragmentation concepts build intuition for mapping logical segments to physical hardware.
- **Rung 3 (ML Bridge)**: [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) (Kwon et al., SOSP 2023) - Bridging virtual memory paging to KV-cache management for LLMs.
- **Rung 4 (Pure Python Contract)**: PagedAttention Block Table & CoW (Contract ID: `CONTRACT-TOPIC-32-PAGEDATTN-COW`) - Students implement a logical-to-physical block table, dynamically allocating and tracking reference counts.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We explore block size selection (16 vs 32 tokens) balancing allocation granularity (preventing internal fragmentation) against kernel memory coalescence (preventing pointer-chasing overhead).

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-32-PAGEDATTN-COW`
**Title**: PagedAttention Block Table and Copy-on-Write
**Primary Reference URL**: https://arxiv.org/abs/2309.06180
**Prompt**: Implement a Paged KV-Cache Manager. Maintain a pool of physical block IDs (each holding `block_size` tokens). Implement `allocate_request(req_id, num_tokens)` to map logical tokens to physical blocks, `append_token(req_id)` to dynamically allocate new blocks as needed, and `fork_request(parent_id, child_id)` with Copy-on-Write reference counting.
**Input Schema**: Requests allocation, token append, and fork operations.
**Output Schema**: Sequence of mapped physical block IDs and block reference count states.
**Constraints**: Pure Python. Physical pool capacity $M \le 1000$.
**Tolerances**: Exact block allocation and ref-count match.
**Worked Examples**:
- Block size 2. Allocate 3 tokens -> occupies 2 blocks (Block 0 with 2 tokens, Block 1 with 1 token). Fork -> ref-counts increment.
**Canonical Python Code**:
```python
class PagedAttentionBlockManager:
    def __init__(self, block_size: int, total_blocks: int):
        self.block_size = block_size
        self.free_blocks = list(range(total_blocks - 1, -1, -1))
        self.ref_counts = {i: 0 for i in range(total_blocks)}
        self.block_tables = {}  # req_id -> list of physical block IDs
        self.num_tokens = {}    # req_id -> int

    def allocate_request(self, req_id: str, num_tokens: int) -> list[int]:
        num_blocks = (num_tokens + self.block_size - 1) // self.block_size
        blocks = []
        for _ in range(num_blocks):
            if not self.free_blocks:
                raise MemoryError("Out of physical blocks")
            blk = self.free_blocks.pop()
            self.ref_counts[blk] = 1
            blocks.append(blk)
        self.block_tables[req_id] = blocks
        self.num_tokens[req_id] = num_tokens
        return blocks

    def append_token(self, req_id: str) -> int:
        cur_tokens = self.num_tokens[req_id]
        blocks = self.block_tables[req_id]
        
        # Check if new token requires new block
        if cur_tokens % self.block_size == 0:
            if not self.free_blocks:
                raise MemoryError("Out of physical blocks")
            new_blk = self.free_blocks.pop()
            self.ref_counts[new_blk] = 1
            blocks.append(new_blk)
        else:
            # Check Copy-on-Write if last block is shared
            last_blk = blocks[-1]
            if self.ref_counts[last_blk] > 1:
                if not self.free_blocks:
                    raise MemoryError("Out of physical blocks")
                self.ref_counts[last_blk] -= 1
                new_blk = self.free_blocks.pop()
                self.ref_counts[new_blk] = 1
                blocks[-1] = new_blk
                
        self.num_tokens[req_id] += 1
        return blocks[-1]

    def read_kv(self, req_id: str) -> list[int]:
        return list(self.block_tables.get(req_id, []))
```
**Test Strategy**: Validate Copy-on-Write properly separates child sequences upon token appending without corrupting parent memory.
**Visualizer State Schema**: `{ physical_block_pool: list, request_block_tables: dict, ref_counts: dict }`

---


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [LRU Cache](https://leetcode.com/problems/lru-cache/) - Cache eviction logic.
2. [Design Memory Allocator](https://leetcode.com/problems/design-memory-allocator/) - Free list tracking.
3. Implement a basic virtual-to-physical address translation table.
4. Design a reference-counting memory manager with garbage collection for detached sequences.

**Part B: Mathematical Proofs & Analytical Derivations**
1. PagedAttention Fragmentation: Derive the formula for average internal fragmentation per sequence as a function of block size $B$.
2. Prove that external fragmentation is mathematically $0$ in PagedAttention due to fixed-size blocks.
3. Compute the memory capacity improvements for beam search width $k$ using Copy-on-Write vs naive duplication.

**Part C: Real-World ML Systems & Engineering Questions**
1. Block Size Tuning: Why does vLLM default to a block size of 16 tokens instead of 1 or 64? Discuss kernel pointer-chasing overhead.
2. How does PagedAttention integrate with Triton kernels where contiguous memory layouts are traditionally expected?
3. Discuss the system impact of moving the KV-cache swap space from VRAM to host CPU RAM over PCIe.

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. Out of Memory: Graceful degradation and sequence preemption when physical blocks are exhausted mid-generation.
2. Ref-count overflow or leaks leading to zombie blocks in long-running servers.
3. Race conditions in asynchronous Copy-on-Write operations during parallel sampling.


## Topic 33: Speculative Decoding & Prefix Caching Algorithms
### 1. Learning Outcome
Understand latency acceleration via speculative draft-then-verify algorithms and Radix Tree prefix caching for shared prompt prefixes.

### 2. Prerequisites & Dependencies
- Probability Distributions & Sampling (Topic 12)
- Iteration-Level Batching (Topic 31)

### 3. Decision Rationales & Alignments
**Decision Rationale:** Speculative decoding breaks the memory-bandwidth bottleneck by verifying $K$ draft tokens in a single forward pass of the large model.
**Academic Course Alignment:** Stanford CS336 - Speculative execution and inference optimizations; UC Berkeley CS294 / SkyLab.
**Industry SOTA Alignment:** Google DeepMind Speculative Decoding, vLLM RadixAttention/Prefix Caching, Medusa architectures.

### 4. Pedagogical Ascent & Mental Model
- **Rung 1 (Elementary Foundation)**: [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/) - Recursive verification of proposal constraints establishes the draft-verify pattern.
- **Rung 2 (Mechanics)**: [Longest Common Prefix](https://leetcode.com/problems/longest-common-prefix/) - Radix prefix sharing across sequences enables state deduplication.
- **Rung 3 (ML Bridge)**: [Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) (Leviathan et al., 2023) - Applying draft-verify to autoregressive distributions.
- **Rung 4 (Pure Python Contract)**: Speculative Rejection Sampling Verification Step (Contract ID: `CONTRACT-TOPIC-33-SPECULATIVE-DECODE`) - Students implement the precise probabilistic acceptance loop, understanding exactly when tokens are rejected and resampled to maintain target distribution bounds.
- **Rung 5 (Hardware Physics & Tradeoffs)**: We analyze acceptance rate degradation on high-entropy generative tasks (code vs poetry) and how batch size influences the efficacy of small draft models.

### 5. Executable Problem Contract
**ID**: `CONTRACT-TOPIC-33-SPECULATIVE-DECODE`
**Title**: Speculative Decoding Verification Step
**Primary Reference URL**: https://arxiv.org/abs/2211.17192
**Prompt**: Given draft proposed tokens $[x_1, \dots, x_\gamma]$, draft model probabilities $q_i(x_i)$, and target model probabilities $p_i(x_i)$, implement the speculative acceptance step: accept token $x_i$ if uniform random draw $u_i \le \min(1, p_i(x_i) / q_i(x_i))$. If rejected at token $k$, sample a replacement token from $\max(0, p_k(x) - q_k(x))$ normalized, and discard all subsequent draft tokens.
**Input Schema**: `draft_tokens: list[int], draft_probs: list[list[float]], target_probs: list[list[float]], uniform_draws: list[float]`
**Output Schema**: `accepted_tokens: list[int]`
**Constraints**: Pure Python. Vocabulary size $V \le 1000$.
**Tolerances**: Exact distribution recovery match.
**Worked Examples**:
- When target model assigns higher probability than draft model ($p_i \ge q_i$), token is accepted with probability 1.0.
**Canonical Python Code**:
```python
def speculative_rejection_sampler(
    draft_tokens: list[int],
    draft_probs: list[list[float]],
    target_probs: list[list[float]],
    uniform_draws: list[float] = None
) -> tuple[list[int], int]:
    accepted = []
    gamma = len(draft_tokens)
    if uniform_draws is None:
        uniform_draws = [0.0] * gamma
        
    for i in range(gamma):
        token = draft_tokens[i]
        q_val = draft_probs[i][token]
        p_val = target_probs[i][token]
        
        # Acceptance ratio
        ratio = p_val / (q_val + 1e-12)
        u = uniform_draws[i] if i < len(uniform_draws) else 0.0
        
        if u <= min(1.0, ratio):
            accepted.append(token)
        else:
            # Rejected at position i: resample from max(0, p - q)
            resample_dist = [max(0.0, target_probs[i][v] - draft_probs[i][v]) for v in range(len(target_probs[i]))]
            sum_resample = sum(resample_dist)
            if sum_resample > 0:
                bonus_token = max(range(len(resample_dist)), key=lambda v: resample_dist[v])
            else:
                bonus_token = max(range(len(target_probs[i])), key=lambda v: target_probs[i][v])
            accepted.append(bonus_token)
            break
            
    return accepted, len(accepted)
```
**Test Strategy**: Assert that all tokens with $p \ge q$ are accepted deterministically when $u=0$.
**Visualizer State Schema**: `{ draft_token_chain: list, acceptance_probabilities: list, verification_cut_index: int, final_tokens: list }`


### 6. Problem & Question Bank
**Part A: Foundational DSA & Coding Problems**
1. [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/) - Verification semantics.
2. [Longest Common Prefix](https://leetcode.com/problems/longest-common-prefix/) - String prefix matching.
3. Implement a Radix Tree for storing and retrieving shared prompt prefixes.
4. Write a fast token verification loop matching draft tokens against target logits.

**Part B: Mathematical Proofs & Analytical Derivations**
1. Acceptance Rate: Prove that the expected number of accepted tokens is exactly identical to sampling directly from the target distribution.
2. Rejection Resampling: Prove that $\max(0, p - q)$ yields a valid probability distribution after normalization.
3. Speedup Bounds: Formulate the theoretical wall-clock speedup given draft model latency $t_d$, target latency $t_t$, and acceptance rate $\alpha$.

**Part C: Real-World ML Systems & Engineering Questions**
1. Draft Model Sizing: Discuss the FLOPs vs Acceptance Rate tradeoff when picking a 1.5B draft model for a 70B target model.
2. Analyze Medusa / Eagle multi-head speculative architectures vs standalone draft models.
3. How does vLLM prefix caching reduce the Time-To-First-Token (TTFT) for multi-turn chat applications?

**Part D: Edge Cases, Numerical Stability & Stress Tests**
1. Degraded Acceptance: Stress-testing speculative decoding on high-entropy tasks (e.g., base64 string generation) where acceptance drops to zero.
2. Floating point rounding errors in the rejection resampling distribution causing negative probabilities.
3. Draft model alignment collapse causing systematic rejection cascades.


