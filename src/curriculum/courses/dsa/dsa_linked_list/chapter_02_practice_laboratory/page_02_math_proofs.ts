import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "dsa_linked_list_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
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
        "For a singly linked list of $N$ nodes, the 4-pointer assignment permutation `next = curr.next; curr.next = prev; prev = curr; curr = next;` terminates in $N$ iterations with `prev` pointing to the exact reverse of the initial list, preserving all $N$ original nodes with zero memory allocation.",
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
   - 1. 'next = curr.next': caches pointer to $v_{k+2}$.
   - 2. 'curr.next = prev': directs $v_{k+1}$'s pointer to $v_k$, forming $(v_{k+1} \\to v_k \\to \\dots \\to v_1 \\to \\text{null})$.
   - 3. 'prev = curr': updates 'prev' to point to $v_{k+1}$ (valid reversed prefix of size $k+1$).
   - 4. 'curr = next': updates 'curr' to point to $v_{k+2}$ (valid un-reversed suffix of size $N - (k+1)$).
   - The invariant holds for step $k+1$.
5. **Termination:** After $N$ iterations, 'curr = null'. The loop terminates with 'prev' pointing to $(v_N \\to v_{N-1} \\to \\dots \\to v_1 \\to \\text{null})$, which is the exact complete reversal. $\\blacksquare$
      `,
    },
  ],
};

export const page2 = page_02_math_proofs;
