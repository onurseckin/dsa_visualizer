import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_bit_manipulation_c1_p1",
  pageNumber: 1,
  title: "Two's Complement Algebra, Bitwise Invariants & Submask Lattices",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Word-Level Parallelism Imperative",
      content:
        "High-level boolean arrays (`boolean[]` / `bool*`) allocate 1 to 8 bytes per individual truth value, wasting over $87.5\\%$ of memory and forcing scalar looping. Modern CPUs operate natively on 64-bit hardware registers (`RAX`, `RBX`). Bit manipulation maps $64$ independent boolean states into a single 64-bit integer, executing set union (`|`), intersection (`&`), symmetric difference (`^`), and negation (`~`) in a single 1-cycle ALU instruction—delivering an instant $64\\times$ throughput speedup via hardware word-level parallelism.",
    },
    {
      type: "prose",
      title: "Taxonomy of Bitwise Operators & Mathematical Invariants",
      content:
        "Bitwise algorithms operate on binary field vector spaces $\\mathbb{F}_2^W$:\n\n1. **Fundamental Bitwise Primitives:**\n   - **Set Intersection (AND `&`):** $A \\cap B$. Tests if bit $k$ is active: `(x & (1 << k)) !== 0`.\n   - **Set Union (OR `|`):** $A \\cup B$. Sets bit $k$: `x |= (1 << k)`.\n   - **Symmetric Difference (XOR `^`):** $A \\triangle B = (A \\setminus B) \\cup (B \\setminus A)$. Toggles bit $k$: `x ^= (1 << k)`. Satisfies $x \\oplus x = 0$ and $x \\oplus 0 = x$, forming the basis for single-number extraction and cryptography.\n   - **Set Complement (NOT `~`):** $\\overline{A}$. Inverts all bits ($~x = -x - 1$ in two's complement).\n\n2. **Lowest Set Bit & Isolations (Two's Complement Arithmetic):**\n   - In Two's Complement notation, $-x = \\sim x + 1$.\n   - **Isolate Lowest Set Bit (LSB):** `x & (-x)` isolates the single lowest set bit (e.g. `0b10100 & -0b10100 = 0b00100`).\n   - **Clear Lowest Set Bit (Brian Kernighan):** `x & (x - 1)` clears strictly the single lowest set bit in 1 instruction.\n\n3. **Submask Enumeration Over Power Sets:**\n   - Given a bitmask representing subset $M$, enumerating all $2^{|M|}$ submasks strictly in descending order without visiting non-subsets:\n     $$\\text{for } (s = M; s > 0; s = (s - 1) \\ \\& \\ M)$$\n   - Total operations across all $2^N$ masks is strictly $\\sum_{k=0}^N \\binom{N}{k} 2^k = 3^N$, asymptotically faster than naive $O(4^N)$.\n\n4. **Hardware Intrinsics & De Bruijn Bitscans:**\n   - Single-cycle hardware instructions: `POPCNT` (population count), `LZCNT` / `Math.clz32` (count leading zeros), `TZCNT` (count trailing zeros).",
    },
    {
      type: "mental_model",
      title: "Brian Kernighan & Submask Enumeration Mechanics",
      visualIntuition: `
=== BRIAN KERNIGHAN LOWEST SET BIT CLEAR (x & (x - 1)) ===
Let x = 12 (0b1100)

Step 1: x - 1 = 11 (0b1011)
  x     =  1  1  0  0
  x - 1 =  1  0  1  1
  x & (x-1) = 1  0  0  0  (Lowest set bit cleared!) -> x = 8

Step 2: x - 1 = 7 (0b0111)
  x     =  1  0  0  0
  x - 1 =  0  1  1  1
  x & (x-1) = 0  0  0  0  (Terminated in 2 steps = popcount(12)!)

=== SUBMASK ENUMERATION LATTICE (s = (s - 1) & mask) ===
Let mask = 0b101 (Set contains elements {0, 2})

Iteration 1: s = 0b101 (5) -> Subsets: {0, 2}
  s - 1 = 0b100; s = 0b100 & 0b101 = 0b101 & 0b100 = 0b100 (4)
Iteration 2: s = 0b100 (4) -> Subsets: {2}
  s - 1 = 0b011; s = 0b011 & 0b101 = 0b001 (1)
Iteration 3: s = 0b001 (1) -> Subsets: {0}
  s - 1 = 0b000; s = 0b000 & 0b101 = 0b000 (0)
Iteration 4: s = 0b000 (0) -> Empty set {}

Visits strictly all 4 submasks in O(1) transitions!
      `,
      invariant:
        "Bitwise Invariants:\n1. Lowest Bit Clearing: $(x - 1)$ flips all trailing zeros and the lowest set bit. Computing $x \\ \\& \\ (x - 1)$ strictly zeros the lowest set bit while preserving all higher bits.\n2. Submask Invariant: For any submask $s \\subseteq M$, $(s - 1) \\ \\& \\ M$ produces the exact largest valid submask strictly smaller than $s$.",
      stateTransitions:
        "Popcount: `while (x > 0) { x &= (x - 1); count++; }`\nSubmask Loop: `for (let s = mask; s > 0; s = (s - 1) & mask) { process(s); }`",
      naiveBottleneck:
        "Checking each bit position with linear loops takes $\\Theta(32)$ or $\\Theta(64)$ iterations regardless of how few bits are set.",
      optimalInsight:
        "Brian Kernighan runs in strictly $O(k)$ steps where $k = \\text{popcount}(x)$, while submask bitwise subtraction skips all non-subset combinations in $O(1)$ transitions.",
    },
  ],
};
