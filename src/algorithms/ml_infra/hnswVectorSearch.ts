import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface HnswNode {
  id: string;
  vector: [number, number];
  layerNeighbors: Record<number, string[]>;
}

export interface HnswVectorSearchInput {
  nodes: HnswNode[];
  query: [number, number];
  entryPointId: string;
  maxLayer: number;
  efSearch: number;
}

export const HNSW_VECTOR_SEARCH_CODE = `import math

def euclidean_dist(v1: list[float], v2: list[float]) -> float:
    return math.sqrt((v1[0] - v2[0])**2 + (v1[1] - v2[1])**2)

def hnsw_search_layer(
    nodes: dict[str, dict],
    query: list[float],
    entry_id: str,
    max_layer: int,
    ef: int
) -> list[str]:
    curr_id = entry_id

    for level in range(max_layer, 0, -1):
        changed = True
        while changed:
            changed = False
            curr_dist = euclidean_dist(query, nodes[curr_id]["vector"])
            neighbors = nodes[curr_id]["layers"].get(level, [])
            for nbr in neighbors:
                d = euclidean_dist(query, nodes[nbr]["vector"])
                if d < curr_dist:
                    curr_dist = d
                    curr_id = nbr
                    changed = True

    candidates = [curr_id]
    w_set = [curr_id]
    visited = {curr_id}

    while candidates:
        curr_candidate = candidates.pop(0)
        c_dist = euclidean_dist(query, nodes[curr_candidate]["vector"])
        furthest_w_dist = max(euclidean_dist(query, nodes[w]["vector"]) for w in w_set)

        if c_dist > furthest_w_dist:
            break

        for nbr in nodes[curr_candidate]["layers"].get(0, []):
            if nbr not in visited:
                visited.add(nbr)
                d_nbr = euclidean_dist(query, nodes[nbr]["vector"])
                if d_nbr < furthest_w_dist or len(w_set) < ef:
                    candidates.append(nbr)
                    w_set.append(nbr)
                    w_set.sort(key=lambda x: euclidean_dist(query, nodes[x]["vector"]))
                    if len(w_set) > ef:
                        w_set.pop()

    return w_set`;

export const DEFAULT_HNSW_VECTOR_SEARCH_INPUT: HnswVectorSearchInput = {
  nodes: [
    {
      id: "N0",
      vector: [10, 10],
      layerNeighbors: { 1: ["N1"], 0: ["N1", "N2"] },
    },
    {
      id: "N1",
      vector: [25, 25],
      layerNeighbors: { 1: ["N0", "N3"], 0: ["N0", "N3", "N4"] },
    },
    {
      id: "N2",
      vector: [12, 12],
      layerNeighbors: { 0: ["N0", "N3"] },
    },
    {
      id: "N3",
      vector: [45, 45],
      layerNeighbors: { 1: ["N1"], 0: ["N1", "N2", "N4"] },
    },
    {
      id: "N4",
      vector: [48, 50],
      layerNeighbors: { 0: ["N1", "N3"] },
    },
  ],
  query: [46, 49],
  entryPointId: "N0",
  maxLayer: 1,
  efSearch: 2,
};

function euclideanDist(v1: [number, number], v2: [number, number]): number {
  return Math.sqrt((v1[0] - v2[0]) ** 2 + (v1[1] - v2[1]) ** 2);
}

export const generateHnswVectorSearchSteps = (input: HnswVectorSearchInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nodeMap = new Map<string, HnswNode>();
  input.nodes.forEach((n) => nodeMap.set(n.id, n));

  const getGraphSnapshot = (
    currentLayer: number,
    activeId?: string,
    visitedSet: Set<string> = new Set(),
    wSet: string[] = [],
  ) => {
    const graphNodes: GraphNodeItem[] = input.nodes.map((n) => {
      const dist = euclideanDist(input.query, n.vector);
      let state: GraphNodeItem["state"] = "default";
      if (n.id === activeId) {
        state = "active";
      } else if (wSet.includes(n.id)) {
        state = "sorted";
      } else if (visitedSet.has(n.id)) {
        state = "visited";
      }

      // Map 2D vector coordinates to screen layout coordinates
      const screenX = 100 + n.vector[0] * 8;
      const screenY = 80 + n.vector[1] * 6;

      return {
        id: n.id,
        label: `${n.id} [${n.vector[0]},${n.vector[1]}]\nd=${dist.toFixed(1)}`,
        x: screenX,
        y: screenY,
        state,
        val: Math.round(dist),
      };
    });

    const graphEdges: GraphEdgeItem[] = [];
    input.nodes.forEach((n) => {
      const neighbors = n.layerNeighbors[currentLayer] || [];
      neighbors.forEach((nbrId) => {
        if (n.id < nbrId) {
          graphEdges.push({
            from: n.id,
            to: nbrId,
            isTraversed: visitedSet.has(n.id) || visitedSet.has(nbrId),
          });
        }
      });
    });

    return {
      kind: "graph" as const,
      nodes: graphNodes,
      edges: graphEdges,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentLayer: number,
    activeId?: string,
    visitedSet: Set<string> = new Set(),
    wSet: string[] = [],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getGraphSnapshot(currentLayer, activeId, visitedSet, wSet),
      auxiliaryState: {
        customState: {
          query: `[${input.query.join(", ")}]`,
          currentLayer: String(currentLayer),
          entryPoint: input.entryPointId,
          beamSet: wSet.join(", "),
        },
      },
      variables,
    });
  };

  addStep(
    13,
    "Initialize HNSW Graph Multi-Layer Beam Search",
    `Target Query vector: [${input.query.join(
      ", ",
    )}]. Entry point at top layer ${input.maxLayer}: '${input.entryPointId}'. efSearch=${input.efSearch}.`,
    { queryX: input.query[0], queryY: input.query[1], maxLayer: input.maxLayer },
    input.maxLayer,
    input.entryPointId,
  );

  let currId = input.entryPointId;
  const entryNode = nodeMap.get(currId);
  let currDist = entryNode ? euclideanDist(input.query, entryNode.vector) : Infinity;

  // Upper layers greedy routing
  for (let level = input.maxLayer; level > 0; level--) {
    let changed = true;
    addStep(
      15,
      `Enter Layer ${level} Greedy Search`,
      `Routing greedily through layer ${level} graph to find closest entry point for layer ${level - 1}.`,
      { level, currId, currDist: Number(currDist.toFixed(2)) },
      level,
      currId,
    );

    while (changed) {
      changed = false;
      const nodeObj = nodeMap.get(currId);
      const neighbors = nodeObj?.layerNeighbors[level] || [];

      for (const nbrId of neighbors) {
        const nbrNode = nodeMap.get(nbrId);
        if (nbrNode) {
          const d = euclideanDist(input.query, nbrNode.vector);
          if (d < currDist) {
            addStep(
              24,
              `Greedy hop at Layer ${level}: '${currId}' -> '${nbrId}' (dist ${currDist.toFixed(
                1,
              )} -> ${d.toFixed(1)})`,
              `Found closer neighbor '${nbrId}' in layer ${level}. Updating current nearest entry point.`,
              { level, from: currId, to: nbrId, newDist: Number(d.toFixed(2)) },
              level,
              nbrId,
            );
            currDist = d;
            currId = nbrId;
            changed = true;
          }
        }
      }
    }
  }

  // Layer 0 Beam Search
  const visited = new Set<string>([currId]);
  const candidates: string[] = [currId];
  let wSet: string[] = [currId];

  addStep(
    28,
    `Descend to Layer 0 Beam Search with entry point '${currId}'`,
    `Initializing beam candidate pool and nearest result set W (capacity ef=${input.efSearch}) at Layer 0.`,
    { level: 0, entryPointLayer0: currId, ef: input.efSearch },
    0,
    currId,
    visited,
    wSet,
  );

  while (candidates.length > 0) {
    const currCandidate = candidates.shift()!;
    const candidateNode = nodeMap.get(currCandidate);
    const cDist = candidateNode ? euclideanDist(input.query, candidateNode.vector) : Infinity;

    const furthestWNodeId = wSet.reduce((furthest, id) => {
      const fNode = nodeMap.get(furthest);
      const iNode = nodeMap.get(id);
      const fDist = fNode ? euclideanDist(input.query, fNode.vector) : -1;
      const iDist = iNode ? euclideanDist(input.query, iNode.vector) : -1;
      return iDist > fDist ? id : furthest;
    }, wSet[0]);

    const furthestWNode = nodeMap.get(furthestWNodeId);
    const furthestWDist = furthestWNode
      ? euclideanDist(input.query, furthestWNode.vector)
      : Infinity;

    if (cDist > furthestWDist && wSet.length >= input.efSearch) {
      addStep(
        38,
        `Terminate Beam Search early`,
        `Candidate distance ${cDist.toFixed(
          1,
        )} exceeds furthest neighbor distance ${furthestWDist.toFixed(1)} in beam set W.`,
        {
          currCandidate,
          cDist: Number(cDist.toFixed(2)),
          furthestWDist: Number(furthestWDist.toFixed(2)),
        },
        0,
        currCandidate,
        visited,
        wSet,
      );
      break;
    }

    const currNeighbors = candidateNode?.layerNeighbors[0] || [];
    for (const nbrId of currNeighbors) {
      if (!visited.has(nbrId)) {
        visited.add(nbrId);
        const nbrNode = nodeMap.get(nbrId);
        if (nbrNode) {
          const dNbr = euclideanDist(input.query, nbrNode.vector);
          if (dNbr < furthestWDist || wSet.length < input.efSearch) {
            candidates.push(nbrId);
            wSet.push(nbrId);

            // Sort W by distance ascending
            wSet.sort((a, b) => {
              const nodeA = nodeMap.get(a);
              const nodeB = nodeMap.get(b);
              const dA = nodeA ? euclideanDist(input.query, nodeA.vector) : Infinity;
              const dB = nodeB ? euclideanDist(input.query, nodeB.vector) : Infinity;
              return dA - dB;
            });

            if (wSet.length > input.efSearch) {
              const evicted = wSet.pop();
              addStep(
                49,
                `Insert '${nbrId}' into beam set W (evicted '${evicted}')`,
                `Neighbor '${nbrId}' (dist ${dNbr.toFixed(
                  1,
                )}) is closer than furthest in W. Evicted '${evicted}'.`,
                { inserted: nbrId, evicted: String(evicted), beamSize: wSet.length },
                0,
                nbrId,
                visited,
                wSet,
              );
            } else {
              addStep(
                46,
                `Insert '${nbrId}' into beam set W`,
                `Neighbor '${nbrId}' (dist ${dNbr.toFixed(1)}) added to beam set.`,
                { inserted: nbrId, beamSize: wSet.length },
                0,
                nbrId,
                visited,
                wSet,
              );
            }
          }
        }
      }
    }
  }

  addStep(
    51,
    `HNSW Vector Search Complete: Result set [${wSet.join(", ")}]`,
    `Returned ${wSet.length} nearest neighbor vectors to query [${input.query.join(", ")}].`,
    { resultCount: wSet.length, topMatch: wSet[0] },
    0,
    wSet[0],
    visited,
    wSet,
  );

  return steps;
};

const HNSW_VECTOR_SEARCH_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "if c_dist < furthest_w_dist: break",
    "for level in range(0, max_layer):",
    "w_set.pop(0)",
    "candidates.append(entry_id)",
  ],
  hints: [
    {
      line: 15,
      hint: "Traverse upper layers greedily from max_layer down to 1 to zoom into query neighborhood.",
    },
    {
      line: 28,
      hint: "Switch to multi-candidate beam search at base Layer 0.",
    },
    {
      line: 49,
      hint: "Evict the furthest neighbor when beam search candidate set size exceeds capacity ef.",
    },
  ],
  lineExplanations: {
    6: "Defines HNSW graph multi-layer beam search function.",
    15: "Loops through upper skip-layers from max_layer down to 1.",
    24: "Executes greedy 1-hop routing to minimize distance to query vector.",
    28: "Initializes beam search candidate pool and result set W at Layer 0.",
    38: "Terminates beam search early when candidate distance exceeds worst neighbor in W.",
    49: "Evicts furthest vector from result set W when capacity ef is exceeded.",
    51: "Returns k nearest neighbor vector node IDs.",
  },
};

export const hnswVectorSearch: AlgorithmDefinition<HnswVectorSearchInput> = {
  id: "hnsw-vector-search",
  title: "HNSW Graph Multi-Layer Beam Search",
  topicIds: ["ml_vector_search"],
  difficulty: "Hard",
  description:
    "Performs Approximate Nearest Neighbor (ANN) vector retrieval over a Hierarchical Navigable Small World (HNSW) multi-layer graph via top-layer greedy routing and base-layer beam search.",
  constraints: [
    "len(nodes) >= 1",
    "maxLayer >= 0",
    "efSearch >= 1",
    "query dimension matches vector dimensions",
  ],
  examples: [
    {
      kind: "basic",
      title: "2-Layer HNSW Nearest Neighbor Search",
      inputDisplay: "query = [46, 49], entryPoint = 'N0', efSearch = 2",
      outputDisplay: "['N4', 'N3']",
      input: DEFAULT_HNSW_VECTOR_SEARCH_INPUT,
      output: "['N4', 'N3']",
      explanation:
        "Greedy routing at Layer 1 navigates from N0 (dist 50.3) -> N1 (dist 31.9) -> N3 (dist 4.1). Descending to Layer 0 beam search discovers N4 at [48, 50] with dist 2.2, returning ['N4', 'N3'].",
    },
    {
      kind: "complex",
      title: "Dense Cluster Beam Search with efSearch = 3",
      inputDisplay: "query = [11, 11], entryPoint = 'N0', efSearch = 3",
      outputDisplay: "['N0', 'N2', 'N1']",
      input: {
        ...DEFAULT_HNSW_VECTOR_SEARCH_INPUT,
        query: [11, 11],
        efSearch: 3,
      },
      output: "['N0', 'N2', 'N1']",
      explanation:
        "Target query [11, 11] matches closely with cluster nodes N0 [10, 10] (dist 1.4) and N2 [12, 12] (dist 1.4). Beam search expands W to ef=3 candidates.",
    },
    {
      kind: "negative",
      title: "Isolated Single-Node Graph Search",
      inputDisplay: "single node 'N0' at [10, 10], query = [100, 100]",
      outputDisplay: "['N0']",
      input: {
        nodes: [
          {
            id: "N0",
            vector: [10, 10],
            layerNeighbors: { 0: [] },
          },
        ],
        query: [100, 100],
        entryPointId: "N0",
        maxLayer: 0,
        efSearch: 1,
      },
      output: "['N0']",
      explanation: "Single node graph returns the sole available candidate 'N0'.",
    },
  ],
  code: HNSW_VECTOR_SEARCH_CODE,
  timeComplexity: {
    best: "O(log N)",
    average: "O(log N)",
    worst: "O(ef * M * log N)",
  },
  spaceComplexity: "O(N * M * maxLayer)",
  complexityAnalysis: {
    time: "Hierarchical multi-layer routing reduces search complexity from linear scanning O(N) to logarithmic small-world graph traversal O(log N).",
    space: "Each node maintains up to M outgoing edge links per layer level in memory.",
  },
  topicGuide: {
    overview:
      "Hierarchical Navigable Small World (HNSW) graphs are the state-of-the-art data structure powering vector databases (Faiss, Milvus, Qdrant, Pinecone) for retrieval-augmented generation (RAG) and semantic search. It combines probabilistic skip-list hierarchy with small-world graph routing.",
    sections: [
      {
        heading: "Skip-List Layer Structure",
        body: "Top layers contain sparse long-range links for fast logarithmic zoom into target vector neighborhoods. Lower layers increase link density for fine-grained local cluster navigation.",
      },
      {
        heading: "Beam Search (efSearch Parameter)",
        body: "The efSearch hyperparameter controls the size of the priority queue during base-layer traversal. Higher efSearch increases recall accuracy at the cost of slight search latency.",
      },
    ],
    keyTerms: [
      {
        term: "ANN Vector Search",
        definition:
          "Approximate Nearest Neighbor search that trades marginal recall accuracy for sub-millisecond query performance.",
      },
      {
        term: "efSearch",
        definition:
          "The beam width capacity defining maximum candidate neighbors evaluated during graph traversal.",
      },
    ],
  },
  trivia: HNSW_VECTOR_SEARCH_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_HNSW_VECTOR_SEARCH_INPUT,
  generateSteps: generateHnswVectorSearchSteps,
};
