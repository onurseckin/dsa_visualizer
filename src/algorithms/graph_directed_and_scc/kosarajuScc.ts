import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from '../../types/dsa';

export interface KosarajuSccInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const KOSARAJU_SCC_CODE = `def kosaraju_scc(n, edges):
    # Step 1: First DFS pass to record post-order stack
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

    # Step 2: Second DFS pass on transposed graph
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
    { id: '0', label: '0', x: 120, y: 120, state: 'default' },
    { id: '1', label: '1', x: 260, y: 120, state: 'default' },
    { id: '2', label: '2', x: 120, y: 260, state: 'default' },
    { id: '3', label: '3', x: 400, y: 120, state: 'default' },
    { id: '4', label: '4', x: 400, y: 260, state: 'default' },
  ],
  edges: [
    { from: '0', to: '1' },
    { from: '1', to: '2' },
    { from: '2', to: '0' },
    { from: '1', to: '3' },
    { from: '3', to: '4' },
    { from: '4', to: '3' },
  ],
};

export const generateKosarajuSccSteps = (
  input: KosarajuSccInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const currentNodes: GraphNodeItem[] = input.nodes.map((n) => ({
    ...n,
    state: 'default',
  }));

  let currentEdges: GraphEdgeItem[] = input.edges.map((e) => ({
    ...e,
    isTraversed: false,
    isPath: false,
  }));

  const adj = new Map<string, string[]>();
  const revAdj = new Map<string, string[]>();

  currentNodes.forEach((n) => {
    adj.set(n.id, []);
    revAdj.set(n.id, []);
  });

  currentEdges.forEach((e) => {
    adj.get(e.from)?.push(e.to);
    revAdj.get(e.to)?.push(e.from);
  });

  const finishStack: string[] = [];
  const pass1Visited = new Set<string>();
  const pass2Visited = new Set<string>();
  const sccs: string[][] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeNodeId?: string,
    phaseText: string = 'Pass 1',
    variables: Record<string, string | number | boolean> = {}
  ) => {
    const nodesCopy = currentNodes.map((n) => {
      let state = n.state;
      if (activeNodeId && n.id === activeNodeId) {
        state = 'active';
      }
      return {
        ...n,
        state,
      };
    });

    const sccSummary = sccs.length > 0
      ? sccs.map((comp, idx) => `SCC ${idx + 1}: {${comp.join(', ')}}`).join(' | ')
      : 'None';

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'graph',
        nodes: nodesCopy,
        edges: currentEdges.map((e) => ({ ...e })),
      },
      auxiliaryState: {
        stack: [...finishStack],
        visited: Array.from(phaseText.includes('Pass 2') ? pass2Visited : pass1Visited),
        customState: {
          Phase: phaseText,
          'Finish Stack (Top -> Bottom)': [...finishStack].reverse().join(', ') || 'Empty',
          'SCC Count': String(sccs.length),
          'Discovered SCCs': sccSummary,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Kosaraju's Algorithm",
    "Starting Kosaraju's 2-Pass algorithm for Strongly Connected Components.",
    undefined,
    'Initialization',
    { nodeCount: currentNodes.length, edgeCount: currentEdges.length }
  );

  // --- PASS 1: Compute post-order finish stack on G ---
  addStep(
    2,
    'Pass 1: Start DFS traversal to compute finish order stack',
    'Running DFS on original graph G to record vertices in order of finishing times.',
    undefined,
    'Pass 1 (DFS Finish Stack)'
  );

  const dfs1 = (u: string) => {
    pass1Visited.add(u);
    const nodeObj = currentNodes.find((n) => n.id === u);
    if (nodeObj) {
      nodeObj.state = 'active';
    }

    addStep(
      6,
      `Pass 1: DFS visiting Node '${u}'`,
      `Marked Node '${u}' as visited. Recursively exploring unvisited out-neighbors.`,
      u,
      'Pass 1 (DFS Finish Stack)',
      { current: u }
    );

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      const edge = currentEdges.find((e) => e.from === u && e.to === v);
      if (edge) edge.isTraversed = true;

      if (!pass1Visited.has(v)) {
        addStep(
          8,
          `Pass 1: Traverse edge '${u}' -> '${v}'`,
          `Neighbor '${v}' is unvisited. Recurse into '${v}'.`,
          v,
          'Pass 1 (DFS Finish Stack)',
          { from: u, to: v }
        );
        dfs1(v);
      }
    }

    finishStack.push(u);
    if (nodeObj) {
      nodeObj.state = 'in-stack';
    }

    addStep(
      10,
      `Pass 1: Node '${u}' finished. Pushed to finish stack.`,
      `All outgoing edges from '${u}' processed. Added '${u}' to stack. Current stack size: ${finishStack.length}.`,
      u,
      'Pass 1 (DFS Finish Stack)',
      { current: u, stackSize: finishStack.length }
    );
  };

  for (const node of currentNodes) {
    if (!pass1Visited.has(node.id)) {
      dfs1(node.id);
    }
  }

  addStep(
    14,
    'Pass 1 Complete! All vertices processed.',
    `Finish stack computed: [${[...finishStack].reverse().join(', ')}].`,
    undefined,
    'Pass 1 (Complete)',
    { stackSize: finishStack.length }
  );

  // --- STEP 2: Transpose Graph ---
  currentEdges = currentEdges.map((e) => ({
    from: e.to,
    to: e.from,
    isTraversed: false,
    isPath: false,
  }));

  addStep(
    16,
    'Transpose Graph G -> G^T',
    'Reversed all edge directions to form the transposed graph G^T.',
    undefined,
    'Graph Transpose (Reversed Edges)',
    { transposed: true }
  );

  // --- PASS 2: Collect SCCs in reverse finish order ---
  addStep(
    18,
    'Pass 2: Pop nodes from stack and run DFS on G^T',
    'Vertices with higher finish times are processed first to extract Strongly Connected Components.',
    undefined,
    'Pass 2 (Extract SCCs)'
  );

  const dfs2 = (u: string, component: string[]) => {
    pass2Visited.add(u);
    component.push(u);
    const nodeObj = currentNodes.find((n) => n.id === u);
    if (nodeObj) {
      nodeObj.state = 'compare';
    }

    addStep(
      20,
      `Pass 2: Adding Node '${u}' to SCC #${sccs.length + 1}`,
      `Node '${u}' is reachable in G^T. Appended to current component.`,
      u,
      'Pass 2 (Extract SCCs)',
      { current: u, componentSize: component.length }
    );

    const revNeighbors = revAdj.get(u) || [];
    for (const v of revNeighbors) {
      const edge = currentEdges.find((e) => e.from === u && e.to === v);
      if (edge) edge.isTraversed = true;

      if (!pass2Visited.has(v)) {
        dfs2(v, component);
      }
    }
  };

  while (finishStack.length > 0) {
    const u = finishStack.pop()!;

    addStep(
      27,
      `Pass 2: Pop Node '${u}' from stack`,
      `Checking if Node '${u}' has been visited in Pass 2.`,
      u,
      'Pass 2 (Extract SCCs)',
      { popped: u }
    );

    if (!pass2Visited.has(u)) {
      const component: string[] = [];
      dfs2(u, component);
      sccs.push(component);

      component.forEach((nodeId) => {
        const nodeObj = currentNodes.find((n) => n.id === nodeId);
        if (nodeObj) {
          nodeObj.state = 'sorted';
          nodeObj.val = sccs.length;
        }
      });

      addStep(
        31,
        `Pass 2: Discovered SCC #${sccs.length}: {${component.join(', ')}}`,
        `Successfully extracted Strongly Connected Component #${sccs.length} containing ${component.length} vertex/vertices.`,
        undefined,
        'Pass 2 (Extract SCCs)',
        { sccIndex: sccs.length, members: component.join(', ') }
      );
    }
  }

  addStep(
    32,
    `Kosaraju SCC Complete! Found ${sccs.length} Strongly Connected Component(s).`,
    `All vertices grouped into SCCs. Graph decomposition complete.`,
    undefined,
    'Complete',
    { sccCount: sccs.length }
  );

  return steps;
};

export const kosarajuScc: AlgorithmDefinition<KosarajuSccInput> = {
  id: 'kosaraju-scc',
  title: 'Kosaraju\'s Strongly Connected Components',
  category: 'graph_directed_and_scc',
  difficulty: 'Hard',
  description:
    'Finds all Strongly Connected Components (SCCs) in a directed graph using Kosaraju\'s two-pass Depth-First Search algorithm with graph transposition.',
  code: KOSARAJU_SCC_CODE,
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V + E)',
  defaultInput: DEFAULT_KOSARAJU_INPUT,
  generateSteps: generateKosarajuSccSteps,
};
