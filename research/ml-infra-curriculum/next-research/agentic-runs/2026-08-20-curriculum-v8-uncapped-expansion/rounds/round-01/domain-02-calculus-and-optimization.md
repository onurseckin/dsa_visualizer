# Domain 02: Calculus & Optimization

## Topic 05: Finite Differences & Numerical Jacobians

### Part A: LeetCode Problems
1. [Evaluate Reverse Polish Notation](https://leetcode.com/problems/evaluate-reverse-polish-notation/)
2. [Basic Calculator](https://leetcode.com/problems/basic-calculator/)
3. [Find Peak Element](https://leetcode.com/problems/find-peak-element/)

### Part B: Mathematical Proofs
1. Prove that the central difference method has an error of $O(h^2)$, while forward difference has an error of $O(h)$.
2. Show that numerical differentiation is highly sensitive to catastrophic cancellation for very small $h$ in floating-point representation.

### Part C: ML Systems Questions
1. When debugging custom CUDA autograd kernels, how is numerical gradient checking (gradcheck) implemented using finite differences?
2. What are the performance trade-offs of using numerical Jacobians versus analytical Jacobians via reverse-mode autodiff?

### Part D: Edge Cases / Stress Tests
1. Highly non-linear functions where finite difference fails to approximate local gradients accurately.
2. Step functions or functions with discontinuous derivatives (e.g., ReLU at 0).

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-05`
```python
def compute_jacobian(f, x, h=1e-5):
    """
    Computes the numerical Jacobian of a vector-valued function f at vector x using central differences.
    Returns a list of lists representing the Jacobian matrix.
    """
    n = len(x)
    # Get the output dimension
    fx = f(x)
    m = len(fx)
    
    jacobian = [[0.0] * n for _ in range(m)]
    
    for j in range(n):
        x_plus = list(x)
        x_minus = list(x)
        x_plus[j] += h
        x_minus[j] -= h
        
        f_plus = f(x_plus)
        f_minus = f(x_minus)
        
        for i in range(m):
            jacobian[i][j] = (f_plus[i] - f_minus[i]) / (2 * h)
            
    return jacobian
```

## Topic 06: Scalar Autograd Engine

### Part A: LeetCode Problems
1. [Design a Graph With Shortest Path Calculator](https://leetcode.com/problems/design-a-graph-with-shortest-path-calculator/) (Topological sort analogy)
2. [Course Schedule](https://leetcode.com/problems/course-schedule/)
3. [Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/)
4. [Clone Graph](https://leetcode.com/problems/clone-graph/)

### Part B: Mathematical Proofs
1. Prove the chain rule of calculus over computational graphs (multivariable chain rule).
2. Prove that reverse-mode automatic differentiation computes the gradient of a scalar output with respect to $N$ inputs in a single backward pass, taking $O(1)$ times the forward pass cost.

### Part C: ML Systems Questions
1. How does PyTorch construct a dynamic computational graph during the forward pass? Compare this with static graph construction in TensorFlow v1 or XLA.
2. Why must gradients be explicitly zeroed out (e.g., `optimizer.zero_grad()`) in most deep learning frameworks?

### Part D: Edge Cases / Stress Tests
1. Re-using the same node multiple times in the graph (handling accumulating gradients).
2. Empty graphs or operations with no dependencies.
3. In-place operations and their effect on gradient tracking.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-06`
```python
class Value:
    """
    A simple scalar autograd engine tracking computation graphs.
    """
    def __init__(self, data, _children=(), _op=''):
        self.data = data
        self.grad = 0.0
        self._backward = lambda: None
        self._prev = set(_children)
        self._op = _op

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), '+')

        def _backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _backward

        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), '*')

        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = _backward

        return out

    def backward(self):
        topo = []
        visited = set()
        def build_topo(v):
            if v not in visited:
                visited.add(v)
                for child in v._prev:
                    build_topo(child)
                topo.append(v)
        build_topo(self)

        self.grad = 1.0
        for v in reversed(topo):
            v._backward()
```

## Topic 07: AdamW Optimizer Step

### Part A: LeetCode Problems
1. [Moving Average from Data Stream](https://leetcode.com/problems/moving-average-from-data-stream/) (Analogy to EMA of gradients)
2. [Design Tic-Tac-Toe](https://leetcode.com/problems/design-tic-tac-toe/) (State management)
3. [Insert Delete GetRandom O(1)](https://leetcode.com/problems/insert-delete-getrandom-o1/)

### Part B: Mathematical Proofs
1. Prove the bias-correction factors in Adam ($\hat{m}_t$ and $\hat{v}_t$) ensure that the moving averages are unbiased estimates of the first and second moments.
2. Show mathematically why AdamW (decoupled weight decay) is inequivalent to L2 regularization (Adam with L2 penalty) for adaptive gradient methods.

### Part C: ML Systems Questions
1. In distributed training strategies like ZeRO, optimizer states (like Adam's momentum) dominate memory usage. How much memory per parameter does Adam require?
2. How is Adam implemented efficiently as a fused CUDA kernel to minimize memory bandwidth bottlenecks?

### Part D: Edge Cases / Stress Tests
1. $t=0$ or $t=1$ startup steps (ensuring correct bias correction).
2. Gradient sparsity: applying Adam updates to sparse embeddings.
3. Extreme learning rates or epsilon values (preventing division by zero).

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-07`
```python
import math

def adamw_step(params, grads, m, v, t, lr, betas, eps, weight_decay):
    """
    Performs a single AdamW optimization step on a list of parameters.
    Updates params, m, and v in-place.
    """
    beta1, beta2 = betas
    for i in range(len(params)):
        # Decoupled weight decay
        params[i] -= lr * weight_decay * params[i]
        
        # Update biased first moment estimate
        m[i] = beta1 * m[i] + (1 - beta1) * grads[i]
        # Update biased second raw moment estimate
        v[i] = beta2 * v[i] + (1 - beta2) * (grads[i] ** 2)
        
        # Compute bias-corrected first moment estimate
        m_hat = m[i] / (1 - beta1 ** t)
        # Compute bias-corrected second raw moment estimate
        v_hat = v[i] / (1 - beta2 ** t)
        
        # Update parameters
        params[i] -= lr * m_hat / (math.sqrt(v_hat) + eps)
```

## Topic 08: Stable Softmax & Cross-Entropy

### Part A: LeetCode Problems
1. [Maximum Subarray](https://leetcode.com/problems/maximum-subarray/) (Log-sum-exp stability analogy)
2. [Continuous Subarray Sum](https://leetcode.com/problems/continuous-subarray-sum/)
3. [Decode Ways](https://leetcode.com/problems/decode-ways/)

### Part B: Mathematical Proofs
1. Prove that subtracting a constant $C$ from all logits does not change the output probabilities of the Softmax function.
2. Derive the gradient of the Cross-Entropy Loss with respect to the input logits, showing it simplifies to $P_i - Y_i$ where $P_i$ is the softmax probability and $Y_i$ is the one-hot target.

### Part C: ML Systems Questions
1. Why is Softmax and Cross-Entropy typically fused into a single operation in modern DL frameworks (e.g., `F.cross_entropy` in PyTorch)?
2. How does the max-subtraction trick prevent numerical overflow when computing exponents of large positive logits in FP16?

### Part D: Edge Cases / Stress Tests
1. Extremely large positive or negative logits (overflow/underflow prevention).
2. Uniform logits (should result in equal probabilities and max entropy).

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-08`
```python
import math

def stable_cross_entropy(logits, target_idx):
    """
    Computes the stable cross-entropy loss for a single example given a list of logits and a target index.
    Returns the scalar loss.
    """
    if not logits:
        return 0.0
        
    max_logit = max(logits)
    
    # Compute exp(x - max) and log-sum-exp
    sum_exp = 0.0
    for x in logits:
        sum_exp += math.exp(x - max_logit)
        
    log_sum_exp = math.log(sum_exp)
    
    # Loss is -log(softmax(logits)[target_idx])
    # = -(logits[target_idx] - max_logit - log_sum_exp)
    loss = - (logits[target_idx] - max_logit - log_sum_exp)
    
    return loss
```
