import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_interconnect_alpha_beta_c1_p1",
  pageNumber: 1,
  title: "Interconnect Physics: Alpha-Beta & LogGP Communication Models",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Physical Cluster Interconnect Wall: The 18x Bandwidth Chasm",
      content:
        "Distributed training and inference at scale are fundamentally bounded by network interconnect physics. A modern 8x GPU node (e.g. 8x NVIDIA H100 SXM5) features **NVLink 4** providing an extraordinary **900 GB/s bi-directional bandwidth** per GPU across an all-to-all NVSwitch crossbar (7.2 TB/s aggregate per node). However, as soon as communication crosses node boundaries over an **InfiniBand NDR 400Gbps** network fabric, available bandwidth plummets to **50 GB/s per GPU**—an **18x bandwidth chasm**! For distributed collective operations, modeling network latency $\\alpha$ (startup time) and bandwidth $\\beta = 1/B$ (transmission rate) dictates exact 3D parallel partition boundaries (Tensor Parallelism strictly within the NVLink domain; Pipeline and Data Parallelism across InfiniBand).",
    },
    {
      type: "mental_model",
      title: "Mental Model: Hockney Alpha-Beta & LogGP Transmission Pipelines",
      visualIntuition:
        "[ Message Payload: m bytes ]\\n  |-- Startup Latency alpha: NIC handshake, kernel launch, PCIe DMA setup\\n  |-- Transmission Time beta * m: Wire transmission at physical line rate (1 / B)\\nTotal Point-to-Point Latency: T(m) = alpha + beta * m",
      invariant:
        "Bandwidth-Latency Invariant: For small messages (m < alpha / beta), communication is latency-dominated (O(alpha)); for large messages (m >> alpha / beta), communication is bandwidth-saturated (O(m / B)).",
      stateTransitions:
        "State 0: CPU/GPU prepares buffer -> State 1: Driver issues DMA request (overhead o) -> State 2: Flight over physical link (latency L) -> State 3: Wire transmission at gap G per byte -> State 4: Receiver interrupt and payload commit.",
      naiveBottleneck:
        "Sending thousands of tiny un-coalesced gradient messages stalls the network on startup latency alpha (1-5 microseconds per message).",
      optimalInsight:
        "Fusing gradients into massive buckets (e.g., 25-256 MB) amortizes startup latency alpha, achieving >95% theoretical physical line rate beta * m.",
    },
    {
      type: "math_proof",
      title: "Mathematical Derivation: LogGP Communication Model",
      theorem:
        "The LogGP model parameterizes parallel network communication via 5 physical parameters: $L$ (network latency), $o$ (host injection overhead), $g$ (gap between successive packets), $G$ (inverse bandwidth per byte), and $P$ (processor count). The total time to transmit a message of $m$ bytes is $T_{\\text{LogGP}}(m) = 2o + L + (m - 1)G$.",
      proof:
        "1. Host Injection:\\nThe sending processor incurs software/driver overhead $o$ to post the transfer descriptor to the network interface controller (NIC).\\n\\n2. Network Flight and Pipelined Streaming:\\n- The first byte departs the sender NIC and traverses the physical fabric switches, arriving at the receiver after network flight time $L$.\\n- Subsequent $(m - 1)$ bytes stream continuously across the wire pipeline, separated by the inter-byte transmission gap $G = 1 / B_{\\text{network}}$. The total streaming duration for the remaining payload is $(m - 1)G$.\\n\\n3. Receiver Overhead:\\nUpon arrival of the final byte, the receiving CPU/GPU incurs receiver overhead $o$ to handle the completion event and commit the DMA buffer to local memory.\\n\\n4. Total Transfer Time:\\n$$T_{\\text{LogGP}}(m) = o + L + (m - 1)G + o = 2o + L + (m - 1)G$$\\nComparing to the classical Hockney model $T(m) = \\alpha + \\beta m$, we identify $\\alpha = 2o + L - G$ and $\\beta = G = 1/B$, rigorously grounding the Hockney parameters in physical microarchitectural components.",
    },
  ],
};
