import {
  AlgorithmDefinition,
  AlgorithmStep,
  VectorItem,
  VectorVisualSnapshot,
} from "../../types/dsa";

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
    cand_with_dist = [(l2_distance(pivot, node_vectors[c]), c) for c in candidates]
    cand_with_dist.sort(key=lambda x: x[0])

    selected_neighbors = []

    for dist_to_pivot, cand_id in cand_with_dist:
        if len(selected_neighbors) >= max_M:
            break

        cand_vec = node_vectors[cand_id]
        is_pruned = False

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
    Math.sqrt(v1.reduce((sum, val, idx) => sum + (val - (v2[idx] ?? 0)) ** 2, 0));

  const candDists = candidates
    .map((cId) => ({
      id: cId,
      dist: l2Dist(pivot, nodeVectors[cId] ?? [0, 0]),
    }))
    .sort((a, b) => a.dist - b.dist);

  const createVectorSnapshot = (
    selected: number[],
    prunedMap: Record<number, number>,
    currentEvaluatingId: number | null,
    planeTitle?: string,
  ): VectorVisualSnapshot => {
    const vectors: VectorItem[] = [
      {
        id: "pivot",
        label: `Pivot (${pivot.join(", ")})`,
        x: pivot[0] ?? 0,
        y: pivot[1] ?? 0,
        state: "active",
        subText: "Base Vector",
      },
    ];

    for (const c of candDists) {
      const vec = nodeVectors[c.id] ?? [0, 0];
      const isSelected = selected.includes(c.id);
      const prunedBy = prunedMap[c.id];
      const isEvaluating = currentEvaluatingId === c.id;

      let state: "default" | "active" | "compared" | "result" | "inactive" = "default";
      let subText = `d_pivot = ${c.dist.toFixed(2)}`;

      if (isEvaluating) {
        state = "compared";
        subText = "Evaluating Candidate";
      } else if (isSelected) {
        state = "result";
        subText = "Selected Neighbor";
      } else if (prunedBy !== undefined) {
        state = "inactive";
        subText = `Pruned by C${prunedBy}`;
      }

      vectors.push({
        id: `cand-${c.id}`,
        label: `C${c.id}`,
        x: vec[0] ?? 0,
        y: vec[1] ?? 0,
        state,
        subText,
      });
    }

    return {
      kind: "vector",
      vectors,
      planeTitle: planeTitle || "HNSW Spatial Vector Space",
    };
  };

  const selected: number[] = [];
  const prunedMap: Record<number, number> = {};

  // Step 0: Init & candidate distance sorting
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: "Initialize HNSW Spatial Neighbor Pruning and sort candidates by distance to pivot",
      why: `Computed L2 distance to base pivot vector [${pivot.join(
        ", ",
      )}] for ${candidates.length} candidate nodes. Selection budget maxM = ${maxM}.`,
    },
    primarySnapshot: createVectorSnapshot([], {}, null, "Initial Candidate Distance Ranking"),
    auxiliaryState: {
      customState: {
        pivotVector: `[${pivot.join(", ")}]`,
        maxM: String(maxM),
        sortedCandidates: candDists.map((c) => `C${c.id}:${c.dist.toFixed(2)}`).join(", "),
        selectedCount: "0",
      },
    },
    variables: { maxM, totalCandidates: candidates.length, selectedCount: 0 },
  });

  for (let i = 0; i < candDists.length; i++) {
    if (selected.length >= maxM) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 14,
        explanation: {
          what: `Reached Maximum Edge Connection Capacity maxM = ${maxM}`,
          why: `Already selected ${selected.length} neighbors [${selected
            .map((s) => `C${s}`)
            .join(", ")}]. Halting further neighbor evaluation.`,
        },
        primarySnapshot: createVectorSnapshot(
          selected,
          prunedMap,
          null,
          "Max Edge Capacity Limit Reached",
        ),
        auxiliaryState: {
          customState: {
            maxM: String(maxM),
            selectedNeighbors: selected.map((s) => `C${s}`).join(", "),
            status: "Capacity Limit Reached",
          },
        },
        variables: { maxM, selectedCount: selected.length, capacityReached: true },
      });
      break;
    }

    const cand = candDists[i];
    const candVec = nodeVectors[cand.id] ?? [0, 0];

    // Candidate Evaluation step
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 16,
      explanation: {
        what: `Evaluate candidate C${cand.id} (dist to pivot = ${cand.dist.toFixed(2)})`,
        why: `Checking if candidate C${cand.id} is closer to any already selected neighbor than to the base pivot vector.`,
      },
      primarySnapshot: createVectorSnapshot(
        selected,
        prunedMap,
        cand.id,
        `Evaluating Candidate C${cand.id}`,
      ),
      auxiliaryState: {
        customState: {
          currentCandidate: `C${cand.id}`,
          distToPivot: cand.dist.toFixed(3),
          selectedNeighbors: selected.length > 0 ? selected.map((s) => `C${s}`).join(", ") : "None",
        },
      },
      variables: {
        candId: cand.id,
        distToPivot: Number(cand.dist.toFixed(3)),
        selectedCount: selected.length,
      },
    });

    let prunedBy: number | null = null;
    let distToPruned = 0;

    for (const selId of selected) {
      const selVec = nodeVectors[selId] ?? [0, 0];
      const distToSel = l2Dist(candVec, selVec);
      if (distToSel < cand.dist) {
        prunedBy = selId;
        distToPruned = distToSel;
        break;
      }
    }

    if (prunedBy !== null) {
      prunedMap[cand.id] = prunedBy;
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 23,
        explanation: {
          what: `Prune candidate C${cand.id}: Occluded by neighbor C${prunedBy}`,
          why: `dist(C${cand.id}, C${prunedBy}) = ${distToPruned.toFixed(
            2,
          )} < dist(C${cand.id}, Pivot) = ${cand.dist.toFixed(
            2,
          )}. Candidate C${cand.id} is closer to C${prunedBy} than to Pivot, violating spatial diversity.`,
        },
        primarySnapshot: createVectorSnapshot(
          selected,
          prunedMap,
          null,
          `Candidate C${cand.id} Pruned by C${prunedBy}`,
        ),
        auxiliaryState: {
          customState: {
            candidate: `C${cand.id}`,
            prunedByNeighbor: `C${prunedBy}`,
            distToNeighbor: distToPruned.toFixed(3),
            distToPivot: cand.dist.toFixed(3),
            action: "Pruned",
          },
        },
        variables: {
          candId: cand.id,
          prunedBy,
          distToNeighbor: Number(distToPruned.toFixed(3)),
          isPruned: true,
        },
      });
    } else {
      selected.push(cand.id);
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 27,
        explanation: {
          what: `Select candidate C${cand.id} as HNSW neighbor edge`,
          why: `Candidate C${cand.id} is not occluded by any existing selected neighbor and provides a unique directional vector coverage.`,
        },
        primarySnapshot: createVectorSnapshot(
          selected,
          prunedMap,
          null,
          `Candidate C${cand.id} Selected`,
        ),
        auxiliaryState: {
          customState: {
            newlySelected: `C${cand.id}`,
            totalSelected: selected.map((s) => `C${s}`).join(", "),
            action: "Selected",
          },
        },
        variables: { candId: cand.id, selectedCount: selected.length, isPruned: false },
      });
    }
  }

  // Step Final: Completion
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 29,
    explanation: {
      what: "HNSW Heuristic Spatial Neighbor Pruning Complete",
      why: `Selected ${selected.length} neighbor edges [${selected
        .map((s) => `C${s}`)
        .join(
          ", ",
        )}] for pivot. Maintains Delaunay-like graph connectivity and directional diversity.`,
    },
    primarySnapshot: createVectorSnapshot(
      selected,
      prunedMap,
      null,
      "Final Retained Neighbor Graph Edges",
    ),
    auxiliaryState: {
      customState: {
        finalNeighbors: selected.map((s) => `C${s}`).join(", "),
        totalSelected: selected.length,
        status: "Completed",
      },
    },
    variables: { selectedCount: selected.length, complete: true },
  });

  return steps;
};

export const hnswHeuristicSpatialPruning: AlgorithmDefinition<HnswHeuristicSpatialPruningInput> = {
  id: "hnsw-heuristic-spatial-pruning",
  title: "HNSW Heuristic Spatial Neighbor Pruning",
  topicIds: ["ml_vector_search", "graph_traversal"],
  difficulty: "Hard",
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
