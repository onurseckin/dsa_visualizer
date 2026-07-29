# Chapter 27: Square Root Algorithms — Missing Questions & Topic Gap Analysis

> **Source**: *Competitive Programmer's Handbook* (Antti Laaksonen), Chapter 27: Square Root Algorithms  
> **Target Category**: `advanced_range_queries` ("Advanced Range Queries")

---

## 1. Chapter Overview & Subtopics

Chapter 27 covers $\sqrt{n}$ time complexity techniques, block partitioning, and offline range query sorting across 3 main sections:

1. **27.1 Combining Algorithms**
   - Splitting data/operations into blocks of size $k \approx \sqrt{n}$
   - Trade-off optimization between update time $O(1)$ and query time $O(\sqrt{n})$ or vice versa
   - **Heavy-Light Item Threshold**: Treating items with size $>\sqrt{n}$ (heavy) differently from items with size $\le \sqrt{n}$ (light)

2. **27.2 Integer Partitions**
   - Decomposing integer $n$ into a sum of positive integers
   - **$\sqrt{n}$ Bound**: A partition of $n$ can contain at most $O(\sqrt{n})$ distinct integer values
   - DP optimization using the $\sqrt{n}$ distinct value property

3. **27.3 Mo's Algorithm**
   - Offline range query processing algorithm
   - Sorting queries $(l_i, r_i)$ by key $(\lfloor l_i / \sqrt{n} \rfloor, r_i)$
   - Total pointer movement bounded by $O((n + q) \sqrt{n})$

---

## 2. Currently Implemented in App

The app currently has **2 active algorithms** under `advanced_range_queries` covering topics from Chapter 27:

| ID | Title | Description / Chapter Section |
| :--- | :--- | :--- |
| `sqrt-decomposition` | **SQRT Decomposition (Block Sums & Array)** | Section 27.1 — Block-based array partitioning and range sum queries |
| `mo-algorithm` | **Mo's Algorithm** | Section 27.3 — Offline range query sorting and sliding window update |

---

## 3. Missing Questions & Implementation Roadmap

The following square root techniques are missing from the current registry and are prime candidates for implementation:

### 1. SQRT Heavy-Light Item Threshold Splitting
- **Book Reference**: Section 27.1 ("Combining algorithms", p. 252–254)
- **Concept**: Splitting node/frequency processing into heavy ($>\sqrt{N}$) precomputations and light ($\le \sqrt{N}$) online queries.
- **Matching LeetCode Question**:
  - [LC 2056: Number of Valid Move Combinations On Chessboard](https://leetcode.com/problems/number-of-valid-move-combinations-on-chessboard/)

### 2. Integer Partition DP with $\sqrt{N}$ Distinct Terms
- **Book Reference**: Section 27.2 ("Integer partitions", p. 254–255)
- **Concept**: Partitioning $N$ into integer terms where the maximum number of distinct values is bounded by $O(\sqrt{N})$.
- **Matching LeetCode Questions**:
  - [LC 343: Integer Break](https://leetcode.com/problems/integer-break/)
  - [LC 1884: Egg Drop With 2 Eggs and N Floors](https://leetcode.com/problems/egg-drop-with-2-eggs-and-n-floors/)
