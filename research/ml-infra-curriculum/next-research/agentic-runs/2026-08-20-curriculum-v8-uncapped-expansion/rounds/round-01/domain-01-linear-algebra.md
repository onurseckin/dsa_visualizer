# Domain 01: Linear Algebra & Tensor Operations

## Topic 01: Multi-dimensional Array Indexing & Strides

### Part A: LeetCode Problems
1. [Reshape the Matrix](https://leetcode.com/problems/reshape-the-matrix/)
2. [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/)
3. [Diagonal Traverse](https://leetcode.com/problems/diagonal-traverse/)
4. [Rotate Image](https://leetcode.com/problems/rotate-image/)

### Part B: Mathematical Proofs
1. Prove that for a contiguous C-order array of shape $(d_1, d_2, \ldots, d_n)$, the stride $s_i$ for dimension $i$ is given by $s_i = \prod_{j=i+1}^n d_j$.
2. Prove that an array shape and strides combination represents a set of overlapping memory elements if and only if there exists a valid index arithmetic collision.

### Part C: ML Systems Questions
1. How does PyTorch represent tensor views (e.g., after `transpose`) without copying data? Explain the role of strides and offsets.
2. In CUDA or custom C++ kernels, why is contiguous memory access critical for performance, and how do non-contiguous strides impact memory coalescing?

### Part D: Edge Cases / Stress Tests
1. Zero-dimensional tensors (scalars): ensure strides and shapes are handled correctly.
2. Dimensions of size 1: test stride behaviors when broadcasting or squeezing.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-01`
```python
def compute_offset(index, shape, strides):
    """
    Computes the flat memory offset for a multidimensional index.
    """
    if len(index) != len(shape) or len(index) != len(strides):
        raise ValueError("Length of index, shape, and strides must match.")
    offset = 0
    for i, s, st in zip(index, shape, strides):
        if i < 0 or i >= s:
            raise IndexError("Index out of bounds.")
        offset += i * st
    return offset
```

## Topic 02: Broadcasting Semantics

### Part A: LeetCode Problems
1. [Array With Elements Not Equal to Average of Neighbors](https://leetcode.com/problems/array-with-elements-not-equal-to-average-of-neighbors/) (Adapted for broadcasting rules)
2. [Valid Boomerang](https://leetcode.com/problems/valid-boomerang/)
3. [Construct Target Array With Multiple Sums](https://leetcode.com/problems/construct-target-array-with-multiple-sums/)

### Part B: Mathematical Proofs
1. Prove that the broadcasted shape of two tensors $A$ and $B$ is uniquely determined by the standard NumPy broadcasting rules or fails.
2. Prove the associativity of broadcasting: $Broadcast(Broadcast(A, B), C) = Broadcast(A, Broadcast(B, C))$.

### Part C: ML Systems Questions
1. How does broadcasting save memory during forward passes in neural networks? Provide an example with adding bias to a batched matrix multiplication.
2. Explain how implicit broadcasting is implemented in optimized backends like XLA or cuDNN.

### Part D: Edge Cases / Stress Tests
1. Broadcasting a scalar with a high-dimensional tensor.
2. Incompatible shapes (e.g., `(3, 4)` and `(3, 5)`).
3. Broadcasting arrays with many dimensions of size 1.

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-02`
```python
def broadcast_shapes(shape1, shape2):
    """
    Returns the broadcasted shape of two array shapes, or raises ValueError if incompatible.
    """
    res = []
    len1, len2 = len(shape1), len(shape2)
    max_len = max(len1, len2)
    s1 = (1,) * (max_len - len1) + tuple(shape1)
    s2 = (1,) * (max_len - len2) + tuple(shape2)
    for dim1, dim2 in zip(s1, s2):
        if dim1 == dim2:
            res.append(dim1)
        elif dim1 == 1:
            res.append(dim2)
        elif dim2 == 1:
            res.append(dim1)
        else:
            raise ValueError(f"Incompatible shapes for broadcasting: {shape1} and {shape2}")
    return tuple(res)
```

## Topic 03: Orthogonalization & Gram-Schmidt

### Part A: LeetCode Problems
1. [Valid Square](https://leetcode.com/problems/valid-square/)
2. [Max Points on a Line](https://leetcode.com/problems/max-points-on-a-line/)
3. [Minimum Area Rectangle](https://leetcode.com/problems/minimum-area-rectangle/)

### Part B: Mathematical Proofs
1. Prove that the vectors produced by the Gram-Schmidt process are mutually orthogonal.
2. Prove that the span of the first $k$ orthogonalized vectors equals the span of the first $k$ original vectors.

### Part C: ML Systems Questions
1. Why is the modified Gram-Schmidt process preferred over the classical Gram-Schmidt process for numerical stability in floating-point arithmetic?
2. How is orthogonalization used in maintaining the stability of recurrent neural networks (e.g., orthogonal initialization)?

### Part D: Edge Cases / Stress Tests
1. Linearly dependent input vectors (should result in zero vectors).
2. Almost collinear vectors (stress tests numerical stability).

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-03`
```python
import math

def dot_product(v1, v2):
    return sum(x * y for x, y in zip(v1, v2))

def scalar_mult(c, v):
    return [c * x for x in v]

def vector_sub(v1, v2):
    return [x - y for x, y in zip(v1, v2)]

def gram_schmidt(vectors):
    """
    Performs modified Gram-Schmidt orthogonalization on a list of vectors.
    Returns a list of orthogonal (not necessarily normalized) vectors.
    """
    if not vectors:
        return []
    u = []
    for v in vectors:
        current_u = list(v)
        for prev_u in u:
            prev_u_dot = dot_product(prev_u, prev_u)
            if prev_u_dot < 1e-12:
                continue
            proj_coef = dot_product(current_u, prev_u) / prev_u_dot
            proj = scalar_mult(proj_coef, prev_u)
            current_u = vector_sub(current_u, proj)
        u.append(current_u)
    return u
```

## Topic 04: Eigendecomposition & Power Iteration

### Part A: LeetCode Problems
1. [Sort Integers by The Power Value](https://leetcode.com/problems/sort-integers-by-the-power-value/) (Adapted for iterative processes)
2. [Pow(x, n)](https://leetcode.com/problems/powx-n/)
3. [Find the Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/) (Cycle detection as a spectral property analogy)

### Part B: Mathematical Proofs
1. Prove that the power iteration method converges to the dominant eigenvector for a diagonalizable matrix with a strictly dominant eigenvalue.
2. Prove the rate of convergence of power iteration depends on the ratio $|\lambda_2| / |\lambda_1|$.

### Part C: ML Systems Questions
1. How is power iteration used in computing Spectral Normalization for Generative Adversarial Networks (GANs)?
2. Why is full eigendecomposition computationally prohibitive for large ML weight matrices, and when are iterative approximations preferred?

### Part D: Edge Cases / Stress Tests
1. Matrices with multiple dominant eigenvalues (e.g., $\lambda_1 = -\lambda_2$).
2. Zero matrix or identity matrix (ensures valid fallback behavior).

### Executable Problem Contract
**ID**: `CONTRACT-TOPIC-04`
```python
import math

def mat_vec_mul(X, v):
    res = []
    for row in X:
        res.append(sum(r * val for r, val in zip(row, v)))
    return res

def normalize(v):
    norm = math.sqrt(sum(x * x for x in v))
    if norm < 1e-12:
        return v
    return [x / norm for x in v]

def top_principal_component(X, num_iterations):
    """
    Approximates the top principal component (dominant eigenvector of X^T X) using power iteration.
    X is a list of lists representing a matrix.
    Returns the dominant eigenvector as a normalized list.
    """
    if not X or not X[0]:
        return []
    rows = len(X)
    cols = len(X[0])
    
    # Compute covariance matrix C = X^T X
    C = [[0.0] * cols for _ in range(cols)]
    for i in range(cols):
        for j in range(cols):
            val = sum(X[k][i] * X[k][j] for k in range(rows))
            C[i][j] = val
            
    # Initialize random vector (or all ones)
    b_k = [1.0] * cols
    b_k = normalize(b_k)
    
    for _ in range(num_iterations):
        b_k1 = mat_vec_mul(C, b_k)
        b_k = normalize(b_k1)
        
    return b_k
```
