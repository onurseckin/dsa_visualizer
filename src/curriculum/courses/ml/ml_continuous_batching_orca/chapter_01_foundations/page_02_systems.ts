import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_continuous_batching_orca_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Continuous Batching: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Static Batching Baseline (Padded Tensor Evaluation)",
          code: `from typing import List, Dict

class StaticBatchingServer:
    def __init__(self, max_batch_size: int = 4):
        self.max_batch_size = max_batch_size
        
    def execute_batch(self, requests: List[Dict]) -> List[str]:
        # requests: list of dicts with {"id": int, "prompt": List[int], "target_len": int}
        # Pad all sequences to max length across batch
        max_gen_len = max(r["target_len"] for r in requests)
        batch_size = len(requests)
        
        # Simulated forward pass loop: all requests held for max_gen_len steps
        total_executed_slots = 0
        wasted_padding_slots = 0
        
        for step in range(max_gen_len):
            for r in requests:
                total_executed_slots += 1
                if step >= r["target_len"]:
                    wasted_padding_slots += 1  # GPU computes on useless padding tokens!
                    
        print(f"Static Batching: Total slots = {total_executed_slots}, Wasted = {wasted_padding_slots}")
        return ["generated_text" for _ in requests]`,
          explanation:
            "Static batching locks the batch size and holds all request slots open until the longest request completes, wasting GPU cycles on padding tokens.",
          timeComplexity: "O(B * max(L_i))",
          spaceComplexity: "O(B * max(L_i)) memory allocation for padded KV cache",
        },
        {
          label: "Stage 2: Iteration-Level Continuous Batching (Orca Dynamic Slots)",
          code: `from typing import List, Dict, Optional
from enum import Enum

class RequestState(Enum):
    QUEUED = 1
    PREFILL = 2
    DECODE = 3
    FINISHED = 4

class InferenceRequest:
    def __init__(self, req_id: int, prompt_tokens: List[int], max_tokens: int):
        self.req_id = req_id
        self.prompt_tokens = prompt_tokens
        self.max_tokens = max_tokens
        self.generated_tokens: List[int] = []
        self.state = RequestState.QUEUED

class ContinuousBatchingEngine:
    def __init__(self, max_batch_size: int = 4):
        self.max_batch_size = max_batch_size
        self.waiting_queue: List[InferenceRequest] = []
        self.running_batch: List[InferenceRequest] = []
        
    def add_request(self, req: InferenceRequest):
        self.waiting_queue.append(req)
        
    def step(self) -> Dict[str, int]:
        # 1. Admit new requests if running slots are available
        while len(self.running_batch) < self.max_batch_size and self.waiting_queue:
            new_req = self.waiting_queue.pop(0)
            new_req.state = RequestState.PREFILL
            self.running_batch.append(new_req)
            
        if not self.running_batch:
            return {"active": 0, "finished": 0}
            
        # 2. Execute single forward iteration for all active requests
        finished_this_step = []
        for req in self.running_batch:
            if req.state == RequestState.PREFILL:
                # Ingest prompt tokens and transition to decode
                req.generated_tokens.append(101)  # Mock first generated token
                req.state = RequestState.DECODE
            elif req.state == RequestState.DECODE:
                # Generate next token
                next_tok = 202 + len(req.generated_tokens)
                req.generated_tokens.append(next_tok)
                
            # Check EOS / termination condition
            if len(req.generated_tokens) >= req.max_tokens or (req.generated_tokens and req.generated_tokens[-1] == 0):
                req.state = RequestState.FINISHED
                finished_this_step.append(req)
                
        # 3. Evict finished requests immediately at iteration boundary
        for finished_req in finished_this_step:
            self.running_batch.remove(finished_req)
            
        return {
            "active": len(self.running_batch),
            "finished": len(finished_this_step)
        }`,
          explanation:
            "Orca-style iteration scheduler. Checks completion at every single token step and dynamically admits new requests into freed slots, eliminating static bubbles.",
          timeComplexity: "O(sum(L_i)) useful work with zero padding waste",
          spaceComplexity: "O(B_active * max_context) dynamic KV cache",
        },
        {
          label: "Stage 3: Systems-Optimized Ragged Continuous Batching with Chunked Prefill",
          code: `import torch
from typing import List

def fused_ragged_batch_step(
    token_ids: torch.Tensor,       # [total_active_tokens] - 1D contiguous flattened tensor
    cu_seqlens: torch.Tensor,      # [batch_size + 1] - Cumulative sequence offsets (FlashInfer style)
    is_prefill: torch.Tensor,      # [batch_size] - Boolean flags for prefill vs decode
    chunk_size: int = 512,
):
    """
    Simulates production GPU serving execution (vLLM / TensorRT-LLM / SGLang).
    Executes ragged tensor batching without padding tensors.
    Splits massive prefill requests into chunk_size slices to prevent decode starvation.
    """
    total_tokens = token_ids.shape[0]
    # Ragged attention kernel indexes directly into non-contiguous token positions
    # via cu_seqlens pointer offsets: [cu_seqlens[i] .. cu_seqlens[i+1]]
    pass`,
          explanation:
            "Ragged tensor batching layout (FlashInfer / vLLM). Eliminates 2D tensor padding entirely, using cumulative sequence length offsets (`cu_seqlens`) and chunked prefill to co-schedule compute-dense prefills with decode tokens.",
          timeComplexity: "O(total_active_tokens * d)",
          spaceComplexity: "O(total_active_tokens * d) packed memory",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Silicon Realities: Prefill-Decode Interference & Chunked Prefills",
      content:
        "Prefill is **compute-bound** (large GEMM saturating GPU Tensor Cores, arithmetic intensity > 100 FLOP/byte). Decode is **memory-bandwidth-bound** (GEMV reading model weights and KV caches, arithmetic intensity ~ 1-2 FLOP/byte). When a huge prefill request (e.g., 4,096 tokens) is scheduled alongside 32 decode requests, the prefill forward pass takes ~50ms, causing an unacceptable 50ms latency spike in Inter-Token Latency (ITL) for all 32 active users. Modern inference engines (Sarathi-Serve / Chunked Prefill) chop the prefill prompt into fixed chunks of size $C = 512$, piggybacking decode tokens in the same GEMM kernel to maintain high Tensor Core utilization while strictly preserving $< 15\\text{ms}$ ITL.",
    },
  ],
};
