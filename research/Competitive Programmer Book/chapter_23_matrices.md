# Chapter 23: Matrices — Missing Questions & Topic Gap Analysis

> **Source**: *Competitive Programmer's Handbook* (Antti Laaksonen), Chapter 23: Matrices  
> **Target Category**: `math_and_number_theory` ("Math & Number Theory")

---

## 1. Chapter Overview & Subtopics

Chapter 23 explores matrix algebra applications in competitive programming, linear recurrence solving, and graph theory, divided into 3 main sections:

1. **23.1 Operations**
   - Matrix Addition, Subtraction, Scalar Multiplication
   - Matrix Multiplication ($O(n^3)$ standard or $O(n^{2.807})$ Strassen)
   - Transpose, Identity Matrix $I$, Matrix Power $A^k$ via Binary Exponentiation
   - Determinants and Matrix Inversion ($A^{-1}$) via Gaussian Elimination

2. **23.2 Linear Recurrences**
   - Fast $O(k^3 \log n)$ evaluation of linear recurrences of order $k$
   - Transition Matrix for Fibonacci: $\begin{bmatrix} f(n) \\ f(n-1) \end{bmatrix} = \begin{bmatrix} 1 & 1 \\ 1 & 0 \end{bmatrix}^{n-1} \begin{bmatrix} f(1) \\ f(0) \end{bmatrix}$
   - General $k$-th order linear recurrences $f(n) = c_1 f(n-1) + c_2 f(n-2) + \dots + c_k f(n-k)$

3. **23.3 Graphs and Matrices**
   - **Path Counting**: $A^k[i][j]$ in adjacency matrix $A$ equals the exact number of paths of length $k$ from node $i$ to node $j$.
   - **Min-Plus Matrix Multiplication**: Replacing $(+, \times)$ operations with $(\min, +)$ semiring multiplication ($C[i][j] = \min_k (A[i][k] + B[k][j])$) to find shortest paths of length $k$.
   - **Kirchhoff's Matrix Tree Theorem**: Number of spanning trees of a graph equals any cofactor of its Laplacian matrix $L = D - A$.

---

## 2. Currently Implemented in App

The app currently has **1 active algorithm** covering topics from Chapter 23:

| ID | Title | Description / Chapter Section |
| :--- | :--- | :--- |
| `matrix-exponentiation` | **Result & Base 2x2 Exponentiation Matrices** | Section 23.2 — 2x2 matrix power for Fibonacci numbers |

---

## 3. Missing Questions & Implementation Roadmap

The following matrix-based algorithms are missing from the current registry and are prime candidates for implementation:

### 1. N-th Tribonacci / General Recurrence via Matrix Exponentiation
- **Book Reference**: Section 23.2 ("Linear recurrences", p. 220–222)
- **Concept**: $3 \times 3$ state transition matrix exponentiation for 3-term linear recurrences $T_n = T_{n-1} + T_{n-2} + T_{n-3}$.
- **Matching LeetCode Question**:
  - [LC 1137: N-th Tribonacci Number](https://leetcode.com/problems/n-th-tribonacci-number/)

### 2. Path Counting of Length K via Adjacency Matrix Power
- **Book Reference**: Section 23.3 ("Graphs and matrices", p. 222–223)
- **Concept**: Raising graph adjacency matrix $A$ to power $K$ in $O(V^3 \log K)$ to find total number of walks of length $K$.
- **Matching LeetCode Question**:
  - [LC 2858: Minimum Edge Reversals So Every Node Is Reachable](https://leetcode.com/problems/minimum-edge-reversals-so-every-node-is-reachable/)

### 3. Min-Plus Matrix Multiplication (Shortest Paths with K Steps)
- **Book Reference**: Section 23.3 ("Graphs and matrices", p. 223–224)
- **Concept**: Using $(\min, +)$ matrix multiplication to calculate exact $K$-step shortest paths between all pairs of nodes in $O(V^3 \log K)$.
- **Matching LeetCode Question**:
  - [LC 787: Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/)

### 4. Kirchhoff's Matrix Tree Theorem (Laplacian Determinant Spanning Tree Count)
- **Book Reference**: Section 23.3 ("Graphs and matrices", p. 224)
- **Concept**: Computing graph Laplacian matrix $L = D - A$, removing one row and column, and taking the determinant via Gaussian elimination to count total spanning trees.
- **Matching LeetCode Question**:
  - [LC 3123: Find Edges in Shortest Paths](https://leetcode.com/problems/find-edges-in-shortest-paths/)
