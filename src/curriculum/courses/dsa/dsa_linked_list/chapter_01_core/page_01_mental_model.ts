import type { CoursePage } from "../../../../courseTypes";

export const page_01_mental_model: CoursePage = {
  id: "dsa_linked_list_c1_p1",
  pageNumber: 1,
  title: "Fragmented Memory Topologies, Pointer Invariants & Skip Lists",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Contiguous Memory Constraint & Physical Fragmentation",
      content:
        "Contiguous arrays demand unbroken linear physical/virtual address spaces. In operating system kernels, kernel memory slab allocators, and real-time database buffer pools, long-running processes create severe heap fragmentation, making massive contiguous array allocations fail. Linked Lists decouple logical sequence from physical address adjacency: nodes reside scattered anywhere in RAM, connected logically via memory pointers. While sacrificing $O(1)$ random indexing, linked structures enable strictly $O(1)$ in-place topological insertions, splices, and re-orderings without moving payload memory.",
    },
    {
      type: "prose",
      title: "Taxonomy of Linked Structures & Probabilistic Hierarchies",
      content:
        "Linked lists span deterministic linear topologies and multi-level probabilistic search structures:\n\n1. **Fundamental Linear Linked Topologies:**\n   - **Singly Linked List:** Unidirectional pointer chain (`Node* next`). Minimal memory overhead ($8$ bytes of pointer per node on 64-bit architectures), but requires traversal from head for all modifications.\n   - **Doubly Linked List:** Bidirectional pointer chain (`Node* prev`, `Node* next`). Enables strictly $O(1)$ node removal given direct pointer to the node (foundational for LRU caches and OS process schedulers).\n   - **Circular Linked List:** Tail node points directly back to head, modeling round-robin time-slicing schedulers.\n\n2. **Sentinel / Dummy Node Architecture:**\n   - Allocating a static dummy head node eliminates null checks and special-case edge branches for insertions/deletions at the list boundary, simplifying in-place reversals and merges.\n\n3. **Skip Lists (Probabilistic Multi-Level Search):**\n   - Invented by William Pugh (1990) as an alternative to balanced binary search trees (AVL/Red-Black).\n   - Augments a sorted singly linked list with a hierarchy of express lanes (levels). Each node is promoted to level $i+1$ with independent probability $p = 1/2$.\n   - Level $h$ contains approximately $N/2^h$ nodes. Search starts at the highest express level, jumping across large intervals and descending levels, answering search, insertion, and deletion in strictly $O(\\log N)$ expected time and $O(N)$ expected space.",
    },
    {
      type: "mental_model",
      title: "Skip List Express Lanes & In-Place Reversal Invariants",
      visualIntuition: `
=== SKIP LIST MULTI-LEVEL EXPRESS LANES (Pugh 1990) ===
Level 3: [Head] ───────────────────────────> [ 14 ] ─────────────────────────> [NIL]
Level 2: [Head] ─────────────> [ 7 ] ──────> [ 14 ] ────────────> [ 25 ] ────> [NIL]
Level 1: [Head] ───> [ 3 ] ──> [ 7 ] ──> [9] > [ 14 ] ──> [ 19 ] > [ 25 ] ────> [NIL]
Level 0: [Head] -> [1] -> [3] -> [7] -> [9] -> [14] -> [19] -> [25] -> [31] -> [NIL]

Search for Target = 19:
1. Start at Level 3: Head -> 14. (14 < 19). Step to node 14.
2. At node 14 (Level 3): Next is NIL. Drop to Level 2!
3. At node 14 (Level 2): Next is 25 (25 > 19). Cannot advance. Drop to Level 1!
4. At node 14 (Level 1): Next is 19 (19 == 19). FOUND TARGET IN 4 COMPARISONS!

=== IN-PLACE LINKED LIST REVERSAL INVARIANT ===
      [prev]               [curr] ──────> [next]
        |                    |              |
 [A] <- [B]                 [C] ─────────> [D] -> [E] -> NIL
(Reversed Prefix)      (Unreversed Suffix)

Step:
  next = curr.next;
  curr.next = prev;
  prev = curr;
  curr = next;
      `,
      invariant:
        "Topological & Search Invariants:\n1. Reversal Invariant: At step $k$, `prev` points to a properly reversed prefix list of length $k$, and `curr` points to the un-reversed suffix list of length $N - k$. Zero nodes are lost or leaked.\n2. Skip List Monotonicity: At every level $L$, elements are strictly sorted in ascending order: $\\text{val}(u) < \\text{val}(\\text{next}_L(u))$.",
      stateTransitions:
        "Reversal Step: `next = curr.next; curr.next = prev; prev = curr; curr = next;`\nSkip List Search: At level $L$, while `curr.next[L] < target`, `curr = curr.next[L]`; then `L--`.",
      naiveBottleneck:
        "Linked lists have $O(N)$ random access latency and incur heavy CPU cache misses on pointer dereferences.",
      optimalInsight:
        "Skip lists provide balanced-tree performance ($O(\\log N)$) using simple probabilistic pointer promotions, while unrolled chunked nodes restore 64-byte L1 cache line locality.",
    },
  ],
};

export const page1 = page_01_mental_model;
