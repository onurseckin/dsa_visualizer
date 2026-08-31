import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_bit_manipulation_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Hardware Execution Units, POPCNT & Word-Level Parallelism",
      content:
        "Modern CPUs (x86-64 Haswell+, ARM Neoverse) feature dedicated hardware execution units for bit-level arithmetic:\n\n1. **Hardware POPCNT & LZCNT Execution Units:** Instructions like `POPCNT` (population count) and `LZCNT` (leading zero count) execute in 1 CPU cycle on hardware silicon. In V8/Node.js, `Math.clz32(x)` is an intrinsic that compiles directly to the hardware instruction `lzcnt` / `clz`, executing in $< 0.5$ nanoseconds.\n2. **64-Bit Word-Level Parallelism:** In graph connectivity (e.g. Warshall's transitive closure) or string pattern matching (Bitap algorithm), operating on 64-bit words processes 64 boolean relations per instruction, delivering an instant **$64\\times$ throughput improvement** over scalar boolean arrays.\n3. **De Bruijn Bitscan Forward:** On embedded microcontrollers lacking hardware `tzcnt`, the lowest set bit index is extracted in 3 cycles using multiplication by De Bruijn constant `0x077CB531U` followed by a 5-bit lookup table.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Precedence Hazards & 32-Bit Signed Casts",
      content:
        "1. **The JavaScript 32-Bit Signed Integer Shift Hazard:** In JavaScript, all bitwise operations (`<<`, `>>`, `|`, `&`, `^`) coerce numbers into **Signed 32-Bit Two's Complement Integers**. Evaluating `1 << 31` produces `-2147483648` (negative number). To work with unsigned 32-bit values, always apply the unsigned right shift operator: `(1 << 31) >>> 0 = 2147483648`.\n2. **Operator Precedence Catastrophe:** In C/C++, Java, and JavaScript, arithmetic operators (`+`, `-`) have **higher precedence** than bitwise operators (`<<`, `>>`, `&`, `^`, `|`). Writing `1 << 2 + 3` evaluates as `1 << (2 + 3) = 32`, NOT `(1 << 2) + 3 = 7`. Always wrap bitwise sub-expressions in explicit parentheses!\n3. **Arithmetic vs Logical Shift Inversion (`>>` vs `>>>`):** On negative numbers, arithmetic right shift `>>` sign-extends with leading 1s (`-4 >> 1 = -2`), while logical right shift `>>>` zero-extends with leading 0s (`-4 >>> 1 = 2147483646`).\n4. **Power-of-Two Modulo Masking:** The identity `x % (2^k) === x & ((1 << k) - 1)` holds *only* for non-negative integers $x \\ge 0$. For negative integers in two's complement, `-5 % 4 = -1`, while `-5 & 3 = 3`.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Algebraic Frontiers: Fast Walsh-Hadamard Transform (FWHT)",
      content:
        "Advanced bitwise algebra enables convolution over boolean lattices:\n- **Fast Walsh-Hadamard Transform (FWHT):** Computes XOR, AND, and OR convolutions $C[k] = \\sum_{i \\oplus j = k} A[i] B[j]$ in $O(N \\log N)$ time (where $N = 2^k$) using butterfly divide-and-conquer steps analogous to FFT, solving bitwise subset convolution problems in competitive programming and cryptography.",
    },
    {
      type: "prose",
      title: "Bitwise Operation & Word-Level Primitive Selection Matrix",
      content: `
| Bitwise Idiom | Expression | Hardware Operation | Asymptotic Cost | Primary Application |
| :--- | :--- | :--- | :--- | :--- |
| **Isolate Lowest Set Bit** | \`x & (-x)\` | \`BLSI\` / Two's complement negation | 1 cycle | Fenwick tree updates, sparse bit traversal |
| **Clear Lowest Set Bit** | \`x & (x - 1)\` | \`BLSR\` / Borrow propagation | 1 cycle | Brian Kernighan popcount, subset generation |
| **Clear Trailing 1-bits** | \`x & (x + 1)\` | Arithmetic carry | 1 cycle | Range block validation |
| **Count Leading Zeros** | \`Math.clz32(x)\` | \`LZCNT\` / \`CLZ\` instruction | 1 cycle | Floor $\\log_2(x)$, fast division approximation |
| **Submask Enumeration** | \`s = (s - 1) & mask\` | Bitwise subtract & mask | $O(2^k)$ steps | Subset DP transitions, partition lattices |
| **Word-Parallel Bitset** | \`words[i] &= other[i]\` | 64-bit SIMD / ALU bitwise | $O(N / 64)$ | Graph reachability, bloom filters |
      `,
    },
  ],
};
