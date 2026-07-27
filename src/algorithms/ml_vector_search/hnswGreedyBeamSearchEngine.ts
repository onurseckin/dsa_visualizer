import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

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
    """
    Executes HNSW layer beam search (SEARCH-LAYER algorithm).
    Traverses graph using min-heap candidate queue and max-heap result queue of size ef_search.
    """
    v0_dist = l2_distance(query, node_vectors[entry_node])
    
    visited = {entry_node}
    # candidates: min-heap of (dist, node_id)
    candidates = [(v0_dist, entry_node)]
    # results: max-heap of (-dist, node_id) to track top ef_search nearest nodes
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
    Math.sqrt(v1.reduce((sum, val, idx) => sum + (val - v2[idx]) ** 2, 0));

  const entryDist = l2Dist(query, nodeVectors[entryNode]);
  const visited = new Set<number>([entryNode]);
  // candidate array of { dist, node } sorted ascending
  let candidates = [{ dist: entryDist, node: entryNode }];
  // results array sorted ascending by dist
  let results = [{ dist: entryDist, node: entryNode }];

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: `Initialize HNSW Layer Beam Search at Entry Node ${entryNode}`,
      why: `Query vector [${query.join(", ")}], beam search size efSearch = ${efSearch}. Entry node ${entryNode} dist = ${entryDist.toFixed(
        3,
      )}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Object.keys(nodeVectors).map((nIdStr) => {
        const nId = Number(nIdStr);
        const isEntry = nId === entryNode;
        return {
          id: `node-${nId}`,
          value: nId,
          label: `N${nId} (${isEntry ? entryDist.toFixed(2) : "?"})`,
          state: isEntry ? ("active" as ElementState) : ("default" as ElementState),
          pointers: isEntry ? ["Entry"] : [],
        };
      }),
    },
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
    // Pop min candidate
    candidates.sort((a, b) => a.dist - b.dist);
    const curr = candidates.shift()!;
    const furthestResultDist = Math.max(...results.map((r) => r.dist));

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 20,
      explanation: {
        what: `Pop Closest Candidate Node N${curr.node} (dist=${curr.dist.toFixed(3)})`,
        why: `Comparing candidate distance ${curr.dist.toFixed(
          3,
        )} against current worst beam result distance ${furthestResultDist.toFixed(3)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: Object.keys(nodeVectors).map((nIdStr) => {
          const nId = Number(nIdStr);
          const inResults = results.some((r) => r.node === nId);
          const isCurr = nId === curr.node;

          return {
            id: `node-${nId}`,
            value: nId,
            label: `N${nId}`,
            state: isCurr
              ? ("active" as ElementState)
              : inResults
                ? ("sorted" as ElementState)
                : visited.has(nId)
                  ? ("visited" as ElementState)
                  : ("default" as ElementState),
            pointers: isCurr ? ["Active"] : inResults ? ["In Beam"] : [],
          };
        }),
      },
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
        codeLine: 23,
        explanation: {
          what: "Early Exit: Candidate distance exceeds furthest beam result",
          why: `Candidate N${curr.node} distance (${curr.dist.toFixed(
            3,
          )}) > worst beam distance (${furthestResultDist.toFixed(3)}). Graph search terminated.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: results.map((r) => ({
            id: `node-${r.node}`,
            value: r.node,
            label: `N${r.node} (${r.dist.toFixed(2)})`,
            state: "sorted" as ElementState,
            pointers: ["Final Top-K"],
          })),
        },
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
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        const neighborDist = l2Dist(query, nodeVectors[neighbor]);
        const currentWorstDist = Math.max(...results.map((r) => r.dist));

        if (neighborDist < currentWorstDist || results.length < efSearch) {
          candidates.push({ dist: neighborDist, node: neighbor });
          results.push({ dist: neighborDist, node: neighbor });
          results.sort((a, b) => a.dist - b.dist);
          if (results.length > efSearch) {
            results.pop(); // remove worst
          }

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 31,
            explanation: {
              what: `Explore Neighbor N${neighbor} (dist=${neighborDist.toFixed(3)}) -> Added to Beam`,
              why: `Distance ${neighborDist.toFixed(
                3,
              )} qualifies for beam size ${efSearch}. Updated candidate queue and top results.`,
            },
            primarySnapshot: {
              kind: "array",
              elements: Object.keys(nodeVectors).map((nIdStr) => {
                const nId = Number(nIdStr);
                const isNeighbor = nId === neighbor;
                const inResults = results.some((r) => r.node === nId);

                return {
                  id: `node-${nId}`,
                  value: nId,
                  label: `N${nId} (${nId === neighbor ? neighborDist.toFixed(2) : ""})`,
                  state: isNeighbor
                    ? ("highlighted" as ElementState)
                    : inResults
                      ? ("sorted" as ElementState)
                      : visited.has(nId)
                        ? ("visited" as ElementState)
                        : ("default" as ElementState),
                  pointers: isNeighbor ? ["Added to Beam"] : [],
                };
              }),
            },
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
        }
      }
    }
  }

  // Final Step: Complete
  results.sort((a, b) => a.dist - b.dist);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 38,
    explanation: {
      what: `HNSW Layer Beam Search Complete: Retained Top ${results.length} Nodes`,
      why: `Final nearest neighbors: [${results
        .map((r) => `N${r.node} (dist=${r.dist.toFixed(3)})`)
        .join(", ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: results.map((r, rank) => ({
        id: `node-${r.node}`,
        value: r.node,
        label: `Rank ${rank + 1}: N${r.node} (dist=${r.dist.toFixed(3)})`,
        state: "sorted" as ElementState,
        pointers: rank === 0 ? ["Nearest Neighbor"] : [],
      })),
    },
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
  id: "hnswGreedyBeamSearchEngine",
  title: "HNSW Greedy Beam Search (SEARCH-LAYER)",
  category: "ml_vector_search",
  categories: ["ml_vector_search", "graph_traversal"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_vector_search",
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
