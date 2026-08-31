import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_bit_manipulation_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Brian Kernighan's Algorithm Exact Termination in Popcount Steps",
      theorem:
        "For any unsigned integer $n \\in \\mathbb{N}$, the operation $n \\leftarrow n \\ \\& \\ (n - 1)$ strictly eliminates the lowest set bit (least significant 1-bit) of $n$ while leaving all higher-order bits unchanged. Consequently, the loop terminates in exactly $\\text{popcount}(n)$ iterations.",
      proof: `
**Proof via Binary Representation Decomposition:**
1. Any non-zero integer $n > 0$ can be uniquely decomposed in binary as:
   $$n = p \\cdot 2^{k+1} + 2^k + 0 = (p \\ 1 \\ \\underbrace{0 \\ 0 \\ \\dots \\ 0}_{k \\text{ zeros}})_2$$
   where $k \\ge 0$ is the index of the lowest set bit, $2^k$ is the least significant 1-bit, and $p \\ge 0$ represents the prefix of higher-order bits.
2. Subtracting 1 from $n$ borrows across all $k$ trailing zeros:
   $$n - 1 = p \\cdot 2^{k+1} + 0 + \\sum_{i=0}^{k-1} 2^i = (p \\ 0 \\ \\underbrace{1 \\ 1 \\ \\dots \\ 1}_{k \\text{ ones}})_2$$
3. Taking the bitwise AND of $n$ and $n - 1$:
   - For all bit positions $> k$: the prefix $p$ is identical in both operands, so $p \\ \\& \\ p = p$.
   - At bit position $k$: $1 \\ \\& \\ 0 = 0$.
   - For all bit positions $< k$: $0 \\ \\& \\ 1 = 0$.
4. Combining these bit ranges:
   $$n \\ \\& \\ (n - 1) = (p \\ 0 \\ \\underbrace{0 \\ 0 \\ \\dots \\ 0}_{k \\text{ zeros}})_2 = p \\cdot 2^{k+1}$$
5. The resulting integer has strictly 1 fewer set bit than $n$, and the cleared bit is precisely the lowest set bit $2^k$.
6. Since each iteration reduces the number of 1-bits by exactly 1 and halts when $n = 0$, the algorithm terminates in exactly $\\text{popcount}(n)$ steps. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Submask Enumeration Complexity Bound (3^N Theorem)",
      theorem:
        "The nested submask loop iterating over all submasks for all masks of length $N$: 'for (mask = 0; mask < (1 << N); mask++) for (s = mask; s > 0; s = (s - 1) & mask)' executes in strictly $\\Theta(3^N)$ operations.",
      proof: `
**Proof via the Binomial Theorem:**
1. Consider a mask of length $N$ with exactly $k$ set bits (where $\\text{popcount}(\\text{mask}) = k$).
2. The number of non-empty submasks $s \\subseteq \\text{mask}$ is $2^k$.
3. The number of masks of length $N$ having exactly $k$ set bits is given by the binomial coefficient $\\binom{N}{k}$.
4. The total number of inner loop iterations across all $2^N$ masks is:
   $$T(N) = \\sum_{k=0}^N \\binom{N}{k} 2^k$$
5. By the **Binomial Theorem**, for any real numbers $x$ and $y$:
   $$(x + y)^N = \\sum_{k=0}^N \\binom{N}{k} x^k y^{N-k}$$
6. Setting $x = 2$ and $y = 1$:
   $$\\sum_{k=0}^N \\binom{N}{k} 2^k 1^{N-k} = (2 + 1)^N = 3^N$$
7. Therefore, the total number of operations is strictly $3^N$.
8. **Combinatorial Interpretation:** For each of the $N$ bit positions, each bit in a (mask, submask) pair has exactly 3 possible states:
   1. Bit is 0 in mask and 0 in submask.
   2. Bit is 1 in mask and 0 in submask.
   3. Bit is 1 in mask and 1 in submask.
   (The state where bit is 0 in mask and 1 in submask is impossible).
   With 3 independent choices across $N$ positions, the state space size is precisely $3^N$. $\\blacksquare$
      `,
    },
  ],
};
