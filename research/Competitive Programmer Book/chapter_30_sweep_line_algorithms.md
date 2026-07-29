# Chapter 30: Sweep Line Algorithms — Missing Questions & Topic Gap Analysis

> **Source**: *Competitive Programmer's Handbook* (Antti Laaksonen), Chapter 30: Sweep Line Algorithms  
> **Target Category**: `geometry_and_sweep_line` ("Geometry & Sweep Line")

---

## 1. Chapter Overview & Subtopics

Chapter 30 covers sweep line algorithms, event processing, spatial point queries, and convex hull construction across 3 main sections:

1. **30.1 Intersection Points**
   - Bentley–Ottmann sweep line framework for line segment intersections
   - Processing event queue (segment start, segment end, intersection)
   - Maintaining active line segments ordered by current y-coordinate in balanced BST / `std::set` in $O((N + K) \log N)$

2. **30.2 Closest Pair Problem**
   - Sweep line algorithm for finding the two closest points in $O(N \log N)$
   - Sorting points by x-coordinate and sweeping a vertical line
   - Maintaining candidate active points in `std::set` ordered by y-coordinate within bounding box $[x - d, x]$ and $[y - d, y + d]$

3. **30.3 Convex Hull Problem**
   - Andrew's Monotone Chain algorithm / Graham Scan in $O(N \log N)$
   - Sorting points by x-coordinate, constructing lower hull and upper hull using cross product turn orientation tests ($v_1 \times v_2 \le 0$)

---

## 2. Currently Implemented in App

The app currently has **3 active algorithms** under `geometry_and_sweep_line` covering topics from Chapter 30:

| ID | Title | Description / Chapter Section |
| :--- | :--- | :--- |
| `sweep-line-intersections` | **Sweep Line Segment Intersections** | Section 30.1 — Active set segment sweep line intersection test |
| `closest-pair-of-points` | **Closest Pair of Points via Sweep Line** | Section 30.2 — Active candidate strip sweep line for min distance $d$ |
| `convex-hull` | **Convex Hull (Monotone Chain)** | Section 30.3 — Andrew's monotone chain upper/lower hull construction |

---

## 3. Missing Questions & Implementation Roadmap

The following sweep line algorithms are missing from the current registry and are prime candidates for implementation:

### 1. The Skyline Problem (Building Outline Sweep Line)
- **Book Reference**: Section 30.1 ("Intersection points", p. 276–277)
- **Concept**: Sweeping vertical line over building left/right edges while maintaining active heights in a multiset/max-heap to record skyline contour change points in $O(N \log N)$.
- **Matching LeetCode Question**:
  - [LC 218: The Skyline Problem](https://leetcode.com/problems/the-skyline-problem/)

### 2. Rectangle Area Union (Sweep Line + Segment Tree)
- **Book Reference**: Section 30.1 & 30.2 ("Sweep line event processing", p. 275–277)
- **Concept**: Computing total area of union of $N$ axis-aligned rectangles by sweeping vertical event lines and maintaining 1D covered interval length in a segment tree in $O(N \log N)$.
- **Matching LeetCode Question**:
  - [LC 850: Rectangle Area II](https://leetcode.com/problems/rectangle-area-ii/)
