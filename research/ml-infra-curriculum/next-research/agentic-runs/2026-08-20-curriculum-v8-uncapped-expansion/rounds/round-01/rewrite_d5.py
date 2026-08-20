import re

with open('/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-08-20-curriculum-v8-uncapped-expansion/rounds/round-01/domain-05-deep-learning-and-activations.md', 'r') as f:
    content = f.read()

def replacer(match):
    topic_num = match.group(1)
    
    if topic_num == '19':
        bank = """### 5. Comprehensive Problem & Question Bank

**Part A: Foundational DSA & Coding Problems**
- [Design an Ordered Stream](https://leetcode.com/problems/design-an-ordered-stream/): Sequential data flow and state tracking.
- [Matrix Block Sum](https://leetcode.com/problems/matrix-block-sum/): 2D matrix accumulation and coordinate updates.
- [Sparse Matrix Multiplication](https://leetcode.com/problems/sparse-matrix-multiplication/): Handling sparse representations in matrix ops.
- [CS231n: Neural Networks Case Study](https://cs231n.github.io/neural-networks-case-study/): Forward and backward passes for 2-layer NN.

**Part B: Mathematical Proofs & Analytical Derivations**
- **Backpropagation Matrix Calculus**: Derive the Jacobian for a dense linear layer $Y = XW + b$ with respect to inputs $X$ and weights $W$. Prove that $dW = X^T dY$ and $dX = dY W^T$.
- **Chain Rule across Non-linearities**: Mathematically trace the gradient from loss through a ReLU activation and into the preceding linear layer.
- **Initialization Variance**: Prove the variance of outputs in a dense layer when using Xavier vs He initialization.

**Part C: Real-World ML Systems & Engineering Questions**
- **GPU Memory Constraints**: Calculate the activation memory footprint for a batch size of 2048, hidden dimension 4096 during training. How does gradient checkpointing alter this?
- **Fused MLPs**: Why do custom CUDA kernels fuse the bias addition and activation function with the matrix multiplication, and how does this affect memory bandwidth?

**Part D: Edge Cases, Numerical Stability & Stress Tests**
- **Dead ReLU Neurons**: Construct an adversarial input or initialization that causes 90% of ReLU neurons to permanently die.
- **Gradient Vanishing**: Demonstrate mathematically why stacking 50 un-normalized dense layers with Sigmoid activations prevents the first layer from updating.
"""
    elif topic_num == '20':
        bank = """### 5. Comprehensive Problem & Question Bank

**Part A: Foundational DSA & Coding Problems**
- [Elimination Game](https://leetcode.com/problems/elimination-game/): Safe progressive reductions.
- [Pow(x, n)](https://leetcode.com/problems/powx-n/): Managing extreme floating point dynamic range.
- [Online Softmax Algorithm](https://arxiv.org/abs/1805.02867) (Milakov & Gimelshein): Single-pass Softmax.
- [Design a Number Container System](https://leetcode.com/problems/design-a-number-container-system/): Map states to functions.

**Part B: Mathematical Proofs & Analytical Derivations**
- **LogSumExp Numerical Stability**: Prove mathematically why $\log(\sum e^{x_i}) = c + \log(\sum e^{x_i - c})$ for any constant $c$, and how setting $c = \max(x)$ prevents float64 overflow.
- **GELU vs ReLU Gradient Dynamics**: Derive the gradient of GELU $x \Phi(x)$ and compare its properties around $x=0$ to ReLU and Swish.
- **SwiGLU Expressivity**: Formulate the SwiGLU activation function and prove its non-monotonicity.

**Part C: Real-World ML Systems & Engineering Questions**
- **FlashAttention Softmax**: Explain how the Online Softmax algorithm is utilized in FlashAttention to prevent writing intermediate attention matrices (N x N) to HBM.
- **GPU Register Pressure**: Why does GELU/SwiGLU require significantly higher register count per thread on an NVIDIA A100 compared to ReLU, and what is the occupancy tradeoff?

**Part D: Edge Cases, Numerical Stability & Stress Tests**
- **Extreme Logit Overflow**: Trace the execution of a naive Softmax implementation with logits `[1000.0, 1001.0, -1000.0]` and identify the exact line of `NaN` generation.
- **Underflow to Zero**: Construct a scenario in standard softmax where negative logits cause denominator underflow, and explain how LogSumExp prevents this.
"""
    elif topic_num == '21':
        bank = """### 5. Comprehensive Problem & Question Bank

**Part A: Foundational DSA & Coding Problems**
- [Running Sum of 1d Array](https://leetcode.com/problems/running-sum-of-1d-array/): Running statistics over arrays.
- [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/): Mean shifting and variance scaling.
- [Maximum Subarray](https://leetcode.com/problems/maximum-subarray/): Contiguous sequence statistics.
- [Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467) (Zhang & Sennrich): RMSNorm implementation.

**Part B: Mathematical Proofs & Analytical Derivations**
- **RMSNorm vs LayerNorm**: Prove that if the input vector $x$ has zero mean, RMSNorm is mathematically equivalent to LayerNorm (ignoring bias).
- **Scale Invariance Proof**: Demonstrate mathematically that LayerNorm and RMSNorm both make the forward pass invariant to scaling of the input weights.
- **Gradient of LayerNorm**: Derive the analytical Jacobian for LayerNorm, highlighting the centering and scaling gradient paths.

**Part C: Real-World ML Systems & Engineering Questions**
- **Llama 3 RMSNorm Efficiency**: Why did Meta choose RMSNorm over LayerNorm for Llama 3? Quantify the FLOP reduction and memory bandwidth savings on modern GPUs.
- **Fused LayerNorm in PyTorch**: Explain why PyTorch utilizes fused LayerNorm kernels in C++ (avoiding intermediate tensor materialization) and how it impacts the backward pass memory footprint.

**Part D: Edge Cases, Numerical Stability & Stress Tests**
- **Zero Variance Edge Case**: Trace RMSNorm execution for a vector of exactly zeros, explaining the critical role of the $\epsilon$ parameter in preventing division by zero.
- **FP16 Overflow in Variance**: Demonstrate how calculating $\sum x_i^2$ in FP16 for large activation values can exceed the 65504 maximum, and how mixed-precision (accumulating in FP32) solves this.
"""
    elif topic_num == '22':
        bank = """### 5. Comprehensive Problem & Question Bank

**Part A: Foundational DSA & Coding Problems**
- [Image Smoother](https://leetcode.com/problems/image-smoother/): 2D sliding window kernel extraction.
- [Rotate Image](https://leetcode.com/problems/rotate-image/): 2D in-place coordinate transformation.
- [Set Matrix Zeroes](https://leetcode.com/problems/set-matrix-zeroes/): Efficient in-place matrix modifications.
- [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/): Matrix traversal techniques.

**Part B: Mathematical Proofs & Analytical Derivations**
- **Im2Col Toeplitz Matrix Formulation**: Prove that 2D convolution operations can be exactly mapped to a GEMM operation using a Toeplitz matrix transformation.
- **Winograd vs GEMM Complexity**: Derive the theoretical FLOP count for a 3x3 convolution using direct summation vs Im2Col+GEMM vs Winograd's minimal filtering algorithm.
- **Gradient of Im2Col**: Formulate the backward pass of an Im2Col transformation (Col2Im) and mathematically prove it corresponds to a transposed convolution.

**Part C: Real-World ML Systems & Engineering Questions**
- **Memory Inflation in Im2Col**: Calculate the exact memory footprint inflation factor when applying Im2Col on a 224x224x3 image with a 3x3 kernel and stride 1.
- **cuDNN Convolution Heuristics**: Why does cuDNN dynamically profile and select between direct convolution, Im2Col, and FFT-based convolution algorithms at runtime?

**Part D: Edge Cases, Numerical Stability & Stress Tests**
- **Padding Boundary Conditions**: Stress test the Im2Col coordinate mapping logic when asymmetric padding is applied to the input matrix.
- **Degenerate 1x1 Convolutions**: Analyze the performance overhead of running Im2Col for a 1x1 convolution compared to directly flattening the spatial dimensions.
"""
    elif topic_num == '23':
        bank = """### 5. Comprehensive Problem & Question Bank

**Part A: Foundational DSA & Coding Problems**
- [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/): 1D recurrence and state propagation.
- [Decode String](https://leetcode.com/problems/decode-string/): Stack-based memory accumulation.
- [Longest Valid Parentheses](https://leetcode.com/problems/longest-valid-parentheses/): State memory across sequential inputs.
- [Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) (Christopher Olah): Gate equations.

**Part B: Mathematical Proofs & Analytical Derivations**
- **Vanishing Gradients in RNNs**: Mathematically prove how the chain rule over $T$ time steps in a vanilla RNN leads to exponentially decaying gradients if the weight matrix's largest eigenvalue is $< 1$.
- **LSTM Additive Highway**: Derive the gradient of the LSTM cell state $c_t$ with respect to $c_{t-1}$ and prove how the forget gate allows gradients to flow linearly without geometric decay.
- **GRU vs LSTM Parameterization**: Compare the capacity of a GRU cell vs an LSTM cell mathematically, identifying the specific gate equations that are merged.

**Part C: Real-World ML Systems & Engineering Questions**
- **Sequential Bottleneck**: Explain why the sequential nature of $h_t = f(h_{t-1}, x_t)$ prevents efficient hardware utilization on GPUs compared to Transformer self-attention.
- **KV Cache parallels**: Contrast the memory preservation mechanism of an LSTM cell state with the Key-Value (KV) cache state preservation in modern Transformer decoders.

**Part D: Edge Cases, Numerical Stability & Stress Tests**
- **Forget Gate Saturation**: Construct a scenario where the forget gate biases are initialized to highly negative values, causing the LSTM to fail at learning long-term dependencies.
- **Tanh Saturation**: Demonstrate how unbounded cell state growth leads to `tanh(c)` saturation, completely zeroing out the cell's gradient contribution during backprop.
"""

    return f"## Topic {topic_num}:{match.group(2)}\n{bank}\n### 6. Executable Problem Contract"

pattern = r"## Topic (\d+):(.*?)### 5\. Pedagogical Ascent & Mental Model.*?### 6\. Executable Problem Contract"
new_content = re.sub(pattern, replacer, content, flags=re.DOTALL)

with open('/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-08-20-curriculum-v8-uncapped-expansion/rounds/round-01/domain-05-deep-learning-and-activations.md', 'w') as f:
    f.write(new_content)

