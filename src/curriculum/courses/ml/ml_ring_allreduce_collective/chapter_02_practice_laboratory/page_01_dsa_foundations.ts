import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_ring_allreduce_collective_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: Distributed Ring-AllReduce Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_ring_allreduce_collective",
      title: "Implement Distributed Ring-AllReduce Protocol Simulator",
      difficulty: "Hard",
      rationale:
        "Implement the complete Baidu / NCCL Ring-AllReduce collective communication algorithm, executing the $(P-1)$ Reduce-Scatter steps and $(P-1)$ All-Gather steps with cyclic chunk index arithmetic.",
      starterCode: `import numpy as np
from typing import Dict, List, Any, Tuple

class Solution:
    """
    Baidu Ring-AllReduce Distributed Simulator.
    Executes Reduce-Scatter and All-Gather phases across P simulated GPU ranks.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "gpu_buffers": List of np.ndarray, each of shape [S] (float32)
        Returns:
            Dictionary containing:
                - "reduced_buffers": List of np.ndarray, each of shape [S] (reduced global sum on each GPU)
                - "num_steps_executed": int, total communication steps (2 * (P - 1))
                - "bytes_transferred_per_gpu": int, total bytes sent per GPU
                - "reduction_exact_match": bool, whether results match true np.sum across all ranks
        """
        gpu_buffers = [b.astype(np.float32) for b in inputs["gpu_buffers"]]
        P = len(gpu_buffers)
        S = len(gpu_buffers[0])
        assert S % P == 0, "Tensor size S must be divisible by P"
        chunk_size = S // P

        # 1. Chunk partitioning
        # state[r][c] is chunk c on GPU r
        state = [
            [gpu_buffers[r][c * chunk_size : (c + 1) * chunk_size].copy() for c in range(P)]
            for r in range(P)
        ]

        # 2. Phase 1: Reduce-Scatter (P - 1 steps)
        for step in range(P - 1):
            temp_transferred = [None] * P
            for r in range(P):
                send_chunk = (r - step) % P
                src_rank = (r - 1) % P
                temp_transferred[r] = state[src_rank][send_chunk].copy()

            for r in range(P):
                recv_chunk = (r - step - 1) % P
                state[r][recv_chunk] += temp_transferred[r]

        # 3. Phase 2: All-Gather (P - 1 steps)
        for step in range(P - 1):
            temp_transferred = [None] * P
            for r in range(P):
                send_chunk = (r - step + 1) % P
                src_rank = (r - 1) % P
                temp_transferred[r] = state[src_rank][send_chunk].copy()

            for r in range(P):
                recv_chunk = (r - step) % P
                state[r][recv_chunk] = temp_transferred[r]

        # 4. Reassemble full tensors
        reduced_buffers = [np.concatenate(state[r]) for r in range(P)]

        # 5. Verification
        true_sum = np.sum(np.stack(gpu_buffers, axis=0), axis=0)
        exact_match = all(np.allclose(reduced_buffers[r], true_sum) for r in range(P))
        bytes_transferred_per_gpu = 2 * (P - 1) * chunk_size * 4  # 4 bytes per FP32

        return {
            "reduced_buffers": reduced_buffers,
            "num_steps_executed": 2 * (P - 1),
            "bytes_transferred_per_gpu": bytes_transferred_per_gpu,
            "reduction_exact_match": bool(exact_match),
        }`,
    },
  ],
};

export const page = page1;
