import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_bit_manipulation_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_bit_manipulation",
      title: "Bit Manipulation Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Single Number II (Modulo-3 Counter)",
          problemId: "single-number-ii",
          difficulty: "Medium",
          description:
            "Given an integer array nums where every element appears three times except for one which appears exactly once, find that single element in $O(N)$ time and $O(1)$ space using a 2-bit modulo-3 state machine.",
          rationale: "Evaluates digital logic synthesis and bitwise state machine transitions.",
        },
        {
          title: "Counting Bits (O(N) Popcount DP)",
          problemId: "counting-bits-dp",
          difficulty: "Easy",
          description:
            "Given an integer $n$, return an array ans of length $n + 1$ such that ans[i] is the number of 1's in the binary representation of $i$. Solve in strictly $O(N)$ time in a single pass using dynamic programming.",
          rationale: "Tests bitwise recurrence relations: `dp[i] = dp[i >> 1] + (i & 1)`.",
        },
        {
          title: "Bitwise AND of Numbers Range",
          problemId: "bitwise-and-range",
          difficulty: "Medium",
          description:
            "Given two integers left and right, return the bitwise AND of all numbers in this range, inclusive, in $O(\\log N)$ time by isolating the common binary prefix.",
          rationale: "Tests lowest bit zeroing until common prefix alignment.",
        },
        {
          title: "Reverse Bits (32-Bit SWAR)",
          problemId: "reverse-bits-swar",
          difficulty: "Easy",
          description:
            "Reverse bits of a given 32-bit unsigned integer in $O(1)$ time using parallel bitmask divide-and-conquer swaps (SWAR).",
          rationale:
            "Demonstrates parallel bit reversal using masks `0x55555555`, `0x33333333`, `0x0F0F0F0F`.",
        },
      ],
      partB_mathProofs: [
        {
          title: "XOR Bitwise Group Properties in Cryptography",
          statement:
            "Prove that the vector space $(\\mathbb{F}_2^W, \\oplus)$ forms an abelian group where every non-identity element has order 2, and that the One-Time Pad cipher $c = m \\oplus k$ provides information-theoretic perfect secrecy when key $k$ is uniformly distributed.",
          proofOutline:
            "XOR is associative, commutative, has identity $0$, and every element is its own inverse ($x \\oplus x = 0$). For ciphertext $C = M \\oplus K$ with $K \\sim U(\\{0, 1\\}^W)$, $\\Pr[C = c \\mid M = m] = \\Pr[K = c \\oplus m] = 2^{-W}$. Since this probability is independent of message $m$, the mutual information $I(M; C) = 0$, proving Shannon's Perfect Secrecy Theorem.",
          engineeringContext:
            "Foundational in hardware stream ciphers, RAID-5 parity checks, and Fast Walsh-Hadamard Transforms.",
        },
        {
          title: "De Bruijn Bitscan Mapping Bijection Proof",
          statement:
            "Prove that multiplying an isolated lowest set bit $x = 2^k$ ($0 \\le k < 32$) by the 32-bit De Bruijn sequence constant $C = \\text{0x077CB531U}$ and extracting the top 5 bits produces a distinct integer in $[0, 31]$ for each $k$, yielding a perfect $O(1)$ bitscan.",
          proofOutline:
            "A cyclic binary De Bruijn sequence of order 5 contains every 5-bit binary string as a contiguous sub-word exactly once. Multiplying $2^k$ shifts the sequence left by $k$ bits, placing a unique 5-bit window into the top 5 bits. Shifting right by 27 bits isolates this unique 5-bit integer, indexing a 32-entry array that maps back to $k$ in 1 multiplication and 1 shift.",
          engineeringContext:
            "Used in chess engines and embedded systems without hardware `tzcnt` instructions.",
        },
        {
          title: "Walsh-Hadamard Matrix Orthogonality Theorem",
          statement:
            "Prove that the Sylvester-Hadamard matrix $H_{2^k}$ satisfies $H_{2^k} H_{2^k}^T = 2^k I_{2^k}$, and that the Fast Walsh-Hadamard Transform computes XOR convolutions in $O(N \\log N)$ time.",
          proofOutline:
            "By induction on $k$. $H_1 = (1), H_2 = \\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}$. For $H_{2^k} = \\begin{pmatrix} H_{2^{k-1}} & H_{2^{k-1}} \\\\ H_{2^{k-1}} & -H_{2^{k-1}} \\end{pmatrix}$, direct block matrix multiplication yields $H_{2^k} H_{2^k}^T = 2 \\cdot 2^{k-1} I_{2^k} = 2^k I_{2^k}$. The butterfly decomposition computes $H_N \\cdot v$ in $k = \\log_2 N$ levels of $N$ operations, taking $\\Theta(N \\log N)$ time.",
          engineeringContext:
            "Core engine in CDMA wireless communications, quantum computing (Hadamard gates), and subset convolutions.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Hardware POPCNT / LZCNT Silicon Execution Units",
          prompt:
            "Why do hardware `POPCNT` and `LZCNT` instructions execute in 1 clock cycle on modern x86/ARM processors, and how does V8 leverage them?",
          engineeringContext:
            "CPUs contain dedicated hardware adder-trees and priority encoders on silicon that count bits combinationally in $< 0.5$ ns. V8 exposes these via intrinsics (`Math.clz32`), generating assembly `lzcnt` instructions directly without function call frames.",
        },
        {
          title: "JavaScript 32-Bit Signed Bitwise Shift Overflow (`1 << 31`)",
          prompt:
            "Why does `1 << 31` evaluate to `-2147483648` in JavaScript, and how does `(1 << 31) >>> 0` resolve it to `+2147483648`?",
          engineeringContext:
            "ECMAScript specifies that bitwise operators convert numbers to 32-bit signed integers in two's complement. Setting the sign bit (bit 31) produces negative values. The unsigned right shift operator `>>> 0` forces re-interpretation as an unsigned 32-bit integer.",
        },
        {
          title: "64-Bit Word-Level Parallelism in Bitsets",
          prompt:
            "How does word-parallel Bitset representation achieve a $64\\times$ throughput acceleration over boolean arrays in graph reachability algorithms?",
          engineeringContext:
            "A standard boolean array updates 1 node per iteration. A 64-bit word Bitset evaluates 64 edge connections in a single 1-cycle ALU `OR` instruction (`reach[u] |= reach[v]`), maximizing register throughput.",
        },
      ],
      partD_stressTests: [
        {
          title: "Bitwise Operator Precedence Hazard",
          scenario: "Evaluating `1 << 2 + 3` without parentheses expecting `(1 << 2) + 3 = 7`.",
          failureMode:
            "Arithmetic addition has higher precedence than bit shift: evaluates as `1 << 5 = 32`, causing severe logical calculation errors.",
        },
        {
          title: "Signed vs Unsigned Right Shift Sign Extension",
          scenario:
            "Shifting negative integer `-4` using arithmetic shift `>> 1` instead of logical shift `>>> 1`.",
          failureMode:
            "Arithmetic shift preserves sign bit, producing `-2` (leading 1s) instead of the desired unsigned positive bit pattern.",
        },
        {
          title: "Negative Modulo Masking Identity Failure",
          scenario: "Replacing `x % 4` with `x & 3` on negative integers in two's complement.",
          failureMode:
            "In JavaScript, `-5 % 4 === -1`, while `-5 & 3 === 3`. The power-of-two bitwise masking identity fails for negative numbers.",
        },
      ],
    },
  ],
};
