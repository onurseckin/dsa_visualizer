import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_compiler_fusion_liveness_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: Compiler Memory Arena & Liveness Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_compiler_fusion_liveness",
      title: "Implement Compiler Memory Arena Allocator from Liveness Graph",
      difficulty: "Hard",
      rationale:
        "Implement an interval-graph based memory arena allocator that analyzes tensor liveness intervals $[t_{\\text{start}}, t_{\\text{end}}]$ and assigns conflict-free base byte offsets to minimize peak GPU memory footprint.",
      starterCode: `from typing import Dict, List, Any, Tuple
import numpy as np

class Solution:
    """
    Compiler Liveness Interval Memory Arena Allocator.
    Assigns physical memory offsets to tensors based on liveness intervals,
    achieving maximum buffer reuse and minimum peak memory.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "tensors": List of dicts, each with:
                    - "name": str
                    - "size_bytes": int
                    - "start_step": int
                    - "end_step": int
        Returns:
            Dictionary containing:
                - "tensor_offsets": Dict[str, int] (assigned byte offset in arena)
                - "peak_arena_bytes": int (total memory required by optimal arena)
                - "naive_total_bytes": int (sum of all tensor sizes without reuse)
                - "memory_savings_percent": float
        """
        raw_tensors = inputs["tensors"]
        naive_total = sum(int(t["size_bytes"]) for t in raw_tensors)

        # Sort tensors by start_step ascending, then by size_bytes descending
        sorted_tensors = sorted(raw_tensors, key=lambda t: (int(t["start_step"]), -int(t["size_bytes"])))

        # List of active allocations: dicts of {"end": int, "offset": int, "size": int}
        active_allocations = []
        free_blocks = []  # list of (offset, size)

        tensor_offsets = {}
        peak_arena = 0

        for t in sorted_tensors:
            name = t["name"]
            size = int(t["size_bytes"])
            start = int(t["start_step"])
            end = int(t["end_step"])

            # 1. Reclaim dead blocks
            still_active = []
            for alloc in active_allocations:
                if alloc["end"] <= start:
                    free_blocks.append((alloc["offset"], alloc["size"]))
                else:
                    still_active.append(alloc)
            active_allocations = still_active

            # 2. Try best-fit in free pool
            best_idx = -1
            best_waste = float('inf')
            for idx, (f_off, f_sz) in enumerate(free_blocks):
                if f_sz >= size and (f_sz - size) < best_waste:
                    best_idx = idx
                    best_waste = f_sz - size

            if best_idx != -1:
                f_off, f_sz = free_blocks.pop(best_idx)
                tensor_offsets[name] = f_off
                active_allocations.append({"end": end, "offset": f_off, "size": size})
                if f_sz > size:
                    # Return remaining fragment to free pool
                    free_blocks.append((f_off + size, f_sz - size))
            else:
                # Allocate new offset at arena peak
                offset = peak_arena
                tensor_offsets[name] = offset
                peak_arena += size
                active_allocations.append({"end": end, "offset": offset, "size": size})

        savings = ((naive_total - peak_arena) / float(naive_total)) * 100.0 if naive_total > 0 else 0.0

        return {
            "tensor_offsets": tensor_offsets,
            "peak_arena_bytes": peak_arena,
            "naive_total_bytes": naive_total,
            "memory_savings_percent": savings,
        }`,
    },
  ],
};

export const page = page1;
