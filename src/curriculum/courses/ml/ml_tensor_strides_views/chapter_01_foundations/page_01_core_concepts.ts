import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_tensor_strides_views_c1_p1",
  pageNumber: 1,
  title: "Tensor Metadata, Strides, and Zero-Copy Views",
  subtitle: "Storage Decoupling, Affine Coordinate Transforms, and Contiguity Invariants",
  estimatedMinutes: 25,
  sections: [
    {
      type: "prose",
      title: "The Architecture of a Tensor: Storage vs View",
      content:
        "In high-performance deep learning runtimes like PyTorch and NumPy, a **Tensor** is strictly partitioned into two decoupled layers:\n\n1. **Storage Buffer (`StorageImpl`)**: A contiguous, flat 1D array of raw bytes allocated on the heap (or GPU VRAM) holding the raw element data. Multiple tensors can share the exact same storage buffer simultaneously.\n2. **Tensor View Metadata (`TensorImpl`)**: A lightweight metadata descriptor consisting of:\n   - `storage_offset`: Integer byte/element offset to the first element in the storage buffer.\n   - `shape` (sizes): Tuple $(d_0, d_1, \\dots, d_{n-1})$ defining the logical multi-dimensional grid.\n   - `strides`: Tuple $(s_0, s_1, \\dots, s_{n-1})$ defining the step count in physical storage required to advance by 1 in coordinate $k$.\n   - `dtype`: Data type specifying element byte width $E = \\text{sizeof}(T)$.\n\nBecause all indexing is computed on-the-fly via the affine transformation:\n$$\\text{Offset}(i_0, \\dots, i_{n-1}) = \\text{storage\\_offset} + \\sum_{k=0}^{n-1} i_k \\cdot s_k$$\n\nTransformations such as `transpose()`, `permute()`, `slice()`, `squeeze()`, `unsqueeze()`, and `expand()` (broadcasting) do **not** copy a single byte of element data. They execute in $O(1)$ time by returning a new `TensorImpl` header with mutated shape and stride metadata pointing to the existing `StorageImpl`.",
    },
    {
      type: "mental_model",
      title: "Zero-Copy View Metadata Mechanics",
      visualIntuition:
        "Base 2x3 Matrix Storage in RAM: [10, 20, 30, 40, 50, 60]\n\nTensor A (Original):\n  Shape: (2, 3), Strides: (3, 1), Offset: 0\n  Logical Grid: [ [10, 20, 30], [40, 50, 60] ]\n\nTensor B = A.transpose(0, 1):\n  Shape: (3, 2), Strides: (1, 3), Offset: 0  <-- SWAP STRIDES AND SHAPES (0-COPY!)\n  Logical Grid: [ [10, 40], [20, 50], [30, 60] ]\n  Reads: B[1, 0] -> offset = 1*1 + 0*3 = 1 -> Element 20\n\nTensor C = A[:, 1:] (Slice):\n  Shape: (2, 2), Strides: (3, 1), Offset: 1  <-- ADVANCE OFFSET (0-COPY!)\n  Logical Grid: [ [20, 30], [50, 60] ]\n\nTensor D = A.unsqueeze(0).expand(4, 2, 3) (Broadcast):\n  Shape: (4, 2, 3), Strides: (0, 3, 1), Offset: 0  <-- ZERO STRIDE BROADCAST (0-COPY!)\n  All 4 batch slices share identical memory addresses along dim 0 without allocating RAM!",
      invariant:
        "Zero-Copy Invariant: Storage buffer memory address is immutable. Metadata transformation is pure O(1) stride/shape algebra.",
      stateTransitions:
        "Alloc Storage(N) -> Init Base Metadata -> Apply View Ops (Transpose/Slice/Expand) -> Query Linear RAM Offset -> Fetch Data.",
      naiveBottleneck:
        "Calling .clone() or .contiguous() on every tensor permutation forces redundant O(N) memory allocations and bandwidth saturation.",
      optimalInsight:
        "Operate on strided views natively until a non-contiguous layout causes GPU memory uncoalesced transaction bottlenecks.",
    },
    {
      type: "math_proof",
      title: "Contiguity Criterion and Reshape Viewability Theorem",
      theorem:
        "A tensor with shape $(d_0, \\dots, d_{n-1})$ and strides $(s_0, \\dots, s_{n-1})$ is C-contiguous if and only if for all dimensions $k \\in \\{0, \\dots, n-2\\}$ where $d_k > 1$, the stride satisfies $s_k = s_{k+1} \\cdot d_{k+1}$, with $s_{n-1} = 1$.\nA tensor reshape to shape $(d'_0, \\dots, d'_{m-1})$ can be constructed as a zero-copy view if and only if adjacent grouped dimensions in the original tensor are contiguous.",
      proof:
        "1. In a C-contiguous buffer of $N = \\prod_{k=0}^{n-1} d_k$ elements, the linear index advances by 1 between adjacent elements along the last axis: $s_{n-1} = 1$.\n2. Advancing index $i_k$ by 1 represents traversing an entire sub-tensor of shape $(d_{k+1}, \\dots, d_{n-1})$. The number of elements in this sub-tensor is $\\prod_{j=k+1}^{n-1} d_j$.\n3. For consecutive physical memory addresses without holes, we must have $s_k = \\prod_{j=k+1}^{n-1} d_j = d_{k+1} \\cdot s_{k+1}$. This establishes the contiguity recurrence.\n4. For a reshape operation from shape $\\mathbf{d}$ to $\\mathbf{d}'$, consider collapsing dimensions $p$ through $q$ ($d_p \\times \\dots \\times d_q$) into a single dimension $D = \\prod_{j=p}^q d_j$.\n5. The flattened offset inside this sub-tensor is $\\sum_{j=p}^q i_j s_j$. For this sum to equal $i_{\\text{flat}} \\cdot s_q$ for all coordinate combinations $(i_p, \\dots, i_q) \\in \\prod [0, d_j - 1]$, the strides must satisfy the exact contiguous recurrence $s_j = s_{j+1} d_{j+1}$ for all $j \\in [p, q-1]$.\n6. If any stride violates this relationship (e.g. after a transpose where $s_0 < s_1$), no single affine stride $s_{\\text{new}}$ exists that can map $i_{\\text{flat}} \\in [0, D-1]$ to the non-linear scatter of physical addresses. Thus, a zero-copy view is impossible, and memory must be copied to a newly allocated contiguous buffer via `.contiguous()`.",
    },
  ],
};
