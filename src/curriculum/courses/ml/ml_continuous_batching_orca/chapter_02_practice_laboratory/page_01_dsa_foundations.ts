import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_continuous_batching_orca_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: Orca Continuous Batching Scheduler Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_continuous_batching_orca",
      title: "Implement Orca Iteration-Level Continuous Batching Engine",
      difficulty: "Hard",
      rationale:
        "Build a production-grade iteration-level continuous batching scheduler capable of dynamically managing request queues, admitting waiting prompts up to maximum batch capacity, stepping generation iteration-by-iteration, and retiring completed requests without pipeline bubbles.",
      starterCode: `from typing import List, Dict, Any
import numpy as np

class Solution:
    """
    Orca Continuous Batching Scheduler Simulator.
    Manages request admission, iteration-level forward execution,
    and instantaneous slot eviction upon EOS / token budget exhaustion.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "requests": List of dicts, each with:
                    - "id": int
                    - "arrival_time": int (discrete iteration step when request arrives)
                    - "prompt_len": int
                    - "target_gen_len": int
                - "max_batch_size": int, maximum concurrent requests permitted
                - "max_simulation_steps": int, maximum forward iterations to simulate
        Returns:
            Dictionary containing:
                - "completion_times": Dict mapping request id to iteration step completed
                - "active_slots_per_step": List of int, number of active running requests per step
                - "total_useful_tokens": int, total tokens generated (prompt + generated)
                - "total_wasted_padding_tokens": int, strictly 0 for continuous batching
        """
        raw_requests = inputs["requests"]
        max_batch_size = int(inputs["max_batch_size"])
        max_simulation_steps = int(inputs["max_simulation_steps"])

        waiting_queue = []
        running_batch = []
        completion_times = {}
        active_slots_per_step = []

        total_useful_tokens = 0
        total_wasted_padding_tokens = 0

        # Sort incoming requests by arrival time
        incoming_by_time = {}
        for req in raw_requests:
            arr = req["arrival_time"]
            incoming_by_time.setdefault(arr, []).append({
                "id": req["id"],
                "prompt_len": req["prompt_len"],
                "target_gen_len": req["target_gen_len"],
                "generated_count": 0,
                "is_prefill_done": False,
            })

        for current_step in range(max_simulation_steps):
            # 1. Enqueue newly arrived requests
            if current_step in incoming_by_time:
                waiting_queue.extend(incoming_by_time[current_step])

            # 2. Admit waiting requests into free execution slots
            while len(running_batch) < max_batch_size and waiting_queue:
                running_batch.append(waiting_queue.pop(0))

            active_slots_per_step.append(len(running_batch))
            if not running_batch and not waiting_queue and current_step > max(incoming_by_time.keys(), default=0):
                # All requests processed
                break

            # 3. Advance active requests by 1 token step
            finished_this_step = []
            for req in running_batch:
                if not req["is_prefill_done"]:
                    # Prefill forward pass completed in this step
                    req["is_prefill_done"] = True
                    total_useful_tokens += req["prompt_len"]
                else:
                    # Decode step: 1 new token generated
                    req["generated_count"] += 1
                    total_useful_tokens += 1

                # Check if request has reached target length
                if req["generated_count"] >= req["target_gen_len"]:
                    completion_times[req["id"]] = current_step
                    finished_this_step.append(req)

            # 4. Immediate eviction at iteration boundary
            for finished in finished_this_step:
                running_batch.remove(finished)

        return {
            "completion_times": completion_times,
            "active_slots_per_step": active_slots_per_step,
            "total_useful_tokens": total_useful_tokens,
            "total_wasted_padding_tokens": total_wasted_padding_tokens,
        }`,
    },
  ],
};

export const page = page1;
