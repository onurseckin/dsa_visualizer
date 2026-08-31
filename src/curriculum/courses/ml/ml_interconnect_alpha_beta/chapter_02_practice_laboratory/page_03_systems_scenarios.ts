import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_interconnect_alpha_beta_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: Interconnects & Topologies",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_interconnect_alpha_beta",
      title: "Interconnect Physics & Cluster Topology Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Topology-Aware Ring Builder for NCCL",
          description:
            "Implement an algorithm that inspects GPU PCIe/NVLink hardware locality via NUMA and NVLink domain graphs to construct an optimal Hamiltonian ring that minimizes inter-node boundary crossings.",
          problemStatement:
            "Given an adjacency matrix of GPU interconnect bandwidths, find a circular permutation of GPUs that maximizes minimum link bandwidth along the ring.",
        },
      ],
      partB_mathProofs: [
        {
          title: "All-Reduce Lower Bound on Arbitrary Graphs",
          prompt:
            "Prove that for any network topology with $P$ processors, diameter $D$, and bisection bandwidth $B_{\\text{bisect}}$, the minimum time to compute an All-Reduce on a vector of size $M$ bytes is bounded by $T_{\\text{AllReduce}} \\ge D \\cdot \\alpha + 2 \\frac{M}{B_{\\text{bisect}}}$.",
          statement:
            "Demonstrate the fundamental physical limits imposed by graph diameter and bisection cuts.",
          proofOutline:
            "1. Information from any processor must reach the furthest processor, which requires at least $D$ hops (minimum latency $D \\alpha$).\\n2. In an All-Reduce, half of the processors must exchange their $M/2$ data with the other half across the bisection cut, requiring at least $\\frac{M/2 + M/2}{B_{\\text{bisect}}} = \\frac{M}{B_{\\text{bisect}}}$ transfer time.\\n3. Summing lower bounds yields $T \\ge D \\alpha + 2 \\frac{M}{B_{\\text{bisect}}}$.",
          engineeringContext:
            "Establishes theoretical limits for custom optical and electrical interconnect architectures.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "RoCEv2 vs. InfiniBand: PFC Deadlocks & RDMA Congestion Control",
          prompt:
            "In large RoCEv2 (RDMA over Converged Ethernet) clusters, how does Priority Flow Control (PFC) prevent packet loss, and what causes PFC deadlock storms during incast traffic (e.g. All-to-All in MoE)? How does DCQCN (Data Center Quantized Congestion Notification) mitigate this?",
          engineeringContext:
            "Critical for preventing full cluster network freezes during large distributed training runs.",
        },
      ],
      partD_stressTests: [
        {
          title: "PCIe Gen4 vs Gen5 Flit Replay Silent Degrade",
          scenario:
            "An 8x GPU server suffers from intermittent electrical noise on PCIe lane 7 of GPU 3. The PCIe controller executes 100,000 Flit replays per second to recover corrupted packets, dropping effective Host-to-Device transfer bandwidth from 64 GB/s down to 1.2 GB/s without reporting a fatal OS hardware error.",
          failureMode:
            "Entire 1,024-GPU training run slows down by 90% because one straggler GPU stalls the synchronized All-Reduce collective.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
