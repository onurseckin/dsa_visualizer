import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_heap_and_priority_queue_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_heap_and_priority_queue",
      title: "Heap & Priority Queue Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Find Median from Data Stream",
          problemId: "find-median-from-data-stream",
          difficulty: "Hard",
          description:
            "Design a data structure that supports adding numbers from a continuous stream and finding the median in $O(1)$ time by balancing a Max-Heap (lower half) and a Min-Heap (upper half).",
          rationale:
            "Evaluates dual-heap invariant balancing and continuous order-statistic tracking.",
        },
        {
          title: "Top K Frequent Elements",
          problemId: "top-k-frequent-elements-heap",
          difficulty: "Medium",
          description:
            "Given an integer array nums and an integer $K$, return the $K$ most frequent elements in $O(N \\log K)$ time using a min-heap of size $K$ to discard suboptimal elements dynamically.",
          rationale: "Demonstrates optimal heap memory bounding for large streaming datasets.",
        },
        {
          title: "Task Scheduler with Cooldown Intervals",
          problemId: "task-scheduler-heap",
          difficulty: "Medium",
          description:
            "Given CPU tasks represented by characters and a cooldown integer $n$, find the least number of CPU intervals required to execute all tasks using a Max-Heap to prioritize highest-frequency tasks.",
          rationale:
            "Tests greedy priority extraction coupled with temporal cooldown queue mechanics.",
        },
        {
          title: "Minimum Cost to Connect Sticks (Huffman Tree)",
          problemId: "minimum-cost-to-connect-sticks",
          difficulty: "Medium",
          description:
            "You have some number of sticks with positive integer lengths. Connect all sticks into one stick by repeatedly picking the two shortest sticks and connecting them. Solve in $O(N \\log N)$ using a Min-Heap.",
          rationale: "Tests Huffman coding greedy optimality and prefix merge trees.",
        },
      ],
      partB_mathProofs: [
        {
          title: "4-ary Heap Optimal Height Reduction",
          statement:
            "Prove that a 4-ary heap ($D=4$) reduces tree height to $\\log_4 N = 0.5 \\log_2 N$, and that while `deleteMin` requires $4 \\log_4 N = 2 \\log_2 N$ comparisons, hardware L1 cache line loading renders it faster than a binary heap in practice.",
          proofOutline:
            "A complete tree with branching factor $D$ has height $H = \\lceil \\log_D N \\rceil$. Sifting down from level $k$ checks $D$ children. For $D=4$, all 4 children are stored contiguously in memory, loading into a single 64-byte L1 cache line. Although 4 comparisons are made, zero DRAM cache misses occur during child evaluation, outperforming binary heaps whose children trigger separate cache line loads.",
          engineeringContext:
            "Used in high-throughput database query engines and graph routing kernels.",
        },
        {
          title: "Binomial Queue Amortized Insertion via Binary Arithmetic",
          statement:
            "Prove that inserting $N$ items into an initially empty Binomial Queue takes strictly $O(N)$ total time, with each insertion taking $O(1)$ amortized time.",
          proofOutline:
            "A Binomial Queue is isomorphic to binary number representation: tree $B_k$ has size $2^k$. Merging two binomial trees of rank $k$ takes $O(1)$ time, exactly analogous to adding 1 with binary carry propagation. Inserting $N$ times performs work proportional to the total number of bit flips when counting from 1 to $N$, which is $\\sum_{k=1}^\\infty \\lfloor N/2^k \\rfloor = N \\sum_{k=1}^\\infty 2^{-k} = N(1) = O(N)$. Thus, amortized insertion cost is $O(1)$.",
          engineeringContext:
            "Theoretical underpinning for meldable priority queues and functional heaps.",
        },
        {
          title: "Huffman Prefix Code Tree Optimality Theorem",
          statement:
            "Prove that Huffman's greedy algorithm using a min-heap produces an optimal prefix-free binary tree that minimizes expected code length $\\mathcal{L} = \\sum_{i=1}^N f_i \\cdot d_i$.",
          proofOutline:
            "By structural induction on alphabet size $N$. Lemma: The two symbols with the lowest frequencies $x, y$ must appear as siblings at maximum depth in an optimal tree. Merging $x$ and $y$ into a composite symbol $z$ with frequency $f_z = f_x + f_y$ reduces the problem to $N-1$ symbols with cost $\\mathcal{L}(T) = \\mathcal{L}(T') + f_x + f_y$. By the inductive hypothesis, $T'$ is optimal for $N-1$, implying $T$ is optimal for $N$.",
          engineeringContext: "Core compression algorithm in DEFLATE, GZIP, and JPEG file formats.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "4-ary Heap L1 Cache Line Saturation",
          prompt:
            "Why does a 4-ary heap outperform a standard binary heap on modern x86/ARM processors despite performing more scalar comparisons per level?",
          engineeringContext:
            "In binary heaps, 2 children span 8 bytes, wasting the rest of the 64-byte L1 cache line fetch. In a 4-ary heap, all 4 children fit in the same 64-byte cache line, and tree height is halved from $\\log_2 N$ to $0.5 \\log_2 N$, halving total DRAM memory stall cycles.",
        },
        {
          title: "SIMD Vectorized Min-Reduction on Child Nodes",
          prompt:
            "How does compiling 4-ary child comparisons to a single 128-bit SIMD instruction (`_mm_min_epi32`) eliminate branch mispredictions?",
          engineeringContext:
            "Scalar `if (child[k] < minVal)` instructions generate conditional branch instructions that fail branch prediction on unsorted child arrays. SIMD vector min instructions find the minimum across 4 slots in 1 CPU cycle without branches.",
        },
        {
          title: "Indexed Priority Queue In-Place State Maintenance in Network Routing",
          prompt:
            "Why is maintaining bidirectional position maps (`pm` and `im`) essential for line-rate network packet routing using Dijkstra's algorithm?",
          engineeringContext:
            "Without an IPQ, updating router link costs pushes duplicate nodes to the heap, bloating heap size to $O(E)$ and requiring slow garbage collection. An IPQ enforces strict $|V|$ heap occupancy with $O(\\log V)$ in-place updates.",
        },
      ],
      partD_stressTests: [
        {
          title: "Top-Down $O(N \\log N)$ Build Heap Timeout",
          scenario:
            "Constructing a priority queue of $10^7$ elements by calling `push` sequentially instead of Floyd's linear `buildHeap`.",
          failureMode:
            "The top-down approach executes $\\approx 10^7 \\log_2(10^7) \\approx 2.3 \\times 10^8$ operations, exceeding the execution time budget and timing out.",
        },
        {
          title: "Stale Priority Element Duplicate Explosion in Dense Graphs",
          scenario:
            "Running standard priority queue Dijkstra on a dense graph ($V = 10^4, E = 10^7$) without stale node skipping or Indexed Priority Queues.",
          failureMode:
            "The priority queue accumulates $10^7$ duplicate node entries, causing out-of-memory heap allocation crashes.",
        },
        {
          title: "0-Based D-ary Arithmetic Parent Calculation Off-by-One",
          scenario:
            "Computing parent in a 0-indexed $D$-ary heap using formula `i / D` instead of `Math.floor((i - 1) / D)`.",
          failureMode:
            "Node 0 becomes its own parent and child nodes 1 to $D-1$ map to incorrect parents, destroying heap topology.",
        },
      ],
    },
  ],
};
