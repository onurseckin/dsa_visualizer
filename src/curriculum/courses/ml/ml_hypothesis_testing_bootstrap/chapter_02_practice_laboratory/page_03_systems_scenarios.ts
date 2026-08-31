import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_hypothesis_testing_bootstrap_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Hypothesis Testing Systems Suite",
  subtitle:
    "Question Bank Suite: A/B Testing Multi-Armed Bandits, PRNG State Leakage, and Permutation Traps",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_hypothesis_testing_bootstrap",
      title: "Statistical Testing & Bootstrap Systems Suite",
      partA_dsaCoding: [
        {
          title: "Multi-Metric Model Evaluation Bootstrap Matrix",
          difficulty: "Hard",
          description:
            "Write a Python function that evaluates multiple performance metrics (Accuracy, F1, Expected Calibration Error) simultaneously across B bootstrap resamples, computing 95% confidence intervals for all metrics in a single pass.",
          problemStatement:
            "def batch_multimetric_bootstrap(y_true: np.ndarray, y_prob: np.ndarray, num_resamples: int = 5000) -> dict:\n    pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Asymptotic Variance of the Sample Mean Bootstrap",
          statement:
            "Prove that the variance of the empirical bootstrap sample mean Var(X_bar*) equals (n-1)/n^2 * S^2 where S^2 is the unbiased sample variance, asymptotically matching the true variance of the sample mean Var(X_bar) = sigma^2 / n.",
          proofOutline:
            "Let X_1*, ..., X_n* be drawn with replacement from x_1..x_n. Conditioned on data, each X_i* has mean x_bar and variance 1/n sum (x_j - x_bar)^2 = (n-1)/n S^2. Because resamples are mutually independent given the data, the variance of their average is 1/n^2 sum Var(X_i*) = 1/n * (n-1)/n S^2 = (n-1)/n^2 S^2 approx S^2 / n.",
          engineeringContext:
            "This proves that bootstrap resampling accurately replicates the second-order sampling variance of statistical estimators without analytical standard error formulas.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Continuous A/B Testing vs Peeking Bias in Production Deployments",
          prompt:
            "Why does continually checking p-values in a live production A/B test (e.g. stopping as soon as p < 0.05) inflate the true false positive rate from 5% to over 30%, and how do Sequential Probability Ratio Tests (SPRT) or alpha-spending functions fix this?",
          engineeringContext:
            "Repeatedly evaluating fixed-sample hypothesis tests on an accumulating data stream creates an 'optional stopping' hazard: the random walk of test statistics will eventually cross the alpha threshold by pure chance. Alpha-spending functions allocate a small slice of total significance alpha to each interim evaluation point, preserving the global Type I error bound.",
        },
      ],
      partD_stressTests: [
        {
          title: "Data Leakage in Cross-Validation Permutation Tests",
          scenario:
            "An ML engineer performs a permutation test to assess whether a high-dimensional feature extractor finds real signal. They shuffle labels AFTER performing TF-IDF feature selection on the entire dataset. The test reports p = 0.0001 (statistically significant) even on pure Gaussian white noise.",
          failureMode:
            "Feature selection on the whole dataset leaks target correlation into the selected feature indices before label shuffling. The permutation test evaluates the combined pipeline of feature selection + classification; shuffling only the classifier labels leaves the data-leakage bias intact. Shuffling MUST occur prior to all feature selection steps.",
        },
      ],
    },
  ],
};

export const page3 = page_03_systems_scenarios;
