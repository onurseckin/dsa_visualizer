import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface SkipListNode {
  id: number;
  value: number;
  nextId: number | null;
  skipId: number | null;
}

export interface SingleSkipListLayerTraversalInput {
  nodes: Record<number, SkipListNode>;
  startId: number;
  target: number;
}

export const DEFAULT_SINGLE_SKIP_LIST_INPUT: SingleSkipListLayerTraversalInput = {
  target: 45,
  startId: 1,
  nodes: {
    1: { id: 1, value: 10, nextId: 2, skipId: 3 },
    2: { id: 2, value: 20, nextId: 3, skipId: null },
    3: { id: 3, value: 30, nextId: 4, skipId: 5 },
    4: { id: 4, value: 40, nextId: 5, skipId: null },
    5: { id: 5, value: 50, nextId: 6, skipId: null },
    6: { id: 6, value: 60, nextId: null, skipId: null },
  },
};

export const SINGLE_SKIP_LIST_CODE = `def single_skip_list_layer_traversal(nodes: dict, start_id: int, target: int) -> tuple[int, list[int]]:
    curr_id = start_id
    path = [curr_id]

    while curr_id in nodes:
        curr_node = nodes[curr_id]

        skip_id = curr_node.get("skipId")
        if skip_id and skip_id in nodes and nodes[skip_id]["value"] <= target:
            curr_id = skip_id
            path.append(curr_id)
            continue

        next_id = curr_node.get("nextId")
        if next_id and next_id in nodes and nodes[next_id]["value"] <= target:
            curr_id = next_id
            path.append(curr_id)
            continue

        break

    return curr_id, path`;

export const generateSingleSkipListSteps = (
  input: SingleSkipListLayerTraversalInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { nodes, startId, target } = input;
  let stepIndex = 0;

  let currId = startId;
  const path: number[] = [currId];

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Initialize 1D Skip-List Traversal at Node ${startId} (val=${nodes[startId]?.value})`,
      why: `Target value = ${target}. Traverses express skip edges before standard sequential edges.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Object.keys(nodes).map((nIdStr) => {
        const nId = Number(nIdStr);
        const node = nodes[nId];
        return {
          id: `node-${nId}`,
          value: node.value,
          label: `N${nId} (${node.value})`,
          state: nId === startId ? ("active" as ElementState) : ("default" as ElementState),
          pointers: nId === startId ? ["Start"] : [],
        };
      }),
    },
    auxiliaryState: {
      customState: {
        target: String(target),
        startId: String(startId),
        path: `[N${startId}]`,
        status: "Initialized",
      },
    },
    variables: { startId, target },
  });

  while (currId in nodes) {
    const currNode = nodes[currId];
    const skipId = currNode.skipId;
    const nextId = currNode.nextId;

    let tookSkip = false;
    let tookNext = false;

    if (skipId && skipId in nodes && nodes[skipId].value <= target) {
      const prevId = currId;
      currId = skipId;
      path.push(currId);
      tookSkip = true;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 9,
        explanation: {
          what: `Express Skip Pointer Jump: N${prevId} (val=${nodes[prevId].value}) -> N${currId} (val=${nodes[currId].value})`,
          why: `Skip pointer destination N${currId} value ${nodes[currId].value} <= target ${target}. Rapidly bypassed intermediate nodes.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: Object.keys(nodes).map((nIdStr) => {
            const nId = Number(nIdStr);
            const isCurr = nId === currId;
            return {
              id: `node-${nId}`,
              value: nodes[nId].value,
              label: `N${nId} (${nodes[nId].value})`,
              state: isCurr
                ? ("active" as ElementState)
                : path.includes(nId)
                  ? ("visited" as ElementState)
                  : ("default" as ElementState),
              pointers: isCurr ? ["Express Jump"] : [],
            };
          }),
        },
        auxiliaryState: {
          customState: {
            jumpType: "Express Skip Edge",
            fromNode: `N${prevId}`,
            toNode: `N${currId}`,
            path: path.map((id) => `N${id}`).join(" -> "),
          },
        },
        variables: { currId, val: nodes[currId].value },
      });
      continue;
    }

    if (nextId && nextId in nodes && nodes[nextId].value <= target) {
      const prevId = currId;
      currId = nextId;
      path.push(currId);
      tookNext = true;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 15,
        explanation: {
          what: `Sequential Next Step: N${prevId} (val=${nodes[prevId].value}) -> N${currId} (val=${nodes[currId].value})`,
          why: `Express skip edge unavailable or exceeded target. Advanced to next adjacent node.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: Object.keys(nodes).map((nIdStr) => {
            const nId = Number(nIdStr);
            const isCurr = nId === currId;
            return {
              id: `node-${nId}`,
              value: nodes[nId].value,
              label: `N${nId} (${nodes[nId].value})`,
              state: isCurr
                ? ("active" as ElementState)
                : path.includes(nId)
                  ? ("visited" as ElementState)
                  : ("default" as ElementState),
              pointers: isCurr ? ["Next Step"] : [],
            };
          }),
        },
        auxiliaryState: {
          customState: {
            jumpType: "Sequential Next Edge",
            fromNode: `N${prevId}`,
            toNode: `N${currId}`,
            path: path.map((id) => `N${id}`).join(" -> "),
          },
        },
        variables: { currId, val: nodes[currId].value },
      });
      continue;
    }

    if (!tookSkip && !tookNext) {
      break;
    }
  }

  // Step Final: Complete
  const finalVal = nodes[currId]?.value;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 22,
    explanation: {
      what: `Skip-List Layer Traversal Complete at Node N${currId} (val=${finalVal})`,
      why: `Found closest node N${currId} with value ${finalVal} <= target ${target}. Traversal path: [${path
        .map((id) => `N${id}`)
        .join(" -> ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Object.keys(nodes).map((nIdStr) => {
        const nId = Number(nIdStr);
        const isFinal = nId === currId;
        return {
          id: `node-${nId}`,
          value: nodes[nId].value,
          label: `N${nId} (${nodes[nId].value})`,
          state: isFinal
            ? ("sorted" as ElementState)
            : path.includes(nId)
              ? ("visited" as ElementState)
              : ("default" as ElementState),
          pointers: isFinal ? [`Best Node <= ${target}`] : [],
        };
      }),
    },
    auxiliaryState: {
      customState: {
        finalNode: `N${currId}`,
        finalValue: String(finalVal),
        traversalPath: path.map((id) => `N${id}`).join(" -> "),
        status: "Completed",
      },
    },
    variables: { finalNode: currId, finalVal, complete: true },
  });

  return steps;
};

export const singleSkipListLayerTraversal: AlgorithmDefinition<SingleSkipListLayerTraversalInput> =
  {
    id: "single-skip-list-layer-traversal",
    title: "Single Skip-List Layer Traversal",
    topicIds: ["ml_vector_search", "graph_traversal"],
    difficulty: "Easy",
    description:
      "Simulates 1D skip-list layer routing (Pugh, 1990), serving as the foundational predecessor to HNSW spatial graph search. Given nodes with sequential `next` and express `skip` pointers, the traversal algorithm greedily takes express skip edges whenever the destination value <= target, falling back to sequential edges.\n\nInput Format:\n- nodes: Map of node ID to SkipListNode {id, value, nextId, skipId}.\n- startId: Entry node ID.\n- target: Scalar numerical search target value.\n\nOutput Format:\n- Returns tuple (closestNodeId, traversalPath).\n\nEdge Cases & Constraints:\n- Target smaller than startId node value: Remains at startId node.",
    constraints: ["Node values must be strictly sorted along nextId chains."],
    examples: [
      {
        kind: "basic",
        title: "Skip Traversal for Target = 45",
        inputDisplay: "startId = 1 (val 10), target = 45",
        outputDisplay: "Final Node N4 (val 40), Path: N1 -> N3 -> N4",
        input: DEFAULT_SINGLE_SKIP_LIST_INPUT,
        output: "N4",
        explanation: "Jumps N1 -> N3 via express skip edge, then N3 -> N4 via next edge.",
      },
      {
        kind: "complex",
        title: "Target Exceeding All Nodes (Target = 100)",
        inputDisplay: "target = 100",
        outputDisplay: "Final Node N6 (val 60)",
        input: {
          ...DEFAULT_SINGLE_SKIP_LIST_INPUT,
          target: 100,
        },
        output: "N6",
        explanation: "Traverses to rightmost node N6.",
      },
      {
        kind: "negative",
        title: "Target Smaller Than Start Node (Target = 5)",
        inputDisplay: "target = 5",
        outputDisplay: "Final Node N1 (val 10)",
        input: {
          ...DEFAULT_SINGLE_SKIP_LIST_INPUT,
          target: 5,
        },
        output: "N1",
        explanation: "No edge satisfies value <= 5, terminating immediately at start node.",
      },
    ],
    defaultInput: DEFAULT_SINGLE_SKIP_LIST_INPUT,
    code: SINGLE_SKIP_LIST_CODE,
    timeComplexity: {
      best: "O(log N)",
      average: "O(log N)",
      worst: "O(N)",
    },
    spaceComplexity: "O(Path)",
    complexityAnalysis: {
      time: "O(log N) average time steps using express skip pointers.",
      space: "O(Path) auxiliary memory to store node traversal history.",
    },
    topicGuide: {
      overview:
        "1D Skip-Lists (William Pugh, 1990) introduced probabilistic multi-layer express highways to sorted linked lists. Malkov & Yashunin extended this exact 1D skip-pointer concept to multi-dimensional spatial graphs in HNSW.",
      sections: [
        {
          heading: "Core Concept & Express Routing",
          body: "Skip pointers bypass O(N) linear scanning by providing O(2^k) geometric stride jumps. At each node, the algorithm probes the longest skip edge before dropping to shorter step scales.",
        },
        {
          heading: "Systems & Performance Impact",
          body: "Skip-lists provide logarithmic O(log N) point location without requiring complex tree rotations (like AVL or Red-Black trees), enabling simple lock-free concurrent updates.",
        },
        {
          heading: "From 1D Skip-Lists to Multi-Dimensional HNSW",
          body: "While 1D skip-lists compare scalar numerical inequality `val <= target`, HNSW replaces scalar inequality with spatial vector distance comparisons `dist(neighbor, query) < dist(curr, query)`.",
        },
      ],
      keyTerms: [
        {
          term: "Skip Pointer",
          definition: "An express link skipping multiple intermediate nodes to accelerate search.",
        },
        {
          term: "Probabilistic Level",
          definition:
            "Random height assigned to a node determining how many skip layers it participates in.",
        },
        {
          term: "Greedy Traversal",
          definition:
            "Always taking the edge that brings the current location closest to the target.",
        },
      ],
    },
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "Pugh's Skip-Lists (CACM 1990)" }],
    generateSteps: generateSingleSkipListSteps,
  };
