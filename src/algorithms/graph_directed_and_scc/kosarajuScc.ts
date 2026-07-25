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
    'Set up the two-pass plan',
    'We find strongly connected components with two DFS sweeps: first we record the order vertices finish on the original graph, then we sweep the reversed graph in that order to peel off one component at a time.',
    undefined,
    'Initialization',
    { nodeCount: currentNodes.length, edgeCount: currentEdges.length }
  );

  // --- PASS 1: Compute post-order finish stack on G ---
  addStep(
    2,
    'Begin Pass 1 DFS on G',
    'We run DFS on the original graph and push each vertex onto a stack the moment it finishes. Vertices that finish late end up on top — exactly the order Pass 2 will want to start from.',
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
      `Visit node '${u}'`,
      `We mark '${u}' as visited and explore its unvisited out-neighbors first — in Pass 1 a vertex only finishes once everything reachable from it is done.`,
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
          `Follow edge '${u}' -> '${v}'`,
          `Neighbor '${v}' hasn't been visited yet, so we dive into it now — '${u}' has to wait for all of its descendants before it can join the finish stack.`,
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
      `Finish '${u}' and push it`,
      `Everything reachable from '${u}' has been explored, so '${u}' is done and goes on the finish stack. The later a vertex finishes, the higher it sits.`,
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
    'Complete Pass 1',
    `The finish order came out as [${[...finishStack].reverse().join(', ')}], top first. The vertex on top finished last, which means its component can reach everything below it — a fact Pass 2 will exploit.`,
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
    'Reverse every edge to build G^T',
    'We flip all the edges. Each SCC survives intact — a cycle reversed is still a cycle — but reachability between components inverts, and that is what will keep the next DFS trapped inside a single component.',
    undefined,
    'Graph Transpose (Reversed Edges)',
    { transposed: true }
  );

  // --- PASS 2: Collect SCCs in reverse finish order ---
  addStep(
    26,
    'Begin Pass 2 on G^T',
    'Now we pop vertices in reverse finish order and DFS on the reversed graph. Starting from the latest finisher, each DFS can only reach vertices in its own component — the reversed edges block every escape route.',
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
      `Add '${u}' to SCC #${sccs.length + 1}`,
      `We reached '${u}' along reversed edges, which means '${u}' can reach this component's root in the original graph — and the finish order guarantees the reverse direction too, so they belong together.`,
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
      `Pop '${u}' from the stack`,
      `We take '${u}' off the top of the finish stack. If it hasn't been claimed by a component yet, it anchors a brand-new SCC; if it has, we simply move on.`,
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
        `Complete SCC #${sccs.length}`,
        `The DFS ran out of reversed edges, so this component is sealed: {${component.join(', ')}}. Every vertex inside it can reach every other one in both directions.`,
        undefined,
        'Pass 2 (Extract SCCs)',
        { sccIndex: sccs.length, members: component.join(', ') }
      );
    }
  }

  addStep(
    32,
    `Finish with ${sccs.length} component(s)`,
    `Every vertex now belongs to exactly one strongly connected component. Two linear DFS sweeps plus one edge reversal did all the work, which is why the whole algorithm runs in O(V + E).`,
    undefined,
    'Complete',
    { sccCount: sccs.length }
  );

  return steps;
};

export const kosarajuScc: AlgorithmDefinition<KosarajuSccInput> = {
  id: 'kosaraju-scc',
  title: "Kosaraju's Strongly Connected Components",
  category: 'graph_directed_and_scc',
  difficulty: 'Hard',
  description:
    'Finds all Strongly Connected Components (SCCs) in a directed graph using Kosaraju\'s two-pass Depth-First Search algorithm with graph transposition. A directed graph is strongly connected if every vertex is reachable from any other vertex. Kosaraju\'s algorithm decomposes the graph into a condensation DAG of maximal strongly connected subgraphs in linear time O(V + E).',
  constraints: [
    '1 <= V <= 500',
    '0 <= E <= 2000',
    'Graph is directed and may contain cycles and self-loops',
  ],
  examples: [
    {
      input: 'Nodes 0..4, Edges: 0->1, 1->2, 2->0, 1->3, 3->4, 4->3',
      output: '2 SCCs: SCC 1 = {0, 1, 2}, SCC 2 = {3, 4}',
      explanation:
        'Vertices 0, 1, 2 form a directed cycle and can reach each other. Vertices 3 and 4 form another 2-node cycle. Edge 1->3 connects the two components in one direction.',
    },
  ],
  code: KOSARAJU_SCC_CODE,
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V + E)',
  complexityAnalysis: {
    time: 'Each of the two DFS passes visits every vertex once and walks every edge once, which is O(V + E) per pass. Transposing the graph also touches each edge exactly once. Two linear sweeps plus one linear transpose is still linear overall — O(V + E) — regardless of how the components are shaped.',
    space: 'We hold adjacency lists for the graph and its transpose, the visited sets, and the finish stack, each proportional to the vertices and edges — O(V + E). The DFS recursion stack can also grow up to V frames on a long path.',
  },
  defaultInput: DEFAULT_KOSARAJU_INPUT,
  generateSteps: generateKosarajuSccSteps,
};
