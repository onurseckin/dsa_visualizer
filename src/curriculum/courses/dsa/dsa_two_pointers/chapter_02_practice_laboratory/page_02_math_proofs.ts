import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_two_pointers_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Container With Most Water Elimination Invariant",
      theorem:
        "Let $H = (h_0, h_1, \\dots, h_{n-1})$ be non-negative wall heights. Let $\\text{Area}(i, j) = \\min(h_i, h_j) \\cdot (j - i)$ for $i < j$. The two-pointer strategy that initializes $L = 0, R = n-1$ and advances the pointer at $\\arg\\min(h_L, h_R)$ in each step is guaranteed to discover the global maximum $\\max_{i < j} \\text{Area}(i, j)$ in at most $n - 1$ steps.",
      proof: `
**Proof by Induction on Candidate Set:**
1. Define the candidate state space at step $t$: $S_t = \\{ (i, j) \\mid L_t \\le i < j \\le R_t \\}$.
2. Let $(i^*, j^*)$ be a globally maximal pair maximizing $\\text{Area}(i, j)$.
3. Base case ($t=0$): $L_0 = 0, R_0 = n-1$, so $S_0$ contains all possible pairs. Thus $(i^*, j^*) \\in S_0$.
4. Inductive step: Assume $(i^*, j^*) \\in S_t$.
5. Without loss of generality, assume $h_{L_t} \\le h_{R_t}$. The algorithm records current area $\\text{Area}(L_t, R_t)$ and updates $L_{t+1} = L_t + 1, R_{t+1} = R_t$.
6. The pairs eliminated from $S_t$ are $D = \\{ (L_t, k) \\mid L_t < k < R_t \\}$.
7. For any pair $(L_t, k) \\in D$:
   $$\\text{Area}(L_t, k) = \\min(h_{L_t}, h_k) \\cdot (k - L_t) \\le h_{L_t} \\cdot (k - L_t)$$
8. Because $k < R_t$, $(k - L_t) < (R_t - L_t)$.
9. Since $h_{L_t} \\le h_{R_t}$, $\\min(h_{L_t}, h_{R_t}) = h_{L_t}$, which means:
   $$\\text{Area}(L_t, R_t) = h_{L_t} \\cdot (R_t - L_t) > h_{L_t} \\cdot (k - L_t) \\ge \\text{Area}(L_t, k)$$
10. Therefore, every eliminated pair in $D$ has area strictly less than the evaluated pair $(L_t, R_t)$.
11. Hence, no pair in $D$ can strictly exceed $(L_t, R_t)$, ensuring $(i^*, j^*) \\in S_{t+1} \\cup \\{ (L_t, R_t) \\}$.
12. The gap $R_t - L_t$ strictly decreases by 1 per step, guaranteeing termination in $n-1$ steps with the global optimum visited. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Floyd's Cycle Detection Algorithm Algebraic Invariant",
      theorem:
        "For an iterated function sequence $x_{i+1} = f(x_i)$ with tail length $\\mu$ and cycle length $\\lambda$, the slow pointer $s_i = x_i$ and fast pointer $f_i = x_{2i}$ meet after $k = \\mu + (\\lambda - (\\mu \\pmod \\lambda))$ steps. Phase 2 (advancing one pointer from $x_0$ and one from $x_k$ at speed 1) reaches the exact cycle start $x_\\mu$ in $\\mu$ steps.",
      proof: `
**Proof via Modular Arithmetic:**
1. Sequence structure: $x_0, \\dots, x_{\\mu-1}$ are distinct tail nodes; $x_\\mu, \\dots, x_{\\mu+\\lambda-1}$ form a periodic cycle where $x_{\\mu + j} = x_{\\mu + (j \\pmod \\lambda)}$.
2. For any step $i \\ge \\mu$, both slow and fast pointers reside inside the cycle:
   $$s_i = x_{\\mu + ((i - \\mu) \\pmod \\lambda)}$$
   $$f_i = x_{\\mu + ((2i - \\mu) \\pmod \\lambda)}$$
3. A collision occurs when $(2i - \\mu) \\equiv (i - \\mu) \\pmod \\lambda \\iff i \\equiv 0 \\pmod \\lambda$.
4. The smallest integer $i \\ge \\mu$ satisfying $i \\equiv 0 \\pmod \\lambda$ is:
   $$k = \\mu + (\\lambda - (\\mu \\pmod \\lambda)) \\le \\mu + \\lambda$$
5. At this collision step $k$, $k$ is an exact multiple of the cycle period: $k = m \\lambda$.
6. In Phase 2, reset pointer $P_1 = x_0$ while keeping $P_2 = x_k = x_{m\\lambda}$.
7. Step both pointers at speed 1. After $t = \\mu$ steps:
   - $P_1$ reaches $x_\\mu$ (the exact cycle entry node).
   - $P_2$ reaches $x_{k + \\mu} = x_{m\\lambda + \\mu} = x_\\mu$.
8. Thus $P_1$ and $P_2$ meet at the first node of the cycle in exactly $\\mu$ steps, executing in $O(\\mu + \\lambda)$ total time and $O(1)$ memory. $\\blacksquare$
      `,
    },
  ],
};
