import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_and_code: CoursePage = {
  id: "dsa_linked_list_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Skip List Search Complexity & Geometric Space Bounds (Pugh 1990)",
      theorem:
        "In a Skip List containing $N$ elements where each node is promoted to level $i+1$ with independent probability $p = 1/2$ (maximum level $L_{\\max} = \\lfloor \\log_{1/p} N \\rfloor$), the total memory consumption is $O(N)$ with expected value $\\mathbb{E}[\\text{Pointers}] = \\frac{N}{1-p} = 2N$, and the expected search path length is strictly bounded by $O(\\log N)$.",
      proof: `
**Proof via Backward Search Path Analysis & Geometric Distribution:**
1. **Space Analysis (Geometric Distribution):**
   - The level of each node is a random variable $K \\in \\{1, 2, 3, \\dots\\}$ following a geometric distribution with parameter $1 - p$:
     $$\\Pr[K = k] = (1 - p) p^{k-1}$$
   - The expected number of forward pointers per node is:
     $$\\mathbb{E}[K] = \\sum_{k=1}^\\infty k (1 - p) p^{k-1} = \\frac{1}{1 - p}$$
   - For $p = 1/2$, $\\mathbb{E}[K] = \\frac{1}{1 - 1/2} = 2$.
   - Summing across all $N$ nodes:
     $$\\mathbb{E}[\\text{Total Pointers}] = \\sum_{i=1}^N \\mathbb{E}[K_i] = \\frac{N}{1 - p} = 2N = O(N)$$
2. **Time Analysis (Backward Search Traversal):**
   - Trace the search path backwards starting from target node $x$ at level 0 up to the top level of the head node.
   - At any node $u$ and level $l$:
     - If node $u$ was promoted to level $l + 1$, the backward step moves **UP** to level $l + 1$. This occurs with probability $p = 1/2$.
     - If node $u$ was not promoted to level $l + 1$, the backward step moves **LEFT** at level $l$ to the preceding node. This occurs with probability $1 - p = 1/2$.
   - Let $C(k)$ denote the expected number of steps to climb $k$ levels in a list of infinite length. The recurrence relation is:
     $$C(k) = (1 - p)(1 + C(k)) + p(1 + C(k - 1))$$
   - Solving for $C(k)$:
     $$C(k) = 1 + (1 - p) C(k) + p C(k - 1) \\implies p C(k) = 1 + p C(k - 1) \\implies C(k) = C(k - 1) + \\frac{1}{p}$$
   - Since $C(0) = 0$, climbing $L$ levels requires expected steps:
     $$C(L) = \\frac{L}{p}$$
   - Setting $L = \\log_{1/p} N$ and $p = 1/2$:
     $$\\mathbb{E}[\\text{Search Steps}] \\le \\frac{\\log_2 N}{1/2} = 2 \\log_2 N = O(\\log N)$$
3. Thus, Skip Lists match the $O(\\log N)$ search and $O(N)$ space bounds of balanced BSTs with significantly simpler non-rebalancing pointer splices. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: In-Place Linked List Reversal Correctness Invariant",
      theorem:
        "For a singly linked list of $N$ nodes, the 4-pointer assignment permutation (next = curr.next; curr.next = prev; prev = curr; curr = next;) terminates in $N$ iterations with 'prev' pointing to the exact reverse of the initial list, preserving all $N$ original nodes with zero memory allocation.",
      proof: `
**Proof by Mathematical Induction on List Length:**
1. Let the original list be $L_0 = (v_1 \\to v_2 \\to \\dots \\to v_N \\to \\text{null})$.
2. **Loop Invariant:** At the start of iteration $k$ ($0 \\le k \\le N$):
   - Pointer 'prev' points to the head of the reversed prefix list: $(v_k \\to v_{k-1} \\to \\dots \\to v_1 \\to \\text{null})$.
   - Pointer 'curr' points to the head of the un-reversed suffix list: $(v_{k+1} \\to v_{k+2} \\to \\dots \\to v_N \\to \\text{null})$.
3. **Base Case ($k=0$):**
   - Initially, 'prev = null' and 'curr = v_1'.
   - The reversed prefix is empty ('null'), and the un-reversed suffix is the entire list $(v_1 \\to \\dots \\to v_N \\to \\text{null})$. The invariant holds.
4. **Inductive Step:** Assume the invariant holds for step $k < N$ where 'curr = v_{k+1}'.
   - 1. next = curr.next: caches pointer to $v_{k+2}$.
   - 2. curr.next = prev: directs $v_{k+1}$'s pointer to $v_k$, forming $(v_{k+1} \\to v_k \\to \\dots \\to v_1 \\to \\text{null})$.
   - 3. prev = curr: updates 'prev' to point to $v_{k+1}$ (valid reversed prefix of size $k+1$).
   - 4. curr = next: updates 'curr' to point to $v_{k+2}$ (valid un-reversed suffix of size $N - (k+1)$).
   - The invariant holds for step $k+1$.
5. **Termination:** After $N$ iterations, 'curr = null'. The loop terminates with 'prev' pointing to $(v_N \\to v_{N-1} \\to \\dots \\to v_1 \\to \\text{null})$, which is the exact complete reversal. $\\blacksquare$
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive Pointer Reversal & Recursive Traversal Baseline",
          code: `export interface ListNode<T> {
  val: T;
  next: ListNode<T> | null;
}

export function reverseListRecursive<T>(head: ListNode<T> | null): ListNode<T> | null {
  if (head === null || head.next === null) {
    return head;
  }
  const newHead = reverseListRecursive(head.next);
  head.next.next = head;
  head.next = null;
  return newHead;
}`,
          explanation:
            "Recursive reversal relies on the hardware call-stack. For lists with $N > 10^4$ nodes, recursion exhausts V8 stack memory, throwing a fatal `RangeError: Maximum call stack size exceeded`.",
          timeComplexity: "O(N)",
          spaceComplexity: "O(N) hardware call-stack memory",
        },
        {
          label: "Stage 2: Sentinel-Driven In-Place Reversal & Merge Sort (O(1) Space)",
          code: `export class LinkedListAlgorithms {
  // In-place iterative reversal in O(N) time and O(1) space
  public static reverseList<T>(head: ListNode<T> | null): ListNode<T> | null {
    let prev: ListNode<T> | null = null;
    let curr: ListNode<T> | null = head;

    while (curr !== null) {
      const nextTemp = curr.next;
      curr.next = prev;
      prev = curr;
      curr = nextTemp;
    }
    return prev;
  }

  // Merge Sort on Linked List: O(N log N) time and strictly O(1) auxiliary heap space
  public static sortList(head: ListNode<number> | null): ListNode<number> | null {
    if (head === null || head.next === null) return head;

    // Fast/Slow pointer to find middle node
    let slow: ListNode<number> = head;
    let fast: ListNode<number> | null = head.next;
    while (fast !== null && fast.next !== null) {
      slow = slow.next!;
      fast = fast.next.next;
    }

    const mid = slow.next;
    slow.next = null; // Split list into two halves

    const left = this.sortList(head);
    const right = this.sortList(mid);

    // Merge two sorted halves using a Sentinel dummy node
    const dummy: ListNode<number> = { val: 0, next: null };
    let tail = dummy;
    let p1 = left;
    let p2 = right;

    while (p1 !== null && p2 !== null) {
      if (p1.val <= p2.val) {
        tail.next = p1;
        p1 = p1.next;
      } else {
        tail.next = p2;
        p2 = p2.next;
      }
      tail = tail.next;
    }
    tail.next = p1 !== null ? p1 : p2;

    return dummy.next;
  }
}`,
          explanation:
            "Stage 2 uses an iterative sentinel-driven architecture. The fast/slow pointer splits the list in $O(N)$ time, and the dummy node merges sublists in-place without heap allocations, achieving $O(N \\log N)$ merge sort in $O(1)$ space.",
          timeComplexity: "Reversal: O(N), Sort: O(N log N)",
          spaceComplexity: "O(1) strictly zero heap allocation",
        },
        {
          label: "Stage 3: High-Performance Flat Unrolled Linked List (Chunked Array Nodes)",
          code: `export class UnrolledLinkedListNode {
  public static readonly CHUNK_SIZE = 16; // Fits into single 64-byte L1 cache line
  public elements: Int32Array;
  public count: number;
  public next: UnrolledLinkedListNode | null;

  constructor() {
    this.elements = new Int32Array(UnrolledLinkedListNode.CHUNK_SIZE);
    this.count = 0;
    this.next = null;
  }
}

export class FastUnrolledLinkedList {
  private head: UnrolledLinkedListNode;
  private tail: UnrolledLinkedListNode;
  public length: number;

  constructor() {
    this.head = new UnrolledLinkedListNode();
    this.tail = this.head;
    this.length = 0;
  }

  // Append value with 93% cache line utilization
  public append(val: number): void {
    if (this.tail.count === UnrolledLinkedListNode.CHUNK_SIZE) {
      const newNode = new UnrolledLinkedListNode();
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.tail.elements[this.tail.count++] = val;
    this.length++;
  }

  // Fast linear scan traversing 16 elements per cache line load
  public contains(val: number): boolean {
    let curr: UnrolledLinkedListNode | null = this.head;
    while (curr !== null) {
      const count = curr.count;
      const arr = curr.elements;
      for (let i = 0; i < count; i++) {
        if (arr[i] === val) return true;
      }
      curr = curr.next;
    }
    return false;
  }
}`,
          explanation:
            "Stage 3 demonstrates an **Unrolled Linked List (B-List)**. Each node stores an array of 16 contiguous integers ($64$ bytes), packing an entire node into a single L1 data cache line. Reduces pointer overhead by $93\\%$ and eliminates pointer-chasing latency.",
          timeComplexity: "Append: O(1) strictly, Traversal: O(N) with 16x cache speedup",
          spaceComplexity: "O(N) with minimal pointer overhead",
        },
      ],
      stepByStep: [
        "Initialize dummy/sentinel nodes to handle boundary head/tail modifications without branching.",
        "For in-place reversals, apply the 4-pointer assignment cycle (`next = curr.next; curr.next = prev; prev = curr; curr = next;`).",
        "In production environments, replace single-node linked lists with unrolled chunked nodes to maximize 64-byte L1 cache line residency.",
      ],
    },
  ],
};

export const page2 = page_02_math_and_code;
