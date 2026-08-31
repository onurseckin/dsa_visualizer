import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_ring_allreduce_collective_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: Ring-AllReduce Collectives",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_ring_allreduce_collective",
      title: "Ring-AllReduce & NCCL Collective Communications Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Pipelined Bucket Buffer Sizer for Asynchronous All-Reduce",
          description:
            "Implement an auto-tuning memory bucket manager that dynamically partitions a 405B model's gradient tensors into optimal 32MB buckets, overlapping Reduce-Scatter network transfers on stream 1 with backward layer compute on stream 0.",
          problemStatement:
            "Given a list of layer gradient tensors, group them into contiguous memory buckets not exceeding max_bucket_size and trigger asynchronous NCCL collectives.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Latency Crossover: Tree-AllReduce vs. Ring-AllReduce",
          prompt:
            "Derive the tensor size threshold $S^*$ where Ring-AllReduce becomes strictly faster than Tree-AllReduce (Recursive Doubling).",
          statement:
            "Solve for $S^*$ in $2(P-1)\\alpha + 2 \\frac{P-1}{P} \\frac{S}{B} = 2 \\log_2(P) \\alpha + 2 \\frac{P-1}{P} \\frac{S}{B}$.",
          proofOutline:
            "1. Tree-AllReduce has latency $2 \\log_2(P) \\alpha$ and bandwidth $2 \\frac{P-1}{P} \\frac{S}{B}$.\\n2. Ring-AllReduce has latency $2(P-1) \\alpha$ and bandwidth $2 \\frac{P-1}{P} \\frac{S}{B}$.\\n3. For large $S$, both have identical bandwidth time, but Tree-AllReduce has lower latency overhead ($O(\\log P)$ vs $O(P)$).\\n4. In real hardware, Ring-AllReduce avoids network switch congestion, outperforming trees on physical rings.",
          engineeringContext:
            "Used by NCCL runtime to dynamically choose between RING algorithm and TREE algorithm based on message size and GPU count.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Single GPU Thermal Throttling Straggler Disaster",
          prompt:
            "In a 1,024-GPU cluster executing Ring-AllReduce, GPU 412 thermal-throttles its PCIe interface by 50%. How does this single straggler propagate stalls across the entire ring, and why does barrier synchronization collapse the efficiency of all 1,023 healthy GPUs?",
          engineeringContext:
            "Highlights the necessity of straggler detection and adaptive collective routing in production superclusters.",
        },
      ],
      partD_stressTests: [
        {
          title: "NCCL Ring Deadlock via Cyclic Stream Block",
          scenario:
            "GPU 0 launches a blocking `ncclSend` to GPU 1 on CUDA stream 0 before launching `ncclRecv` from GPU 3. Simultaneously, GPU 1 launches `ncclSend` to GPU 2. Because all send buffers fill before any receive kernel executes, all GPUs block waiting for downstream buffer drain, causing an unrecoverable CUDA collective deadlock.",
          failureMode: "Permanent GPU hang; job requires hard SIGKILL and cluster reset.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
