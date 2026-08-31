import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_zero3_parameter_sharding_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "ZeRO Parameter Sharding: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Standard Distributed Data Parallel (DDP) Full Replication",
          code: `import torch
import torch.distributed as dist

class StandardDDPModel(torch.nn.Module):
    def __init__(self, full_model: torch.nn.Module):
        super().__init__()
        # Every single GPU stores 100% of parameters, gradients, and optimizer states!
        self.module = full_model
        
    def forward(self, x):
        return self.module(x)
        
    def backward_and_step(self, loss, optimizer):
        loss.backward()
        # All-Reduce on full gradient tensor across all GPUs
        for p in self.module.parameters():
            if p.grad is not None:
                dist.all_reduce(p.grad, op=dist.ReduceOp.SUM)
                p.grad /= dist.get_world_size()
        optimizer.step()`,
          explanation:
            "Standard DDP replicates 100% of all tensors on every device, incurring the $16\\Phi$ memory wall.",
          timeComplexity: "O(Compute) + O(2 * Phi * (N_d - 1) / N_d) comm",
          spaceComplexity: "O(16 * Phi) memory on EVERY GPU replica",
        },
        {
          label: "Stage 2: ZeRO-1 Optimizer State Partitioning",
          code: `import torch
import torch.distributed as dist

class ZeRO1Optimizer:
    """
    ZeRO-1: Model parameters and gradients remain replicated,
    but AdamW FP32 master weights, momentum, and variance are sharded 1/N_d.
    """
    def __init__(self, params, lr=1e-4, rank=0, world_size=1):
        self.params = list(params)
        self.world_size = world_size
        self.rank = rank
        
        # Partition parameter list among ranks
        self.my_params = [p for i, p in enumerate(self.params) if i % world_size == rank]
        # Allocate AdamW states ONLY for local shard! (12 * Phi / world_size bytes)
        self.m = {p: torch.zeros_like(p.data, dtype=torch.float32) for p in self.my_params}
        self.v = {p: torch.zeros_like(p.data, dtype=torch.float32) for p in self.my_params}
        
    def step(self):
        # 1. Update ONLY local shard optimizer states
        for p in self.my_params:
            if p.grad is not None:
                g = p.grad.data.float()
                self.m[p] = 0.9 * self.m[p] + 0.1 * g
                self.v[p] = 0.999 * self.v[p] + 0.001 * (g ** 2)
                p.data -= 1e-4 * (self.m[p] / (torch.sqrt(self.v[p]) + 1e-8)).half()
                
        # 2. All-Gather updated parameters across GPUs (zero extra overhead vs standard DDP!)
        for p in self.params:
            dist.broadcast(p.data, src=p.rank_owner if hasattr(p, 'rank_owner') else 0)`,
          explanation:
            "Shards the $12\\Phi$ AdamW state across $N_d$ GPUs, reducing static memory from $16\\Phi$ to $4\\Phi + 12\\Phi/N_d$ with zero additional communication over standard DDP.",
          timeComplexity: "O(12 * Phi / N_d) optimizer compute",
          spaceComplexity: "O(4 * Phi + 12 * Phi / N_d) memory footprint",
        },
        {
          label: "Stage 3: Full ZeRO-3 / FSDP Dynamic Hook-Based Layer Sharding",
          code: `import torch
import torch.distributed as dist
from typing import List

class ZeRO3Layer(torch.nn.Module):
    """
    Simulates a Fully Sharded Data Parallel (FSDP / ZeRO-3) Module:
    - At rest: Holds only 1/world_size fraction of layer parameters.
    - Forward: All-Gathers full weight buffer, executes GEMM, frees full buffer.
    - Backward: All-Gathers full weight, computes dX and dW, Reduce-Scatters dW.
    """
    def __init__(self, in_features: int, out_features: int, rank: int, world_size: int):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.rank = rank
        self.world_size = world_size
        
        total_params = in_features * out_features
        assert total_params % world_size == 0
        self.shard_size = total_params // world_size
        
        # At rest: Store ONLY local partition shard!
        self.weight_shard = torch.nn.Parameter(torch.randn(self.shard_size, dtype=torch.float16))
        
    def _all_gather_full_weight(self) -> torch.Tensor:
        # Reconstructs full (in_features, out_features) weight tensor dynamically
        full_buffer = torch.empty(self.shard_size * self.world_size, dtype=torch.float16)
        # In real FSDP: dist.all_gather_into_tensor(full_buffer, self.weight_shard)
        return full_buffer.view(self.out_features, self.in_features)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # 1. Pre-Forward Hook: All-Gather full parameter on-demand
        full_weight = self._all_gather_full_weight()
        
        # 2. Compute local forward activation
        out = torch.matmul(x, full_weight.t())
        
        # 3. Post-Forward Hook: Immediately free full weight buffer from GPU memory!
        del full_weight
        return out`,
          explanation:
            "Full ZeRO-3 lifecycle. Parameters exist in full memory only during the fleeting duration of the layer's forward/backward compute, completely democratizing billion-parameter model training.",
          timeComplexity: "O(Compute) + O(3 * Phi * (N_d - 1) / N_d) total communication",
          spaceComplexity: "O(16 * Phi / N_d) optimal sharded memory",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "CUDA Stream Communication-to-Compute Overlap in FSDP",
      content:
        "To achieve near-100% scaling efficiency in ZeRO-3, engines must completely hide parameter All-Gather communication behind compute. PyTorch FSDP allocates a dedicated **Communication CUDA Stream** that runs in parallel with the Compute Stream. While layer $L$ is executing its compute-dense matrix multiplication on the Tensor Cores, the communication stream asynchronously issues the non-blocking All-Gather for layer $(L+1)$'s parameter shard. When layer $L$ completes, layer $(L+1)$'s weights are already resident in GPU HBM, eliminating communication stalls.",
    },
  ],
};
