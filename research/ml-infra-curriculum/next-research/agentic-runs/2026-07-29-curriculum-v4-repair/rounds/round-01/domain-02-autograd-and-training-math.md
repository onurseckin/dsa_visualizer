# Domain 02: Autograd and Training Mathematics (Topics 06–13)

**Version 4 Repair Output**

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
- **Type:** Custom mechanism.
- **Inputs:** `num_tensors: int`, `dependencies: List[Tuple[int, int]]` (consumer, producer). `tensor_sizes: List[int]`.
- **Outputs:** `max_peak_memory: int`.
- **Constraints:** `num_tensors < 10^4`, `sum(tensor_sizes) < 2^31`.
- **Tolerance/Ties:** Tie break processing ready nodes via smallest ID first.
- **Reference Example 1:** (0->1, size: 10, 10) -> Peak 20.
- **Reference Example 2:** (0->1, 0->2, 1->3, 2->3, sizes 10 each) -> Peak memory simulation.
- **Python Implementation:** (omitted for brevity, requires in-degree counting, releasing memory when out-degree consumers all executed).
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

### 8-12. Extrapolated (similar full specs as Topic 06)

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

### 11. Complete Custom Problem Contracts
**Custom Exercise: Minimal Autograd Backward**
- **Type:** Custom mechanism (Library API testing approach).
- **Inputs:** Programmatic execution of `Node(val, ops)` leading to a single scalar loss.
- **Outputs:** Gradients of leaf nodes.
- **Constraints:** Graph depth < 1000. Ops: +, *, relu, sum.
- **Tolerance/Ties:** Floating point precision $1e-5$.
- **Reference Example 1:** $f(x, y) = x \times y + x$, x=2, y=3. df/dx = y+1 = 4. df/dy = x = 2.
- **Reference Example 2:** Fan-out $z = x \times x$. df/dx = 2x.
- **Python Implementation:** (Requires Node class with `.grad`, `.backward()`, reverse topological sorting).
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

---

## Topic 11: LogSumExp, Stable Softmax & Numerical Reductions

### 1. Bounded Topic Title and Learning Outcome
**Topic 11: LogSumExp, Stable Softmax & Numerical Reductions**
**Outcome:** Learners will implement numerically stable exponentiation summations and the exact FlashAttention online softmax state update to prevent catastrophic cancellation and overflow.

### 2. Prerequisites and Outgoing Dependencies
- **Prerequisites:** Topic 10 (Loss Math), Topic 04 (FP Precision).
- **Outgoing Dependencies:** Topic 12, Topic 28.

### 3. Real DSA/Math Foundations
- **Pow(x, n) (LeetCode 50)**
  - **Required:** Yes
  - **Difficulty/Rationale:** Medium. Floating-point behavior basics.
  - **Source:** [LeetCode 50](https://leetcode.com/problems/powx-n/)

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

### 11. Complete Custom Problem Contracts
**Custom Exercise: Online Softmax State Update**
- **Type:** Custom mechanism.
- **Description:** Implement the online normalizer calculation that processes vectors block-by-block, maintaining a running max, running normalizer sum, and a rescalable output accumulator.
- **Inputs:** `blocks: List[List[float]]`.
- **Outputs:** Final softmax normalized vector, correctly rescaled across all blocks.
- **Constraints:** Number of elements per block $< 1000$. Elements range $[-1e4, 1e4]$.
- **Tolerance/Ties:** Floating point precision within $1e-5$ of exact stable softmax.
- **Reference Example 1:** `[[1.0, 2.0], [3.0, 4.0]]`. Max update: block1 max=2.0. block2 max=4.0. Rescale factor for block1 is $e^{2.0 - 4.0}$.
- **Reference Example 2:** `[[-1000.0, -999.0], [-998.0]]`. Output prevents `inf` and `nan`.
- **Python Reference Implementation:**
```python
import math

def online_softmax(blocks):
    m = -float('inf')
    l = 0.0
    # Store rescaled unnormalized exponential vectors
    unnormalized_rescaled_blocks = []
    
    for block in blocks:
        block_max = max(block)
        m_new = max(m, block_max)
        
        # Rescale prior normalizer accumulator and prior unnormalized outputs
        scale_prev = math.exp(m - m_new) if m != -float('inf') else 0.0
        l = scale_prev * l
        
        rescaled_prev = []
        for prev_b in unnormalized_rescaled_blocks:
            rescaled_prev.append([val * scale_prev for val in prev_b])
        unnormalized_rescaled_blocks = rescaled_prev
        
        # Calculate current block unnormalized exps
        curr_unnormalized = [math.exp(x - m_new) for x in block]
        l += sum(curr_unnormalized)
        unnormalized_rescaled_blocks.append(curr_unnormalized)
        m = m_new
        
    # Final normalization step across all rescaled blocks
    flat_out = []
    for b in unnormalized_rescaled_blocks:
        flat_out.extend([val / l for val in b])
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

### 11. Complete Custom Problem Contracts
**Custom Exercise: Top-P Sampling**
- **Type:** Custom mechanism.
- **Inputs:** `logits: List[float]`, `p: float` ($0.0 \le p \le 1.0$).
- **Outputs:** Valid probability vector (zeroed out beyond top-P).
- **Constraints:** exact `>= p` cutoff logic. The smallest set of most probable tokens whose cumulative probability exceeds or equals `p`. If `p=0`, it strictly returns the argmax.
- **Tolerance/Ties:** Floating point sum precision $1e-6$.
- **Reference Example 1:** `logits=[1, 2, 3, 4]`, `p=0.9`. Softmax: `[0.03, 0.09, 0.24, 0.64]`. Sorted descending: `0.64, 0.24, 0.09, 0.03`. Cumulative: `0.64, 0.88, 0.97, 1.0`. Threshold 0.9 reached at index 2 (val 0.24). Zero out 0.03. Re-normalize.
- **Reference Example 2:** `p=0` -> Returns absolute max token prob=1.0, rest 0.0.
- **Python Implementation:** Exact prefix-sum tracking over sorted probabilities and boolean masking.

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

### 11. Complete Custom Problem Contracts
**Custom Exercise: AdamW Step**
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
def adamw_step(param, grad, exp_avg, exp_avg_sq, step, lr, beta1, beta2, eps, weight_decay):
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
