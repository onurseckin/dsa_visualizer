import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_interconnect_alpha_beta_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Network Interconnect Simulation: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Point-to-Point Constant Bandwidth Model",
          code: `def naive_network_transfer_time(message_bytes: int, bandwidth_gb_s: float) -> float:
    # Ignores startup latency alpha, packetization, and protocol handshakes
    return message_bytes / (bandwidth_gb_s * 1e9)`,
          explanation:
            "Oversimplified model assuming infinite instantaneous injection and zero startup latency.",
          timeComplexity: "O(1)",
          spaceComplexity: "O(1)",
        },
        {
          label: "Stage 2: Analytical Hockney & LogGP Network Simulator",
          code: `class HockneyLogGPModel:
    def __init__(self, alpha_sec: float, bandwidth_bytes_sec: float, o_sec: float = 1e-6):
        self.alpha = alpha_sec        # Startup latency (e.g. 1.5 us for NVLink, 10 us for InfiniBand)
        self.B = bandwidth_bytes_sec  # Bandwidth (e.g. 900 GB/s for NVLink 4, 50 GB/s for IB NDR)
        self.beta = 1.0 / self.B
        self.o = o_sec                # Host DMA overhead
        
    def point_to_point_latency(self, message_bytes: int) -> float:
        return self.alpha + self.beta * message_bytes
        
    def pipelined_chunk_transfer(self, message_bytes: int, num_chunks: int, num_hops: int = 1) -> float:
        """
        Pipelining message across multi-hop network:
        T = (num_hops - 1) * T_chunk + num_chunks * T_chunk
        """
        chunk_size = message_bytes / float(num_chunks)
        t_chunk = self.alpha + self.beta * chunk_size
        return (num_hops - 1) * t_chunk + (num_chunks * t_chunk)`,
          explanation:
            "Hockney and LogGP analytical equations with message pipelining across multi-hop switch fabrics.",
          timeComplexity: "O(1)",
          spaceComplexity: "O(1)",
        },
        {
          label: "Stage 3: Multi-Link Topology Routing & Contention Matrix Simulator",
          code: `from typing import Dict, List, Tuple
import numpy as np

class ClusterInterconnectSimulator:
    """
    Simulates multi-GPU cluster interconnect topologies:
    - NVLink 8-GPU Full Mesh / NVSwitch Crossbar (zero contention intra-node)
    - Fat-Tree InfiniBand Spine-Leaf Network (with oversubscription modeling)
    """
    def __init__(self, num_nodes: int = 4, gpus_per_node: int = 8):
        self.num_nodes = num_nodes
        self.gpus_per_node = gpus_per_node
        self.total_gpus = num_nodes * gpus_per_node
        
        # Physical links
        self.nvlink_bw = 900e9      # 900 GB/s intra-node
        self.nvlink_lat = 1.2e-6     # 1.2 us
        
        self.infiniband_bw = 50e9   # 50 GB/s per GPU inter-node
        self.infiniband_lat = 5.0e-6 # 5.0 us
        
    def calculate_transfer_time(self, src_gpu: int, dst_gpu: int, message_bytes: int) -> float:
        src_node = src_gpu // self.gpus_per_node
        dst_node = dst_gpu // self.gpus_per_node
        
        if src_node == dst_node:
            # Intra-node NVLink transfer
            return self.nvlink_lat + (message_bytes / self.nvlink_bw)
        else:
            # Inter-node transfer crossing PCIe -> NIC -> InfiniBand Switch -> Remote NIC -> PCIe
            return self.infiniband_lat + (message_bytes / self.infiniband_bw)`,
          explanation:
            "Simulates real hardware cluster topology. Automatically selects NVLink vs InfiniBand latency/bandwidth models based on physical GPU node coordinates.",
          timeComplexity: "O(1) lookup",
          spaceComplexity: "O(total_gpus^2) topology matrix",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Network Oversubscription & Fat-Tree Bisection Bandwidth",
      content:
        "In large-scale AI data centers (e.g. 10,000+ GPUs), building a 1:1 non-blocking full bisection bandwidth Fat-Tree network is cost-prohibitive. Data center architects frequently deploy **oversubscribed networks** (e.g. 2:1 or 3:1 oversubscription at the spine switches). When all GPUs simultaneously perform all-to-all communications (such as in Distributed Mixture-of-Experts routing), network spine switches become congested, causing packet drops, PFC (Priority Flow Control) pause frames, and collective latency degradation of up to 5x-10x.",
    },
  ],
};
