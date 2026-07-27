import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface HnswHeuristicSpatialPruningInput {
  pivot: number[];
  candidates: number[];
  maxM: number;
  nodeVectors: Record<number, number[]>;
}

export const DEFAULT_HNSW_HEURISTIC_SPATIAL_PRUNING_INPUT: HnswHeuristicSpatialPruningInput = {
  pivot: [0.0, 0.0],
  candidates: [1, 2, 3, 4],
  maxM: 2,
  nodeVectors: {
    1: [1.0, 0.0],
    2: [1.1, 0.1],
    3: [0.0, 1.5],
    4: [-1.0, 0.0],
  },
};

export const HNSW_HEURISTIC_SPATIAL_PRUNING_CODE = `import math

def l2_distance(v1: list[float], v2: list[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(v1, v2)))

def hnsw_heuristic_spatial_pruning(pivot: list[float], candidates: list[int], max_M: int, node_vectors: dict) -> list[int]:
    """
    HNSW heuristic neighbor selection algorithm (SELECT-NEIGHBORS-HEURISTIC, Algorithm 4 in Malkov & Yashunin).
    Prunes candidates that are closer to an already selected neighbor than to the base pivot vector.
    """
    # Sort candidates by ascending distance to base pivot vector
    cand_with_dist = [(l2_distance(pivot, node_vectors[c]), c) for c in candidates]
    cand_with_dist.sort(key=lambda x: x[0])

    selected_neighbors = []

    for dist_to_pivot, cand_id in cand_with_dist:
        if len(selected_neighbors) >= max_M:
            break

        cand_vec = node_vectors[cand_id]
        is_pruned = False

        # Check if candidate is closer to any already selected neighbor than to pivot
        for sel_id in selected_neighbors:
            sel_vec = node_vectors[sel_id]
            dist_to_selected = l2_distance(cand_vec, sel_vec)
            if dist_to_selected < dist_to_pivot:
                is_pruned = True
                break

        if not is_pruned:
            selected_neighbors.append(cand_id)

    return selected_neighbors`;

export const generateHnswHeuristicSpatialPruningSteps = (
  input: HnswHeuristicSpatialPruningInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { pivot, candidates, maxM, nodeVectors } = input;
  let stepIndex = 0;

  const l2Dist = (v1: number[], v2: number[]) =>
    Math.sqrt(v1.reduce((sum, val, idx) => sum + (val - v2[idx]) ** 2, 0));

  const candDists = candidates
    .map((cId) => ({ id: cId, dist: l2Dist(pivot, nodeVectors[cId]) }))
    .sort((a, b) => a.dist - b.dist);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: "Initialize HNSW Spatial Pruning Heuristic (SELECT-NEIGHBORS-HEURISTIC)",
      why: `Sorting ${candidates.length} candidates by distance to pivot vector [${pivot.join(
        ", ",
      )}]. Selection budget maxM = ${maxM}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: candDists.map((c, idx) => ({
        id: `c-${c.id}`,
        value: c.id,
        label: `C${c.id} (d=${c.dist.toFixed(2)})`,
        state: "default" as ElementState,
        pointers: idx === 0 ? ["Closest Candidate"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        pivotVector: `[${pivot.join(", ")}]`,
        maxM: String(maxM),
        sortedCandidates: candDists.map((c) => `C${c.id}:${c.dist.toFixed(2)}`).join(", "),
        phase: "Initialization",
      },
    },
    variables: { maxM, totalCandidates: candidates.length },
  });

  const selected: number[] = [];

  for (let i = 0; i < candDists.length; i++) {
    if (selected.length >= maxM) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 18,
        explanation: {
          what: `Reached Maximum Edge Connection Capacity maxM = ${maxM}`,
          why: `Selected ${selected.length} neighbors [${selected.map((s) => `C${s}`).join(", ")}]. Halting selection.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: candDists.map((c) => ({
            id: `c-${c.id}`,
            value: c.id,
            label: `C${c.id}`,
            state: selected.includes(c.id)
              ? ("sorted" as ElementState)
              : ("visited" as ElementState),
          })),
        },
        auxiliaryState: { customState: { status: "Capacity limit reached" } },
        variables: { maxM, selectedCount: selected.length },
      });
      break;
    }

    const cand = candDists[i];
    const candVec = nodeVectors[cand.id];
    let prunedBy: number | null = null;

    for (const selId of selected) {
      const selVec = nodeVectors[selId];
      const distToSel = l2Dist(candVec, selVec);
      if (distToSel < cand.dist) {
        prunedBy = selId;
        break;
      }
    }

    if (prunedBy !== null) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 28,
        explanation: {
          what: `Prune Candidate C${cand.id}: Occluded by already selected neighbor C${prunedBy}`,
          why: `Distance(C${cand.id}, C${prunedBy}) < Distance(C${cand.id}, Pivot). Rejecting candidate to maintain cluster diversity and prevent clustering redundant neighbors.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: candDists.map((c) => ({
            id: `c-${c.id}`,
            value: c.id,
            label: `C${c.id} (${c.id === cand.id ? "PRUNED" : selected.includes(c.id) ? "Selected" : "Pending"})`,
            state:
              c.id === cand.id
                ? ("visited" as ElementState)
                : selected.includes(c.id)
                  ? ("sorted" as ElementState)
                  : ("default" as ElementState),
            pointers: c.id === cand.id ? [`Pruned by C${prunedBy}`] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            candidate: `C${cand.id}`,
            distToPivot: cand.dist.toFixed(3),
            prunedByNeighbor: `C${prunedBy}`,
            action: "Pruned",
          },
        },
        variables: { candId: cand.id, prunedBy },
      });
    } else {
      selected.push(cand.id);
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 31,
        explanation: {
          what: `Select Candidate C${cand.id} (dist to pivot = ${cand.dist.toFixed(3)})`,
          why: `Candidate provides unique spatial direction and is closer to pivot than to any previously selected neighbor.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: candDists.map((c) => ({
            id: `c-${c.id}`,
            value: c.id,
            label: `C${c.id} (${selected.includes(c.id) ? "SELECTED" : ""})`,
            state:
              c.id === cand.id
                ? ("active" as ElementState)
                : selected.includes(c.id)
                  ? ("sorted" as ElementState)
                  : ("default" as ElementState),
            pointers: c.id === cand.id ? ["Newly Selected"] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            selectedList: selected.map((s) => `C${s}`).join(", "),
            action: "Selected",
          },
        },
        variables: { candId: cand.id, selectedCount: selected.length },
      });
    }
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 33,
    explanation: {
      what: `HNSW Heuristic Spatial Pruning Complete: Retained ${selected.length} Neighbors`,
      why: `Final edge connections for pivot: [${selected.map((s) => `C${s}`).join(", ")}]. Maintains Delaunay-like directional graph coverage.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: selected.map((sId) => ({
        id: `c-${sId}`,
        value: sId,
        label: `Edge C${sId}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        finalEdges: selected.map((s) => `C${s}`).join(", "),
        status: "Completed",
      },
    },
    variables: { selectedCount: selected.length, complete: true },
  });

  return steps;
};

export const hnswHeuristicSpatialPruning: AlgorithmDefinition<HnswHeuristicSpatialPruningInput> = {
  id: "hnswHeuristicSpatialPruning",
  title: "HNSW Heuristic Spatial Neighbor Pruning",
  category: "ml_vector_search",
  categories: ["ml_vector_search", "graph_traversal"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_vector_search",
  description:
    "Executes the HNSW heuristic neighbor selection algorithm (SELECT-NEIGHBORS-HEURISTIC, Malkov & Yashunin Algorithm 4). Rather than blindly taking the K closest candidates, spatial pruning discards candidates that are closer to an already selected neighbor than to the base pivot vector. This ensures directional edge diversity and prevents graph clustering bottlenecks.\n\nInput Format:\n- pivot: Base node vector coordinates.\n- candidates: Candidate node IDs sorted or un-sorted.\n- maxM: Maximum number of outgoing edges allowed per node.\n- nodeVectors: Dictionary mapping node ID to vector embedding.\n\nOutput Format:\n- Returns list of selected neighbor node IDs of length <= maxM.\n\nEdge Cases & Constraints:\n- Co-linear vectors: Occluded points are pruned.\n- Small maxM: Strong pruning reduces graph connectivity.",
  constraints: ["maxM >= 1.", "nodeVectors must contain all candidate IDs."],
  examples: [
    {
      kind: "basic",
      title: "Pruning Clustered Duplicate Neighbors",
      inputDisplay: "pivot = [0,0], C1=[1,0], C2=[1.1,0.1], C3=[0,1.5], maxM = 2",
      outputDisplay: "Selected Neighbors: [C1, C3] (C2 pruned)",
      input: DEFAULT_HNSW_HEURISTIC_SPATIAL_PRUNING_INPUT,
      output: "[C1, C3]",
      explanation:
        "C2 is very close to C1 (dist=0.14), so C2 is pruned in favor of orthogonal vector C3.",
    },
    {
      kind: "complex",
      title: "Opposite Direction Vectors Retained",
      inputDisplay: "pivot=[0,0], C1=[1,0], C4=[-1,0], maxM = 2",
      outputDisplay: "Selected Neighbors: [C1, C4]",
      input: {
        pivot: [0.0, 0.0],
        candidates: [1, 4],
        maxM: 2,
        nodeVectors: { 1: [1.0, 0.0], 4: [-1.0, 0.0] },
      },
      output: "[C1, C4]",
      explanation:
        "C4 is on opposite side (dist from C1 is 2.0 > dist to pivot 1.0), so both are selected.",
    },
    {
      kind: "negative",
      title: "Single Candidate Input",
      inputDisplay: "candidates = [1], maxM = 2",
      outputDisplay: "[C1]",
      input: {
        pivot: [0.0, 0.0],
        candidates: [1],
        maxM: 2,
        nodeVectors: { 1: [1.0, 0.0] },
      },
      output: "[C1]",
      explanation: "Single candidate is trivially selected.",
    },
  ],
  defaultInput: DEFAULT_HNSW_HEURISTIC_SPATIAL_PRUNING_INPUT,
  code: HNSW_HEURISTIC_SPATIAL_PRUNING_CODE,
  timeComplexity: {
    best: "O(K log K + K * maxM)",
    average: "O(K log K + K * maxM)",
    worst: "O(K log K + K * maxM)",
  },
  spaceComplexity: "O(maxM + K)",
  complexityAnalysis: {
    time: "O(K log K) to sort K candidates by distance to pivot, plus O(K * maxM) distance checks between candidate vectors.",
    space:
      "O(maxM + K) auxiliary memory to hold candidate distance structures and output neighbor arrays.",
  },
  topicGuide: {
    overview:
      "A core bottleneck in simple kNN proximity graphs is node clustering: if a node connects strictly to its nearest K neighbors, all edges point into a single dense cluster, preventing navigation across the rest of the vector space. HNSW's SELECT-NEIGHBORS-HEURISTIC enforces Delaunay-like triangulation by pruning occluded candidates.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "For candidate e and already selected neighbor s in R, e is pruned if dist(e, s) < dist(e, pivot). Geometrically, this restricts selection to vectors outside the sphere centered at e with radius dist(e, pivot).",
      },
      {
        heading: "Systems & Performance Impact",
        body: "Spatial pruning bounds maximum degree M per node, guaranteeing fixed fan-out during graph search and capping index memory consumption.",
      },
      {
        heading: "Implementation Nuances & Heuristic Variants",
        body: "Extended variants (keepPrunedUnconnected) allow retaining pruned candidates if fewer than M total edges were selected, preventing disconnected graph components in sparse regions.",
      },
    ],
    keyTerms: [
      {
        term: "Spatial Occlusion",
        definition:
          "When a candidate node lies behind an existing neighbor relative to the pivot vector.",
      },
      {
        term: "Delaunay Graph",
        definition:
          "A graph triangulation where no vertex is inside the circumcircle of any triangle in the graph.",
      },
      {
        term: "Max Degree (M)",
        definition: "Hard limit on maximum outgoing neighbor edges per HNSW graph node.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "HNSW Algorithm 4 (Malkov & Yashunin)" }],
  generateSteps: generateHnswHeuristicSpatialPruningSteps,
};
