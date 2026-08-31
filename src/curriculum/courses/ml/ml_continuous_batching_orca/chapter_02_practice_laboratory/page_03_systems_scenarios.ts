import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_continuous_batching_orca_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: Continuous Batching",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_continuous_batching_orca",
      title: "Orca & Continuous Batching Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Preemption & KV Cache Swapping Engine",
          description:
            "Implement a priority-based request preemption policy for an iteration-level scheduler. When total active KV cache demands exceed available GPU memory blocks, select the lowest-priority request to preempt, choose between recomputation vs host RAM swapping, and preserve generation state cleanly.",
          problemStatement:
            "Given active requests and physical block limits, detect impending out-of-memory states, preempt the victim request, and resume it once memory pressure subsides.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Memory Saturation & Critical Batch Capacity",
          prompt:
            "Derive the critical batch size $B^* = \\frac{M_{\\text{VRAM}} - M_{\\text{weights}}}{2 \\times n_{\\text{layers}} \\times n_{\\text{heads}} \\times d_{\\text{head}} \\times \\bar{L} \\times 2}$ where GPU High Bandwidth Memory is 100% saturated. Prove how request arrival rate $\\lambda$ influences steady-state queue length under Little's Law $L_Q = \\lambda W$.",
          proofOutline:
            "1. Express total VRAM footprint as $M_{\\text{total}} = M_{\\text{weights}} + M_{\\text{KV}}(B) + M_{\\text{activations}}$.\\n2. Substitute $M_{\\text{KV}}(B) = B \\cdot \\bar{L} \\cdot (4 n_{\\text{layers}} d_{\\text{model}})$.\\n3. Solve for $B^*$ when $M_{\\text{total}} = M_{\\text{VRAM}}$.\\n4. Apply Little's Law $L = \\lambda W$ to show that when $\\lambda > B^* / \\bar{T}_{\\text{service}}$, queue length diverges to infinity unless admission control is enforced.",
          engineeringContext:
            "Forms the theoretical foundation of autoscaling and load-shedding algorithms in LLM serving infrastructure.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Disaggregated Prefill vs. Decode Clusters (DistServe / Splitwise)",
          prompt:
            "Why do frontier serving architectures physically separate GPU instances into dedicated Prefill nodes (running compute-bound GEMMs with Tensor Parallelism TP=4/8) and Decode nodes (running memory-bound GEMVs with Pipeline Parallelism PP=2)? What is the exact network bandwidth requirement to stream KV cache tensors between nodes over 400Gbps RoCEv2?",
          engineeringContext:
            "Eliminates prefill-decode interference and achieves near 100% hardware efficiency across both phases.",
        },
      ],
      partD_stressTests: [
        {
          title: "Sudden Prompt Burst & Out-Of-Memory (OOM) Cascading Failure",
          scenario:
            "A sudden traffic spike injects 100 requests simultaneously with prompt length 8,192. If the continuous batching scheduler admits too many prefills without checking KV cache reservation headroom for subsequent decode steps, all requests advance to step 50 and simultaneously request new KV blocks, triggering an unrecoverable GPU CUDA Out-Of-Memory crash.",
          failureMode:
            "Entire inference server process crashes, dropping all active user sessions simultaneously.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
