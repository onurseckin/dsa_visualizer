import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_graph_flows_and_cuts_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Flow Network Optimization Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "project-selection-max-profit-min-cut",
      title: "Project Selection Problem via Minimum Cut Energy Minimization",
      difficulty: "Hard",
      rationale:
        "Implement a Maximum Flow / Minimum Cut solver to solve the classic Project Selection Problem: Given $N$ projects with associated revenue (positive values) or cost (negative values) and a set of dependency prerequisites (doing project $A$ requires project $B$), find the subset of projects that maximizes net profit. This requires reduction to minimum $s-t$ cut.",
      starterCode: `/**
 * Project Selection Problem via Minimum Cut
 * @param profits Array of numbers where positive represents revenue and negative represents cost
 * @param dependencies Array of pairs [u, v] meaning project u depends on project v
 * @returns Maximum achievable net profit
 */

export class DinicProjectSelector {
  private n: number;
  private head: Int32Array;
  private next: Int32Array;
  private to: Int32Array;
  private cap: Float64Array;
  private edgeCount: number;
  private level: Int32Array;
  private ptr: Int32Array;
  private queue: Int32Array;

  constructor(totalNodes: number, maxEdges: number = 200000) {
    this.n = totalNodes;
    this.edgeCount = 0;
    const maxE = maxEdges * 2;
    this.head = new Int32Array(totalNodes).fill(-1);
    this.next = new Int32Array(maxE);
    this.to = new Int32Array(maxE);
    this.cap = new Float64Array(maxE);
    this.level = new Int32Array(totalNodes);
    this.ptr = new Int32Array(totalNodes);
    this.queue = new Int32Array(totalNodes);
  }

  public addEdge(u: number, v: number, capacity: number): void {
    const e1 = this.edgeCount++;
    this.to[e1] = v;
    this.cap[e1] = capacity;
    this.next[e1] = this.head[u];
    this.head[u] = e1;

    const e2 = this.edgeCount++;
    this.to[e2] = u;
    this.cap[e2] = 0;
    this.next[e2] = this.head[v];
    this.head[v] = e2;
  }

  private bfs(s: number, t: number): boolean {
    this.level.fill(-1);
    this.level[s] = 0;
    let qHead = 0;
    let qTail = 0;
    this.queue[qTail++] = s;

    while (qHead < qTail) {
      const u = this.queue[qHead++];
      for (let e = this.head[u]; e !== -1; e = this.next[e]) {
        const v = this.to[e];
        if (this.cap[e] > 1e-9 && this.level[v] === -1) {
          this.level[v] = this.level[u] + 1;
          this.queue[qTail++] = v;
        }
      }
    }
    return this.level[t] !== -1;
  }

  private dfs(u: number, t: number, pushed: number): number {
    if (u === t || pushed < 1e-9) return pushed;
    for (let e = this.ptr[u]; e !== -1; e = this.next[e]) {
      this.ptr[u] = e;
      const v = this.to[e];
      const residual = this.cap[e];

      if (this.level[u] + 1 === this.level[v] && residual > 1e-9) {
        const tr = this.dfs(v, t, Math.min(pushed, residual));
        if (tr > 1e-9) {
          this.cap[e] -= tr;
          this.cap[e ^ 1] += tr;
          return tr;
        }
      }
    }
    return 0;
  }

  public computeMaxFlow(s: number, t: number): number {
    let maxFlow = 0;
    while (this.bfs(s, t)) {
      this.ptr.set(this.head);
      while (true) {
        const pushed = this.dfs(s, t, Infinity);
        if (pushed < 1e-9) break;
        maxFlow += pushed;
      }
    }
    return maxFlow;
  }
}

export function solveProjectSelection(
  profits: number[],
  dependencies: [number, number][]
): number {
  const numProjects = profits.length;
  const source = numProjects;
  const sink = numProjects + 1;
  const solver = new DinicProjectSelector(numProjects + 2);

  let totalPositiveRevenue = 0;

  for (let i = 0; i < numProjects; i++) {
    const p = profits[i];
    if (p > 0) {
      totalPositiveRevenue += p;
      solver.addEdge(source, i, p);
    } else if (p < 0) {
      solver.addEdge(i, sink, -p);
    }
  }

  for (const [u, v] of dependencies) {
    // Project u requires project v: edge u -> v with infinite capacity
    solver.addEdge(u, v, Infinity);
  }

  const minCutValue = solver.computeMaxFlow(source, sink);
  return totalPositiveRevenue - minCutValue;
}`,
    },
  ],
};
