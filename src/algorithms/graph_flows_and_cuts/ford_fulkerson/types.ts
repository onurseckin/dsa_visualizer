export interface FordFulkersonInput {
  nodes: string[];
  edges: { from: string; to: string; capacity: number }[];
  source: string;
  sink: string;
}

export const FORD_FULKERSON_CODE = `def ford_fulkerson(nodes, edges, source, sink):
    capacity = {}
    for u, v, cap in edges:
        capacity[(u, v)] = capacity.get((u, v), 0) + cap
    for u, v, _ in edges:
        capacity.setdefault((v, u), 0)
    flow = {edge: 0 for edge in capacity}

    def dfs(u, target, visited, current_flow):
        if u == target:
            return current_flow
        visited.add(u)
        for (u_node, v_node), cap in capacity.items():
            if u_node == u and v_node not in visited:
                res_cap = cap - flow[(u_node, v_node)]
                if res_cap > 0:
                    bottleneck = dfs(v_node, target, visited, min(current_flow, res_cap))
                    if bottleneck > 0:
                        flow[(u_node, v_node)] += bottleneck
                        flow[(v_node, u_node)] -= bottleneck
                        return bottleneck
        return 0

    max_flow = 0
    while True:
        visited = set()
        pushed = dfs(source, sink, visited, float('inf'))
        if pushed == 0:
            break
        max_flow += pushed

    return max_flow`;

export const DEFAULT_FORD_FULKERSON_INPUT: FordFulkersonInput = {
  nodes: ["S", "A", "B", "T"],
  edges: [
    { from: "S", to: "A", capacity: 10 },
    { from: "S", to: "B", capacity: 10 },
    { from: "A", to: "B", capacity: 2 },
    { from: "A", to: "T", capacity: 10 },
    { from: "B", to: "T", capacity: 10 },
  ],
  source: "S",
  sink: "T",
};

export const DEFAULT_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  S: { x: 80, y: 190 },
  A: { x: 260, y: 80 },
  B: { x: 260, y: 300 },
  T: { x: 440, y: 190 },
};
