import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_arrays_and_hashing_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Dynamic Array Geometric Expansion Amortization",
      theorem:
        "For a dynamic array expanding with geometric ratio $\\alpha = 2$ and shrinking with ratio $\\alpha = 1/2$ at $1/4$ occupancy, any sequence of $M$ append and pop operations on an initially empty array executes in total time $O(M)$, with each operation having $O(1)$ amortized cost.",
      proof: `
**Proof via Potential Method:**
1. Define the potential function $\\Phi$:
   $$\\Phi = \\begin{cases} 2 \\cdot \\text{size} - \\text{capacity} & \\text{if } \\text{size} \\ge \\frac{1}{2} \\text{capacity} \\\\ \\frac{1}{2} \\text{capacity} - \\text{size} & \\text{if } \\text{size} < \\frac{1}{2} \\text{capacity} \\end{cases}$$
2. We verify that $\\Phi \\ge 0$ at all times:
   - When $\\text{size} = \\text{capacity}$, $\\Phi = \\text{capacity} > 0$.
   - When $\\text{size} = \\frac{1}{2} \\text{capacity}$, $\\Phi = 0$.
   - When $\\text{size} = \\frac{1}{4} \\text{capacity}$, $\\Phi = \\frac{1}{4} \\text{capacity} > 0$.
   - At initialization, $\\text{size} = 0, \\text{capacity} = 0 \\implies \\Phi_0 = 0$.
3. **Append Operation:**
   - **No resize:** Actual cost $c_i = 1$. $\\Delta \\Phi = 2$. Amortized cost $\\hat{c}_i = 1 + 2 = 3 = O(1)$.
   - **Doubling resize (size = cap):** Actual cost $c_i = \\text{size} + 1$. New capacity $= 2 \\cdot \\text{size}$. New potential $\\Phi = 2(\\text{size} + 1) - 2 \\text{size} = 2$.
   - $\\Delta \\Phi = 2 - \\text{size}$.
   - Amortized cost $\\hat{c}_i = (\\text{size} + 1) + (2 - \\text{size}) = 3 = O(1)$.
4. **Pop Operation:**
   - **No resize:** Actual cost $c_i = 1$. $\\Delta \\Phi = 1$. Amortized cost $\\hat{c}_i = 1 + 1 = 2 = O(1)$.
   - **Halving resize (size = cap / 4):** Actual cost $c_i = \\text{size} + 1$. New capacity $= \\text{capacity} / 2 = 2 \\cdot \\text{size}$. New potential $\\Phi = 2 \\cdot \\text{size} - 2 \\cdot \\text{size} = 0$.
   - $\\Delta \\Phi = 0 - \\text{size} = -\\text{size}$.
   - Amortized cost $\\hat{c}_i = (\\text{size} + 1) + (-\\text{size}) = 1 = O(1)$.
5. Since all amortized costs $\\hat{c}_i \\le 3$, the total actual cost $\\sum c_i \\le 3M = O(M)$. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: FKS Perfect Hashing Polynomial Space Bound",
      theorem:
        "Let $N$ keys be distributed into $N$ primary buckets using a 2-universal hash function $h_1$, where bucket $i$ receives $n_i$ keys. If each secondary bucket $i$ allocates a hash table of size $m_i = n_i^2$ with universal hash function $h_{2, i}$, the total memory space satisfies $\\mathbb{E}[\\sum_{i=1}^N m_i] < 2N$, achieving $O(N)$ total space with zero collisions.",
      proof: `
**Proof via Sum of Squared Bucket Sizes:**
1. The total secondary space is $M_{\\text{total}} = \\sum_{i=1}^N n_i^2 = \\sum_{i=1}^N \\left( n_i + 2 \\binom{n_i}{2} \\right) = N + 2 \\sum_{i=1}^N \\binom{n_i}{2}$.
2. Notice that $\\sum_{i=1}^N \\binom{n_i}{2}$ equals the total number of colliding key pairs $(x, y)$ mapped to the same primary bucket:
   $$\\sum_{i=1}^N \\binom{n_i}{2} = \\sum_{1 \\le j < k \\le N} \\mathbf{1}_{\\{h_1(x_j) = h_1(x_k)\\}}$$
3. Taking mathematical expectation on both sides:
   $$\\mathbb{E}\\left[ \\sum_{i=1}^N \\binom{n_i}{2} \\right] = \\sum_{1 \\le j < k \\le N} \\Pr[h_1(x_j) = h_1(x_k)]$$
4. Because $h_1$ is chosen from a 2-universal hash family with $N$ primary buckets, $\\Pr[h_1(x_j) = h_1(x_k)] \\le \\frac{1}{N}$.
5. Therefore:
   $$\\mathbb{E}\\left[ \\sum_{i=1}^N \\binom{n_i}{2} \\right] \\le \\binom{N}{2} \\cdot \\frac{1}{N} = \\frac{N(N - 1)}{2N} = \\frac{N - 1}{2}$$
6. Substituting this into the total secondary space expectation:
   $$\\mathbb{E}[M_{\\text{total}}] = N + 2 \\cdot \\frac{N - 1}{2} = 2N - 1 < 2N$$
7. In each secondary table of size $n_i^2$, the expected number of collisions is $\\binom{n_i}{2} \\frac{1}{n_i^2} < 1/2$.
8. By Markov's Inequality, a collision-free secondary hash function is found in $\\le 2$ random trials, guaranteeing $O(1)$ lookup time in strictly $O(N)$ total memory. $\\blacksquare$
      `,
    },
  ],
};
