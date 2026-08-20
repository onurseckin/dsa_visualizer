# Domain 5: Deep Learning and Activations

## Topic 19: Multi-Layer Perceptron (MLP) Forward and Backward Pass

### Part A: Problem Solving
- [LeetCode 120: Triangle](https://leetcode.com/problems/triangle/)
- [LeetCode 198: House Robber](https://leetcode.com/problems/house-robber/)
- [LeetCode 256: Paint House](https://leetcode.com/problems/paint-house/)

### Part B: Mathematical Proofs
1. Prove the chain rule applied to a 2-layer MLP with ReLU activation.
2. Prove that gradient descent with a sufficiently small learning rate decreases the loss for convex functions.

### Part C: ML Systems Questions
1. How does batched matrix multiplication improve hardware utilization compared to unbatched?
2. What are the memory bandwidth implications of large linear layers in LLMs?

### Part D: Edge Cases / Stress Tests
1. Learning rate set too high (gradient explosion).
2. Zero initialization of weights (symmetry breaking failure).

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-19`
```python
import numpy as np

def mlp_forward_backward_step(x, W, target, lr):
    # x: (1, D_in), W: (D_in, D_out), target: (1, D_out)
    # Simple linear layer without bias, MSE loss
    out = np.dot(x, W)
    loss = np.sum((out - target) ** 2)
    grad_out = 2 * (out - target)
    grad_W = np.dot(x.T, grad_out)
    W_new = W - lr * grad_W
    return W_new, loss
```

## Topic 20: Online Softmax

### Part A: Problem Solving
- [LeetCode 384: Shuffle an Array](https://leetcode.com/problems/shuffle-an-array/)
- [LeetCode 398: Random Pick Index](https://leetcode.com/problems/random-pick-index/)
- [LeetCode 528: Random Pick with Weight](https://leetcode.com/problems/random-pick-with-weight/)

### Part B: Mathematical Proofs
1. Prove that the online softmax algorithm computes the exact same probability distribution as standard softmax.
2. Show that subtracting the maximum value before exponentiation does not change the softmax output, preventing numerical overflow.

### Part C: ML Systems Questions
1. How does online softmax help in FlashAttention?
2. Why is numerical stability critical in FP16/BF16 matrix multiplications for attention?

### Part D: Edge Cases / Stress Tests
1. Inputs containing large positive and negative numbers.
2. Empty or single-element blocks.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-20`
```python
import numpy as np

def online_softmax(blocks):
    # blocks: list of arrays
    global_max = -np.inf
    global_sum = 0.0
    
    for block in blocks:
        block_max = np.max(block)
        new_max = max(global_max, block_max)
        global_sum = global_sum * np.exp(global_max - new_max) + np.sum(np.exp(block - new_max))
        global_max = new_max
        
    probabilities = []
    for block in blocks:
        probabilities.append(np.exp(block - global_max) / global_sum)
        
    return probabilities
```

## Topic 21: RMSNorm

### Part A: Problem Solving
- [LeetCode 238: Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/)
- [LeetCode 415: Add Strings](https://leetcode.com/problems/add-strings/)
- [LeetCode 2125: Number of Laser Beams in a Bank](https://leetcode.com/problems/number-of-laser-beams-in-a-bank/)

### Part B: Mathematical Proofs
1. Prove that RMSNorm is invariant to scaling of the input features.
2. Show mathematically why RMSNorm is computationally cheaper than LayerNorm.

### Part C: ML Systems Questions
1. Why is RMSNorm preferred over LayerNorm in modern LLMs like LLaMA?
2. How does the choice of `eps` affect numerical stability in mixed-precision training?

### Part D: Edge Cases / Stress Tests
1. Inputs with all zeros.
2. Inputs with very large variance (testing `eps` effectiveness).

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-21`
```python
import numpy as np

def rmsnorm_forward(x, gamma, eps):
    # x: (N, D), gamma: (D,)
    rms = np.sqrt(np.mean(x ** 2, axis=-1, keepdims=True) + eps)
    return (x / rms) * gamma
```

## Topic 22: Image to Column (Im2Col)

### Part A: Problem Solving
- [LeetCode 54: Spiral Matrix](https://leetcode.com/problems/spiral-matrix/)
- [LeetCode 73: Set Matrix Zeroes](https://leetcode.com/problems/set-matrix-zeroes/)
- [LeetCode 48: Rotate Image](https://leetcode.com/problems/rotate-image/)

### Part B: Mathematical Proofs
1. Prove that the im2col transformation correctly maps 2D convolution to matrix multiplication.
2. Derive the memory complexity of the im2col operation.

### Part C: ML Systems Questions
1. Why do deep learning frameworks use im2col despite its high memory consumption?
2. What are the memory optimization strategies (like implicit GEMM) to avoid materializing the im2col matrix?

### Part D: Edge Cases / Stress Tests
1. Convolution kernel size equal to image size.
2. Rectangular images and kernels.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-22`
```python
import numpy as np

def im2col(image, K):
    # image: (H, W), K: kernel size (scalar, assuming KxK)
    H, W = image.shape
    out_H = H - K + 1
    out_W = W - K + 1
    col = np.zeros((K * K, out_H * out_W))
    
    col_idx = 0
    for i in range(out_H):
        for j in range(out_W):
            col[:, col_idx] = image[i:i+K, j:j+K].reshape(-1)
            col_idx += 1
    return col
```

## Topic 23: LSTM Cell

### Part A: Problem Solving
- [LeetCode 70: Climbing Stairs](https://leetcode.com/problems/climbing-stairs/)
- [LeetCode 322: Coin Change](https://leetcode.com/problems/coin-change/)
- [LeetCode 1143: Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/)

### Part B: Mathematical Proofs
1. Prove that the forget gate in LSTM helps mitigate the vanishing gradient problem.
2. Derive the backpropagation through time (BPTT) equations for an LSTM cell.

### Part C: ML Systems Questions
1. Why is LSTM execution generally slower and harder to parallelize than Transformers?
2. How can we fuse LSTM operations to improve GPU memory bandwidth utilization?

### Part D: Edge Cases / Stress Tests
1. Extremely long sequences causing exploding gradients.
2. All-zero inputs and initial hidden states.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-23`
```python
import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def lstm_cell_forward(x, h_prev, c_prev, W, U, b):
    # W, U, b contain concatenated weights/biases for i, f, o, g
    D_h = h_prev.shape[0]
    z = np.dot(W, x) + np.dot(U, h_prev) + b
    
    i = sigmoid(z[0:D_h])
    f = sigmoid(z[D_h:2*D_h])
    o = sigmoid(z[2*D_h:3*D_h])
    g = np.tanh(z[3*D_h:4*D_h])
    
    c_next = f * c_prev + i * g
    h_next = o * np.tanh(c_next)
    
    return h_next, c_next
```
