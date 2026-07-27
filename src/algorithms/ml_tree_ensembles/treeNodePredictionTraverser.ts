import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface DecisionTreeNodeData {
  id: number;
  featureIdx?: number;
  threshold?: number;
  leftId?: number;
  rightId?: number;
  leafValue?: number;
}

export interface TreeNodePredictionTraverserInput {
  sample?: number[];
  treeNodes?: Record<number, DecisionTreeNodeData>;
  rootId?: number;
  data?: number[];
  target?: number;
}

export const DEFAULT_TREE_TRAVERSAL_INPUT: TreeNodePredictionTraverserInput = {
  sample: [2.5, 4.0, 1.8],
  rootId: 0,
  treeNodes: {
    0: { id: 0, featureIdx: 0, threshold: 3.0, leftId: 1, rightId: 2 },
    1: { id: 1, featureIdx: 1, threshold: 3.5, leftId: 3, rightId: 4 },
    2: { id: 2, leafValue: 10.5 },
    3: { id: 3, featureIdx: 2, threshold: 2.0, leftId: 5, rightId: 6 },
    4: { id: 4, leafValue: 7.8 },
    5: { id: 5, leafValue: 2.0 },
    6: { id: 6, leafValue: 5.5 },
  },
  data: [2.5, 4.0, 1.8],
  target: 0,
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
  const sample = input.sample || input.data || [2.5, 4.0, 1.8];
  const rootId = input.rootId ?? input.target ?? 0;
  const treeNodes = input.treeNodes || DEFAULT_TREE_TRAVERSAL_INPUT.treeNodes!;
  let stepIndex = 0;

  let currId = rootId;
  const traversalPath: number[] = [currId];

  const getSnapshot = (
    activeNodeId: number = -1,
  ) => {
    return {
      kind: "array" as const,
      elements: Object.keys(treeNodes).map((nIdStr) => {
        const nId = Number(nIdStr);
        const node = treeNodes[nId];
        const isLeaf = "leafValue" in node && node.leafValue !== undefined;
        let state: ElementState = "default";
        if (nId === activeNodeId) state = "active";
        else if (traversalPath.includes(nId)) state = "visited";

        return {
          id: `node-${nId}`,
          value: nId,
          label: isLeaf
            ? `Leaf ${nId} (val=${node.leafValue})`
            : `Node ${nId} (X[${node.featureIdx}]<=${node.threshold})`,
          state,
          pointers: nId === activeNodeId ? ["Current"] : [],
        };
      }),
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeNodeId: number = currId,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeNodeId),
      auxiliaryState: {
        customState: {
          "Sample X": `[${sample.join(", ")}]`,
          "Current Node ID": String(currId),
          "Traversal Path": `[${traversalPath.join(" -> ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Signature
  addStep(
    1,
    "Decision Tree Prediction Traverser Entry",
    `Started tree traversal for sample vector X = [${sample.join(", ")}] starting at root node ID ${rootId}.`,
    { rootId },
  );

  // Step 2: Init curr_id
  addStep(
    7,
    `Initialize Current Node ID: curr_id = ${currId}`,
    `Set curr_id = ${currId} (Root Node).`,
    { curr_id: currId },
  );

  // Step 3: Init traversal_path
  addStep(
    8,
    `Initialize Traversal Path Buffer: traversal_path = [${currId}]`,
    `Recorded root node ${currId} in traversal path list.`,
    { traversal_path: `[${currId}]` },
  );

  // Loop
  while (currId in treeNodes) {
    addStep(
      10,
      `While Loop Check: Node ${currId} in tree_nodes`,
      `Verified node ID ${currId} exists in decision tree node dictionary.`,
      { curr_id: currId },
    );

    const node = treeNodes[currId];
    addStep(
      11,
      `Fetch Node Metadata for Node ID ${currId}`,
      `Loaded node ${currId} metadata dictionary.`,
      { curr_id: currId, node: JSON.stringify(node) },
    );

    const isLeaf = "leafValue" in node && node.leafValue !== undefined;
    addStep(
      14,
      `Check Leaf Node Condition: Is Node ${currId} a Leaf?`,
      isLeaf
        ? `Node ${currId} is a terminal leaf node with output value ${node.leafValue}.`
        : `Node ${currId} is an internal decision split node.`,
      { curr_id: currId, isLeaf },
    );

    if (isLeaf) {
      const leafVal = node.leafValue!;
      addStep(
        15,
        `Return Leaf Prediction Value ${leafVal}`,
        `Terminated traversal at leaf node ${currId}. Returned prediction value ${leafVal}.`,
        { curr_id: currId, leafVal, completed: true },
      );
      return steps;
    }

    const fIdx = node.featureIdx!;
    addStep(
      17,
      `Read Feature Index: f_idx = ${fIdx}`,
      `Node ${currId} splits on sample feature dimension index ${fIdx}.`,
      { f_idx: fIdx },
    );

    const threshold = node.threshold!;
    addStep(
      18,
      `Read Decision Threshold: threshold = ${threshold}`,
      `Node ${currId} decision threshold: ${threshold}.`,
      { threshold },
    );

    const featVal = sample[fIdx];
    addStep(
      19,
      `Fetch Sample Feature Value: sample[${fIdx}] = ${featVal}`,
      `Loaded feature scalar value sample[${fIdx}] = ${featVal} from input sample vector X.`,
      { fIdx, featVal },
    );

    const isLeft = featVal <= threshold;
    addStep(
      21,
      `Evaluate Branch Predicate: sample[${fIdx}] (${featVal}) <= ${threshold}`,
      isLeft
        ? `True (${featVal} <= ${threshold}) -> Routing to Left child node ${node.leftId}.`
        : `False (${featVal} > ${threshold}) -> Routing to Right child node ${node.rightId}.`,
      { featVal, threshold, isLeft },
    );

    if (isLeft) {
      currId = node.leftId!;
      addStep(
        22,
        `Branch Left: Set curr_id = ${currId}`,
        `Updated curr_id to left child node ID ${currId}.`,
        { curr_id: currId },
      );
    } else {
      currId = node.rightId!;
      addStep(
        24,
        `Branch Right: Set curr_id = ${currId}`,
        `Updated curr_id to right child node ID ${currId}.`,
        { curr_id: currId },
      );
    }

    traversalPath.push(currId);
    addStep(
      26,
      `Append Node ${currId} to Traversal Path`,
      `Updated traversal path: [${traversalPath.join(" -> ")}].`,
      { traversal_path: `[${traversalPath.join(" -> ")}]` },
    );
  }

  // Fallback step 28
  addStep(
    28,
    "Execution Complete: Return Default Fallback 0.0",
    "Node ID missing from dictionary. Returned fallback 0.0.",
    { completed: true },
  );

  return steps;
};

const TREE_NODE_PREDICTION_TRAVERSER_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 9, 12, 13, 16, 20, 23, 25, 27],
  distractors: [
    "if feat_val > threshold: curr_id = node['leftId']",
    "traversal_path = sample",
    "return node['threshold'], traversal_path",
    "curr_id = root_id + 1",
  ],
  hints: [
    { line: 21, hint: "Branch left if sample[f_idx] <= threshold, else branch right." },
    { line: 15, hint: "Return leafValue and traversal_path upon reaching terminal leaf node." },
  ],
  lineExplanations: {
    1: "Defines entry point for traverse_decision_tree function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes Decision Tree Prediction Traverser routing sample vector X to leaf.",
    4: "Docstring continuation describing internal node branching logic.",
    5: "Docstring closing delimiter tag.",
    6: "Blank line before initialization.",
    7: "Initializes curr_id pointer to root_id.",
    8: "Initializes traversal_path list containing root_id.",
    9: "Blank line before traversal loop.",
    10: "Loops while curr_id exists in tree_nodes dictionary.",
    11: "Fetches node metadata dictionary for curr_id.",
    12: "Blank line before leaf node check.",
    13: "Comment for terminal leaf node check.",
    14: "Checks if 'leafValue' key exists in node dictionary.",
    15: "Returns leaf prediction value and traversal_path list upon reaching terminal leaf node.",
    16: "Blank line before feature extraction.",
    17: "Reads split feature dimension index f_idx from node dictionary.",
    18: "Reads split decision threshold from node dictionary.",
    19: "Loads feature value feat_val = sample[f_idx] from test sample vector.",
    20: "Blank line before predicate evaluation.",
    21: "Evaluates branch condition: is feat_val <= threshold?",
    22: "Updates curr_id to left child node ID node['leftId'].",
    23: "Else branch executed when feat_val > threshold.",
    24: "Updates curr_id to right child node ID node['rightId'].",
    25: "Blank line before path update.",
    26: "Appends new curr_id to traversal_path list.",
    27: "Blank line separating traversal loop from fallback return statement.",
    28: "Fallback return statement yielding 0.0 if node ID is missing from dictionary.",
  },
};

export const treeNodePredictionTraverser: AlgorithmDefinition<TreeNodePredictionTraverserInput> = {
  id: "treeNodePredictionTraverser",
  title: "Decision Tree Prediction Traverser",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles", "advanced_range_queries"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "The Decision Tree Prediction Traverser routes a continuous multi-dimensional test sample vector $X \\in \\mathbb{R}^D$ through a trained Decision Tree from the root node down to a terminal leaf node. At each internal decision node $k$, the engine evaluates a scalar predicate $X[j_k] \\le t_k$: if true, it branches to the left child node; otherwise, it branches to the right child node. Upon reaching a terminal leaf node, it returns the leaf prediction value $\\hat{y}$.\n\n### Why It Exists\nTree inference is the execution core of Decision Trees, Random Forests, and Gradient Boosted Decision Trees (GBDTs like XGBoost, LightGBM, CatBoost). Fast tree traversal enables real-time high-throughput model inference ($< 1$ microsecond per sample).\n\n### Mathematical Formulation\nGiven a decision tree represented as a directed acyclic graph of nodes $V$, root node $r \\in V$, and sample $X \\in \\mathbb{R}^D$:\n\n$$\\text{NextNode}(v) = \\begin{cases} \\text{Left}(v) & \\text{if } X[j_v] \\le t_v \\\\ \\text{Right}(v) & \\text{otherwise} \\end{cases}$$\n\n$$\\hat{y} = \\text{LeafValue}(v_{final}) \\quad \\text{where } v_{final} \\text{ satisfies IsLeaf}(v_{final}) = \\text{True}$$\n\n### Step-by-Step Intuition\n1. **Root Pointer Initialization**: Set current node pointer `curr_id = root_id` and initialize traversal path array.\n2. **Leaf Node Check**: If `curr_id` is a terminal leaf node, immediately return its leaf prediction value $\\hat{y}$.\n3. **Feature Comparison**: Read feature index $j$ and threshold $t$. Load $X[j]$ from sample vector.\n4. **Branch Step**: If $X[j] \\le t$, update `curr_id = left_id`; else `curr_id = right_id`.\n5. **Path Recording**: Record `curr_id` in traversal path array and repeat loop.\n\n### Key Trade-Offs & Hardware Execution\n- **Branch Misprediction**: Random branch decisions at internal tree nodes cause CPU pipeline stalls (branch mispredictions). Compilers use predication (AVX-512 `vpcmpeqd` and CMOV instructions) to avoid branch instructions.\n- **Cache Locality (Flat Array Trees)**: Storing tree nodes in contiguous flat arrays (e.g. pointerless array-based trees) minimizes CPU L1/L2 cache misses.",
  constraints: [
    "1 <= treeNodes.length <= 100000",
    "0 <= featureIdx < D",
    "Sample vector contains finite floats",
  ],
  examples: [
    {
      kind: "basic",
      title: "Sample [2.5, 4.0, 1.8] Traversed to Leaf 5",
      inputDisplay: "Sample X = [2.5, 4.0, 1.8], Root ID = 0",
      outputDisplay: "Leaf Value = 2.0, Path = [0, 1, 3, 5]",
      input: DEFAULT_TREE_TRAVERSAL_INPUT,
      output: "(2.0, [0, 1, 3, 5])",
      explanation: "Node 0 (X[0]=2.5 <= 3.0) -> Left Node 1 (X[1]=4.0 > 3.5) -> Right Node 3 (X[2]=1.8 <= 2.0) -> Left Leaf 5 (val=2.0).",
    },
  ],
  code: TREE_NODE_PREDICTION_TRAVERSER_CODE,
  timeComplexity: { best: "O(H)", average: "O(H)", worst: "O(H)" },
  spaceComplexity: "O(H)",
  complexityAnalysis: {
    time: "Linear in tree depth $H$ ($O(\\log N)$ for balanced trees, $O(N)$ for skewed trees).",
    space: "Requires $O(H)$ memory space to store traversal path array.",
  },
  topicGuide: {
    overview:
      "The Decision Tree Prediction Traverser routes input feature vectors through decision tree nodes from root to leaf.",
    sections: [
      {
        heading: "Core Concept & Tree Inference",
        body: "Tree inference evaluates threshold comparisons X[j] <= t at internal nodes to navigate down branches until reaching a terminal leaf node returning prediction y_hat.",
      },
      {
        heading: "Hardware CPU Cache Locality",
        body: "Pointer-based trees suffer from pointer-chasing CPU cache misses. Modern inference engines layout tree nodes in contiguous flat arrays (e.g. QuickTraverse, Treelite) to maximize L1 cache throughput.",
      },
      {
        heading: "Vectorized SIMD & Branch Predication",
        body: "To avoid CPU branch mispredictions, modern compilers replace if-else branches with CMOV (conditional move) SIMD instructions, evaluating both left and right paths in parallel.",
      },
      {
        heading: "Edge Case Analysis & Missing Features",
        body: "When input sample vectors contain missing values (NaN), production tree engines (XGBoost) utilize default branch directions (default_left / default_right) at each node.",
      },
    ],
    keyTerms: [
      {
        term: "Tree Traversal",
        definition: "Routing input feature vectors through decision tree nodes from root to leaf.",
      },
      {
        term: "Internal Node",
        definition: "A non-terminal tree node containing feature index j and decision threshold t.",
      },
      {
        term: "Terminal Leaf Node",
        definition: "A end node storing prediction value y_hat without child branches.",
      },
      {
        term: "Branch Misprediction",
        definition: "CPU pipeline stall caused by unpredictable branch decisions at internal tree nodes.",
      },
    ],
  },
  trivia: TREE_NODE_PREDICTION_TRAVERSER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_TREE_TRAVERSAL_INPUT,
  generateSteps: generateTreeTraversalSteps,
};
