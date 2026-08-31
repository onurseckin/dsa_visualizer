import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_parallelism_3d_moe_1f1b_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "3D Parallelism & MoE: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Pipeline Execution (GPipe Bubble Disaster)",
          code: `from typing import List
import numpy as np

def gpipe_naive_schedule(num_stages: int, num_microbatches: int) -> int:
    """
    GPipe Schedule:
    All M forward passes execute across P stages, then all M backward passes execute.
    Activation memory peak: O(M) microbatches held in VRAM!
    Bubble overhead: 2 * (P - 1) / (2 * M + 2 * (P - 1))
    """
    timeline = []
    # Total time steps = 2 * (num_microbatches + num_stages - 1)
    return 2 * (num_microbatches + num_stages - 1)`,
          explanation:
            "GPipe forces all forward microbatches to complete before launching backward passes, accumulating massive activation memory and suffering from 50%+ pipeline bubbles.",
          timeComplexity: "O(2 * (M + P - 1) * T_step)",
          spaceComplexity: "O(M * Activation_Size) peak memory on Stage 0",
        },
        {
          label: "Stage 2: Megatron Tensor Parallelism & 1F1B Schedule Simulator",
          code: `import numpy as np
from typing import List, Tuple

class MegatronMLPColumnRowTP:
    """
    Megatron-LM Tensor Parallel MLP:
    1. ColumnParallelLinear for W1: Splitted along columns (No All-Gather needed!)
    2. GeLU elementwise activation in-place.
    3. RowParallelLinear for W2: Splitted along rows.
    4. Single All-Reduce across TP group to yield exact mathematical output.
    """
    def __init__(self, d_model: int, d_ffn: int, tp_rank: int, tp_size: int):
        self.tp_rank = tp_rank
        self.tp_size = tp_size
        self.d_ffn_per_partition = d_ffn // tp_size
        
        # Partition weights
        self.w1_shard = np.random.randn(d_model, self.d_ffn_per_partition).astype(np.float32)
        self.w2_shard = np.random.randn(self.d_ffn_per_partition, d_model).astype(np.float32)
        
    def forward(self, x: np.ndarray, tp_group_allreduce_fn) -> np.ndarray:
        # x: [B, S, d_model]
        # Column Parallel Forward: [B, S, d_ffn / tp_size]
        h = np.matmul(x, self.w1_shard)
        h_act = np.maximum(0, h)  # ReLU / GeLU
        
        # Row Parallel Forward: [B, S, d_model] (Partial sum!)
        y_partial = np.matmul(h_act, self.w2_shard)
        
        # Single All-Reduce to sum partial contributions across all TP ranks
        y_final = tp_group_allreduce_fn(y_partial)
        return y_final`,
          explanation:
            "Megatron-LM dual decomposition. Column-parallel linear followed by row-parallel linear requires only 1 All-Reduce per MLP layer, avoiding intermediate communication.",
          timeComplexity: "O(Compute / tp_size) + 1 All-Reduce per layer",
          spaceComplexity: "O(Model_Weights / tp_size) per GPU",
        },
        {
          label: "Stage 3: Distributed Mixture-of-Experts (MoE) Router & All-to-All Dispatcher",
          code: `from typing import Dict, List, Tuple
import numpy as np

class MoERouterAndDispatcher:
    """
    Top-2 Sparse MoE Router with Capacity Factor and All-to-All Dispatch:
    1. Computes gating logits over E experts.
    2. Selects Top-2 experts per token with Softmax gating weights.
    3. Throttles expert assignments via Capacity Factor: C * (T / E).
    4. Dispatches tokens across Expert Parallel (EP) ranks via All-to-All.
    """
    def __init__(self, num_experts: int = 8, top_k: int = 2, capacity_factor: float = 1.25):
        self.E = num_experts
        self.top_k = top_k
        self.capacity_factor = capacity_factor
        
    def route_and_dispatch(self, x: np.ndarray, router_weights: np.ndarray) -> Tuple[np.ndarray, np.ndarray, List[List[int]]]:
        # x: [Total_Tokens, d_model]
        # router_weights: [d_model, E]
        N, D = x.shape
        expert_capacity = int(np.ceil((self.capacity_factor * N * self.top_k) / float(self.E)))
        
        # 1. Gating Logits & Softmax: [N, E]
        logits = np.matmul(x, router_weights)
        exp_logits = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
        probs = exp_logits / np.sum(exp_logits, axis=-1, keepdims=True)
        
        # 2. Select Top-K Experts per token
        top_indices = np.argsort(-probs, axis=-1)[:, :self.top_k]  # [N, top_k]
        top_weights = np.take_along_axis(probs, top_indices, axis=-1)
        top_weights /= np.sum(top_weights, axis=-1, keepdims=True)  # Renormalize
        
        # 3. Capacity Factor Throttling (Dropping overflow tokens)
        expert_assignments = [[] for _ in range(self.E)]
        dispatch_mask = np.zeros((N, self.top_k), dtype=bool)
        
        for tok_idx in range(N):
            for k in range(self.top_k):
                exp_id = top_indices[tok_idx, k]
                if len(expert_assignments[exp_id]) < expert_capacity:
                    expert_assignments[exp_id].append(tok_idx)
                    dispatch_mask[tok_idx, k] = True
                # Else: token dropped for this expert to prevent buffer overflow!
                
        return top_indices, top_weights, expert_assignments`,
          explanation:
            "Top-$k$ sparse MoE gating router with capacity factor buffer throttling. Enforces deterministic communication payload sizing for All-to-All distributed dispatch.",
          timeComplexity: "O(N * d * E) gating + O(Tokens_per_Expert * d) compute",
          spaceComplexity: "O(Capacity * d) fixed dispatch buffers",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Interconnect Mapping: The 3D Parallelism Hierarchy Matrix",
      content:
        "To achieve maximum scaling efficiency across 10,000+ GPUs, parallel dimensions must strictly map to physical interconnect tiers:\\n\\n1. **Tensor Parallelism (TP=8):** Placed **strictly inside a single 8-GPU node** over 900 GB/s NVLink. TP requires 2 All-Reduces per transformer layer; running TP across slower InfiniBand collapses performance.\\n\\n2. **Pipeline Parallelism (PP=4-8):** Placed across nodes over InfiniBand (P2P send/recv activation passing). Only boundary activations are transferred, hiding network latency.\\n\\n3. **Data / ZeRO Parallelism (DP=32-128):** Spans across racks with Ring/Tree All-Reduce collective communication overlapped with backward compute.\\n\\n4. **Expert Parallelism (EP=8-64):** Uses All-to-All collectives across high-bandwidth InfiniBand spine networks.",
    },
  ],
};
