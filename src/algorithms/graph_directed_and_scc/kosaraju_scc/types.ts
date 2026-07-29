import { GraphEdgeItem, GraphNodeItem } from "../../../types/dsa";

export interface KosarajuSccInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const KOSARAJU_SCC_CODE = `def kosaraju_scc(n, edges):
    adj = [[] for _ in range(n)]
    rev_adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        rev_adj[v].append(u)

    visited = set()
    stack = []
    def dfs1(u):
        visited.add(u)
        for v in adj[u]:
            if v not in visited:
                dfs1(v)
        stack.append(u)

    for i in range(n):
        if i not in visited:
            dfs1(i)

    visited.clear()
    sccs = []
    def dfs2(u, component):
        visited.add(u)
        component.append(u)
        for v in rev_adj[u]:
            if v not in visited:
                dfs2(v, component)

    while stack:
        u = stack.pop()
        if u not in visited:
            component = []
            dfs2(u, component)
            sccs.append(component)
    return sccs`;

export const DEFAULT_KOSARAJU_INPUT: KosarajuSccInput = {
  nodes: [
    { id: "0", label: "0", x: 120, y: 120, state: "default" },
    { id: "1", label: "1", x: 260, y: 120, state: "default" },
    { id: "2", label: "2", x: 120, y: 260, state: "default" },
    { id: "3", label: "3", x: 400, y: 120, state: "default" },
    { id: "4", label: "4", x: 400, y: 260, state: "default" },
  ],
  edges: [
    { from: "0", to: "1" },
    { from: "1", to: "2" },
    { from: "2", to: "0" },
    { from: "1", to: "3" },
    { from: "3", to: "4" },
    { from: "4", to: "3" },
  ],
};
