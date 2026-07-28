import {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
} from "../../types/dsa";

export interface HnswMultiLayerProbabilisticGraphInput {
  query: number[];
  topLayer: number;
  entryPoint: number;
  layers: Record<number, { graph: Record<number, number[]> }>;
  nodeVectors: Record<number, number[]>;
}

export const DEFAULT_HNSW_MULTI_LAYER_GRAPH_INPUT: HnswMultiLayerProbabilisticGraphInput = {
  query: [1.0, 1.0],
  topLayer: 2,
  entryPoint: 0,
  layers: {
    2: { graph: { 0: [5] } },
    1: { graph: { 0: [2, 5], 2: [0, 5], 5: [0, 2] } },
    0: {
      graph: {
        0: [1, 2],
        1: [0, 3, 4],
        2: [0, 4, 5],
        3: [1],
        4: [1, 2, 5],
        5: [2, 4],
      },
    },
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

export const HNSW_MULTI_LAYER_GRAPH_CODE = `import math

def l2_distance(v1: list[float], v2: list[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(v1, v2)))

def hnsw_top_down_routing(query: list[float], top_layer: int, entry_point: int, layers: dict, node_vectors: dict) -> tuple[int, list[tuple[int, int]]]:
    curr_node = entry_point
    routing_path = []

    for l in range(top_layer, 0, -1):
        layer_graph = layers[l]["graph"]
        changed = True

        while changed:
            changed = False
            curr_dist = l2_distance(query, node_vectors[curr_node])
            neighbors = layer_graph.get(curr_node, [])

            for nxt in neighbors:
                nxt_dist = l2_distance(query, node_vectors[nxt])
                if nxt_dist < curr_dist:
                    curr_node = nxt
                    curr_dist = nxt_dist
                    changed = True

        routing_path.append((l, curr_node))

    return curr_node, routing_path`;

function buildGraphSnapshot(
  nodeVectors: Record<number, number[]>,
  layers: Record<number, { graph: Record<number, number[]> }>,
  currentLayer: number,
  currNode: number,
  nxtNode: number | null = null,
  traversedEdgesSet: Set<string> = new Set(),
  routingPathNodes: Set<number> = new Set(),
): GraphVisualSnapshot {
  const layerGraph = layers[currentLayer]?.graph || {};

  const nodes: GraphNodeItem[] = Object.keys(nodeVectors).map((nIdStr) => {
    const nId = Number(nIdStr);
    const vec = nodeVectors[nId];
    const x = vec && vec.length >= 2 ? Math.round(vec[0] * 160 + 60) : undefined;
    const y = vec && vec.length >= 2 ? Math.round(vec[1] * 160 + 60) : undefined;

    let state: ElementState = "default";
    if (nId === currNode) {
      state = "active";
    } else if (nId === nxtNode) {
      state = "compare";
    } else if (routingPathNodes.has(nId)) {
      state = "visited";
    }

    return {
      id: String(nId),
      label: `N${nId}`,
      x,
      y,
      state,
      val: nId,
    };
  });

  const edges: GraphEdgeItem[] = [];
  const edgeDrawn = new Set<string>();

  for (const [srcStr, neighbors] of Object.entries(layerGraph)) {
    const src = Number(srcStr);
    for (const tgt of neighbors) {
      const edgeKey = `${src}->${tgt}`;
      const revKey = `${tgt}->${src}`;
      if (!edgeDrawn.has(edgeKey)) {
        edgeDrawn.add(edgeKey);
        edgeDrawn.add(revKey);

        const isTraversed = traversedEdgesSet.has(edgeKey) || traversedEdgesSet.has(revKey);

        edges.push({
          from: String(src),
          to: String(tgt),
          isTraversed,
          isPath: isTraversed,
        });
      }
    }
  }

  return {
    kind: "graph",
    nodes,
    edges,
  };
}

export const generateHnswMultiLayerGraphSteps = (
  input: HnswMultiLayerProbabilisticGraphInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { query, topLayer, entryPoint, layers, nodeVectors } = input;
  let stepIndex = 0;

  const l2Dist = (v1: number[], v2: number[]) =>
    Math.sqrt(v1.reduce((sum, val, idx) => sum + (val - v2[idx]) ** 2, 0));

  let currNode = entryPoint;
  let currDist = l2Dist(query, nodeVectors[currNode] || [0, 0]);
  const path: { layer: number; node: number; dist: number }[] = [];
  const routingPathNodes = new Set<number>();
  const traversedEdgesSet = new Set<string>();

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Initialize Top-Down HNSW Multi-Layer Routing at Layer ${topLayer}`,
      why: `Routing query vector [${query.join(", ")}] starting from entry point N${entryPoint} at top sparse express highway layer ${topLayer}. Initial distance: ${currDist.toFixed(3)}.`,
    },
    primarySnapshot: buildGraphSnapshot(
      nodeVectors,
      layers,
      topLayer,
      currNode,
      null,
      traversedEdgesSet,
      routingPathNodes,
    ),
    auxiliaryState: {
      customState: {
        topLayer: String(topLayer),
        entryPoint: `N${entryPoint}`,
        query: `[${query.join(", ")}]`,
        currNode: `N${currNode}`,
        currDist: currDist.toFixed(3),
        phase: "Initialization",
      },
    },
    variables: { topLayer, currNode, currDist: Math.round(currDist * 1000) / 1000 },
  });

  for (let l = topLayer; l >= 1; l--) {
    const layerGraph = layers[l]?.graph || {};

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Begin Greedy Search at Skip-Graph Layer ${l}`,
        why: `Routing from current local minimum N${currNode} (dist=${currDist.toFixed(3)}) within sparse Layer ${l} graph structure.`,
      },
      primarySnapshot: buildGraphSnapshot(
        nodeVectors,
        layers,
        l,
        currNode,
        null,
        traversedEdgesSet,
        routingPathNodes,
      ),
      auxiliaryState: {
        customState: {
          currentLayer: String(l),
          currNode: `N${currNode}`,
          currDist: currDist.toFixed(3),
          layerGraphNodes: Object.keys(layerGraph)
            .map((n) => `N${n}`)
            .join(", "),
        },
      },
      variables: { l, currNode, currDist: Math.round(currDist * 1000) / 1000 },
    });

    let changed = true;

    while (changed) {
      changed = false;
      currDist = l2Dist(query, nodeVectors[currNode]);
      const neighbors = layerGraph[currNode] || [];

      if (neighbors.length > 0) {
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 17,
          explanation: {
            what: `Inspect Neighbors of N${currNode} at Layer ${l}: [${neighbors.map((n) => `N${n}`).join(", ")}]`,
            why: `Fetching outgoing graph edges from current local minimum N${currNode} to evaluate distance improvements.`,
          },
          primarySnapshot: buildGraphSnapshot(
            nodeVectors,
            layers,
            l,
            currNode,
            null,
            traversedEdgesSet,
            routingPathNodes,
          ),
          auxiliaryState: {
            customState: {
              currentLayer: String(l),
              currNode: `N${currNode}`,
              neighborsCount: String(neighbors.length),
              neighborsList: neighbors.map((n) => `N${n}`).join(", "),
            },
          },
          variables: { l, currNode, neighborCount: neighbors.length },
        });
      }

      for (const nxt of neighbors) {
        const nxtDist = l2Dist(query, nodeVectors[nxt]);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 20,
          explanation: {
            what: `Evaluate Candidate Neighbor N${nxt} (dist=${nxtDist.toFixed(3)}) vs Best N${currNode} (dist=${currDist.toFixed(3)})`,
            why: `Comparing L2 distance of candidate neighbor N${nxt} (${nxtDist.toFixed(3)}) against current best node N${currNode} (${currDist.toFixed(3)}).`,
          },
          primarySnapshot: buildGraphSnapshot(
            nodeVectors,
            layers,
            l,
            currNode,
            nxt,
            traversedEdgesSet,
            routingPathNodes,
          ),
          auxiliaryState: {
            customState: {
              currentLayer: String(l),
              currNode: `N${currNode}`,
              candidateNode: `N${nxt}`,
              currDist: currDist.toFixed(3),
              nxtDist: nxtDist.toFixed(3),
            },
          },
          variables: {
            l,
            currNode,
            nxt,
            currDist: Math.round(currDist * 1000) / 1000,
            nxtDist: Math.round(nxtDist * 1000) / 1000,
          },
        });

        if (nxtDist < currDist) {
          const prevNode = currNode;
          const prevDist = currDist;
          currNode = nxt;
          currDist = nxtDist;
          changed = true;
          traversedEdgesSet.add(`${prevNode}->${nxt}`);
          traversedEdgesSet.add(`${nxt}->${prevNode}`);

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 22,
            explanation: {
              what: `Highway Jump: N${prevNode} -> N${nxt} (dist reduced from ${prevDist.toFixed(3)} to ${nxtDist.toFixed(3)})`,
              why: `Candidate neighbor N${nxt} is closer to the query vector. Updating active local best to N${nxt}.`,
            },
            primarySnapshot: buildGraphSnapshot(
              nodeVectors,
              layers,
              l,
              currNode,
              null,
              traversedEdgesSet,
              routingPathNodes,
            ),
            auxiliaryState: {
              customState: {
                currentLayer: String(l),
                jump: `N${prevNode} -> N${nxt}`,
                prevDist: prevDist.toFixed(3),
                newDist: nxtDist.toFixed(3),
              },
            },
            variables: {
              l,
              currNode,
              prevNode,
              currDist: Math.round(currDist * 1000) / 1000,
            },
          });
        } else {
          steps.push({
            stepIndex: stepIndex++,
            codeLine: 21,
            explanation: {
              what: `Reject Neighbor N${nxt} (dist=${nxtDist.toFixed(3)} >= current best ${currDist.toFixed(3)})`,
              why: `Candidate N${nxt} does not improve search distance. Maintaining active node at N${currNode}.`,
            },
            primarySnapshot: buildGraphSnapshot(
              nodeVectors,
              layers,
              l,
              currNode,
              null,
              traversedEdgesSet,
              routingPathNodes,
            ),
            auxiliaryState: {
              customState: {
                currentLayer: String(l),
                rejectedNode: `N${nxt}`,
                currNode: `N${currNode}`,
                currDist: currDist.toFixed(3),
              },
            },
            variables: {
              l,
              currNode,
              rejectedNode: nxt,
            },
          });
        }
      }
    }

    routingPathNodes.add(currNode);
    path.push({ layer: l, node: currNode, dist: currDist });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 26,
      explanation: {
        what: `Layer ${l} Routing Complete: Local Minimum N${currNode} (dist=${currDist.toFixed(3)})`,
        why: `No further distance reduction possible at Layer ${l}. Record N${currNode} as Layer ${l} local entry point and proceed down.`,
      },
      primarySnapshot: buildGraphSnapshot(
        nodeVectors,
        layers,
        l,
        currNode,
        null,
        traversedEdgesSet,
        routingPathNodes,
      ),
      auxiliaryState: {
        customState: {
          currentLayer: String(l),
          layerLocalMin: `N${currNode}`,
          currDist: currDist.toFixed(3),
          routingPathSoFar: path.map((p) => `L${p.layer}:N${p.node}`).join(" -> "),
        },
      },
      variables: { l, currNode, layerMinRecorded: true },
    });
  }

  const finalDist = currDist;

  const finalSnapshot = buildGraphSnapshot(
    nodeVectors,
    layers,
    0,
    currNode,
    null,
    traversedEdgesSet,
    routingPathNodes,
  );
  const entryNodeObj = finalSnapshot.nodes.find((n) => n.id === String(currNode));
  if (entryNodeObj) {
    entryNodeObj.state = "sorted";
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 28,
    explanation: {
      what: `Top-Down Layer Routing Complete: Handoff Node N${currNode} to Layer 0`,
      why: `Successfully completed top-down highway routing across layers ${topLayer} down to 1. Handing off N${currNode} (dist=${finalDist.toFixed(
        3,
      )}) to Layer 0 as the starting entry point for dense beam search.`,
    },
    primarySnapshot: finalSnapshot,
    auxiliaryState: {
      customState: {
        layer0EntryPoint: `N${currNode}`,
        distance: finalDist.toFixed(3),
        routingPath: path.map((p) => `L${p.layer}:N${p.node}`).join(" -> "),
        status: "Completed",
      },
    },
    variables: { layer0EntryPoint: currNode, complete: true },
  });

  return steps;
};

export const hnswMultiLayerProbabilisticGraph: AlgorithmDefinition<HnswMultiLayerProbabilisticGraphInput> =
  {
    id: "hnsw-multi-layer-probabilistic-graph",
    title: "HNSW Multi-Layer Probabilistic Graph Routing",
    topicIds: ["ml_vector_search", "graph_traversal"],
    difficulty: "Hard",
    description:
      "Simulates top-down hierarchical routing in HNSW probabilistic multi-layer skip-graphs. Upper layers contain sparse long-range express highways, while lower layers contain dense local proximity networks. Top-down 1-best routing quickly pinpoints the optimal Layer 0 entry point in O(log N) steps.\n\nInput Format:\n- query: D-dimensional query embedding vector.\n- topLayer: Maximum layer index L_max.\n- entryPoint: Global entry node ID at layer L_max.\n- layers: Dictionary of layer graph structures.\n- nodeVectors: Dictionary mapping node ID to vector embedding.\n\nOutput Format:\n- Returns tuple (layer0EntryPoint, routingPath).\n\nEdge Cases & Constraints:\n- Single layer graph (L_max = 0): Skips top-down routing, entering Layer 0 directly.",
    constraints: [
      "topLayer >= 1 for multi-layer routing.",
      "entryPoint must exist in top layer graph.",
    ],
    examples: [
      {
        kind: "basic",
        title: "Top-Down Highway Routing",
        inputDisplay: "topLayer = 2, entryPoint = 0",
        outputDisplay: "Layer 0 Entry Node: N5",
        input: DEFAULT_HNSW_MULTI_LAYER_GRAPH_INPUT,
        output: "N5",
        explanation:
          "Routes from N0 at Layer 2 to N5, passing down to Layer 0 with optimal initial entry point.",
      },
      {
        kind: "complex",
        title: "Multi-Hop Skip Routing",
        inputDisplay: "topLayer = 2, starting at far origin N0",
        outputDisplay: "Layer 0 Entry Node: N2",
        input: {
          ...DEFAULT_HNSW_MULTI_LAYER_GRAPH_INPUT,
          query: [0.8, 0.2],
        },
        output: "N2",
        explanation: "Highway routing lands directly at N2 near target coordinates.",
      },
      {
        kind: "negative",
        title: "Direct Layer 1 Match",
        inputDisplay: "query at exact entry node coordinates",
        outputDisplay: "Layer 0 Entry Node: N0",
        input: {
          ...DEFAULT_HNSW_MULTI_LAYER_GRAPH_INPUT,
          query: [0.0, 0.0],
        },
        output: "N0",
        explanation: "Query matches top entry node perfectly, staying at N0.",
      },
    ],
    defaultInput: DEFAULT_HNSW_MULTI_LAYER_GRAPH_INPUT,
    code: HNSW_MULTI_LAYER_GRAPH_CODE,
    timeComplexity: {
      best: "O(log N)",
      average: "O(log N)",
      worst: "O(log N)",
    },
    spaceComplexity: "O(L_max)",
    complexityAnalysis: {
      time: "O(log N) total routing steps across L_max layers, as upper layers decay node density exponentially.",
      space: "O(L_max) auxiliary space to record top-down layer routing history.",
    },
    topicGuide: {
      overview:
        "HNSW's core innovation is adapting 1D probabilistic skip-lists (Pugh, 1990) to multi-dimensional spatial graphs. Each inserted node is randomly assigned a maximum layer l = floor(-ln(unif) * mL). Upper layers (high l) act as fast spatial highways with low node density, guiding search to the right neighborhood before dropping down to dense bottom layers.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Node layer assignment follows an exponential probability distribution P(l) = exp(-l / mL), ensuring the fraction of nodes present at layer l decreases exponentially with rate mL = 1 / ln(M).",
        },
        {
          heading: "Systems & Performance Impact",
          body: "Top-down routing replaces costly full-dataset linear scans with a logarithmic traversal, reducing candidate evaluations from millions to dozens per query.",
        },
        {
          heading: "Implementation Nuances & Entry Point Handoff",
          body: "In C++/FAISS implementations, global entry point `enterpoint_node` is updated atomically whenever a newly inserted node attains a higher layer level than the current maximum.",
        },
      ],
      keyTerms: [
        {
          term: "Skip-Graph",
          definition:
            "A multi-layer graph data structure extending skip-lists to spatial proximity networks.",
        },
        {
          term: "Layer Level (l)",
          definition: "The highest graph layer in which a node participates.",
        },
        {
          term: "Highway Routing",
          definition:
            "Coarse-grained greedy search on upper graph layers to navigate across large spatial distances.",
        },
      ],
    },
    sources: [
      { type: "ml_infra", kind: "ml_infra", label: "HNSW Multi-Layer Skip Graph Architecture" },
    ],
    generateSteps: generateHnswMultiLayerGraphSteps,
  };
