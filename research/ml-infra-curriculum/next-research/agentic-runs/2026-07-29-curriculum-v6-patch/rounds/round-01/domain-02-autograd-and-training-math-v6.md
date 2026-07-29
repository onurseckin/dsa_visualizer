# Domain 02: Autograd and Training Mathematics (Topics 06–13)

**Version 6 Patch Output**

## Topic 06: Directed Acyclic Graphs (DAGs), Dependency Sorting & Cycle Detection

### 1. Bounded Topic Title and Learning Outcome
**Topic 06: Directed Acyclic Graphs (DAGs), Dependency Sorting & Cycle Detection**
**Outcome:** Learners will be able to construct operator execution graphs, detect cyclical dependencies that prevent inference, and generate a valid topological execution schedule using in-degree reference tracking.

### 2. Prerequisites and Outgoing Dependencies
- **Prerequisites:** Topic 01 (Basic array/list operations for graph adjacency lists).
- **Outgoing Dependencies:** Topic 07 (DAG DP), Topic 08 (AST Evaluators).

### 3. Real DSA/Math Foundations
- **Course Schedule (LeetCode 207)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Foundational cycle detection via DFS/BFS.
  - **Transfer Rationale:** Operator execution graph cycle validation.
  - **Source:** [LeetCode 207](https://leetcode.com/problems/course-schedule/)
- **Course Schedule II (LeetCode 210)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Kahn's algorithm for topological sorting.
  - **Transfer Rationale:** Deterministic topological execution order for neural network layers.
  - **Source:** [LeetCode 210](https://leetcode.com/problems/course-schedule-ii/)

### 4. Focused Variants
- **Find Eventual Safe States (LeetCode 802)**
  - **Required:** Optional
  - **Difficulty/Rationale:** Medium. Terminal paths and reverse topological cycles.
  - **Transfer Rationale:** Identifying dead-end subgraphs and leaf nodes.
  - **Source:** [LeetCode 802](https://leetcode.com/problems/find-eventual-safe-states/)
- **Sequence Reconstruction (LeetCode 444)**
  - **Required:** Optional
  - **Difficulty/Rationale:** Medium. Uniqueness of a topological sort.
  - **Transfer Rationale:** Ensuring identical deterministic execution schedule.
  - **Source:** [LeetCode 444](https://leetcode.com/problems/sequence-reconstruction/)

### 5. Direct ML Bridge
- **Operator Execution Graph Cycle Validation**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Direct application of LC 207 to node objects with inputs/outputs.
  - **Transfer Rationale:** Validating a dynamic computation graph before launching execution.
- **Reverse Topological Backward Pass Order**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Emphasizes reversing graph edges to compute gradients backwards.
  - **Transfer Rationale:** Core loop of reverse-mode autograd engine.

### 6. Named ML-Infrastructure Mechanism
- **Consumer Reference Count Tensor Deallocation**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. Kahn's algorithm with live memory accounting. As soon as in-degree hits zero, memory is freed.
  - **Transfer Rationale:** Memory planning in dynamic/static frameworks (e.g., PyTorch dispatcher, XLA).

### 7. Stress/Tradeoff Endpoint
- **Sort Items by Groups Respecting Dependencies (LeetCode 1203)**
  - **Required:** Optional
  - **Difficulty/Rationale:** Hard. Two-level topological sort.
  - **Transfer Rationale:** Scheduling operations where specific operations must execute on the same device/group.
  - **Source:** [LeetCode 1203](https://leetcode.com/problems/sort-items-by-groups-respecting-dependencies/)

### 8-9. Required vs Optional / Difficulty
(See inline above).

### 10. Canonical Source Mappings
- **LeetCode 207:** https://leetcode.com/problems/course-schedule/
- **LeetCode 210:** https://leetcode.com/problems/course-schedule-ii/
- **LeetCode 802:** https://leetcode.com/problems/find-eventual-safe-states/
- **LeetCode 444:** https://leetcode.com/problems/sequence-reconstruction/
- **LeetCode 1203:** https://leetcode.com/problems/sort-items-by-groups-respecting-dependencies/

### 11. Complete Custom Problem Contracts
**Custom Exercise: Consumer Reference Count Tensor Deallocation**
- **Contract ID:** CONTRACT-TOPIC-06-CYCLE
- **Type:** Custom mechanism.
- **Inputs:** `num_tensors: int`, `dependencies: List[Tuple[int, int]]` (consumer, producer). `tensor_sizes: List[int]`.
- **Outputs:** `max_peak_memory: int`.
- **Constraints:** `num_tensors < 10^4`, `sum(tensor_sizes) < 2^31`.
- **Tolerance/Ties:** Tie break processing ready nodes via smallest ID first.
- **Reference Example 1:** (0->1, size: 10, 10) -> Peak 20.
- **Reference Example 2:** (0->1, 0->2, 1->3, 2->3, sizes 10 each) -> Peak memory simulation.
- **Python Implementation:**
```python
import heapq

def max_peak_memory(num_tensors: int, dependencies: list[tuple[int, int]], tensor_sizes: list[int]) -> int:
    adj = [[] for _ in range(num_tensors)]
    prod_adj = [[] for _ in range(num_tensors)]
    in_degree = [0] * num_tensors
    out_degree = [0] * num_tensors
    
    for consumer, producer in dependencies:
        adj[producer].append(consumer)
        prod_adj[consumer].append(producer)
        in_degree[consumer] += 1
        out_degree[producer] += 1
        
    pq = []
    for i in range(num_tensors):
        if in_degree[i] == 0:
            heapq.heappush(pq, i)
            
    active_memory = 0
    peak_memory = 0
    allocated = [False] * num_tensors
    ref_counts = out_degree[:]
    
    while pq:
        curr = heapq.heappop(pq)
        
        # allocate current node
        if not allocated[curr]:
            active_memory += tensor_sizes[curr]
            allocated[curr] = True
            
        peak_memory = max(peak_memory, active_memory)
        
        # free producers if this was their last consumption
        for prod in prod_adj[curr]:
            ref_counts[prod] -= 1
            if ref_counts[prod] == 0 and allocated[prod]:
                active_memory -= tensor_sizes[prod]
                allocated[prod] = False
        
        for nxt in adj[curr]:
            in_degree[nxt] -= 1
            if in_degree[nxt] == 0:
                heapq.heappush(pq, nxt)
                
    return peak_memory
```
- **Test Strategy:** Deterministic topological tie breaker, varying sizes.

### 12. Visualizer Suitability
Highly suitable for visualizing graph traversal and dynamic memory bar charts.

---

## Topic 07: DAG Dynamic Programming, Critical Paths & Tensor Liveness

### 1. Bounded Topic Title and Learning Outcome
**Topic 07: DAG Dynamic Programming, Critical Paths & Tensor Liveness**
**Outcome:** Learners will perform state propagation over DAGs to calculate minimum critical-path latency and identify optimal checkpoint strategies for backpropagation.

### 2. Prerequisites and Outgoing Dependencies
- **Prerequisites:** Topic 06 (DAG Topological Ordering).
- **Outgoing Dependencies:** Topic 09 (Autograd), Topic 29a (Compiler Planning).

### 3. Real DSA/Math Foundations
- **All Paths From Source to Target (LeetCode 797)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. DAG DFS/backtracking.
  - **Transfer Rationale:** Explores multiple dataflow routes.
  - **Source:** [LeetCode 797](https://leetcode.com/problems/all-paths-from-source-to-target/)
- **Longest Flight Route (CSES 1680)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. DP on a DAG.
  - **Transfer Rationale:** Longest latency path (critical path) calculation.
  - **Source:** [CSES 1680](https://cses.fi/problemset/task/1680)

### 4. Focused Variants
- **Parallel Courses III (LeetCode 2050)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. Adding weighted node times.
  - **Transfer Rationale:** Operator latency cost calculation.
  - **Source:** [LeetCode 2050](https://leetcode.com/problems/parallel-courses-iii/)
- **Largest Color Value in a Directed Graph (LeetCode 1857)**
  - **Required:** Optional
  - **Difficulty/Rationale:** Hard. State propagation through a graph.
  - **Transfer Rationale:** Tracking tensor types/shapes across layers.
  - **Source:** [LeetCode 1857](https://leetcode.com/problems/largest-color-value-in-a-directed-graph/)

### 5. Direct ML Bridge
- **Reverse Gradient Accumulation Count**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Reversing Kahn's to find how many downstream operators consume a gradient before it can be resolved.
- **Critical Path Latency Cost Calculation**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. Given kernel times, find bottleneck paths to fuse.

### 6. Named ML-Infrastructure Mechanism
- **Activation Last-Use / Liveness Analysis**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. Identifies the exact topological step a forward tensor can be dropped.

### 7. Stress/Tradeoff Endpoint
- **Gradient Checkpoint / Recompute Decision**
  - **Required:** Optional
  - **Difficulty/Rationale:** Hard. Given a memory budget, choose node dropping to minimize recompute overhead.

### 8. Required vs Optional
All core dataflow tracking problems (LeetCode 797, CSES 1680) are Required.
Largest Color Value in a Directed Graph (LeetCode 1857) is Optional as a more complex graph state tracking exercise.
Gradient Checkpoint / Recompute Decision is Optional as an advanced stress test.

### 9. Difficulty Rationale
Medium for basic path finding and DAG DP. Hard for identifying exact optimal memory drops and balancing recomputation, as these require full topological state awareness.

### 10. Canonical Source Mappings
- **LeetCode 797:** https://leetcode.com/problems/all-paths-from-source-to-target/
- **CSES 1680:** https://cses.fi/problemset/task/1680
- **LeetCode 2050:** https://leetcode.com/problems/parallel-courses-iii/
- **LeetCode 1857:** https://leetcode.com/problems/largest-color-value-in-a-directed-graph/

### 11. Complete Custom Problem Contracts
**Custom Exercise: Activation Last-Use / Liveness Analysis**
- **Contract ID:** CONTRACT-TOPIC-07-LIVENESS
- **Type:** Custom mechanism.
- **Inputs:** `nodes: List[int]`, `edges: List[Tuple[int, int]]`.
- **Outputs:** `last_use_step: Dict[int, int]` mapping node to the topological step it can be freed.
- **Constraints:** Number of nodes < 10^5, DAG guaranteed.
- **Tolerance/Ties:** Exact step match based on Kahn's algorithm order.
- **Reference Example 1:** Graph A->B, B->C, A->C. A is used by B and C. A's last use is the step where C is computed.
- **Python Implementation:**
```python
from collections import deque

def activation_liveness(nodes: list[int], edges: list[tuple[int, int]]) -> dict[int, int]:
    num_nodes = len(nodes)
    adj = {node: [] for node in nodes}
    in_degree = {node: 0 for node in nodes}
    
    for u, v in edges:
        adj[u].append(v)
        in_degree[v] += 1
        
    q = deque()
    # Tie break by smallest node ID for deterministic Kahn's
    zero_in = sorted([n for n in nodes if in_degree[n] == 0])
    for node in zero_in:
        q.append(node)
        
    topo_order = []
    while q:
        curr = q.popleft()
        topo_order.append(curr)
        next_nodes = []
        for nxt in adj[curr]:
            in_degree[nxt] -= 1
            if in_degree[nxt] == 0:
                next_nodes.append(nxt)
        for nxt in sorted(next_nodes):
            q.append(nxt)
            
    step_map = {node: i for i, node in enumerate(topo_order)}
    last_use_step = {}
    
    for u in nodes:
        if not adj[u]:
            last_use_step[u] = step_map[u]
        else:
            last_use_step[u] = max(step_map[v] for v in adj[u])
            
    return last_use_step
```
- **Test Strategy:** Provide varied DAGs, check memory release step indices.

### 12. Visualizer Suitability
Excellent for visualizing timeline/Gantt charts of memory allocations and deallocations during the forward and backward passes.

---

## Topic 08: Expression Parsing, AST Construction & Operator IR Trees

### 1. Bounded Topic Title and Learning Outcome
**Topic 08: Expression Parsing, AST Construction & Operator IR Trees**
**Outcome:** Learners will parse mathematical strings into typed operator trees, perform constant folding and dead-node elimination, and serialize the AST into a linear execution tape.

### 2. Prerequisites and Outgoing Dependencies
- **Prerequisites:** Topic 06.
- **Outgoing Dependencies:** Topic 09, Topic 29a.

### 3. Real DSA/Math Foundations
- **Evaluate Reverse Polish Notation (LeetCode 150)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Evaluates post-fix tapes.
  - **Transfer Rationale:** Lowered stack machine evaluation.
  - **Source:** [LeetCode 150](https://leetcode.com/problems/evaluate-reverse-polish-notation/)
- **Basic Calculator (LeetCode 224)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. Infix parsing.
  - **Transfer Rationale:** String to operator precedence.
  - **Source:** [LeetCode 224](https://leetcode.com/problems/basic-calculator/)

### 4. Focused Variants
- **Design an Expression Tree With Evaluate Function (LeetCode 1628)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Abstract Syntax Tree construction.
  - **Transfer Rationale:** Operator IR frontend representation.
  - **Source:** [LeetCode 1628](https://leetcode.com/problems/design-an-expression-tree-with-evaluate-function/)

### 5. Direct ML Bridge
- **Build Typed Operator Graph & Shape Inference**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Passes tensor shapes instead of values through the AST.

### 6. Named ML-Infrastructure Mechanism
- **Operator IR Optimization Passes (CSE, Constant Folding, Dead Node)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. Walk the AST to eliminate redundancy.

### 7. Stress/Tradeoff Endpoint
- **Serialize Operator Tape for Autograd**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. Flattens the optimized AST into a reverse-topological backward-pass tape.

### 11. Complete Custom Problem Contracts
**Custom Exercise: Serialize Operator Tape for Autograd**
- **Contract ID:** CONTRACT-TOPIC-08-AST
- **Type:** Custom mechanism.
- **Inputs:** A parsed Abstract Syntax Tree (AST) of mathematical operators.
- **Outputs:** A linear list of operations ordered for forward execution, with backward pass mapping.
- **Constraints:** Max depth of tree 1000.
- **Tolerance/Ties:** Exact operator order match.
- **Reference Example 1:** `(A + B) * C` -> `T1 = A + B`, `T2 = T1 * C`.
- **Python Implementation:**
```python
class ASTNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def serialize_tape(root: ASTNode) -> list[str]:
    tape = []
    counter = 1
    
    def post_order(node: ASTNode) -> str:
        nonlocal counter
        if not node.left and not node.right:
            return str(node.val)
            
        left_val = post_order(node.left)
        right_val = post_order(node.right)
        
        reg = f"T{counter}"
        counter += 1
        tape.append(f"{reg} = {left_val} {node.val} {right_val}")
        return reg
        
    post_order(root)
    return tape
```
- **Test Strategy:** Evaluate standard mathematical expressions and verify the generated tape executes correctly.

---

## Topic 09: Multivariable Calculus, Computational DAGs, VJPs & Autograd Engines

### 1. Bounded Topic Title and Learning Outcome
**Topic 09: Multivariable Calculus, Computational DAGs, VJPs & Autograd Engines**
**Outcome:** Learners will derive Vector-Jacobian Products (VJPs) and implement a minimal reverse-mode automatic differentiation engine supporting accumulation at fan-out nodes.

### 2. Prerequisites and Outgoing Dependencies
- **Prerequisites:** Topic 08 (AST/Tape), Topic 02 (Tensor Broadcasting).
- **Outgoing Dependencies:** Topic 10 (Loss).

### 3. Real DSA/Math Foundations
- **Scalar Derivatives & Local Chain Rule**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Analytical scalar derivations.

### 4. Focused Variants
- **Reverse Topological Traversal with Fan-out Accumulation**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Summing gradients properly in a DAG.

### 5. Direct ML Bridge
- **Vector-Jacobian Products (VJPs)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. VJPs for add/mul/matmul/reduce/reshape.

### 6. Named ML-Infrastructure Mechanism
- **Minimal Autograd Engine (MicroGrad-style)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. End-to-end backward pass execution on a tape.
  - **Primary Reference:** [MicroGrad (Karpathy)](https://github.com/karpathy/micrograd)

### 7. Stress/Tradeoff Endpoint
- **Higher-Order Derivatives & Double Backward**
  - **Required:** Optional
  - **Difficulty/Rationale:** Hard. Extending the tape to differentiate the backward pass itself.

### 11. Complete Custom Problem Contracts
**Custom Exercise: Minimal Autograd Backward**
- **Contract ID:** CONTRACT-TOPIC-09-AUTOGRAD
- **Type:** Custom mechanism (Library API testing approach).
- **Inputs:** Programmatic execution of `Node(val, ops)` leading to a single scalar loss.
- **Outputs:** Gradients of leaf nodes.
- **Constraints:** Graph depth < 1000. Ops: +, *, relu, sum.
- **Tolerance/Ties:** Floating point precision $1e-5$.
- **Reference Example 1:** $f(x, y) = x \times y + x$, x=2, y=3. df/dx = y+1 = 4. df/dy = x = 2.
- **Reference Example 2:** Fan-out $z = x \times x$. df/dx = 2x.
- **Python Implementation:**
```python
class Node:
    def __init__(self, val, children=None, op=''):
        self.val = val
        self.children = children or []
        self.op = op
        self.grad = 0.0
        self._backward = lambda: None

    def __add__(self, other):
        other = other if isinstance(other, Node) else Node(other)
        out = Node(self.val + other.val, [self, other], '+')

        def _backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Node) else Node(other)
        out = Node(self.val * other.val, [self, other], '*')

        def _backward():
            self.grad += other.val * out.grad
            other.grad += self.val * out.grad
        out._backward = _backward
        return out

    def backward(self):
        topo = []
        visited = set()
        
        def build_topo(v):
            if v not in visited:
                visited.add(v)
                for child in v.children:
                    build_topo(child)
                topo.append(v)
        
        build_topo(self)
        self.grad = 1.0
        for v in reversed(topo):
            v._backward()
```
- **Test Strategy:** Evaluate standard complex polynomials and assert gradient correctness against analytical forms using `gradcheck`.

---

## Topic 10: Loss Functions & Probability Mathematics

### 1. Bounded Topic Title and Learning Outcome
**Topic 10: Loss Functions & Probability Mathematics**
**Outcome:** Learners will compute probability normalizations, Cross-Entropy loss, and analytical gradients, preparing for stable logits/softmax and sampling techniques.

### 2. Prerequisites and Outgoing Dependencies
- **Prerequisites:** Topic 09 (Autograd).
- **Outgoing Dependencies:** Topic 11, Topic 12, Topic 13.

### 3. Real DSA/Math Foundations
- **Probability Normalization, Expected Value, Variance**
  - **Required:** Yes
  - **Difficulty/Rationale:** Easy. Fundamental probability.

### 4. Focused Variants
- **MSE Loss & Analytical Gradients**
  - **Required:** Yes
  - **Difficulty/Rationale:** Easy. Forward/backward implementation.

### 5. Direct ML Bridge
- **Binary & Multiclass Cross-Entropy Loss & NLL**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Handling logs securely.

### 6. Named ML-Infrastructure Mechanism
- **Information Entropy & KL Divergence**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Core objective distributions.

### 7. Stress/Tradeoff Endpoint
- **Focal Loss Modulating Factor**
  - **Required:** Optional
  - **Difficulty/Rationale:** Hard. Adding $(1-p_t)^\gamma$ safely.

### 11. Complete Custom Problem Contracts
**Custom Exercise: Binary & Multiclass Cross-Entropy Loss**
- **Contract ID:** CONTRACT-TOPIC-10-LOSS
- **Type:** Custom mechanism.
- **Inputs:** `logits: List[float]`, `targets: List[int]`.
- **Outputs:** Scalar loss value and `grad_logits: List[float]`.
- **Constraints:** `logits` length $< 10^5$.
- **Tolerance/Ties:** $1e-5$ float precision.
- **Reference Example 1:** `logits=[0.0, 0.0]`, `targets=[1, 0]`. Loss = 0.6931, grads=[0.5, -0.5].
- **Python Implementation:**
```python
import math

def cross_entropy_loss_and_grad(logits: list[float], targets: list[int]) -> tuple[float, list[float]]:
    max_l = max(logits)
    exps = [math.exp(l - max_l) for l in logits]
    sum_exps = sum(exps)
    probs = [e / sum_exps for e in exps]
    
    loss = 0.0
    grads = []
    for p, t in zip(probs, targets):
        loss -= t * math.log(p + 1e-12)
        grads.append(p - t)
        
    return loss, grads
```
- **Test Strategy:** Compare forward loss and analytical gradients against PyTorch reference.

---

## Topic 11: LogSumExp, Stable Softmax & Numerical Reductions

### 1. Bounded Topic Title and Learning Outcome
**Topic 11: LogSumExp, Stable Softmax & Numerical Reductions**
**Outcome:** Learners will implement numerically stable exponentiation summations and the exact FlashAttention online softmax state update to prevent catastrophic cancellation and overflow.

### 2. Prerequisites and Outgoing Dependencies
- **Prerequisites:** Topic 10 (Loss Math), Topic 04 (FP Precision).
- **Outgoing Dependencies:** Topic 12, Topic 28.

### 3. Real DSA/Math Foundations
- **Topic 04 Numerical Reductions & Topic 10 Probability Normalization (Prerequisite Review)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Direct foundation for handling sum of exponentials stably.
  - **Transfer Rationale:** Replacing word-level Pow(x,n) with actual summation stability and normalization basics.
- **Direct Stable LogSumExp Exercise**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Implementing $m + \log(\sum e^{x_i - m})$.
  - **Transfer Rationale:** Core algorithmic operation to avoid numerical overflow when dealing with exponents of logits.

### 4. Focused Variants
- **Stable LogSumExp & Stable Softmax**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Max-subtraction identity.

### 5. Direct ML Bridge
- **Fused Log-Softmax Cross-Entropy Loss**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. Combining ops to avoid dividing by probabilities entirely.

### 6. Named ML-Infrastructure Mechanism
- **Online Softmax State Update & Merge (FlashAttention math)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. Milakov & Gimelshein 2018 online normalizer.
  - **Primary Reference:** [Online normalizer calculation for softmax (Milakov & Gimelshein, 2018)](https://arxiv.org/abs/1805.02867)

### 7. Stress/Tradeoff Endpoint
- **Block-wise FlashAttention Rescaling (Matrix Level)**
  - **Required:** Optional
  - **Difficulty/Rationale:** Hard. Applying the online normalizer across tiled matrix multiplications in GPU SRAM.

### 11. Complete Custom Problem Contracts
**Custom Exercise: Online Softmax State Update**
- **Contract ID:** CONTRACT-TOPIC-11-ONLINE-SOFTMAX
- **Type:** Custom mechanism.
- **Description:** Implement the online normalizer calculation that processes vectors block-by-block, maintaining a running max, running normalizer sum, and a rescalable output accumulator.
- **Inputs:** `blocks: List[List[float]]`.
- **Outputs:** Final softmax normalized vector, correctly rescaled across all blocks.
- **Constraints:** Number of elements per block $< 1000$. Elements range $[-1e4, 1e4]$.
- **Tolerance/Ties:** Floating point precision within $1e-5$ of exact stable softmax.
- **Reference Example 1:** `[[1.0, 2.0], [3.0, 4.0]]`. Max update: block1 max=2.0. block2 max=4.0. Rescale factor for block1 is $e^{2.0 - 4.0}$.
- **Reference Example 2:** `[[-1000.0, -999.0], [-998.0]]`. Output prevents `inf` and `nan`.
- **Python Implementation:**
```python
import math

def online_softmax(blocks: list[list[float]]) -> list[float]:
    m = -float('inf')
    l = 0.0
    
    # Store block local maxes and local unnormalized exps to ensure linear complexity O(N).
    block_maxes = []
    block_exps = []
    
    for block in blocks:
        if not block:
            block_maxes.append(-float('inf'))
            block_exps.append([])
            continue
            
        block_max = max(block)
        m_new = max(m, block_max)
        
        # Rescale the accumulated normalizer
        scale_prev = math.exp(m - m_new) if m != -float('inf') else 0.0
        l = scale_prev * l
        
        curr_unnormalized = [math.exp(x - block_max) for x in block]
        
        # We scale the new block's sum by its relative max instead of rescaling all old blocks
        block_l = sum(curr_unnormalized)
        scale_curr = math.exp(block_max - m_new) if block_max != -float('inf') else 0.0
        l += scale_curr * block_l
        
        m = m_new
        block_maxes.append(block_max)
        block_exps.append(curr_unnormalized)
        
    flat_out = []
    for b_max, b_exps in zip(block_maxes, block_exps):
        if not b_exps:
            continue
        scale = math.exp(b_max - m) / l if l != 0 else 0.0
        flat_out.extend([val * scale for val in b_exps])
        
    return flat_out
```
- **Test Strategy:** Compare chunked online execution output against standard `math.exp` full softmax over concatenated inputs.

---

## Topic 12: Prefix Sums, Categorical Sampling & Decoding Filters

### 1. Bounded Topic Title and Learning Outcome
**Topic 12: Prefix Sums, Categorical Sampling & Decoding Filters**
**Outcome:** Learners will generate probability distributions and apply temperature, Top-K, and Top-P (Nucleus) filters to sample tokens autoregressively.

### 2. Prerequisites and Outgoing Dependencies
- **Prerequisites:** Topic 10 (Probability), Topic 11 (Stable Softmax).
- **Outgoing Dependencies:** Inference Topics.

### 3. Real DSA/Math Foundations
- **Range Sum Query (LeetCode 303)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Easy. Core prefix sum concept.
  - **Source:** [LeetCode 303](https://leetcode.com/problems/range-sum-query-immutable/)

### 4. Focused Variants
- **Random Pick with Weight (LeetCode 528)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Uses prefix sum + binary search for categorical sampling.
  - **Source:** [LeetCode 528](https://leetcode.com/problems/random-pick-with-weight/)

### 5. Direct ML Bridge
- **Temperature Scaling & Uniform Selection**
  - **Required:** Yes
  - **Difficulty/Rationale:** Easy. Modifying logits via $x/T$ before softmax.

### 6. Named ML-Infrastructure Mechanism
- **Top-K & Top-P (Nucleus) Sampling**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. Filtering distributions dynamically.

### 7. Stress/Tradeoff Endpoint
- **Beam Search with Length Penalty**
  - **Required:** Optional
  - **Difficulty/Rationale:** Hard. Expanding state tree rather than greedy/stochastic sampling.

### 11. Complete Custom Problem Contracts
**Custom Exercise: Top-P Sampling**
- **Contract ID:** CONTRACT-TOPIC-12-NUCLEUS
- **Type:** Custom mechanism.
- **Inputs:** `logits: List[float]`, `p: float` ($0.0 \le p \le 1.0$).
- **Outputs:** Valid probability vector (zeroed out beyond top-P).
- **Constraints:** exact `>= p` cutoff logic. The smallest set of most probable tokens whose cumulative probability exceeds or equals `p`. If `p=0`, it strictly returns the argmax.
- **Tolerance/Ties:** Floating point sum precision $1e-6$.
- **Reference Example 1:** `logits=[1, 2, 3, 4]`, `p=0.9`. Softmax: `[0.03, 0.09, 0.24, 0.64]`. Sorted descending: `0.64, 0.24, 0.09, 0.03`. Cumulative: `0.64, 0.88, 0.97, 1.0`. Threshold 0.9 reached at index 2 (val 0.24). Zero out 0.03. Re-normalize.
- **Reference Example 2:** `p=0` -> Returns absolute max token prob=1.0, rest 0.0.
- **Python Implementation:**
```python
import math

def top_p_sampling(logits: list[float], p: float) -> list[float]:
    if p == 0.0:
        max_l = max(logits)
        return [1.0 if l == max_l else 0.0 for l in logits]
        
    max_l = max(logits)
    exps = [math.exp(l - max_l) for l in logits]
    sum_exps = sum(exps)
    probs = [e / sum_exps for e in exps]
    
    sorted_probs = sorted(enumerate(probs), key=lambda x: x[1], reverse=True)
    
    cumulative = 0.0
    mask = [False] * len(probs)
    
    for idx, prob in sorted_probs:
        mask[idx] = True
        cumulative += prob
        if cumulative >= p:
            break
            
    filtered_probs = [probs[i] if mask[i] else 0.0 for i in range(len(probs))]
    filtered_sum = sum(filtered_probs)
    
    if filtered_sum > 0:
        return [f / filtered_sum for f in filtered_probs]
    return [0.0] * len(logits)
```
- **Test Strategy:** Prefix-sum tracking over sorted probabilities and boolean masking verification.

---

## Topic 13: Optimizers & Training-Loop State

### 1. Bounded Topic Title and Learning Outcome
**Topic 13: Optimizers & Training-Loop State**
**Outcome:** Learners will implement exact PyTorch-compliant optimizers including AdamW (with decoupled weight decay), maintaining gradient moments and stepping parameters correctly.

### 2. Prerequisites and Outgoing Dependencies
- **Prerequisites:** Topic 09 (Autograd), Topic 10 (Loss).
- **Outgoing Dependencies:** Topic 27 (Distributed Ring AllReduce).

### 3. Real DSA/Math Foundations
- **Running Average & Momentum Tracking**
  - **Required:** Yes
  - **Difficulty/Rationale:** Easy. Exponential moving average arrays.

### 4. Focused Variants
- **Basic SGD with Momentum**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. State persistence across iterations.

### 5. Direct ML Bridge
- **Adam (Adaptive Moment Estimation)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. Bias correction and dual moments.

### 6. Named ML-Infrastructure Mechanism
- **AdamW Step (PyTorch Exact Specification)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Hard. PyTorch update order with decoupled weight decay.
  - **Primary Reference:** [PyTorch AdamW Documentation](https://docs.pytorch.org/docs/main/generated/torch.optim.AdamW.html)

### 7. Stress/Tradeoff Endpoint
- **ZeRO-1 Optimizer State Sharding**
  - **Required:** Optional
  - **Difficulty/Rationale:** Hard. Distributing optimizer momentum and variance states across multiple devices to save memory.

### 11. Complete Custom Problem Contracts
**Custom Exercise: AdamW Step**
- **Contract ID:** CONTRACT-TOPIC-13-ADAMW
- **Type:** Custom mechanism.
- **Description:** Implement a single optimization step matching PyTorch `torch.optim.AdamW`.
- **Inputs:** `params: List[float]`, `grads: List[float]`, `exp_avg: List[float]`, `exp_avg_sq: List[float]`, `step: int`, `lr: float=1e-3`, `beta1: float=0.9`, `beta2: float=0.999`, `eps: float=1e-8`, `weight_decay: float=0.01`.
- **Outputs:** Tuple of updated `(params, exp_avg, exp_avg_sq)`.
- **Constraints:** Strict adherence to exact update order: Apply decoupled weight decay to parameter *before* the moment updates and step calculation.
- **Tolerance/Ties:** Floating point precision $1e-6$ against PyTorch tensor math.
- **Reference Example 1:** Scalar case `param=1.0`, `grad=0.1`, `step=1`.
- **Reference Example 2:** Vector case with `weight_decay=0.1`.
- **Python Implementation:**
```python
def adamw_step(param, grad, exp_avg, exp_avg_sq, step, lr=1e-3, beta1=0.9, beta2=0.999, eps=1e-8, weight_decay=0.01):
    # PyTorch decoupled weight decay happens first
    param = param - lr * weight_decay * param
    
    # Decay the first and second moment running average coefficient
    exp_avg = beta1 * exp_avg + (1 - beta1) * grad
    exp_avg_sq = beta2 * exp_avg_sq + (1 - beta2) * (grad * grad)
    
    # Bias corrections
    bias_correction1 = 1 - beta1 ** step
    bias_correction2 = 1 - beta2 ** step
    
    step_size = lr / bias_correction1
    denom = (exp_avg_sq ** 0.5) / (bias_correction2 ** 0.5) + eps
    
    # Final step
    param = param - step_size * (exp_avg / denom)
    
    return param, exp_avg, exp_avg_sq
```
- **Test Strategy:** Compare output arrays directly against instantiated `torch.optim.AdamW` stepped once on standard vectors.

---
*End of Domain 02 Repair Pass.*
