import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_arrays_and_hashing_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_arrays_and_hashing",
      title: "Arrays & Hashing Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Longest Consecutive Sequence in O(N) Time",
          problemId: "longest-consecutive-sequence",
          difficulty: "Medium",
          description:
            "Given an unsorted array of integers, find the length of the longest consecutive elements sequence in strictly $O(N)$ time using a Hash Set. Only explore forward sequences when $(num - 1)$ is not in the set.",
          rationale:
            "Tests invariant-based sequence start pruning to guarantee each element is visited at most twice.",
        },
        {
          title: "Subarray Sum Equals K via Prefix Sum Hash Map",
          problemId: "subarray-sum-equals-k",
          difficulty: "Medium",
          description:
            "Given an array of integers and an integer $K$, find the total number of continuous subarrays whose sum equals $K$. Solve in $O(N)$ time and $O(N)$ space using a prefix sum frequency hash map.",
          rationale:
            "Demonstrates transformation of range sum queries $\\sum_{j=i}^k A[j] = K$ into prefix subtraction lookups $P[k] - P[i-1] = K$.",
        },
        {
          title: "First Missing Positive in O(N) Time and O(1) Space",
          problemId: "first-missing-positive-cyclic",
          difficulty: "Hard",
          description:
            "Given an unsorted integer array, find the smallest missing positive integer. Implement in strictly $O(N)$ time and $O(1)$ auxiliary space by using the input array itself as a hash table with cyclic in-place swaps (`nums[i] <-> nums[nums[i] - 1]`).",
          rationale:
            "Evaluates in-place cycle sort and array-as-hash-map index mapping under zero memory allocation constraints.",
        },
        {
          title: "Design a High-Throughput Robin Hood Hash Map",
          problemId: "design-robin-hood-hash-map",
          difficulty: "Hard",
          description:
            "Implement a cache-aligned Robin Hood open-addressing Hash Table supporting `set`, `get`, and `delete` with $O(1)$ amortized cost, dynamic $75\\%$ load factor doubling, and tombstone-free backward-shift deletion.",
          rationale: "Tests mastery over high-performance systems-grade hash table engineering.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Birthday Paradox Collision Bound",
          statement:
            "Prove that when $N$ items are hashed uniformly into $M$ buckets, the probability of at least one collision exceeds $50\\%$ when $N \\approx \\sqrt{2M \\ln 2} \\approx 1.177 \\sqrt{M}$.",
          proofOutline:
            "The probability of zero collisions is $Q(N) = \\prod_{k=1}^{N-1} (1 - k/M)$. Using the Taylor series bound $1 - x \\le e^{-x}$, $Q(N) \\le \\exp(-\\sum_{k=1}^{N-1} k/M) = \\exp(-N(N-1)/(2M)) \\approx \\exp(-N^2/(2M))$. Setting $Q(N) = 1/2$ yields $-N^2/(2M) = \\ln(1/2) = -\\ln 2 \\implies N = \\sqrt{2M \\ln 2}$.",
          engineeringContext:
            "Explains why single 32-bit hash functions ($M = 2^{32}$) suffer collisions after only $77{,}000$ elements, mandating 64-bit/128-bit hashes for large corpora.",
        },
        {
          title: "Robin Hood Probe Length Variance Minimization Bound",
          statement:
            "Prove that Robin Hood hashing with load factor $\\alpha < 1$ guarantees that the maximum probe sequence length (PSL) is bounded by $\\frac{\\ln \\ln N}{\\ln(1/\\alpha)} + O(1)$ with high probability.",
          proofOutline:
            "Under standard linear probing, cluster lengths follow a branching process with exponential tails $\\Pr[PSL \\ge k] = O(\\alpha^k)$. Robin Hood's displacement swap enforces a strict sorting of probe distances along each cluster, which recursively compresses the tail distribution from geometric to doubly exponential, bounding the maximum PSL to $O(\\ln \\ln N)$.",
          engineeringContext:
            "Ensures predictable, jitter-free tail latency ($P99.9$) in high-frequency trading order books.",
        },
        {
          title: "Cuckoo Hashing Random Graph 2-Core Cycle Invariant",
          statement:
            "Prove that Cuckoo Hashing insertion fails (requiring a full table rehash) if and only if the random bipartite cuckoo graph contains a connected component with more edges than vertices (a cycle with attached branches).",
          proofOutline:
            "Each key represents a directed edge $(h_1(x), h_2(x))$ between two bucket vertices. An assignment of keys to buckets corresponds to orienting the edges such that each vertex has in-degree $\\le 1$. In any connected component with $V$ vertices and $E$ edges, if $E > V$, by the Pigeonhole Principle no such valid orientation exists, forcing an infinite kick-out loop.",
          engineeringContext:
            "Governs the theoretical threshold for load factor $\\alpha < 0.50$ in 2-hash cuckoo tables and $\\alpha \\approx 0.91$ in 3-hash tables.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Struct-of-Arrays (SoA) vs Array-of-Structs (AoS) on 64-Byte L1 Cache Lines",
          prompt:
            "Why does an SoA hash table (`keys: Int32Array`, `values: Float64Array`) achieve $4\\times$ higher probe throughput than an AoS table (`struct Entry { int key; double val; }`) during key lookups?",
          engineeringContext:
            "Key probes only require reading the key array. SoA packs 16 32-bit keys into a 64-byte L1 cache line, whereas AoS packs only 4 entries (due to 16-byte alignment), wasting $75\\%$ of memory bandwidth on unused values.",
        },
        {
          title: "SipHash Keyed Randomization against Algorithmic Hash-DoS Attacks",
          prompt:
            "How does SipHash-2-4 use a per-process 128-bit secret seed to defeat adversarial hash flooding attacks in web application frameworks?",
          engineeringContext:
            "Deterministic hashes allow attackers to generate $10^5$ colliding POST parameters, forcing the backend hash map to degrade to $O(N^2)$ linked-list traversal. SipHash is cryptographically keyed, making collision crafting computationally infeasible.",
        },
        {
          title: "Power-of-Two Bitwise Masking vs Hardware Integer Division Latency",
          prompt:
            "Analyze the microarchitectural difference between `hash % capacity` and `hash & (capacity - 1)` on modern x86/ARM CPUs.",
          engineeringContext:
            "`hash % capacity` emits the `idiv` instruction, which has 20-40 cycle latency and blocks pipelining. `hash & (cap - 1)` emits the `and` instruction, which executes in 1 cycle with throughput of 4 instructions/cycle.",
        },
      ],
      partD_stressTests: [
        {
          title: "Adversarial Hash Flooding on Unseeded Hash Functions",
          scenario:
            "Sending $10^5$ strings that have identical hash values modulo $2^{16}$ to a server using a separate-chaining hash table without randomized seeds.",
          failureMode:
            "All $10^5$ keys map to a single bucket, degrading table insertion from $O(1)$ to $\\Theta(N^2)$ and causing a multi-minute server CPU freeze (Denial of Service).",
        },
        {
          title: "Tombstone Graveyard Cluster Degradation in Open Addressing",
          scenario:
            "Executing $10^6$ insertions and deletions on an open-addressing hash table using tombstone markers without backward-shift deletion or periodic cleanup.",
          failureMode:
            "The table becomes saturated with tombstones. Lookups for missing keys scan through millions of dead slots, degrading latency from $O(1)$ to $\\Theta(N)$.",
        },
        {
          title: "GC Pause Spike on Massive Synchronous Table Doubling",
          scenario:
            "A hash table storing $5 \\times 10^7$ entries triggers a doubling rehash from 1 GB to 2 GB in the main application thread.",
          failureMode:
            "Synchronously allocating and copying 2 GB of memory freezes the application thread for $>500$ ms, triggering health-check timeouts and service dropouts.",
        },
      ],
    },
  ],
};
