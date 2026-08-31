import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_arrays_and_hashing_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Memory Hierarchy, Struct-of-Arrays & Cache Line Alignment",
      content:
        "Modern high-frequency trading engines and database storage layers (e.g. ClickHouse, RocksDB) optimize hash table layouts for CPU memory controllers:\n\n1. **Struct-of-Arrays (SoA) vs Array-of-Structs (AoS):** An AoS layout (`struct Entry { int key; double value; int8_t dib; }`) consumes $16$ bytes per entry due to alignment padding. A 64-byte L1 cache line holds only 4 entries, loading payload values into cache even when searching for keys. An SoA layout separates `keys: Int32Array` from `values: Float64Array`, packing 16 keys per 64-byte cache line and quadrupling linear probe scan speed.\n2. **Bitwise Masking vs Hardware Integer Division:** Executing `hash % capacity` triggers the x86 `idiv` instruction, which consumes 20-40 CPU clock cycles. By constraining hash table capacities to powers of two ($M = 2^k$), bucket indexing evaluates via `hash & (M - 1)` in exactly 1 CPU cycle.\n3. **Robin Hood Probe Variance Reduction:** Under standard linear probing, the maximum probe length scales as $O(\\log N)$ with high variance. Robin Hood hashing reduces maximum probe length variance to $O(\\ln \\ln N)$, keeping probe runs confined within a single 64-byte cache line with $>99\\%$ probability.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Tombstone Clustering & Load Factor Degradation",
      content:
        "1. **Tombstone Graveyard Accumulation:** In naive open addressing, deleting a key marks its slot as a 'tombstone'. As insertions and deletions occur, the table fills with tombstones. Lookups for missing keys scan through thousands of tombstones, degrading latency from $O(1)$ to $\\Theta(N)$ even if the table contains only 1 active element. **Backward-Shift Deletion** physically shifts elements leftward, eliminating tombstones entirely.\n2. **Load Factor Threshold Overshoot:** When the load factor $\\alpha = N/M$ exceeds $0.80$, cluster sizes explode non-linearly. Production open-addressing tables must trigger doubling rehashes at $\\alpha = 0.70 - 0.75$.\n3. **Adversarial Hash Flooding (DoS Attacks):** Using deterministic hash functions without random per-instance seeds allows attackers to craft colliding keys mapping to the same bucket, forcing $O(N^2)$ server CPU exhaustion. Hash tables exposed to network input *must* use keyed randomized hashing (SipHash).",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Deterministic O(1) Lookups: Cuckoo Hashing & FKS Perfect Hashing",
      content:
        "When worst-case $O(1)$ lookup guarantees are required for hardware routing tables or immutable compilers:\n- **Cuckoo Hashing (Pagh & Rodler 2001):** Maintains two hash tables $T_1, T_2$ with independent hash functions $h_1, h_2$. Key $x$ resides at either $T_1[h_1(x)]$ or $T_2[h_2(x)]$, guaranteeing lookups examine at most **two memory locations** ($O(1)$ worst-case). Insertions kick out existing occupants in a cuckoo displacement chain.\n- **FKS Perfect Hashing (Fredman, Komlós, Szemerédi 1984):** A two-level hierarchical hash table for static key sets $S$. The first level hashes $N$ keys into $N$ buckets. Each secondary bucket $i$ containing $n_i$ keys uses a localized hash table of size $n_i^2$ with zero collisions. Total memory is strictly $O(N)$ and lookups take guaranteed $O(1)$ time.",
    },
    {
      type: "prose",
      title: "Hash Table Strategy Comparison Matrix",
      content: `
| Collision Strategy | Average Lookup | Worst Lookup | Cache Locality | Memory Overhead | Tombstone Handling |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Separate Chaining** | $O(1)$ | $O(N)$ | Poor (pointer chasing) | High ($16-24$ B/node) | Linked-list node removal |
| **Linear Probing** | $O(1)$ | $O(N)$ (clustering) | Excellent (contiguous) | Minimal ($1.3\\times$) | Tombstones / Backward-shift |
| **Quadratic Probing** | $O(1)$ | $O(N)$ | Medium | Minimal ($1.5\\times$) | Tombstones |
| **Robin Hood Hashing** | $O(1)$ | $O(\\ln \\ln N)$ | Excellent (contiguous) | Minimal ($1.3\\times$) | Backward-shift (zero tombstones) |
| **Cuckoo Hashing** | $\\Theta(1)$ guaranteed | $\\Theta(1)$ (2 lookups) | High (2 cache lines) | Medium ($2\\times$) | Simple bucket clearing |
| **FKS Perfect Hashing** | $\\Theta(1)$ guaranteed | $\\Theta(1)$ (2 lookups) | High | $O(N)$ static space | Static read-only |
      `,
    },
  ],
};
