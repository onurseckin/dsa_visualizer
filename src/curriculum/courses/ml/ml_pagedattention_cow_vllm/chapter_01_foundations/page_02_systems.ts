import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_pagedattention_cow_vllm_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "PagedAttention & COW: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Contiguous KV Cache (Over-Allocation Baseline)",
          code: `import numpy as np

class NaiveContiguousKVManager:
    def __init__(self, max_batch_size: int, max_seq_len: int, num_heads: int, head_dim: int):
        # Statically allocate maximum memory for all possible tokens upfront
        self.k_cache = np.zeros((max_batch_size, max_seq_len, num_heads, head_dim), dtype=np.float16)
        self.v_cache = np.zeros((max_batch_size, max_seq_len, num_heads, head_dim), dtype=np.float16)
        self.seq_lens = [0] * max_batch_size
        
    def append_token(self, req_id: int, k_vec: np.ndarray, v_vec: np.ndarray):
        pos = self.seq_lens[req_id]
        if pos >= self.k_cache.shape[1]:
            raise RuntimeError("Sequence exceeded maximum statically allocated context length!")
        self.k_cache[req_id, pos] = k_vec
        self.v_cache[req_id, pos] = v_vec
        self.seq_lens[req_id] += 1`,
          explanation:
            "Contiguous allocation reserves maximum context length upfront per request slot, creating massive internal fragmentation for short requests and memory exhaustion.",
          timeComplexity: "O(1) append",
          spaceComplexity: "O(max_batch * max_seq_len * H * D) static VRAM reservation",
        },
        {
          label: "Stage 2: Paged Block Allocator & Logical Block Tables",
          code: `from typing import List, Dict
import numpy as np

class PagedBlockManager:
    def __init__(self, num_physical_blocks: int, block_size: int, num_heads: int, head_dim: int):
        self.block_size = block_size
        # Central physical memory pool for all requests
        self.k_pool = np.zeros((num_physical_blocks, block_size, num_heads, head_dim), dtype=np.float16)
        self.v_pool = np.zeros((num_physical_blocks, block_size, num_heads, head_dim), dtype=np.float16)
        
        # Free physical block indices
        self.free_blocks = list(range(num_physical_blocks))
        # Block Tables: req_id -> List of physical block IDs
        self.block_tables: Dict[int, List[int]] = {}
        self.seq_lens: Dict[int, int] = {}
        
    def allocate_request(self, req_id: int):
        self.block_tables[req_id] = []
        self.seq_lens[req_id] = 0
        
    def append_token(self, req_id: int, k_vec: np.ndarray, v_vec: np.ndarray):
        cur_len = self.seq_lens[req_id]
        logical_block_idx = cur_len // self.block_size
        offset_in_block = cur_len % self.block_size
        
        # Allocate new physical block if current block is full
        if offset_in_block == 0:
            if not self.free_blocks:
                raise RuntimeError("GPU Out Of Memory: No free physical KV blocks!")
            new_block_id = self.free_blocks.pop(0)
            self.block_tables[req_id].append(new_block_id)
            
        phys_block_id = self.block_tables[req_id][logical_block_idx]
        self.k_pool[phys_block_id, offset_in_block] = k_vec
        self.v_pool[phys_block_id, offset_in_block] = v_vec
        self.seq_lens[req_id] += 1`,
          explanation:
            "Divides physical memory into fixed-size blocks. Allocates physical blocks dynamically as tokens are generated, eliminating external fragmentation.",
          timeComplexity: "O(1) append",
          spaceComplexity: "O(total_actual_tokens * H * D) on-demand memory",
        },
        {
          label: "Stage 3: Full PagedAttention with Copy-On-Write (COW) Reference Counting",
          code: `from typing import List, Dict
import numpy as np

class PagedAttentionCOWEngine:
    def __init__(self, num_physical_blocks: int, block_size: int, num_heads: int, head_dim: int):
        self.block_size = block_size
        self.num_heads = num_heads
        self.head_dim = head_dim
        
        self.k_pool = np.zeros((num_physical_blocks, block_size, num_heads, head_dim), dtype=np.float32)
        self.v_pool = np.zeros((num_physical_blocks, block_size, num_heads, head_dim), dtype=np.float32)
        
        self.ref_counts: Dict[int, int] = {i: 0 for i in range(num_physical_blocks)}
        self.free_blocks = list(range(num_physical_blocks))
        self.block_tables: Dict[int, List[int]] = {}
        self.seq_lens: Dict[int, int] = {}
        
    def fork_request(self, parent_req_id: int, child_req_id: int):
        """Fork for parallel sampling / beam search: shares parent physical blocks with ref_count increment."""
        self.block_tables[child_req_id] = list(self.block_tables[parent_req_id])
        self.seq_lens[child_req_id] = self.seq_lens[parent_req_id]
        for phys_id in self.block_tables[child_req_id]:
            self.ref_counts[phys_id] += 1
            
    def append_token(self, req_id: int, k_vec: np.ndarray, v_vec: np.ndarray):
        cur_len = self.seq_lens[req_id]
        logical_block_idx = cur_len // self.block_size
        offset_in_block = cur_len % self.block_size
        
        if offset_in_block == 0 and logical_block_idx >= len(self.block_tables[req_id]):
            # Allocate brand new block
            new_block_id = self.free_blocks.pop(0)
            self.ref_counts[new_block_id] = 1
            self.block_tables[req_id].append(new_block_id)
        else:
            # Check for Copy-On-Write (COW) on existing shared block
            phys_block_id = self.block_tables[req_id][logical_block_idx]
            if self.ref_counts[phys_block_id] > 1:
                # Trigger COW: Allocate private copy of block
                new_block_id = self.free_blocks.pop(0)
                self.k_pool[new_block_id] = np.copy(self.k_pool[phys_block_id])
                self.v_pool[new_block_id] = np.copy(self.v_pool[phys_block_id])
                self.ref_counts[new_block_id] = 1
                self.ref_counts[phys_block_id] -= 1
                self.block_tables[req_id][logical_block_idx] = new_block_id
                
        target_block = self.block_tables[req_id][logical_block_idx]
        self.k_pool[target_block, offset_in_block] = k_vec
        self.v_pool[target_block, offset_in_block] = v_vec
        self.seq_lens[req_id] += 1
        
    def free_request(self, req_id: int):
        for phys_id in self.block_tables[req_id]:
            self.ref_counts[phys_id] -= 1
            if self.ref_counts[phys_id] == 0:
                self.free_blocks.append(phys_id)
        del self.block_tables[req_id]
        del self.seq_lens[req_id]`,
          explanation:
            "Production vLLM COW engine. Enables zero-copy prompt sharing across parallel sampling branches (beam search, best-of-N). Allocates new physical blocks only when branches diverge and write private tokens.",
          timeComplexity: "O(1) fork, O(1) append (or O(B * H * D) on COW copy)",
          spaceComplexity: "Near-optimal shared memory footprint",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Silicon Realities: Block Size Hardware Trade-offs",
      content:
        "Selecting physical block size $B$ requires balancing two hardware constraints:\\n\\n1. **Memory Bandwidth & Coalescing ($B \\ge 16$):** GPU memory controllers achieve peak bandwidth when memory is accessed in contiguous 32-byte or 64-byte transactions. A small block size ($B = 2$ or $4$) fragments memory into tiny non-contiguous slivers, causing warp divergence and un-coalesced memory fetches.\\n\\n2. **Internal Fragmentation ($B \\le 32$):** A large block size ($B = 128$) wastes up to 127 token slots on sequence completion.\\n\\nEmpirical systems research in vLLM proves that $B = 16$ or $B = 32$ achieves 96%+ memory utilization while perfectly matching hardware memory burst transactions.",
    },
  ],
};
