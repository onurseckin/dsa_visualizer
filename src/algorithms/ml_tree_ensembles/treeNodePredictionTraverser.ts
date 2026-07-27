import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface DecisionTreeNodeData {
  id: number;
  featureIdx?: number;
  threshold?: number;
  leftId?: number;
  rightId?: number;
  leafValue?: number;
}

export interface TreeNodePredictionTraverserInput {
  sample: number[]; // Feature vector X
  treeNodes: Record<number, DecisionTreeNodeData>;
  rootId: number;
}

export const DEFAULT_TREE_TRAVERSAL_INPUT: TreeNodePredictionTraverserInput = {
  sample: [2.5, 4.0],
  rootId: 0,
  treeNodes: {
    0: { id: 0, featureIdx: 0, threshold: 3.0, leftId: 1, rightId: 2 },
    1: { id: 1, featureIdx: 1, threshold: 3.5, leftId: 3, rightId: 4 },
    2: { id: 2, leafValue: 10.5 },
    3: { id: 3, leafValue: 2.0 },
    4: { id: 4, leafValue: 7.8 },
  },
};

export const TREE_NODE_PREDICTION_TRAVERSER_CODE = `def traverse_decision_tree(sample: list[float], tree_nodes: dict, root_id: int) -> tuple[float, list[int]]:
    """
    Decision Tree Prediction Traverser.
    Routes a test sample vector X through decision tree nodes from root_id down to a leaf node.
    At internal nodes, branches Left if sample[feature_idx] <= threshold, else Right.
    """
    curr_id = root_id
    traversal_path = [curr_id]

    while curr_id in tree_nodes:
        node = tree_nodes[curr_id]

        # Terminal leaf node
        if "leafValue" in node and node["leafValue"] is not None:
            return node["leafValue"], traversal_path

        f_idx = node["featureIdx"]
        threshold = node["threshold"]
        feat_val = sample[f_idx]

        if feat_val <= threshold:
            curr_id = node["leftId"]
        else:
            curr_id = node["rightId"]

        traversal_path.append(curr_id)

    return 0.0, traversal_path`;

export const generateTreeTraversalSteps = (
  input: TreeNodePredictionTraverserInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { sample, treeNodes, rootId } = input;
  let stepIndex = 0;

  let currId = rootId;
  const path: number[] = [currId];

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initialize Decision Tree Traversal at Root Node ${rootId}`,
      why: `Routing sample vector X = [${sample.join(", ")}] from Root node ${rootId} down to leaf node.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Object.keys(treeNodes).map((nIdStr) => {
        const nId = Number(nIdStr);
        const node = treeNodes[nId];
        const isLeaf = "leafValue" in node && node.leafValue !== undefined;
        return {
          id: `node-${nId}`,
          value: nId,
          label: isLeaf
            ? `Leaf ${nId} (${node.leafValue})`
            : `Node ${nId} (X[${node.featureIdx}]<=${node.threshold})`,
          state: nId === rootId ? ("active" as ElementState) : ("default" as ElementState),
          pointers: nId === rootId ? ["Root"] : [],
        };
      }),
    },
    auxiliaryState: {
      customState: {
        sample: `[${sample.join(", ")}]`,
        path: `[Node ${rootId}]`,
        status: "Initialized",
      },
    },
    variables: { rootId, currId },
  });

  while (currId in treeNodes) {
    const node = treeNodes[currId];

    if ("leafValue" in node && node.leafValue !== undefined) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 11,
        explanation: {
          what: `Reached Leaf Node ${currId}: Output Prediction = ${node.leafValue}`,
          why: `Reached terminal leaf node ${currId}. Tree prediction value = ${node.leafValue}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: Object.keys(treeNodes).map((nIdStr) => {
            const nId = Number(nIdStr);
            const isLeafNode = nId === currId;
            return {
              id: `node-${nId}`,
              value: nId,
              label: isLeafNode ? `Leaf ${nId} (${node.leafValue})` : `Node ${nId}`,
              state: isLeafNode
                ? ("sorted" as ElementState)
                : path.includes(nId)
                  ? ("visited" as ElementState)
                  : ("default" as ElementState),
              pointers: isLeafNode ? [`Leaf Output: ${node.leafValue}`] : [],
            };
          }),
        },
        auxiliaryState: {
          customState: {
            leafNode: `Node ${currId}`,
            leafValue: String(node.leafValue),
            traversalPath: path.map((id) => `Node ${id}`).join(" -> "),
            status: "Completed",
          },
        },
        variables: { leafValue: node.leafValue, complete: true },
      });
      break;
    }

    const fIdx = node.featureIdx!;
    const threshold = node.threshold!;
    const featVal = sample[fIdx];
    const isLeft = featVal <= threshold;

    const nextId = isLeft ? node.leftId! : node.rightId!;
    const prevId = currId;
    currId = nextId;
    path.push(currId);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Node ${prevId}: X[${fIdx}] (${featVal}) <= ${threshold} -> Branch ${isLeft ? "LEFT" : "RIGHT"} to Node ${currId}`,
        why: `Feature X[${fIdx}] value (${featVal}) is ${isLeft ? "<=" : ">"} threshold ${threshold}. Routed to Node ${currId}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: Object.keys(treeNodes).map((nIdStr) => {
          const nId = Number(nIdStr);
          const isCurr = nId === currId;
          return {
            id: `node-${nId}`,
            value: nId,
            label: `Node ${nId}`,
            state: isCurr
              ? ("active" as ElementState)
              : path.includes(nId)
                ? ("visited" as ElementState)
                : ("default" as ElementState),
            pointers: isCurr ? [`Branched ${isLeft ? "LEFT" : "RIGHT"}`] : [],
          };
        }),
      },
      auxiliaryState: {
        customState: {
          evaluatedNode: `Node ${prevId}`,
          featureIdx: String(fIdx),
          featVal: String(featVal),
          threshold: String(threshold),
          branch: isLeft ? "LEFT" : "RIGHT",
          traversalPath: path.map((id) => `Node ${id}`).join(" -> "),
        },
      },
      variables: { prevId, currId, fIdx, featVal, isLeft },
    });
  }

  return steps;
};

export const treeNodePredictionTraverser: AlgorithmDefinition<TreeNodePredictionTraverserInput> = {
  id: "treeNodePredictionTraverser",
  title: "Decision Tree Prediction Traverser",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles", "tree_fundamentals"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "Routes a test sample feature vector X through a decision tree from root node down to a terminal leaf node. At each internal split node, evaluates condition `X[featureIdx] <= threshold`, branching Left or Right until arriving at a leaf node containing output prediction value f(x).\n\nInput Format:\n- sample: Feature vector X.\n- treeNodes: Dictionary mapping node ID to node structure.\n- rootId: Root node ID.\n\nOutput Format:\n- Returns tuple (leafPredictionValue, traversalPathList).\n\nEdge Cases & Constraints:\n- Single leaf root tree: Returns root leaf value immediately.",
  constraints: ["rootId must exist in treeNodes."],
  examples: [
    {
      kind: "basic",
      title: "Sample Traversal to Leaf Node 4",
      inputDisplay: "sample = [2.5, 4.0], root = 0",
      outputDisplay: "Output Prediction: 7.8 (Path: 0 -> 1 -> 4)",
      input: DEFAULT_TREE_TRAVERSAL_INPUT,
      output: "Leaf 4 value 7.8",
      explanation:
        "Node 0: X[0] (2.5) <= 3.0 -> Left to Node 1. Node 1: X[1] (4.0) > 3.5 -> Right to Leaf 4 (value 7.8).",
    },
    {
      kind: "complex",
      title: "Direct Branch Right at Root Node",
      inputDisplay: "sample = [5.0, 4.0]",
      outputDisplay: "Output Prediction: 10.5 (Path: 0 -> 2)",
      input: {
        ...DEFAULT_TREE_TRAVERSAL_INPUT,
        sample: [5.0, 4.0],
      },
      output: "Leaf 2 value 10.5",
      explanation: "Node 0: X[0] (5.0) > 3.0 -> Right directly to Leaf 2 (value 10.5).",
    },
    {
      kind: "negative",
      title: "Single Root Leaf Tree",
      inputDisplay: "treeNodes = {0: {id: 0, leafValue: 5.0}}",
      outputDisplay: "Output Prediction: 5.0",
      input: {
        sample: [1.0, 1.0],
        rootId: 0,
        treeNodes: { 0: { id: 0, leafValue: 5.0 } },
      },
      output: "5.0",
      explanation: "Single root node returns prediction 5.0 without branching.",
    },
  ],
  defaultInput: DEFAULT_TREE_TRAVERSAL_INPUT,
  code: TREE_NODE_PREDICTION_TRAVERSER_CODE,
  timeComplexity: {
    best: "O(Depth)",
    average: "O(Depth)",
    worst: "O(Depth)",
  },
  spaceComplexity: "O(Depth)",
  complexityAnalysis: {
    time: "O(Depth) traversal steps where Depth is the depth of the decision tree.",
    space: "O(Depth) auxiliary memory to record node traversal history path.",
  },
  topicGuide: {
    overview:
      "Decision tree inference routes test sample feature vectors through nested `if-else` conditionals. High-performance inference runtimes (Treelite, ONNX Runtime, XGBoost C++ Predictor) flatten decision trees into inline if-else C++ code or GPU block threads.",
    sections: [
      {
        heading: "Overview & Branch Routing",
        body: "Starting at root node r, if X[f_r] <= v_r control passes to left child, else to right child. The process repeats until a leaf node holding prediction output w is reached.",
      },
      {
        heading: "Tree Serialization & Binary Layout",
        body: "To maximize CPU L1 cache throughput, decision tree nodes are packed into 16-byte contiguous binary structures `[float threshold, uint16_t feature_idx, uint16_t left_child_offset]`.",
      },
      {
        heading: "Native Machine Code Compilation (Treelite)",
        body: "Treelite compiles ensemble models directly into native assembly or C code, replacing node pointer dereferences with hardcoded branch instructions.",
      },
      {
        heading: "Implementation Nuances & Out-Of-Bounds Feature Index",
        body: "In production runtimes, invalid feature indices or missing tree node keys trigger default error handlers or fallback to baseline leaf predictions.",
      },
    ],
    keyTerms: [
      {
        term: "Tree Traversal",
        definition: "Process of following node split conditions from root to a terminal leaf.",
      },
      {
        term: "Leaf Node",
        definition: "Terminal node in a decision tree containing scalar prediction output.",
      },
      {
        term: "Treelite",
        definition:
          "C++ framework compiling tree ensemble models into native machine code for fast inference.",
      },
      {
        term: "Branch Misprediction",
        definition:
          "CPU hardware penalty incurred when conditional tree branching fails CPU branch prediction heuristics.",
      },
    ],
  },
  sources: [
    { type: "ml_infra", kind: "ml_infra", label: "CART Inference & Treelite Architecture" },
  ],
  generateSteps: generateTreeTraversalSteps,
};
