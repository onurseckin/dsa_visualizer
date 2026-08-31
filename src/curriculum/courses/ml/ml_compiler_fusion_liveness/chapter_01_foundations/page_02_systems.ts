import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_compiler_fusion_liveness_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Compiler Optimization: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Unfused Eager Operations (HBM Roundtrip Overhead)",
          code: `import torch
import math

def unfused_bias_gelu_dropout(x: torch.Tensor, bias: torch.Tensor, p: float = 0.1) -> torch.Tensor:
    # Kernel 1: Reads x, bias from HBM -> writes t1 to HBM
    t1 = x + bias
    
    # Kernel 2: Reads t1 from HBM -> writes t2 to HBM (GELU elementwise)
    t2 = 0.5 * t1 * (1.0 + torch.tanh(math.sqrt(2.0 / math.pi) * (t1 + 0.044715 * torch.pow(t1, 3))))
    
    # Kernel 3: Reads t2 from HBM -> generates mask -> writes output to HBM
    mask = (torch.rand_like(t2) > p).float()
    out = (t2 * mask) / (1.0 - p)
    
    # Incurs 3 kernel launches and 2 large intermediate HBM allocations (t1, t2)!
    return out`,
          explanation:
            "Unfused eager mode executes 3 sequential kernel launches and allocates $2 \\times$ intermediate tensors in GPU memory.",
          timeComplexity: "O(3 * Launches) + O(Elements * Read/Write)",
          spaceComplexity: "O(2 * Tensor_Size) intermediate HBM footprint",
        },
        {
          label: "Stage 2: Fused Elementwise Triton Kernel Simulation",
          code: `import torch
import math

def fused_bias_gelu_dropout_sim(x: torch.Tensor, bias: torch.Tensor, p: float = 0.1) -> torch.Tensor:
    """
    Simulates a single fused Triton / CUDA kernel.
    Loads x and bias into registers, computes BiasAdd + GELU + Dropout in-place,
    and writes ONLY the final output directly to HBM in a single pass.
    """
    # 1. Single memory read from HBM to register
    # 2. Complete computation inside fast SRAM/Registers (Zero intermediate HBM writebacks!)
    scale = 1.0 / (1.0 - p)
    sqrt_2_over_pi = math.sqrt(2.0 / math.pi)
    
    # Vectorized register emulation
    x_val = x + bias
    gelu_val = 0.5 * x_val * (1.0 + torch.tanh(sqrt_2_over_pi * (x_val + 0.044715 * (x_val ** 3))))
    rand_mask = (torch.rand_like(x_val) > p).float()
    out = gelu_val * rand_mask * scale
    
    # 3. Single memory write to HBM
    return out`,
          explanation:
            "Fused execution requires only 1 kernel launch, 1 read from HBM, and 1 write to HBM, boosting arithmetic throughput by $3\\times$.",
          timeComplexity: "O(1 * Launch) + O(1 * Read + 1 * Write)",
          spaceComplexity: "O(0) intermediate HBM allocations",
        },
        {
          label: "Stage 3: Graph IR & Memory Arena Offset Allocator",
          code: `from typing import List, Dict, Tuple
import heapq

class TensorNode:
    def __init__(self, name: str, size_bytes: int, start_step: int, end_step: int):
        self.name = name
        self.size_bytes = size_bytes
        self.start_step = start_step  # Definition time
        self.end_step = end_step      # Last use time

def allocate_memory_arena(tensors: List[TensorNode]) -> Tuple[Dict[str, int], int]:
    """
    Solves optimal interval memory arena allocation.
    Reuses physical memory buffer offsets for tensors with disjoint liveness intervals.
    """
    # Sort tensors by creation start step
    sorted_tensors = sorted(tensors, key=lambda t: (t.start_step, -t.size_bytes))
    
    # Min-heap of active allocated blocks: (free_time, memory_offset, size)
    active_blocks = []
    # Free memory segments pool: list of (offset, size)
    free_pool: List[Tuple[int, int]] = []
    
    allocations: Dict[str, int] = {}
    current_arena_peak = 0
    
    for t in sorted_tensors:
        # 1. Reclaim blocks from tensors whose lifespan ended before t.start_step
        while active_blocks and active_blocks[0][0] <= t.start_step:
            end_time, offset, size = heapq.heappop(active_blocks)
            free_pool.append((offset, size))
            
        # 2. Check if a previously freed block can fit tensor t (Best-Fit policy)
        best_idx = -1
        best_waste = float('inf')
        for idx, (offset, size) in enumerate(free_pool):
            if size >= t.size_bytes and (size - t.size_bytes) < best_waste:
                best_idx = idx
                best_waste = size - t.size_bytes
                
        if best_idx != -1:
            offset, size = free_pool.pop(best_idx)
            allocations[t.name] = offset
            heapq.heappush(active_blocks, (t.end_step, offset, t.size_bytes))
        else:
            # Allocate at the end of the current memory arena
            offset = current_arena_peak
            allocations[t.name] = offset
            current_arena_peak += t.size_bytes
            heapq.heappush(active_blocks, (t.end_step, offset, t.size_bytes))
            
    return allocations, current_arena_peak`,
          explanation:
            "Interval graph memory allocator. Reclaims dead activation buffers dynamically to assign overlapping memory arena offsets, minimizing peak VRAM consumption.",
          timeComplexity: "O(N log N) interval allocation",
          spaceComplexity: "O(Peak_Live_Memory) strictly bounded arena",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Silicon Realities: Register Spilling vs. Fusion Granularity",
      content:
        "While operator fusion eliminates memory I/O, fusing too many operations inside a single kernel causes **Register Pressure**. If a fused CUDA/Triton kernel requires more than 128-255 registers per thread, the compiler is forced to **spill registers** into Local Memory (which resides in slow GPU DRAM). Register spills incur a massive 200-cycle memory latency penalty per access, neutralizing the benefits of fusion. Production compilers (TorchInductor) use heuristic cost models to break fusion clusters when estimated register demand exceeds 96 registers per thread.",
    },
  ],
};
