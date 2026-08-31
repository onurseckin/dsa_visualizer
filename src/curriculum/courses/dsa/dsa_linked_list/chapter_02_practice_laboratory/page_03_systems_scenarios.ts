import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "dsa_linked_list_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_linked_list",
      title: "Linked List Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Reverse Nodes in k-Group",
          problemId: "reverse-nodes-in-k-group",
          difficulty: "Hard",
          description:
            "Given the head of a linked list, reverse the nodes of the list $K$ at a time, and return the modified list in strictly $O(N)$ time and $O(1)$ extra memory without allocating new heap nodes.",
          rationale:
            "Evaluates masterclass in-place pointer manipulation and group boundary re-splicing.",
        },
        {
          title: "LRU Cache Design",
          problemId: "lru-cache-design",
          difficulty: "Medium",
          description:
            "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache supporting `get` and `put` in strictly $O(1)$ average time using a hash map combined with a doubly linked list.",
          rationale:
            "Tests composite structure maintenance where nodes are detached and moved to head in $O(1)$ time.",
        },
        {
          title: "Merge k Sorted Lists",
          problemId: "merge-k-sorted-lists",
          difficulty: "Hard",
          description:
            "Merge $K$ sorted linked lists and return it as one sorted list. Implement using Divide-and-Conquer or a Priority Queue in $O(N \\log K)$ time and $O(1)$ extra space.",
          rationale: "Tests multi-way pointer streaming and optimal logarithmic tree merging.",
        },
        {
          title: "Reorder List (Fold Alternating)",
          problemId: "reorder-list-alternating",
          difficulty: "Medium",
          description:
            "Reorder a singly linked list $L_0 \\to L_1 \\to \\dots \\to L_n$ to $L_0 \\to L_n \\to L_1 \\to L_{n-1} \\dots$ in-place in $O(N)$ time and $O(1)$ extra space by combining: (1) Middle finding, (2) In-place second half reversal, (3) Alternating merge.",
          rationale:
            "Tests sequential composition of fundamental linked list subroutines under strict $O(1)$ space constraints.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Move-to-Front (MTF) 2-Competitiveness via Potential Method",
          statement:
            "Prove that Sleator & Tarjan's Move-to-Front (MTF) heuristic for self-organizing linked lists is 2-competitive with the optimal offline algorithm (OPT): $\\text{Cost}_{\\text{MTF}}(\\sigma) \\le 2 \\cdot \\text{Cost}_{\\text{OPT}}(\\sigma) + O(N^2)$.",
          proofOutline:
            "Define the potential function $\\Phi$ as the number of inversions between the MTF list and the OPT list. Accessing item $x$ at position $k$ in MTF and position $j$ in OPT incurs actual cost $k$. Moving $x$ to front creates at most $j - 1$ new inversions while destroying $k - j$ old inversions. Amortized cost $\\hat{c} = k + \\Delta \\Phi \\le k + (j - 1) - (k - j) = 2j - 1 = 2 \\cdot \\text{Cost}_{\\text{OPT}} - 1$, proving 2-competitiveness.",
          engineeringContext:
            "Forms the theoretical foundation for cache eviction policies and CPU TLB replacement.",
        },
        {
          title: "Fast/Slow Pointer Middle Node Parity Invariant",
          statement:
            "Prove that when slow pointer advances 1 step and fast pointer advances 2 steps from head on a list of $N$ nodes, slow pointer terminates at node $\\lfloor N/2 \\rfloor + 1$ when fast reaches the end.",
          proofOutline:
            "For an odd-length list $N = 2k + 1$, after $k$ steps, fast is at node $2k + 1$ (the last node, where `fast.next === null`), and slow is at node $k + 1$ (the exact center). For an even-length list $N = 2k$, after $k$ steps, fast reaches `null`, and slow reaches node $k + 1$ (the second of the two middle nodes).",
          engineeringContext:
            "Guarantees exact halving of linked lists during in-place Merge Sort.",
        },
        {
          title: "Skip List High-Probability Concentration Bound",
          statement:
            "Prove that with probability at least $1 - 1/N$, the maximum level of any node in an $N$-element Skip List does not exceed $3 \\log_2 N$.",
          proofOutline:
            "The probability that a single node reaches level $k$ is $(1/2)^k$. By Boole's inequality (Union Bound), the probability that *any* of the $N$ nodes reaches level $\\ge 3 \\log_2 N$ is $\\le N \\cdot (1/2)^{3 \\log_2 N} = N \\cdot \\frac{1}{N^3} = \\frac{1}{N^2} \\le \\frac{1}{N}$. Therefore, maximum height is bounded by $O(\\log N)$ with probability $\\ge 1 - 1/N$.",
          engineeringContext:
            "Guarantees that skip list memory allocation and pointer arrays never blow up unexpectedly.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Pointer Chasing DRAM Latency vs L1 Cache Lines",
          prompt:
            "Why does traversing $10^6$ node objects in a linked list execute $50\\times$ slower than iterating over an `Int32Array(10^6)`?",
          engineeringContext:
            "Contiguous arrays trigger hardware stream prefetchers, loading 16 elements per L1 cache line (1 ns). Linked lists scatter nodes across DRAM, incurring full $50-80$ ns DRAM round-trip latency on every pointer hop.",
        },
        {
          title: "Unrolled Chunked Nodes (B-Lists) Memory Layout",
          prompt:
            "How does packing 16 integers per node into an Unrolled Linked List reduce CPU cache misses by $93.75\\%$ while maintaining $O(1)$ insertions?",
          engineeringContext:
            "Each 64-byte unrolled chunk matches the CPU L1 data cache line size. Once the chunk is loaded, iterating through its 16 elements occurs with zero cache misses at register speed.",
        },
        {
          title: "Lock-Free Harris Linked List Marked CAS Bit Invariant",
          prompt:
            "In concurrent lock-free linked lists, how does logically marking the lowest bit of a pointer (`next | 1`) before physical removal prevent concurrent insertion races?",
          engineeringContext:
            "Marking the pointer notifies concurrent threads that the node is logically deleted. Any thread attempting to insert after this node will fail its atomic CAS, preventing nodes from being inserted behind deleted parents.",
        },
      ],
      partD_stressTests: [
        {
          title: "Fast/Slow Pointer Null Pointer Dereference Crash",
          scenario:
            "Advancing `fast = fast.next.next` on an even-length list without checking `fast !== null && fast.next !== null`.",
          failureMode:
            "When `fast.next` is null, attempting to read `fast.next.next` throws an unhandled `TypeError: Cannot read properties of null` exception.",
        },
        {
          title: "Circular Doubly Linked List Memory Leak",
          scenario:
            "Dropping the head pointer of a circular doubly linked list in a reference-counted runtime without severing internal `prev`/`next` references.",
          failureMode:
            "Internal circular references keep node reference counts $\\ge 1$, permanently leaking the entire list memory.",
        },
        {
          title: "Dangling Pointer Severing Bug during In-Place Reversal",
          scenario:
            "Executing `curr.next = prev` before caching `const next = curr.next` in iterative list reversal.",
          failureMode:
            "The pointer to the rest of the list is severed, permanently orphaning and leaking all remaining nodes.",
        },
      ],
    },
  ],
};

export const page3 = page_03_systems_scenarios;
