import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_convolutions_im2col_gemm_c1_p1",
  pageNumber: 1,
  title: "Convolutions & Im2Col: 2D Spatial Filtering to High-Performance GEMM",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Spatial Filtering Bottleneck: From 6-Nested Loops to Hardware GEMM",
      content:
        "2D spatial convolution is the cornerstone operator of computer vision (ResNets, ConvNeXt, Diffusion U-Nets) and continuous sequence modeling. For an input tensor $X \\in \\mathbb{R}^{B \\times C_{\\text{in}} \\times H \\times W}$ and kernel $W \\in \\mathbb{R}^{C_{\\text{out}} \\times C_{\\text{in}} \\times K_H \\times K_W}$, direct evaluation requires **6 nested scalar loops** ($B \\times C_{\\text{out}} \\times H_{\\text{out}} \\times W_{\\text{out}} \\times C_{\\text{in}} \\times K_H \\times K_W$ FLOPs). Naive loop execution achieves $< 1\\%$ of peak GPU compute because sliding window receptive fields access memory with unaligned strides. **Im2Col (Image-to-Column, Chellapilla et al., 2006; cuDNN)** transforms spatial sliding windows into a single dense matrix multiplication: $Y_{\\text{col}} = W_{\\text{flat}} \\times X_{\\text{col}}$, accelerating convolution by over **100x** by executing on hardware Tensor Cores.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Unrolling Receptive Fields into Matrix Columns",
      visualIntuition:
        "Input Feature Map (C_in=3, H=4, W=4), Kernel (K_H=3, K_W=3)\\nReceptive Field Patch at (0, 0): [ 3 x 3 x 3 = 27 values ] --> Flattened into Column 0 of X_col\\nReceptive Field Patch at (0, 1): [ 3 x 3 x 3 = 27 values ] --> Flattened into Column 1 of X_col\\n\\nX_col Matrix: [ (C_in * K_H * K_W) x (H_out * W_out) ]\\nKernel Matrix: [ C_out x (C_in * K_H * K_W) ]\\nMatrix Multiplication: [ C_out x (H_out * W_out) ] ==> Reshaped back into [ C_out x H_out x W_out ]!",
      invariant:
        "Im2Col Equivalence Invariant: Every spatial dot product Y(c_out, h, w) = <W(c_out), Patch(h, w)> is mathematically identical to entry (c_out, h * W_out + w) in the matrix product W_flat @ X_col.",
      stateTransitions:
        "Input Tensor (B, C_in, H, W) -> Im2Col Unrolling -> Matrix X_col ((C_in * K_H * K_W), (B * H_out * W_out)) -> Tensor Core GEMM with W_flat -> Matrix Y_col (C_out, (B * H_out * W_out)) -> Col2Im Reshape -> Output Tensor (B, C_out, H_out, W_out).",
      naiveBottleneck:
        "Nested loops re-read overlapping pixels from DRAM millions of times without hardware register caching.",
      optimalInsight:
        "Im2Col translates spatial convolutions into standard BLAS GEMM calls, unlocking peak GPU FLOPS at the expense of temporary buffer memory.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Winograd Minimal Filtering Algorithm F(2x2, 3x3)",
      theorem:
        "To compute a $2 \\times 2$ output tile with a $3 \\times 3$ convolution filter (requiring a $4 \\times 4$ input patch), standard convolution requires $2 \\times 2 \\times 3 \\times 3 = 36$ multiplications. The Winograd algorithm evaluates the exact output using strictly $4 \\times 4 = 16$ multiplications ($2.25\\times$ arithmetic speedup) via minimal polynomial transformation matrices $B^T, G, A^T$: $Y = A^T \\left[ (G g G^T) \\odot (B^T d B) \\right] A$.",
      proof:
        "1. 1D Minimal Filtering Formulation (Toom-Cook / Chinese Remainder Theorem):\\nFor a 1D filter $g$ of size $r=3$ and output $y$ of size $m=2$, input patch $d$ has size $m + r - 1 = 4$.\\nPolynomial multiplication modulo roots $s \\in \\{0, 1, -1, \\infty\\}$ reduces the required multiplications to $m + r - 1 = 4$ multiplications.\\n\\n2. Transformation Matrices for 1D $F(2, 3)$:\\n$$B^T = \\begin{pmatrix} 1 & 0 & -1 & 0 \\\\ 0 & 1 & 1 & 0 \\\\ 0 & -1 & 1 & 0 \\\\ 0 & 1 & 0 & -1 \\end{pmatrix}, \\quad G = \\begin{pmatrix} 1 & 0 & 0 \\\\ 1/2 & 1/2 & 1/2 \\\\ 1/2 & -1/2 & 1/2 \\\\ 0 & 0 & 1 \\end{pmatrix}, \\quad A^T = \\begin{pmatrix} 1 & 1 & 1 & 0 \\\\ 0 & 1 & -1 & -1 \\end{pmatrix}$$\\n\\n3. 2D Generalization via Tensor Outer Products:\\nExtending to 2D filters via Kronecker products:\\n$$Y = A^T \\left[ (G g G^T) \\odot (B^T d B) \\right] A$$\\n- $G g G^T$: Transforms $3 \\times 3$ kernel into $4 \\times 4$ domain (computed offline once!).\\n- $B^T d B$: Transforms $4 \\times 4$ data tile into $4 \\times 4$ domain using only additions and bit-shifts.\\n- Component-wise product $\\odot$: Executes exactly $4 \\times 4 = 16$ multiplications.\\n- $A^T [\\cdot] A$: Transforms back to $2 \\times 2$ spatial output domain.\\n\\n4. Multiplication Count Ratio:\\n$$\\text{Speedup} = \\frac{36 \\text{ multiplications}}{16 \\text{ multiplications}} = 2.25\\times$$\\nThis proves that Winograd achieves the minimal possible multiplication complexity for small spatial filters.",
    },
  ],
};

export const page_01_core = page1;
