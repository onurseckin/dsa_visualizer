import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_tensor_strides_views_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Tensor Stride & Window Laboratories",
  subtitle: "Interactive Implementation of Zero-Copy Reshape and Sliding Windows",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_tensor_strides_views_can_view",
      title: "Tensor Viewability & Reshape Stride Solver",
      difficulty: "Hard",
      rationale:
        "Determines whether a tensor with given shape and strides can be reshaped into target_shape as a zero-copy view, or whether memory copying is required.",
      starterCode: `def can_reshape_as_view(
    orig_shape: list[int],
    orig_strides: list[int],
    target_shape: list[int]
) -> tuple[bool, list[int] | None]:
    """
    Analyzes whether a tensor can be reshaped into target_shape without copying memory.
    
    Returns:
        (is_viewable, new_strides):
        If True, new_strides contains the computed strides for target_shape.
        If False, returns (False, None).
    """
    # 1. Total elements must match
    import math
    if math.prod(orig_shape) != math.prod(target_shape):
        raise ValueError("Total element count mismatch between source and target shapes.")
        
    # Filter out singleton dimensions of size 1 for contiguity analysis
    # Check if original tensor is C-contiguous across collapsing dimension groups
    # TODO: Implement complete stride inference logic
    pass

if __name__ == "__main__":
    # Test 1: Contiguous 2x3x4 -> 6x4 (Should be viewable)
    shape = [2, 3, 4]
    strides = [12, 4, 1]
    target = [6, 4]
    # Expected: (True, [4, 1])
    
    # Test 2: Transposed 2x3 (strides [1, 2]) -> 6 (Should NOT be viewable without copy)
    transposed_shape = [3, 2]
    transposed_strides = [1, 3] # non-contiguous
    target2 = [6]
    # Expected: (False, None)
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_tensor_strides_views_sliding_1d",
      title: "1D Sliding Window Stride Generator",
      difficulty: "Medium",
      rationale:
        "Builds a sliding window stride view over a 1D sequence for sequence modeling / convolution with zero memory duplication.",
      starterCode: `def make_sliding_window_1d(
    signal: list[float],
    window_len: int,
    stride: int = 1
) -> tuple[tuple[int, int], tuple[int, int], list[float]]:
    """
    Constructs 2D sliding window view parameters over a 1D flat list.
    
    Args:
        signal: 1D flat list of float values
        window_len: Length of the sliding observation window
        stride: Step size between consecutive windows
        
    Returns:
        (view_shape, view_strides, raw_storage):
        view_shape: (num_windows, window_len)
        view_strides: (stride_between_windows, stride_within_window)
        raw_storage: The original signal list (zero copy)
    """
    N = len(signal)
    if window_len > N:
        raise ValueError("Window length cannot exceed signal length.")
        
    num_windows = (N - window_len) // stride + 1
    view_shape = (num_windows, window_len)
    # Each window step advances 'stride' elements; within window advances 1 element
    view_strides = (stride, 1)
    
    return view_shape, view_strides, signal
`,
    },
  ],
};
