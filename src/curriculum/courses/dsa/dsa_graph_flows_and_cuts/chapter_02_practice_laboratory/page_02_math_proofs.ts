import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_graph_flows_and_cuts_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Complexity Proofs",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Edmonds-Karp Monotonic Shortest Path Distance Lemma",
      theorem:
        "Let $f$ be a flow in $G = (V, E)$ and let $f'$ be the flow after augmenting along a shortest path in $G_f$. For all vertices $v \\in V$, the shortest path distance in the unweighted residual graph satisfies $\\delta_{f'}(s, v) \\ge \\delta_f(s, v)$. Furthermore, the total number of augmentations across the entire algorithm is bounded by $O(V \\cdot E)$, yielding total runtime $O(V E^2)$.",
      proof: `
**Proof of Monotonicity:**
1. Assume for contradiction that there exists a non-empty set of vertices whose distance from $s$ decreases. Let $v$ be a vertex in this set that minimizes $\\delta_{f'}(s, v)$, so $\\delta_{f'}(s, v) < \\delta_f(s, v)$.
2. Let $u$ be the predecessor of $v$ on a shortest path from $s$ to $v$ in $G_{f'}$, so $(u, v) \\in E_{f'}$ and $\\delta_{f'}(s, v) = \\delta_{f'}(s, u) + 1$.
3. By the minimal choice of $v$, vertex $u$ does not have a decreased distance: $\\delta_{f'}(s, u) \\ge \\delta_f(s, u)$.
4. We analyze the status of edge $(u, v)$ in the previous residual graph $G_f$:
   - **Case 1: $(u, v) \\in E_f$.** Then $\\delta_f(s, v) \\le \\delta_f(s, u) + 1 \\le \\delta_{f'}(s, u) + 1 = \\delta_{f'}(s, v)$, which directly contradicts $\\delta_{f'}(s, v) < \\delta_f(s, v)$.
   - **Case 2: $(u, v) \\notin E_f$.** For $(u, v)$ to appear in $G_{f'}$, the augmenting path must have pushed flow along reverse edge $(v, u) \\in E_f$. Because Edmonds-Karp augments along shortest paths, $(v, u)$ was on a shortest path in $G_f$, meaning $\\delta_f(s, u) = \\delta_f(s, v) + 1$.
   - Combining inequalities: $\\delta_f(s, v) = \\delta_f(s, u) - 1 \\le \\delta_{f'}(s, u) - 1 = (\\delta_{f'}(s, v) - 1) - 1 = \\delta_{f'}(s, v) - 2 < \\delta_{f'}(s, v)$, which also contradicts our initial assumption.
5. In all cases, no vertex distance can decrease. Thus $\\delta_{f'}(s, v) \\ge \\delta_f(s, v)$ for all $v \\in V$.

**Proof of $O(V \\cdot E)$ Augmentation Bound:**
1. An edge $(u, v)$ is critical in an augmenting path if it bottlenecks the augmentation ($c_f(u, v) = \\delta$). When $(u, v)$ becomes critical, it disappears from $G_{f'}$.
2. At the moment $(u, v)$ becomes critical, $\\delta_f(s, v) = \\delta_f(s, u) + 1$.
3. For $(u, v)$ to become critical again in a later phase, flow must first be pushed in the reverse direction $(v, u)$, at which point the distance to $u$ satisfies $\\delta_{f''}(s, u) = \\delta_{f''}(s, v) + 1 \\ge \\delta_f(s, v) + 1 = \\delta_f(s, u) + 2$.
4. Thus, each time $(u, v)$ becomes critical, the distance from $s$ to $u$ must increase by at least $2$.
5. Since the maximum distance in simple paths is $|V| - 1$, each of the $2|E|$ residual edges can become critical at most $|V| / 2$ times.
6. Total critical augmentations $\\le |E| \\cdot |V| = O(V E)$. Since each BFS takes $O(E)$ time, overall runtime is strictly $O(V E^2)$. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Dinic's Algorithm Level Graph Layering Invariant",
      theorem:
        "In Dinic's Algorithm, the level of the sink $t$ strictly increases after each phase: $\\text{Level}_{i+1}(t) > \\text{Level}_i(t)$. Consequently, the algorithm executes at most $|V|-1$ phases, achieving an overall complexity of $O(V^2 E)$ on general networks and $O(E \\sqrt{V})$ on unit networks.",
      proof: `
**Proof of Strict Level Increase:**
1. In phase $i$, a level graph $L_i$ is constructed via BFS such that edges exist only between adjacent layers ($L_i(v) = L_i(u) + 1$).
2. The phase pushes a *blocking flow* $f_{block}$, meaning every directed path from $s$ to $t$ in $L_i$ contains at least one saturated edge with zero residual capacity.
3. In the new residual graph $G_{f'}$, any new edges created must be reverse edges pointing backwards from layer $k+1$ to layer $k$ (or within the same layer).
4. Therefore, any path from $s$ to $t$ in $G_{f'}$ must either:
   - Use at least one reverse edge (which increases the path length by at least 2), or
   - Traverse layers not present in $L_i$.
5. Hence, the shortest path distance in $G_{f'}$ must be strictly greater than in $G_f$: $\\text{Level}_{i+1}(t) > \\text{Level}_i(t)$.
6. Since $\\text{Level}(t) \\le |V|-1$, the number of phases is at most $|V|-1$.
7. Within each phase, DFS with current-arc pointer advances or retreats along edges. Each DFS step either advances an arc, pushes flow to saturate an arc (at most $|E|$ times), or retreats and permanently discards an arc. Total work per phase is $O(V \\cdot E)$.
8. Multiplying $|V|$ phases by $O(V E)$ work per phase yields $O(V^2 E)$ total complexity. $\\blacksquare$
      `,
    },
  ],
};
