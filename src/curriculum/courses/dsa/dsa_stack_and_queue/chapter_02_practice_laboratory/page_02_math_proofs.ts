import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "dsa_stack_and_queue_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Largest Rectangle in Histogram Monotonic Stack Invariant",
      theorem:
        "For an array of non-negative bar heights $H = (h_0, h_1, \\dots, h_{n-1})$, the Monotonic Increasing Stack algorithm computes the maximal rectangular area $\\max_{0 \\le i < n} h_i \\cdot (R_i - L_i - 1)$ (where $L_i = \\max \\{ j < i \\mid h_j < h_i \\}$ and $R_i = \\min \\{ j > i \\mid h_j < h_i \\}$) in strictly at most $2n$ stack operations, running in $\\Theta(n)$ worst-case time.",
      proof: `
**Proof via Monotonic Stack Invariants & Potential Method:**
1. Maintain a stack $S$ storing bar indices. Define the stack invariant:
   $$h_{S[0]} < h_{S[1]} < \\dots < h_{S[k]} \\quad \\text{for } k = |S| - 1$$
2. **Right Boundary Resolution:**
   - When scanning index $j$, if $h_j < h_{S[k]}$, bar $j$ is strictly shorter than the top bar $i = S[k]$.
   - Because all intermediate bars between $i$ and $j$ were greater than or equal to $h_i$ (and were already processed and popped), $j$ is the **first strictly smaller bar to the right of $i$**. Thus $R_i = j$.
3. **Left Boundary Resolution:**
   - Immediately before $i$ is popped, the bar directly below $i$ on the stack is $S[k-1]$.
   - By the monotonic stack invariant, $h_{S[k-1]} < h_i$.
   - Because no other un-popped elements exist between $S[k-1]$ and $i$, $S[k-1]$ is the **first strictly smaller bar to the left of $i$**. Thus $L_i = S[k-1]$ (or $L_i = -1$ if the stack becomes empty).
4. **Width & Maximal Sub-Rectangle:**
   - The contiguous interval where all bars have height $\\ge h_i$ is precisely $[L_i + 1, R_i - 1]$, with width $(R_i - L_i - 1)$.
   - The area of the maximal rectangle with height $h_i$ is $h_i \\cdot (R_i - L_i - 1)$.
5. **Complexity Analysis:**
   - Each index $i \\in \\{0, \\dots, n-1\\}$ is pushed onto the stack exactly once.
   - Each index is popped from the stack at most once (either during the scan or during the final flush at index $n$).
   - Total stack operations $\\le 2n = O(n)$, proving guaranteed linear execution time. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Potential Method Amortization of the Two-Stack Queue",
      theorem:
        "A FIFO Queue implemented using two LIFO Stacks ($S_{\\text{in}}$ for enqueue and $S_{\\text{out}}$ for dequeue) executes any arbitrary sequence of $M$ enqueue and dequeue operations in total time $O(M)$, with each operation having strictly $O(1)$ amortized time complexity.",
      proof: `
**Proof via Potential Method:**
1. Let $|S_{\\text{in}}|$ and $|S_{\\text{out}}|$ denote the number of elements stored in the input and output stacks, respectively.
2. Define the potential function:
   $$\\Phi = 2 \\cdot |S_{\\text{in}}|$$
3. Since $|S_{\\text{in}}| \\ge 0$, $\\Phi \\ge 0$ at all times, with $\\Phi_0 = 0$ for an initially empty queue.
4. **Enqueue Operation (push(x)):**
   - Actual cost: $c_{\\text{push}} = 1$ (pushing $x$ onto $S_{\\text{in}}$).
   - Change in potential: $\\Delta \\Phi = 2(|S_{\\text{in}}| + 1) - 2|S_{\\text{in}}| = 2$.
   - Amortized cost:
     $$\\hat{c}_{\\text{push}} = c_{\\text{push}} + \\Delta \\Phi = 1 + 2 = 3 = O(1)$$
5. **Dequeue Operation (pop()):**
   - **Case 1 ($S_{\\text{out}}$ is non-empty):**
     - Actual cost: $c_{\\text{pop}} = 1$ (popping top of $S_{\\text{out}}$).
     - Change in potential: $\\Delta \\Phi = 0$ (since $|S_{\\text{in}}|$ is unchanged).
     - Amortized cost: $\\hat{c}_{\\text{pop}} = 1 + 0 = 1 = O(1)$.
   - **Case 2 ($S_{\\text{out}}$ is empty with $|S_{\\text{in}}| = k$):**
     - Actual cost: $c_{\\text{pop}} = k + k + 1 = 2k + 1$ ($k$ pops from $S_{\\text{in}}$, $k$ pushes to $S_{\\text{out}}$, and $1$ pop from $S_{\\text{out}}$).
     - New state: $|S_{\\text{in}}| = 0$, so $\\Phi_{\\text{after}} = 0$.
     - Change in potential: $\\Delta \\Phi = 0 - 2k = -2k$.
     - Amortized cost:
       $$\\hat{c}_{\\text{pop}} = c_{\\text{pop}} + \\Delta \\Phi = (2k + 1) + (-2k) = 1 = O(1)$$
6. In all cases, the amortized cost of every operation is bounded by $\\le 3$.
7. Summing across $M$ operations: $\\sum_{i=1}^M c_i = \\sum_{i=1}^M \\hat{c}_i - \\Phi_M + \\Phi_0 \\le 3M - 0 = 3M = O(M)$. $\\blacksquare$
      `,
    },
  ],
};

export const page2 = page_02_math_proofs;
