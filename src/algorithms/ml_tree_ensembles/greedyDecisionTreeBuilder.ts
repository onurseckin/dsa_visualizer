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
    """
    Top-Down Greedy Decision Tree Builder (CART).
    Recursively finds the best feature split maximizing Gini Impurity reduction until
    max_depth or min_samples_split termination criteria are reached.
    """
    num_samples = len(y)
    num_classes = len(set(y))

    # Base case: pure leaf or depth limit reached
    if depth >= max_depth or num_samples < min_samples_split or num_classes == 1:
        majority_class = max(set(y), key=y.count)
        return TreeNode(value=majority_class)

    best_gain = -float('inf')
    best_feature = None
    best_threshold = None
    best_left_mask = None

    # Calculate parent Gini impurity
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

    # Recurse left and right
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

  const getSnapshot = (
    activeIdx: number = -1,
  ) => {
    return {
      kind: "array" as const,
      elements: y.map((labelVal, i) => ({
        id: `s-${i}`,
        value: labelVal,
        label: `S${i} (f0=${X[i][0]}, y=${labelVal})`,
        state: i === activeIdx ? ("active" as ElementState) : ("default" as ElementState),
      })),
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIdx: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeIdx),
      auxiliaryState: {
        customState: {
          "Algorithm": "Top-Down Greedy Decision Tree Builder (CART)",
          "Total Samples N": String(y.length),
          "Features Count D": String(X[0].length),
          "Max Depth": String(maxDepth),
          "Min Samples Split": String(minSamplesSplit),
        },
      },
      variables,
    });
  };

  // Function entry
  addStep(
    9,
    "Top-Down Greedy Decision Tree Builder Entry",
    `Started CART decision tree building on ${y.length} samples with max_depth=${maxDepth}, min_samples_split=${minSamplesSplit}.`,
    { n: y.length, maxDepth, minSamplesSplit },
  );

  // Measure num_samples (15)
  const numSamples = y.length;
    addStep(
    10,
    "Function docstring — describes algorithm contract",
    "Opening delimiter of the Python docstring.",
    {},
  );

  addStep(
    11,
    "Docstring body: algorithm description",
    "Top-Down Greedy Decision Tree Builder (CART).",
    {},
  );

  addStep(
    12,
    "Docstring body: algorithm description",
    "Recursively finds the best feature split maximizing Gini Impurity reduction",
    {},
  );

  addStep(
    13,
    "Docstring body: algorithm description",
    "max_depth or min_samples_split termination criteria are reached.",
    {},
  );

  addStep(
    14,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

addStep(
    15,
    `Measure Node Samples Count: num_samples = ${numSamples}`,
    `Node sample count num_samples = ${numSamples}.`,
    { num_samples: numSamples },
  );

  // Measure num_classes (16)
  const uniqueClasses = Array.from(new Set(y));
  const numClasses = uniqueClasses.length;
  addStep(
    16,
    `Measure Unique Classes Count: num_classes = ${numClasses}`,
    `Unique target classes present: ${numClasses} (Classes: [${uniqueClasses.join(", ")}]).`,
    { num_classes: numClasses },
  );

  // Check base case (19)
  addStep(
    19,
    "Check Termination Base Case Criteria",
    `Checked (depth >= ${maxDepth}) or (num_samples < ${minSamplesSplit}) or (num_classes == 1). Condition evaluated to False. Proceeding with split search.`,
    { termination: false },
  );

  // Init best accumulators (23..26)
  let bestGain = -Infinity;
  let bestFeature: number | null = null;
  let bestThreshold: number | null = null;

  addStep(
    23,
    "Initialize best_gain = -inf",
    "Set best_gain accumulator to negative infinity.",
    { best_gain: "-inf" },
  );

  addStep(
    24,
    "Initialize best_feature = None",
    "Set best_feature pointer to None.",
    { best_feature: "None" },
  );

  addStep(
    25,
    "Initialize best_threshold = None",
    "Set best_threshold pointer to None.",
    { best_threshold: "None" },
  );

  addStep(
    26,
    "Initialize best_left_mask = None",
    "Set best_left_mask boolean array pointer to None.",
    { best_left_mask: "None" },
  );

  // Parent Gini (29)
  const classCounts: Record<number, number> = {};
  y.forEach((lbl) => (classCounts[lbl] = (classCounts[lbl] || 0) + 1));
  const parentGini = 1.0 - Object.values(classCounts).reduce((acc, cnt) => acc + (cnt / numSamples) ** 2, 0);

  addStep(
    29,
    `Calculate Parent Node Gini Impurity = ${parentGini.toFixed(4)}`,
    `Evaluated parent Gini impurity = ${parentGini.toFixed(4)}.`,
    { parentGini },
  );

  const numFeatures = X[0].length;
  addStep(
    31,
    `Extract Features Count: num_features = ${numFeatures}`,
    `Input feature dimension count: num_features = ${numFeatures}.`,
    { numFeatures },
  );

  // Scan features
  for (let fIdx = 0; fIdx < numFeatures; fIdx++) {
    addStep(
      32,
      `Outer Feature Loop: f_idx = ${fIdx} of ${numFeatures - 1}`,
      `Evaluating split candidates for feature column X[${fIdx}].`,
      { fIdx },
    );

    const featureVals = X.map((row) => row[fIdx]);
    addStep(
      33,
      `Extract Feature Column Values X[:, ${fIdx}]`,
      `Extracted feature values: [${featureVals.join(", ")}].`,
      { fIdx, featureVals: `[${featureVals.join(", ")}]` },
    );

    const sortedVals = Array.from(new Set(featureVals)).sort((a, b) => a - b);
    addStep(
      34,
      `Deduplicate and Sort Feature Values: sorted_vals`,
      `Unique sorted feature values: [${sortedVals.join(", ")}].`,
      { sortedVals: `[${sortedVals.join(", ")}]` },
    );

    for (let i = 0; i < sortedVals.length - 1; i++) {
      const threshold = (sortedVals[i] + sortedVals[i + 1]) / 2.0;
      addStep(
        36,
        `Candidate Threshold ${i + 1}/${sortedVals.length - 1}: threshold = ${threshold.toFixed(2)}`,
        `Evaluating candidate split threshold t = (${sortedVals[i]} + ${sortedVals[i + 1]}) / 2 = ${threshold.toFixed(2)}.`,
        { fIdx, threshold },
      );

      const leftMask = X.map((row) => row[fIdx] <= threshold);
      addStep(
        37,
        `Construct Boolean Partition Mask left_mask`,
        `Evaluated sample mask for X[${fIdx}] <= ${threshold.toFixed(2)}.`,
        { leftMask: JSON.stringify(leftMask) },
      );

      const yLeft = y.filter((_, j) => leftMask[j]);
      const yRight = y.filter((_, j) => !leftMask[j]);

      addStep(
        39,
        `Partition Targets: y_left (${yLeft.length} samples), y_right (${yRight.length} samples)`,
        `Left targets: [${yLeft.join(", ")}], Right targets: [${yRight.join(", ")}].`,
        { n_left: yLeft.length, n_right: yRight.length },
      );

      if (yLeft.length === 0 || yRight.length === 0) continue;

      const leftGini = 1.0 - Object.values(yLeft.reduce<Record<number, number>>((acc, lbl) => ({ ...acc, [lbl]: (acc[lbl] || 0) + 1 }), {})).reduce((acc, cnt) => acc + (cnt / yLeft.length) ** 2, 0);
      const rightGini = 1.0 - Object.values(yRight.reduce<Record<number, number>>((acc, lbl) => ({ ...acc, [lbl]: (acc[lbl] || 0) + 1 }), {})).reduce((acc, cnt) => acc + (cnt / yRight.length) ** 2, 0);

      const gain = parentGini - ((yLeft.length / numSamples) * leftGini + (yRight.length / numSamples) * rightGini);

      addStep(
        49,
        `Evaluated Gini Split Gain = ${gain.toFixed(4)}`,
        `Gini(Parent)=${parentGini.toFixed(4)}, Gini(Left)=${leftGini.toFixed(4)}, Gini(Right)=${rightGini.toFixed(4)} -> Gain = ${gain.toFixed(4)}.`,
        { gain, leftGini, rightGini },
      );

      if (gain > bestGain) {
        bestGain = gain;
        bestFeature = fIdx;
        bestThreshold = threshold;

        addStep(
          52,
          `New Optimal Split Found! Feature X[${fIdx}] <= ${threshold.toFixed(2)}, Gain = ${bestGain.toFixed(4)}`,
          `Updated best tree split: Feature ${fIdx}, Threshold ${threshold.toFixed(2)}, Gain ${bestGain.toFixed(4)}.`,
          { bestGain, bestFeature, bestThreshold },
        );
      }
    }
  }

  // Recurse left & right steps
  addStep(
    62,
    `Recursive Sub-Tree Expansion: Splitting Node on X[${bestFeature}] <= ${bestThreshold?.toFixed(2)}`,
    `Partitioning ${numSamples} node samples into Left child (${y.filter((_, j) => X[j][bestFeature!] <= bestThreshold!).length}) and Right child.`,
    { bestFeature: bestFeature ?? 0, bestThreshold: bestThreshold ?? 0, bestGain },
  );

  const roundedGain = Math.round(bestGain * 10000) / 10000;
  addStep(
    71,
    `Execution Complete: Decision Tree Root Node Built (Best Feature X[${bestFeature}], t=${bestThreshold?.toFixed(2)}, Gain=${roundedGain})`,
    `Completed greedy decision tree root node construction. Best feature = ${bestFeature}, Threshold = ${bestThreshold?.toFixed(2)}, Gain = ${roundedGain}.`,
    { bestFeature: bestFeature ?? 0, bestThreshold: bestThreshold ?? 0, bestGain: roundedGain, completed: true },
  );

  return steps;
};

const GREEDY_DECISION_TREE_BUILDER_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 17, 18, 20, 21, 22, 27, 28, 30, 35, 38, 40, 48, 50, 56, 57, 60, 61, 65, 68, 70],
  distractors: [
    "best_gain = sum(y_left) + sum(y_right)",
    "threshold = sorted_vals[i]",
    "gain = gini_left - gini_right",
    "if depth == 0: return TreeNode(value=0)",
  ],
  hints: [
    { line: 45, hint: "Check base case termination: depth >= max_depth, num_samples < min_samples_split, or pure node." },
    { line: 75, hint: "CART Gini Gain formula: parent_gini - weighted child Gini sum." },
  ],
  lineExplanations: {
    1: "Defines TreeNode class representing decision tree internal nodes and leaf nodes.",
    2: "Initializes TreeNode attributes feature_idx, threshold, left child, right child, and leaf value.",
    3: "Assigns feature_idx attribute.",
    4: "Assigns threshold attribute.",
    5: "Assigns left child node reference.",
    6: "Assigns right child node reference.",
    7: "Assigns leaf prediction value attribute.",
    8: "Blank line before main builder function definition.",
    9: "Defines entry point for build_greedy_decision_tree function implementing CART.",
    10: "Docstring opening delimiter tag.",
    11: "Describes Top-Down Greedy Decision Tree Builder (CART).",
    12: "Docstring detailing recursive Gini Impurity reduction split search until depth or min_samples termination.",
    13: "Docstring closing delimiter tag.",
    14: "Measures sample count num_samples = len(y).",
    15: "Measures unique classes count num_classes = len(set(y)).",
    16: "Blank line before base case termination check.",
    17: "Comment for base case pure leaf or depth limit check.",
    18: "Checks termination condition: depth >= max_depth or num_samples < min_samples_split or pure node.",
    19: "Computes majority class label in current node samples.",
    20: "Returns terminal leaf TreeNode with value=majority_class.",
    21: "Blank line before best split accumulators initialization.",
    22: "Initializes best_gain to negative infinity.",
    23: "Initializes best_feature pointer to None.",
    24: "Initializes best_threshold pointer to None.",
    25: "Initializes best_left_mask pointer to None.",
    26: "Blank line before parent Gini computation.",
    27: "Comment for parent Gini impurity calculation.",
    28: "Evaluates parent node Gini impurity parent_gini = 1.0 - sum( (cnt / N)^2 ).",
    29: "Blank line before feature iteration loop.",
    30: "Measures feature count num_features = len(X[0]).",
    31: "Iterates over feature column index f_idx from 0 to num_features - 1.",
    32: "Extracts feature values for column f_idx across all node samples.",
    33: "Deduplicates and sorts unique feature values sorted_vals.",
    34: "Blank line before candidate threshold loop.",
    35: "Iterates over adjacent sorted feature value pairs.",
    36: "Calculates candidate split midpoint threshold = (sorted_vals[i] + sorted_vals[i+1]) / 2.0.",
    37: "Constructs boolean partition mask left_mask for X[j][f_idx] <= threshold.",
    38: "Blank line before target slicing.",
    39: "Slices left child targets y_left.",
    40: "Slices right child targets y_right.",
    41: "Blank line before empty partition guard.",
    42: "Skips invalid split candidate if y_left or y_right is empty.",
    43: "Continues to next threshold candidate.",
    44: "Blank line before child Gini computations.",
    45: "Evaluates Gini impurity for left child node gini_left.",
    46: "Evaluates Gini impurity for right child node gini_right.",
    47: "Blank line before Gini Gain calculation.",
    48: "Calculates Gini Gain = parent_gini - weighted child Gini sum.",
    49: "Blank line before updating best split.",
    50: "Checks if evaluated gain exceeds current best_gain.",
    51: "Updates best_gain to gain.",
    52: "Updates best_feature to f_idx.",
    53: "Updates best_threshold to threshold.",
    54: "Updates best_left_mask to left_mask.",
    55: "Blank line before no-gain fallback check.",
    56: "Checks if best_gain <= 0 or no valid feature split was found.",
    57: "Computes majority class label for fallback leaf node.",
    58: "Returns fallback terminal leaf TreeNode(value=majority_class).",
    59: "Blank line before recursive child node construction.",
    60: "Comment for left and right recursive expansion.",
    61: "Slices left child feature matrix X_left.",
    62: "Slices left child target labels y_left.",
    63: "Blank line between left and right slicing.",
    64: "Slices right child feature matrix X_right.",
    65: "Slices right child target labels y_right.",
    66: "Blank line before recursive calls.",
    67: "Recursively builds left child sub-tree: build_greedy_decision_tree(X_left, y_left, ..., depth + 1).",
    68: "Recursively builds right child sub-tree: build_greedy_decision_tree(X_right, y_right, ..., depth + 1).",
    69: "Blank line before returning internal decision node.",
    70: "Returns internal decision TreeNode with best_feature, best_threshold, left child, and right child.",
    71: "Blank line at end of file.",
  },
};

export const greedyDecisionTreeBuilder: AlgorithmDefinition<GreedyDecisionTreeBuilderInput> = {
  id: "greedyDecisionTreeBuilder",
  title: "Top-Down Greedy Decision Tree Builder (CART)",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles", "advanced_range_queries"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "The Top-Down Greedy Decision Tree Builder implements the **CART (Classification and Regression Trees)** recursive induction algorithm (Breiman et al. 1984). Starting at the root node with dataset $D = (X, y)$, the builder greedily scans all feature dimensions $j \\in \\{1 \\dots D\\}$ and continuous threshold candidates $t$ to find the optimal split $(j^*, t^*)$ that maximizes Gini Impurity reduction (or Variance Reduction). The dataset is partitioned into $D_L, D_R$, and the builder recurses on both children until depth bounds ($depth \\ge max\\_depth$) or minimum sample limits ($N < min\\_samples$) are reached.\n\n### Why It Exists\nDecision trees are non-parametric models capable of learning arbitrary non-linear multi-class decision boundaries without feature scaling or normalization. Top-down recursive greedy induction is the foundational algorithm behind DecisionTree, Random Forest, and Gradient Boosted Trees.\n\n### Mathematical Formulation\nFor dataset $D = \\{(x_i, y_i)\\}_{i=1}^N$ with feature dimension $D$, candidate split $(j, t)$ partitions $D$ into $D_L = \\{i \\mid x_{i,j} \\le t\\}$ and $D_R = \\{i \\mid x_{i,j} > t\\}$:\n\n$$1. \\quad I_G(D) = 1 - \\sum_{k=1}^{K} p_k^2 \\quad (\\text{Parent Node Gini Impurity})$$\n\n$$2. \\quad \\text{Gain}(j, t) = I_G(D) - \\left( \\frac{|D_L|}{|D|} I_G(D_L) + \\frac{|D_R|}{|D|} I_G(D_R) \\right)$$\n\n$$3. \\quad (j^*, t^*) = \\arg\\max_{j, t} \\text{Gain}(j, t)$$\n\n### Step-by-Step Intuition\n1. **Base Case Check**: If $depth \\ge max\\_depth$, $N < min\\_samples$, or $D$ is pure ($num\\_classes = 1$), return a leaf node predicting the majority class $\\hat{y} = \\text{Mode}(y)$.\n2. **Feature & Threshold Scanning**: For each feature axis $j$, sort unique feature values and compute midpoint threshold candidates $t = \\frac{v_i + v_{i+1}}{2}$.\n3. **Gini Gain Evaluation**: Evaluate Gini Gain for each candidate split $(j, t)$. Track maximum gain $(j^*, t^*)$.\n4. **Dataset Partitioning**: Partition $X, y$ into $X_L, y_L$ and $X_R, y_R$ using optimal mask $X[j^*] \\le t^*$.\n5. **Recursive Tree Assembly**: Recursively build left child $T_L$ and right child $T_R$, assembling internal node $(j^*, t^*, T_L, T_R)$.\n\n### Key Trade-Offs & Hardware Execution\n- **Greedy Sub-Optimality**: Top-down greedy splitting selects the locally optimal split at each node, which is not guaranteed to yield the globally optimal decision tree (finding the globally optimal decision tree is NP-Complete).\n- **Regularization Pre-Pruning**: Setting $max\\_depth \\in [3, 8]$ and $min\\_samples \\in [2, 20]$ prevents deep overfitted trees.",
  constraints: [
    "1 <= N <= 100000",
    "1 <= D <= 100",
    "maxDepth >= 1",
    "minSamplesSplit >= 2",
  ],
  examples: [
    {
      kind: "basic",
      title: "8-Sample 2D Clustering Tree Induction (maxDepth=2)",
      inputDisplay: "X: 8 samples in 2D space, y: 4 zeros & 4 ones, maxDepth = 2",
      outputDisplay: "Tree Root Node (Feature 0, Threshold 3.50, Gain 0.5000)",
      input: DEFAULT_GREEDY_TREE_BUILDER_INPUT,
      output: "TreeNode(feature_idx=0, threshold=3.5, left=Node, right=Node)",
      explanation: "Splits 8 samples at X[0] <= 3.50, separating 4 zeros from 4 ones with perfect Gini Gain = 0.5000.",
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
    space: "Requires $O(N \\cdot H)$ memory space to store sliced feature matrices during recursive tree recursion.",
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
        definition: "Recursive decision tree construction starting at root and splitting dataset downwards.",
      },
      {
        term: "CART Algorithm",
        definition: "Classification and Regression Trees framework introduced by Leo Breiman et al. in 1984.",
      },
      {
        term: "Pre-Pruning",
        definition: "Halting tree growth early using max_depth or min_samples_split limits to prevent overfitting.",
      },
      {
        term: "Threshold Midpoint",
        definition: "Split candidate t = (v_i + v_{i+1}) / 2 evaluated between adjacent sorted feature values.",
      },
    ],
  },
  trivia: GREEDY_DECISION_TREE_BUILDER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_GREEDY_TREE_BUILDER_INPUT,
  generateSteps: generateGreedyTreeBuilderSteps,
};
