import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_heap_and_priority_queue_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Floyd's Linear Time Build-Heap Complexity Proof (Floyd 1964)",
      theorem:
        "Floyd's bottom-up algorithm converts an arbitrary unsorted array of $N$ elements into a valid Binary Heap via downward sift-down operations in strictly $O(N)$ linear time.",
      proof: `
**Proof via Arithmetic-Geometric Series Summation:**
1. In a complete binary tree of $N$ nodes, the height of the tree is $H = \\lfloor \\log_2 N \\rfloor$.
2. The number of nodes at height $h$ (where leaves have height 0) is at most:
   $$\\text{Count}(h) = \\left\\lceil \\frac{N}{2^{h+1}} \\right\\rceil$$
3. Sifting down a node at height $h$ traverses at most $h$ edges (each step taking $O(1)$ comparisons).
4. The total work performed across all internal nodes from height 1 to $H$ is:
   $$T(N) = \\sum_{h=1}^H \\left\\lceil \\frac{N}{2^{h+1}} \\right\\rceil O(h) \\le c N \\sum_{h=1}^\\infty \\frac{h}{2^{h+1}} = \\frac{c N}{2} \\sum_{h=1}^\\infty \\frac{h}{2^h}$$
5. We evaluate the infinite arithmetic-geometric series $S = \\sum_{h=1}^\\infty \\frac{h}{2^h}$:
   $$S = \\frac{1}{2} + \\frac{2}{4} + \\frac{3}{8} + \\frac{4}{16} + \\dots$$
   $$\\frac{1}{2} S = \\frac{1}{4} + \\frac{2}{8} + \\frac{3}{16} + \\dots$$
6. Subtracting the second equation from the first:
   $$S - \\frac{1}{2} S = \\frac{1}{2} S = \\frac{1}{2} + \\left( \\frac{1}{4} + \\frac{1}{8} + \\frac{1}{16} + \\dots \\right)$$
7. The infinite geometric series sum is $\\sum_{k=2}^\\infty \\frac{1}{2^k} = \\frac{1/4}{1 - 1/2} = \\frac{1}{2}$.
8. Therefore:
   $$\\frac{1}{2} S = \\frac{1}{2} + \\frac{1}{2} = 1 \\implies S = 2$$
9. Substituting $S = 2$ back into the time complexity bound:
   $$T(N) \\le \\frac{c N}{2} \\cdot 2 = c N = O(N)$$
Thus, building a heap bottom-up runs in guaranteed $O(N)$ linear time, strictly outperforming naive top-down insertion ($O(N \\log N)$). $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Fibonacci Heap Amortized O(1) Decrease-Key via Potential Method",
      theorem:
        "In a Fibonacci Heap containing $N$ items, the amortized time complexity of the `decreaseKey` operation is strictly $O(1)$.",
      proof: `
**Proof via Potential Method (Fredman & Tarjan 1987):**
1. Let $t(H)$ denote the number of trees in the root list of Fibonacci heap $H$, and $m(H)$ denote the number of marked nodes (nodes that have lost a child since being made children of another node).
2. Define the potential function:
   $$\\Phi(H) = t(H) + 2 m(H)$$
3. **Decrease-Key Analysis:**
   - Suppose decreasing the key of node $x$ violates the min-heap property with its parent $p(x)$.
   - The algorithm cuts $x$ from $p(x)$, unmarks $x$, and places $x$ into the root list.
   - If $p(x)$ was unmarked, we mark $p(x)$ and terminate the cut cascade.
   - If $p(x)$ was already marked, a **Cascading Cut** is triggered: $p(x)$ is cut, unmarked, and added to the root list, recursively propagating up the ancestor chain.
4. Let $c$ be the number of cascading cuts performed ($c \\ge 1$).
   - **Actual Cost:** $t_{\\text{actual}} = c + 1$ (cutting $c$ nodes and doing $O(1)$ pointer splices).
   - **Change in Root Trees:** The root list gains $c$ new trees: $t(H') = t(H) + c$.
   - **Change in Marked Nodes:** $c - 1$ previously marked nodes are unmarked (as they become roots), and at most 1 newly unmarked parent is marked:
     $$m(H') \\le m(H) - (c - 1) + 1 = m(H) - c + 2$$
   - **Change in Potential:**
     $$\\Delta \\Phi = \\Phi(H') - \\Phi(H) = [t(H') - t(H)] + 2[m(H') - m(H)] \\le c + 2(-c + 2) = 4 - c$$
5. The amortized cost $\\hat{a}$ is:
   $$\\hat{a} = t_{\\text{actual}} + \\Delta \\Phi \\le (c + 1) + (4 - c) = 5 = O(1)$$
6. The $c$ cascading cuts cancel out entirely in the potential difference, proving that decreaseKey runs in strictly $O(1)$ amortized time. $\blacksquare$
      `,
    },
  ],
};
