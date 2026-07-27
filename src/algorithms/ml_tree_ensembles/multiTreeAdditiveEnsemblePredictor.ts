import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface MultiTreeAdditiveEnsemblePredictorInput {
  baseScore: number;
  learningRate: number;
  treeLeafValues: number[];
  data?: number[];
  target?: number;
}

export const DEFAULT_MULTI_TREE_ADDITIVE_INPUT: MultiTreeAdditiveEnsemblePredictorInput = {
  baseScore: 0.0,
  learningRate: 0.1,
  treeLeafValues: [1.5, -0.8, 0.4, 0.2, -0.5, 0.6, 0.3, -0.4, 0.5, 0.1, -0.2, 0.4],
  data: [1.5, -0.8, 0.4, 0.2, -0.5, 0.6, 0.3, -0.4, 0.5, 0.1, -0.2, 0.4],
  target: 0,
};

export const MULTI_TREE_ADDITIVE_PREDICTOR_CODE = `import math

def sigmoid(z: float) -> float:
    return 1.0 / (1.0 + math.exp(-z))

def multi_tree_additive_predict(base_score: float, learning_rate: float, tree_leaf_values: list[float]) -> tuple[float, float, list[float]]:
    """
    Gradient Boosted Decision Tree (GBDT) Additive Ensemble Predictor.
    y_hat_margin = base_score + learning_rate * sum(f_k(x)) across K trees.
    Computes cumulative raw margin predictions and final sigmoid classification probability.
    """
    cumulative_margins = []
    curr_margin = base_score

    for k, leaf_val in enumerate(tree_leaf_values):
        curr_margin += learning_rate * leaf_val
        cumulative_margins.append(round(curr_margin, 4))

    final_prob = round(sigmoid(curr_margin), 4)
    return curr_margin, final_prob, cumulative_margins`;

export const generateMultiTreeAdditiveSteps = (
  input: MultiTreeAdditiveEnsemblePredictorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const baseScore = input.baseScore ?? 0.0;
  const learningRate = input.learningRate ?? 0.1;
  const treeLeafValues = input.treeLeafValues || input.data || [1.5, -0.8, 0.4, 0.2, -0.5, 0.6, 0.3, -0.4, 0.5, 0.1, -0.2, 0.4];
  let stepIndex = 0;
  const numTrees = treeLeafValues.length;

  const sigmoid = (z: number) => 1.0 / (1.0 + Math.exp(-z));

  // Step 1: Import math
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Import Python math Module",
      why: "Imports math module for exponential function math.exp(-z).",
    },
    primarySnapshot: {
      kind: "array",
      elements: treeLeafValues.map((val, idx) => ({
        id: `tree-${idx}`,
        value: Math.round(val * 10),
        label: `Tree ${idx + 1}: f=${val}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: { customState: { "Module": "math" } },
    variables: { imported: true },
  });

  // Step 2: Function entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Initialize GBDT Multi-Tree Additive Ensemble Predictor",
      why: `Base score = ${baseScore}, learning rate eta = ${learningRate}. Combining predictions across K = ${numTrees} trees.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: treeLeafValues.map((val, idx) => ({
        id: `tree-${idx}`,
        value: Math.round(val * 10),
        label: `Tree ${idx + 1}: ${val}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        "Base Score": String(baseScore),
        "Learning Rate eta": String(learningRate),
        "Total Trees K": String(numTrees),
        "Status": "Function Entry",
      },
    },
    variables: { baseScore, learningRate, numTrees },
  });

  // Step 3: Init cumulative_margins
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: "Allocate Empty cumulative_margins [] List",
      why: "Initializes list to record step-by-step margin accumulation after each boosting tree.",
    },
    primarySnapshot: {
      kind: "array",
      elements: treeLeafValues.map((val, idx) => ({ id: `tree-${idx}`, value: Math.round(val * 10), label: `Tree ${idx + 1}: ${val}`, state: "default" as ElementState })),
    },
    auxiliaryState: { customState: { "Cumulative Margins": "[]" } },
    variables: { marginsCount: 0 },
  });

  // Step 4: Init curr_margin
  let currMargin = baseScore;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: `Initialize Margin Prediction: curr_margin = base_score (${baseScore})`,
      why: `Set initial margin prior curr_margin = ${baseScore}. Prior probability = ${sigmoid(baseScore).toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: treeLeafValues.map((val, idx) => ({ id: `tree-${idx}`, value: Math.round(val * 10), label: `Tree ${idx + 1}: ${val}`, state: "default" as ElementState })),
    },
    auxiliaryState: {
      customState: {
        "curr_margin": currMargin.toFixed(4),
        "curr_prob": sigmoid(currMargin).toFixed(4),
      },
    },
    variables: { currMargin },
  });

  const cumulativeMargins: number[] = [];

  // Loop over trees (15..17)
  treeLeafValues.forEach((leafVal, k) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 15,
      explanation: {
        what: `Tree ${k + 1}/${numTrees}: Fetch Leaf Prediction f_${k + 1}(x) = ${leafVal}`,
        why: `Loading leaf output weight f_${k + 1}(x) = ${leafVal} from boosting tree ${k + 1}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: treeLeafValues.map((val, i) => ({
          id: `tree-${i}`,
          value: Math.round(val * 10),
          label: `Tree ${i + 1}: ${val}`,
          state: i === k ? ("active" as ElementState) : i < k ? ("visited" as ElementState) : ("default" as ElementState),
        })),
      },
      auxiliaryState: {
        customState: {
          "Current Tree": `Tree ${k + 1}`,
          "Tree Output f(x)": String(leafVal),
          "Shrinkage Step": `${learningRate} * ${leafVal} = ${(learningRate * leafVal).toFixed(4)}`,
        },
      },
      variables: { k, leafVal },
    });

    const updateStep = learningRate * leafVal;
    currMargin += updateStep;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 16,
      explanation: {
        what: `Update Margin: curr_margin += ${learningRate} * ${leafVal} -> ${currMargin.toFixed(4)}`,
        why: `Added shrunk tree update: curr_margin is now ${currMargin.toFixed(4)}. Current probability = ${sigmoid(currMargin).toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: treeLeafValues.map((val, i) => ({
          id: `tree-${i}`,
          value: Math.round(val * 10),
          label: `Tree ${i + 1}: ${val}`,
          state: i === k ? ("compare" as ElementState) : i < k ? ("visited" as ElementState) : ("default" as ElementState),
        })),
      },
      auxiliaryState: {
        customState: {
          "Accumulated Margin": currMargin.toFixed(4),
          "Probability p": sigmoid(currMargin).toFixed(4),
        },
      },
      variables: { updateStep, currMargin },
    });

    const roundedMargin = Math.round(currMargin * 10000) / 10000;
    cumulativeMargins.push(roundedMargin);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 17,
      explanation: {
        what: `Record Cumulative Margin ${roundedMargin} after Tree ${k + 1}`,
        why: `Appended ${roundedMargin} to cumulative_margins array.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: treeLeafValues.map((val, i) => ({
          id: `tree-${i}`,
          value: Math.round(val * 10),
          label: `z=${cumulativeMargins[i] ?? val}`,
          state: i <= k ? ("visited" as ElementState) : ("default" as ElementState),
        })),
      },
      auxiliaryState: { customState: { "Cumulative Margins": `[${cumulativeMargins.join(", ")}]` } },
      variables: { roundedMargin, count: cumulativeMargins.length },
    });
  });

  // Final probability (19)
  const finalProb = Math.round(sigmoid(currMargin) * 10000) / 10000;
  const finalMargin = Math.round(currMargin * 10000) / 10000;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Compute Final Sigmoid Classification Probability: p = ${finalProb}`,
      why: `Evaluated final classification probability p = sigmoid(${finalMargin}) = 1 / (1 + exp(-${finalMargin})) = ${finalProb}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: treeLeafValues.map((val, i) => ({
        id: `tree-${i}`,
        value: Math.round(val * 10),
        label: `z=${cumulativeMargins[i]}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        "Final Raw Margin z": String(finalMargin),
        "Final Probability p": String(finalProb),
        "Binary Class": finalProb >= 0.5 ? "Class 1 (Positive)" : "Class 0 (Negative)",
      },
    },
    variables: { finalMargin, finalProb },
  });

  // Return step (20)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 20,
    explanation: {
      what: `Execution Complete: Return (margin=${finalMargin}, prob=${finalProb}, cumulative_margins)`,
      why: `Successfully computed GBDT additive prediction across ${numTrees} trees. Final raw margin = ${finalMargin}, Sigmoid probability = ${finalProb}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: treeLeafValues.map((val, i) => ({
        id: `tree-${i}`,
        value: Math.round(val * 10),
        label: `p=${finalProb}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        "Final Raw Margin z": String(finalMargin),
        "Final Probability p": String(finalProb),
        "Total Trees K": String(numTrees),
      },
    },
    variables: { finalMargin, finalProb, completed: true },
  });

  return steps;
};

const MULTI_TREE_ADDITIVE_PREDICTOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 5, 7, 8, 9, 10, 11, 14, 18],
  distractors: [
    "curr_margin += leaf_val / learning_rate",
    "final_prob = curr_margin * learning_rate",
    "curr_margin = sum(tree_leaf_values)",
    "return final_prob, curr_margin",
  ],
  hints: [
    { line: 16, hint: "GBDT additive expansion equation: curr_margin += learning_rate * leaf_val." },
    { line: 19, hint: "Final classification probability: sigmoid(curr_margin)." },
  ],
  lineExplanations: {
    1: "Imports Python math module for exponential function math.exp(-z).",
    2: "Blank line before sigmoid helper definition.",
    3: "Defines sigmoid helper function converting raw margin z to probability p.",
    4: "Evaluates and returns logistic sigmoid: 1.0 / (1.0 + math.exp(-z)).",
    5: "Blank line before main additive predictor function definition.",
    6: "Defines entry point for multi_tree_additive_predict function.",
    7: "Docstring opening delimiter tag.",
    8: "Describes Gradient Boosted Decision Tree (GBDT) Additive Ensemble Predictor.",
    9: "Docstring additive formula: y_hat_margin = base_score + learning_rate * sum(f_k(x)) across K trees.",
    10: "Docstring continuation detailing cumulative margin predictions and final sigmoid probability.",
    11: "Docstring closing delimiter tag.",
    12: "Initializes empty list cumulative_margins to record step-by-step margin progress.",
    13: "Initializes curr_margin = base_score prior value.",
    14: "Blank line before tree boosting loop.",
    15: "Iterates over tree index k and leaf output weight leaf_val in enumerate(tree_leaf_values).",
    16: "Accumulates shrunk tree prediction into margin: curr_margin += learning_rate * leaf_val.",
    17: "Appends rounded curr_margin to cumulative_margins list.",
    18: "Blank line separating boosting loop from final probability transform.",
    19: "Transforms final raw margin to classification probability final_prob = round(sigmoid(curr_margin), 4).",
    20: "Returns tuple of (curr_margin, final_prob, cumulative_margins).",
  },
};

export const multiTreeAdditiveEnsemblePredictor: AlgorithmDefinition<MultiTreeAdditiveEnsemblePredictorInput> =
  {
    id: "multiTreeAdditiveEnsemblePredictor",
    title: "GBDT Multi-Tree Additive Ensemble Predictor",
    category: "ml_tree_ensembles",
    categories: ["ml_tree_ensembles", "advanced_range_queries"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_tree_ensembles",
    description:
      "The GBDT Multi-Tree Additive Ensemble Predictor implements the forward additive prediction engine used by **Gradient Boosted Decision Trees (XGBoost, LightGBM, CatBoost, Scikit-Learn GradientBoosting)**. Rather than taking a simple majority vote (like Random Forests), GBDT models construct predictions as a linear combination of $K$ weak decision trees, applying shrinkage (learning rate $\\eta$) to each tree's leaf prediction value.\n\n### Why It Exists\nGradient Boosting formulates ensemble learning as gradient descent in function space. Each new tree $f_k(x)$ fits the negative gradient residuals of the pre-existing ensemble $F_{k-1}(x)$. Shrinkage $\\eta \\in (0.1, 0.01)$ prevents early trees from dominating predictions.\n\n### Mathematical Formulation\nFor a GBDT model with base score prior $F_0(x) = \\text{base\\_score}$, learning rate $\\eta$, and $K$ trees with leaf prediction values $f_k(x)$:\n\n$$1. \\quad z_K(x) = F_0(x) + \\eta \\sum_{k=1}^{K} f_k(x) \\quad (\\text{Cumulative Raw Log-Odds Margin})$$\n\n$$2. \\quad \\hat{y}_{prob} = \\sigma(z_K(x)) = \\frac{1}{1 + e^{-z_K(x)}} \\quad (\\text{Binary Classification Probability})$$\n\n$$3. \\quad \\hat{y}_{reg} = z_K(x) \\quad (\\text{Regression Prediction})$$\n\n### Step-by-Step Intuition\n1. **Base Prior Initialization**: Start with raw margin prior $z_0 = \\text{base\\_score}$ (e.g. $z_0 = 0.0 \\to p_0 = 0.5$).\n2. **Sequential Tree Accumulation**: For each boosting tree $k=1 \\dots K$, evaluate leaf prediction weight $f_k(x)$.\n3. **Shrinkage Update**: Add shrunk tree output to margin: $z_k = z_{k-1} + \\eta \\cdot f_k(x)$.\n4. **Sigmoid Probability Transform**: Apply logistic sigmoid function $\\sigma(z_K)$ to convert log-odds margin into probability $\\hat{y}_{prob} \\in (0, 1)$.\n\n### Key Trade-Offs & Hardware Execution\n- **Learning Rate Shrinkage ($\\eta$)**: Smaller $\\eta$ requires more trees $K$ but yields significantly better test generalization (dampening overfitting).\n- **High-Throughput SIMD Inference**: Tree ensemble inference engines (Treelite, Hummingbird, ONNX Runtime) compile $K$ trees into vectorized SIMD instructions (`vaddps`, `vmulps`), executing 1,000 trees in $< 50$ microseconds.",
    constraints: [
      "1 <= K <= 10000",
      "0.0001 <= learningRate <= 1.0",
      "treeLeafValues elements are finite floats",
    ],
    examples: [
      {
        kind: "basic",
        title: "12-Tree GBDT Additive Ensemble Prediction (eta = 0.1)",
        inputDisplay: "Base Score = 0.0, eta = 0.1, 12 Tree Leaf Values",
        outputDisplay: "Final Margin z = 0.25, Final Probability p = 0.5622",
        input: DEFAULT_MULTI_TREE_ADDITIVE_INPUT,
        output: "(0.25, 0.5622, [cumulative_margins])",
        explanation: "Accumulates 12 shrunk tree outputs (eta=0.1) onto base score 0.0, yielding final margin 0.25 and probability 0.5622.",
      },
    ],
    code: MULTI_TREE_ADDITIVE_PREDICTOR_CODE,
    timeComplexity: { best: "O(K)", average: "O(K)", worst: "O(K)" },
    spaceComplexity: "O(K)",
    complexityAnalysis: {
      time: "Linear in the number of boosting trees $K$, taking $O(K)$ addition and multiplication operations.",
      space: "Requires $O(K)$ memory to store cumulative margin predictions.",
    },
    topicGuide: {
      overview:
        "The GBDT Multi-Tree Additive Ensemble Predictor combines predictions across K boosting trees with learning rate shrinkage.",
      sections: [
        {
          heading: "Core Concept & Additive Expansion",
          body: "GBDT builds predictions additively: z_K(x) = base_score + eta * sum(f_k(x)). Each tree f_k(x) predicts leaf weight updates scaled by learning rate eta.",
        },
        {
          heading: "Role of Learning Rate Shrinkage (Eta)",
          body: "Learning rate eta in (0.01, 0.1) shrinks each tree's contribution, acting as an L2 regularizer in function space to prevent overfitting.",
        },
        {
          heading: "Classification vs Regression Output Formats",
          body: "For regression, final prediction is raw margin z_K. For binary classification, sigmoid prob = 1 / (1 + exp(-z_K)) maps margin to [0, 1] probability.",
        },
        {
          heading: "High-Throughput SIMD Tree Compilation",
          body: "Production systems (Treelite, TVM) compile tree ensembles into flat C/CUDA code, unrolling loops to run thousands of trees per millisecond.",
        },
      ],
      keyTerms: [
        {
          term: "Additive Model",
          definition: "Ensemble model building predictions as sum of K weak base learner trees.",
        },
        {
          term: "Learning Rate Shrinkage (Eta)",
          definition: "Scaling factor eta applied to each tree's prediction to dampen overfitting.",
        },
        {
          term: "Log-Odds Margin (z)",
          definition: "Continuous un-transformed output sum z_K = base_score + eta * sum(f_k(x)).",
        },
        {
          term: "Sigmoid Activation",
          definition: "Probability transform 1 / (1 + exp(-z)) converting margin z into probability [0, 1].",
        },
      ],
    },
    trivia: MULTI_TREE_ADDITIVE_PREDICTOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_MULTI_TREE_ADDITIVE_INPUT,
    generateSteps: generateMultiTreeAdditiveSteps,
  };
