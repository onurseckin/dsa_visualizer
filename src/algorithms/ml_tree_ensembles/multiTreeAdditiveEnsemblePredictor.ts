import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface MultiTreeAdditiveEnsemblePredictorInput {
  baseScore: number;
  learningRate: number;
  treeLeafValues: number[]; // Leaf value output per tree for target sample
}

export const DEFAULT_MULTI_TREE_ADDITIVE_INPUT: MultiTreeAdditiveEnsemblePredictorInput = {
  baseScore: 0.0,
  learningRate: 0.1,
  treeLeafValues: [1.5, -0.8, 0.4, 0.2],
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
  const { baseScore, learningRate, treeLeafValues } = input;
  let stepIndex = 0;

  const sigmoid = (z: number) => 1.0 / (1.0 + Math.exp(-z));

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Initialize GBDT Multi-Tree Additive Ensemble Predictor",
      why: `Base margin score = ${baseScore}, learning rate eta = ${learningRate}. Summing predictions across K = ${treeLeafValues.length} trees.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: treeLeafValues.map((val, idx) => ({
        id: `tree-${idx}`,
        value: Math.round(val * 10),
        label: `Tree ${idx + 1}: f(x) = ${val}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        baseScore: String(baseScore),
        learningRate: String(learningRate),
        totalTrees: String(treeLeafValues.length),
        status: "Initialized",
      },
    },
    variables: { baseScore, learningRate, numTrees: treeLeafValues.length },
  });

  let currMargin = baseScore;
  const marginHistory: number[] = [];

  for (let k = 0; k < treeLeafValues.length; k++) {
    const leafVal = treeLeafValues[k];
    const contribution = learningRate * leafVal;
    currMargin += contribution;
    marginHistory.push(currMargin);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 13,
      explanation: {
        what: `Tree ${k + 1} Accumulation: f_${k + 1}(x) = ${leafVal} (Contribution = eta * f = ${contribution.toFixed(
          3,
        )})`,
        why: `Updated cumulative raw prediction margin z = ${currMargin.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: treeLeafValues.map((v, idx) => ({
          id: `tree-${idx}`,
          value: Math.round(v * 10),
          label: `Tree ${idx + 1} (${idx <= k ? marginHistory[idx].toFixed(2) : "?"})`,
          state:
            idx === k
              ? ("active" as ElementState)
              : idx < k
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === k ? [`+ ${contribution.toFixed(3)}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          activeTree: `Tree ${k + 1}`,
          leafValue: String(leafVal),
          shrunkContribution: contribution.toFixed(3),
          cumulativeMargin: currMargin.toFixed(4),
        },
      },
      variables: { k: k + 1, leafVal, currMargin: Math.round(currMargin * 10000) / 10000 },
    });
  }

  // Step Final: Probability Conversion
  const finalProb = sigmoid(currMargin);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `Additive Prediction Complete: Final Probability = ${finalProb.toFixed(4)}`,
      why: `Final margin z = ${currMargin.toFixed(4)}. Sigmoid conversion p = 1 / (1 + exp(-z)) = ${finalProb.toFixed(
        4,
      )}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: marginHistory.map((m, idx) => ({
        id: `tree-${idx}`,
        value: Math.round(m * 10),
        label: `Tree ${idx + 1}: z=${m.toFixed(2)}`,
        state: "sorted" as ElementState,
        pointers: idx === marginHistory.length - 1 ? [`Final Prob: ${finalProb.toFixed(4)}`] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        finalMargin: currMargin.toFixed(4),
        finalProbability: finalProb.toFixed(4),
        status: "Completed",
      },
    },
    variables: {
      finalMargin: currMargin,
      finalProb: Math.round(finalProb * 10000) / 10000,
      complete: true,
    },
  });

  return steps;
};

export const multiTreeAdditiveEnsemblePredictor: AlgorithmDefinition<MultiTreeAdditiveEnsemblePredictorInput> =
  {
    id: "multiTreeAdditiveEnsemblePredictor",
    title: "Multi-Tree Additive Ensemble Predictor (GBDT)",
    category: "ml_tree_ensembles",
    categories: ["ml_tree_ensembles"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_tree_ensembles",
    description:
      "Computes additive ensemble predictions for Gradient Boosted Decision Trees (GBDT / XGBoost / LightGBM). Combines predictions across K trees via margin summation z_i = base_score + learning_rate * sum_{k=1}^K f_k(x_i), applying sigmoid transformation for classification probability.\n\nInput Format:\n- baseScore: Initial global model prediction margin.\n- learningRate: Shrinkage parameter eta (0.0 < eta <= 1.0).\n- treeLeafValues: Array of scalar leaf output values from K trees for target sample.\n\nOutput Format:\n- Returns tuple (finalMargin, finalProbability, cumulativeMarginHistory).\n\nEdge Cases & Constraints:\n- Empty tree list: Returns baseScore.",
    constraints: ["0.0 < learningRate <= 1.0."],
    examples: [
      {
        kind: "basic",
        title: "4-Tree GBDT Additive Ensemble Prediction",
        inputDisplay: "baseScore = 0.0, eta = 0.1, 4 tree leaves",
        outputDisplay: "Final Margin: 0.13, Final Probability: 0.5325",
        input: DEFAULT_MULTI_TREE_ADDITIVE_INPUT,
        output: "Margin 0.13, Prob 0.5325",
        explanation: "Sums 0.1 * (1.5 - 0.8 + 0.4 + 0.2) = 0.13 -> sigmoid(0.13) = 0.5325.",
      },
      {
        kind: "complex",
        title: "High Negative Margin (Probability near 0)",
        inputDisplay: "treeLeafValues = [-10, -10]",
        outputDisplay: "Final Margin: -2.0, Probability: 0.1192",
        input: {
          baseScore: 0.0,
          learningRate: 0.1,
          treeLeafValues: [-10.0, -10.0],
        },
        output: "Prob 0.1192",
        explanation: "Negative tree outputs pull prediction margin to -2.0.",
      },
      {
        kind: "negative",
        title: "Zero Learning Rate",
        inputDisplay: "learningRate = 0.0",
        outputDisplay: "Margin remains baseScore 0.0 (Prob 0.5)",
        input: {
          baseScore: 0.0,
          learningRate: 0.0,
          treeLeafValues: [5.0, 5.0],
        },
        output: "Margin 0.0",
        explanation: "Zero shrinkage blocks tree contributions.",
      },
    ],
    defaultInput: DEFAULT_MULTI_TREE_ADDITIVE_INPUT,
    code: MULTI_TREE_ADDITIVE_PREDICTOR_CODE,
    timeComplexity: {
      best: "O(K)",
      average: "O(K)",
      worst: "O(K)",
    },
    spaceComplexity: "O(K)",
    complexityAnalysis: {
      time: "O(K) linear time summation across K decision trees.",
      space: "O(K) auxiliary space to record cumulative margin history.",
    },
    topicGuide: {
      overview:
        "Gradient Boosted Decision Trees (Friedman 2001) construct models additively F_K(x) = sum_{k=1}^K eta f_k(x). During inference, a test sample routes through K trees simultaneously, accumulating leaf weights into a final margin prediction.",
      sections: [
        {
          heading: "Overview & Shrinkage (Learning Rate)",
          body: "Shrinkage parameter eta scales the contribution of each newly added tree f_k(x), preventing early trees from dominating the model and reducing overfitting.",
        },
        {
          heading: "Classification vs Regression Prediction",
          body: "Regression outputs raw margin z directly. Classification applies link function p = sigmoid(z) = 1 / (1 + exp(-z)).",
        },
        {
          heading: "Systems & SIMD Batch Vectorization",
          body: "Production inference engines (Treelite, XGBoost C++ Predictor) compile decision tree structures into SIMD assembly or C code, evaluating batch queries across CPU threads.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "When treeLeafValues array is empty (K = 0), the predictor returns baseScore as the raw margin and sigmoid(baseScore) as the classification probability.",
        },
      ],
      keyTerms: [
        {
          term: "Additive Model",
          definition:
            "Ensemble model where final prediction is the weighted sum of individual tree outputs.",
        },
        {
          term: "Shrinkage (eta)",
          definition:
            "Learning rate parameter scaling down tree predictions to improve ensemble generalization.",
        },
        {
          term: "Margin Prediction",
          definition:
            "Unbounded linear sum z before transformation by sigmoid/exponential link functions.",
        },
        {
          term: "Base Score",
          definition:
            "Initial baseline prediction value (e.g. 0.0 or log-odds of prior label probability) before adding tree outputs.",
        },
      ],
    },
    sources: [
      { type: "ml_infra", kind: "ml_infra", label: "Gradient Boosting Machines (Friedman 2001)" },
    ],
    generateSteps: generateMultiTreeAdditiveSteps,
  };
