import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_tree_fundamentals_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: AVL Tree Maximum Height Fibonacci Bound",
      theorem:
        "The height $h$ of an AVL tree containing $N$ nodes satisfies $h < \\frac{\\ln(N + 2)}{\\ln \\phi} - 2 \\approx 1.4404 \\log_2(N + 2)$, where $\\phi = \\frac{1 + \\sqrt{5}}{2} \\approx 1.618033$ is the golden ratio. Thus, AVL search, insertion, and deletion run in strictly $O(\\log N)$ worst-case time.",
      proof: `
**Proof via Minimal Node Fibonacci Recurrence:**
1. Let $N(h)$ denote the minimum number of nodes in a valid AVL tree of height $h$.
2. **Base Cases:**
   - Height $h = 0$: $N(0) = 1$ (single node).
   - Height $h = 1$: $N(1) = 2$ (root with 1 child).
3. **Inductive Recurrence:**
   - An AVL tree of height $h \\ge 2$ achieves minimal node count when one subtree has height $h-1$ and the other has height $h-2$, with both subtrees being minimal AVL trees.
   - Therefore:
     $$N(h) = 1 + N(h - 1) + N(h - 2)$$
4. **Connection to Fibonacci Numbers:**
   - Let $F_k$ be the $k$-th Fibonacci number ($F_1 = 1, F_2 = 1, F_3 = 2, F_4 = 3, F_5 = 5, \\dots$).
   - We prove by induction that $N(h) = F_{h+3} - 1$:
     - Base $h=0$: $N(0) = 1 = F_3 - 1 = 2 - 1 = 1$.
     - Base $h=1$: $N(1) = 2 = F_4 - 1 = 3 - 1 = 2$.
     - Inductive step: $N(h) = 1 + (F_{h+2} - 1) + (F_{h+1} - 1) = (F_{h+2} + F_{h+1}) - 1 = F_{h+3} - 1$.
5. **Asymptotic Lower Bound:**
   - By Binet's formula, $F_k = \\frac{\\phi^k - \\psi^k}{\\sqrt{5}} > \\frac{\\phi^k}{\\sqrt{5}} - 1$.
   - Thus:
     $$N \\ge N(h) = F_{h+3} - 1 > \\frac{\\phi^{h+3}}{\\sqrt{5}} - 2$$
   - Rearranging for height $h$:
     $$\\phi^{h+3} < \\sqrt{5}(N + 2) \\implies h + 3 < \\log_\\phi(\\sqrt{5}(N + 2)) = \\frac{\\ln(\\sqrt{5}(N + 2))}{\\ln \\phi}$$
     $$h < \\frac{\\ln(N + 2)}{\\ln \\phi} + \\frac{\\ln \\sqrt{5}}{\\ln \\phi} - 3 \\approx 1.4404 \\log_2(N + 2) - 0.328$$
6. Therefore, an AVL tree containing $N = 10^6$ nodes has height at most $\\approx 1.44 \\times 20 \\approx 28$, guaranteeing sub-microsecond search operations. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Red-Black Tree Height Invariant Bound",
      theorem: "A Red-Black tree with $N$ internal nodes has height $H \\le 2 \\log_2(N + 1)$.",
      proof: `
**Proof by Structural Induction on Black-Height:**
1. Define the **Black-Height** $bh(x)$ of node $x$ as the number of black nodes on any simple path from $x$ (excluding $x$) down to a descendant leaf.
2. **Lemma:** The subtree rooted at any node $x$ contains at least $2^{bh(x)} - 1$ internal nodes.
   - **Base Case ($height(x) = 0$):** Node $x$ is a leaf (NIL sentinel). $bh(x) = 0$. Number of internal nodes is $0 = 2^0 - 1$. Lemma holds.
   - **Inductive Step:** Consider internal node $x$ with height $> 0$ and two children $\\text{left}(x)$ and $\\text{right}(x)$.
     - If a child is red, its black-height is $bh(x)$.
     - If a child is black, its black-height is $bh(x) - 1$.
     - In both cases, the child's black-height is at least $bh(x) - 1$.
     - By the inductive hypothesis, each child contains at least $2^{bh(x)-1} - 1$ internal nodes.
     - The total internal nodes in $x$'s subtree is:
       $$\\text{size}(x) \\ge 1 + (2^{bh(x)-1} - 1) + (2^{bh(x)-1} - 1) = 2 \\cdot 2^{bh(x)-1} - 1 = 2^{bh(x)} - 1$$
     - The lemma is established for all $x$.
3. **Bounding Height by Black-Height:**
   - By Red-Black Invariant 4, no two red nodes can be consecutive on any simple path from root to leaf.
   - Therefore, at least half of the nodes on any simple path from root to leaf (excluding root) must be black.
   - Thus, the black-height of the root satisfies $bh(\\text{root}) \\ge H/2$.
4. **Combining Bounds:**
   - Let $N$ be the total internal nodes in the tree:
     $$N \\ge 2^{bh(\\text{root})} - 1 \\ge 2^{H/2} - 1$$
   - Adding 1 and taking base-2 logarithm on both sides:
     $$N + 1 \\ge 2^{H/2} \\implies \\log_2(N + 1) \\ge \\frac{H}{2} \\implies H \\le 2 \\log_2(N + 1)$$
5. This proves that Red-Black trees strictly bound height to $O(\\log N)$ under all insertion and deletion sequences. $\\blacksquare$
      `,
    },
  ],
};
