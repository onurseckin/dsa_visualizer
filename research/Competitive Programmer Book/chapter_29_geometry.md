# Chapter 29: Geometry — Missing Questions & Topic Gap Analysis

> **Source**: *Competitive Programmer's Handbook* (Antti Laaksonen), Chapter 29: Geometry  
> **Target Category**: `geometry_and_sweep_line` ("Geometry & Sweep Line")

---

## 1. Chapter Overview & Subtopics

Chapter 29 covers computational geometry representations, vector operations, polygon area, and distance metrics across 4 main sections:

1. **29.1 Complex Numbers**
   - Representing 2D points $(x,y)$ as complex numbers $x + iy$ or structs
   - Vector Dot Product ($v_1 \cdot v_2 = x_1 x_2 + y_1 y_2 = |v_1| |v_2| \cos \theta$)
   - Vector Cross Product ($v_1 \times v_2 = x_1 y_2 - x_2 y_1 = |v_1| |v_2| \sin \theta$)
   - Vector Rotation using complex multiplication by $e^{i\theta}$

2. **29.2 Points and Lines**
   - Cross product orientation test: Left turn ($>0$), Right turn ($<0$), Collinear ($=0$)
   - Line representations $ax + by = c$, projection of point onto line
   - Line segment intersection test and point-to-line distance

3. **29.3 Polygon Area**
   - **Shoelace Formula**: $\text{Area} = \frac{1}{2} |\sum_{i=1}^n (x_i y_{i+1} - x_{i+1} y_i)|$
   - **Pick's Theorem**: For integer lattice polygons, $\text{Area} = I + B/2 - 1$ where $I$ is interior lattice points and $B$ is boundary lattice points

4. **29.4 Distance Functions**
   - Euclidean distance $L_2 = \sqrt{(x_1-x_2)^2 + (y_1-y_2)^2}$
   - Manhattan distance $L_1 = |x_1-x_2| + |y_1-y_2|$
   - Chebyshev distance $L_\infty = \max(|x_1-x_2|, |y_1-y_2|)$
   - **Manhattan Distance Rotation Trick**: Transforming $(x, y) \to (x+y, x-y)$ converts Manhattan distance to Chebyshev distance $\max(|x'_1 - x'_2|, |y'_1 - y'_2|)$

---

## 2. Currently Implemented in App

The app currently has **2 active algorithms** under `geometry_and_sweep_line` covering topics from Chapter 29:

| ID | Title | Description / Chapter Section |
| :--- | :--- | :--- |
| `line-segment-intersection` | **Line Segment Intersection & Cross Product** | Section 29.2 — Cross product turn orientation & intersection |
| `polygon-area` | **Polygon Area (Shoelace Formula)** | Section 29.3 — Shoelace formula for polygon area |

---

## 3. Missing Questions & Implementation Roadmap

The following computational geometry algorithms are missing from the current registry and are prime candidates for implementation:

### 1. Pick's Theorem (Integer Lattice Polygon Area & Points)
- **Book Reference**: Section 29.3 ("Polygon area", p. 271–272)
- **Concept**: Finding interior lattice points $I$ using Pick's formula $A = I + B/2 - 1$ combined with Shoelace area $A$ and edge $\gcd(\Delta x, \Delta y)$ for boundary points $B$.
- **Matching LeetCode Question**:
  - [LC 1030: Matrix Cells in Distance Order](https://leetcode.com/problems/matrix-cells-in-distance-order/)

### 2. Manhattan Distance Trick (Coordinate Rotation Transformation)
- **Book Reference**: Section 29.4 ("Distance functions", p. 273–274)
- **Concept**: Rotating coordinates by 45° via $(x, y) \to (x+y, x-y)$ to decoupling 2D Manhattan distance into independent 1D max operations.
- **Matching LeetCode Questions**:
  - [LC 1131: Maximum of Absolute Value Expression](https://leetcode.com/problems/maximum-of-absolute-value-expression/)
  - [LC 3102: Minimize Manhattan Distances](https://leetcode.com/problems/minimize-manhattan-distances/)

### 3. Point-in-Polygon Test (Ray Casting Algorithm)
- **Book Reference**: Section 29.2 & 29.3 ("Points and lines & Polygon area", p. 268, 271)
- **Concept**: Ray casting algorithm counting edge intersections of a horizontal ray to check whether a point lies inside a non-convex polygon.
- **Matching LeetCode Question**:
  - [LC 478: Generate Random Point in a Circle](https://leetcode.com/problems/generate-random-point-in-a-circle/)
