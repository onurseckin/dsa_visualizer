# Chapter 28: Segment Trees Revisited — Missing Questions & Topic Gap Analysis

> **Source**: *Competitive Programmer's Handbook* (Antti Laaksonen), Chapter 28: Segment Trees Revisited  
> **Target Category**: `advanced_range_queries` ("Advanced Range Queries")

---

## 1. Chapter Overview & Subtopics

Chapter 28 covers advanced variants of segment trees, lazy propagation, dynamic allocation, complex node structures, and 2D extensions across 4 main sections:

1. **28.1 Lazy Propagation**
   - Efficient range updates (e.g. adding $x$ to all elements in range $[a, b]$) in $O(\log n)$
   - Maintenance of lazy tag array `lazy[node]` to defer child updates until required

2. **28.2 Dynamic Trees (Sparse Segment Tree)**
   - Creating segment tree nodes on demand when range size is large (e.g., $N = 10^9$)
   - Pointer-based or dynamic index allocation keeping memory bounded to $O(Q \log N)$

3. **28.3 Data Structures in Nodes**
   - Storing data structures (such as sorted `vector`, `std::set`, or Bitset) inside segment tree nodes
   - **Merge Sort Tree**: Each node contains a sorted array of its range elements, enabling range count queries ($< k$) in $O(\log^2 n)$

4. **28.4 Two-Dimensional Segment Trees**
   - Nested segment trees (outer tree on X-axis, inner tree on Y-axis)
   - Supporting 2D range queries and 2D point/range updates in $O(\log^2 n)$

---

## 2. Currently Implemented in App

The app currently has **4 active algorithms** under `advanced_range_queries` covering topics from Chapter 28:

| ID | Title | Description / Chapter Section |
| :--- | :--- | :--- |
| `segment-tree` | **Segment Tree (Range Sum Query & Update)** | Base — Point updates and range sum queries |
| `segment-tree-lazy` | **Segment Tree (Lazy Propagation)** | Section 28.1 — Range updates via lazy tag propagation |
| `dynamic-segment-tree` | **Dynamic Segment Tree (Sparse Range Queries)** | Section 28.2 — Pointer-based sparse node creation |
| `persistent-segment-tree` | **Persistent Segment Tree** | Related — Fully persistent versioned segment tree |

---

## 3. Missing Questions & Implementation Roadmap

The following advanced segment tree structures are missing from the current registry and are prime candidates for implementation:

### 1. Merge Sort Tree (Vector Segment Tree)
- **Book Reference**: Section 28.3 ("Data structures in nodes", p. 263–264)
- **Concept**: Segment tree where nodes store sorted sub-vectors, enabling binary search to count elements smaller than $K$ in range $[L, R]$ in $O(\log^2 N)$.
- **Matching LeetCode Question**:
  - [LC 315: Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/)

### 2. 2D Segment Tree (2D Range Queries & Updates)
- **Book Reference**: Section 28.4 ("Two-dimensionality", p. 264)
- **Concept**: 2D tree-of-trees structure supporting point updates and rectangular range sum/max queries in $O(\log^2 N)$.
- **Matching LeetCode Question**:
  - [LC 308: Range Sum Query 2D - Mutable](https://leetcode.com/problems/range-sum-query-2d-mutable/)
