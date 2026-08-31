import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_matrix_memory_layout_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Systems Scenarios & Stress Tests",
  subtitle: "Question Bank Suite: Microarchitectural Diagnostics & Stress Tests",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_matrix_memory_layout",
      title: "Comprehensive Memory Layout & Hardware Systems Suite",
      partA_dsaCoding: [
        {
          title: "In-Place Matrix Transposition Memory Stride Invariant",
          difficulty: "Hard",
          description:
            "Given a square matrix stored in a flat 1D buffer in row-major format, write an in-place algorithm that transforms it into column-major order with O(1) auxiliary memory using cycle leader tracing.",
          problemStatement:
            'def in_place_square_transpose(buffer: list[float], N: int) -> None:\n    """Transpose N x N matrix stored in 1D buffer in-place."""\n    for i in range(N):\n        for j in range(i + 1, N):\n            idx1 = i * N + j\n            idx2 = j * N + i\n            buffer[idx1], buffer[idx2] = buffer[idx2], buffer[idx1]',
        },
        {
          title: "Arbitrary Strided Tensor Contiguity Packing",
          difficulty: "Hard",
          description:
            "Implement a memory pack kernel that copies non-contiguous strided tensor data into a contiguous output buffer with minimal pointer arithmetic overhead.",
          problemStatement:
            "def repack_to_contiguous(src: list[float], shape: list[int], strides: list[int]) -> list[float]:\n    # Traverse logical coordinates and copy to contiguous dest\n    pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Strided Row-Major Multi-Index Uniqueness",
          statement:
            "Prove that the affine map phi(i_0, ..., i_{n-1}) = sum(i_k * s_k) is a bijection from the Cartesian product grid to [0, prod(shape) - 1] if and only if strides satisfy s_k = prod(shape[k+1:]) for all k.",
          proofOutline:
            "Proceed by induction on tensor dimension n. For base case n=1, s_0=1 is the identity map on [0, d_0-1]. For the inductive step, apply the Euclidean division algorithm (division with unique quotient and remainder) with base d_{n-1}.",
          engineeringContext:
            "This uniqueness guarantees that no two tensor coordinates alias the same memory address in standard tensors, preventing memory corruption during parallel tensor operations.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "DRAM Bank Conflict Mitigation via Dimension Padding",
          prompt:
            "Explain why accessing columns of a 2048 x 2048 FP32 matrix causes severe throughput degradation on modern DDR5/HBM controllers, and how allocating the matrix as 2048 x 2056 eliminates the issue.",
          engineeringContext:
            "2048 * 4 bytes = 8192 bytes = 128 cache lines = exact multiple of DRAM bank count (16 banks). Every successive row element in the same column maps to the exact same DRAM bank, forcing 100% row-buffer conflict rate. Padding to 2056 shifts the bank index by (2056*4)/64 % 16 = 128.5 % 16 != 0, distributing consecutive column accesses across all DRAM banks evenly.",
        },
        {
          title: "False Sharing in Multi-Threaded Row Normalization",
          prompt:
            "In multi-threaded RMSNorm, thread t writes its scalar reduction result to output[t]. Why does this trigger massive cache coherence invalidation bus traffic, and how does cache line padding fix it?",
          engineeringContext:
            "Adjacent threads write to output[t] and output[t+1]. Since both scalars reside in the same 64-byte cache line, CPU cores bounce MESI/MOESI cache invalidation messages across the interconnect on every write. Aligning thread outputs to distinct 64-byte boundaries eliminates false sharing.",
        },
      ],
      partD_stressTests: [
        {
          title: "Power-of-2 Matrix Striding Associativity Collapse",
          scenario:
            "Benchmarking a 4096 x 4096 matrix multiplication kernel shows a 12x performance drop compared to a 4097 x 4097 matrix despite having fewer total operations.",
          failureMode:
            "In an 8-way set-associative cache, addresses separated by exact powers of 2 (e.g., 4096 * 4B = 16KB) hash into the exact same cache set. Only 8 such lines can be retained, causing continuous premature evictions even when 95% of the total cache capacity remains completely empty.",
        },
      ],
    },
  ],
};
