import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_arrays_and_hashing_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Dynamic Array Amortization via the Potential Method",
      theorem:
        "Consider a dynamic array initialized with capacity $1$ that doubles its capacity whenever an element is inserted into a full array. The amortized cost of inserting an element is strictly bounded by $O(1)$ (specifically, at most $3$ constant-time operations per insertion).",
      proof: `
**Proof via Potential Method (Tarjan 1985):**
1. Let $s_i$ and $c_i$ denote the number of stored elements (size) and total capacity of the array after the $i$-th insertion, respectively.
2. Define the potential function:
   $$\\Phi_i = 2 s_i - c_i$$
3. We verify that the potential is valid:
   - Immediately after doubling, $s_i = c_i / 2$, so $\\Phi_i = 2(c_i / 2) - c_i = 0$.
   - Just before doubling, $s_i = c_i$, so $\\Phi_i = 2c_i - c_i = c_i \\ge 0$.
   - At initialization ($s_0 = 0, c_0 = 0$), $\\Phi_0 = 0$.
   - Because $s_i \\ge c_i / 2$ at all steps, $\\Phi_i \\ge 0 = \\Phi_0$ for all $i \\ge 0$.
4. We evaluate the amortized cost $\\hat{a}_i = t_i + \\Phi_i - \\Phi_{i-1}$ where $t_i$ is the actual computation cost:
   - **Case 1 (Insertion without reallocation: $s_{i-1} < c_{i-1}$):**
     - Actual cost $t_i = 1$ (writing the element).
     - New state: $s_i = s_{i-1} + 1$ and $c_i = c_{i-1}$.
     - Change in potential: $\\Delta \\Phi = (2(s_{i-1} + 1) - c_{i-1}) - (2 s_{i-1} - c_{i-1}) = 2$.
     - Amortized cost: $\\hat{a}_i = 1 + 2 = 3$.
   - **Case 2 (Insertion triggering reallocation: $s_{i-1} = c_{i-1}$):**
     - Actual cost $t_i = s_{i-1} + 1$ ($s_{i-1}$ element copies to the new buffer + 1 new element write).
     - New state: $s_i = s_{i-1} + 1$ and $c_i = 2 c_{i-1} = 2 s_{i-1}$.
     - Change in potential:
       $$\\Delta \\Phi = \\Phi_i - \\Phi_{i-1} = (2(s_{i-1} + 1) - 2 s_{i-1}) - (2 s_{i-1} - s_{i-1}) = 2 - s_{i-1}$$
     - Amortized cost:
       $$\\hat{a}_i = t_i + \\Delta \\Phi = (s_{i-1} + 1) + (2 - s_{i-1}) = 3$$
5. In both cases, the amortized cost of every append operation is exactly $\\hat{a}_i = 3 = O(1)$.
6. Summing across $N$ total insertions: $\\sum_{i=1}^N t_i = \\sum_{i=1}^N \\hat{a}_i - \\Phi_N + \\Phi_0 \\le 3N - 0 = 3N = O(N)$. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Universal Hashing Collision Probability Bound",
      theorem:
        "Let $\\mathcal{H} = \\{ h_{a, b}(x) = ((ax + b) \\pmod p) \\pmod m \\mid a \\in \\{1, \\dots, p-1\\}, b \\in \\{0, \\dots, p-1\\} \\}$ be a linear congruential family of hash functions mapping universe $\\mathcal{U} \\subset \\mathbb{Z}_p$ to $m$ buckets, where $p$ is a prime $> m$. For any two distinct keys $x \\neq y \\in \\mathcal{U}$, the collision probability when $h$ is chosen uniformly at random from $\\mathcal{H}$ satisfies $\\Pr_{h \\in \\mathcal{H}}[h(x) = h(y)] \\le \\frac{1}{m}$.",
      proof: `
**Proof via Modular Bijection:**
1. Let $r = (ax + b) \\pmod p$ and $s = (ay + b) \\pmod p$.
2. Because $x \\neq y$ and $a \\not\\equiv 0 \\pmod p$:
   $$r - s \\equiv a(x - y) \\not\\equiv 0 \\pmod p \\implies r \\neq s$$
3. For any fixed pair of distinct targets $(r, s)$ with $r \\neq s \\in \\mathbb{Z}_p$, the system of modular equations:
   $$ax + b \\equiv r \\pmod p$$
   $$ay + b \\equiv s \\pmod p$$
   has a unique solution for $(a, b) \\in \\mathbb{Z}_p^* \\times \\mathbb{Z}_p$ given by $a = (r - s)(x - y)^{-1} \\pmod p$ and $b = r - ax \\pmod p$.
4. Because there are $p(p-1)$ distinct choices of $(a, b)$ in $\\mathcal{H}$ and $p(p-1)$ pairs of distinct $(r, s)$, the mapping from $(a, b)$ to $(r, s)$ is a strict bijection.
5. A collision occurs if and only if $r \\equiv s \\pmod m$ with $r \\neq s$.
6. For a fixed $r \\in \\{0, \\dots, p-1\\}$, the number of integers $s \\in \\{0, \\dots, p-1\\} \\setminus \\{r\\}$ such that $s \\equiv r \\pmod m$ is at most $\\lceil p/m \\rceil - 1 \\le \\frac{p - 1}{m}$.
7. Total colliding pairs $(r, s)$ across all $p$ choices of $r$ is at most $p \\cdot \\frac{p - 1}{m}$.
8. Dividing by the total number of $(a, b)$ choices $p(p - 1)$:
   $$\\Pr[h(x) = h(y)] = \\frac{p(p - 1)/m}{p(p - 1)} = \\frac{1}{m}$$
Thus, $\\mathcal{H}$ is a 1-universal family of hash functions. $\\blacksquare$
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive Separate Chaining Hash Map Baseline",
          code: `export class NaiveChainingMap<K, V> {
  private buckets: Array<Array<{ key: K; val: V }>>;
  private size: number;

  constructor(bucketCount: number = 16) {
    this.buckets = Array.from({ length: bucketCount }, () => []);
    this.size = 0;
  }

  private hash(key: K): number {
    const s = String(key);
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h) % this.buckets.length;
  }

  set(key: K, val: V): void {
    const bucket = this.buckets[this.hash(key)];
    for (const item of bucket) {
      if (item.key === key) {
        item.val = val;
        return;
      }
    }
    bucket.push({ key, val });
    this.size++;
  }

  get(key: K): V | undefined {
    const bucket = this.buckets[this.hash(key)];
    for (const item of bucket) {
      if (item.key === key) return item.val;
    }
    return undefined;
  }
}`,
          explanation:
            "Basic separate chaining without dynamic capacity growth or flat memory pinning. When entries exceed bucket capacity, bucket chains grow linearly, degrading lookup latency to $O(N)$ with heavy heap pointer chasing.",
          timeComplexity: "O(1) average, O(N) worst-case",
          spaceComplexity: "O(N) scattered heap objects",
        },
        {
          label: "Stage 2: Dynamic Array with Geometric Expansion (1.5x / 2x)",
          code: `export class DynamicArray<T> {
  private buffer: Array<T | undefined>;
  public length: number;
  public capacity: number;

  constructor(initialCapacity: number = 4) {
    this.capacity = Math.max(1, initialCapacity);
    this.buffer = new Array(this.capacity);
    this.length = 0;
  }

  public push(val: T): void {
    if (this.length === this.capacity) {
      this.resize(Math.floor(this.capacity * 1.5) + 1);
    }
    this.buffer[this.length++] = val;
  }

  public get(index: number): T {
    if (index < 0 || index >= this.length) throw new RangeError("Index out of bounds");
    return this.buffer[index] as T;
  }

  public set(index: number, val: T): void {
    if (index < 0 || index >= this.length) throw new RangeError("Index out of bounds");
    this.buffer[index] = val;
  }

  private resize(newCapacity: number): void {
    const newBuf = new Array(newCapacity);
    for (let i = 0; i < this.length; i++) {
      newBuf[i] = this.buffer[i];
    }
    this.buffer = newBuf;
    this.capacity = newCapacity;
  }
}`,
          explanation:
            "Implements a dynamic array using a growth factor of 1.5x (allowing allocator memory recycling). The Potential Method proves that $N$ appends run in amortized $O(1)$ time.",
          timeComplexity: "Append: O(1) amortized, Random Access: O(1) strictly",
          spaceComplexity: "O(N) contiguous buffer",
        },
        {
          label: "Stage 3: High-Performance Flat Robin Hood Hash Map with Backward Shift",
          code: `export class FastRobinHoodHashMap {
  private capacity: number;
  private mask: number;
  private keys: Int32Array;
  private values: Float64Array;
  private dibs: Int8Array; // Distance from Initial Bucket (DIB)
  private occupied: Uint8Array;
  public size: number;
  private maxDIB: number;

  constructor(initialCap: number = 16) {
    // Capacity must be power of 2 for fast bitwise masking
    let cap = 1;
    while (cap < initialCap) cap <<= 1;
    this.capacity = cap;
    this.mask = cap - 1;
    this.keys = new Int32Array(cap);
    this.values = new Float64Array(cap);
    this.dibs = new Int8Array(cap).fill(-1);
    this.occupied = new Uint8Array(cap);
    this.size = 0;
    this.maxDIB = 0;
  }

  // Fast integer hash (Murmur3 32-bit finalizer)
  private hashKey(key: number): number {
    let h = key | 0;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h & this.mask;
  }

  public set(key: number, val: number): void {
    if (this.size >= this.capacity * 0.75) {
      this.rehash(this.capacity << 1);
    }

    let slot = this.hashKey(key);
    let currKey = key;
    let currVal = val;
    let currDIB = 0;

    while (true) {
      if (!this.occupied[slot]) {
        this.keys[slot] = currKey;
        this.values[slot] = currVal;
        this.dibs[slot] = currDIB;
        this.occupied[slot] = 1;
        this.size++;
        if (currDIB > this.maxDIB) this.maxDIB = currDIB;
        return;
      }

      if (this.keys[slot] === currKey) {
        this.values[slot] = currVal; // Update existing key
        return;
      }

      // Robin Hood Swap: Rich gives to the poor
      const existingDIB = this.dibs[slot];
      if (currDIB > existingDIB) {
        const tmpK = this.keys[slot];
        const tmpV = this.values[slot];
        const tmpDIB = this.dibs[slot];

        this.keys[slot] = currKey;
        this.values[slot] = currVal;
        this.dibs[slot] = currDIB;

        currKey = tmpK;
        currVal = tmpV;
        currDIB = tmpDIB;
      }

      slot = (slot + 1) & this.mask;
      currDIB++;
    }
  }

  public get(key: number): number | undefined {
    let slot = this.hashKey(key);
    let currDIB = 0;

    while (this.occupied[slot] && currDIB <= this.maxDIB) {
      if (this.keys[slot] === key) {
        return this.values[slot];
      }
      if (currDIB > this.dibs[slot]) {
        return undefined; // Robin Hood early termination!
      }
      slot = (slot + 1) & this.mask;
      currDIB++;
    }
    return undefined;
  }

  // Tombstone-free Backward-Shift Deletion: O(1) cache-friendly deletion
  public delete(key: number): boolean {
    let slot = this.hashKey(key);
    let currDIB = 0;

    while (this.occupied[slot] && currDIB <= this.maxDIB) {
      if (this.keys[slot] === key) {
        this.size--;
        // Shift backward
        let curr = slot;
        while (true) {
          const next = (curr + 1) & this.mask;
          if (!this.occupied[next] || this.dibs[next] === 0) {
            this.occupied[curr] = 0;
            this.dibs[curr] = -1;
            break;
          }
          this.keys[curr] = this.keys[next];
          this.values[curr] = this.values[next];
          this.dibs[curr] = this.dibs[next] - 1;
          this.occupied[curr] = 1;
          curr = next;
        }
        return true;
      }
      if (currDIB > this.dibs[slot]) return false;
      slot = (slot + 1) & this.mask;
      currDIB++;
    }
    return false;
  }

  private rehash(newCap: number): void {
    const oldKeys = this.keys;
    const oldVals = this.values;
    const oldOcc = this.occupied;
    const oldCap = this.capacity;

    this.capacity = newCap;
    this.mask = newCap - 1;
    this.keys = new Int32Array(newCap);
    this.values = new Float64Array(newCap);
    this.dibs = new Int8Array(newCap).fill(-1);
    this.occupied = new Uint8Array(newCap);
    this.size = 0;
    this.maxDIB = 0;

    for (let i = 0; i < oldCap; i++) {
      if (oldOcc[i]) {
        this.set(oldKeys[i], oldVals[i]);
      }
    }
  }
}`,
          explanation:
            "Stage 3 demonstrates a flat 1D Robin Hood Hash Table using Struct-of-Arrays (SoA) TypedArray layouts. The Robin Hood invariant enables immediate early termination on missing keys when `currDIB > dibs[slot]`. Backward-shift deletion eliminates tombstones, preserving optimal L1 cache line hit rates.",
          timeComplexity: "Lookup / Insert / Delete: O(1) expected with minimal probe variance",
          spaceComplexity: "Flat zero-GC typed array buffers",
        },
      ],
      stepByStep: [
        "Select flat Struct-of-Arrays TypedArray buffers to maximize 64-byte L1 cache-line prefetching.",
        "Use Murmur3 / FNV-1a non-cryptographic integer mixing with power-of-two bitwise masking (`hash & (cap - 1)`).",
        "Apply Robin Hood displacement swaps during insertion and backward-shift deletion to eliminate tombstones and bound worst-case search sequences.",
      ],
    },
  ],
};
