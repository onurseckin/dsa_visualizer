import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_matrix_memory_layout_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Multi-Dimensional Stride & Offset Engine",
  subtitle: "Interactive Engineering Challenges on Physical Memory Traversal",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_matrix_memory_layout_offset",
      title: "Arbitrary N-D Tensor Flat Byte Offset Engine",
      difficulty: "Hard",
      rationale:
        "Validates exact comprehension of the affine stride mapping formula Address = Base + E * sum(Index[d] * Stride[d]) and detects non-contiguous out-of-bound indexing.",
      starterCode: `def compute_flat_byte_offset(
    indices: list[int],
    shape: list[int],
    strides: list[int],
    itemsize_bytes: int = 4,
    base_offset: int = 0
) -> int:
    """
    Computes the exact linear byte offset for a multi-dimensional coordinate in an N-D tensor.
    
    Args:
        indices: Coordinate tuple [i_0, i_1, ..., i_{n-1}]
        shape: Tensor dimensions [d_0, d_1, ..., d_{n-1}]
        strides: Stride tuple [s_0, s_1, ..., s_{n-1}] in element counts
        itemsize_bytes: Size of each element in bytes (e.g., 4 for float32, 2 for bfloat16)
        base_offset: Initial byte offset from tensor storage base pointer
        
    Returns:
        Exact byte offset in flat 1D memory buffer.
        
    Raises:
        ValueError: If indices length doesn't match shape, or any index is out of bounds [0, shape[d] - 1].
    """
    if len(indices) != len(shape) or len(shape) != len(strides):
        raise ValueError("Dimensionality mismatch between indices, shape, and strides.")
        
    element_offset = 0
    for dim, (idx, dim_size, stride) in enumerate(zip(indices, shape, strides)):
        if not (0 <= idx < dim_size):
            raise ValueError(f"Index {idx} out of bounds for dimension {dim} with size {dim_size}.")
        element_offset += idx * stride
        
    return base_offset + (element_offset * itemsize_bytes)

# Test verification
if __name__ == "__main__":
    # Test 3D Tensor (Batch=2, Channels=3, Width=4) in C-contiguous layout
    # Strides: [3*4, 4, 1] = [12, 4, 1]
    shape = [2, 3, 4]
    strides = [12, 4, 1]
    target_idx = [1, 2, 3]
    # Expected element offset = 1*12 + 2*4 + 3*1 = 12 + 8 + 3 = 23
    # In float32 (4 bytes): 23 * 4 = 92 bytes
    byte_offset = compute_flat_byte_offset(target_idx, shape, strides, itemsize_bytes=4)
    print(f"Computed byte offset: {byte_offset} bytes (Expected: 92 bytes)")
    assert byte_offset == 92, "Test failed!"
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_matrix_memory_layout_cache_sim",
      title: "Cache Line Miss Simulator (64-Byte Lines)",
      difficulty: "Hard",
      rationale:
        "Simulates direct-mapped / set-associative cache line hits and misses for various matrix loop orderings (IJK vs IKJ vs JIK) to prove spatial locality benefits.",
      starterCode: `from typing import Literal

def simulate_matrix_traversal_cache_misses(
    rows: int,
    cols: int,
    order: Literal["row_major", "column_major"],
    cache_line_bytes: int = 64,
    elem_bytes: int = 4
) -> dict[str, float]:
    """
    Simulates cache line loads for a 2D matrix traversal stored in C-contiguous (row-major) RAM.
    
    Args:
        rows: Number of rows in matrix (M)
        cols: Number of cols in matrix (N)
        order: "row_major" (inner loop cols) or "column_major" (inner loop rows)
        cache_line_bytes: Hardware cache line size (standard 64B)
        elem_bytes: Bytes per element (4 for float32)
        
    Returns:
        Dict with total_accesses, cache_misses, cache_hits, and miss_rate.
    """
    elems_per_line = cache_line_bytes // elem_bytes
    total_accesses = rows * cols
    
    # Track the currently active cache line tag
    # In a simplified linear stream with single line cache:
    loaded_cache_line_id = -1
    miss_count = 0
    
    if order == "row_major":
        for i in range(rows):
            for j in range(cols):
                flat_elem_idx = i * cols + j
                cache_line_id = flat_elem_idx // elems_per_line
                if cache_line_id != loaded_cache_line_id:
                    miss_count += 1
                    loaded_cache_line_id = cache_line_id
    elif order == "column_major":
        for j in range(cols):
            for i in range(rows):
                flat_elem_idx = i * cols + j
                cache_line_id = flat_elem_idx // elems_per_line
                if cache_line_id != loaded_cache_line_id:
                    miss_count += 1
                    loaded_cache_line_id = cache_line_id
                    
    hits = total_accesses - miss_count
    return {
        "total_accesses": total_accesses,
        "cache_misses": miss_count,
        "cache_hits": hits,
        "miss_rate": miss_count / total_accesses
    }

if __name__ == "__main__":
    res_row = simulate_matrix_traversal_cache_misses(1024, 1024, "row_major")
    res_col = simulate_matrix_traversal_cache_misses(1024, 1024, "column_major")
    print(f"Row-major miss rate: {res_row['miss_rate']:.4%}")
    print(f"Column-major miss rate: {res_col['miss_rate']:.4%}")
`,
    },
  ],
};
