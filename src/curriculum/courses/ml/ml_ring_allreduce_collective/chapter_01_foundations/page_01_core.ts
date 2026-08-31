import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_ring_allreduce_collective_c1_p1",
  pageNumber: 1,
  title: "Ring All-Reduce: Collective Communication & Optimal Bandwidth",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Distributed Master Bottleneck: Death of the Parameter Server",
      content:
        "In naive distributed training (Parameter Server architecture), $P$ worker GPUs compute local gradients of size $S$ bytes and transmit them to a central master server. The master server must receive $P \\cdot S$ bytes, compute the global sum, and broadcast $P \\cdot S$ bytes back to all workers. The master's network interface immediately saturates, scaling linearly with cluster size $O(P \\cdot S)$ and capping scaling efficiency at fewer than 16 GPUs. **Ring-AllReduce (Baidu, 2017; Gibiansky; NCCL)** completely eliminates the central bottleneck by organizing $P$ GPUs into a logical unidirectional ring. By partitioning the gradient buffer into $P$ equal chunks and executing a two-phase **Reduce-Scatter** and **All-Gather** protocol, the data transferred by each GPU is strictly bounded by $2 \\frac{P-1}{P} S < 2S$ bytes—completely independent of cluster size $P$!",
    },
    {
      type: "mental_model",
      title: "Mental Model: Ring Partitioning & Two-Phase Pipeline",
      visualIntuition:
        "Gradient Buffer S partitioned into P equal chunks: [Chunk 0, Chunk 1, ..., Chunk P-1]\\nPhase 1 (Reduce-Scatter, P-1 steps):\\n  - Step 0: GPU_i sends Chunk (i) to GPU_{(i+1)%P} and receives Chunk (i-1) from GPU_{(i-1)%P}, accumulating sum.\\n  - After P-1 steps: Each GPU_i holds the fully reduced global sum of exactly ONE chunk (Chunk i).\\nPhase 2 (All-Gather, P-1 steps):\\n  - Step 0: GPU_i sends its fully reduced Chunk (i) around the ring.\\n  - After P-1 steps: All P GPUs possess the fully reduced global sum of ALL P chunks!",
      invariant:
        "Bandwidth Independence Invariant: Total data transferred per GPU is 2 * ((P - 1) / P) * S bytes. As cluster size P -> infinity, communication volume approaches 2S bytes, enabling linear scaling to thousands of GPUs.",
      stateTransitions:
        "Local Gradients -> Partition into P chunks -> Reduce-Scatter Phase (P-1 communication steps) -> Each GPU holds 1 reduced chunk -> All-Gather Phase (P-1 communication steps) -> Global All-Reduce Complete.",
      naiveBottleneck:
        "Central parameter servers incur O(P * S) network traffic on the master node, bottlenecking the entire cluster.",
      optimalInsight:
        "Ring All-Reduce fully utilizes all bidirectional communication links in the ring simultaneously, achieving 100% theoretical interconnect bandwidth utilization.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Ring-AllReduce Optimal Communication Time",
      theorem:
        "Let $P$ be the number of GPUs in a ring topology with link latency $\\alpha$ and bandwidth $B$ (bytes/sec). The total communication time of Ring-AllReduce for a tensor of size $S$ bytes is $T_{\\text{Ring}}(S) = 2(P - 1)\\alpha + 2 \\left(\\frac{P - 1}{P}\\right) \\frac{S}{B}$.",
      proof:
        "1. Partitioning:\\nThe tensor of size $S$ is divided into $P$ equal chunks, each of size $s = \\frac{S}{P}$ bytes.\\n\\n2. Phase 1: Reduce-Scatter:\\n- In each step, each GPU sends a chunk of size $S/P$ to its right neighbor and receives a chunk of size $S/P$ from its left neighbor.\\n- To reduce all $P$ chunks across all processors, exactly $(P - 1)$ communication steps are required.\\n- Time for Phase 1:\\n$$T_{\\text{ReduceScatter}} = (P - 1) \\left( \\alpha + \\frac{S/P}{B} \\right) = (P - 1)\\alpha + \\frac{P - 1}{P} \\frac{S}{B}$$\\nAt the conclusion of Phase 1, each GPU holds the complete global sum of exactly one chunk of size $S/P$.\\n\\n3. Phase 2: All-Gather:\\n- Each GPU now shares its fully reduced chunk of size $S/P$ with all other $(P - 1)$ GPUs around the ring.\\n- This requires exactly $(P - 1)$ communication steps identical in volume to Phase 1:\\n$$T_{\\text{AllGather}} = (P - 1) \\left( \\alpha + \\frac{S/P}{B} \\right) = (P - 1)\\alpha + \\frac{P - 1}{P} \\frac{S}{B}$$\\n\\n4. Total Ring-AllReduce Time:\\n$$T_{\\text{Ring}}(S) = T_{\\text{ReduceScatter}} + T_{\\text{AllGather}} = 2(P - 1)\\alpha + 2 \\left(\\frac{P - 1}{P}\\right) \\frac{S}{B}$$\\nAs $P \\to \\infty$, the bandwidth term $2 \\left(\\frac{P - 1}{P}\\right) \\frac{S}{B} \\to \\frac{2S}{B}$. This proves that large-tensor Ring-AllReduce is bandwidth-optimal and asymptotically independent of the number of GPUs in the cluster.",
    },
  ],
};
