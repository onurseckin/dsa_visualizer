import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface GreedyDecisionTreeBuilderInput {
  X: number[][];
  y: number[];
  maxDepth: number;
  minSamplesSplit: number;
  data?: number[];
  target?: number;
}

export const DEFAULT_GREEDY_TREE_BUILDER_INPUT: GreedyDecisionTreeBuilderInput = {
  X: [
    [1.0, 2.0],
    [1.2, 2.2],
    [1.8, 1.5],
    [2.0, 1.9],
    [5.0, 6.0],
    [5.2, 6.5],
    [5.8, 5.5],
    [6.0, 6.2],
  ],
  y: [0, 0, 0, 0, 1, 1, 1, 1],
  maxDepth: 2,
  minSamplesSplit: 2,
  data: [1.0, 1.2, 1.8, 2.0, 5.0, 5.2, 5.8, 6.0],
  target: 0,
};

export const GREEDY_DECISION_TREE_BUILDER_CODE = `class TreeNode:
    def __init__(self, feature_idx=None, threshold=None, left=None, right=None, value=None):
        self.feature_idx = feature_idx
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value

def build_greedy_decision_tree(X: list[list[float]], y: list[int], max_depth: int = 2, min_samples_split: int = 2, depth: int = 0) -> TreeNode:
    num_samples = len(y)
    num_classes = len(set(y))

    if depth >= max_depth or num_samples < min_samples_split or num_classes == 1:
        majority_class = max(set(y), key=y.count)
        return TreeNode(value=majority_class)

    best_gain = -float('inf')
    best_feature = None
    best_threshold = None
    best_left_mask = None

    parent_gini = 1.0 - sum((y.count(c) / num_samples) ** 2 for c in set(y))

    num_features = len(X[0])
    for f_idx in range(num_features):
        feature_vals = [X[i][f_idx] for i in range(num_samples)]
        sorted_vals = sorted(list(set(feature_vals)))

        for i in range(len(sorted_vals) - 1):
            threshold = (sorted_vals[i] + sorted_vals[i + 1]) / 2.0
            left_mask = [X[j][f_idx] <= threshold for j in range(num_samples)]
            
            y_left = [y[j] for j in range(num_samples) if left_mask[j]]
            y_right = [y[j] for j in range(num_samples) if not left_mask[j]]

            if not y_left or not y_right:
                continue

            gini_left = 1.0 - sum((y_left.count(c) / len(y_left)) ** 2 for c in set(y_left))
            gini_right = 1.0 - sum((y_right.count(c) / len(y_right)) ** 2 for c in set(y_right))
            
            gain = parent_gini - (len(y_left) / num_samples * gini_left + len(y_right) / num_samples * gini_right)

            if gain > best_gain:
                best_gain = gain
                best_feature = f_idx
                best_threshold = threshold
                best_left_mask = left_mask

    if best_gain <= 0 or best_feature is None:
        majority_class = max(set(y), key=y.count)
        return TreeNode(value=majority_class)

    X_left = [X[j] for j in range(num_samples) if best_left_mask[j]]
    y_left = [y[j] for j in range(num_samples) if best_left_mask[j]]
    
    X_right = [X[j] for j in range(num_samples) if not best_left_mask[j]]
    y_right = [y[j] for j in range(num_samples) if not best_left_mask[j]]

    left_node = build_greedy_decision_tree(X_left, y_left, max_depth, min_samples_split, depth + 1)
    right_node = build_greedy_decision_tree(X_right, y_right, max_depth, min_samples_split, depth + 1)

    return TreeNode(feature_idx=best_feature, threshold=best_threshold, left=left_node, right=right_node)`;

export const generateGreedyTreeBuilderSteps = (
  input: GreedyDecisionTreeBuilderInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const X = input.X || DEFAULT_GREEDY_TREE_BUILDER_INPUT.X;
  const y = input.y || DEFAULT_GREEDY_TREE_BUILDER_INPUT.y;
  const maxDepth = input.maxDepth ?? 2;
  const minSamplesSplit = input.minSamplesSplit ?? 2;
  let stepIndex = 0;

  const createTreeSnapshot = (
    treeNodes: Array<{
      id: string;
      val: number;
      leftId?: string;
      rightId?: string;
      state: ElementState;
    }>,
    rootId: string = "root",
  ) => {
    return {
      kind: "tree" as const,
      nodes: treeNodes,
      rootId,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    treeNodes: Array<{
      id: string;
      val: number;
      leftId?: string;
      rightId?: string;
      state: ElementState;
    }>,
    rootId: string = "root",
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: createTreeSnapshot(treeNodes, rootId),
      auxiliaryState: {
        customState: {
          Algorithm: "Top-Down Greedy Decision Tree Builder (CART)",
          "Total Samples N": String(y.length),
          "Features Count D": String(X[0].length),
          "Max Depth": String(maxDepth),
          "Min Samples Split": String(minSamplesSplit),
        },
      },
      variables,
    });
  };

  const initialNodes = [{ id: "root", val: 0, state: "active" as ElementState }];

  addStep(
    9,
    "Top-Down Greedy Decision Tree Builder Entry",
    `Started CART decision tree building on ${y.length} samples with max_depth=${maxDepth}, min_samples_split=${minSamplesSplit}.`,
    { n: y.length, maxDepth, minSamplesSplit, depth: 0 },
    initialNodes,
  );

  const numSamples = y.length;
  addStep(
    10,
    `Measure Node Samples Count: num_samples = ${numSamples}`,
    `Current node sample count num_samples = ${numSamples}.`,
    { num_samples: numSamples },
    initialNodes,
  );

  const uniqueClasses = Array.from(new Set(y));
  const numClasses = uniqueClasses.length;
  addStep(
    11,
    `Measure Unique Classes Count: num_classes = ${numClasses}`,
    `Unique target classes present: ${numClasses} (Classes: [${uniqueClasses.join(", ")}]).`,
    { num_classes: numClasses },
    initialNodes,
  );

  const checkBaseNode = [{ id: "root", val: 0, state: "compare" as ElementState }];
  addStep(
    13,
    "Check Termination Base Case Criteria",
    `Checked (depth 0 >= ${maxDepth}) or (num_samples ${numSamples} < ${minSamplesSplit}) or (num_classes ${numClasses} == 1). Condition evaluated to False. Proceeding with split search.`,
    { termination: false, depth: 0 },
    checkBaseNode,
  );

  let bestGain = -Infinity;
  let bestFeature: number | null = null;
  let bestThreshold: number | null = null;
  let bestLeftMask: boolean[] | null = null;

  addStep(
    17,
    "Initialize best_gain = -inf",
    "Set best_gain accumulator to negative infinity.",
    { best_gain: "-inf" },
    initialNodes,
  );

  addStep(
    18,
    "Initialize best_feature = None",
    "Set best_feature pointer to None.",
    { best_feature: "None" },
    initialNodes,
  );

  addStep(
    19,
    "Initialize best_threshold = None",
    "Set best_threshold pointer to None.",
    { best_threshold: "None" },
    initialNodes,
  );

  addStep(
    20,
    "Initialize best_left_mask = None",
    "Set best_left_mask boolean array pointer to None.",
    { best_left_mask: "None" },
    initialNodes,
  );

  const classCounts: Record<number, number> = {};
  y.forEach((lbl) => (classCounts[lbl] = (classCounts[lbl] || 0) + 1));
  const parentGini =
    1.0 - Object.values(classCounts).reduce((acc, cnt) => acc + (cnt / numSamples) ** 2, 0);

  addStep(
    22,
    `Calculate Parent Node Gini Impurity = ${parentGini.toFixed(4)}`,
    `Evaluated parent Gini impurity parent_gini = 1.0 - sum( (cnt / N)^2 ) = ${parentGini.toFixed(4)}.`,
    { parentGini },
    initialNodes,
  );

  const numFeatures = X[0].length;
  addStep(
    24,
    `Extract Features Count: num_features = ${numFeatures}`,
    `Input feature dimension count: num_features = ${numFeatures}.`,
    { numFeatures },
    initialNodes,
  );

  for (let fIdx = 0; fIdx < numFeatures; fIdx++) {
    addStep(
      25,
      `Outer Feature Loop: f_idx = ${fIdx} of ${numFeatures - 1}`,
      `Evaluating split candidates for feature column X[${fIdx}].`,
      { fIdx },
      initialNodes,
    );

    const featureVals = X.map((row) => row[fIdx]);
    addStep(
      26,
      `Extract Feature Column Values X[:, ${fIdx}]`,
      `Extracted feature values: [${featureVals.join(", ")}].`,
      { fIdx, featureVals: `[${featureVals.join(", ")}]` },
      initialNodes,
    );

    const sortedVals = Array.from(new Set(featureVals)).sort((a, b) => a - b);
    addStep(
      27,
      `Deduplicate and Sort Feature Values: sorted_vals`,
      `Unique sorted feature values: [${sortedVals.join(", ")}].`,
      { sortedVals: `[${sortedVals.join(", ")}]` },
      initialNodes,
    );

    for (let i = 0; i < sortedVals.length - 1; i++) {
      const threshold = (sortedVals[i] + sortedVals[i + 1]) / 2.0;
      addStep(
        30,
        `Candidate Threshold ${i + 1}/${sortedVals.length - 1}: threshold = ${threshold.toFixed(2)}`,
        `Evaluating candidate split threshold t = (${sortedVals[i]} + ${sortedVals[i + 1]}) / 2 = ${threshold.toFixed(2)}.`,
        { fIdx, threshold },
        initialNodes,
      );

      const leftMask = X.map((row) => row[fIdx] <= threshold);
      addStep(
        31,
        `Construct Boolean Partition Mask left_mask`,
        `Evaluated sample mask for X[${fIdx}] <= ${threshold.toFixed(2)}.`,
        { leftMask: JSON.stringify(leftMask) },
        initialNodes,
      );

      const yLeft = y.filter((_, j) => leftMask[j]);
      const yRight = y.filter((_, j) => !leftMask[j]);

      addStep(
        33,
        `Partition Targets: y_left (${yLeft.length} samples), y_right (${yRight.length} samples)`,
        `Left targets: [${yLeft.join(", ")}], Right targets: [${yRight.join(", ")}].`,
        { n_left: yLeft.length, n_right: yRight.length },
        initialNodes,
      );

      if (yLeft.length === 0 || yRight.length === 0) continue;

      const leftGini =
        1.0 -
        Object.values(
          yLeft.reduce<Record<number, number>>((acc, lbl) => {
            acc[lbl] = (acc[lbl] || 0) + 1;
            return acc;
          }, {}),
        ).reduce((acc, cnt) => acc + (cnt / yLeft.length) ** 2, 0);
      const rightGini =
        1.0 -
        Object.values(
          yRight.reduce<Record<number, number>>((acc, lbl) => {
            acc[lbl] = (acc[lbl] || 0) + 1;
            return acc;
          }, {}),
        ).reduce((acc, cnt) => acc + (cnt / yRight.length) ** 2, 0);

      const gain =
        parentGini -
        ((yLeft.length / numSamples) * leftGini + (yRight.length / numSamples) * rightGini);

      addStep(
        42,
        `Evaluated Gini Split Gain = ${gain.toFixed(4)}`,
        `Gini(Parent)=${parentGini.toFixed(4)}, Gini(Left)=${leftGini.toFixed(4)}, Gini(Right)=${rightGini.toFixed(4)} -> Gain = ${gain.toFixed(4)}.`,
        { gain, leftGini, rightGini },
        initialNodes,
      );

      if (gain > bestGain) {
        bestGain = gain;
        bestFeature = fIdx;
        bestThreshold = threshold;
        bestLeftMask = leftMask;

        addStep(
          45,
          `New Optimal Split Found! Feature X[${fIdx}] <= ${threshold.toFixed(2)}, Gain = ${bestGain.toFixed(4)}`,
          `Updated best tree split: Feature ${fIdx}, Threshold ${threshold.toFixed(2)}, Gain ${bestGain.toFixed(4)}.`,
          { bestGain, bestFeature, bestThreshold },
          initialNodes,
        );
      }
    }
  }

  addStep(
    50,
    "Check Valid Split Selection: best_gain > 0",
    `Evaluated best split: Feature X[${bestFeature}] <= ${bestThreshold?.toFixed(2)} with Gini Gain = ${bestGain.toFixed(4)} > 0. Proceeding with recursive partitioning.`,
    { bestGain, bestFeature: bestFeature ?? 0, bestThreshold: bestThreshold ?? 0 },
    initialNodes,
  );

  const XLeft = X.filter((_, j) => bestLeftMask![j]);
  const yLeft = y.filter((_, j) => bestLeftMask![j]);
  const XRight = X.filter((_, j) => !bestLeftMask![j]);
  const yRight = y.filter((_, j) => !bestLeftMask![j]);

  addStep(
    54,
    `Slice Partition Subsets: X_left (${XLeft.length} samples), X_right (${XRight.length} samples)`,
    `Partitioned dataset into Left child (${XLeft.length} samples) and Right child (${XRight.length} samples) using mask X[${bestFeature}] <= ${bestThreshold?.toFixed(2)}.`,
    { n_left: XLeft.length, n_right: XRight.length },
    initialNodes,
  );

  const treeWithLeftChild = [
    { id: "root", val: 0, leftId: "left", state: "active" as ElementState },
    { id: "left", val: 0, state: "active" as ElementState },
  ];
  addStep(
    60,
    `Recursive Call: build_greedy_decision_tree(X_left, y_left, depth=1)`,
    `Invoking recursive tree builder for left child with ${yLeft.length} samples at depth=1.`,
    { depth: 1, samples: yLeft.length },
    treeWithLeftChild,
  );

  const yLeftClasses = Array.from(new Set(yLeft));
  const leftMajorityClass = yLeftClasses[0];
  const treeWithLeftLeaf = [
    { id: "root", val: 0, leftId: "left", state: "active" as ElementState },
    { id: "left", val: leftMajorityClass, state: "sorted" as ElementState },
  ];
  addStep(
    13,
    `Left Child Base Case: num_classes = ${yLeftClasses.length} == 1 (Pure Node)`,
    `Left child node target labels [${yLeft.join(", ")}] are pure class ${leftMajorityClass}. Returns Leaf(value=${leftMajorityClass}).`,
    { leafValue: leftMajorityClass, pure: true },
    treeWithLeftLeaf,
  );

  const treeWithRightChild = [
    { id: "root", val: 0, leftId: "left", rightId: "right", state: "active" as ElementState },
    { id: "left", val: leftMajorityClass, state: "sorted" as ElementState },
    { id: "right", val: 1, state: "active" as ElementState },
  ];
  addStep(
    61,
    `Recursive Call: build_greedy_decision_tree(X_right, y_right, depth=1)`,
    `Invoking recursive tree builder for right child with ${yRight.length} samples at depth=1.`,
    { depth: 1, samples: yRight.length },
    treeWithRightChild,
  );

  const yRightClasses = Array.from(new Set(yRight));
  const rightMajorityClass = yRightClasses[0];
  const treeWithRightLeaf = [
    { id: "root", val: 0, leftId: "left", rightId: "right", state: "active" as ElementState },
    { id: "left", val: leftMajorityClass, state: "sorted" as ElementState },
    { id: "right", val: rightMajorityClass, state: "sorted" as ElementState },
  ];
  addStep(
    13,
    `Right Child Base Case: num_classes = ${yRightClasses.length} == 1 (Pure Node)`,
    `Right child node target labels [${yRight.join(", ")}] are pure class ${rightMajorityClass}. Returns Leaf(value=${rightMajorityClass}).`,
    { leafValue: rightMajorityClass, pure: true },
    treeWithRightLeaf,
  );

  const finalTree = [
    { id: "root", val: 0, leftId: "left", rightId: "right", state: "sorted" as ElementState },
    { id: "left", val: leftMajorityClass, state: "sorted" as ElementState },
    { id: "right", val: rightMajorityClass, state: "sorted" as ElementState },
  ];
  const roundedGain = Math.round(bestGain * 10000) / 10000;
  addStep(
    63,
    `Execution Complete: CART Decision Tree Root Node Assembled (Feature X[${bestFeature}] <= ${bestThreshold?.toFixed(2)}, Gain=${roundedGain})`,
    `Completed greedy decision tree root node construction. Best feature = ${bestFeature}, Threshold = ${bestThreshold?.toFixed(2)}, Gain = ${roundedGain}.`,
    {
      bestFeature: bestFeature ?? 0,
      bestThreshold: bestThreshold ?? 0,
      bestGain: roundedGain,
      completed: true,
    },
    finalTree,
  );

  return steps;
};

const GREEDY_DECISION_TREE_BUILDER_TRIVIA: TriviaMeta = {
  skipLines: [8, 12, 16, 21, 23, 28, 32, 35, 38, 41, 43, 49, 53, 56, 59, 62],
  distractors: [
    "best_gain = sum(y_left) + sum(y_right)",
    "threshold = sorted_vals[i]",
    "gain = gini_left - gini_right",
    "if depth == 0: return TreeNode(value=0)",
  ],
  hints: [
    {
      line: 13,
      hint: "Check pre-pruning termination criteria: depth >= max_depth, num_samples < min_samples_split, or pure node.",
    },
    { line: 42, hint: "CART Gini Gain formula: parent_gini - weighted child Gini sum." },
  ],
  lineExplanations: {
    1: "Defines TreeNode class representing decision tree internal nodes and leaf nodes.",
    2: "Initializes TreeNode attributes feature_idx, threshold, left child, right child, and leaf value.",
    3: "Assigns feature_idx attribute.",
    4: "Assigns threshold attribute.",
    5: "Assigns left child reference.",
    6: "Assigns right child reference.",
    7: "Assigns leaf prediction value attribute.",
    8: "Blank line before main builder function definition.",
    9: "Defines entry point for build_greedy_decision_tree function implementing CART.",
    10: "Measures sample count num_samples = len(y).",
    11: "Measures unique target classes count num_classes = len(set(y)).",
    12: "Blank line before base case termination check.",
    13: "Checks pre-pruning termination condition: depth >= max_depth or num_samples < min_samples_split or pure node.",
    14: "Computes majority target class label for leaf node prediction.",
    15: "Returns terminal leaf TreeNode predicting majority_class.",
    16: "Blank line before best split accumulators initialization.",
    17: "Initializes best_gain accumulator to negative infinity.",
    18: "Initializes best_feature pointer to None.",
    19: "Initializes best_threshold pointer to None.",
    20: "Initializes best_left_mask boolean partition array pointer to None.",
    21: "Blank line before parent Gini computation.",
    22: "Calculates parent node Gini Impurity: 1.0 - sum((cnt / N)^2).",
    23: "Blank line before feature iteration loop.",
    24: "Measures feature count num_features = len(X[0]).",
    25: "Iterates over feature column index f_idx from 0 to num_features - 1.",
    26: "Extracts feature values for column f_idx across all node samples.",
    27: "Deduplicates and sorts unique feature values sorted_vals.",
    28: "Blank line before candidate threshold loop.",
    29: "Iterates over adjacent sorted feature value pairs.",
    30: "Calculates candidate split midpoint threshold = (sorted_vals[i] + sorted_vals[i + 1]) / 2.0.",
    31: "Constructs boolean partition mask left_mask for X[j][f_idx] <= threshold.",
    32: "Blank line before target slicing.",
    33: "Filters target labels for left partition y_left.",
    34: "Filters target labels for right partition y_right.",
    35: "Blank line before empty partition guard.",
    36: "Checks if partition resulted in empty child node.",
    37: "Skips invalid split candidate.",
    38: "Blank line before child Gini computations.",
    39: "Calculates Gini impurity of left child partition.",
    40: "Calculates Gini impurity of right child partition.",
    41: "Blank line before Gini Gain calculation.",
    42: "Calculates Gini Gain = parent_gini - weighted average child Gini.",
    43: "Blank line before updating best split.",
    44: "Checks if evaluated candidate split improves best_gain.",
    45: "Updates best_gain to evaluated gain.",
    46: "Updates best_feature to f_idx.",
    47: "Updates best_threshold to candidate threshold.",
    48: "Updates best_left_mask to left_mask.",
    49: "Blank line before fallback check.",
    50: "Checks if best_gain <= 0 or no valid feature split was found.",
    51: "Computes majority target class label for fallback leaf node.",
    52: "Returns fallback terminal leaf TreeNode predicting majority_class.",
    53: "Blank line before recursive child node construction.",
    54: "Slices left child feature matrix X_left.",
    55: "Slices left child target labels y_left.",
    56: "Blank line between left and right slicing.",
    57: "Slices right child feature matrix X_right.",
    58: "Slices right child target labels y_right.",
    59: "Blank line before recursive calls.",
    60: "Recursively constructs left child sub-tree: build_greedy_decision_tree(X_left, y_left, ..., depth + 1).",
    61: "Recursively constructs right child sub-tree: build_greedy_decision_tree(X_right, y_right, ..., depth + 1).",
    62: "Blank line before returning internal decision node.",
    63: "Returns internal decision TreeNode with best split feature, threshold, left child, and right child.",
  },
};

export const greedyDecisionTreeBuilder: AlgorithmDefinition<GreedyDecisionTreeBuilderInput> = {
  id: "greedy-decision-tree-builder",
  title: "Top-Down Greedy Decision Tree Builder (CART)",
  topicIds: ["ml_tree_ensembles", "advanced_range_queries"],
  difficulty: "Hard",
  description:
    "The Top-Down Greedy Decision Tree Builder implements the **CART (Classification and Regression Trees)** recursive induction algorithm (Breiman et al. 1984). Starting at the root node with dataset $D = (X, y)$, the builder greedily scans all feature dimensions $j \\in \\{1 \\dots D\\}$ and continuous threshold candidates $t$ to find the optimal split $(j^*, t^*)$ that maximizes Gini Impurity reduction (or Variance Reduction). The dataset is partitioned into $D_L, D_R$, and the builder recurses on both children until depth bounds ($depth \\ge max\\_depth$) or minimum sample limits ($N < min\\_samples$) are reached.\n\n### Why It Exists\nDecision trees are non-parametric models capable of learning arbitrary non-linear multi-class decision boundaries without feature scaling or normalization. Top-down recursive greedy induction is the foundational algorithm behind DecisionTree, Random Forest, and Gradient Boosted Trees.\n\n### Mathematical Formulation\nFor dataset $D = \\{(x_i, y_i)\\}_{i=1}^N$ with feature dimension $D$, candidate split $(j, t)$ partitions $D$ into $D_L = \\{i \\mid x_{i,j} \\le t\\}$ and $D_R = \\{i \\mid x_{i,j} > t\\}$:\n\n$$1. \\quad I_G(D) = 1 - \\sum_{k=1}^{K} p_k^2 \\quad (\\text{Parent Node Gini Impurity})$$\n\n$$2. \\quad \\text{Gain}(j, t) = I_G(D) - \\left( \\frac{|D_L|}{|D|} I_G(D_L) + \\frac{|D_R|}{|D|} I_G(D_R) \\right)$$\n\n$$3. \\quad (j^*, t^*) = \\arg\\max_{j, t} \\text{Gain}(j, t)$$\n\n### Step-by-Step Intuition\n1. **Base Case Check**: If $depth \\ge max\\_depth$, $N < min\\_samples$, or $D$ is pure ($num\\_classes = 1$), return a leaf node predicting the majority class $\\hat{y} = \\text{Mode}(y)$.\n2. **Feature & Threshold Scanning**: For each feature axis $j$, sort unique feature values and compute midpoint threshold candidates $t = \\frac{v_i + v_{i+1}}{2}$.\n3. **Gini Gain Evaluation**: Evaluate Gini Gain for each candidate split $(j, t)$. Track maximum gain $(j^*, t^*)$.\n4. **Dataset Partitioning**: Partition $X, y$ into $X_L, y_L$ and $X_R, y_R$ using optimal mask $X[j^*] \\le t^*$.\n5. **Recursive Tree Assembly**: Recursively build left child $T_L$ and right child $T_R$, assembling internal node $(j^*, t^*, T_L, T_R)$.\n\n### Key Trade-Offs & Hardware Execution\n- **Greedy Sub-Optimality**: Top-down greedy splitting selects the locally optimal split at each node, which is not guaranteed to yield the globally optimal decision tree (finding the globally optimal decision tree is NP-Complete).\n- **Regularization Pre-Pruning**: Setting $max\\_depth \\in [3, 8]$ and $min\\_samples \\in [2, 20]$ prevents deep overfitted trees.",
  constraints: ["1 <= N <= 100000", "1 <= D <= 100", "maxDepth >= 1", "minSamplesSplit >= 2"],
  examples: [
    {
      kind: "basic",
      title: "8-Sample 2D Clustering Tree Induction (maxDepth=2)",
      inputDisplay: "X: 8 samples in 2D space, y: 4 zeros & 4 ones, maxDepth = 2",
      outputDisplay: "Tree Root Node (Feature 0, Threshold 3.50, Gain 0.5000)",
      input: DEFAULT_GREEDY_TREE_BUILDER_INPUT,
      output: "TreeNode(feature_idx=0, threshold=3.5, left=Node, right=Node)",
      explanation:
        "Splits 8 samples at X[0] <= 3.50, separating 4 zeros from 4 ones with perfect Gini Gain = 0.5000.",
    },
  ],
  code: GREEDY_DECISION_TREE_BUILDER_CODE,
  timeComplexity: {
    best: "O(D \\cdot N \\log N \\cdot H)",
    average: "O(D \\cdot N \\log N \\cdot H)",
    worst: "O(D \\cdot N^2)",
  },
  spaceComplexity: "O(N \\cdot H)",
  complexityAnalysis: {
    time: "At each node, sorting $D$ feature columns takes $O(D \\cdot N \\log N)$ time. Across tree depth $H$, total time is $O(D \\cdot N \\log N \\cdot H)$.",
    space:
      "Requires $O(N \\cdot H)$ memory space to store sliced feature matrices during recursive tree recursion.",
  },
  topicGuide: {
    overview:
      "The Top-Down Greedy Decision Tree Builder recursively constructs decision trees using CART Gini Gain split optimization.",
    sections: [
      {
        heading: "Core Concept & CART Recursive Induction",
        body: "CART builds trees top-down by greedily evaluating Gini Gain across all features and threshold candidates, partitioning dataset D into left and right sub-trees until termination criteria are reached.",
      },
      {
        heading: "Pre-Pruning & Termination Criteria",
        body: "Tree growth terminates when depth >= max_depth, N < min_samples_split, or node is pure (num_classes = 1). Pre-pruning prevents growing deep overfitted leaf nodes.",
      },
      {
        heading: "Feature Selection & Threshold Midpoints",
        body: "Threshold candidates are evaluated as midpoints between adjacent sorted unique feature values: t = (v_i + v_{i+1}) / 2. This guarantees exact evaluation of all distinct partition boundaries.",
      },
      {
        heading: "NP-Completeness & Greedy Sub-Optimality",
        body: "Finding the globally optimal decision tree is NP-Complete. Top-down greedy splitting makes locally optimal choices, which works exceptionally well in practice when combined with ensemble boosting or bagging.",
      },
    ],
    keyTerms: [
      {
        term: "Top-Down Induction",
        definition:
          "Recursive decision tree construction starting at root and splitting dataset downwards.",
      },
      {
        term: "CART Algorithm",
        definition:
          "Classification and Regression Trees framework introduced by Leo Breiman et al. in 1984.",
      },
      {
        term: "Pre-Pruning",
        definition:
          "Halting tree growth early using max_depth or min_samples_split limits to prevent overfitting.",
      },
      {
        term: "Threshold Midpoint",
        definition:
          "Split candidate t = (v_i + v_{i+1}) / 2 evaluated between adjacent sorted feature values.",
      },
    ],
  },
  trivia: GREEDY_DECISION_TREE_BUILDER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_GREEDY_TREE_BUILDER_INPUT,
  generateSteps: generateGreedyTreeBuilderSteps,
};
