import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Zap,
  Grid,
  Activity,
  Shuffle,
  Plus,
  Trash2,
  Sliders,
  BarChart2,
  Table as TableIcon,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type KernelType =
  | "rbf"
  | "matern32"
  | "matern52"
  | "periodic"
  | "rational_quadratic"
  | "linear";

export type KernelCompositionMode = "single" | "sum" | "product";

export interface KernelHyperparameters {
  readonly lengthscale: number; // ell > 0
  readonly variance: number; // sigma_f^2 > 0 (output scale)
  readonly period?: number; // p > 0 (for periodic)
  readonly alpha?: number; // alpha > 0 (for rational quadratic)
  readonly offset?: number; // c in (x - c) (for linear)
  readonly sigma0?: number; // sigma_0^2 constant offset (for linear)
  readonly noiseVariance: number; // sigma_n^2 >= 0
  readonly jitter: number; // epsilon for Cholesky stability
}

export interface ComposedKernelConfig {
  readonly mode: KernelCompositionMode;
  readonly kernel1: KernelType;
  readonly kernel2: KernelType;
  readonly params1: KernelHyperparameters;
  readonly params2: KernelHyperparameters;
  readonly noiseVariance: number;
  readonly jitter: number;
}

export interface GPObservationPoint {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly noise?: number;
  readonly isFixed?: boolean;
}

export interface MarginalLogLikelihoodResult {
  readonly mll: number;
  readonly dataFit: number;
  readonly complexityPenalty: number;
  readonly normalizationConstant: number;
  readonly perPointMLL: number;
}

export interface EigenSpectrumResult {
  readonly eigenvalues: readonly number[];
  readonly conditionNumber: number;
  readonly effectiveDOF: number;
  readonly cumulativeVariance: readonly number[];
}

export interface GPRegressionResult {
  readonly Xstar: readonly number[];
  readonly mean: readonly number[];
  readonly variance: readonly number[];
  readonly stdDev: readonly number[];
  readonly lower1Sigma: readonly number[];
  readonly upper1Sigma: readonly number[];
  readonly lower2Sigma: readonly number[];
  readonly upper2Sigma: readonly number[];
  readonly lower3Sigma: readonly number[];
  readonly upper3Sigma: readonly number[];
  readonly samples: readonly (readonly number[])[];
  readonly X: readonly number[];
  readonly y: readonly number[];
  readonly K: readonly (readonly number[])[];
  readonly Ky: readonly (readonly number[])[];
  readonly L: readonly (readonly number[])[];
  readonly alpha: readonly number[];
  readonly rkhsNorm: number;
  readonly mll: MarginalLogLikelihoodResult;
  readonly spectrum: EigenSpectrumResult;
}

export type GPPresetId =
  | "step_function"
  | "periodic_seasonality"
  | "noisy_sine"
  | "gap_uncertainty_flare"
  | "linear_outliers"
  | "freeform_empty";

export interface GPPreset {
  readonly id: GPPresetId;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly kernelMode: KernelCompositionMode;
  readonly kernel1: KernelType;
  readonly kernel2: KernelType;
  readonly params1: KernelHyperparameters;
  readonly params2: KernelHyperparameters;
  readonly noiseVariance: number;
  readonly points: readonly GPObservationPoint[];
}

export type StudioTab =
  | "visualizer"
  | "gram_matrix"
  | "spectral"
  | "mll_decomposition"
  | "data_table"
  | "theory";

export interface GaussianProcessesKernelStudioProps {
  readonly initialPreset?: GPPresetId;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onHyperparamsChange?: (config: ComposedKernelConfig) => void;
  readonly onObservationsChange?: (points: readonly GPObservationPoint[]) => void;
}

// ============================================================================
// 2. KERNEL DEFINITIONS & DEFAULT HYPERPARAMETERS
// ============================================================================

export const DEFAULT_GP_HYPERPARAMS: KernelHyperparameters = {
  lengthscale: 1.0,
  variance: 1.0,
  period: 2.0,
  alpha: 1.0,
  offset: 0.0,
  sigma0: 0.1,
  noiseVariance: 0.04,
  jitter: 1e-6,
};

export interface KernelMetaInfo {
  readonly id: KernelType;
  readonly name: string;
  readonly shortFormula: string;
  readonly fullFormulaTeX: string;
  readonly description: string;
  readonly smoothness: string;
  readonly bestFor: string;
  readonly params: readonly (keyof KernelHyperparameters)[];
}

export const KERNEL_DEFINITIONS: Record<KernelType, KernelMetaInfo> = {
  rbf: {
    id: "rbf",
    name: "Squared Exponential / RBF / Gaussian",
    shortFormula: "k(x, x') = σ_f² exp(-(x-x')² / (2ℓ²))",
    fullFormulaTeX:
      "k_{\\text{SE}}(x, x') = \\sigma_f^2 \\exp\\left(-\\frac{(x-x')^2}{2\\ell^2}\\right)",
    description:
      "Infinitely differentiable (C^∞) kernel generating exceptionally smooth sample paths with Gaussian decay.",
    smoothness: "Infinitely Differentiable (C^∞)",
    bestFor: "Smooth stationary physical phenomena, unconstrained interpolation",
    params: ["lengthscale", "variance"],
  },
  matern32: {
    id: "matern32",
    name: "Matérn 3/2",
    shortFormula: "k(x, x') = σ_f² (1 + √3 r / ℓ) exp(-√3 r / ℓ)",
    fullFormulaTeX:
      "k_{3/2}(r) = \\sigma_f^2 \\left(1 + \\frac{\\sqrt{3}r}{\\ell}\\right) \\exp\\left(-\\frac{\\sqrt{3}r}{\\ell}\\right), \\quad r = |x - x'|",
    description:
      "Once differentiable (C^1) sample paths. Realistic roughness without the extreme smoothness of RBF.",
    smoothness: "Once Differentiable (C^1)",
    bestFor: "Real-world engineering signals, financial time-series, topography",
    params: ["lengthscale", "variance"],
  },
  matern52: {
    id: "matern52",
    name: "Matérn 5/2",
    shortFormula: "k(x, x') = σ_f² (1 + √5 r / ℓ + 5r² / 3ℓ²) exp(-√5 r / ℓ)",
    fullFormulaTeX:
      "k_{5/2}(r) = \\sigma_f^2 \\left(1 + \\frac{\\sqrt{5}r}{\\ell} + \\frac{5r^2}{3\\ell^2}\\right) \\exp\\left(-\\frac{\\sqrt{5}r}{\\ell}\\right)",
    description:
      "Twice differentiable (C^2) sample paths. The standard default for Bayesian Optimization and surrogate models.",
    smoothness: "Twice Differentiable (C^2)",
    bestFor: "Bayesian Optimization (BO), hyperparameter tuning surrogates",
    params: ["lengthscale", "variance"],
  },
  periodic: {
    id: "periodic",
    name: "Periodic (Exp-Sine-Squared)",
    shortFormula: "k(x, x') = σ_f² exp(-2 sin²(π|x-x'|/p) / ℓ²)",
    fullFormulaTeX:
      "k_{\\text{per}}(x, x') = \\sigma_f^2 \\exp\\left(-\\frac{2\\sin^2\\left(\\frac{\\pi |x - x'|}{p}\\right)}{\\ell^2}\\right)",
    description:
      "Exact periodic covariance that warps input space onto a 2D circle with period p and lengthscale ℓ.",
    smoothness: "Infinitely Differentiable (C^∞)",
    bestFor: "Seasonal atmospheric cycles, diurnal patterns, periodic orbits",
    params: ["lengthscale", "variance", "period"],
  },
  rational_quadratic: {
    id: "rational_quadratic",
    name: "Rational Quadratic (RQ)",
    shortFormula: "k(x, x') = σ_f² (1 + (x-x')² / (2αℓ²))^{-α}",
    fullFormulaTeX:
      "k_{\\text{RQ}}(x, x') = \\sigma_f^2 \\left(1 + \\frac{(x - x')^2}{2\\alpha\\ell^2}\\right)^{-\\alpha}",
    description:
      "Continuous scale mixture of RBF kernels with varying lengthscales. As α → ∞, it converges to RBF.",
    smoothness: "Infinitely Differentiable (C^∞)",
    bestFor: "Multi-scale processes, turbulent systems, long-range correlations",
    params: ["lengthscale", "variance", "alpha"],
  },
  linear: {
    id: "linear",
    name: "Linear / Polynomial with Offset",
    shortFormula: "k(x, x') = σ_0² + σ_f² (x - c)(x' - c)",
    fullFormulaTeX: "k_{\\text{lin}}(x, x') = \\sigma_0^2 + \\sigma_f^2 (x - c)(x' - c)",
    description:
      "Dot-product non-stationary kernel equivalent to Bayesian Linear Regression with Gaussian prior on weights.",
    smoothness: "Non-Stationary Linear",
    bestFor: "Global linear drift, polynomial growth trends in composition",
    params: ["variance", "offset", "sigma0"],
  },
};

// ============================================================================
// 3. PRESETS
// ============================================================================

export const GP_PRESETS: Record<GPPresetId, GPPreset> = {
  step_function: {
    id: "step_function",
    name: "Step Discontinuity & Gibbs Ringing",
    category: "Roughness & Smoothness",
    description:
      "A sharp step discontinuity at x = 0. Compare C^∞ RBF overshoots with C^1 Matérn 3/2 localized adaptation.",
    kernelMode: "single",
    kernel1: "matern32",
    kernel2: "rbf",
    params1: {
      ...DEFAULT_GP_HYPERPARAMS,
      lengthscale: 0.8,
      variance: 1.5,
      noiseVariance: 0.01,
    },
    params2: {
      ...DEFAULT_GP_HYPERPARAMS,
      lengthscale: 1.0,
      variance: 1.0,
      noiseVariance: 0.01,
    },
    noiseVariance: 0.01,
    points: [
      { id: "p1", x: -4.0, y: -1.5 },
      { id: "p2", x: -3.0, y: -1.5 },
      { id: "p3", x: -2.0, y: -1.45 },
      { id: "p4", x: -1.0, y: -1.5 },
      { id: "p5", x: -0.2, y: -1.4 },
      { id: "p6", x: 0.2, y: 1.4 },
      { id: "p7", x: 1.0, y: 1.5 },
      { id: "p8", x: 2.0, y: 1.48 },
      { id: "p9", x: 3.0, y: 1.5 },
      { id: "p10", x: 4.0, y: 1.5 },
    ],
  },
  periodic_seasonality: {
    id: "periodic_seasonality",
    name: "Periodic Seasonality + Linear Drift",
    category: "Kernel Arithmetic",
    description:
      "Composite kernel: k(x, x') = k_Periodic + k_Linear. Captures rhythmic seasonal oscillation atop secular trend.",
    kernelMode: "sum",
    kernel1: "periodic",
    kernel2: "linear",
    params1: {
      ...DEFAULT_GP_HYPERPARAMS,
      lengthscale: 1.2,
      variance: 0.8,
      period: 2.5,
      noiseVariance: 0.02,
    },
    params2: {
      ...DEFAULT_GP_HYPERPARAMS,
      variance: 0.25,
      offset: 0.0,
      sigma0: 0.05,
      noiseVariance: 0.02,
    },
    noiseVariance: 0.02,
    points: [
      { id: "p1", x: -4.5, y: -1.6 },
      { id: "p2", x: -3.5, y: -0.7 },
      { id: "p3", x: -2.5, y: -1.1 },
      { id: "p4", x: -1.5, y: -0.1 },
      { id: "p5", x: -0.5, y: -0.4 },
      { id: "p6", x: 0.5, y: 0.7 },
      { id: "p7", x: 1.5, y: 0.3 },
      { id: "p8", x: 2.5, y: 1.4 },
      { id: "p9", x: 3.5, y: 1.0 },
      { id: "p10", x: 4.5, y: 2.1 },
    ],
  },
  noisy_sine: {
    id: "noisy_sine",
    name: "Noisy Sine Wave & Ridge Regularization",
    category: "Exact Conditioning",
    description: "A classic non-linear sinusoid corrupted by i.i.d. Gaussian noise σ_n² = 0.06.",
    kernelMode: "single",
    kernel1: "rbf",
    kernel2: "rbf",
    params1: {
      ...DEFAULT_GP_HYPERPARAMS,
      lengthscale: 1.4,
      variance: 1.8,
      noiseVariance: 0.06,
    },
    params2: DEFAULT_GP_HYPERPARAMS,
    noiseVariance: 0.06,
    points: [
      { id: "p1", x: -4.2, y: -1.45 },
      { id: "p2", x: -3.0, y: -0.2 },
      { id: "p3", x: -1.8, y: 1.62 },
      { id: "p4", x: -0.8, y: 1.2 },
      { id: "p5", x: 0.2, y: -0.3 },
      { id: "p6", x: 1.2, y: -1.65 },
      { id: "p7", x: 2.3, y: -1.1 },
      { id: "p8", x: 3.4, y: 0.85 },
      { id: "p9", x: 4.5, y: 1.6 },
    ],
  },
  gap_uncertainty_flare: {
    id: "gap_uncertainty_flare",
    name: "Heteroskedastic Gap Uncertainty Flare",
    category: "Epistemic Uncertainty",
    description:
      "Clusters of observations on both sides leave a wide unobserved middle domain where posterior variance flares back to the prior.",
    kernelMode: "single",
    kernel1: "rbf",
    kernel2: "rbf",
    params1: {
      ...DEFAULT_GP_HYPERPARAMS,
      lengthscale: 1.0,
      variance: 2.0,
      noiseVariance: 0.02,
    },
    params2: DEFAULT_GP_HYPERPARAMS,
    noiseVariance: 0.02,
    points: [
      { id: "p1", x: -4.5, y: -1.2 },
      { id: "p2", x: -4.0, y: -0.8 },
      { id: "p3", x: -3.5, y: -1.3 },
      { id: "p4", x: -3.0, y: -0.9 },
      { id: "p5", x: 3.0, y: 1.1 },
      { id: "p6", x: 3.5, y: 1.4 },
      { id: "p7", x: 4.0, y: 1.0 },
      { id: "p8", x: 4.5, y: 1.5 },
    ],
  },
  linear_outliers: {
    id: "linear_outliers",
    name: "Linear Trend with Severe Outlier",
    category: "Robustness & Leverage",
    description:
      "Underlying linear relationship with an extreme off-trend anomaly. Observe how GP posterior adjusts locally vs globally.",
    kernelMode: "single",
    kernel1: "rational_quadratic",
    kernel2: "rbf",
    params1: {
      ...DEFAULT_GP_HYPERPARAMS,
      lengthscale: 1.2,
      variance: 1.5,
      alpha: 1.5,
      noiseVariance: 0.04,
    },
    params2: DEFAULT_GP_HYPERPARAMS,
    noiseVariance: 0.04,
    points: [
      { id: "p1", x: -4.0, y: -1.8 },
      { id: "p2", x: -3.0, y: -1.3 },
      { id: "p3", x: -2.0, y: -0.9 },
      { id: "p4", x: -1.0, y: -0.4 },
      { id: "p5", x: 0.0, y: 2.4 }, // Outlier!
      { id: "p6", x: 1.0, y: 0.6 },
      { id: "p7", x: 2.0, y: 1.1 },
      { id: "p8", x: 3.0, y: 1.5 },
      { id: "p9", x: 4.0, y: 2.1 },
    ],
  },
  freeform_empty: {
    id: "freeform_empty",
    name: "Freeform Blank Canvas",
    category: "Sandbox Exploration",
    description:
      "Blank canvas. Click anywhere on the coordinate grid to place observation points and observe live conditioning.",
    kernelMode: "single",
    kernel1: "rbf",
    kernel2: "rbf",
    params1: DEFAULT_GP_HYPERPARAMS,
    params2: DEFAULT_GP_HYPERPARAMS,
    noiseVariance: 0.04,
    points: [],
  },
};

// ============================================================================
// 4. MATHEMATICAL KERNEL EVALUATION ENGINE
// ============================================================================

/**
 * Evaluates a single Mercer kernel function k(x1, x2; θ).
 */
export function evaluateKernel(
  type: KernelType,
  x1: number,
  x2: number,
  params: KernelHyperparameters,
): number {
  const r = Math.abs(x1 - x2);
  const d = (x1 - x2) * (x1 - x2);
  const ell = Math.max(1e-4, params.lengthscale);
  const sf2 = Math.max(1e-4, params.variance);

  switch (type) {
    case "rbf": {
      return sf2 * Math.exp(-d / (2 * ell * ell));
    }
    case "matern32": {
      const sqrt3r = (Math.sqrt(3) * r) / ell;
      return sf2 * (1 + sqrt3r) * Math.exp(-sqrt3r);
    }
    case "matern52": {
      const sqrt5r = (Math.sqrt(5) * r) / ell;
      const term2 = (5 * d) / (3 * ell * ell);
      return sf2 * (1 + sqrt5r + term2) * Math.exp(-sqrt5r);
    }
    case "periodic": {
      const p = Math.max(1e-4, params.period ?? 2.0);
      const sinVal = Math.sin((Math.PI * r) / p);
      const sinSq = sinVal * sinVal;
      return sf2 * Math.exp((-2 * sinSq) / (ell * ell));
    }
    case "rational_quadratic": {
      const alpha = Math.max(1e-4, params.alpha ?? 1.0);
      const base = 1 + d / (2 * alpha * ell * ell);
      return sf2 * Math.pow(base, -alpha);
    }
    case "linear": {
      const c = params.offset ?? 0.0;
      const sigma0Sq = Math.max(0, params.sigma0 ?? 0.1);
      return sigma0Sq + sf2 * (x1 - c) * (x2 - c);
    }
    default:
      return sf2 * Math.exp(-d / (2 * ell * ell));
  }
}

/**
 * Evaluates a composed kernel under single, sum, or product operations.
 */
export function evaluateKernelComposed(
  mode: KernelCompositionMode,
  kernel1: KernelType,
  kernel2: KernelType,
  params1: KernelHyperparameters,
  params2: KernelHyperparameters,
  x1: number,
  x2: number,
): number {
  const k1 = evaluateKernel(kernel1, x1, x2, params1);
  if (mode === "single") {
    return k1;
  }
  const k2 = evaluateKernel(kernel2, x1, x2, params2);
  if (mode === "sum") {
    return k1 + k2;
  }
  if (mode === "product") {
    return k1 * k2;
  }
  return k1;
}

/**
 * Computes an N1 x N2 Gram covariance matrix between two sets of input coordinates.
 */
export function computeGramMatrix(
  x1Array: readonly number[],
  x2Array: readonly number[],
  config: ComposedKernelConfig,
): number[][] {
  const n1 = x1Array.length;
  const n2 = x2Array.length;
  const matrix: number[][] = Array.from({ length: n1 }, () => new Array(n2).fill(0));

  const isSquareSelf = x1Array === x2Array;

  for (let i = 0; i < n1; i++) {
    const endJ = isSquareSelf ? i + 1 : n2;
    for (let j = 0; j < endJ; j++) {
      const val = evaluateKernelComposed(
        config.mode,
        config.kernel1,
        config.kernel2,
        config.params1,
        config.params2,
        x1Array[i],
        x2Array[j],
      );
      matrix[i][j] = val;
      if (isSquareSelf && i !== j) {
        matrix[j][i] = val;
      }
    }
  }

  return matrix;
}

// ============================================================================
// 5. NUMERICAL LINEAR ALGEBRA & CHOLESKY FACTORIZATION
// ============================================================================

/**
 * Robust Cholesky decomposition L L^T = A with adaptive jitter regularization.
 * Returns lower triangular matrix L.
 */
export function choleskyDecomposition(
  matrix: readonly (readonly number[])[],
  jitter = 1e-6,
): number[][] {
  const n = matrix.length;
  if (n === 0) return [];

  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  let currentJitter = Math.max(1e-12, jitter);

  // Attempt factorization with up to 5 increasing jitter steps if singular/ill-conditioned
  for (let attempt = 0; attempt < 5; attempt++) {
    let failed = false;

    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[j][k] * L[j][k];
      }

      const diagVal = matrix[j][j] + (attempt > 0 ? currentJitter : 0) - sum;

      if (diagVal <= 1e-14) {
        failed = true;
        currentJitter = Math.max(currentJitter * 10, 1e-4);
        break;
      }

      L[j][j] = Math.sqrt(diagVal);

      for (let i = j + 1; i < n; i++) {
        let s = 0;
        for (let k = 0; k < j; k++) {
          s += L[i][k] * L[j][k];
        }
        L[i][j] = (matrix[i][j] - s) / L[j][j];
      }
    }

    if (!failed) {
      return L;
    }
  }

  // Fallback safe diagonal if severely non-positive-definite
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      L[i][j] = i === j ? Math.sqrt(Math.max(1e-6, matrix[i][i] + currentJitter)) : 0;
    }
  }
  return L;
}

/**
 * Solves lower-triangular system L y = b via forward substitution.
 */
export function forwardSubstitution(
  L: readonly (readonly number[])[],
  b: readonly number[],
): number[] {
  const n = b.length;
  const y: number[] = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < i; j++) {
      sum += L[i][j] * y[j];
    }
    const diag = Math.abs(L[i][i]) > 1e-14 ? L[i][i] : 1e-6;
    y[i] = (b[i] - sum) / diag;
  }

  return y;
}

/**
 * Solves upper-triangular system L^T x = y via backward substitution.
 */
export function backwardSubstitution(
  L: readonly (readonly number[])[],
  y: readonly number[],
): number[] {
  const n = y.length;
  const x: number[] = new Array(n).fill(0);

  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += L[j][i] * x[j];
    }
    const diag = Math.abs(L[i][i]) > 1e-14 ? L[i][i] : 1e-6;
    x[i] = (y[i] - sum) / diag;
  }

  return x;
}

/**
 * Solves A x = b where A = L L^T via forward and backward substitution.
 */
export function choleskySolve(L: readonly (readonly number[])[], b: readonly number[]): number[] {
  const y = forwardSubstitution(L, b);
  return backwardSubstitution(L, y);
}

// ============================================================================
// 6. PRNG & MULTIVARIATE NORMAL SAMPLING
// ============================================================================

/**
 * Deterministic XorShift32 seeded pseudo-random number generator.
 */
export function createDeterministicRng(seed = 42): () => number {
  let s = Math.floor(Math.abs(seed)) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/**
 * Generates standard normal random variates using Box-Muller transform.
 */
export function sampleStandardNormal(rng: () => number = Math.random): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 <= 1e-15) u1 = rng();
  while (u2 <= 1e-15) u2 = rng();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Samples a random vector from a Multivariate Normal Distribution N(μ, Σ).
 */
export function sampleMultivariateNormal(
  mean: readonly number[],
  cov: readonly (readonly number[])[],
  rng: () => number = Math.random,
  jitter = 1e-6,
): number[] {
  const n = mean.length;
  if (n === 0) return [];

  // Decompose cov + jitter * I = L L^T
  const covReg: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => cov[i][j] + (i === j ? jitter : 0)),
  );
  const L = choleskyDecomposition(covReg, jitter);

  // Generate z ~ N(0, I)
  const z: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    z[i] = sampleStandardNormal(rng);
  }

  // x = μ + L z
  const sample: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = mean[i];
    for (let j = 0; j <= i; j++) {
      sum += L[i][j] * z[j];
    }
    sample[i] = sum;
  }

  return sample;
}

// ============================================================================
// 7. MARGINAL LOG-LIKELIHOOD & RKHS NORM
// ============================================================================

/**
 * Computes Exact Marginal Log-Likelihood (MLL) and its 3-component decomposition:
 * log p(y | X, θ) = -0.5 y^T K_y^{-1} y - 0.5 log|K_y| - (N/2) log(2π)
 */
export function computeMarginalLogLikelihood(
  X: readonly number[],
  y: readonly number[],
  config: ComposedKernelConfig,
): MarginalLogLikelihoodResult {
  const n = X.length;
  if (n === 0) {
    return {
      mll: 0,
      dataFit: 0,
      complexityPenalty: 0,
      normalizationConstant: 0,
      perPointMLL: 0,
    };
  }

  const K = computeGramMatrix(X, X, config);
  const Ky: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => K[i][j] + (i === j ? config.noiseVariance : 0)),
  );

  const L = choleskyDecomposition(Ky, config.jitter);
  const alphaSub = forwardSubstitution(L, y); // L^{-1} y

  // 1. Data Fit Term: -0.5 y^T K_y^{-1} y = -0.5 ||alphaSub||^2
  let fitSum = 0;
  for (let i = 0; i < n; i++) {
    fitSum += alphaSub[i] * alphaSub[i];
  }
  const dataFit = -0.5 * fitSum;

  // 2. Complexity Penalty: -0.5 log|K_y| = -sum(log(L_ii))
  let logDetHalf = 0;
  for (let i = 0; i < n; i++) {
    logDetHalf += Math.log(Math.max(1e-14, L[i][i]));
  }
  const complexityPenalty = -logDetHalf;

  // 3. Normalization Constant: -0.5 N log(2π)
  const normalizationConstant = -0.5 * n * Math.log(2 * Math.PI);

  const mll = dataFit + complexityPenalty + normalizationConstant;
  const perPointMLL = mll / n;

  return {
    mll,
    dataFit,
    complexityPenalty,
    normalizationConstant,
    perPointMLL,
  };
}

/**
 * Computes the Reproducing Kernel Hilbert Space (RKHS) norm squared:
 * ||f_bar||_H^2 = α^T K α = y^T K_y^{-1} K K_y^{-1} y
 */
export function computeRKHSNorm(
  X: readonly number[],
  y: readonly number[],
  config: ComposedKernelConfig,
): number {
  const n = X.length;
  if (n === 0) return 0;

  const K = computeGramMatrix(X, X, config);
  const Ky: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => K[i][j] + (i === j ? config.noiseVariance : 0)),
  );

  const L = choleskyDecomposition(Ky, config.jitter);
  const alpha = choleskySolve(L, y);

  let normSq = 0;
  for (let i = 0; i < n; i++) {
    let kRowAlpha = 0;
    for (let j = 0; j < n; j++) {
      kRowAlpha += K[i][j] * alpha[j];
    }
    normSq += alpha[i] * kRowAlpha;
  }

  return Math.max(0, normSq);
}

// ============================================================================
// 8. SPECTRAL DECOMPOSITION (JACOBI EIGENVALUE ALGORITHM)
// ============================================================================

/**
 * Computes sorted eigenvalues and eigenvectors of a real symmetric matrix via Jacobi rotations.
 */
export function computeGramEigenvalues(
  matrix: readonly (readonly number[])[],
  maxIter = 100,
  eps = 1e-12,
): EigenSpectrumResult {
  const n = matrix.length;
  if (n === 0) {
    return {
      eigenvalues: [],
      conditionNumber: 1.0,
      effectiveDOF: 0,
      cumulativeVariance: [],
    };
  }

  // Clone matrix
  const A: number[][] = matrix.map((row) => [...row]);
  const V: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1.0 : 0.0)),
  );

  for (let iter = 0; iter < maxIter; iter++) {
    // Find maximal off-diagonal entry
    let maxOff = 0;
    let p = 0;
    let q = 1;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const absVal = Math.abs(A[i][j]);
        if (absVal > maxOff) {
          maxOff = absVal;
          p = i;
          q = j;
        }
      }
    }

    if (maxOff < eps) break;

    // Jacobi rotation angle
    const app = A[p][p];
    const aqq = A[q][q];
    const apq = A[p][q];

    const tau = (aqq - app) / (2.0 * apq);
    const t = Math.sign(tau || 1) / (Math.abs(tau) + Math.sqrt(1.0 + tau * tau));
    const c = 1.0 / Math.sqrt(1.0 + t * t);
    const s = t * c;

    // Apply rotation to A
    A[p][p] = app - t * apq;
    A[q][q] = aqq + t * apq;
    A[p][q] = 0;
    A[q][p] = 0;

    for (let r = 0; r < n; r++) {
      if (r !== p && r !== q) {
        const arp = A[r][p];
        const arq = A[r][q];
        A[r][p] = c * arp - s * arq;
        A[p][r] = A[r][p];
        A[r][q] = s * arp + c * arq;
        A[q][r] = A[r][q];
      }
    }

    // Accumulate eigenvectors
    for (let r = 0; r < n; r++) {
      const vrp = V[r][p];
      const vrq = V[r][q];
      V[r][p] = c * vrp - s * vrq;
      V[r][q] = s * vrp + c * vrq;
    }
  }

  // Extract eigenvalues and sort descending
  const rawEigen = Array.from({ length: n }, (_, i) => Math.max(0, A[i][i]));
  const sortedEigen = [...rawEigen].sort((a, b) => b - a);

  const lambdaMax = sortedEigen[0] || 1e-12;
  const lambdaMin = Math.max(1e-15, sortedEigen[n - 1] || 1e-15);
  const conditionNumber = lambdaMax / lambdaMin;

  const totalVar = sortedEigen.reduce((acc, v) => acc + v, 0) || 1e-12;
  let cumSum = 0;
  const cumulativeVariance = sortedEigen.map((v) => {
    cumSum += v;
    return cumSum / totalVar;
  });

  // Effective degrees of freedom: Tr(K (K + σ_n^2 I)^{-1}) = sum(λ_i / (λ_i + σ_n^2))
  const noiseVar = 0.04;
  const effectiveDOF = sortedEigen.reduce((acc, lam) => acc + lam / (lam + noiseVar), 0);

  return {
    eigenvalues: sortedEigen,
    conditionNumber,
    effectiveDOF,
    cumulativeVariance,
  };
}

// ============================================================================
// 9. COMPLETE GP REGRESSION & POSTERIOR SAMPLING ENGINE
// ============================================================================

/**
 * Fits exact Gaussian Process regression on training data (X, y) and computes
 * the predictive distribution and sample trajectories over test grid Xstar.
 */
export function fitGPRegression(
  X: readonly number[],
  y: readonly number[],
  Xstar: readonly number[],
  config: ComposedKernelConfig,
  sampleCount = 3,
  rngSeed = 42,
): GPRegressionResult {
  const N = X.length;
  const M = Xstar.length;
  const rng = createDeterministicRng(rngSeed);

  // 1. PRIOR MODE (N === 0)
  if (N === 0) {
    const KstarStar = computeGramMatrix(Xstar, Xstar, config);
    const mean = new Array(M).fill(0);
    const variance: number[] = new Array(M);
    const stdDev: number[] = new Array(M);

    for (let i = 0; i < M; i++) {
      const v = Math.max(1e-6, KstarStar[i][i]);
      variance[i] = v;
      stdDev[i] = Math.sqrt(v);
    }

    const lower1Sigma = mean.map((m, i) => m - stdDev[i]);
    const upper1Sigma = mean.map((m, i) => m + stdDev[i]);
    const lower2Sigma = mean.map((m, i) => m - 2 * stdDev[i]);
    const upper2Sigma = mean.map((m, i) => m + 2 * stdDev[i]);
    const lower3Sigma = mean.map((m, i) => m - 3 * stdDev[i]);
    const upper3Sigma = mean.map((m, i) => m + 3 * stdDev[i]);

    // Sample prior trajectories
    const samples: number[][] = [];
    if (sampleCount > 0) {
      for (let s = 0; s < sampleCount; s++) {
        samples.push(sampleMultivariateNormal(mean, KstarStar, rng, config.jitter));
      }
    }

    return {
      Xstar,
      mean,
      variance,
      stdDev,
      lower1Sigma,
      upper1Sigma,
      lower2Sigma,
      upper2Sigma,
      lower3Sigma,
      upper3Sigma,
      samples,
      X,
      y,
      K: [],
      Ky: [],
      L: [],
      alpha: [],
      rkhsNorm: 0,
      mll: {
        mll: 0,
        dataFit: 0,
        complexityPenalty: 0,
        normalizationConstant: 0,
        perPointMLL: 0,
      },
      spectrum: {
        eigenvalues: [],
        conditionNumber: 1.0,
        effectiveDOF: 0,
        cumulativeVariance: [],
      },
    };
  }

  // 2. POSTERIOR CONDITIONING MODE (N > 0)
  const K = computeGramMatrix(X, X, config);
  const Ky: number[][] = Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) => K[i][j] + (i === j ? config.noiseVariance : 0)),
  );

  const L = choleskyDecomposition(Ky, config.jitter);
  const alpha = choleskySolve(L, y); // alpha = Ky^{-1} y

  // Cross-covariance Kstar = K(Xstar, X) of shape M x N
  const Kstar = computeGramMatrix(Xstar, X, config);
  const KstarStar = computeGramMatrix(Xstar, Xstar, config);

  // Mean vector: f_bar(Xstar) = Kstar * alpha
  const mean: number[] = new Array(M).fill(0);
  for (let i = 0; i < M; i++) {
    let sum = 0;
    for (let j = 0; j < N; j++) {
      sum += Kstar[i][j] * alpha[j];
    }
    mean[i] = sum;
  }

  // Pointwise predictive variance: Var(f(x_*)) = k(x_*, x_*) - v^T v where L v = K(X, x_*)
  // Also build full posterior covariance Sigma_post for joint sampling: Sigma_post = K** - V^T V
  const V_matrix: number[][] = []; // each row i is v_i of length N
  const variance: number[] = new Array(M);
  const stdDev: number[] = new Array(M);

  for (let i = 0; i < M; i++) {
    const k_star_row = Kstar[i]; // K(x_*i, X)
    const v_i = forwardSubstitution(L, k_star_row); // L^{-1} K(X, x_*i)
    V_matrix.push(v_i);

    let v_norm_sq = 0;
    for (let j = 0; j < N; j++) {
      v_norm_sq += v_i[j] * v_i[j];
    }

    const varVal = Math.max(1e-8, KstarStar[i][i] - v_norm_sq);
    variance[i] = varVal;
    stdDev[i] = Math.sqrt(varVal);
  }

  const lower1Sigma = mean.map((m, i) => m - stdDev[i]);
  const upper1Sigma = mean.map((m, i) => m + stdDev[i]);
  const lower2Sigma = mean.map((m, i) => m - 2 * stdDev[i]);
  const upper2Sigma = mean.map((m, i) => m + 2 * stdDev[i]);
  const lower3Sigma = mean.map((m, i) => m - 3 * stdDev[i]);
  const upper3Sigma = mean.map((m, i) => m + 3 * stdDev[i]);

  // Full posterior covariance matrix for sampling: Sigma_post = K** - V^T V
  const Sigma_post: number[][] = Array.from({ length: M }, () => new Array(M).fill(0));
  for (let i = 0; i < M; i++) {
    for (let j = 0; j <= i; j++) {
      let v_dot = 0;
      for (let k = 0; k < N; k++) {
        v_dot += V_matrix[i][k] * V_matrix[j][k];
      }
      const covVal = KstarStar[i][j] - v_dot;
      Sigma_post[i][j] = covVal;
      Sigma_post[j][i] = covVal;
    }
  }

  // Sample posterior trajectories
  const samples: number[][] = [];
  if (sampleCount > 0) {
    for (let s = 0; s < sampleCount; s++) {
      samples.push(sampleMultivariateNormal(mean, Sigma_post, rng, config.jitter));
    }
  }

  const mll = computeMarginalLogLikelihood(X, y, config);
  const rkhsNorm = computeRKHSNorm(X, y, config);
  const spectrum = computeGramEigenvalues(Ky);

  return {
    Xstar,
    mean,
    variance,
    stdDev,
    lower1Sigma,
    upper1Sigma,
    lower2Sigma,
    upper2Sigma,
    lower3Sigma,
    upper3Sigma,
    samples,
    X,
    y,
    K,
    Ky,
    L,
    alpha,
    rkhsNorm,
    mll,
    spectrum,
  };
}

// ============================================================================
// 10. MAIN REACT COMPONENT: GaussianProcessesKernelStudio
// ============================================================================

export const GaussianProcessesKernelStudio: React.FC<GaussianProcessesKernelStudioProps> = ({
  initialPreset = "step_function",
  width = "100%",
  height = "auto",
  standalone = true,
  title = "Gaussian Processes & Kernel RKHS Studio",
  onHyperparamsChange,
  onObservationsChange,
}) => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<StudioTab>("visualizer");
  const [presetId, setPresetId] = useState<GPPresetId>(initialPreset);
  const [compositionMode, setCompositionMode] = useState<KernelCompositionMode>(
    GP_PRESETS[initialPreset]?.kernelMode || "single",
  );
  const [kernel1, setKernel1] = useState<KernelType>(GP_PRESETS[initialPreset]?.kernel1 || "rbf");
  const [kernel2, setKernel2] = useState<KernelType>(
    GP_PRESETS[initialPreset]?.kernel2 || "linear",
  );
  const [params1, setParams1] = useState<KernelHyperparameters>(
    GP_PRESETS[initialPreset]?.params1 || DEFAULT_GP_HYPERPARAMS,
  );
  const [params2, setParams2] = useState<KernelHyperparameters>(
    GP_PRESETS[initialPreset]?.params2 || DEFAULT_GP_HYPERPARAMS,
  );
  const [noiseVariance, setNoiseVariance] = useState<number>(
    GP_PRESETS[initialPreset]?.noiseVariance ?? 0.04,
  );
  const [jitter, setJitter] = useState<number>(1e-6);

  // Observations
  const [points, setPoints] = useState<GPObservationPoint[]>(() =>
    GP_PRESETS[initialPreset]?.points ? [...GP_PRESETS[initialPreset].points] : [],
  );
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);

  // Visualization settings
  const [sampleCount, setSampleCount] = useState<number>(3);
  const [rngSeed, setRngSeed] = useState<number>(42);
  const [showSamples, setShowSamples] = useState<boolean>(true);
  const [showConfidenceBands, setShowConfidenceBands] = useState<boolean>(true);
  const [isPriorMode, setIsPriorMode] = useState<boolean>(false);
  const [hoveredCoordinate, setHoveredCoordinate] = useState<{ x: number; y: number } | null>(null);

  // Coordinate Domain Range
  const domainMinX = -5.0;
  const domainMaxX = 5.0;
  const domainMinY = -3.5;
  const domainMaxY = 3.5;
  const numTestPoints = 120;

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Test grid Xstar
  const Xstar = useMemo(() => {
    const arr: number[] = [];
    const step = (domainMaxX - domainMinX) / (numTestPoints - 1);
    for (let i = 0; i < numTestPoints; i++) {
      arr.push(domainMinX + i * step);
    }
    return arr;
  }, [domainMinX, domainMaxX, numTestPoints]);

  // Current composed kernel configuration
  const currentConfig: ComposedKernelConfig = useMemo(
    () => ({
      mode: compositionMode,
      kernel1,
      kernel2,
      params1: { ...params1, noiseVariance },
      params2: { ...params2, noiseVariance },
      noiseVariance,
      jitter,
    }),
    [compositionMode, kernel1, kernel2, params1, params2, noiseVariance, jitter],
  );

  // Extracted training inputs
  const trainingX = useMemo(() => {
    if (isPriorMode) return [];
    return points.map((p) => p.x);
  }, [points, isPriorMode]);

  const trainingY = useMemo(() => {
    if (isPriorMode) return [];
    return points.map((p) => p.y);
  }, [points, isPriorMode]);

  // Run GP Regression Inference
  const gpResult = useMemo(() => {
    return fitGPRegression(
      trainingX,
      trainingY,
      Xstar,
      currentConfig,
      showSamples ? sampleCount : 0,
      rngSeed,
    );
  }, [trainingX, trainingY, Xstar, currentConfig, sampleCount, showSamples, rngSeed]);

  // Notify callbacks
  useEffect(() => {
    onHyperparamsChange?.(currentConfig);
  }, [currentConfig, onHyperparamsChange]);

  useEffect(() => {
    onObservationsChange?.(points);
  }, [points, onObservationsChange]);

  // Handle Preset Switching
  const handleSelectPreset = useCallback((id: GPPresetId) => {
    const p = GP_PRESETS[id];
    if (!p) return;
    setPresetId(id);
    setCompositionMode(p.kernelMode);
    setKernel1(p.kernel1);
    setKernel2(p.kernel2);
    setParams1({ ...p.params1 });
    setParams2({ ...p.params2 });
    setNoiseVariance(p.noiseVariance);
    setPoints([...p.points]);
    setIsPriorMode(false);
  }, []);

  // --- COORDINATE PROJECTIONS ---
  const svgWidth = 800;
  const svgHeight = 440;
  const padding = { top: 25, right: 30, bottom: 40, left: 50 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const worldToSvgX = useCallback(
    (wx: number) => padding.left + ((wx - domainMinX) / (domainMaxX - domainMinX)) * plotWidth,
    [domainMinX, domainMaxX, padding.left, plotWidth],
  );

  const worldToSvgY = useCallback(
    (wy: number) => padding.top + ((domainMaxY - wy) / (domainMaxY - domainMinY)) * plotHeight,
    [domainMinY, domainMaxY, padding.top, plotHeight],
  );

  const svgToWorldX = useCallback(
    (sx: number) => domainMinX + ((sx - padding.left) / plotWidth) * (domainMaxX - domainMinX),
    [domainMinX, domainMaxX, padding.left, plotWidth],
  );

  const svgToWorldY = useCallback(
    (sy: number) => domainMaxY - ((sy - padding.top) / plotHeight) * (domainMaxY - domainMinY),
    [domainMinY, domainMaxY, padding.top, plotHeight],
  );

  // --- SVG INTERACTION HANDLERS (CLICK TO ADD, DRAG, DELETE) ---
  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Check if clicked near an existing observation point
    const clickedPoint = points.find((p) => {
      const px = worldToSvgX(p.x);
      const py = worldToSvgY(p.y);
      const dist = Math.hypot(px - sx, py - sy);
      return dist <= 12;
    });

    if (clickedPoint) {
      if (e.shiftKey) {
        // Shift+Click deletes point
        setPoints((prev) => prev.filter((p) => p.id !== clickedPoint.id));
      } else {
        // Start dragging
        setDraggedPointId(clickedPoint.id);
      }
    } else {
      // Click on background adds a new point (within plot area)
      if (
        sx >= padding.left &&
        sx <= svgWidth - padding.right &&
        sy >= padding.top &&
        sy <= svgHeight - padding.bottom
      ) {
        const wx = Math.round(svgToWorldX(sx) * 100) / 100;
        const wy = Math.round(svgToWorldY(sy) * 100) / 100;
        const newPoint: GPObservationPoint = {
          id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          x: wx,
          y: wy,
        };
        setPoints((prev) => [...prev, newPoint]);
        setIsPriorMode(false);
      }
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Update hovered coordinate
    if (
      sx >= padding.left &&
      sx <= svgWidth - padding.right &&
      sy >= padding.top &&
      sy <= svgHeight - padding.bottom
    ) {
      const wx = svgToWorldX(sx);
      const wy = svgToWorldY(sy);
      setHoveredCoordinate({ x: wx, y: wy });
    } else {
      setHoveredCoordinate(null);
    }

    if (!draggedPointId) return;

    const clampedSx = Math.max(padding.left, Math.min(svgWidth - padding.right, sx));
    const clampedSy = Math.max(padding.top, Math.min(svgHeight - padding.bottom, sy));

    const newX = Math.round(svgToWorldX(clampedSx) * 100) / 100;
    const newY = Math.round(svgToWorldY(clampedSy) * 100) / 100;

    setPoints((prev) =>
      prev.map((p) => (p.id === draggedPointId ? { ...p, x: newX, y: newY } : p)),
    );
  };

  const handleSvgMouseUp = () => {
    setDraggedPointId(null);
  };

  const handleDeletePoint = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPoints((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearAllPoints = () => {
    setPoints([]);
  };

  const handleResample = () => {
    setRngSeed((prev) => prev + 1);
  };

  // Trajectory sample color palette
  const sampleColors = [
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ec4899", // pink
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#f97316", // orange
    "#14b8a6", // teal
    "#a855f7", // purple
    "#ef4444", // red
    "#3b82f6", // blue
  ];

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  // Generate SVG path for a 1D function curve
  const makePathData = (yValues: readonly number[]): string => {
    if (yValues.length === 0) return "";
    return yValues
      .map((yVal, i) => {
        const sx = worldToSvgX(Xstar[i]);
        const sy = worldToSvgY(Math.max(domainMinY - 2, Math.min(domainMaxY + 2, yVal)));
        return `${i === 0 ? "M" : "L"} ${sx.toFixed(1)},${sy.toFixed(1)}`;
      })
      .join(" ");
  };

  // Generate SVG polygon for confidence envelope between lower and upper curves
  const makeRibbonData = (lowerVals: readonly number[], upperVals: readonly number[]): string => {
    if (lowerVals.length === 0 || upperVals.length === 0) return "";
    const forward = upperVals.map((yVal, i) => {
      const sx = worldToSvgX(Xstar[i]);
      const sy = worldToSvgY(Math.max(domainMinY - 3, Math.min(domainMaxY + 3, yVal)));
      return `${i === 0 ? "M" : "L"} ${sx.toFixed(1)},${sy.toFixed(1)}`;
    });

    const backward = lowerVals
      .slice()
      .reverse()
      .map((yVal, idx) => {
        const i = lowerVals.length - 1 - idx;
        const sx = worldToSvgX(Xstar[i]);
        const sy = worldToSvgY(Math.max(domainMinY - 3, Math.min(domainMaxY + 3, yVal)));
        return `L ${sx.toFixed(1)},${sy.toFixed(1)}`;
      });

    return `${forward.join(" ")} ${backward.join(" ")} Z`;
  };

  return (
    <div
      className={`gp-kernel-studio-root w-full select-none rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl transition-all ${
        standalone ? "p-6" : "p-4"
      }`}
      style={{ width, height }}
    >
      {/* 1. HEADER & NAVIGATION TABS */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40">
              <Zap className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
              <p className="text-xs text-slate-400">
                Non-Parametric Bayesian Inference, Exact RKHS Conditioning & Covariance Spectrum
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center rounded-xl bg-slate-900/90 p-1 ring-1 ring-slate-800">
          <button
            onClick={() => setActiveTab("visualizer")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "visualizer"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            GP Visualizer
          </button>
          <button
            onClick={() => setActiveTab("gram_matrix")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "gram_matrix"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            Gram Matrix Heatmap
          </button>
          <button
            onClick={() => setActiveTab("spectral")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "spectral"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Spectrum & RKHS
          </button>
          <button
            onClick={() => setActiveTab("mll_decomposition")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "mll_decomposition"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            MLL Decomposition
          </button>
          <button
            onClick={() => setActiveTab("data_table")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "data_table"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            Data Table ({points.length})
          </button>
          <button
            onClick={() => setActiveTab("theory")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "theory"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Theory & Math
          </button>
        </div>
      </div>

      {/* 2. TOP TOOLBAR: PRESETS & GENERAL GP TOGGLES */}
      <div className="mb-4 grid grid-cols-1 items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 lg:grid-cols-12">
        {/* Preset Selector */}
        <div className="flex items-center gap-2 lg:col-span-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Preset:
          </label>
          <select
            value={presetId}
            onChange={(e) => handleSelectPreset(e.target.value as GPPresetId)}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-sm transition hover:border-slate-600 focus:border-indigo-500 focus:outline-none"
          >
            {Object.values(GP_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>

        {/* Prior vs Posterior Toggle */}
        <div className="flex items-center justify-center gap-2 lg:col-span-3">
          <button
            onClick={() => setIsPriorMode(false)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              !isPriorMode
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Posterior ({points.length} obs)
          </button>
          <button
            onClick={() => setIsPriorMode(true)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              isPriorMode
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Prior Space
          </button>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center justify-end gap-2 lg:col-span-5">
          {/* Sample Trajectory Count */}
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300">
            <span>Paths:</span>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={sampleCount}
              onChange={(e) => setSampleCount(parseInt(e.target.value, 10))}
              className="h-1.5 w-16 accent-indigo-500 cursor-pointer"
            />
            <span className="font-mono text-indigo-400">{sampleCount}</span>
          </div>

          {/* Resample Seed */}
          <button
            onClick={handleResample}
            title="Generate new random path realizations"
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            <Shuffle className="h-3.5 w-3.5 text-indigo-400" />
            Resample
          </button>

          {/* Clear Observations */}
          <button
            onClick={handleClearAllPoints}
            title="Clear all training observation points"
            className="flex items-center gap-1 rounded-lg border border-rose-900/50 bg-rose-950/40 px-2.5 py-1 text-xs font-semibold text-rose-300 transition hover:bg-rose-900/50 hover:text-rose-100"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            Clear
          </button>
        </div>
      </div>

      {/* 3. TAB 1: GP VISUALIZER & KERNEL HYPERPARAMETER STUDIO */}
      {activeTab === "visualizer" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* LEFT: SVG INTERACTIVE CANVAS */}
          <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/80 p-4 xl:col-span-8">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-slate-200">
                  {isPriorMode
                    ? "GP Prior Process f(x) ~ GP(0, K(x, x'))"
                    : "GP Posterior f(x) | D ~ GP(f̄(x), Cov(f(x)))"}
                </span>
              </span>
              <span className="font-mono text-slate-400">
                Click canvas to add point • Drag to move • Shift+Click to delete
              </span>
            </div>

            {/* SVG Plot Canvas */}
            <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto cursor-crosshair select-none"
                onMouseDown={handleSvgMouseDown}
                onMouseMove={handleSvgMouseMove}
                onMouseUp={handleSvgMouseUp}
                onMouseLeave={() => {
                  setDraggedPointId(null);
                  setHoveredCoordinate(null);
                }}
              >
                <defs>
                  {/* Confidence Interval Gradient */}
                  <linearGradient id="gpConfidenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
                    <stop offset="50%" stopColor="#6366f1" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.28" />
                  </linearGradient>

                  <linearGradient id="gp1SigmaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
                  </linearGradient>

                  <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Grid Lines */}
                <g className="grid-lines" opacity="0.3">
                  {/* Vertical grid */}
                  {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((gx) => (
                    <line
                      key={`vg-${gx}`}
                      x1={worldToSvgX(gx)}
                      y1={padding.top}
                      x2={worldToSvgX(gx)}
                      y2={svgHeight - padding.bottom}
                      stroke={gx === 0 ? "rgba(148, 163, 184, 0.7)" : "rgba(148, 163, 184, 0.25)"}
                      strokeWidth={gx === 0 ? "1.5" : "1"}
                      strokeDasharray={gx === 0 ? undefined : "3,3"}
                    />
                  ))}
                  {/* Horizontal grid */}
                  {[-3, -2, -1, 0, 1, 2, 3].map((gy) => (
                    <line
                      key={`hg-${gy}`}
                      x1={padding.left}
                      y1={worldToSvgY(gy)}
                      x2={svgWidth - padding.right}
                      y2={worldToSvgY(gy)}
                      stroke={gy === 0 ? "rgba(148, 163, 184, 0.7)" : "rgba(148, 163, 184, 0.25)"}
                      strokeWidth={gy === 0 ? "1.5" : "1"}
                      strokeDasharray={gy === 0 ? undefined : "3,3"}
                    />
                  ))}
                </g>

                {/* Axes Ticks Labels */}
                <g
                  className="axes-labels"
                  fontSize="10"
                  fill="rgba(148, 163, 184, 0.7)"
                  fontFamily="monospace"
                >
                  {[-4, -2, 0, 2, 4].map((gx) => (
                    <text
                      key={`tx-${gx}`}
                      x={worldToSvgX(gx)}
                      y={svgHeight - padding.bottom + 16}
                      textAnchor="middle"
                    >
                      {gx}
                    </text>
                  ))}
                  {[-3, -2, -1, 0, 1, 2, 3].map((gy) => (
                    <text
                      key={`ty-${gy}`}
                      x={padding.left - 8}
                      y={worldToSvgY(gy) + 3}
                      textAnchor="end"
                    >
                      {gy}
                    </text>
                  ))}
                  {/* Axis Title */}
                  <text
                    x={svgWidth / 2}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    fill="rgba(148, 163, 184, 0.9)"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    Input Domain x ∈ [-5, 5]
                  </text>
                  <text
                    x={16}
                    y={svgHeight / 2}
                    textAnchor="middle"
                    fill="rgba(148, 163, 184, 0.9)"
                    fontSize="11"
                    fontWeight="bold"
                    transform={`rotate(-90 16 ${svgHeight / 2})`}
                  >
                    Target Output y / f(x)
                  </text>
                </g>

                {/* 3-Sigma Uncertainty Envelope */}
                {showConfidenceBands && (
                  <>
                    <path
                      d={makeRibbonData(gpResult.lower3Sigma, gpResult.upper3Sigma)}
                      fill="#6366f1"
                      fillOpacity="0.08"
                    />
                    {/* 2-Sigma Uncertainty Envelope (95.4%) */}
                    <path
                      d={makeRibbonData(gpResult.lower2Sigma, gpResult.upper2Sigma)}
                      fill="#6366f1"
                      fillOpacity="0.16"
                    />
                    {/* 1-Sigma Uncertainty Envelope (68.3%) */}
                    <path
                      d={makeRibbonData(gpResult.lower1Sigma, gpResult.upper1Sigma)}
                      fill="#6366f1"
                      fillOpacity="0.25"
                    />
                  </>
                )}

                {/* Sample Paths */}
                {showSamples &&
                  gpResult.samples.map((pathValues, idx) => (
                    <path
                      key={`sample-path-${idx}`}
                      d={makePathData(pathValues)}
                      fill="none"
                      stroke={sampleColors[idx % sampleColors.length]}
                      strokeWidth="1.6"
                      strokeOpacity="0.75"
                    />
                  ))}

                {/* Posterior / Prior Mean Curve */}
                <path
                  d={makePathData(gpResult.mean)}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3.0"
                  filter="url(#glowEffect)"
                />

                {/* Observation Points */}
                {!isPriorMode &&
                  points.map((p, idx) => {
                    const px = worldToSvgX(p.x);
                    const py = worldToSvgY(p.y);
                    const isHovered = hoveredPointId === p.id;
                    const isDragged = draggedPointId === p.id;
                    const noisePix = Math.abs(worldToSvgY(p.y + Math.sqrt(noiseVariance)) - py);

                    return (
                      <g
                        key={p.id}
                        className="cursor-grab active:cursor-grabbing"
                        onMouseEnter={() => setHoveredPointId(p.id)}
                        onMouseLeave={() => setHoveredPointId(null)}
                      >
                        {/* Noise Error Bar */}
                        <line
                          x1={px}
                          y1={py - noisePix}
                          x2={px}
                          y2={py + noisePix}
                          stroke="#fbbf24"
                          strokeWidth="2"
                          strokeOpacity="0.7"
                        />
                        <line
                          x1={px - 4}
                          y1={py - noisePix}
                          x2={px + 4}
                          y2={py - noisePix}
                          stroke="#fbbf24"
                          strokeWidth="2"
                          strokeOpacity="0.7"
                        />
                        <line
                          x1={px - 4}
                          y1={py + noisePix}
                          x2={px + 4}
                          y2={py + noisePix}
                          stroke="#fbbf24"
                          strokeWidth="2"
                          strokeOpacity="0.7"
                        />

                        {/* Point Circle */}
                        <circle
                          cx={px}
                          cy={py}
                          r={isDragged ? 8 : isHovered ? 7 : 5.5}
                          fill="#f59e0b"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="transition-transform"
                        />

                        {/* Point Number Badge */}
                        <text
                          x={px}
                          y={py - 10}
                          textAnchor="middle"
                          fill="#fbbf24"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          #{idx + 1} ({p.x.toFixed(1)}, {p.y.toFixed(1)})
                        </text>
                      </g>
                    );
                  })}

                {/* Hover Probe Indicator */}
                {hoveredCoordinate && (
                  <g pointerEvents="none">
                    <line
                      x1={worldToSvgX(hoveredCoordinate.x)}
                      y1={padding.top}
                      x2={worldToSvgX(hoveredCoordinate.x)}
                      y2={svgHeight - padding.bottom}
                      stroke="rgba(244, 63, 94, 0.4)"
                      strokeDasharray="2,2"
                    />
                    <circle
                      cx={worldToSvgX(hoveredCoordinate.x)}
                      cy={worldToSvgY(
                        // Find closest test point index
                        gpResult.mean[
                          Math.max(
                            0,
                            Math.min(
                              numTestPoints - 1,
                              Math.round(
                                ((hoveredCoordinate.x - domainMinX) / (domainMaxX - domainMinX)) *
                                  (numTestPoints - 1),
                              ),
                            ),
                          )
                        ],
                      )}
                      r="4.5"
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                )}
              </svg>

              {/* Live Canvas Coordinates / Metrics Badge */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg bg-slate-900/90 px-3 py-1.5 text-[11px] font-mono text-slate-300 ring-1 ring-slate-800 backdrop-blur-md">
                <span className="text-cyan-400">f̄(x) = cyan</span>
                <span className="text-indigo-400">±2σ = 95.4% CI</span>
                {hoveredCoordinate && (
                  <span className="text-rose-400">
                    x*={hoveredCoordinate.x.toFixed(2)}, y*={hoveredCoordinate.y.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Canvas Controls Bottom Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showConfidenceBands}
                    onChange={(e) => setShowConfidenceBands(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Uncertainty Bands (1σ, 2σ, 3σ)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showSamples}
                    onChange={(e) => setShowSamples(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Realization Paths</span>
                </label>
              </div>

              {/* Status Summary */}
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                <span>N = {points.length}</span>
                <span>•</span>
                <span>
                  MLL: <strong className="text-indigo-400">{gpResult.mll.mll.toFixed(2)}</strong>
                </span>
                <span>•</span>
                <span>
                  ||f̄||_H²:{" "}
                  <strong className="text-emerald-400">{gpResult.rkhsNorm.toFixed(2)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: KERNEL HYPERPARAMETERS & ARITHMETIC COMPOSITION */}
          <div className="flex flex-col gap-4 xl:col-span-4">
            {/* Kernel Composition Panel */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <Sliders className="h-4 w-4 text-indigo-400" />
                  Kernel Composition
                </span>
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-300">
                  {compositionMode}
                </span>
              </div>

              {/* Composition Mode Selector */}
              <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg bg-slate-950 p-1 ring-1 ring-slate-800">
                <button
                  onClick={() => setCompositionMode("single")}
                  className={`rounded-md py-1.5 text-xs font-semibold transition ${
                    compositionMode === "single"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Single k₁
                </button>
                <button
                  onClick={() => setCompositionMode("sum")}
                  className={`rounded-md py-1.5 text-xs font-semibold transition ${
                    compositionMode === "sum"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sum k₁ + k₂
                </button>
                <button
                  onClick={() => setCompositionMode("product")}
                  className={`rounded-md py-1.5 text-xs font-semibold transition ${
                    compositionMode === "product"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Prod k₁ × k₂
                </button>
              </div>

              {/* KERNEL 1 SETTINGS */}
              <div className="mb-4 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-indigo-300">
                    Kernel 1: {KERNEL_DEFINITIONS[kernel1].name}
                  </span>
                </div>

                <select
                  value={kernel1}
                  onChange={(e) => setKernel1(e.target.value as KernelType)}
                  className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  {Object.values(KERNEL_DEFINITIONS).map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>

                {/* Hyperparameter Sliders for Kernel 1 */}
                <div className="space-y-2.5 text-xs">
                  {/* Lengthscale */}
                  {KERNEL_DEFINITIONS[kernel1].params.includes("lengthscale") && (
                    <div>
                      <div className="flex justify-between text-slate-300">
                        <span>Lengthscale (ℓ₁):</span>
                        <span className="font-mono text-indigo-400">
                          {params1.lengthscale.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="5.0"
                        step="0.05"
                        value={params1.lengthscale}
                        onChange={(e) =>
                          setParams1((prev) => ({
                            ...prev,
                            lengthscale: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full h-1.5 accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Output Variance */}
                  {KERNEL_DEFINITIONS[kernel1].params.includes("variance") && (
                    <div>
                      <div className="flex justify-between text-slate-300">
                        <span>Output Scale (σ_f1²):</span>
                        <span className="font-mono text-indigo-400">
                          {params1.variance.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="5.0"
                        step="0.05"
                        value={params1.variance}
                        onChange={(e) =>
                          setParams1((prev) => ({ ...prev, variance: parseFloat(e.target.value) }))
                        }
                        className="w-full h-1.5 accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Periodicity */}
                  {kernel1 === "periodic" && (
                    <div>
                      <div className="flex justify-between text-slate-300">
                        <span>Period (p₁):</span>
                        <span className="font-mono text-indigo-400">
                          {(params1.period ?? 2.0).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="6.0"
                        step="0.1"
                        value={params1.period ?? 2.0}
                        onChange={(e) =>
                          setParams1((prev) => ({ ...prev, period: parseFloat(e.target.value) }))
                        }
                        className="w-full h-1.5 accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Rational Quadratic Alpha */}
                  {kernel1 === "rational_quadratic" && (
                    <div>
                      <div className="flex justify-between text-slate-300">
                        <span>Scale Mixture (α₁):</span>
                        <span className="font-mono text-indigo-400">
                          {(params1.alpha ?? 1.0).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="5.0"
                        step="0.1"
                        value={params1.alpha ?? 1.0}
                        onChange={(e) =>
                          setParams1((prev) => ({ ...prev, alpha: parseFloat(e.target.value) }))
                        }
                        className="w-full h-1.5 accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Linear Offset & Constant */}
                  {kernel1 === "linear" && (
                    <>
                      <div>
                        <div className="flex justify-between text-slate-300">
                          <span>Center Shift (c₁):</span>
                          <span className="font-mono text-indigo-400">
                            {(params1.offset ?? 0.0).toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-3.0"
                          max="3.0"
                          step="0.1"
                          value={params1.offset ?? 0.0}
                          onChange={(e) =>
                            setParams1((prev) => ({ ...prev, offset: parseFloat(e.target.value) }))
                          }
                          className="w-full h-1.5 accent-indigo-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-300">
                          <span>Constant Ridge (σ₀₁²):</span>
                          <span className="font-mono text-indigo-400">
                            {(params1.sigma0 ?? 0.1).toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="2.0"
                          step="0.05"
                          value={params1.sigma0 ?? 0.1}
                          onChange={(e) =>
                            setParams1((prev) => ({ ...prev, sigma0: parseFloat(e.target.value) }))
                          }
                          className="w-full h-1.5 accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* KERNEL 2 SETTINGS (When Composed) */}
              {compositionMode !== "single" && (
                <div className="mb-4 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-cyan-300">
                      Kernel 2: {KERNEL_DEFINITIONS[kernel2].name}
                    </span>
                  </div>

                  <select
                    value={kernel2}
                    onChange={(e) => setKernel2(e.target.value as KernelType)}
                    className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    {Object.values(KERNEL_DEFINITIONS).map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </select>

                  {/* Hyperparameter Sliders for Kernel 2 */}
                  <div className="space-y-2.5 text-xs">
                    {/* Lengthscale */}
                    {KERNEL_DEFINITIONS[kernel2].params.includes("lengthscale") && (
                      <div>
                        <div className="flex justify-between text-slate-300">
                          <span>Lengthscale (ℓ₂):</span>
                          <span className="font-mono text-cyan-400">
                            {params2.lengthscale.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="5.0"
                          step="0.05"
                          value={params2.lengthscale}
                          onChange={(e) =>
                            setParams2((prev) => ({
                              ...prev,
                              lengthscale: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full h-1.5 accent-cyan-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Output Variance */}
                    {KERNEL_DEFINITIONS[kernel2].params.includes("variance") && (
                      <div>
                        <div className="flex justify-between text-slate-300">
                          <span>Output Scale (σ_f2²):</span>
                          <span className="font-mono text-cyan-400">
                            {params2.variance.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="5.0"
                          step="0.05"
                          value={params2.variance}
                          onChange={(e) =>
                            setParams2((prev) => ({
                              ...prev,
                              variance: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full h-1.5 accent-cyan-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Periodicity */}
                    {kernel2 === "periodic" && (
                      <div>
                        <div className="flex justify-between text-slate-300">
                          <span>Period (p₂):</span>
                          <span className="font-mono text-cyan-400">
                            {(params2.period ?? 2.0).toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="6.0"
                          step="0.1"
                          value={params2.period ?? 2.0}
                          onChange={(e) =>
                            setParams2((prev) => ({ ...prev, period: parseFloat(e.target.value) }))
                          }
                          className="w-full h-1.5 accent-cyan-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Rational Quadratic Alpha */}
                    {kernel2 === "rational_quadratic" && (
                      <div>
                        <div className="flex justify-between text-slate-300">
                          <span>Scale Mixture (α₂):</span>
                          <span className="font-mono text-cyan-400">
                            {(params2.alpha ?? 1.0).toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="5.0"
                          step="0.1"
                          value={params2.alpha ?? 1.0}
                          onChange={(e) =>
                            setParams2((prev) => ({ ...prev, alpha: parseFloat(e.target.value) }))
                          }
                          className="w-full h-1.5 accent-cyan-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Linear Offset & Constant */}
                    {kernel2 === "linear" && (
                      <>
                        <div>
                          <div className="flex justify-between text-slate-300">
                            <span>Center Shift (c₂):</span>
                            <span className="font-mono text-cyan-400">
                              {(params2.offset ?? 0.0).toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-3.0"
                            max="3.0"
                            step="0.1"
                            value={params2.offset ?? 0.0}
                            onChange={(e) =>
                              setParams2((prev) => ({
                                ...prev,
                                offset: parseFloat(e.target.value),
                              }))
                            }
                            className="w-full h-1.5 accent-cyan-500 cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-slate-300">
                            <span>Constant Ridge (σ₀₂²):</span>
                            <span className="font-mono text-cyan-400">
                              {(params2.sigma0 ?? 0.1).toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="2.0"
                            step="0.05"
                            value={params2.sigma0 ?? 0.1}
                            onChange={(e) =>
                              setParams2((prev) => ({
                                ...prev,
                                sigma0: parseFloat(e.target.value),
                              }))
                            }
                            className="w-full h-1.5 accent-cyan-500 cursor-pointer"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* OBSERVATION NOISE VARIANCE (σ_n²) */}
              <div className="mb-3 rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-xs">
                <div className="mb-1 flex justify-between text-amber-200">
                  <span className="font-bold">Observation Noise (σ_n²):</span>
                  <span className="font-mono">{noiseVariance.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.5"
                  step="0.005"
                  value={noiseVariance}
                  onChange={(e) => setNoiseVariance(parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-amber-500 cursor-pointer"
                />
                <p className="mt-1 text-[10px] text-amber-300/70">
                  Adds ridge regularization σ_n² I to the training Gram matrix K_y.
                </p>
              </div>

              {/* CHOLESKY JITTER REGULARIZATION (ε) */}
              <div className="rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-3 text-xs">
                <div className="mb-1 flex justify-between text-indigo-200">
                  <span className="font-bold">Cholesky Jitter (ε):</span>
                  <span className="font-mono">{jitter.toExponential(1)}</span>
                </div>
                <input
                  type="range"
                  min="-8"
                  max="-2"
                  step="1"
                  value={Math.round(Math.log10(jitter))}
                  onChange={(e) => setJitter(Math.pow(10, parseFloat(e.target.value)))}
                  className="w-full h-1.5 accent-indigo-500 cursor-pointer"
                />
                <p className="mt-1 text-[10px] text-indigo-300/70">
                  Diagonal loading factor ε I for positive-definiteness guarantee.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: GRAM MATRIX COVARIANCE HEATMAP */}
      {activeTab === "gram_matrix" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Heatmap View */}
          <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/80 p-4 lg:col-span-8">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-bold text-white">
                Covariance Gram Matrix K(X, X) + σ_n² I ({points.length} × {points.length})
              </span>
              <span className="font-mono text-xs text-slate-400">
                Symmetric & Positive Semi-Definite K ⪰ 0
              </span>
            </div>

            {points.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
                <AlertCircle className="mb-2 h-8 w-8 text-slate-600" />
                <p className="text-sm">No observation points in current dataset.</p>
                <p className="text-xs text-slate-600">
                  Add observations on the GP Visualizer canvas or load a preset.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div
                  className="inline-grid gap-1 p-2 rounded-xl bg-slate-950"
                  style={{
                    gridTemplateColumns: `repeat(${points.length}, minmax(32px, 1fr))`,
                  }}
                >
                  {gpResult.Ky.map((row, i) =>
                    row.map((val, j) => {
                      const maxVal = Math.max(1e-4, gpResult.Ky[0][0] || 1.0);
                      const normalized = Math.max(0, Math.min(1, val / maxVal));
                      return (
                        <div
                          key={`cell-${i}-${j}`}
                          title={`K[${i + 1}, ${j + 1}] (x_i=${points[i].x.toFixed(2)}, x_j=${points[j].x.toFixed(2)}): ${val.toFixed(4)}`}
                          className="group relative flex h-9 w-9 items-center justify-center rounded border border-slate-800/60 font-mono text-[10px] font-bold text-white transition-all hover:scale-110 hover:z-10 hover:border-cyan-400"
                          style={{
                            backgroundColor: `rgba(99, 102, 241, ${0.1 + 0.85 * normalized})`,
                          }}
                        >
                          <span className="opacity-75 group-hover:opacity-100">
                            {val.toFixed(2)}
                          </span>
                        </div>
                      );
                    }),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Matrix Properties & Insights */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 lg:col-span-4 text-xs">
            <span className="text-sm font-bold text-white">Gram Matrix Properties</span>

            <div className="space-y-2 rounded-lg bg-slate-950 p-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Dimension (N × N):</span>
                <span className="font-mono text-indigo-400">
                  {points.length} × {points.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Condition Number κ(K_y):</span>
                <span className="font-mono text-emerald-400">
                  {gpResult.spectrum.conditionNumber.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Effective Dimensions (DOF):</span>
                <span className="font-mono text-cyan-400">
                  {gpResult.spectrum.effectiveDOF.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cholesky Stability Jitter:</span>
                <span className="font-mono text-amber-400">{jitter.toExponential(1)}</span>
              </div>
            </div>

            <div className="rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-3 text-[11px] text-indigo-200">
              <p className="font-semibold mb-1">Mercer Kernel Matrix:</p>
              <p className="text-slate-400">
                Every entry K_ij = k(x_i, x_j) measures inner product in the RKHS feature space:
                ⟨ϕ(x_i), ϕ(x_j)⟩_H.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: SPECTRAL DECOMPOSITION & RKHS */}
      {activeTab === "spectral" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Eigenvalue Bar Chart */}
          <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/80 p-4 lg:col-span-8">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-bold text-white">
                Eigenvalue Spectrum λ₁ ≥ λ₂ ≥ ... ≥ λ_N (Gram Matrix SVD)
              </span>
              <span className="font-mono text-xs text-slate-400">
                Jacobi Symmetric Diagonalization
              </span>
            </div>

            {gpResult.spectrum.eigenvalues.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-slate-500">
                No observations available for spectral analysis.
              </div>
            ) : (
              <div className="space-y-3">
                {gpResult.spectrum.eigenvalues.map((lam, idx) => {
                  const maxLam = gpResult.spectrum.eigenvalues[0] || 1.0;
                  const pct = Math.max(2, (lam / maxLam) * 100);
                  const cumPct = (gpResult.spectrum.cumulativeVariance[idx] * 100).toFixed(1);

                  return (
                    <div key={`eigen-${idx}`} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300">
                          λ_{idx + 1} = {lam.toFixed(4)}
                        </span>
                        <span className="text-slate-400">Cumul: {cumPct}%</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden ring-1 ring-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RKHS Metric Card */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 lg:col-span-4 text-xs">
            <span className="text-sm font-bold text-white">RKHS Norm & Functional Complexity</span>

            <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-4 text-center">
              <span className="text-[11px] font-bold uppercase text-emerald-400">
                RKHS Norm Squared ||f̄||_H²
              </span>
              <div className="my-1 font-mono text-3xl font-black text-emerald-300">
                {gpResult.rkhsNorm.toFixed(3)}
              </div>
              <p className="text-[10px] text-emerald-400/80">
                ||f̄||_H² = α^T K α = y^T (K + σ_n² I)^{-1} K (K + σ_n² I)^{-1} y
              </p>
            </div>

            <div className="rounded-lg bg-slate-950 p-3 space-y-2 text-slate-300">
              <p>
                <strong>Occam's Principle:</strong> Smooth, simple interpolants exhibit small RKHS
                norms. Highly oscillatory overfitting surges the RKHS norm.
              </p>
              <p className="text-slate-400">
                The reproducing property ensures evaluation functionals are bounded linear
                operators: f(x) = ⟨f, k(·, x)⟩_H.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: MARGINAL LOG-LIKELIHOOD DECOMPOSITION */}
      {activeTab === "mll_decomposition" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* MLL 3-Part Waterfall Breakdown */}
          <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/80 p-4 lg:col-span-8">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-bold text-white">
                Marginal Log-Likelihood Decomposition log p(y | X, θ)
              </span>
              <span className="font-mono text-xs text-indigo-400">
                Total MLL = {gpResult.mll.mll.toFixed(3)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-4">
              {/* Term 1: Data Fit */}
              <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3">
                <span className="text-[11px] font-bold text-emerald-400">1. Data Fit Term</span>
                <div className="my-1 font-mono text-xl font-bold text-emerald-300">
                  {gpResult.mll.dataFit.toFixed(3)}
                </div>
                <p className="text-[10px] text-slate-400 font-mono">-½ y^T (K + σ_n² I)^{-1} y</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Rewards passing close to observation targets.
                </p>
              </div>

              {/* Term 2: Complexity Penalty */}
              <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3">
                <span className="text-[11px] font-bold text-amber-400">2. Complexity Penalty</span>
                <div className="my-1 font-mono text-xl font-bold text-amber-300">
                  {gpResult.mll.complexityPenalty.toFixed(3)}
                </div>
                <p className="text-[10px] text-slate-400 font-mono">-½ log|K + σ_n² I|</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Penalizes overly flexible / wiggly function spaces.
                </p>
              </div>

              {/* Term 3: Normalization */}
              <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3">
                <span className="text-[11px] font-bold text-indigo-400">
                  3. Normalization Const
                </span>
                <div className="my-1 font-mono text-xl font-bold text-indigo-300">
                  {gpResult.mll.normalizationConstant.toFixed(3)}
                </div>
                <p className="text-[10px] text-slate-400 font-mono">-½ N log(2π)</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Volume normalization scaling for N dimensions.
                </p>
              </div>
            </div>

            {/* Total MLL Banner */}
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-300 font-bold">
                  Total Marginal Log-Likelihood (MLL):
                </span>
                <span className="text-base font-bold text-white">
                  {gpResult.mll.mll.toFixed(4)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-slate-400 font-mono text-[11px]">
                <span>Per-Point Normalization (MLL / N):</span>
                <span>{gpResult.mll.perPointMLL.toFixed(4)}</span>
              </div>
            </div>
          </div>

          {/* Occam's Razor Educational Explanation */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 lg:col-span-4 text-xs text-slate-300">
            <span className="text-sm font-bold text-white">Bayesian Occam's Razor</span>
            <p>
              In Bayesian GP hyperparameter optimization, the marginal log-likelihood automatically
              balances model fit against volume complexity.
            </p>
            <div className="rounded-lg bg-slate-950 p-3 space-y-2 text-[11px]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Short Lengthscales (ℓ → 0):</strong> Exceptional data fit, but
                  catastrophic complexity penalty (-½ log|K| surges negative).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Long Lengthscales (ℓ → ∞):</strong> Negligible complexity penalty, but
                  severe data fit penalty (underfitting).
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: OBSERVATIONS DATA TABLE */}
      {activeTab === "data_table" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-sm font-bold text-white">
              Observations Dataset D = {"{"}(x_i, y_i){"}"} ({points.length} Points)
            </span>
            <button
              onClick={() => {
                const newPoint: GPObservationPoint = {
                  id: `p_${Date.now()}`,
                  x: 0,
                  y: 0,
                };
                setPoints((prev) => [...prev, newPoint]);
              }}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Observation
            </button>
          </div>

          {points.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No observation points. Click "Add Observation" or click anywhere on the GP visualizer
              canvas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950 text-[11px] uppercase text-slate-400 font-mono">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Input x_i</th>
                    <th className="px-3 py-2">Target y_i</th>
                    <th className="px-3 py-2">Weight α_i</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {points.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.1"
                          aria-label={`Input x for point ${idx + 1}`}
                          value={p.x}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPoints((prev) =>
                              prev.map((item) => (item.id === p.id ? { ...item, x: val } : item)),
                            );
                          }}
                          className="w-24 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.1"
                          aria-label={`Target y for point ${idx + 1}`}
                          value={p.y}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPoints((prev) =>
                              prev.map((item) => (item.id === p.id ? { ...item, y: val } : item)),
                            );
                          }}
                          className="w-24 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-indigo-400">
                        {gpResult.alpha[idx]?.toFixed(4) ?? "0.0000"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleDeletePoint(p.id)}
                          className="rounded p-1 text-slate-500 hover:bg-rose-950 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 8. TAB 6: MATHEMATICAL THEORY & RKHS GUIDE */}
      {activeTab === "theory" && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              Gaussian Process Regression & RKHS Mathematical Foundations
            </h3>
            <p className="text-slate-400 mb-4">
              A Gaussian Process (GP) is a collection of infinitely many random variables, any
              finite subset of which has a joint multivariate Gaussian distribution.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: Prior & Likelihood */}
              <div className="rounded-lg bg-slate-950 p-4 space-y-2 border border-slate-800">
                <h4 className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">
                  1. Prior & Observation Model
                </h4>
                <p>Prior distribution over functions:</p>
                <div className="font-mono bg-slate-900 p-2 rounded text-indigo-200 text-center">
                  f(x) ~ GP(m(x), k(x, x'))
                </div>
                <p>Noisy observation model with i.i.d. Gaussian noise:</p>
                <div className="font-mono bg-slate-900 p-2 rounded text-indigo-200 text-center">
                  y_i = f(x_i) + ε_i, \quad ε_i ~ N(0, σ_n²)
                </div>
              </div>

              {/* Box 2: Posterior Conditioning */}
              <div className="rounded-lg bg-slate-950 p-4 space-y-2 border border-slate-800">
                <h4 className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">
                  2. Exact Posterior Analytic Conditioning
                </h4>
                <p>
                  Conditioned on training data D = (X, y), the predictive distribution at test
                  points X_* is:
                </p>
                <div className="font-mono bg-slate-900 p-2 rounded text-cyan-200 text-center">
                  f_* | X, y, X_* ~ N(f̄_*, Cov(f_*))
                </div>
                <div className="font-mono text-[11px] text-slate-300 space-y-1">
                  <div>f̄_* = K(X_*, X) (K(X, X) + σ_n² I)^{-1} y</div>
                  <div>Cov(f_*) = K(X_*, X_*) - K(X_*, X) (K(X, X) + σ_n² I)^{-1} K(X, X_*)</div>
                </div>
              </div>

              {/* Box 3: Reproducing Kernel Hilbert Space */}
              <div className="rounded-lg bg-slate-950 p-4 space-y-2 border border-slate-800">
                <h4 className="font-bold text-emerald-300 uppercase tracking-wider text-[11px]">
                  3. RKHS & Representer Theorem
                </h4>
                <p>
                  By the Moore-Aronszajn Theorem, every positive-definite Mercer kernel uniquely
                  defines a Hilbert space H_k endowed with inner product ⟨·, ·⟩_H satisfying the
                  reproducing property:
                </p>
                <div className="font-mono bg-slate-900 p-2 rounded text-emerald-200 text-center">
                  f(x) = ⟨f, k(·, x)⟩_H \quad \forall f \in H_k
                </div>
                <p>The GP posterior mean minimizes regularized empirical risk in H_k:</p>
                <div className="font-mono bg-slate-900 p-2 rounded text-emerald-200 text-center">
                  f̄ = argmin {"{"} ∑ (y_i - f(x_i))² + σ_n² ||f||_H² {"}"}
                </div>
              </div>

              {/* Box 4: Cholesky Factorization & Stability */}
              <div className="rounded-lg bg-slate-950 p-4 space-y-2 border border-slate-800">
                <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                  4. Cholesky Factorization & Linear Solvers
                </h4>
                <p>
                  Direct matrix inversion is numerically unstable. We compute lower-triangular
                  Cholesky factor L L^T = K_y, then solve via forward/backward substitution:
                </p>
                <div className="font-mono bg-slate-900 p-2 rounded text-amber-200 text-center">
                  L α_sub = y \implies L^T α = α_sub \implies α = K_y^{-1} y
                </div>
                <p>Variance uses v = L^{-1} K(X, x_*):</p>
                <div className="font-mono bg-slate-900 p-2 rounded text-amber-200 text-center">
                  Var(f(x_*)) = k(x_*, x_*) - ||v||²
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GaussianProcessesKernelStudio;
