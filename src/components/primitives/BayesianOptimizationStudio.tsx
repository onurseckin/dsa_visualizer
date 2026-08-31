import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Zap,
  Activity,
  Play,
  Pause,
  RotateCcw,
  StepForward,
  FastForward,
  Layers,
  Sliders,
  TrendingDown,
  TrendingUp,
  Target,
  BookOpen,
  Compass,
  BarChart3,
  Cpu,
  Sparkles,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type KernelType = "rbf" | "matern52";
export type AcquisitionFunctionType = "ei" | "ucb" | "pi" | "thompson";
export type OptimizationObjectiveId =
  | "forrester"
  | "gramacy_lee"
  | "multimodal_sine_cos"
  | "branin"
  | "six_hump_camel"
  | "ackley";

export type InitialDesignStrategy = "latin_hypercube" | "uniform_random" | "equispaced";
export type OptimizationDirection = "minimize" | "maximize";
export type StudioTabId = "visualizer" | "math" | "diagnostics" | "benchmarks";

export interface DimensionBound {
  readonly min: number;
  readonly max: number;
}

export interface GlobalOptimumPoint {
  readonly x: readonly number[];
  readonly y: number;
  readonly label?: string;
}

export interface BenchmarkObjectiveDefinition {
  readonly id: OptimizationObjectiveId;
  readonly name: string;
  readonly dimension: 1 | 2;
  readonly formulaTeX: string;
  readonly description: string;
  readonly bounds: readonly DimensionBound[];
  readonly globalOptima: readonly GlobalOptimumPoint[];
  readonly defaultDirection: OptimizationDirection;
  readonly fn: (x: readonly number[]) => number;
  readonly recommendedHyperparams: BayesianOptimizationHyperparameters;
}

export interface BayesianOptimizationHyperparameters {
  readonly lengthscale: number; // ell > 0
  readonly variance: number; // sigma_f^2 > 0 (signal variance)
  readonly noiseVariance: number; // sigma_n^2 >= 0 (observational noise)
  readonly jitter: number; // epsilon for Cholesky stability
  readonly xi: number; // Exploration trade-off for EI & PI (xi >= 0)
  readonly beta: number; // Confidence bound multiplier for GP-UCB (beta > 0)
}

export interface ObservationPoint {
  readonly id: string;
  readonly step: number;
  readonly x: readonly number[];
  readonly y: number;
  readonly noise?: number;
  readonly isInitial?: boolean;
}

export interface GPPosteriorResult {
  readonly Xstar: readonly (readonly number[])[];
  readonly mean: readonly number[];
  readonly variance: readonly number[];
  readonly stdDev: readonly number[];
  readonly lower2Sigma: readonly number[];
  readonly upper2Sigma: readonly number[];
  readonly L: readonly (readonly number[])[];
  readonly alpha: readonly number[];
  readonly K: readonly (readonly number[])[];
  readonly conditionNumber: number;
}

export interface AcquisitionGridResult {
  readonly candidatePoint: readonly number[];
  readonly maxAcquisitionValue: number;
  readonly gridPoints: readonly (readonly number[])[];
  readonly acquisitionValues: readonly number[];
  readonly means: readonly number[];
  readonly stdDevs: readonly number[];
  readonly sampledFunction?: readonly number[]; // For Thompson sampling
}

export interface IterationHistoryItem {
  readonly step: number;
  readonly x: readonly number[];
  readonly y: number;
  readonly bestY: number;
  readonly simpleRegret: number;
  readonly cumulativeRegret: number;
  readonly instantaneousRegret: number;
  readonly acquisitionMax: number;
  readonly meanAtCandidate: number;
  readonly stdAtCandidate: number;
}

export type BayesOptPresetId =
  | "forrester_ei"
  | "gramacy_ucb"
  | "multimodal_pi"
  | "branin_ei_2d"
  | "six_hump_ucb_2d"
  | "ackley_ts_2d";

export interface BayesOptPreset {
  readonly id: BayesOptPresetId;
  readonly name: string;
  readonly description: string;
  readonly objectiveId: OptimizationObjectiveId;
  readonly acquisitionType: AcquisitionFunctionType;
  readonly kernelType: KernelType;
  readonly direction: OptimizationDirection;
  readonly initialSamples: number;
  readonly hyperparams: BayesianOptimizationHyperparameters;
}

export interface BayesianOptimizationStudioProps {
  readonly initialBenchmark?: OptimizationObjectiveId;
  readonly initialAcquisition?: AcquisitionFunctionType;
  readonly initialKernel?: KernelType;
  readonly initialInitialSamples?: number;
  readonly initialDirection?: OptimizationDirection;
  readonly initialPreset?: BayesOptPresetId;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onStep?: (history: readonly IterationHistoryItem[]) => void;
  readonly onOptimumFound?: (bestX: readonly number[], bestY: number, regret: number) => void;
}

// ============================================================================
// 2. PURE MATHEMATICAL & NUMERICAL ALGORITHMS
// ============================================================================

/**
 * Standard Gaussian Probability Density Function (PDF):
 * phi(z) = (1 / sqrt(2 * pi)) * exp(-z^2 / 2)
 */
export function gaussianPdf(z: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
}

/**
 * Approximation of the Error Function erf(x)
 * Abramowitz and Stegun formula 7.1.26 (max error ~ 1.5e-7)
 */
export function erf(x: number): number {
  if (x === 0) return 0;
  if (x > 8) return 1;
  if (x < -8) return -1;

  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);

  // Constants
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const t = 1 / (1 + p * absX);
  const poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
  const result = 1 - poly * Math.exp(-absX * absX);

  return sign * result;
}

/**
 * Standard Gaussian Cumulative Distribution Function (CDF):
 * Phi(z) = 0.5 * (1 + erf(z / sqrt(2)))
 */
export function gaussianCdf(z: number): number {
  if (z > 8) return 1;
  if (z < -8) return 0;
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * Squared Exponential / Radial Basis Function (RBF) Kernel:
 * k(x1, x2) = variance * exp(- ||x1 - x2||^2 / (2 * lengthscale^2))
 */
export function evaluateKernelRBF(
  x1: readonly number[],
  x2: readonly number[],
  lengthscale: number,
  variance: number,
): number {
  const l2 = Math.max(1e-6, lengthscale * lengthscale);
  let distSq = 0;
  const dim = Math.min(x1.length, x2.length);
  for (let i = 0; i < dim; i++) {
    const diff = x1[i] - x2[i];
    distSq += diff * diff;
  }
  return variance * Math.exp((-0.5 * distSq) / l2);
}

/**
 * Matérn 5/2 Kernel:
 * r = ||x1 - x2||
 * d = sqrt(5) * r / lengthscale
 * k(x1, x2) = variance * (1 + d + d^2 / 3) * exp(-d)
 */
export function evaluateKernelMatern52(
  x1: readonly number[],
  x2: readonly number[],
  lengthscale: number,
  variance: number,
): number {
  const l = Math.max(1e-6, lengthscale);
  let distSq = 0;
  const dim = Math.min(x1.length, x2.length);
  for (let i = 0; i < dim; i++) {
    const diff = x1[i] - x2[i];
    distSq += diff * diff;
  }
  const r = Math.sqrt(distSq);
  const d = (Math.sqrt(5) * r) / l;
  return variance * (1 + d + (d * d) / 3) * Math.exp(-d);
}

/**
 * General kernel evaluator supporting RBF and Matérn 5/2
 */
export function evaluateKernel(
  x1: readonly number[],
  x2: readonly number[],
  kernelType: KernelType,
  lengthscale: number,
  variance: number,
): number {
  if (kernelType === "matern52") {
    return evaluateKernelMatern52(x1, x2, lengthscale, variance);
  }
  return evaluateKernelRBF(x1, x2, lengthscale, variance);
}

/**
 * Computes the Gram / covariance matrix between datasets X1 and X2
 */
export function computeKernelMatrix(
  X1: readonly (readonly number[])[],
  X2: readonly (readonly number[])[],
  kernelType: KernelType,
  lengthscale: number,
  variance: number,
): number[][] {
  const n1 = X1.length;
  const n2 = X2.length;
  const K: number[][] = Array.from({ length: n1 }, () => new Array(n2).fill(0));

  for (let i = 0; i < n1; i++) {
    for (let j = 0; j < n2; j++) {
      K[i][j] = evaluateKernel(X1[i], X2[j], kernelType, lengthscale, variance);
    }
  }

  return K;
}

/**
 * Cholesky Decomposition of a symmetric positive-definite matrix A = L * L^T.
 * Includes adaptive diagonal jitter to ensure strict positive definiteness.
 */
export function choleskyDecomposition(
  A: readonly (readonly number[])[],
  jitter: number = 1e-6,
): number[][] {
  const n = A.length;
  if (n === 0) return [];

  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  // Copy matrix with diagonal jitter
  const workingA: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => A[i][j] + (i === j ? jitter : 0)),
  );

  let currentJitter = jitter;
  let success = false;
  let attempts = 0;

  while (!success && attempts < 8) {
    success = true;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[i][k] * L[j][k];
        }

        if (i === j) {
          const val = workingA[i][i] - sum;
          if (val <= 1e-12) {
            success = false;
            break;
          }
          L[i][j] = Math.sqrt(Math.max(1e-12, val));
        } else {
          L[i][j] = (workingA[i][j] - sum) / (L[j][j] || 1e-9);
        }
      }
      if (!success) break;
    }

    if (!success) {
      currentJitter = Math.max(1e-6, currentJitter * 10);
      for (let i = 0; i < n; i++) {
        workingA[i][i] = A[i][i] + currentJitter;
      }
      attempts++;
    }
  }

  // Fallback if strictly singular: diagonal approximation
  if (!success) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        L[i][j] = i === j ? Math.sqrt(Math.max(1e-6, workingA[i][i])) : 0;
      }
    }
  }

  return L;
}

/**
 * Forward substitution solving L * y = b for lower triangular L
 */
export function forwardSubstitution(
  L: readonly (readonly number[])[],
  b: readonly number[],
): number[] {
  const n = L.length;
  const y = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < i; j++) {
      sum += L[i][j] * y[j];
    }
    const diag = L[i][i];
    y[i] = Math.abs(diag) > 1e-12 ? (b[i] - sum) / diag : 0;
  }
  return y;
}

/**
 * Backward substitution solving L^T * x = y for lower triangular L
 */
export function backwardSubstitution(
  L: readonly (readonly number[])[],
  y: readonly number[],
): number[] {
  const n = L.length;
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += L[j][i] * x[j];
    }
    const diag = L[i][i];
    x[i] = Math.abs(diag) > 1e-12 ? (y[i] - sum) / diag : 0;
  }
  return x;
}

/**
 * Solves linear system A * x = b via Cholesky factor L (A = L * L^T)
 */
export function choleskySolve(L: readonly (readonly number[])[], b: readonly number[]): number[] {
  const y = forwardSubstitution(L, b);
  return backwardSubstitution(L, y);
}

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
export function createDeterministicRng(seed: number = 42): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Box-Muller transform for standard normal N(0, 1) sampling
 */
export function sampleStandardNormal(rng: () => number = Math.random): number {
  let u1 = rng();
  while (u1 <= 1e-10) {
    u1 = rng();
  }
  const u2 = rng();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Fits exact Gaussian Process Posterior on training observations (X, y)
 * and queries predictions at Xstar.
 */
export function fitGPPosterior(
  Xtrain: readonly (readonly number[])[],
  ytrain: readonly number[],
  Xstar: readonly (readonly number[])[],
  kernelType: KernelType = "matern52",
  hyperparams: BayesianOptimizationHyperparameters,
): GPPosteriorResult {
  const N = Xtrain.length;
  const M = Xstar.length;
  const { lengthscale, variance, noiseVariance, jitter } = hyperparams;

  // If no training observations, return prior
  if (N === 0) {
    const priorMean = new Array(M).fill(0);
    const priorVariance = new Array(M).fill(variance);
    const priorStd = new Array(M).fill(Math.sqrt(variance));
    return {
      Xstar,
      mean: priorMean,
      variance: priorVariance,
      stdDev: priorStd,
      lower2Sigma: priorMean.map((m, i) => m - 2 * priorStd[i]),
      upper2Sigma: priorMean.map((m, i) => m + 2 * priorStd[i]),
      L: [],
      alpha: [],
      K: [],
      conditionNumber: 1.0,
    };
  }

  // 1. Compute training Gram matrix K(X, X)
  const K = computeKernelMatrix(Xtrain, Xtrain, kernelType, lengthscale, variance);

  // 2. Add noise variance and jitter to diagonal: Ky = K + (sigma_n^2 + jitter) * I
  const Ky: number[][] = K.map((row, i) =>
    row.map((val, j) => (i === j ? val + noiseVariance + jitter : val)),
  );

  // 3. Cholesky factorization: Ky = L * L^T
  const L = choleskyDecomposition(Ky, jitter);

  // 4. Compute alpha = Ky^-1 * y = L^T \ (L \ y)
  const alpha = choleskySolve(L, ytrain);

  // Estimate condition number via diag(L) max/min
  let minDiag = Infinity;
  let maxDiag = -Infinity;
  for (let i = 0; i < N; i++) {
    const d = Math.abs(L[i][i]);
    if (d < minDiag) minDiag = d;
    if (d > maxDiag) maxDiag = d;
  }
  const conditionNumber = minDiag > 1e-9 ? Math.pow(maxDiag / minDiag, 2) : 1e6;

  // 5. Predict for each test point in Xstar
  const mean: number[] = new Array(M).fill(0);
  const postVariance: number[] = new Array(M).fill(0);
  const postStd: number[] = new Array(M).fill(0);

  // Compute K(X, Xstar)
  const Kstar = computeKernelMatrix(Xtrain, Xstar, kernelType, lengthscale, variance);

  for (let j = 0; j < M; j++) {
    // Extract column j of Kstar: k_* = K(X, x_*_j)
    const kStarCol = new Array(N);
    let mu = 0;
    for (let i = 0; i < N; i++) {
      const kVal = Kstar[i][j];
      kStarCol[i] = kVal;
      mu += kVal * alpha[i];
    }
    mean[j] = mu;

    // Compute variance: k(x*, x*) - v^T * v where L * v = k_*
    const v = forwardSubstitution(L, kStarCol);
    let vNormSq = 0;
    for (let i = 0; i < N; i++) {
      vNormSq += v[i] * v[i];
    }

    const priorVar = evaluateKernel(Xstar[j], Xstar[j], kernelType, lengthscale, variance);
    const vVar = Math.max(0, priorVar - vNormSq);
    postVariance[j] = vVar;
    postStd[j] = Math.sqrt(vVar);
  }

  return {
    Xstar,
    mean,
    variance: postVariance,
    stdDev: postStd,
    lower2Sigma: mean.map((m, i) => m - 2 * postStd[i]),
    upper2Sigma: mean.map((m, i) => m + 2 * postStd[i]),
    L,
    alpha,
    K,
    conditionNumber,
  };
}

/**
 * Expected Improvement (EI) Acquisition Function
 * Minimization: Improvement = max(0, bestY - xi - mean)
 * Maximization: Improvement = max(0, mean - bestY - xi)
 */
export function computeAcquisitionEI(
  mean: number,
  std: number,
  bestY: number,
  xi: number = 0.01,
  isMinimization: boolean = true,
): number {
  if (std <= 1e-9) {
    const directDiff = isMinimization ? bestY - xi - mean : mean - bestY - xi;
    return Math.max(0, directDiff);
  }

  const delta = isMinimization ? bestY - xi - mean : mean - bestY - xi;
  const z = delta / std;
  const cdf = gaussianCdf(z);
  const pdf = gaussianPdf(z);

  const ei = delta * cdf + std * pdf;
  return Math.max(0, ei);
}

/**
 * Gaussian Process Upper/Lower Confidence Bound (GP-UCB / GP-LCB)
 * For Maximization: UCB(x) = mean + beta * std
 * For Minimization: LCB is mean - beta * std; transformed to maximization score: -mean + beta * std
 */
export function computeAcquisitionUCB(
  mean: number,
  std: number,
  beta: number = 2.0,
  isMinimization: boolean = true,
): number {
  if (isMinimization) {
    return -mean + beta * std;
  }
  return mean + beta * std;
}

/**
 * Probability of Improvement (PI) Acquisition Function
 * Minimization: PI = Phi((bestY - xi - mean) / std)
 * Maximization: PI = Phi((mean - bestY - xi) / std)
 */
export function computeAcquisitionPI(
  mean: number,
  std: number,
  bestY: number,
  xi: number = 0.01,
  isMinimization: boolean = true,
): number {
  if (std <= 1e-9) {
    const delta = isMinimization ? bestY - xi - mean : mean - bestY - xi;
    return delta > 0 ? 1 : 0;
  }

  const delta = isMinimization ? bestY - xi - mean : mean - bestY - xi;
  const z = delta / std;
  return gaussianCdf(z);
}

/**
 * Evaluates acquisition values across a candidate grid Xstar
 */
export function computeAcquisitionValues(
  gpPosterior: GPPosteriorResult,
  acquisitionType: AcquisitionFunctionType,
  bestY: number,
  hyperparams: BayesianOptimizationHyperparameters,
  isMinimization: boolean = true,
  rng: () => number = Math.random,
): AcquisitionGridResult {
  const { Xstar, mean, stdDev } = gpPosterior;
  const M = Xstar.length;
  const { xi, beta } = hyperparams;

  const acquisitionValues = new Array(M).fill(0);
  let sampledFunction: number[] | undefined;

  if (acquisitionType === "thompson") {
    // Thompson sampling: Draw a continuous realization f ~ GP(mean, var) at grid
    sampledFunction = new Array(M);
    for (let i = 0; i < M; i++) {
      const z = sampleStandardNormal(rng);
      // Independent marginal sampling with posterior mean and std
      const sampleVal = mean[i] + stdDev[i] * z;
      sampledFunction[i] = sampleVal;
      // Invert score for minimization so max acquisition = best min
      acquisitionValues[i] = isMinimization ? -sampleVal : sampleVal;
    }
  } else {
    for (let i = 0; i < M; i++) {
      const m = mean[i];
      const s = stdDev[i];

      if (acquisitionType === "ei") {
        acquisitionValues[i] = computeAcquisitionEI(m, s, bestY, xi, isMinimization);
      } else if (acquisitionType === "ucb") {
        acquisitionValues[i] = computeAcquisitionUCB(m, s, beta, isMinimization);
      } else if (acquisitionType === "pi") {
        acquisitionValues[i] = computeAcquisitionPI(m, s, bestY, xi, isMinimization);
      }
    }
  }

  // Find candidate argmax of acquisition function
  let maxIdx = 0;
  let maxVal = -Infinity;
  for (let i = 0; i < M; i++) {
    const val = acquisitionValues[i];
    if (val > maxVal) {
      maxVal = val;
      maxIdx = i;
    }
  }

  return {
    candidatePoint: Xstar[maxIdx] || (Xstar[0] ?? [0]),
    maxAcquisitionValue: maxVal === -Infinity ? 0 : maxVal,
    gridPoints: Xstar,
    acquisitionValues,
    means: mean,
    stdDevs: stdDev,
    sampledFunction,
  };
}

/**
 * Finds the next query point by maximizing the acquisition function on the candidate grid
 */
export function findNextQueryPoint(
  gpPosterior: GPPosteriorResult,
  acquisitionType: AcquisitionFunctionType,
  bestY: number,
  hyperparams: BayesianOptimizationHyperparameters,
  isMinimization: boolean = true,
  rng: () => number = Math.random,
): readonly number[] {
  const result = computeAcquisitionValues(
    gpPosterior,
    acquisitionType,
    bestY,
    hyperparams,
    isMinimization,
    rng,
  );
  return result.candidatePoint;
}

/**
 * Computes simple regret: r_t = |bestObservedY - globalOptimumY|
 */
export function computeSimpleRegret(
  bestObservedY: number,
  globalOptimumY: number,
  isMinimization: boolean = true,
): number {
  if (isMinimization) {
    return Math.max(0, bestObservedY - globalOptimumY);
  }
  return Math.max(0, globalOptimumY - bestObservedY);
}

/**
 * Computes cumulative regret: R_T = sum_{t=1}^T (instantaneous regret at t)
 */
export function computeCumulativeRegret(
  historyY: readonly number[],
  globalOptimumY: number,
  isMinimization: boolean = true,
): number {
  let sum = 0;
  for (const y of historyY) {
    const inst = isMinimization ? Math.max(0, y - globalOptimumY) : Math.max(0, globalOptimumY - y);
    sum += inst;
  }
  return sum;
}

/**
 * Generates initial experimental design points (Latin Hypercube, Uniform Random, or Equispaced)
 */
export function generateInitialDesign(
  bounds: readonly DimensionBound[],
  nSamples: number,
  strategy: InitialDesignStrategy = "latin_hypercube",
  seed: number = 100,
): number[][] {
  const rng = createDeterministicRng(seed);
  const dim = bounds.length;
  const points: number[][] = [];

  if (strategy === "equispaced") {
    if (dim === 1) {
      const { min, max } = bounds[0];
      for (let i = 0; i < nSamples; i++) {
        const t = nSamples === 1 ? 0.5 : i / (nSamples - 1);
        points.push([min + t * (max - min)]);
      }
    } else if (dim === 2) {
      const side = Math.max(1, Math.floor(Math.sqrt(nSamples)));
      const b0 = bounds[0];
      const b1 = bounds[1];
      for (let i = 0; i < side; i++) {
        for (let j = 0; j < side; j++) {
          if (points.length >= nSamples) break;
          const tx = side === 1 ? 0.5 : i / (side - 1);
          const ty = side === 1 ? 0.5 : j / (side - 1);
          points.push([b0.min + tx * (b0.max - b0.min), b1.min + ty * (b1.max - b1.min)]);
        }
      }
      // Fill remaining if needed
      while (points.length < nSamples) {
        points.push([b0.min + rng() * (b0.max - b0.min), b1.min + rng() * (b1.max - b1.min)]);
      }
    }
  } else if (strategy === "latin_hypercube") {
    // Latin Hypercube Sampling
    const intervals: number[][] = [];
    for (let d = 0; d < dim; d++) {
      const perm = Array.from({ length: nSamples }, (_, i) => i);
      // Fisher-Yates shuffle
      for (let i = nSamples - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const temp = perm[i];
        perm[i] = perm[j];
        perm[j] = temp;
      }
      intervals.push(perm);
    }

    for (let i = 0; i < nSamples; i++) {
      const pt: number[] = [];
      for (let d = 0; d < dim; d++) {
        const bin = intervals[d][i];
        const offset = rng();
        const normalized = (bin + offset) / nSamples;
        const val = bounds[d].min + normalized * (bounds[d].max - bounds[d].min);
        pt.push(val);
      }
      points.push(pt);
    }
  } else {
    // Uniform random
    for (let i = 0; i < nSamples; i++) {
      const pt: number[] = [];
      for (let d = 0; d < dim; d++) {
        const val = bounds[d].min + rng() * (bounds[d].max - bounds[d].min);
        pt.push(val);
      }
      points.push(pt);
    }
  }

  return points;
}

// ============================================================================
// 3. 6 BENCHMARK OBJECTIVE FUNCTIONS
// ============================================================================

export const BENCHMARK_OBJECTIVES: Record<OptimizationObjectiveId, BenchmarkObjectiveDefinition> = {
  forrester: {
    id: "forrester",
    name: "Forrester 1D",
    dimension: 1,
    formulaTeX: "f(x) = (6x - 2)^2 \\sin(12x - 4)",
    description:
      "Standard 1D benchmark with one global minimum and one local minimum, frequently used in surrogate modeling.",
    bounds: [{ min: 0.0, max: 1.0 }],
    globalOptima: [{ x: [0.75724876], y: -6.02074, label: "x* ≈ 0.757, f* ≈ -6.021" }],
    defaultDirection: "minimize",
    fn: (x) => {
      const v = x[0];
      const a = 6 * v - 2;
      return a * a * Math.sin(12 * v - 4);
    },
    recommendedHyperparams: {
      lengthscale: 0.18,
      variance: 15.0,
      noiseVariance: 1e-4,
      jitter: 1e-6,
      xi: 0.01,
      beta: 2.0,
    },
  },
  gramacy_lee: {
    id: "gramacy_lee",
    name: "Gramacy & Lee 1D",
    dimension: 1,
    formulaTeX: "f(x) = \\frac{\\sin(10\\pi x)}{2x} + (x - 1)^4",
    description:
      "Rapidly oscillating 1D function with decaying amplitude and multiple sharp local minima.",
    bounds: [{ min: 0.5, max: 2.5 }],
    globalOptima: [{ x: [0.548563], y: -0.869011, label: "x* ≈ 0.549, f* ≈ -0.869" }],
    defaultDirection: "minimize",
    fn: (x) => {
      const v = x[0];
      const term1 = Math.sin(10 * Math.PI * v) / (2 * v);
      const term2 = Math.pow(v - 1, 4);
      return term1 + term2;
    },
    recommendedHyperparams: {
      lengthscale: 0.12,
      variance: 2.5,
      noiseVariance: 1e-4,
      jitter: 1e-6,
      xi: 0.02,
      beta: 2.5,
    },
  },
  multimodal_sine_cos: {
    id: "multimodal_sine_cos",
    name: "Multi-Modal Sine-Cos 1D",
    dimension: 1,
    formulaTeX: "f(x) = -\\sin(x) - \\cos(2x) + 0.1x",
    description:
      "Multi-modal 1D landscape designed to evaluate exploration and escape from local basins.",
    bounds: [{ min: 0.0, max: 10.0 }],
    globalOptima: [{ x: [1.489], y: -1.824, label: "x* ≈ 1.489, f* ≈ -1.824" }],
    defaultDirection: "minimize",
    fn: (x) => {
      const v = x[0];
      return -Math.sin(v) - Math.cos(2 * v) + 0.1 * v;
    },
    recommendedHyperparams: {
      lengthscale: 0.8,
      variance: 2.0,
      noiseVariance: 1e-4,
      jitter: 1e-6,
      xi: 0.05,
      beta: 2.0,
    },
  },
  branin: {
    id: "branin",
    name: "Branin-Hoo 2D",
    dimension: 2,
    formulaTeX: "f(x_1, x_2) = (x_2 - b x_1^2 + c x_1 - r)^2 + 10(1 - t)\\cos(x_1) + 10",
    description:
      "Classic 2D optimization test problem featuring 3 symmetric global minima in a curved valley.",
    bounds: [
      { min: -5.0, max: 10.0 },
      { min: 0.0, max: 15.0 },
    ],
    globalOptima: [
      { x: [-Math.PI, 12.275], y: 0.397887, label: "(-π, 12.275)" },
      { x: [Math.PI, 2.275], y: 0.397887, label: "(π, 2.275)" },
      { x: [9.42478, 2.475], y: 0.397887, label: "(3π, 2.475)" },
    ],
    defaultDirection: "minimize",
    fn: (x) => {
      const x1 = x[0];
      const x2 = x[1];
      const a = 1;
      const b = 5.1 / (4 * Math.PI * Math.PI);
      const c = 5 / Math.PI;
      const r = 6;
      const s = 10;
      const t = 1 / (8 * Math.PI);
      const term1 = a * Math.pow(x2 - b * x1 * x1 + c * x1 - r, 2);
      const term2 = s * (1 - t) * Math.cos(x1);
      return term1 + term2 + s;
    },
    recommendedHyperparams: {
      lengthscale: 2.2,
      variance: 40.0,
      noiseVariance: 1e-4,
      jitter: 1e-6,
      xi: 0.05,
      beta: 2.5,
    },
  },
  six_hump_camel: {
    id: "six_hump_camel",
    name: "Six-Hump Camel 2D",
    dimension: 2,
    formulaTeX: "f(x_1, x_2) = (4 - 2.1 x_1^2 + x_1^4/3)x_1^2 + x_1 x_2 + (-4 + 4 x_2^2)x_2^2",
    description: "2D surface with 6 local minima, two of which are global minima at f* ≈ -1.0316.",
    bounds: [
      { min: -2.0, max: 2.0 },
      { min: -1.0, max: 1.0 },
    ],
    globalOptima: [
      { x: [0.0898, -0.7126], y: -1.031628, label: "(0.0898, -0.7126)" },
      { x: [-0.0898, 0.7126], y: -1.031628, label: "(-0.0898, 0.7126)" },
    ],
    defaultDirection: "minimize",
    fn: (x) => {
      const x1 = x[0];
      const x2 = x[1];
      const term1 = (4 - 2.1 * x1 * x1 + Math.pow(x1, 4) / 3) * x1 * x1;
      const term2 = x1 * x2;
      const term3 = (-4 + 4 * x2 * x2) * x2 * x2;
      return term1 + term2 + term3;
    },
    recommendedHyperparams: {
      lengthscale: 0.6,
      variance: 3.5,
      noiseVariance: 1e-4,
      jitter: 1e-6,
      xi: 0.02,
      beta: 2.5,
    },
  },
  ackley: {
    id: "ackley",
    name: "Ackley 2D",
    dimension: 2,
    formulaTeX:
      "f(x) = -20 e^{-0.2\\sqrt{0.5(x_1^2+x_2^2)}} - e^{0.5(\\cos 2\\pi x_1 + \\cos 2\\pi x_2)} + 20 + e",
    description:
      "Highly multi-modal benchmark with a nearly flat outer region and an exponential deep hole at (0, 0).",
    bounds: [
      { min: -5.0, max: 5.0 },
      { min: -5.0, max: 5.0 },
    ],
    globalOptima: [{ x: [0.0, 0.0], y: 0.0, label: "(0, 0) f* = 0" }],
    defaultDirection: "minimize",
    fn: (x) => {
      const x1 = x[0];
      const x2 = x[1];
      const r = Math.sqrt(0.5 * (x1 * x1 + x2 * x2));
      const term1 = -20 * Math.exp(-0.2 * r);
      const term2 = -Math.exp(0.5 * (Math.cos(2 * Math.PI * x1) + Math.cos(2 * Math.PI * x2)));
      return term1 + term2 + 20 + Math.E;
    },
    recommendedHyperparams: {
      lengthscale: 1.2,
      variance: 10.0,
      noiseVariance: 1e-4,
      jitter: 1e-6,
      xi: 0.05,
      beta: 3.0,
    },
  },
};

export const BAYES_OPT_PRESETS: Record<BayesOptPresetId, BayesOptPreset> = {
  forrester_ei: {
    id: "forrester_ei",
    name: "Forrester 1D + Expected Improvement",
    description:
      "Classic 1D benchmark with Expected Improvement (EI) balancing exploration and local refinement.",
    objectiveId: "forrester",
    acquisitionType: "ei",
    kernelType: "matern52",
    direction: "minimize",
    initialSamples: 4,
    hyperparams: {
      lengthscale: 0.18,
      variance: 15.0,
      noiseVariance: 1e-4,
      jitter: 1e-6,
      xi: 0.01,
      beta: 2.0,
    },
  },
  gramacy_ucb: {
    id: "gramacy_ucb",
    name: "Gramacy & Lee 1D + GP-UCB",
    description: "Fast oscillating curve optimized using Upper Confidence Bound with beta=2.5.",
    objectiveId: "gramacy_lee",
    acquisitionType: "ucb",
    kernelType: "matern52",
    direction: "minimize",
    initialSamples: 5,
    hyperparams: {
      lengthscale: 0.12,
      variance: 2.5,
      noiseVariance: 1e-4,
      jitter: 1e-6,
      xi: 0.02,
      beta: 2.5,
    },
  },
  multimodal_pi: {
    id: "multimodal_pi",
    name: "Multi-Modal Sine-Cos 1D + Probability of Improvement",
    description: "Multi-modal landscape testing probability of improvement to jump across basins.",
    objectiveId: "multimodal_sine_cos",
    acquisitionType: "pi",
    kernelType: "rbf",
    direction: "minimize",
    initialSamples: 4,
    hyperparams: {
      lengthscale: 0.8,
      variance: 2.0,
      noiseVariance: 1e-4,
      jitter: 1e-6,
      xi: 0.05,
      beta: 2.0,
    },
  },
  branin_ei_2d: {
    id: "branin_ei_2d",
    name: "Branin-Hoo 2D + Expected Improvement",
    description:
      "2D 3-minima landscape mapped with 2D Gaussian Process surrogate and EI acquisition.",
    objectiveId: "branin",
    acquisitionType: "ei",
    kernelType: "matern52",
    direction: "minimize",
    initialSamples: 6,
    hyperparams: {
      lengthscale: 2.2,
      variance: 40.0,
      noiseVariance: 1e-4,
      jitter: 1e-6,
      xi: 0.05,
      beta: 2.5,
    },
  },
  six_hump_ucb_2d: {
    id: "six_hump_ucb_2d",
    name: "Six-Hump Camel 2D + GP-UCB",
    description: "6 local minima 2D surface exploring confidence bounds to locate global basins.",
    objectiveId: "six_hump_camel",
    acquisitionType: "ucb",
    kernelType: "matern52",
    direction: "minimize",
    initialSamples: 6,
    hyperparams: {
      lengthscale: 0.6,
      variance: 3.5,
      noiseVariance: 1e-4,
      jitter: 1e-6,
      xi: 0.02,
      beta: 2.5,
    },
  },
  ackley_ts_2d: {
    id: "ackley_ts_2d",
    name: "Ackley 2D + Thompson Sampling",
    description:
      "Complex multi-modal landscape navigated via posterior function path Thompson sampling.",
    objectiveId: "ackley",
    acquisitionType: "thompson",
    kernelType: "matern52",
    direction: "minimize",
    initialSamples: 8,
    hyperparams: {
      lengthscale: 1.2,
      variance: 10.0,
      noiseVariance: 1e-4,
      jitter: 1e-6,
      xi: 0.05,
      beta: 3.0,
    },
  },
};

// ============================================================================
// 4. COLOR PALETTES FOR 2D VISUALIZATION
// ============================================================================

function colormapTurbo(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const r = Math.round(255 * Math.sin(clamped * Math.PI * 0.9));
  const g = Math.round(255 * Math.sin(clamped * Math.PI * 1.1 + 0.3));
  const b = Math.round(255 * Math.cos(clamped * Math.PI * 0.8));
  return `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
}

function colormapPlasma(t: number): string {
  const c = Math.max(0, Math.min(1, t));
  const r = Math.round(255 * (0.1 + 0.9 * Math.sqrt(c)));
  const g = Math.round(255 * (0.05 + 0.8 * Math.pow(c, 1.8)));
  const b = Math.round(255 * (0.6 + 0.4 * Math.cos(c * Math.PI)));
  return `rgb(${r}, ${g}, ${b})`;
}

// ============================================================================
// 5. MAIN REACT COMPONENT: BayesianOptimizationStudio
// ============================================================================

export const BayesianOptimizationStudio: React.FC<BayesianOptimizationStudioProps> = ({
  initialBenchmark = "forrester",
  initialAcquisition = "ei",
  initialKernel = "matern52",
  initialInitialSamples = 4,
  initialDirection = "minimize",
  initialPreset,
  width = "100%",
  height = "auto",
  standalone = true,
  title = "Bayesian Optimization & Surrogate Modeling Studio",
  onStep,
  onOptimumFound,
}) => {
  // State: Preset and Problem Setup
  const [selectedObjectiveId, setSelectedObjectiveId] =
    useState<OptimizationObjectiveId>(initialBenchmark);
  const [selectedAcquisition, setSelectedAcquisition] =
    useState<AcquisitionFunctionType>(initialAcquisition);
  const [selectedKernel, setSelectedKernel] = useState<KernelType>(initialKernel);
  const [direction, setDirection] = useState<OptimizationDirection>(initialDirection);
  const [nInitialSamples, setNInitialSamples] = useState<number>(initialInitialSamples);
  const [designStrategy, setDesignStrategy] = useState<InitialDesignStrategy>("latin_hypercube");
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [activeTab, setActiveTab] = useState<StudioTabId>("visualizer");

  // Hyperparameters
  const currentObjective = BENCHMARK_OBJECTIVES[selectedObjectiveId];
  const [hyperparams, setHyperparams] = useState<BayesianOptimizationHyperparameters>(
    currentObjective.recommendedHyperparams,
  );

  // Observations & History State
  const [observations, setObservations] = useState<ObservationPoint[]>([]);
  const [history, setHistory] = useState<IterationHistoryItem[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playSpeedMs = 600;
  const [view2DMode, setView2DMode] = useState<"true" | "gp_mean" | "acquisition">("gp_mean");

  const rngRef = useRef<() => number>(createDeterministicRng(randomSeed));

  // Reset optimization function
  const resetOptimization = useCallback(
    (
      objId: OptimizationObjectiveId = selectedObjectiveId,
      hp?: BayesianOptimizationHyperparameters,
      nSamples: number = nInitialSamples,
      strat: InitialDesignStrategy = designStrategy,
      seed: number = randomSeed,
    ) => {
      setIsPlaying(false);
      if (hp) {
        setHyperparams(hp);
      }
      const obj = BENCHMARK_OBJECTIVES[objId];
      const initialPoints = generateInitialDesign(obj.bounds, nSamples, strat, seed);
      const isMin = obj.defaultDirection === "minimize";
      const globalOptY = obj.globalOptima[0]?.y ?? 0;

      const initialObs: ObservationPoint[] = [];
      const initialHist: IterationHistoryItem[] = [];

      let currentBestY = isMin ? Infinity : -Infinity;

      for (let i = 0; i < initialPoints.length; i++) {
        const pt = initialPoints[i];
        const val = obj.fn(pt);
        const obs: ObservationPoint = {
          id: `init_${i + 1}`,
          step: i + 1,
          x: pt,
          y: val,
          isInitial: true,
        };
        initialObs.push(obs);

        if (isMin) {
          if (val < currentBestY) currentBestY = val;
        } else {
          if (val > currentBestY) currentBestY = val;
        }

        const simpleR = computeSimpleRegret(currentBestY, globalOptY, isMin);
        const cumR = computeCumulativeRegret(
          initialObs.map((o) => o.y),
          globalOptY,
          isMin,
        );
        const instR = isMin ? Math.max(0, val - globalOptY) : Math.max(0, globalOptY - val);

        initialHist.push({
          step: i + 1,
          x: pt,
          y: val,
          bestY: currentBestY,
          simpleRegret: simpleR,
          cumulativeRegret: cumR,
          instantaneousRegret: instR,
          acquisitionMax: 0,
          meanAtCandidate: val,
          stdAtCandidate: 0,
        });
      }

      setObservations(initialObs);
      setHistory(initialHist);
      rngRef.current = createDeterministicRng(seed + initialObs.length);
    },
    [selectedObjectiveId, nInitialSamples, designStrategy, randomSeed],
  );

  // Initialize preset if provided
  useEffect(() => {
    if (initialPreset && BAYES_OPT_PRESETS[initialPreset]) {
      const p = BAYES_OPT_PRESETS[initialPreset];
      setSelectedObjectiveId(p.objectiveId);
      setSelectedAcquisition(p.acquisitionType);
      setSelectedKernel(p.kernelType);
      setDirection(p.direction);
      setNInitialSamples(p.initialSamples);
      resetOptimization(p.objectiveId, p.hyperparams, p.initialSamples, designStrategy, randomSeed);
    }
  }, [initialPreset, resetOptimization, designStrategy, randomSeed]);

  // Update hyperparams when objective changes
  const handleObjectiveChange = (newId: OptimizationObjectiveId) => {
    setSelectedObjectiveId(newId);
    const obj = BENCHMARK_OBJECTIVES[newId];
    setDirection(obj.defaultDirection);
    resetOptimization(
      newId,
      obj.recommendedHyperparams,
      nInitialSamples,
      designStrategy,
      randomSeed,
    );
  };

  // Initial load
  useEffect(() => {
    resetOptimization();
  }, [resetOptimization]);

  // 1D Grid generation for testing and plotting
  const grid1D = useMemo(() => {
    if (currentObjective.dimension !== 1) return [];
    const b = currentObjective.bounds[0];
    const nSteps = 160;
    const pts: number[][] = [];
    for (let i = 0; i <= nSteps; i++) {
      const x = b.min + (i / nSteps) * (b.max - b.min);
      pts.push([x]);
    }
    return pts;
  }, [currentObjective]);

  // 2D Grid generation for testing and heatmaps
  const grid2D = useMemo(() => {
    if (currentObjective.dimension !== 2) {
      return {
        pts: [] as number[][],
        nx: 0,
        ny: 0,
        b0: { min: 0, max: 1 },
        b1: { min: 0, max: 1 },
      };
    }
    const b0 = currentObjective.bounds[0];
    const b1 = currentObjective.bounds[1];
    const nx = 32;
    const ny = 32;
    const pts: number[][] = [];
    for (let j = 0; j < ny; j++) {
      const y = b1.min + (j / (ny - 1)) * (b1.max - b1.min);
      for (let i = 0; i < nx; i++) {
        const x = b0.min + (i / (nx - 1)) * (b0.max - b0.min);
        pts.push([x, y]);
      }
    }
    return { pts, nx, ny, b0, b1 };
  }, [currentObjective]);

  // Fit GP posterior
  const gpPosterior = useMemo(() => {
    const Xtrain = observations.map((o) => o.x);
    const ytrain = observations.map((o) => o.y);
    const Xstar = currentObjective.dimension === 1 ? grid1D : grid2D.pts;

    return fitGPPosterior(Xtrain, ytrain, Xstar, selectedKernel, hyperparams);
  }, [observations, currentObjective, grid1D, grid2D, selectedKernel, hyperparams]);

  // Best observed value so far
  const bestObserved = useMemo(() => {
    if (observations.length === 0) return { y: 0, x: [0], step: 0 };
    const isMin = direction === "minimize";
    let best = observations[0];
    for (let i = 1; i < observations.length; i++) {
      const curr = observations[i];
      if (isMin ? curr.y < best.y : curr.y > best.y) {
        best = curr;
      }
    }
    return best;
  }, [observations, direction]);

  // Compute Acquisition values & candidate argmax
  const acquisitionResult = useMemo(() => {
    const isMin = direction === "minimize";
    return computeAcquisitionValues(
      gpPosterior,
      selectedAcquisition,
      bestObserved.y,
      hyperparams,
      isMin,
      rngRef.current,
    );
  }, [gpPosterior, selectedAcquisition, bestObserved.y, hyperparams, direction]);

  // Perform a single step of Bayesian Optimization
  const stepOptimization = useCallback(() => {
    const candidateX = acquisitionResult.candidatePoint;
    const candidateY = currentObjective.fn(candidateX);
    const isMin = direction === "minimize";
    const globalOptY = currentObjective.globalOptima[0]?.y ?? 0;
    const nextStepNum = observations.length + 1;

    const newObs: ObservationPoint = {
      id: `step_${nextStepNum}`,
      step: nextStepNum,
      x: candidateX,
      y: candidateY,
      isInitial: false,
    };

    const newObservations = [...observations, newObs];

    // Recalculate best Y
    let nextBestY = bestObserved.y;
    if (observations.length === 0) {
      nextBestY = candidateY;
    } else {
      if (isMin) {
        if (candidateY < nextBestY) nextBestY = candidateY;
      } else {
        if (candidateY > nextBestY) nextBestY = candidateY;
      }
    }

    const simpleR = computeSimpleRegret(nextBestY, globalOptY, isMin);
    const cumR = computeCumulativeRegret(
      newObservations.map((o) => o.y),
      globalOptY,
      isMin,
    );
    const instR = isMin
      ? Math.max(0, candidateY - globalOptY)
      : Math.max(0, globalOptY - candidateY);

    const histItem: IterationHistoryItem = {
      step: nextStepNum,
      x: candidateX,
      y: candidateY,
      bestY: nextBestY,
      simpleRegret: simpleR,
      cumulativeRegret: cumR,
      instantaneousRegret: instR,
      acquisitionMax: acquisitionResult.maxAcquisitionValue,
      meanAtCandidate: 0,
      stdAtCandidate: 0,
    };

    const newHistory = [...history, histItem];
    setObservations(newObservations);
    setHistory(newHistory);

    if (onStep) {
      onStep(newHistory);
    }
    if (onOptimumFound && simpleR < 1e-3) {
      onOptimumFound(candidateX, nextBestY, simpleR);
    }
  }, [
    acquisitionResult,
    currentObjective,
    direction,
    observations,
    bestObserved,
    history,
    onStep,
    onOptimumFound,
  ]);

  // Auto-play loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        if (observations.length >= 35) {
          setIsPlaying(false);
          return;
        }
        stepOptimization();
      }, playSpeedMs);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playSpeedMs, observations.length, stepOptimization]);

  // Step multiple iterations
  const stepMultiple = (count: number) => {
    setIsPlaying(false);
    let currentObs = [...observations];
    let currentHist = [...history];
    const isMin = direction === "minimize";
    const globalOptY = currentObjective.globalOptima[0]?.y ?? 0;

    for (let c = 0; c < count; c++) {
      if (currentObs.length >= 40) break;
      const Xtrain = currentObs.map((o) => o.x);
      const ytrain = currentObs.map((o) => o.y);
      const Xstar = currentObjective.dimension === 1 ? grid1D : grid2D.pts;
      const post = fitGPPosterior(Xtrain, ytrain, Xstar, selectedKernel, hyperparams);

      let curBest = currentObs[0]?.y ?? 0;
      for (const o of currentObs) {
        if (isMin ? o.y < curBest : o.y > curBest) curBest = o.y;
      }

      const acq = computeAcquisitionValues(
        post,
        selectedAcquisition,
        curBest,
        hyperparams,
        isMin,
        rngRef.current,
      );

      const nextX = acq.candidatePoint;
      const nextY = currentObjective.fn(nextX);
      const nextStepNum = currentObs.length + 1;

      const newObs: ObservationPoint = {
        id: `step_${nextStepNum}`,
        step: nextStepNum,
        x: nextX,
        y: nextY,
        isInitial: false,
      };

      currentObs.push(newObs);

      let nextBestY = curBest;
      if (isMin ? nextY < nextBestY : nextY > nextBestY) nextBestY = nextY;

      const simpleR = computeSimpleRegret(nextBestY, globalOptY, isMin);
      const cumR = computeCumulativeRegret(
        currentObs.map((o) => o.y),
        globalOptY,
        isMin,
      );
      const instR = isMin ? Math.max(0, nextY - globalOptY) : Math.max(0, globalOptY - nextY);

      currentHist.push({
        step: nextStepNum,
        x: nextX,
        y: nextY,
        bestY: nextBestY,
        simpleRegret: simpleR,
        cumulativeRegret: cumR,
        instantaneousRegret: instR,
        acquisitionMax: acq.maxAcquisitionValue,
        meanAtCandidate: 0,
        stdAtCandidate: 0,
      });
    }

    setObservations(currentObs);
    setHistory(currentHist);
    if (onStep) onStep(currentHist);
  };

  // Current Regret stats
  const globalOptY = currentObjective.globalOptima[0]?.y ?? 0;
  const isMin = direction === "minimize";
  const currentSimpleRegret = computeSimpleRegret(bestObserved.y, globalOptY, isMin);
  const currentCumulativeRegret = computeCumulativeRegret(
    observations.map((o) => o.y),
    globalOptY,
    isMin,
  );

  // 1D SVG plotting dimensions
  const svgWidth = 720;
  const svgTopHeight = 220;
  const svgBottomHeight = 150;
  const padding = { top: 20, right: 30, bottom: 25, left: 55 };

  // Calculate 1D Y bounds for top chart
  const bounds1D = useMemo(() => {
    if (currentObjective.dimension !== 1 || grid1D.length === 0) {
      return { yMin: -10, yMax: 10, acqMin: 0, acqMax: 1 };
    }

    let yMin = Infinity;
    let yMax = -Infinity;

    // True curve bounds
    for (const pt of grid1D) {
      const y = currentObjective.fn(pt);
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }

    // GP upper/lower 2sigma bounds
    for (let i = 0; i < gpPosterior.mean.length; i++) {
      const low = gpPosterior.lower2Sigma[i];
      const upp = gpPosterior.upper2Sigma[i];
      if (low < yMin) yMin = low;
      if (upp > yMax) yMax = upp;
    }

    // Observations bounds
    for (const o of observations) {
      if (o.y < yMin) yMin = o.y;
      if (o.y > yMax) yMax = o.y;
    }

    // Add padding to Y bounds
    const ySpan = Math.max(1e-4, yMax - yMin);
    yMin -= ySpan * 0.1;
    yMax += ySpan * 0.1;

    // Acquisition bounds
    let acqMin = 0;
    let acqMax = -Infinity;
    for (const v of acquisitionResult.acquisitionValues) {
      if (v < acqMin) acqMin = v;
      if (v > acqMax) acqMax = v;
    }
    if (acqMax <= acqMin) acqMax = acqMin + 1;
    const acqSpan = acqMax - acqMin;
    acqMax += acqSpan * 0.1;

    return { yMin, yMax, acqMin, acqMax };
  }, [currentObjective, grid1D, gpPosterior, observations, acquisitionResult]);

  // Coordinate transforms for 1D SVG
  const xDomain = currentObjective.bounds[0] || { min: 0, max: 1 };
  const scaleX = useCallback(
    (x: number) => {
      const innerW = svgWidth - padding.left - padding.right;
      return padding.left + ((x - xDomain.min) / (xDomain.max - xDomain.min)) * innerW;
    },
    [xDomain.min, xDomain.max, padding.left, padding.right, svgWidth],
  );

  const scaleYTop = useCallback(
    (y: number) => {
      const innerH = svgTopHeight - padding.top - padding.bottom;
      return padding.top + innerH * (1 - (y - bounds1D.yMin) / (bounds1D.yMax - bounds1D.yMin));
    },
    [bounds1D.yMin, bounds1D.yMax, padding.top, padding.bottom, svgTopHeight],
  );

  const scaleYBottom = useCallback(
    (y: number) => {
      const innerH = svgBottomHeight - padding.top - padding.bottom;
      return (
        padding.top + innerH * (1 - (y - bounds1D.acqMin) / (bounds1D.acqMax - bounds1D.acqMin))
      );
    },
    [bounds1D.acqMin, bounds1D.acqMax, padding.top, padding.bottom, svgBottomHeight],
  );

  // Build SVG Paths for 1D
  const trueFunctionPath = useMemo(() => {
    if (currentObjective.dimension !== 1 || grid1D.length === 0) return "";
    return grid1D
      .map((pt, i) => {
        const sx = scaleX(pt[0]);
        const sy = scaleYTop(currentObjective.fn(pt));
        return `${i === 0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      })
      .join(" ");
  }, [currentObjective, grid1D, scaleX, scaleYTop]);

  const gpMeanPath = useMemo(() => {
    if (currentObjective.dimension !== 1 || grid1D.length === 0) return "";
    return grid1D
      .map((pt, i) => {
        const sx = scaleX(pt[0]);
        const sy = scaleYTop(gpPosterior.mean[i]);
        return `${i === 0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      })
      .join(" ");
  }, [currentObjective.dimension, grid1D, gpPosterior.mean, scaleX, scaleYTop]);

  const gpConfidenceBandPath = useMemo(() => {
    if (currentObjective.dimension !== 1 || grid1D.length === 0) return "";
    const n = grid1D.length;
    let forward = "";
    let backward = "";
    for (let i = 0; i < n; i++) {
      const sx = scaleX(grid1D[i][0]);
      const syUpper = scaleYTop(gpPosterior.upper2Sigma[i]);
      forward += `${i === 0 ? "M" : "L"} ${sx.toFixed(1)} ${syUpper.toFixed(1)} `;
    }
    for (let i = n - 1; i >= 0; i--) {
      const sx = scaleX(grid1D[i][0]);
      const syLower = scaleYTop(gpPosterior.lower2Sigma[i]);
      backward += `L ${sx.toFixed(1)} ${syLower.toFixed(1)} `;
    }
    return `${forward} ${backward} Z`;
  }, [
    currentObjective.dimension,
    grid1D,
    gpPosterior.lower2Sigma,
    gpPosterior.upper2Sigma,
    scaleX,
    scaleYTop,
  ]);

  const acquisitionPath = useMemo(() => {
    if (currentObjective.dimension !== 1 || grid1D.length === 0) return "";
    return grid1D
      .map((pt, i) => {
        const sx = scaleX(pt[0]);
        const sy = scaleYBottom(acquisitionResult.acquisitionValues[i]);
        return `${i === 0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      })
      .join(" ");
  }, [
    currentObjective.dimension,
    grid1D,
    acquisitionResult.acquisitionValues,
    scaleX,
    scaleYBottom,
  ]);

  // Thompson sample path for 1D if active
  const thompsonSamplePath = useMemo(() => {
    if (
      currentObjective.dimension !== 1 ||
      grid1D.length === 0 ||
      !acquisitionResult.sampledFunction
    )
      return "";
    return grid1D
      .map((pt, i) => {
        const sx = scaleX(pt[0]);
        const sy = scaleYTop(acquisitionResult.sampledFunction![i]);
        return `${i === 0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      })
      .join(" ");
  }, [currentObjective.dimension, grid1D, acquisitionResult.sampledFunction, scaleX, scaleYTop]);

  // Render 2D Heatmap / Contour Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (currentObjective.dimension !== 2 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { nx, ny, pts, b0, b1 } = grid2D;
    if (nx === 0 || ny === 0) return;

    const widthPx = canvas.width;
    const heightPx = canvas.height;
    ctx.clearRect(0, 0, widthPx, heightPx);

    // Compute values depending on 2D view mode
    const values: number[] = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) {
      if (view2DMode === "true") {
        values[i] = currentObjective.fn(pts[i]);
      } else if (view2DMode === "gp_mean") {
        values[i] = gpPosterior.mean[i] ?? 0;
      } else {
        values[i] = acquisitionResult.acquisitionValues[i] ?? 0;
      }
    }

    let minV = Infinity;
    let maxV = -Infinity;
    for (const v of values) {
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    const spanV = Math.max(1e-6, maxV - minV);

    // Draw cells
    const cellW = widthPx / nx;
    const cellH = heightPx / ny;

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const idx = j * nx + i;
        const norm = (values[idx] - minV) / spanV;
        // Invert Y coordinate for canvas (origin top-left)
        const canvasY = heightPx - (j + 1) * cellH;
        const canvasX = i * cellW;

        ctx.fillStyle = view2DMode === "acquisition" ? colormapPlasma(norm) : colormapTurbo(norm);
        ctx.fillRect(canvasX, canvasY, cellW + 0.5, cellH + 0.5);
      }
    }

    // Draw Global Optima targets
    for (const opt of currentObjective.globalOptima) {
      const gx = ((opt.x[0] - b0.min) / (b0.max - b0.min)) * widthPx;
      const gy = heightPx - ((opt.x[1] - b1.min) / (b1.max - b1.min)) * heightPx;

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(gx, gy, 8, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.strokeStyle = "#e11d48";
      ctx.beginPath();
      ctx.moveTo(gx - 10, gy);
      ctx.lineTo(gx + 10, gy);
      ctx.moveTo(gx, gy - 10);
      ctx.lineTo(gx, gy + 10);
      ctx.stroke();
    }

    // Draw Query Points trajectory
    if (observations.length > 0) {
      ctx.beginPath();
      for (let i = 0; i < observations.length; i++) {
        const ox = ((observations[i].x[0] - b0.min) / (b0.max - b0.min)) * widthPx;
        const oy = heightPx - ((observations[i].x[1] - b1.min) / (b1.max - b1.min)) * heightPx;
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw observation dots
      for (let i = 0; i < observations.length; i++) {
        const o = observations[i];
        const ox = ((o.x[0] - b0.min) / (b0.max - b0.min)) * widthPx;
        const oy = heightPx - ((o.x[1] - b1.min) / (b1.max - b1.min)) * heightPx;

        ctx.fillStyle = o.isInitial ? "#3b82f6" : "#10b981";
        ctx.beginPath();
        ctx.arc(ox, oy, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px sans-serif";
        ctx.fillText(`${o.step}`, ox + 7, oy - 4);
      }
    }

    // Draw Next Candidate marker
    const cand = acquisitionResult.candidatePoint;
    if (cand && cand.length >= 2) {
      const cx = ((cand[0] - b0.min) / (b0.max - b0.min)) * widthPx;
      const cy = heightPx - ((cand[1] - b1.min) / (b1.max - b1.min)) * heightPx;

      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`t+1`, cx + 9, cy - 6);
    }
  }, [currentObjective, grid2D, gpPosterior, acquisitionResult, observations, view2DMode]);

  return (
    <div
      className={`bayes-opt-studio flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans ${
        standalone ? "p-4 md:p-6" : "p-3"
      }`}
      style={{ width, height: height === "auto" ? undefined : height }}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/40 rounded-xl text-indigo-400 shadow-inner">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                {title}
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                {currentObjective.dimension}D {direction.toUpperCase()}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Gaussian Process surrogate modeling & acquisition function maximization engine
            </p>
          </div>
        </div>

        {/* HUD Stats Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 shadow-sm">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Step:</span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {observations.length}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 shadow-sm">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">Best y*:</span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {bestObserved.y !== Infinity && bestObserved.y !== -Infinity
                ? bestObserved.y.toFixed(4)
                : "—"}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 shadow-sm">
            <TrendingDown className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Simple Regret:</span>
            <span className="text-xs font-mono font-bold text-amber-300">
              {currentSimpleRegret.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center justify-between border-b border-slate-800 pt-3 pb-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("visualizer")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "visualizer"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Studio View
          </button>
          <button
            onClick={() => setActiveTab("math")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "math"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Acquisition Math
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "diagnostics"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Surrogate Diagnostics
          </button>
          <button
            onClick={() => setActiveTab("benchmarks")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "benchmarks"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Benchmark Profiles
          </button>
        </div>

        {/* Preset Quick Picker */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs text-slate-400">Preset:</span>
          <select
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            onChange={(e) => {
              const presetKey = e.target.value as BayesOptPresetId;
              if (BAYES_OPT_PRESETS[presetKey]) {
                const p = BAYES_OPT_PRESETS[presetKey];
                setSelectedObjectiveId(p.objectiveId);
                setSelectedAcquisition(p.acquisitionType);
                setSelectedKernel(p.kernelType);
                setDirection(p.direction);
                setNInitialSamples(p.initialSamples);
                resetOptimization(
                  p.objectiveId,
                  p.hyperparams,
                  p.initialSamples,
                  designStrategy,
                  randomSeed,
                );
              }
            }}
          >
            <option value="">Select a preset...</option>
            {Object.values(BAYES_OPT_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === "visualizer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
          {/* MAIN VISUALIZER VIEWPORT (8 COLS) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* 1D DUAL SVG VIEWPORTS */}
            {currentObjective.dimension === 1 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-inner">
                {/* TOP CHART: TRUE OBJECTIVE & GP POSTERIOR */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        GP Posterior Mean & Confidence Envelope (f(x) vs μ(x) ± 2σ(x))
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="inline-block w-3 h-0.5 border-t border-dashed border-slate-400" />
                        <span>True f(x)</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="inline-block w-3 h-0.5 bg-indigo-400" />
                        <span>GP μ(x)</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="inline-block w-2.5 h-2.5 bg-indigo-500/20 border border-indigo-500/40 rounded-sm" />
                        <span>±2σ(x) Band</span>
                      </div>
                    </div>
                  </div>

                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgTopHeight}`}
                    className="w-full h-auto bg-slate-950/70 rounded-lg border border-slate-800/80 overflow-visible select-none"
                  >
                    {/* Grid lines */}
                    <line
                      x1={padding.left}
                      y1={scaleYTop(0)}
                      x2={svgWidth - padding.right}
                      y2={scaleYTop(0)}
                      stroke="#334155"
                      strokeWidth={1}
                      strokeDasharray="3,3"
                    />

                    {/* GP Confidence Envelope Fill */}
                    {gpConfidenceBandPath && (
                      <path
                        d={gpConfidenceBandPath}
                        fill="rgba(99, 102, 241, 0.15)"
                        stroke="rgba(99, 102, 241, 0.3)"
                        strokeWidth={0.75}
                      />
                    )}

                    {/* True Objective Function (Dashed) */}
                    {trueFunctionPath && (
                      <path
                        d={trueFunctionPath}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth={1.75}
                        strokeDasharray="4,4"
                      />
                    )}

                    {/* GP Posterior Mean (Solid Indigo) */}
                    {gpMeanPath && (
                      <path d={gpMeanPath} fill="none" stroke="#818cf8" strokeWidth={2.5} />
                    )}

                    {/* Thompson Sample Function Path (if selected) */}
                    {selectedAcquisition === "thompson" && thompsonSamplePath && (
                      <path
                        d={thompsonSamplePath}
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth={1.5}
                        strokeDasharray="2,2"
                        opacity={0.8}
                      />
                    )}

                    {/* Candidate Next Query Marker Line */}
                    {acquisitionResult.candidatePoint && (
                      <g>
                        <line
                          x1={scaleX(acquisitionResult.candidatePoint[0])}
                          y1={padding.top}
                          x2={scaleX(acquisitionResult.candidatePoint[0])}
                          y2={svgTopHeight - padding.bottom}
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          strokeDasharray="3,3"
                        />
                        <circle
                          cx={scaleX(acquisitionResult.candidatePoint[0])}
                          cy={scaleYTop(currentObjective.fn(acquisitionResult.candidatePoint))}
                          r={5}
                          fill="#f59e0b"
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                      </g>
                    )}

                    {/* Observation Points */}
                    {observations.map((obs) => {
                      const cx = scaleX(obs.x[0]);
                      const cy = scaleYTop(obs.y);
                      const isBest = obs.y === bestObserved.y;
                      return (
                        <g key={obs.id} className="cursor-pointer">
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isBest ? 6.5 : 4.5}
                            fill={isBest ? "#f43f5e" : obs.isInitial ? "#3b82f6" : "#10b981"}
                            stroke="#ffffff"
                            strokeWidth={isBest ? 2 : 1.2}
                          />
                          <text
                            x={cx}
                            y={cy - 7}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#e2e8f0"
                            fontWeight="bold"
                          >
                            {obs.step}
                          </text>
                        </g>
                      );
                    })}

                    {/* Global Optimum Marker */}
                    {currentObjective.globalOptima.map((opt, i) => (
                      <g key={i}>
                        <circle
                          cx={scaleX(opt.x[0])}
                          cy={scaleYTop(opt.y)}
                          r={6}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth={1.5}
                          strokeDasharray="2,2"
                        />
                      </g>
                    ))}

                    {/* Axis Labels */}
                    <text
                      x={padding.left}
                      y={padding.top - 5}
                      fontSize="9"
                      fill="#64748b"
                      textAnchor="start"
                    >
                      y
                    </text>
                    <text
                      x={svgWidth - padding.right}
                      y={svgTopHeight - padding.bottom + 15}
                      fontSize="9"
                      fill="#64748b"
                      textAnchor="end"
                    >
                      x
                    </text>
                  </svg>
                </div>

                {/* BOTTOM CHART: ACQUISITION FUNCTION CURVE */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      Acquisition Function Curve:{" "}
                      <span className="text-amber-300 font-mono">
                        {selectedAcquisition.toUpperCase()}(x)
                      </span>
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-amber-300 font-mono">
                      <span>
                        Argmax x_(t+1) = {acquisitionResult.candidatePoint[0]?.toFixed(4)}
                      </span>
                      <span>(Score: {acquisitionResult.maxAcquisitionValue.toFixed(4)})</span>
                    </div>
                  </div>

                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgBottomHeight}`}
                    className="w-full h-auto bg-slate-950/70 rounded-lg border border-slate-800/80 overflow-visible select-none"
                  >
                    {/* Acquisition Curve */}
                    {acquisitionPath && (
                      <path d={acquisitionPath} fill="none" stroke="#f59e0b" strokeWidth={2.2} />
                    )}

                    {/* Peak Candidate Marker */}
                    {acquisitionResult.candidatePoint && (
                      <g>
                        <line
                          x1={scaleX(acquisitionResult.candidatePoint[0])}
                          y1={padding.top}
                          x2={scaleX(acquisitionResult.candidatePoint[0])}
                          y2={svgBottomHeight - padding.bottom}
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          strokeDasharray="2,2"
                        />
                        <circle
                          cx={scaleX(acquisitionResult.candidatePoint[0])}
                          cy={scaleYBottom(acquisitionResult.maxAcquisitionValue)}
                          r={5.5}
                          fill="#f59e0b"
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                      </g>
                    )}

                    {/* Zero baseline */}
                    <line
                      x1={padding.left}
                      y1={scaleYBottom(0)}
                      x2={svgWidth - padding.right}
                      y2={scaleYBottom(0)}
                      stroke="#334155"
                      strokeWidth={1}
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* 2D MULTI-VIEW HEATMAP & CONTOUR VIEWPORT */}
            {currentObjective.dimension === 2 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      2D Surrogate Landscape & Query Trajectory
                    </span>
                  </div>

                  {/* Surface Mode Switcher */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setView2DMode("true")}
                      className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                        view2DMode === "true"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      True Surface
                    </button>
                    <button
                      onClick={() => setView2DMode("gp_mean")}
                      className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                        view2DMode === "gp_mean"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      GP Mean μ(x)
                    </button>
                    <button
                      onClick={() => setView2DMode("acquisition")}
                      className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                        view2DMode === "acquisition"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Acquisition α(x)
                    </button>
                  </div>
                </div>

                <div className="relative aspect-video w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={270}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] text-slate-300 border border-slate-800">
                    Domain: x₁ ∈ [{currentObjective.bounds[0].min}, {currentObjective.bounds[0].max}
                    ], x₂ ∈ [{currentObjective.bounds[1].min}, {currentObjective.bounds[1].max}]
                  </div>
                  <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] text-amber-300 font-mono border border-slate-800">
                    Next Query: ({acquisitionResult.candidatePoint[0]?.toFixed(3)},{" "}
                    {acquisitionResult.candidatePoint[1]?.toFixed(3)})
                  </div>
                </div>
              </div>
            )}

            {/* CONVERGENCE & REGRET TRACE HUD */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Metric 1: Best Value Trace */}
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Best Observed Value (y⁺)</span>
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                </span>
                <span className="text-lg font-mono font-bold text-cyan-300">
                  {bestObserved.y.toFixed(5)}
                </span>
                <span className="text-[11px] text-slate-500">
                  Global Target: {globalOptY.toFixed(5)}
                </span>
              </div>

              {/* Metric 2: Simple Regret */}
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Simple Regret (r_t)</span>
                  <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                </span>
                <span className="text-lg font-mono font-bold text-amber-300">
                  {currentSimpleRegret.toFixed(5)}
                </span>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full transition-all duration-300"
                    style={{
                      width: `${Math.max(5, Math.min(100, 100 * Math.exp(-currentSimpleRegret)))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Metric 3: Cumulative Regret */}
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Cumulative Regret (R_T)</span>
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                </span>
                <span className="text-lg font-mono font-bold text-purple-300">
                  {currentCumulativeRegret.toFixed(4)}
                </span>
                <span className="text-[11px] text-slate-500">
                  Avg Regret/Step:{" "}
                  {(currentCumulativeRegret / Math.max(1, observations.length)).toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT CONTROLS & HYPERPARAMETERS SIDEBAR (4 COLS) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* PLAYBACK & STEPPING CONTROLS */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Execution Controls
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all shadow-md ${
                    isPlaying
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? "Pause" : "Auto-Run"}
                </button>

                <button
                  onClick={stepOptimization}
                  disabled={isPlaying || observations.length >= 40}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/30"
                >
                  <StepForward className="w-3.5 h-3.5" />
                  Step (t+1)
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => stepMultiple(5)}
                  disabled={isPlaying || observations.length >= 40}
                  className="py-1.5 px-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                >
                  <FastForward className="w-3 h-3 text-indigo-400" /> +5 Steps
                </button>
                <button
                  onClick={() => stepMultiple(10)}
                  disabled={isPlaying || observations.length >= 40}
                  className="py-1.5 px-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                >
                  <FastForward className="w-3 h-3 text-indigo-400" /> +10 Steps
                </button>
                <button
                  onClick={() => resetOptimization()}
                  className="py-1.5 px-2 rounded-md bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-medium transition-all flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3 text-rose-400" /> Reset
                </button>
              </div>
            </div>

            {/* PROBLEM CONFIGURATION */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Problem Setup
              </span>

              {/* Benchmark Objective Dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-300">Objective Function:</label>
                <select
                  value={selectedObjectiveId}
                  onChange={(e) => handleObjectiveChange(e.target.value as OptimizationObjectiveId)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {Object.values(BENCHMARK_OBJECTIVES).map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.name} ({obj.dimension}D)
                    </option>
                  ))}
                </select>
              </div>

              {/* Acquisition Function Picker */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-300">Acquisition Strategy:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["ei", "ucb", "pi", "thompson"] as AcquisitionFunctionType[]).map((acq) => (
                    <button
                      key={acq}
                      onClick={() => setSelectedAcquisition(acq)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all border ${
                        selectedAcquisition === acq
                          ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {acq === "ei"
                        ? "EI"
                        : acq === "ucb"
                          ? "GP-UCB"
                          : acq === "pi"
                            ? "PI"
                            : "Thompson"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kernel Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-300">GP Surrogate Kernel:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setSelectedKernel("matern52")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all border ${
                      selectedKernel === "matern52"
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Matérn 5/2 (Smooth)
                  </button>
                  <button
                    onClick={() => setSelectedKernel("rbf")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all border ${
                      selectedKernel === "rbf"
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    RBF / SE (C^∞)
                  </button>
                </div>
              </div>

              {/* Initial Design Strategy Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-300">Design Strategy:</label>
                <select
                  value={designStrategy}
                  onChange={(e) => {
                    const strat = e.target.value as InitialDesignStrategy;
                    setDesignStrategy(strat);
                    resetOptimization(
                      selectedObjectiveId,
                      hyperparams,
                      nInitialSamples,
                      strat,
                      randomSeed,
                    );
                  }}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="latin_hypercube">Latin Hypercube Sampling (LHS)</option>
                  <option value="uniform_random">Uniform Random</option>
                  <option value="equispaced">Equispaced Regular Grid</option>
                </select>
              </div>

              {/* Initial Sample Size */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Initial Design Size (N₀):</span>
                  <span className="font-mono text-slate-200">{nInitialSamples}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={10}
                  step={1}
                  value={nInitialSamples}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNInitialSamples(val);
                    resetOptimization(
                      selectedObjectiveId,
                      hyperparams,
                      val,
                      designStrategy,
                      randomSeed,
                    );
                  }}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Random Seed Controller */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Random Seed:</span>
                  <span className="font-mono text-slate-200">{randomSeed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={100}
                    step={1}
                    value={randomSeed}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRandomSeed(val);
                      resetOptimization(
                        selectedObjectiveId,
                        hyperparams,
                        nInitialSamples,
                        designStrategy,
                        val,
                      );
                    }}
                    className="w-full accent-indigo-500"
                  />
                  <button
                    onClick={() => {
                      const newSeed = Math.floor(Math.random() * 100) + 1;
                      setRandomSeed(newSeed);
                      resetOptimization(
                        selectedObjectiveId,
                        hyperparams,
                        nInitialSamples,
                        designStrategy,
                        newSeed,
                      );
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-all"
                  >
                    Shuffle
                  </button>
                </div>
              </div>
            </div>

            {/* HYPERPARAMETER SLIDERS */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Hyperparameter Tuning
              </span>

              {/* Lengthscale */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Lengthscale (ℓ):</span>
                  <span className="font-mono text-slate-200">
                    {hyperparams.lengthscale.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={5.0}
                  step={0.05}
                  value={hyperparams.lengthscale}
                  onChange={(e) =>
                    setHyperparams({ ...hyperparams, lengthscale: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Variance */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Signal Variance (σ_f²):</span>
                  <span className="font-mono text-slate-200">
                    {hyperparams.variance.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={50.0}
                  step={0.5}
                  value={hyperparams.variance}
                  onChange={(e) =>
                    setHyperparams({ ...hyperparams, variance: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Exploration tradeoff xi for EI / PI */}
              {(selectedAcquisition === "ei" || selectedAcquisition === "pi") && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Exploration Trade-off (ξ):</span>
                    <span className="font-mono text-amber-300">{hyperparams.xi.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={0.2}
                    step={0.005}
                    value={hyperparams.xi}
                    onChange={(e) => setHyperparams({ ...hyperparams, xi: Number(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                </div>
              )}

              {/* Beta for GP-UCB */}
              {selectedAcquisition === "ucb" && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>UCB Multiplier (β):</span>
                    <span className="font-mono text-amber-300">{hyperparams.beta.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={5.0}
                    step={0.1}
                    value={hyperparams.beta}
                    onChange={(e) =>
                      setHyperparams({ ...hyperparams, beta: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACQUISITION MATH & DERIVATIONS */}
      {activeTab === "math" && (
        <div className="mt-4 p-5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col gap-6 text-slate-300 text-sm leading-relaxed">
          <div className="flex items-center gap-2 text-indigo-300 text-base font-semibold border-b border-slate-800 pb-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Bayesian Optimization Acquisition Functions & Mathematical Formulations
          </div>

          {/* 1. Expected Improvement */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col gap-2">
            <div className="font-bold text-amber-300 text-sm">1. Expected Improvement (EI)</div>
            <p className="text-xs text-slate-300">
              Measures the expected reduction in objective value beneath the incumbent minimum y⁺ =
              min(y_i) (for minimization):
            </p>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-md font-mono text-xs text-indigo-300">
              {"α_EI(x) = E[max(0, y⁺ - ξ - f(x))] = (y⁺ - ξ - μ(x)) Φ(Z) + σ(x) φ(Z)"}
              <br />
              {"where Z = (y⁺ - ξ - μ(x)) / σ(x)"}
            </div>
            <p className="text-[12px] text-slate-400">
              The first term represents{" "}
              <span className="text-emerald-400 font-semibold">exploitation</span> (pulling towards
              high predicted improvement), while the second term represents{" "}
              <span className="text-indigo-400 font-semibold">exploration</span> (favoring high
              epistemic uncertainty σ(x)). Parameter ξ ≥ 0 controls the exploratory threshold.
            </p>
          </div>

          {/* 2. GP-UCB */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col gap-2">
            <div className="font-bold text-amber-300 text-sm">
              2. Gaussian Process Upper/Lower Confidence Bound (GP-UCB / GP-LCB)
            </div>
            <p className="text-xs text-slate-300">
              Optimistic exploration principle based on bounding the tail uncertainty of the
              posterior distribution:
            </p>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-md font-mono text-xs text-indigo-300">
              {"Maximization: α_UCB(x) = μ(x) + β σ(x)"}
              <br />
              {"Minimization: α_LCB(x) = -μ(x) + β σ(x)"}
            </div>
            <p className="text-[12px] text-slate-400">
              Srinivas et al. (2010) proved sublinear cumulative regret bounds R_T = O(sqrt(T γ_T))
              where γ_T is the maximum information gain.
            </p>
          </div>

          {/* 3. Probability of Improvement */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col gap-2">
            <div className="font-bold text-amber-300 text-sm">
              3. Probability of Improvement (PI)
            </div>
            <p className="text-xs text-slate-300">
              Calculates the cumulative probability that a new query improves upon the incumbent by
              at least ξ:
            </p>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-md font-mono text-xs text-indigo-300">
              {"α_PI(x) = P(f(x) ≤ y⁺ - ξ) = Φ((y⁺ - ξ - μ(x)) / σ(x))"}
            </div>
          </div>

          {/* 4. Thompson Sampling */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col gap-2">
            <div className="font-bold text-amber-300 text-sm">
              4. Posterior Path Thompson Sampling
            </div>
            <p className="text-xs text-slate-300">
              Samples a function trajectory f_sample ~ GP(μ, Σ) from the posterior distribution and
              selects its global minimizer:
            </p>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-md font-mono text-xs text-indigo-300">
              {"x_(t+1) = argmin f_sample(x), where f_sample = μ* + L* z, z ~ N(0, I)"}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SURROGATE DIAGNOSTICS */}
      {activeTab === "diagnostics" && (
        <div className="mt-4 p-5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col gap-5 text-slate-300 text-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-indigo-300 text-base font-semibold">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Gaussian Process Gram Matrix Diagnostics & Condition Number
            </div>
            <span className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
              Observations N = {observations.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Condition Number Card */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col gap-2">
              <span className="text-xs text-slate-400">Gram Matrix Condition Number κ(K_y)</span>
              <span className="text-xl font-mono font-bold text-indigo-300">
                {gpPosterior.conditionNumber.toExponential(3)}
              </span>
              <span className="text-[12px] text-slate-500">
                {gpPosterior.conditionNumber < 1e5
                  ? "Well-conditioned: Cholesky decomposition L L^T is numerically stable."
                  : "Near ill-conditioned: Adaptive diagonal jitter added for regularization."}
              </span>
            </div>

            {/* Noise & Regularization */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col gap-2">
              <span className="text-xs text-slate-400">Regularization & Noise Settings</span>
              <div className="flex items-center justify-between text-xs font-mono">
                <span>Observational Noise σ_n²:</span>
                <span className="text-cyan-300">{hyperparams.noiseVariance}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span>Cholesky Jitter ϵ:</span>
                <span className="text-cyan-300">{hyperparams.jitter}</span>
              </div>
            </div>
          </div>

          {/* Observations Table */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Observation History Log (x_i, y_i)
            </span>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-slate-900 text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-2">Step</th>
                    <th className="p-2">Location x</th>
                    <th className="p-2">Observed y</th>
                    <th className="p-2">Best y⁺</th>
                    <th className="p-2">Simple Regret</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {history.map((h) => (
                    <tr key={h.step} className="hover:bg-slate-900/50">
                      <td className="p-2 text-indigo-300">{h.step}</td>
                      <td className="p-2">[{h.x.map((v) => v.toFixed(3)).join(", ")}]</td>
                      <td className="p-2 text-slate-200">{h.y.toFixed(4)}</td>
                      <td className="p-2 text-cyan-300">{h.bestY.toFixed(4)}</td>
                      <td className="p-2 text-amber-300">{h.simpleRegret.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BENCHMARK PROFILES & THEORY */}
      {activeTab === "benchmarks" && (
        <div className="mt-4 p-5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col gap-4 text-slate-300 text-sm">
          <div className="flex items-center gap-2 text-indigo-300 text-base font-semibold border-b border-slate-800 pb-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Standard Benchmark Black-Box Functions Library
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(BENCHMARK_OBJECTIVES).map((obj) => (
              <div
                key={obj.id}
                className={`p-4 rounded-lg border flex flex-col gap-2 cursor-pointer transition-all ${
                  selectedObjectiveId === obj.id
                    ? "bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-900/20"
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                }`}
                onClick={() => handleObjectiveChange(obj.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{obj.name}</span>
                  <span className="text-xs font-mono bg-slate-900 px-2 py-0.5 rounded text-indigo-300 border border-slate-800">
                    {obj.dimension}D
                  </span>
                </div>
                <div className="p-2 bg-slate-900/80 rounded font-mono text-[11px] text-amber-300 overflow-x-auto">
                  {obj.formulaTeX}
                </div>
                <p className="text-xs text-slate-400">{obj.description}</p>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>Bounds: {obj.bounds.map((b) => `[${b.min}, ${b.max}]`).join(" × ")}</span>
                  <span className="text-emerald-400">f* = {obj.globalOptima[0].y.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
