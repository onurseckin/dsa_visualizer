import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from '../../types/dsa';
import type { TriviaMeta } from '../../types/trivia';

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

const KOSARAJU_SCC_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: 'Entry point: takes the vertex count and edge list of a directed graph and will return its strongly connected components.',
    2: 'Documents the purpose of the first sweep: not to find components yet, just to compute an ordering the second pass will exploit.',
    3: "Tracks vertices seen during pass 1, kept separate from pass 2's visited set so the two sweeps never interfere with each other.",
    4: 'Will collect vertices in the order they finish exploring — later-finishing vertices end up on top, exactly what pass 2 needs to start from.',
    5: 'A depth-first search on the original graph whose only job is to record finish order, not to detect components.',
    6: "Marks u seen before recursing into its neighbors, so a cycle can't send this recursion into an infinite loop.",
    7: "Explores every out-neighbor of u in the original graph's adjacency list.",
    8: 'Only recurses into neighbors not yet explored, avoiding redundant work and infinite loops.',
    9: 'Recurses first, so u can only finish after everything reachable from it has already finished.',
    10: 'Pushes u onto the stack the moment it finishes — exactly the post-order that puts upstream vertices on top.',
    12: 'Sweeps every vertex to make sure disconnected pieces of the graph get their own DFS too.',
    13: 'Only launches a fresh DFS from vertices no prior call has already reached.',
    14: "Starts pass 1 from this unvisited vertex, extending the finish-order stack to cover its whole reachable region.",
    16: 'Marks the transition to the phase that actually extracts components, using the finish order and the reversed graph together.',
    17: "Resets visited tracking for pass 2 — reusing pass 1's set here would make the second sweep do nothing, since everything would already look visited.",
    18: 'Will collect each discovered strongly connected component as its own list of vertices.',
    19: 'A depth-first search on the transposed (edge-reversed) graph that collects every vertex it reaches into one component.',
    20: "Marks u claimed by the component currently being built, using pass 2's own visited set.",
    21: 'Adds u to the SCC currently under construction.',
    22: "Walks u's neighbors in the reversed graph — reachability here corresponds to backward reachability in the original graph.",
    23: 'Skips any vertex already claimed by this or an earlier component.',
    24: 'Recurses to pull v into the same component; the reversed edges keep this search fenced inside one true SCC.',
    26: 'Processes vertices in reverse finish order — last-finished first — which is what guarantees each restart lands on an unclaimed component root.',
    27: 'Pops the top of the finish stack, the latest-finishing vertex still remaining.',
    28: "Only starts a new component search if u hasn't already been swept into an earlier one.",
    29: 'Opens a fresh, empty component list to be filled by this round of DFS.',
    30: 'Runs the fenced search on the transpose, collecting exactly one full strongly connected component starting from u.',
    31: 'Records the completed component before moving on to the next unclaimed vertex on the stack.',
    32: 'Every vertex has now been assigned to exactly one component — the full SCC decomposition of the graph.',
  },
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
  topicGuide: {
    overview:
      'Strong connectivity asks a sharper question than plain reachability: not whether you can get from u to v, but whether you can get back again. In a directed graph the vertices fall into maximal groups where every member reaches every other member, and those groups are the strongly connected components. Kosaraju\'s algorithm finds all of them with two ordinary depth-first sweeps and one edge reversal, and as a bonus it hands you the condensation — the graph you get by collapsing each component to a single node, which is always acyclic. That is the real payoff, because it lets you run DAG techniques such as topological ordering or longest-path dynamic programming on graphs that were never acyclic to begin with.',
    sections: [
      {
        heading: 'The core idea: components are the maximal cycles',
        body: 'Two vertices belong to the same component exactly when a round trip passes through both of them, and mutual reachability is an equivalence relation, so the components partition the vertices with no overlaps and no leftovers. A vertex that sits on no cycle at all is still a component — one of size one — which is why isolated vertices must never be skipped. Collapse each component to a point and every surviving edge runs from one component to another with no way back, so the condensation is guaranteed to be a directed acyclic graph. Seeing the problem this way reframes it: you are hunting for the maximal cycles, and everything acyclic then arranges itself into a layered hierarchy above and below them.',
      },
      {
        heading: 'How the first pass builds an ordering',
        body: 'The first depth-first search ignores components entirely; all it wants is an order. You walk the original graph, and the moment a vertex has no unexplored outgoing edge left you push it onto a stack, which records its finish time. Because a vertex can only finish after everything still reachable from it has finished, the stack ends up with upstream vertices on top and downstream vertices buried beneath them. This is not a topological order — the graph has cycles, so none exists — but it is exactly the weaker property you need: for any edge running from component C to component C\', some vertex of C finishes later than every vertex of C\'.',
      },
      {
        heading: 'How the second pass peels components off the transpose',
        body: 'Now you reverse every edge to form the transpose, then pop vertices off the finish stack and launch a fresh search from each one you have not yet visited. Anything that search reaches in the transpose is a vertex that could reach your starting vertex in the original graph, and because the stack handed you a vertex from a component with no unvisited predecessors, the only vertices that qualify are the ones that also reach back. The search therefore halts precisely at the component boundary, and the set it collects is one entire component. Mark those vertices, keep popping until you meet another unvisited one, and repeat; each restart peels off the next component in condensation order.',
      },
      {
        heading: 'Why two passes are enough',
        body: 'Correctness rests on the finish-time claim from the first pass, which turns the stack into a topological order of the condensation. Given that order, every root you choose in the second pass comes from a component whose predecessors have already been consumed, and the transpose makes the fence self-sustaining: at the moment you start from root r, every component that could leak into r\'s component through a reversed edge is already visited, so the traversal is boxed in. Both halves are load-bearing. Search the original graph in the second pass and you sweep up entire downstream subgraphs, and pick roots in arbitrary order and separate components fuse into one, so the reported answer is too coarse either way.',
      },
      {
        heading: 'When to reach for Kosaraju versus Tarjan',
        body: 'Kosaraju and Tarjan both decompose a graph in linear time, so the choice is about shape rather than speed. Tarjan finds components during a single traversal using a lowlink value and an on-stack marker, which avoids materialising the transpose and is what you want when memory is tight or the edges come from a stream you cannot cheaply reverse. Kosaraju wins on explainability — two plain depth-first searches with nothing clever inside either of them — which makes it the version worth learning first and the one easiest to reconstruct under pressure. Union-find is not a candidate here, because disjoint-set structures merge symmetric relationships and directed reachability is not symmetric.',
      },
      {
        heading: 'Pitfalls and what the components unlock',
        body: 'The most common bug is sharing one visited set across both passes, which leaves the second pass with nothing to do; each pass needs its own. Next comes draining the finish stack in the wrong direction, since it must be last-finished first, and after that recursion depth, because a graph shaped like a long chain overflows the call stack and wants an explicit stack instead. Self-loops and parallel edges are harmless, and a graph with no edges simply yields one component per vertex. Once components are labelled you can build the condensation and treat any directed graph as a DAG, which is how counting mutually reachable groups, finding the longest path in a cyclic graph, and 2-SAT all reduce to this one decomposition — a 2-SAT formula is satisfiable exactly when no variable shares a component with its own negation.',
      },
    ],
    keyTerms: [
      {
        term: 'Strongly connected component',
        definition:
          'A maximal set of vertices in which every vertex can reach every other vertex by following edge directions. Maximal matters: you cannot add another vertex without breaking the mutual-reachability property.',
      },
      {
        term: 'Transpose graph',
        definition:
          'The same vertex set with every edge direction flipped. Reachability in the transpose is exactly backwards reachability in the original, which is what lets the second pass fence a component in.',
      },
      {
        term: 'Finish time',
        definition:
          'The moment a depth-first search finishes exploring a vertex, after all of its outgoing edges have been examined. Pushing vertices onto a stack in finish order is how the first pass encodes the component ordering.',
      },
      {
        term: 'Condensation',
        definition:
          'The graph obtained by contracting each strongly connected component into one node. It is always acyclic, so it lets you apply DAG algorithms to graphs full of cycles.',
      },
      {
        term: 'Mutual reachability',
        definition:
          'The relation that holds between u and v when a directed path runs both ways between them. Because it is reflexive, symmetric, and transitive, it partitions the vertices into components rather than merely grouping some of them.',
      },
    ],
  },
  trivia: KOSARAJU_SCC_TRIVIA,
  defaultInput: DEFAULT_KOSARAJU_INPUT,
  generateSteps: generateKosarajuSccSteps,
};
