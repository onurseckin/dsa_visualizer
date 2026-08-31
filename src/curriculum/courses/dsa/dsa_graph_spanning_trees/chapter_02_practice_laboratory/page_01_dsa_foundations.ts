import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_graph_spanning_trees_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Spanning Tree Optimization Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "second-best-minimum-spanning-tree",
      title: "Second-Best Minimum Spanning Tree via Binary Lifting Max-Edge Query",
      difficulty: "Hard",
      rationale:
        "Implement a complete pipeline to compute the strictly Second-Best Minimum Spanning Tree: First, find the baseline MST $T$ using Kruskal's algorithm. Then, preprocess the MST with LCA Binary Lifting to answer the maximum edge weight on any tree path `queryMaxEdge(u, v)` in $O(\\log V)$ time. Finally, iterate over all non-tree edges $e = (u, v) \\notin T$ and compute $\\min_{e \\notin T} (w(T) - \\text{maxEdge}(u, v) + w(e))$.",
      starterCode: `/**
 * Second-Best Minimum Spanning Tree
 */

export interface MSTEdge {
  u: number;
  v: number;
  w: number;
  id: number;
}

export class SecondBestMST {
  private n: number;
  private maxK: number;
  private up: Int32Array;
  private maxEdge: Float64Array;
  private depth: Int32Array;

  constructor(n: number) {
    this.n = n;
    this.maxK = Math.max(1, 32 - Math.clz32(n));
    this.up = new Int32Array(n * this.maxK).fill(-1);
    this.maxEdge = new Float64Array(n * this.maxK).fill(-Infinity);
    this.depth = new Int32Array(n);
  }

  // Preprocess MST for O(log V) maximum edge queries on tree paths
  public buildTreeLCA(adj: [number, number][][], root: number = 0): void {
    const dfs = (u: number, p: number, d: number, edgeW: number) => {
      this.depth[u] = d;
      this.up[u * this.maxK + 0] = p;
      this.maxEdge[u * this.maxK + 0] = edgeW;

      for (let k = 1; k < this.maxK; k++) {
        const parentK = this.up[u * this.maxK + (k - 1)];
        if (parentK !== -1) {
          this.up[u * this.maxK + k] = this.up[parentK * this.maxK + (k - 1)];
          this.maxEdge[u * this.maxK + k] = Math.max(
            this.maxEdge[u * this.maxK + (k - 1)],
            this.maxEdge[parentK * this.maxK + (k - 1)]
          );
        }
      }

      for (const [v, w] of adj[u]) {
        if (v !== p) {
          dfs(v, u, d + 1, w);
        }
      }
    };

    dfs(root, root, 0, 0);
  }

  // Query the maximum edge weight on the unique simple path between u and v in MST
  public queryMaxPathEdge(u: number, v: number): number {
    let maxW = -Infinity;

    if (this.depth[u] < this.depth[v]) {
      const tmp = u;
      u = v;
      v = tmp;
    }

    // Equalize depths
    for (let k = this.maxK - 1; k >= 0; k--) {
      if (this.depth[u] - (1 << k) >= this.depth[v]) {
        maxW = Math.max(maxW, this.maxEdge[u * this.maxK + k]);
        u = this.up[u * this.maxK + k];
      }
    }

    if (u === v) return maxW;

    // Jump together
    for (let k = this.maxK - 1; k >= 0; k--) {
      const upU = this.up[u * this.maxK + k];
      const upV = this.up[v * this.maxK + k];
      if (upU !== upV) {
        maxW = Math.max(maxW, this.maxEdge[u * this.maxK + k], this.maxEdge[v * this.maxK + k]);
        u = upU;
        v = upV;
      }
    }

    // Final hop to LCA
    maxW = Math.max(maxW, this.maxEdge[u * this.maxK + 0], this.maxEdge[v * this.maxK + 0]);
    return maxW;
  }
}

export function solveSecondBestMST(n: number, edges: { u: number; v: number; w: number }[]): number {
  const edgeList: MSTEdge[] = edges.map((e, idx) => ({ ...e, id: idx }));
  edgeList.sort((a, b) => a.w - b.w);

  // Run Kruskal
  const parent = new Int32Array(n);
  for (let i = 0; i < n; i++) parent[i] = i;
  const find = (i: number): number => {
    let r = i;
    while (r !== parent[r]) r = parent[r];
    let c = i;
    while (c !== r) {
      const nxt = parent[c];
      parent[c] = r;
      c = nxt;
    }
    return r;
  };

  let mstWeight = 0;
  const inMST = new Uint8Array(edgeList.length);
  const mstAdj: [number, number][][] = Array.from({ length: n }, () => []);
  let edgesCount = 0;

  for (let i = 0; i < edgeList.length; i++) {
    const { u, v, w } = edgeList[i];
    const ru = find(u);
    const rv = find(v);
    if (ru !== rv) {
      parent[ru] = rv;
      inMST[i] = 1;
      mstWeight += w;
      mstAdj[u].push([v, w]);
      mstAdj[v].push([u, w]);
      edgesCount++;
      if (edgesCount === n - 1) break;
    }
  }

  if (edgesCount !== n - 1) return -1; // Graph disconnected

  // Preprocess MST with Binary Lifting
  const treeLCA = new SecondBestMST(n);
  treeLCA.buildTreeLCA(mstAdj, 0);

  // Evaluate candidate non-tree edges
  let secondBestDiff = Infinity;

  for (let i = 0; i < edgeList.length; i++) {
    if (!inMST[i]) {
      const { u, v, w } = edgeList[i];
      const maxPathEdge = treeLCA.queryMaxPathEdge(u, v);
      // Strictly greater second best
      if (w > maxPathEdge) {
        secondBestDiff = Math.min(secondBestDiff, w - maxPathEdge);
      }
    }
  }

  return secondBestDiff === Infinity ? -1 : mstWeight + secondBestDiff;
}`,
    },
  ],
};
