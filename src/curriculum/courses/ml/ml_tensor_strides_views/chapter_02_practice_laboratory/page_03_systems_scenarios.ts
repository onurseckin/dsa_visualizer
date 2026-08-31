import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_tensor_strides_views_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Stride Systems Scenarios & Stress Tests",
  subtitle: "Question Bank Suite: GPU Coalescing, Autograd View Mutation, and Memory Aliasing",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_tensor_strides_views",
      title: "Tensor Strides, Views, and Memory Systems Suite",
      partA_dsaCoding: [
        {
          title: "Custom 2D Convolution Unrolling via Stride Tricks",
          difficulty: "Hard",
          description:
            "Write a function that transforms an input image tensor of shape (H, W) into an im2col column matrix using stride manipulation with zero duplicate element copying.",
          problemStatement:
            'def im2col_strided(image: list[float], H: int, W: int, kH: int, kW: int) -> dict:\n    """Return shape and strides for zero-copy 4D patched view."""\n    pass',
        },
        {
          title: "Einstein Summation Index-to-Stride Compiler",
          difficulty: "Hard",
          description:
            "Implement a mini einsum parser for pairwise contractions (e.g., 'bik,bkj->bij') that identifies dimension broadcast and permutation strides without intermediate allocations.",
          problemStatement:
            "def compile_einsum_strides(eq: str, shape_A: tuple, shape_B: tuple) -> dict:\n    pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Non-Contiguity after Transposition",
          statement:
            "Prove that for any 2D matrix of shape (M, N) with M >= 2 and N >= 2 in standard C-order, applying transpose(0, 1) strictly breaks C-contiguity.",
          proofOutline:
            "Original strides are (N, 1). Transposed strides are (1, N). C-contiguity requires the last stride to be 1 and the first stride to be N * 1 = N. But here stride[0] = 1 and stride[1] = N > 1, contradicting the contiguous stride recurrence.",
          engineeringContext:
            "This explains why PyTorch operations like .view() fail after .t() and require an explicit .contiguous() copy.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "GPU Memory Coalescing Failure on Non-Contiguous Tensors",
          prompt:
            "Why does executing a CUDA elementwise addition kernel on a transposed tensor (stride=[1, 2048]) run up to 8x slower than on a contiguous tensor (stride=[2048, 1])?",
          engineeringContext:
            "In CUDA, 32 threads in a warp access elements at indices tid*1 vs tid*2048. Contiguous strides collapse all 32 reads into one 128B DRAM sector burst. Non-contiguous strides scatter addresses across 32 distinct DRAM sectors, saturating the memory bus with 32x the minimum required transaction count.",
        },
        {
          title: "Autograd View In-Place Mutation Version Trap",
          prompt:
            "Why does PyTorch throw a RuntimeError when mutating a tensor view in-place during the forward pass if that tensor is needed for backpropagation?",
          engineeringContext:
            "The autograd engine saves tensor views for backward chain rule evaluation. In-place mutations modify the underlying storage without notifying backward closures, causing silent mathematical gradient corruption. PyTorch detects this via an internal _version counter check.",
        },
      ],
      partD_stressTests: [
        {
          title: "Silent Memory Corruption from Writing to Zero-Stride Broadcasted Views",
          scenario:
            "An engineer expands a bias vector of shape (1, 1024) to (64, 1024) via .expand() and attempts to initialize it by writing random values directly to the expanded tensor view in-place.",
          failureMode:
            "Because the broadcasted dimension has stride 0, writing to expanded[i, j] overwrites expanded[0, j] for all batch indices i. The last batch write silently overwrites all previous iterations, corrupting the initialization.",
        },
      ],
    },
  ],
};
