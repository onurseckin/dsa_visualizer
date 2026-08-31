import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_arrays_and_hashing_c1_p1",
  pageNumber: 1,
  title: "Flat Memory Layouts, Amortization Dynamics & Hash Table Invariants",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Dynamic Array & Collision Resolution Crisis",
      content:
        "Random Access Memory (RAM) provides a physical array of addressable byte cells where dereferencing an offset $\\text{base} + i \\times \\text{stride}$ executes in $O(1)$ time. However, static arrays require fixed capacities. Dynamic arrays solve this via geometric growth ($alpha = 2$ in Java/C++ or $alpha = 1.5$ in MSVC/Rust), guaranteeing $O(1)$ amortized append. Simultaneously, Hash Tables map arbitrary key universes $\\mathcal{U}$ into $M$ discrete buckets via hash functions $h: \\mathcal{U} \\to [0, M-1]$. By the Pigeonhole Principle, when $|mathcal{U}| > M$, collisions are mathematically inevitable. Advanced collision resolution—specifically Robin Hood Open Addressing—minimizes probe displacement variance to achieve deterministic sub-nanosecond lookups.",
    },
    {
      type: "prose",
      title: "Taxonomy of Array Memory Allocation & Hash Collision Strategies",
      content:
        "Array and hashing systems are classified by their memory layout and collision management:\n\n1. **Dynamic Array Growth Amortization:**\n   - **Linear Growth ($C \\leftarrow C + K$):** Appending $N$ items requires $\\sum_{i=1}^{N/K} i \\cdot K = \\Theta(N^2)$ memory copies, causing $O(N)$ average cost per append.\n   - **Geometric Growth ($C \\leftarrow \\lceil \\alpha C \\rceil$):** Doubling array capacity ($alpha = 2$) amortizes $N$ insertions to $\\sum_{j=0}^{\\log_2 N} 2^j = 2N - 1 = O(N)$ total copy operations, giving $O(1)$ amortized time per insertion.\n   - **Growth Factor Selection (2.0 vs 1.5):** A growth factor of $\\alpha = 2.0$ guarantees that previously deallocated memory chunks can never be reused for future resizes. Growth factors $\\alpha \\le 1 + \\frac{\\sqrt{5}-1}{2} \\approx 1.618$ (e.g. $\\alpha = 1.5$) allow the memory allocator to reuse contiguous freed segments from earlier reallocations.\n\n2. **Hash Function Design & Distribution Uniformity:**\n   - **Universal Hashing:** A family of hash functions $\\mathcal{H}$ such that for any distinct keys $x \\neq y$, $\\Pr_{h \\in \\mathcal{H}}[h(x) = h(y)] \\le 1/M$, defeating adversarial worst-case inputs.\n   - **Non-Cryptographic Fast Hashes:** FNV-1a, MurmurHash3, and CityHash maximize avalanche characteristics (flipping 1 bit flips $\\approx 50\\%$ of output bits) while avoiding floating-point division in tight loops.\n\n3. **Collision Resolution Paradigms:**\n   - **Separate Chaining:** Buckets store linked lists. Suffers from pointer-chasing L1 cache misses and memory allocator overhead.\n   - **Linear Probing:** Sequentially probes $h(k), h(k)+1, h(k)+2 \\pmod M$. High spatial locality on 64-byte cache lines, but vulnerable to **Primary Clustering** (adjacent occupied slots coalesce into long linear blocks).\n   - **Robin Hood Hashing:** An open-addressing protocol where elements maintain their **Distance from Initial Bucket (DIB)** / probe count. If an inserting element has a higher DIB than the element currently occupying a slot, the inserting element 'steals' the slot and displaces the existing element, strictly minimizing the variance of probe sequences.",
    },
    {
      type: "mental_model",
      title: "Robin Hood Displacement Balancing & Dynamic Array Potential",
      visualIntuition: `
=== ROBIN HOOD HASHING (STEAL FROM THE RICH, GIVE TO THE POOR) ===
Bucket:      [ 0 ]         [ 1 ]         [ 2 ]         [ 3 ]
Content:   Key: A (DIB=0) Key: B (DIB=1) Key: C (DIB=0) [ Empty ]

Inserting Key X: Ideal hash = 0.
- Check Bucket 0: Occupied by A (DIB=0). X has DIB=0. X.DIB <= A.DIB -> Advance.
- Check Bucket 1: Occupied by B (DIB=1). X has DIB=1. X.DIB <= B.DIB -> Advance.
- Check Bucket 2: Occupied by C (DIB=0). X has DIB=2. X.DIB (2) > C.DIB (0)!
  ==> SWAP: Place X in Bucket 2 (DIB=2). Evicted C continues probing with DIB=1!
- Check Bucket 3: Empty! Place C in Bucket 3 (DIB=1).

Result: Maximum DIB reduced from 3 to 2. Probe distribution variance is minimized!

=== DYNAMIC ARRAY GEOMETRIC EXPANSION (alpha = 2) ===
Array: [X X X X] -> FULL (Size = 4, Cap = 4, Potential Phi = 4)
Resize -> Allocate [ _ _ _ _ _ _ _ _ ] (Cap = 8)
Copy 4 elements -> [X X X X _ _ _ _] (Size = 4, Cap = 8, Potential Phi = 0)
Banked potential Phi pays for all 4 element copy operations!
      `,
      invariant:
        "Robin Hood Invariant & Potential Balance:\n1. Displacement Monotonicity: For any linear probing run, the probe distance DIB of stored elements decreases monotonically or remains balanced across clusters.\n2. Dynamic Array Potential: $\\Phi(A) = 2 \\cdot \\text{size} - \\text{capacity} \\ge 0$, ensuring the potential never drops below zero and fully funds future doubling copies.",
      stateTransitions:
        "Robin Hood Insert: At slot $i$, if $DIB(\\text{incoming}) > DIB(\\text{existing})$, swap $(\\text{incoming}, \\text{existing})$; increment slot $i \\leftarrow (i+1) \\pmod M$ and $DIB \\leftarrow DIB + 1$ until empty slot is reached.\nBackward-Shift Delete: Remove key at $i$; shift subsequent elements $i+1$ leftward while $DIB > 0$, eliminating tombstones.",
      naiveBottleneck:
        "Linear array insertion without geometric growth incurs $\\Theta(N^2)$ memory reallocation copies. Unbalanced open addressing leads to $O(N)$ lookup degradation on cluster collisions.",
      optimalInsight:
        "Geometric expansion maintains $O(1)$ amortized memory management, while Robin Hood displacement balancing bounds the maximum probe sequence length to $O(\\ln \\ln N)$ with high probability.",
    },
  ],
};
