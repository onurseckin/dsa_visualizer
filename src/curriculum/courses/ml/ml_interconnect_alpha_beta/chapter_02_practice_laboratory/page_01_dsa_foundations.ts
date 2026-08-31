import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_interconnect_alpha_beta_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: Hockney & Multi-Tier Topology Routing Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_interconnect_alpha_beta",
      title: "Implement Multi-Tier Distributed Cluster Interconnect Simulator",
      difficulty: "Hard",
      rationale:
        "Implement a hierarchical multi-tier interconnect simulator that computes transfer times across intra-node NVLink and inter-node InfiniBand fabrics, accounting for latency, bandwidth, and pipelined packetization.",
      starterCode: `import numpy as np
from typing import Dict, Any, List, Tuple

class Solution:
    """
    Cluster Interconnect Physics Engine.
    Simulates multi-tier communication latencies across NVLink and InfiniBand fabrics
    under the Hockney alpha-beta model with chunk pipelining.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "transfers": List of dicts, each with:
                    - "src_gpu": int (0 to total_gpus - 1)
                    - "dst_gpu": int
                    - "message_bytes": int
                - "gpus_per_node": int (e.g. 8)
                - "nvlink_alpha": float (seconds, e.g. 1.2e-6)
                - "nvlink_bw": float (bytes/sec, e.g. 900e9)
                - "infiniband_alpha": float (seconds, e.g. 5.0e-6)
                - "infiniband_bw": float (bytes/sec, e.g. 50e9)
        Returns:
            Dictionary containing:
                - "transfer_latencies": List of float (individual transfer durations in seconds)
                - "total_simulated_time": float (max latency under concurrent execution or sum)
                - "intra_node_count": int
                - "inter_node_count": int
        """
        transfers = inputs["transfers"]
        gpus_per_node = int(inputs.get("gpus_per_node", 8))
        nvlink_alpha = float(inputs.get("nvlink_alpha", 1.2e-6))
        nvlink_bw = float(inputs.get("nvlink_bw", 900e9))
        ib_alpha = float(inputs.get("infiniband_alpha", 5.0e-6))
        ib_bw = float(inputs.get("infiniband_bw", 50e9))

        latencies = []
        intra_count = 0
        inter_count = 0

        for t in transfers:
            src = int(t["src_gpu"])
            dst = int(t["dst_gpu"])
            msg_bytes = int(t["message_bytes"])

            src_node = src // gpus_per_node
            dst_node = dst // gpus_per_node

            if src_node == dst_node:
                # Intra-node NVLink
                lat = nvlink_alpha + (msg_bytes / nvlink_bw)
                intra_count += 1
            else:
                # Inter-node InfiniBand
                lat = ib_alpha + (msg_bytes / ib_bw)
                inter_count += 1

            latencies.append(lat)

        return {
            "transfer_latencies": latencies,
            "total_simulated_time": max(latencies) if latencies else 0.0,
            "intra_node_count": intra_count,
            "inter_node_count": inter_count,
        }`,
    },
  ],
};

export const page = page1;
