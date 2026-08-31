import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_tensor_strides_views_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Stride Engine Progression",
  subtitle: "GPU Coalescing, Autograd Version Tracking, and Custom Stride Engines",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: GPU Coalescing & Autograd Version Tracking",
      content:
        "1. **GPU Memory Coalescing**: On NVIDIA GPUs, 32 threads in a warp execute memory instructions simultaneously. If threads access contiguous 32-bit floats, the hardware coalesces 32 scalar reads into a single 128-byte DRAM transaction. When operating on a transposed tensor (e.g. stride = [1, 2048]), all 32 threads in a warp access non-contiguous addresses separated by 2048 elements, forcing the memory controller to emit 32 separate 32-byte transactions—a catastrophic 8x degradation in effective VRAM bandwidth.\n2. **Autograd In-Place Hazard**: PyTorch tracks an internal `_version` counter on each storage buffer. If an in-place operation (e.g., `tensor.add_()`) mutates memory aliased by a saved activation view, the backward pass fails with `RuntimeError: one of the variables needed for gradient computation has been modified by an in-place operation`.",
    },
    {
      type: "code_progression",
      title: "Building an N-Dimensional Tensor & Zero-Copy View Engine",
      language: "python",
      stages: [
        {
          label: "Stage 1: Pure Python Basic Strided Tensor",
          code: `class SimpleStridedTensor:
    """
    Basic strided tensor with flat 1D storage.
    Demonstrates physical decoupling of storage and view coordinates.
    """
    def __init__(self, data: list[float], shape: tuple[int, ...], strides: tuple[int, ...] | None = None, offset: int = 0):
        self.storage = data
        self.shape = shape
        self.offset = offset
        if strides is None:
            # Default C-contiguous strides
            self.strides = self._compute_c_strides(shape)
        else:
            self.strides = strides

    def _compute_c_strides(self, shape: tuple[int, ...]) -> tuple[int, ...]:
        strides = [1] * len(shape)
        for d in range(len(shape) - 2, -1, -1):
            strides[d] = strides[d + 1] * shape[d + 1]
        return tuple(strides)

    def get(self, *indices: int) -> float:
        assert len(indices) == len(self.shape), "Index dimensionality mismatch"
        flat_idx = self.offset
        for i, s in zip(indices, self.strides):
            flat_idx += i * s
        return self.storage[flat_idx]`,
          explanation:
            "Linear index computation decouples storage from dimensionality. No multi-dimensional lists of lists are needed.",
          timeComplexity: "O(D) coordinate calculation",
          spaceComplexity: "O(1) metadata overhead",
        },
        {
          label: "Stage 2: Full Zero-Copy View Engine (Transpose, Permute, Slice, Broadcast)",
          code: `from typing import Any

class NDTensorView:
    """
    Production-grade Zero-Copy View Engine.
    Implements transpose, permute, slicing, and zero-stride broadcasting in O(1) time.
    """
    def __init__(
        self,
        storage: list[float],
        shape: tuple[int, ...],
        strides: tuple[int, ...],
        offset: int = 0
    ):
        self.storage = storage
        self.shape = shape
        self.strides = strides
        self.offset = offset

    @classmethod
    def from_flat_data(cls, data: list[float], shape: tuple[int, ...]) -> "NDTensorView":
        strides = [1] * len(shape)
        for d in range(len(shape) - 2, -1, -1):
            strides[d] = strides[d + 1] * shape[d + 1]
        return cls(data, shape, tuple(strides), offset=0)

    def is_contiguous(self) -> bool:
        expected_stride = 1
        for d in range(len(self.shape) - 1, -1, -1):
            if self.shape[d] <= 1:
                continue
            if self.strides[d] != expected_stride:
                return False
            expected_stride *= self.shape[d]
        return True

    def transpose(self, dim0: int, dim1: int) -> "NDTensorView":
        """O(1) Zero-copy transpose by swapping shape and stride metadata."""
        new_shape = list(self.shape)
        new_strides = list(self.strides)
        new_shape[dim0], new_shape[dim1] = new_shape[dim1], new_shape[dim0]
        new_strides[dim0], new_strides[dim1] = new_strides[dim1], new_strides[dim0]
        return NDTensorView(self.storage, tuple(new_shape), tuple(new_strides), self.offset)

    def permute(self, *dims: int) -> "NDTensorView":
        """O(1) Zero-copy permutation of arbitrary dimensions."""
        assert len(dims) == len(self.shape), "Permute dims must match rank"
        new_shape = tuple(self.shape[d] for d in dims)
        new_strides = tuple(self.strides[d] for d in dims)
        return NDTensorView(self.storage, new_shape, new_strides, self.offset)

    def broadcast_to(self, new_shape: tuple[int, ...]) -> "NDTensorView":
        """O(1) Zero-copy broadcasting by assigning stride 0 to expanded singleton axes."""
        assert len(new_shape) >= len(self.shape), "Cannot broadcast to smaller rank"
        # Pad self.shape with 1s on the left
        pad = len(new_shape) - len(self.shape)
        old_shape = (1,) * pad + self.shape
        old_strides = (0,) * pad + self.strides
        
        new_strides = []
        for o_dim, n_dim, o_str in zip(old_shape, new_shape, old_strides):
            if o_dim == n_dim:
                new_strides.append(o_str)
            elif o_dim == 1:
                # Stride 0 allows arbitrary replication with zero bytes copied!
                new_strides.append(0)
            else:
                raise ValueError(f"Cannot broadcast shape {self.shape} to {new_shape}")
                
        return NDTensorView(self.storage, new_shape, tuple(new_strides), self.offset)`,
          explanation:
            "All transformations execute strictly in $O(1)$ time with zero allocations. Broadcasting assigns a stride of 0 to replicate data along axes virtually.",
          timeComplexity: "O(1) for transpose, permute, broadcast_to",
          spaceComplexity: "O(1) metadata allocation",
        },
        {
          label: "Stage 3: Advanced Sliding Window as_strided & Contiguous Coalescing",
          code: `import numpy as np

def sliding_window_view_2d(
    image: np.ndarray,
    window_shape: tuple[int, int],
    stride: tuple[int, int] = (1, 1)
) -> np.ndarray:
    """
    Constructs a 4D sliding window view over a 2D image with ZERO memory allocation using as_strided.
    Useful for zero-copy Convolution im2col and patch extraction.
    
    Args:
        image: 2D array of shape (H, W)
        window_shape: (kH, kW) kernel window dimensions
        stride: (sH, sW) step size in rows and columns
        
    Returns:
        4D view of shape (out_H, out_W, kH, kW) sharing the exact same storage buffer.
    """
    H, W = image.shape
    kH, kW = window_shape
    sH, sW = stride
    
    out_H = (H - kH) // sH + 1
    out_W = (W - kW) // sW + 1
    
    orig_stride_H, orig_stride_W = image.strides
    
    # New 4D shape: (out_H, out_W, kH, kW)
    new_shape = (out_H, out_W, kH, kW)
    # Strides: jump sH rows, jump sW cols, step 1 row within window, step 1 col within window
    new_strides = (
        orig_stride_H * sH,
        orig_stride_W * sW,
        orig_stride_H,
        orig_stride_W
    )
    
    return np.lib.stride_tricks.as_strided(
        image,
        shape=new_shape,
        strides=new_strides,
        writeable=False  # Mark non-writable to prevent memory corruption across overlapping windows
    )`,
          explanation:
            "Constructs an $O(N)$ sliding window feature tensor with $O(1)$ time and $O(1)$ extra memory. Overlapping window indices simply reference identical memory addresses via affine strides.",
          timeComplexity: "O(1) window creation",
          spaceComplexity: "O(1) auxiliary memory (zero copies)",
        },
      ],
      stepByStep: [
        "1. Decouple storage buffer allocation from dimension geometry.",
        "2. Represent coordinate indexing as linear inner product $\\text{offset} + \\mathbf{i} \\cdot \\mathbf{s}$.",
        "3. Implement zero-copy operations (`transpose`, `permute`, `slice`, `expand`) via metadata mutations.",
        "4. Enforce contiguity checks before kernel launches requiring coalesced memory bursts.",
      ],
    },
  ],
};
