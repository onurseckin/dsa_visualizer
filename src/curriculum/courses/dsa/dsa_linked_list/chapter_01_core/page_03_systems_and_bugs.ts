import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_and_bugs: CoursePage = {
  id: "dsa_linked_list_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Pointer-Chasing Memory Wall & Unrolled Cache Lines",
      content:
        "Modern CPUs execute instructions in $<0.3$ nanoseconds, but accessing main DRAM memory takes $50-80$ nanoseconds (200-300 CPU clock cycles):\n\n1. **The Pointer-Chasing Cache Miss Penalty:** In a classical linked list, each node is independently allocated on the heap. Traversing `node = node.next` triggers a non-contiguous random memory access, causing an L1/L2/L3 cache miss on every single node. Iterating through $10^6$ linked nodes runs up to **$50\\times$ slower** than iterating through a contiguous array of $10^6$ integers.\n2. **Unrolled Linked Lists (B-Lists):** By packing a chunk of 16 integers (`Int32Array(16)` = 64 bytes) into each node, traversing the chunk executes inside the L1 data cache at 1 cycle per element, reducing cache misses by $93.75\\%$ while preserving $O(1)$ chunk splicing.\n3. **Memory Allocator Overhead & Metadata Bloat:** In 64-bit systems, a single 4-byte integer stored in a doubly linked list consumes $4\\text{ B (val)} + 8\\text{ B (prev)} + 8\\text{ B (next)} + 16\\text{ B (allocator header)} = 36\\text{ bytes}$—an $800\\%$ memory overhead!",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Pointer Severing & Fast/Slow Null Dereferences",
      content:
        "1. **Dangling Pointer Severing Bug:** In linked list reversal, executing `curr.next = prev` before caching `const next = curr.next` severs the reference to the rest of the list, permanently leaking all downstream nodes.\n2. **Fast/Slow Pointer Null Dereference Crash:** Stepping `fast = fast.next.next` without verifying `fast !== null && fast.next !== null` throws a fatal `TypeError: Cannot read property 'next' of null` on even-length lists.\n3. **Memory Leaks in Cyclic Doubly Linked Lists:** In reference-counted runtimes (e.g. Swift, Python), circular references between `prev` and `next` pointers prevent reference counts from dropping to zero, silently leaking memory unless weak references or explicit disconnect passes are used.\n4. **Skip List PRNG Bias:** Using flawed pseudo-random number generators for coin flips creates skewed level distributions, degrading skip list search times from $O(\\log N)$ to $O(N)$.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Concurrent Frontiers: Lock-Free Skip Lists & Harris CAS Deletions",
      content:
        "In high-performance multi-threaded key-value stores (e.g. RocksDB MemTable, LevelDB, Redis):\n- **Lock-Free Concurrent Skip Lists:** Skip lists are preferred over Red-Black trees in concurrent systems because insertions require modifying only local adjacent pointers at each level without rotating global tree hierarchies. Multiple threads insert concurrently using atomic Compare-And-Swap (CAS) instructions.\n- **Harris Split-Ordered Lists (Harris 2001):** Solves concurrent deletion by logically marking a node's `next` pointer with a low-order 'marked' bit before physically removing it with CAS, preventing concurrent threads from inserting new nodes after a deleted node.",
    },
    {
      type: "prose",
      title: "Linked Data Structure Selection Matrix",
      content: `
| Data Structure | Search Time | Insert / Delete (At Pointer) | Cache Locality | Memory Overhead Per Value | Best Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Singly Linked List** | $O(N)$ | $O(1)$ | Terrible (scattered) | $8$ bytes | Hash table separate chaining buckets |
| **Doubly Linked List** | $O(N)$ | $O(1)$ | Terrible (scattered) | $16$ bytes | LRU cache page tracking, deque queues |
| **Circular Linked List** | $O(N)$ | $O(1)$ | Terrible | $8-16$ bytes | Round-robin scheduler queues |
| **Unrolled Linked List** | $O(N)$ | $O(1)$ (chunk split) | Excellent (64-byte chunks) | $<1$ byte per element | Text editor buffer pools, gap buffers |
| **Skip List** | $O(\\log N)$ expected | $O(\\log N)$ expected | Medium | $16$ bytes expected | In-memory key-value MemTables (RocksDB) |
| **Array-Backed List** | $O(1)$ random | $O(N)$ shift | Maximum (L1 streaming) | $0$ bytes overhead | General purpose sequential processing |
      `,
    },
  ],
};

export const page3 = page_03_systems_and_bugs;
