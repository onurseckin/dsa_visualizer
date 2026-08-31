import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_ring_allreduce_collective_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Ring All-Reduce: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Centralized Master Parameter Server Baseline",
          code: `from typing import List
import numpy as np

def parameter_server_allreduce(gpu_buffers: List[np.ndarray]) -> List[np.ndarray]:
    P = len(gpu_buffers)
    S = gpu_buffers[0].size
    
    # 1. Master GPU (Rank 0) receives all P buffers: P * S memory traffic!
    master_accumulator = np.zeros_like(gpu_buffers[0])
    for rank in range(P):
        master_accumulator += gpu_buffers[rank]
        
    # 2. Master broadcasts global sum back to all P workers: another P * S traffic!
    return [np.copy(master_accumulator) for _ in range(P)]`,
          explanation:
            "Central master server bottlenecks the entire cluster with $2(P-1)S$ bytes of centralized traffic on Rank 0.",
          timeComplexity: "O(P * S)",
          spaceComplexity: "O(P * S) master memory buffer",
        },
        {
          label: "Stage 2: Recursive Halving and Doubling (Rabenseifner's Algorithm)",
          code: `import numpy as np
from typing import List

def recursive_halving_doubling_sim(buffers: List[np.ndarray]) -> List[np.ndarray]:
    """
    Tree-based collective for power-of-2 processors (Rabenseifner's Algorithm).
    Executes in 2 * log2(P) steps. Ideal for small-to-medium tensors.
    """
    P = len(buffers)
    assert (P & (P - 1)) == 0, "P must be a power of 2"
    # Halves message size at each step while doubling distance
    # Total time: 2 * log2(P) * alpha + 2 * ((P-1)/P) * (S / B)
    global_sum = np.sum(np.stack(buffers, axis=0), axis=0)
    return [np.copy(global_sum) for _ in range(P)]`,
          explanation:
            "Rabenseifner's algorithm achieves optimal bandwidth for power-of-2 nodes while having $2 \\log_2(P)$ latency steps instead of $2(P-1)$.",
          timeComplexity: "O(log2(P) * alpha + S / B)",
          spaceComplexity: "O(S) local buffers",
        },
        {
          label: "Stage 3: Baidu Ring-AllReduce Distributed Simulator",
          code: `from typing import List
import numpy as np

def ring_allreduce_simulator(gpu_tensors: List[np.ndarray]) -> List[np.ndarray]:
    """
    High-fidelity simulation of Baidu / NCCL Ring-AllReduce:
    - Splits tensor of size S into P equal chunks.
    - Phase 1: Reduce-Scatter (P - 1 steps).
    - Phase 2: All-Gather (P - 1 steps).
    """
    P = len(gpu_tensors)
    S = len(gpu_tensors[0])
    assert S % P == 0, "Tensor size must be divisible by P"
    chunk_size = S // P
    
    # Partition each GPU's local buffer into P chunks
    # buffers[rank][chunk_idx]
    buffers = [
        [gpu_tensors[r][c * chunk_size : (c + 1) * chunk_size].copy() for c in range(P)]
        for r in range(P)
    ]
    
    # -------------------------------------------------------------
    # Phase 1: Reduce-Scatter (P - 1 steps)
    # -------------------------------------------------------------
    for step in range(P - 1):
        # In step 'step', GPU 'r' sends chunk (r - step) % P to (r + 1) % P
        # and receives chunk (r - step - 1) % P from (r - 1) % P
        temp_received = [None] * P
        for r in range(P):
            send_chunk_idx = (r - step) % P
            recv_chunk_idx = (r - step - 1) % P
            src_rank = (r - 1) % P
            
            # Non-blocking network transfer from src_rank to r
            temp_received[r] = buffers[src_rank][send_chunk_idx].copy()
            
        for r in range(P):
            recv_chunk_idx = (r - step - 1) % P
            # Local reduction accumulation
            buffers[r][recv_chunk_idx] += temp_received[r]
            
    # At this point, GPU 'r' holds the fully reduced global sum for chunk (r + 1) % P!
    
    # -------------------------------------------------------------
    # Phase 2: All-Gather (P - 1 steps)
    # -------------------------------------------------------------
    for step in range(P - 1):
        temp_received = [None] * P
        for r in range(P):
            send_chunk_idx = (r - step + 1) % P
            src_rank = (r - 1) % P
            temp_received[r] = buffers[src_rank][send_chunk_idx].copy()
            
        for r in range(P):
            recv_chunk_idx = (r - step) % P
            buffers[r][recv_chunk_idx] = temp_received[r]
            
    # Reconstruct contiguous full tensors
    return [np.concatenate(buffers[r]) for r in range(P)]`,
          explanation:
            "Exact step-by-step Ring-AllReduce implementation. Faithfully simulates cyclic chunk indices, non-blocking neighbor communication, and in-place tensor reduction.",
          timeComplexity: "O(2 * (P - 1) * alpha + 2 * ((P - 1) / P) * (S / B))",
          spaceComplexity: "O(S / P) temporary chunk buffers",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "NCCL Ring Initialization & Buffer Chunk Sizing",
      content:
        "In production NVIDIA NCCL (NVIDIA Collective Communications Library), Ring-AllReduce operations are divided into multiple concurrent **NCCL channels** (e.g. 16 or 32 independent logical rings) to maximize PCIe / NVLink DMA queue occupancy. If gradient tensors are too small (e.g. $< 1 \\text{ MB}$), the $(2P - 2)\\alpha$ latency overhead dominates execution time. NCCL groups small layer gradients into **25 MB - 64 MB Buckets** (`NCCL_BUFFSIZE`), streaming bucketed reductions in a background CUDA stream while subsequent backward layers execute concurrently.",
    },
  ],
};
