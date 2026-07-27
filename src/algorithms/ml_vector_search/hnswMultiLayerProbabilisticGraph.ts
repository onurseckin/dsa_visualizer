import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

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
    """
    Executes top-down routing across HNSW skip-graph layers (Layers L_max down to Layer 1).
    Greedily finds local entry point for Layer 0 using 1-best search at each upper layer.
    """
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

export const generateHnswMultiLayerGraphSteps = (
  input: HnswMultiLayerProbabilisticGraphInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { query, topLayer, entryPoint, layers, nodeVectors } = input;
  let stepIndex = 0;

  const l2Dist = (v1: number[], v2: number[]) =>
    Math.sqrt(v1.reduce((sum, val, idx) => sum + (val - v2[idx]) ** 2, 0));

  let currNode = entryPoint;
  const path: { layer: number; node: number; dist: number }[] = [];

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: `Initialize Top-Down HNSW Multi-Layer Traversal at Layer ${topLayer}`,
      why: `Routing query vector [${query.join(
        ", ",
      )}] starting from entry point N${entryPoint} at top sparse highway layer ${topLayer}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Object.keys(nodeVectors).map((nIdStr) => {
        const nId = Number(nIdStr);
        return {
          id: `node-${nId}`,
          value: nId,
          label: `N${nId}`,
          state: nId === entryPoint ? ("active" as ElementState) : ("default" as ElementState),
          pointers: nId === entryPoint ? [`Top Entry (L${topLayer})`] : [],
        };
      }),
    },
    auxiliaryState: {
      customState: {
        topLayer: String(topLayer),
        entryPoint: `N${entryPoint}`,
        query: `[${query.join(", ")}]`,
        phase: "Initialization",
      },
    },
    variables: { topLayer, currNode },
  });

  for (let l = topLayer; l >= 1; l--) {
    const layerGraph = layers[l]?.graph || {};
    let changed = true;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 13,
      explanation: {
        what: `Begin Greedy Routing at Skip-Graph Layer ${l}`,
        why: `Routing from current node N${currNode} (dist=${l2Dist(
          query,
          nodeVectors[currNode],
        ).toFixed(3)}) in Layer ${l}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: Object.keys(nodeVectors).map((nIdStr) => {
          const nId = Number(nIdStr);
          return {
            id: `node-${nId}`,
            value: nId,
            label: `N${nId}`,
            state: nId === currNode ? ("active" as ElementState) : ("default" as ElementState),
            pointers: nId === currNode ? [`Active (L${l})`] : [],
          };
        }),
      },
      auxiliaryState: {
        customState: {
          currentLayer: String(l),
          currNode: `N${currNode}`,
          currDist: l2Dist(query, nodeVectors[currNode]).toFixed(3),
        },
      },
      variables: { l, currNode },
    });

    while (changed) {
      changed = false;
      let currDist = l2Dist(query, nodeVectors[currNode]);
      const neighbors = layerGraph[currNode] || [];

      for (const nxt of neighbors) {
        const nxtDist = l2Dist(query, nodeVectors[nxt]);
        if (nxtDist < currDist) {
          const prevNode = currNode;
          currNode = nxt;
          currDist = nxtDist;
          changed = true;

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 21,
            explanation: {
              what: `Layer ${l} Highway Jump: N${prevNode} -> N${nxt} (dist=${nxtDist.toFixed(3)})`,
              why: `Found closer neighbor N${nxt} at Layer ${l}. Distance reduced to ${nxtDist.toFixed(3)}.`,
            },
            primarySnapshot: {
              kind: "array",
              elements: Object.keys(nodeVectors).map((nIdStr) => {
                const nId = Number(nIdStr);
                return {
                  id: `node-${nId}`,
                  value: nId,
                  label: `N${nId}`,
                  state:
                    nId === currNode ? ("active" as ElementState) : ("default" as ElementState),
                  pointers: nId === currNode ? [`Highway Jump N${nxt}`] : [],
                };
              }),
            },
            auxiliaryState: {
              customState: {
                currentLayer: String(l),
                jump: `N${prevNode} -> N${nxt}`,
                newDist: nxtDist.toFixed(3),
              },
            },
            variables: { l, currNode, nxtDist: Math.round(nxtDist * 100) / 100 },
          });
        }
      }
    }

    path.push({ layer: l, node: currNode, dist: l2Dist(query, nodeVectors[currNode]) });
  }

  // Final Step: Complete
  const finalDist = l2Dist(query, nodeVectors[currNode]);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 25,
    explanation: {
      what: `Top-Down Layer Routing Complete: Hand-off Node N${currNode} to Layer 0`,
      why: `Reached Layer 0 entry point N${currNode} with dist=${finalDist.toFixed(
        3,
      )}. Ready for dense layer-0 beam search.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Object.keys(nodeVectors).map((nIdStr) => {
        const nId = Number(nIdStr);
        return {
          id: `node-${nId}`,
          value: nId,
          label: `N${nId}`,
          state: nId === currNode ? ("sorted" as ElementState) : ("visited" as ElementState),
          pointers: nId === currNode ? [`Layer 0 Entry Point: N${currNode}`] : [],
        };
      }),
    },
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
    id: "hnswMultiLayerProbabilisticGraph",
    title: "HNSW Multi-Layer Probabilistic Graph Routing",
    category: "ml_vector_search",
    categories: ["ml_vector_search", "graph_traversal"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_vector_search",
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
