import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_matrix_memory_layout_c1_p1",
  pageNumber: 1,
  title: "Physical RAM & Multi-Dimensional Strides",
  subtitle: "1D Linear Memory, Row-Major vs Column-Major, and Affine Indexing",
  estimatedMinutes: 25,
  sections: [
    {
      type: "prose",
      title: "The Physical Linear Addressing Illusion",
      content:
        "Modern deep learning architectures manipulate tensors of high rank (e.g., $(B, H, S, D)$ in Transformer multi-head attention), yet physical DRAM, High Bandwidth Memory (HBM3e), and CPU/GPU cache hierarchies are strictly 1-dimensional sequences of bytes indexed by linear 64-bit addresses.\n\nEvery multi-dimensional tensor is an abstraction realized through an affine mapping from discrete integer coordinate space $\\mathbb{Z}^D$ to linear byte offsets in memory. For an $n$-dimensional tensor with shape $(d_0, d_1, \\dots, d_{n-1})$ and strides $(s_0, s_1, \\dots, s_{n-1})$ measured in element counts, the byte address of element $(i_0, i_1, \\dots, i_{n-1})$ from base pointer $P_{\\text{base}}$ with element size $E = \\text{sizeof}(T)$ is:\n\n$$\\text{Address}(i_0, i_1, \\dots, i_{n-1}) = P_{\\text{base}} + E \\cdot \\sum_{k=0}^{n-1} i_k \\cdot s_k$$\n\nThe ordering of strides determines whether the tensor is stored in C-style **Row-Major** format or Fortran-style **Column-Major** format:\n- **Row-Major (C-contiguous)**: The rightmost index $i_{n-1}$ advances continuously in physical memory ($s_{n-1} = 1$). Rows are contiguous, and jumping to the next row requires a stride of $s_0 = d_1$.\n- **Column-Major (F-contiguous)**: The leftmost index $i_0$ advances continuously in physical memory ($s_0 = 1$). Columns are contiguous, and jumping to the next column requires a stride of $s_1 = d_0$.",
    },
    {
      type: "mental_model",
      title: "2D Matrix Memory Layout Comparison",
      visualIntuition:
        "Logical 2x3 Matrix:\n[ [A00, A01, A02],\n  [A10, A11, A12] ]\n\nRow-Major Layout (C-order, stride = [3, 1]):\n[ (0,0): A00 ] -> [ (0,1): A01 ] -> [ (0,2): A02 ] -> [ (1,0): A10 ] -> [ (1,1): A11 ] -> [ (1,2): A12 ]\n--> Inner loop traverses horizontally: contiguous addresses, full cache line utilization.\n\nColumn-Major Layout (Fortran-order, stride = [1, 2]):\n[ (0,0): A00 ] -> [ (1,0): A10 ] -> [ (0,1): A01 ] -> [ (1,1): A11 ] -> [ (0,2): A02 ] -> [ (1,2): A12 ]\n--> Inner loop traverses vertically: contiguous addresses across rows for fixed column.",
      invariant:
        "Linear Offset = sum(index[d] * stride[d]). A layout is C-contiguous iff stride[d] = prod(shape[d+1:]) for all d, with stride[-1] = 1.",
      stateTransitions:
        "Matrix Creation -> Logical Indexing (i, j) -> Affine Stride Evaluation (i * S0 + j * S1) -> 64B Cache Line Fetch -> L1/Register Allocation.",
      naiveBottleneck:
        "Traversing row-major data column-first forces a stride of S0 elements on every access, causing a compulsory 64-byte cache miss on almost every scalar read.",
      optimalInsight:
        "Always structure nested loop execution such that the innermost loop index varies along the dimension whose stride equals 1 (unit-stride access).",
    },
    {
      type: "math_proof",
      title: "Cache Line Miss Bound under Traversal Order",
      theorem:
        "Let matrix $A \\in \\mathbb{R}^{M \\times N}$ be stored in row-major order with element size $E$ bytes. Assume a CPU cache with line size $L$ bytes containing $C = L/E$ elements per line (e.g., $C = 16$ for 32-bit floats on a 64-byte cache line). Assuming cold cache and row dimension $N > C$:\n1. Row-major traversal (outer $i$, inner $j$) incurs $\\lceil M \\cdot N / C \\rceil$ cache misses.\n2. Column-major traversal (outer $j$, inner $i$) incurs $M \\cdot N$ cache misses when matrix height $M$ exceeds cache capacity.",
      proof:
        "1. In row-major order, element $A[i, j]$ is located at offset $(i \\cdot N + j) \\cdot E$. Reading $A[i, 0]$ triggers a cache miss, loading the 64-byte line containing elements $A[i, 0], A[i, 1], \\dots, A[i, C-1]$ into L1 cache.\n2. The subsequent $C-1$ reads ($j = 1, \\dots, C-1$) are guaranteed cache hits requiring 0 DRAM/L2 transfers.\n3. Across the full matrix of $M \\cdot N$ elements, total cache line requests equal $\\frac{M \\cdot N}{C} = \\frac{M \\cdot N \\cdot E}{L}$.\n4. Conversely, under column-major traversal (outer $j$, inner $i$), element $A[i+1, j]$ is located at offset $((i+1) \\cdot N + j) \\cdot E$. The byte distance between successive reads is $N \\cdot E$.\n5. When $N \\cdot E \\ge L$, every successive read falls into a distinct cache line. If the working set $M \\cdot N \\cdot E$ exceeds the L1/L2 cache capacity (or due to cache associativity conflicts), the cache line loaded for $A[i, j]$ is evicted before index $j$ advances back to row $i$.\n6. Hence, every single element access generates a cache miss, incurring $M \\cdot N$ misses. The column-major traversal suffers a factor of $C = L/E$ (typically $16\\times$ for FP32, $8\\times$ for FP64) higher memory traffic and severe memory bus saturation.",
    },
  ],
};
