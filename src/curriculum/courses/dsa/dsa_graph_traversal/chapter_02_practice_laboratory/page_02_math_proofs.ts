import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_graph_traversal_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Tarjan's Strongly Connected Components Correctness Theorem (Tarjan 1972)",
      theorem:
        "In Tarjan's Low-Link DFS algorithm, a vertex $u$ satisfies $low[u] = dfn[u]$ if and only if $u$ is the root (earliest discovered vertex) of a maximal Strongly Connected Component (SCC). Furthermore, all vertices belonging to $u$'s SCC reside contiguously at the top of the DFS stack and are extracted by popping down to $u$.",
      proof: `
**Proof via Subtree Reachability & Stack Invariant:**
1. Let $C$ be a strongly connected component in directed graph $G = (V, E)$.
2. Let $r \\in C$ be the first vertex in $C$ discovered during DFS (so $dfn[r] = \\min_{v \\in C} dfn[v]$). We call $r$ the **root** of component $C$.
3. **Reachability within DFS Subtree:**
   - For every vertex $v \\in C$, there exists a path from $r$ to $v$ within $C$.
   - By the **White Path Theorem**, at discovery time $dfn[r]$, all other vertices in $C$ are unvisited (white). Therefore, all vertices in $C$ become descendants of $r$ in the DFS spanning tree: $C \\subseteq \\text{Subtree}(r)$.
4. **No Escape from $C$ to Earlier Stack Nodes:**
   - By definition of SCC, no vertex $v \\in C$ can reach any vertex $w$ that can reach $r$ unless $w \\in C$.
   - Since $r$ is the earliest discovered vertex in $C$, no vertex in $C$ can have an edge to an active stack vertex with $dfn < dfn[r]$.
   - Therefore, $low[r] = dfn[r]$.
5. **Strict Lower Low-Link for Non-Root Vertices:**
   - For every vertex $v \\in C \\setminus \\{r\\}$, there is a path from $v$ back to $r$.
   - Following this path up the tree or via back-edges to ancestors of $v$ ensures that $v$ reaches an ancestor with $dfn \\le dfn[r] < dfn[v]$.
   - Thus, $low[v] \\le dfn[r] < dfn[v]$, meaning $low[v] < dfn[v]$ for all non-root vertices.
6. **Stack Isolation Invariant:**
   - When DFS post-order traversal finishes exploring all edges of root $r$, all descendant SCCs within $\\text{Subtree}(r)$ that do not contain $r$ have already satisfied $low = dfn$ and were popped from the stack.
   - The remaining vertices on the stack above $r$ are precisely all vertices in $C$.
   - Popping the stack until $r$ is removed extracts the exact maximal component $C$ in strictly $\\Theta(V + E)$ time. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: The White Path Theorem for DFS Spanning Forests (CLRS)",
      theorem:
        "In a Depth-First Search forest of a graph $G = (V, E)$ (directed or undirected), vertex $v$ is a descendant of vertex $u$ in the DFS tree if and only if at time $d[u]$ (when $u$ is discovered), there exists a path from $u$ to $v$ consisting entirely of white (unvisited) vertices.",
      proof: `
**Proof in Two Directions:**
1. **Direction 1 (Descendant $\\implies$ White Path):**
   - Suppose $v$ is a descendant of $u$ in the DFS forest.
   - Let $u = v_0 \\to v_1 \\to \\dots \\to v_k = v$ be the simple path of tree edges connecting $u$ to $v$.
   - For each tree edge $(v_i, v_{i+1})$, vertex $v_{i+1}$ is discovered during the recursive exploration of $v_i$, so $d[u] < d[v_1] < \\dots < d[v_k] = d[v]$.
   - Therefore, at time $d[u]$, every vertex $v_i$ ($1 \\le i \\le k$) is undiscovered (white).
   - The tree path itself is a path consisting entirely of white vertices at time $d[u]$.
2. **Direction 2 (White Path $\\implies$ Descendant):**
   - Suppose at time $d[u]$, there exists a path $P$ from $u$ to $v$ of all-white vertices.
   - Assume for contradiction that $v$ does not become a descendant of $u$.
   - By the Parenthesis Theorem, since $v$ is white at time $d[u]$, either $v$ becomes a descendant of $u$, or $d[v] > f[u]$.
   - If $d[v] > f[u]$, let $w$ be the first vertex on path $P$ that is not a descendant of $u$, and let $p$ be its predecessor on $P$ (so $p$ is a descendant of $u$, possibly $p = u$).
   - Since $p$ is a descendant of $u$, $d[u] \\le d[p] < f[p] \\le f[u]$.
   - Because $(p, w)$ is an edge and $w$ was white at time $d[u] \\le d[p]$, $w$ must be discovered before $p$ finishes: $d[w] < f[p] \\le f[u]$.
   - Since $w$ is discovered after $u$ ($d[w] > d[u]$) and before $u$ finishes ($d[w] < f[u]$), the Parenthesis Theorem forces $w$ to be a descendant of $u$, contradicting our choice of $w$.
   - Therefore, $v$ must be a descendant of $u$. $\\blacksquare$
      `,
    },
  ],
};
