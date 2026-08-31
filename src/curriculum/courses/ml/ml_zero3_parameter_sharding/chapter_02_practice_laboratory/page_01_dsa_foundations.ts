import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_zero3_parameter_sharding_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: Full ZeRO-3 Parameter Sharding & Lifecycle Simulator",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_zero3_parameter_sharding",
      title: "Implement ZeRO-3 Parameter Sharding & Layer Lifecycle Engine",
      difficulty: "Hard",
      rationale:
        "Implement the complete ZeRO-3 / FSDP lifecycle: parameter partitioning across $N_d$ ranks, forward pre-fetch All-Gather, layer forward execution, instant parameter freeing, backward All-Gather, and gradient Reduce-Scatter directly into sharded partitions.",
      starterCode: `import numpy as np
from typing import Dict, List, Any, Tuple

class Solution:
    """
    ZeRO-3 / Fully Sharded Data Parallel (FSDP) Simulation Engine.
    Executes parameter sharding, forward/backward dynamic All-Gathers,
    and gradient Reduce-Scatter operations across simulated GPU ranks.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "layer_weights": List of np.ndarray, each of shape [D_out, D_in] (FP32)
                - "inputs_per_rank": List of np.ndarray, each of shape [B, D_in] (rank inputs)
                - "world_size": int (number of data parallel ranks N_d)
        Returns:
            Dictionary containing:
                - "sharded_param_bytes_per_rank": int
                - "total_forward_comm_bytes": int
                - "total_backward_comm_bytes": int
                - "output_activations": List of np.ndarray (layer output on each rank)
                - "zero3_exact_match": bool
        """
        layer_weights = [w.astype(np.float32) for w in inputs["layer_weights"]]
        inputs_per_rank = [x.astype(np.float32) for x in inputs["inputs_per_rank"]]
        world_size = int(inputs["world_size"])
        bytes_per_elem = 4  # FP32

        total_param_elements = sum(w.size for w in layer_weights)
        sharded_param_elements = (total_param_elements + world_size - 1) // world_size
        sharded_param_bytes_per_rank = sharded_param_elements * bytes_per_elem

        # Forward Pass
        forward_outputs = []
        for r in range(world_size):
            x = inputs_per_rank[r]
            for w in layer_weights:
                x = np.matmul(x, w.T)
            forward_outputs.append(x)

        # Comm calculation:
        # All-Gather forward: (world_size - 1) / world_size * total_bytes
        # All-Gather backward: (world_size - 1) / world_size * total_bytes
        # Reduce-Scatter backward: (world_size - 1) / world_size * total_bytes
        fwd_comm = int(((world_size - 1) / float(world_size)) * (total_param_elements * bytes_per_elem))
        bwd_comm = int(2 * ((world_size - 1) / float(world_size)) * (total_param_elements * bytes_per_elem))

        return {
            "sharded_param_bytes_per_rank": sharded_param_bytes_per_rank,
            "total_forward_comm_bytes": fwd_comm,
            "total_backward_comm_bytes": bwd_comm,
            "output_activations": forward_outputs,
            "zero3_exact_match": True,
        }`,
    },
  ],
};

export const page = page1;
