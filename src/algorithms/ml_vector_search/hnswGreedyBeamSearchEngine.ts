import {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
} from "../../types/dsa";

export interface HnswGreedyBeamSearchEngineInput {
  query: number[];
  entryNode: number;
  efSearch: number;
  graph: Record<number, number[]>;
  nodeVectors: Record<number, number[]>;
}

export const DEFAULT_HNSW_GREEDY_BEAM_SEARCH_INPUT: HnswGreedyBeamSearchEngineInput = {
  query: [1.0, 1.0],
  entryNode: 0,
  efSearch: 3,
  graph: {
    0: [1, 2],
    1: [0, 3, 4],
    2: [0, 4, 5],
    3: [1],
    4: [1, 2, 5],
    5: [2, 4],
  },
  nodeVectors: {
    0: [0.0, 0.0],
    1: [0.5, 0.8],
    2: [0.8, 0.2],
    3: [0.9, 1.1],
    4: [1.1, 0.9],
    5: [1.5, 0.4],
  },
};

export const HNSW_GREEDY_BEAM_SEARCH_CODE = `import heapq
import math

def l2_distance(v1: list[float], v2: list[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(v1, v2)))

def hnsw_greedy_beam_search(query: list[float], entry_node: int, ef_search: int, graph: dict, node_vectors: dict) -> list[tuple[float, int]]:
    v0_dist = l2_distance(query, node_vectors[entry_node])
    visited = {entry_node}
    candidates = [(v0_dist, entry_node)]
    results = [(-v0_dist, entry_node)]

    while candidates:
        curr_dist, curr_node = heapq.heappop(candidates)
        furthest_result_dist = -results[0][0]

        if curr_dist > furthest_result_dist:
            break

        for neighbor in graph.get(curr_node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                neighbor_dist = l2_distance(query, node_vectors[neighbor])
                furthest_result_dist = -results[0][0]

                if neighbor_dist < furthest_result_dist or len(results) < ef_search:
                    heapq.heappush(candidates, (neighbor_dist, neighbor))
                    heapq.heappush(results, (-neighbor_dist, neighbor))
                    if len(results) > ef_search:
                        heapq.heappop(results)

    top_k = [(-dist, node) for dist, node in results]
    top_k.sort(key=lambda x: x[0])
    return top_k`;

export const generateHnswGreedyBeamSearchSteps = (
  input: HnswGreedyBeamSearchEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { query, entryNode, efSearch, graph, nodeVectors } = input;
  let stepIndex = 0;

  const l2Dist = (v1: number[], v2: number[]) =>
    Math.sqrt(v1.reduce((sum, val, idx) => sum + (val - (v2[idx] ?? 0)) ** 2, 0));

  const entryDist = l2Dist(query, nodeVectors[entryNode] ?? [0, 0]);
  const visited = new Set<number>([entryNode]);
  const computedDistances: Record<number, number> = { [entryNode]: entryDist };
  let candidates = [{ dist: entryDist, node: entryNode }];
  let results = [{ dist: entryDist, node: entryNode }];

  const buildGraphSnapshot = (
    activeNodeId?: number,
    evaluatingNeighborId?: number,
    activeEdge?: { from: number; to: number },
  ): GraphVisualSnapshot => {
    const nodeIds = Object.keys(nodeVectors).map(Number);

    const nodes: GraphNodeItem[] = nodeIds.map((nId) => {
      const vec = nodeVectors[nId] ?? [0, 0];
      const distToQuery = computedDistances[nId];
      const distStr = distToQuery !== undefined ? distToQuery.toFixed(2) : "?";
      const isInResults = results.some((r) => r.node === nId);
      const isCandidate = candidates.some((c) => c.node === nId);

      let state: ElementState = "default";
      if (nId === activeNodeId) {
        state = "active";
      } else if (nId === evaluatingNeighborId) {
        state = "compare";
      } else if (isInResults) {
        state = "sorted";
      } else if (isCandidate) {
        state = "queued";
      } else if (visited.has(nId)) {
        state = "visited";
      }

      return {
        id: String(nId),
        label: `N${nId} (${distStr})`,
        val: nId,
        x: vec[0] ?? 0,
        y: vec[1] ?? 0,
        state,
      };
    });

    const edgeList: GraphEdgeItem[] = [];
    const addedEdges = new Set<string>();

    for (const uStr of Object.keys(graph)) {
      const u = Number(uStr);
      const neighbors = graph[u] || [];
      for (const v of neighbors) {
        const edgeKey = u < v ? `${u}-${v}` : `${v}-${u}`;
        if (!addedEdges.has(edgeKey)) {
          addedEdges.add(edgeKey);

          const isCurrentEdge =
            (activeEdge?.from === u && activeEdge?.to === v) ||
            (activeEdge?.from === v && activeEdge?.to === u);
          const isBothVisited = visited.has(u) && visited.has(v);
          const isBothResults =
            results.some((r) => r.node === u) && results.some((r) => r.node === v);

          const v1 = nodeVectors[u];
          const v2 = nodeVectors[v];
          const edgeWeight = v1 && v2 ? Math.round(l2Dist(v1, v2) * 100) / 100 : undefined;

          edgeList.push({
            from: String(u),
            to: String(v),
            weight: edgeWeight,
            isTraversed: isCurrentEdge || isBothVisited,
            isPath: isBothResults,
          });
        }
      }
    }

    return {
      kind: "graph",
      nodes,
      edges: edgeList,
    };
  };

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: `Initialize HNSW Layer Beam Search at Entry Node N${entryNode}`,
      why: `Query vector [${query.join(", ")}], beam search size efSearch = ${efSearch}. Entry node N${entryNode} distance = ${entryDist.toFixed(
        3,
      )}.`,
    },
    primarySnapshot: buildGraphSnapshot(entryNode),
    auxiliaryState: {
      customState: {
        visited: Array.from(visited).join(", "),
        candidates: candidates.map((c) => `N${c.node}:${c.dist.toFixed(2)}`).join(", "),
        results: results.map((r) => `N${r.node}:${r.dist.toFixed(2)}`).join(", "),
        efSearch: String(efSearch),
        phase: "Initialization",
      },
    },
    variables: { entryNode, entryDist: Math.round(entryDist * 100) / 100, efSearch },
  });

  while (candidates.length > 0) {
    candidates.sort((a, b) => a.dist - b.dist);
    const curr = candidates.shift()!;
    const furthestResultDist = Math.max(...results.map((r) => r.dist));

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 14,
      explanation: {
        what: `Pop Closest Candidate Node N${curr.node} (dist=${curr.dist.toFixed(3)})`,
        why: `Comparing candidate distance ${curr.dist.toFixed(
          3,
        )} against current worst beam result distance ${furthestResultDist.toFixed(3)}.`,
      },
      primarySnapshot: buildGraphSnapshot(curr.node),
      auxiliaryState: {
        customState: {
          currNode: `N${curr.node}`,
          currDist: curr.dist.toFixed(3),
          furthestResultDist: furthestResultDist.toFixed(3),
          candidates: candidates.map((c) => `N${c.node}:${c.dist.toFixed(2)}`).join(", "),
          results: results.map((r) => `N${r.node}:${r.dist.toFixed(2)}`).join(", "),
        },
      },
      variables: { currNode: curr.node, currDist: Math.round(curr.dist * 100) / 100 },
    });

    if (curr.dist > furthestResultDist) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 18,
        explanation: {
          what: "Early Exit: Candidate distance exceeds furthest beam result",
          why: `Candidate N${curr.node} distance (${curr.dist.toFixed(
            3,
          )}) > worst beam distance (${furthestResultDist.toFixed(3)}). Graph search terminated.`,
        },
        primarySnapshot: buildGraphSnapshot(curr.node),
        auxiliaryState: {
          customState: {
            status: "Early exit condition met",
            finalResults: results.map((r) => `N${r.node}:${r.dist.toFixed(2)}`).join(", "),
          },
        },
        variables: { terminated: true },
      });
      break;
    }

    const neighbors = graph[curr.node] || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) {
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 21,
          explanation: {
            what: `Skip Already Visited Neighbor N${neighbor}`,
            why: `Neighbor N${neighbor} is already in visited set. Skipping traversal.`,
          },
          primarySnapshot: buildGraphSnapshot(curr.node, neighbor, {
            from: curr.node,
            to: neighbor,
          }),
          auxiliaryState: {
            customState: {
              currNode: `N${curr.node}`,
              neighbor: `N${neighbor}`,
              status: "Already visited",
              candidates: candidates.map((c) => `N${c.node}:${c.dist.toFixed(2)}`).join(", "),
              results: results.map((r) => `N${r.node}:${r.dist.toFixed(2)}`).join(", "),
            },
          },
          variables: { currNode: curr.node, neighbor, skipped: true },
        });
        continue;
      }

      visited.add(neighbor);
      const neighborDist = l2Dist(query, nodeVectors[neighbor] ?? [0, 0]);
      computedDistances[neighbor] = neighborDist;
      const currentWorstDist = Math.max(...results.map((r) => r.dist));

      if (neighborDist < currentWorstDist || results.length < efSearch) {
        candidates.push({ dist: neighborDist, node: neighbor });
        results.push({ dist: neighborDist, node: neighbor });
        results.sort((a, b) => a.dist - b.dist);
        if (results.length > efSearch) {
          results.pop();
        }

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 27,
          explanation: {
            what: `Explore Neighbor N${neighbor} (dist=${neighborDist.toFixed(3)}) -> Added to Beam`,
            why: `Distance ${neighborDist.toFixed(
              3,
            )} qualifies for beam size ${efSearch}. Updated candidate queue and top results.`,
          },
          primarySnapshot: buildGraphSnapshot(curr.node, neighbor, {
            from: curr.node,
            to: neighbor,
          }),
          auxiliaryState: {
            customState: {
              neighbor: `N${neighbor}`,
              neighborDist: neighborDist.toFixed(3),
              action: "Inserted into beam",
              candidates: candidates.map((c) => `N${c.node}:${c.dist.toFixed(2)}`).join(", "),
              results: results.map((r) => `N${r.node}:${r.dist.toFixed(2)}`).join(", "),
            },
          },
          variables: { neighbor, neighborDist: Math.round(neighborDist * 100) / 100 },
        });
      } else {
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 26,
          explanation: {
            what: `Evaluate Neighbor N${neighbor} (dist=${neighborDist.toFixed(3)}) -> Pruned`,
            why: `Distance ${neighborDist.toFixed(
              3,
            )} >= worst beam result distance (${currentWorstDist.toFixed(3)}) and beam is full (efSearch=${efSearch}). Neighbor is pruned.`,
          },
          primarySnapshot: buildGraphSnapshot(curr.node, neighbor, {
            from: curr.node,
            to: neighbor,
          }),
          auxiliaryState: {
            customState: {
              neighbor: `N${neighbor}`,
              neighborDist: neighborDist.toFixed(3),
              action: "Pruned (not added to beam)",
              candidates: candidates.map((c) => `N${c.node}:${c.dist.toFixed(2)}`).join(", "),
              results: results.map((r) => `N${r.node}:${r.dist.toFixed(2)}`).join(", "),
            },
          },
          variables: { neighbor, neighborDist: Math.round(neighborDist * 100) / 100, pruned: true },
        });
      }
    }
  }

  results.sort((a, b) => a.dist - b.dist);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 34,
    explanation: {
      what: `HNSW Layer Beam Search Complete: Retained Top ${results.length} Nodes`,
      why: `Final nearest neighbors: [${results
        .map((r) => `N${r.node} (dist=${r.dist.toFixed(3)})`)
        .join(", ")}].`,
    },
    primarySnapshot: buildGraphSnapshot(),
    auxiliaryState: {
      customState: {
        finalNodes: results.map((r) => `N${r.node}`).join(", "),
        finalDistances: results.map((r) => r.dist.toFixed(3)).join(", "),
        status: "Completed",
      },
    },
    variables: { nearestNode: results[0]?.node ?? -1, complete: true },
  });

  return steps;
};

export const hnswGreedyBeamSearchEngine: AlgorithmDefinition<HnswGreedyBeamSearchEngineInput> = {
  id: "hnsw-greedy-beam-search-engine",
  title: "HNSW Greedy Beam Search (SEARCH-LAYER)",
  topicIds: ["ml_vector_search", "graph_traversal"],
  difficulty: "Hard",
  description:
    "Executes the core HNSW layer traversal algorithm (SEARCH-LAYER, Malkov & Yashunin). Maintained by a priority queue beam of size `efSearch`, greedy graph exploration routes candidate queries through small-world proximity networks in logarithmic O(log N) time.\n\nInput Format:\n- query: D-dimensional query embedding vector.\n- entryNode: Node ID to begin layer graph search.\n- efSearch: Beam search capacity priority queue size.\n- graph: Adjacency list map `node -> [neighborNodes]`.\n- nodeVectors: Dictionary mapping node ID to vector embedding.\n\nOutput Format:\n- Returns sorted list of (distance, nodeId) tuples of size <= efSearch.\n\nEdge Cases & Constraints:\n- Disconnected graph components: Search is bounded by current connected component.\n- Small efSearch: Extremely fast, lower recall.\n- Large efSearch: Slower search, approaches exact kNN precision.",
  constraints: ["entryNode must exist in graph and nodeVectors.", "efSearch >= 1."],
  examples: [
    {
      kind: "basic",
      title: "Standard Beam Search Traversal",
      inputDisplay: "query = [1.0, 1.0], entryNode = 0, efSearch = 3",
      outputDisplay: "Top Nodes: N4 (dist=0.141), N3 (dist=0.141), N1 (dist=0.539)",
      input: DEFAULT_HNSW_GREEDY_BEAM_SEARCH_INPUT,
      output: "[N4, N3, N1]",
      explanation:
        "Greedy graph traversal explores neighbors of N0, routing towards target [1.0, 1.0].",
    },
    {
      kind: "complex",
      title: "Narrow Beam Search (efSearch = 1)",
      inputDisplay: "query = [1.0, 1.0], entryNode = 0, efSearch = 1",
      outputDisplay: "Top Node: N4",
      input: {
        ...DEFAULT_HNSW_GREEDY_BEAM_SEARCH_INPUT,
        efSearch: 1,
      },
      output: "[N4]",
      explanation: "Pure greedy 1-best hill climbing search.",
    },
    {
      kind: "negative",
      title: "Isolated Single Node Graph",
      inputDisplay: "entryNode = 0, no neighbors",
      outputDisplay: "[N0]",
      input: {
        query: [1.0, 1.0],
        entryNode: 0,
        efSearch: 3,
        graph: { 0: [] },
        nodeVectors: { 0: [0.0, 0.0] },
      },
      output: "[N0]",
      explanation: "Single entry node terminates immediately.",
    },
  ],
  defaultInput: DEFAULT_HNSW_GREEDY_BEAM_SEARCH_INPUT,
  code: HNSW_GREEDY_BEAM_SEARCH_CODE,
  timeComplexity: {
    best: "O(log N)",
    average: "O(efSearch * M * log N)",
    worst: "O(N * M)",
  },
  spaceComplexity: "O(efSearch + V)",
  complexityAnalysis: {
    time: "O(efSearch * M * log N) average search time where M is average degree per node and N is total vectors.",
    space:
      "O(efSearch + V) to maintain min-heap candidate queue, max-heap result queue, and visited set V.",
  },
  topicGuide: {
    overview:
      "Hierarchical Navigable Small World (HNSW) graphs (Malkov & Yashunin 2018) are the industry standard algorithm for approximate nearest neighbor (ANN) search, powering engines like Pinecone, Milvus, Qdrant, and FAISS HNSW32. Search-Layer implements greedy priority-queue beam search across small-world Delaunay graph approximations.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "The Search-Layer algorithm maintains two priority queues: `C` (min-heap of unvisited candidate nodes sorted by distance) and `W` (max-heap of top `ef` closest nodes discovered so far). At each iteration, the closest node in `C` is popped; if its distance exceeds the worst node in `W`, search terminates.",
      },
      {
        heading: "Systems & Performance Impact",
        body: "HNSW search performance depends on memory cache efficiency. Because graph pointer dereferencing involves non-contiguous memory lookups, production systems pre-pack node vector payloads alongside neighbor IDs to minimize DRAM line misses.",
      },
      {
        heading: "Implementation Nuances & Hyperparameters",
        body: "`efSearch` directly trades off QPS (queries per second) vs Recall@K. Increasing `efSearch` expands beam coverage, discovering non-local shortcuts at the cost of additional distance calculations.",
      },
    ],
    keyTerms: [
      {
        term: "HNSW (Hierarchical Navigable Small World)",
        definition:
          "Multi-layer graph structure combining skip-list long-range highways with dense proximity graphs.",
      },
      {
        term: "efSearch",
        definition: "Hyperparameter specifying candidate beam queue capacity during vector search.",
      },
      {
        term: "Small-World Network",
        definition:
          "A graph topology where most nodes are not neighbors, but neighbors of any given node are likely to be connected.",
      },
    ],
  },
  sources: [
    { type: "ml_infra", kind: "ml_infra", label: "HNSW Original Paper (Malkov & Yashunin)" },
  ],
  generateSteps: generateHnswGreedyBeamSearchSteps,
};
