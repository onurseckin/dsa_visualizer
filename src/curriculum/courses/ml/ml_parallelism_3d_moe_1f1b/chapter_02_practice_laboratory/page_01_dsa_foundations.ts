import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_parallelism_3d_moe_1f1b_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: 1F1B Pipeline Schedule & MoE Routing Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_parallelism_3d_moe_1f1b",
      title: "Implement 1F1B Pipeline Scheduler & Top-2 MoE Gating Engine",
      difficulty: "Hard",
      rationale:
        "Implement a complete 1F1B pipeline schedule timeline generator and a Top-2 sparse MoE gating router with capacity factor token throttling and load balancing metrics.",
      starterCode: `import numpy as np
from typing import Dict, List, Any, Tuple

class Solution:
    """
    3D Parallelism and MoE Routing Simulator.
    Generates 1F1B schedule timelines, calculates pipeline bubble ratios,
    and executes Top-K MoE routing with capacity factor enforcement.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "num_stages": int (pipeline depth P)
                - "num_microbatches": int (microbatch count M)
                - "tokens_x": np.ndarray of shape [N, D] (token embeddings)
                - "router_weights": np.ndarray of shape [D, E] (MoE gate weights)
                - "top_k": int (e.g. 2)
                - "capacity_factor": float (e.g. 1.25)
        Returns:
            Dictionary containing:
                - "pipeline_bubble_fraction": float (theoretical (P-1)/(M+P-1))
                - "total_pipeline_steps": int ((M + P - 1))
                - "expert_assignments": List of List[int] (token indices assigned to each expert)
                - "dropped_tokens_count": int (tokens dropped due to capacity exhaustion)
                - "expert_load_distribution": List[int] (number of tokens dispatched per expert)
        """
        P = int(inputs["num_stages"])
        M = int(inputs["num_microbatches"])
        tokens_x = inputs["tokens_x"].astype(np.float32)
        router_weights = inputs["router_weights"].astype(np.float32)
        top_k = int(inputs.get("top_k", 2))
        capacity_factor = float(inputs.get("capacity_factor", 1.25))

        # 1. Pipeline schedule metrics
        bubble_fraction = float((P - 1) / float(M + P - 1)) if (M + P - 1) > 0 else 0.0
        total_steps = M + P - 1

        # 2. MoE Gating Router
        N, D = tokens_x.shape
        _, E = router_weights.shape

        logits = np.matmul(tokens_x, router_weights)  # [N, E]
        exp_l = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
        probs = exp_l / np.sum(exp_l, axis=-1, keepdims=True)

        top_indices = np.argsort(-probs, axis=-1)[:, :top_k]  # [N, top_k]

        expert_capacity = int(np.ceil((capacity_factor * N * top_k) / float(E)))
        expert_assignments = [[] for _ in range(E)]
        dropped_count = 0

        for tok_idx in range(N):
            for k in range(top_k):
                exp_id = int(top_indices[tok_idx, k])
                if len(expert_assignments[exp_id]) < expert_capacity:
                    expert_assignments[exp_id].append(tok_idx)
                else:
                    dropped_count += 1

        load_distribution = [len(expert_assignments[e]) for e in range(E)]

        return {
            "pipeline_bubble_fraction": bubble_fraction,
            "total_pipeline_steps": total_steps,
            "expert_assignments": expert_assignments,
            "dropped_tokens_count": dropped_count,
            "expert_load_distribution": load_distribution,
        }`,
    },
  ],
};

export const page = page1;
