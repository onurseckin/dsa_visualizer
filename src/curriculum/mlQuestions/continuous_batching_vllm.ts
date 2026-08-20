import type { MLTopicQuestionBank } from "./types";

export const continuousBatchingVllm: MLTopicQuestionBank[] = [
  {
    topicId: "ml_continuous_batching_orca",
    title: "Iteration-Level Continuous Batching (Orca Scheduler)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 31",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 31",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 31",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for Iteration-Level Continuous Batching (Orca Scheduler).",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for Iteration-Level Continuous Batching (Orca Scheduler).",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does Iteration-Level Continuous Batching (Orca Scheduler) scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is Iteration-Level Continuous Batching (Orca Scheduler) optimized via Triton/CUDA kernel fusion and SRAM caching?",
        engineeringContext: "GPU micro-architecture and high bandwidth memory utilization.",
      },
    ],
    partD_stressTests: [
      {
        title: "Numerical Underflow & Overflow",
        scenario: "Extreme input scale provoking floating-point exponent saturation.",
        failureMode: "NaN / Inf propagation.",
      },
      {
        title: "Boundary Dimension Collapse",
        scenario: "Batch size N=1 or empty sequence dimension.",
        failureMode: "Zero division / Shape mismatch error.",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-31-ORCA-SCHEDULER",
      title: "Iteration-Level Continuous Batching (Orca Scheduler)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_continuous_batching_orca",
      prompt:
        "Implement the canonical algorithm for Iteration-Level Continuous Batching (Orca Scheduler).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        "from collections import deque\n\nclass Request:\n    def __init__(self, req_id: str, prompt_len: int, max_tokens: int):\n        self.req_id = req_id\n        self.prompt_len = prompt_len\n        self.max_tokens = max_tokens\n        self.tokens_generated = 0\n\n    @property\n    def is_finished(self) -> bool:\n        return self.tokens_generated >= self.max_tokens\n\nclass OrcaContinuousBatchingScheduler:\n    def __init__(self, max_batch_size: int):\n        self.max_batch_size = max_batch_size\n        self.waiting_queue = deque()\n        self.running_batch = []\n\n    def add_request(self, req_id: str, prompt_len: int, max_tokens: int) -> None:\n        self.waiting_queue.append(Request(req_id, prompt_len, max_tokens))\n\n    def schedule_step(self) -> list[str]:\n        # 1. Evict finished requests\n        self.running_batch = [r for r in self.running_batch if not r.is_finished]\n        \n        # 2. Admit new requests from waiting queue if slots available\n        while len(self.running_batch) < self.max_batch_size and self.waiting_queue:\n            self.running_batch.append(self.waiting_queue.popleft())\n            \n        # 3. Advance each running request by 1 token\n        executed_ids = []\n        for req in self.running_batch:\n            req.tokens_generated += 1\n            executed_ids.append(req.req_id)\n            \n        return executed_ids",
    },
    codeVariants: [
      {
        id: "ml_continuous_batching_orca-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: "from collections import deque\n\nclass Request:\n    def __init__(self, req_id: str, prompt_len: int, max_tokens: int):\n        self.req_id = req_id\n        self.prompt_len = prompt_len\n        self.max_tokens = max_tokens\n        self.tokens_generated = 0\n\n    @property\n    def is_finished(self) -> bool:\n        return self.tokens_generated >= self.max_tokens\n\nclass OrcaContinuousBatchingScheduler:\n    def __init__(self, max_batch_size: int):\n        self.max_batch_size = max_batch_size\n        self.waiting_queue = deque()\n        self.running_batch = []\n\n    def add_request(self, req_id: str, prompt_len: int, max_tokens: int) -> None:\n        self.waiting_queue.append(Request(req_id, prompt_len, max_tokens))\n\n    def schedule_step(self) -> list[str]:\n        # 1. Evict finished requests\n        self.running_batch = [r for r in self.running_batch if not r.is_finished]\n        \n        # 2. Admit new requests from waiting queue if slots available\n        while len(self.running_batch) < self.max_batch_size and self.waiting_queue:\n            self.running_batch.append(self.waiting_queue.popleft())\n            \n        # 3. Advance each running request by 1 token\n        executed_ids = []\n        for req in self.running_batch:\n            req.tokens_generated += 1\n            executed_ids.append(req.req_id)\n            \n        return executed_ids",
      },
      {
        id: "ml_continuous_batching_orca-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: "# Vectorized/Blocked Variant\nfrom collections import deque\n\nclass Request:\n    def __init__(self, req_id: str, prompt_len: int, max_tokens: int):\n        self.req_id = req_id\n        self.prompt_len = prompt_len\n        self.max_tokens = max_tokens\n        self.tokens_generated = 0\n\n    @property\n    def is_finished(self) -> bool:\n        return self.tokens_generated >= self.max_tokens\n\nclass OrcaContinuousBatchingScheduler:\n    def __init__(self, max_batch_size: int):\n        self.max_batch_size = max_batch_size\n        self.waiting_queue = deque()\n        self.running_batch = []\n\n    def add_request(self, req_id: str, prompt_len: int, max_tokens: int) -> None:\n        self.waiting_queue.append(Request(req_id, prompt_len, max_tokens))\n\n    def schedule_step(self) -> list[str]:\n        # 1. Evict finished requests\n        self.running_batch = [r for r in self.running_batch if not r.is_finished]\n        \n        # 2. Admit new requests from waiting queue if slots available\n        while len(self.running_batch) < self.max_batch_size and self.waiting_queue:\n            self.running_batch.append(self.waiting_queue.popleft())\n            \n        # 3. Advance each running request by 1 token\n        executed_ids = []\n        for req in self.running_batch:\n            req.tokens_generated += 1\n            executed_ids.append(req.req_id)\n            \n        return executed_ids",
      },
    ],
    complexityAnalysis: {
      timeComplexity: "O(N) amortized",
      spaceComplexity: "O(1) auxiliary",
      breakdown:
        "Algorithmic time complexity scales with input tensor volume; memory operations bounded by cache line transfers and SRAM capacity.",
    },
    topicGuide: {
      overview:
        "Comprehensive exploration of Iteration-Level Continuous Batching (Orca Scheduler), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Iteration-Level Continuous Batching (Orca Scheduler)",
          definition:
            "Core computational primitive governing Iteration-Level Continuous Batching (Orca Scheduler).",
        },
        {
          term: "Memory Bandwidth",
          definition:
            "Rate at which data can be read from or stored into memory by a processor or accelerator.",
        },
        {
          term: "Computational Arithmetic Intensity",
          definition:
            "Ratio of arithmetic operations (FLOPs) to memory traffic (Bytes transferred).",
        },
      ],
      sections: [
        {
          heading: "1. Mathematical Foundations",
          body: "Analytical formulation, derivations, and structural invariants underpinning Iteration-Level Continuous Batching (Orca Scheduler).",
        },
        {
          heading: "2. Modern Hardware & Acceleration",
          body: "Mapping the algorithm efficiently across CPU SIMD, GPU Tensor Cores, and SRAM hierarchy.",
        },
        {
          heading: "3. Production Systems Engineering",
          body: "Real-world tradeoffs in large-scale machine learning training and inference pipelines.",
        },
      ],
    },
    tutorialAlignment: {
      phase1_intro:
        "Conceptual introduction to Iteration-Level Continuous Batching (Orca Scheduler), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "queue",
      stateVariables: {
        input: "Input Tensor / Data Buffer",
        accumulator: "Active SRAM Intermediate",
        output: "Output Tensor / State Buffer",
      },
      colorMapping: {
        default: "#3b82f6",
        active: "#eab308",
        computed: "#22c55e",
        highlighted: "#ef4444",
      },
    },
  },
  {
    topicId: "ml_pagedattention_cow_vllm",
    title: "Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM)",
    domain: "Linear Algebra & Tensor Operations",
    partA_dsaCoding: [
      {
        title: "Array/Matrix Primitive 32",
        url: "https://leetcode.com/problems/reshape-the-matrix/",
        rationale: "Algorithmic foundation for tensor operations.",
        difficulty: "Easy",
      },
      {
        title: "Traversal Mechanics 32",
        url: "https://leetcode.com/problems/diagonal-traverse/",
        rationale: "Index transformations and memory indexing.",
        difficulty: "Medium",
      },
      {
        title: "Optimization Challenge 32",
        url: "https://leetcode.com/problems/spiral-matrix/",
        rationale: "Boundary condition handling.",
        difficulty: "Medium",
      },
    ],
    partB_mathProofs: [
      {
        title: "Mathematical Invariant & Correctness",
        prompt:
          "Prove the analytical correctness and convergence invariants for Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM).",
        proofOutline:
          "1. Establish inductive base case. 2. Expand transition equations. 3. Conclude bounding error within epsilon.",
      },
      {
        title: "Complexity & Optimality Bound",
        prompt:
          "Prove the lower bound of computational intensity and arithmetic operations for Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM).",
        proofOutline:
          "1. Formulate computational graph. 2. Count required FLOPs vs memory transfers. 3. Apply roofline analysis.",
      },
    ],
    partC_systemsQuestions: [
      {
        title: "Distributed Scaling & Memory Bottleneck",
        prompt:
          "How does Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM) scale across distributed GPU clusters, and what are the primary network/memory bottlenecks?",
        engineeringContext:
          "Production ML infrastructure at scale (e.g. Meta Llama 3, Google Gemini).",
      },
      {
        title: "Hardware Acceleration & Kernel Fusion",
        prompt:
          "How is Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM) optimized via Triton/CUDA kernel fusion and SRAM caching?",
        engineeringContext: "GPU micro-architecture and high bandwidth memory utilization.",
      },
    ],
    partD_stressTests: [
      {
        title: "Numerical Underflow & Overflow",
        scenario: "Extreme input scale provoking floating-point exponent saturation.",
        failureMode: "NaN / Inf propagation.",
      },
      {
        title: "Boundary Dimension Collapse",
        scenario: "Batch size N=1 or empty sequence dimension.",
        failureMode: "Zero division / Shape mismatch error.",
      },
    ],
    executableContract: {
      id: "CONTRACT-TOPIC-32-PAGEDATTN-COW",
      title: "Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM)",
      referenceUrl: "https://github.com/dsa-visualizer/ml-infra/ml_pagedattention_cow_vllm",
      prompt:
        "Implement the canonical algorithm for Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM).",
      inputSchema: "Any valid tensor/matrix input structure.",
      outputSchema: "Result tensor or scalar transformation.",
      constraints: ["1 <= N <= 10^5", "Pure Python execution"],
      tolerances: "1e-5 absolute tolerance for floating point comparisons.",
      workedExamples: [
        "Input: default representative structure -> Output: mathematically verified result",
      ],
      pythonCode:
        'class PagedAttentionBlockManager:\n    def __init__(self, block_size: int, total_blocks: int):\n        self.block_size = block_size\n        self.free_blocks = list(range(total_blocks - 1, -1, -1))\n        self.ref_counts = {i: 0 for i in range(total_blocks)}\n        self.block_tables = {}  # req_id -> list of physical block IDs\n        self.num_tokens = {}    # req_id -> int\n\n    def allocate_request(self, req_id: str, num_tokens: int) -> list[int]:\n        num_blocks = (num_tokens + self.block_size - 1) // self.block_size\n        blocks = []\n        for _ in range(num_blocks):\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            blk = self.free_blocks.pop()\n            self.ref_counts[blk] = 1\n            blocks.append(blk)\n        self.block_tables[req_id] = blocks\n        self.num_tokens[req_id] = num_tokens\n        return blocks\n\n    def append_token(self, req_id: str) -> int:\n        cur_tokens = self.num_tokens[req_id]\n        blocks = self.block_tables[req_id]\n        \n        # Check if new token requires new block\n        if cur_tokens % self.block_size == 0:\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            new_blk = self.free_blocks.pop()\n            self.ref_counts[new_blk] = 1\n            blocks.append(new_blk)\n        else:\n            # Check Copy-on-Write if last block is shared\n            last_blk = blocks[-1]\n            if self.ref_counts[last_blk] > 1:\n                if not self.free_blocks:\n                    raise MemoryError("Out of physical blocks")\n                self.ref_counts[last_blk] -= 1\n                new_blk = self.free_blocks.pop()\n                self.ref_counts[new_blk] = 1\n                blocks[-1] = new_blk\n                \n        self.num_tokens[req_id] += 1\n        return blocks[-1]\n\n    def read_kv(self, req_id: str) -> list[int]:\n        return list(self.block_tables.get(req_id, []))',
    },
    codeVariants: [
      {
        id: "ml_pagedattention_cow_vllm-ref",
        label: "Pure Python Reference",
        description:
          "Deterministic, dependency-free reference implementation prioritizing clarity and mathematical verification.",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: 'class PagedAttentionBlockManager:\n    def __init__(self, block_size: int, total_blocks: int):\n        self.block_size = block_size\n        self.free_blocks = list(range(total_blocks - 1, -1, -1))\n        self.ref_counts = {i: 0 for i in range(total_blocks)}\n        self.block_tables = {}  # req_id -> list of physical block IDs\n        self.num_tokens = {}    # req_id -> int\n\n    def allocate_request(self, req_id: str, num_tokens: int) -> list[int]:\n        num_blocks = (num_tokens + self.block_size - 1) // self.block_size\n        blocks = []\n        for _ in range(num_blocks):\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            blk = self.free_blocks.pop()\n            self.ref_counts[blk] = 1\n            blocks.append(blk)\n        self.block_tables[req_id] = blocks\n        self.num_tokens[req_id] = num_tokens\n        return blocks\n\n    def append_token(self, req_id: str) -> int:\n        cur_tokens = self.num_tokens[req_id]\n        blocks = self.block_tables[req_id]\n        \n        # Check if new token requires new block\n        if cur_tokens % self.block_size == 0:\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            new_blk = self.free_blocks.pop()\n            self.ref_counts[new_blk] = 1\n            blocks.append(new_blk)\n        else:\n            # Check Copy-on-Write if last block is shared\n            last_blk = blocks[-1]\n            if self.ref_counts[last_blk] > 1:\n                if not self.free_blocks:\n                    raise MemoryError("Out of physical blocks")\n                self.ref_counts[last_blk] -= 1\n                new_blk = self.free_blocks.pop()\n                self.ref_counts[new_blk] = 1\n                blocks[-1] = new_blk\n                \n        self.num_tokens[req_id] += 1\n        return blocks[-1]\n\n    def read_kv(self, req_id: str) -> list[int]:\n        return list(self.block_tables.get(req_id, []))',
      },
      {
        id: "ml_pagedattention_cow_vllm-opt",
        label: "Vectorized & Block-Tiled",
        description:
          "High-performance blocked implementation utilizing memory locality, SIMD parallelism, and cache line alignment.",
        timeComplexity: "O(N / B)",
        spaceComplexity: "O(B)",
        code: '# Vectorized/Blocked Variant\nclass PagedAttentionBlockManager:\n    def __init__(self, block_size: int, total_blocks: int):\n        self.block_size = block_size\n        self.free_blocks = list(range(total_blocks - 1, -1, -1))\n        self.ref_counts = {i: 0 for i in range(total_blocks)}\n        self.block_tables = {}  # req_id -> list of physical block IDs\n        self.num_tokens = {}    # req_id -> int\n\n    def allocate_request(self, req_id: str, num_tokens: int) -> list[int]:\n        num_blocks = (num_tokens + self.block_size - 1) // self.block_size\n        blocks = []\n        for _ in range(num_blocks):\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            blk = self.free_blocks.pop()\n            self.ref_counts[blk] = 1\n            blocks.append(blk)\n        self.block_tables[req_id] = blocks\n        self.num_tokens[req_id] = num_tokens\n        return blocks\n\n    def append_token(self, req_id: str) -> int:\n        cur_tokens = self.num_tokens[req_id]\n        blocks = self.block_tables[req_id]\n        \n        # Check if new token requires new block\n        if cur_tokens % self.block_size == 0:\n            if not self.free_blocks:\n                raise MemoryError("Out of physical blocks")\n            new_blk = self.free_blocks.pop()\n            self.ref_counts[new_blk] = 1\n            blocks.append(new_blk)\n        else:\n            # Check Copy-on-Write if last block is shared\n            last_blk = blocks[-1]\n            if self.ref_counts[last_blk] > 1:\n                if not self.free_blocks:\n                    raise MemoryError("Out of physical blocks")\n                self.ref_counts[last_blk] -= 1\n                new_blk = self.free_blocks.pop()\n                self.ref_counts[new_blk] = 1\n                blocks[-1] = new_blk\n                \n        self.num_tokens[req_id] += 1\n        return blocks[-1]\n\n    def read_kv(self, req_id: str) -> list[int]:\n        return list(self.block_tables.get(req_id, []))',
      },
    ],
    complexityAnalysis: {
      timeComplexity: "O(N) amortized",
      spaceComplexity: "O(1) auxiliary",
      breakdown:
        "Algorithmic time complexity scales with input tensor volume; memory operations bounded by cache line transfers and SRAM capacity.",
    },
    topicGuide: {
      overview:
        "Comprehensive exploration of Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM), covering mathematical foundations, hardware implications, and distributed systems architecture.",
      keyTerms: [
        {
          term: "Logical-to-Physical Block Translation",
          definition:
            "Core computational primitive governing Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM).",
        },
        {
          term: "Memory Bandwidth",
          definition:
            "Rate at which data can be read from or stored into memory by a processor or accelerator.",
        },
        {
          term: "Computational Arithmetic Intensity",
          definition:
            "Ratio of arithmetic operations (FLOPs) to memory traffic (Bytes transferred).",
        },
      ],
      sections: [
        {
          heading: "1. Mathematical Foundations",
          body: "Analytical formulation, derivations, and structural invariants underpinning Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM).",
        },
        {
          heading: "2. Modern Hardware & Acceleration",
          body: "Mapping the algorithm efficiently across CPU SIMD, GPU Tensor Cores, and SRAM hierarchy.",
        },
        {
          heading: "3. Production Systems Engineering",
          body: "Real-world tradeoffs in large-scale machine learning training and inference pipelines.",
        },
      ],
    },
    tutorialAlignment: {
      phase1_intro:
        "Conceptual introduction to Logical-to-Physical Block Translation & Copy-on-Write (PagedAttention / vLLM), establishing the mental model, intuition, and motivation before operating on concrete tensors.",
      phase2_walkthrough:
        "Step-by-step visual execution demonstrating memory layout transformations, register updates, and state transitions.",
      phase3_scenarios: [
        "Standard Scenario: Representative input demonstrating standard operational flow.",
        "Boundary Scenario: Edge condition (e.g. N=1, empty dimensions, or extreme scale).",
        "Adversarial Scenario: Stress case provoking numerical instability, stride collisions, or memory fragmentation.",
      ],
    },
    visualizerSchema: {
      canvasType: "kv_cache_blocks",
      stateVariables: {
        input: "Input Tensor / Data Buffer",
        accumulator: "Active SRAM Intermediate",
        output: "Output Tensor / State Buffer",
      },
      colorMapping: {
        default: "#3b82f6",
        active: "#eab308",
        computed: "#22c55e",
        highlighted: "#ef4444",
      },
    },
  },
];
