import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_pagedattention_cow_vllm_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: PagedAttention Block Manager & COW Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_pagedattention_cow_vllm",
      title: "Implement PagedAttention Block Table & Copy-On-Write Allocator",
      difficulty: "Hard",
      rationale:
        "Implement a fully functional vLLM-style PagedAttention memory manager with block tables, free-block pools, reference counting, dynamic token appends, request forks with Copy-On-Write branching, and block deallocation.",
      starterCode: `from typing import Dict, List, Any
import numpy as np

class Solution:
    """
    PagedAttention Memory Manager and Copy-On-Write Engine.
    Implements physical block pool management, block tables,
    dynamic block allocation, COW on fork, and reference-counted deallocation.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "num_physical_blocks": int
                - "block_size": int
                - "operations": List of dicts specifying sequential operations:
                    - {"op": "allocate", "req_id": int, "prompt_len": int}
                    - {"op": "append", "req_id": int, "num_tokens": int}
                    - {"op": "fork", "parent_req_id": int, "child_req_id": int}
                    - {"op": "free", "req_id": int}
        Returns:
            Dictionary containing:
                - "final_block_tables": Dict[int, List[int]] mapping req_id to list of physical block IDs
                - "final_ref_counts": Dict[int, int] mapping physical block ID to reference count
                - "num_free_blocks": int, count of remaining free physical blocks
                - "cow_triggers_count": int, total number of COW block duplications performed
        """
        num_physical_blocks = int(inputs["num_physical_blocks"])
        block_size = int(inputs["block_size"])
        operations = inputs["operations"]

        free_blocks = list(range(num_physical_blocks))
        ref_counts = {i: 0 for i in range(num_physical_blocks)}
        block_tables: Dict[int, List[int]] = {}
        seq_lens: Dict[int, int] = {}
        cow_triggers_count = 0

        for op_info in operations:
            op = op_info["op"]

            if op == "allocate":
                req_id = op_info["req_id"]
                prompt_len = op_info["prompt_len"]
                num_blocks = (prompt_len + block_size - 1) // block_size
                
                allocated = []
                for _ in range(num_blocks):
                    if not free_blocks:
                        raise RuntimeError("Out of physical blocks!")
                    b_id = free_blocks.pop(0)
                    ref_counts[b_id] = 1
                    allocated.append(b_id)
                    
                block_tables[req_id] = allocated
                seq_lens[req_id] = prompt_len

            elif op == "fork":
                parent_id = op_info["parent_req_id"]
                child_id = op_info["child_req_id"]
                block_tables[child_id] = list(block_tables[parent_id])
                seq_lens[child_id] = seq_lens[parent_id]
                for b_id in block_tables[child_id]:
                    ref_counts[b_id] += 1

            elif op == "append":
                req_id = op_info["req_id"]
                num_tokens = op_info["num_tokens"]

                for _ in range(num_tokens):
                    cur_len = seq_lens[req_id]
                    logical_idx = cur_len // block_size
                    offset = cur_len % block_size

                    if offset == 0 and logical_idx >= len(block_tables[req_id]):
                        # Allocate brand new physical block
                        b_id = free_blocks.pop(0)
                        ref_counts[b_id] = 1
                        block_tables[req_id].append(b_id)
                    else:
                        phys_id = block_tables[req_id][logical_idx]
                        if ref_counts[phys_id] > 1:
                            # Trigger COW!
                            new_b_id = free_blocks.pop(0)
                            ref_counts[new_b_id] = 1
                            ref_counts[phys_id] -= 1
                            block_tables[req_id][logical_idx] = new_b_id
                            cow_triggers_count += 1

                    seq_lens[req_id] += 1

            elif op == "free":
                req_id = op_info["req_id"]
                if req_id in block_tables:
                    for b_id in block_tables[req_id]:
                        ref_counts[b_id] -= 1
                        if ref_counts[b_id] == 0:
                            free_blocks.append(b_id)
                    del block_tables[req_id]
                    del seq_lens[req_id]

        return {
            "final_block_tables": block_tables,
            "final_ref_counts": ref_counts,
            "num_free_blocks": len(free_blocks),
            "cow_triggers_count": cow_triggers_count,
        }`,
    },
  ],
};

export const page = page1;
