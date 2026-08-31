import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Compass,
  Layers,
  Info,
  Sliders,
  TrendingUp,
  BarChart2,
  Flame,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type Vector2 = [number, number];
export type Matrix2x2 = [[number, number], [number, number]];

export type TargetDistributionId =
  | "multimodal_gmm"
  | "rosenbrock_banana"
  | "concentric_doughnut"
  | "bivariate_correlated_gaussian"
  | "discrete_vocab_logits";

export type SamplingAlgorithmId =
  | "metropolis_hastings"
  | "hamiltonian_monte_carlo"
  | "gibbs"
  | "discrete_top_k_p";

export type SamplingPresetId =
  | "gmm_multimodal_trapping"
  | "rosenbrock_hmc_ridge"
  | "correlated_gaussian_gibbs_vs_mh"
  | "concentric_doughnut_tunneling"
  | "llm_creative_nucleus_generation";

export interface GMMComponent {
  readonly weight: number;
  readonly mean: Vector2;
  readonly cov: Matrix2x2;
}

export interface GMMConfig {
  readonly components: readonly GMMComponent[];
}

export interface RosenbrockConfig {
  readonly a: number;
  readonly b: number;
  readonly sx: number;
  readonly sy: number;
}

export interface DoughnutConfig {
  readonly r0: number;
  readonly sigma: number;
}

export interface BivariateGaussianConfig {
  readonly mean: Vector2;
  readonly sigma1: number;
  readonly sigma2: number;
  readonly rho: number;
}

export interface DiscreteTokenItem {
  readonly token: string;
  readonly logit: number;
  readonly category: string;
}

export interface MHStepResult {
  readonly accepted: boolean;
  readonly proposal: Vector2;
  readonly nextPoint: Vector2;
  readonly alpha: number;
  readonly energyCurrent: number;
  readonly energyProposal: number;
}

export interface GibbsStepResult {
  readonly intermediatePoint: Vector2;
  readonly nextPoint: Vector2;
  readonly accepted: true;
  readonly alpha: 1.0;
}

export interface HMCStepResult {
  readonly accepted: boolean;
  readonly proposal: Vector2;
  readonly nextPoint: Vector2;
  readonly trajectory: readonly Vector2[];
  readonly initialMomentum: Vector2;
  readonly finalMomentum: Vector2;
  readonly initialHamiltonian: number;
  readonly finalHamiltonian: number;
  readonly deltaH: number;
  readonly alpha: number;
}

export interface DiscreteStepResult {
  readonly rawProbs: readonly number[];
  readonly scaledProbs: readonly number[];
  readonly filteredProbs: readonly number[];
  readonly cumulativeProbs: readonly number[];
  readonly keptIndices: readonly number[];
  readonly sampledIndex: number;
  readonly sampledToken: string;
}

export interface SampleHistoryItem {
  readonly id: number;
  readonly point: Vector2;
  readonly accepted: boolean;
  readonly algorithm: SamplingAlgorithmId;
  readonly trajectory?: readonly Vector2[];
  readonly alpha: number;
  readonly energy: number;
}

export interface ChainDiagnostics {
  readonly totalProposals: number;
  readonly acceptedCount: number;
  readonly acceptanceRate: number;
  readonly recentAcceptanceRate: number;
  readonly effectiveSampleSizeX: number;
  readonly effectiveSampleSizeY: number;
  readonly essEfficiency: number;
  readonly sampleMean: Vector2;
  readonly sampleVariance: Vector2;
  readonly sampleCovariance: number;
  readonly sampleCorrelation: number;
  readonly acfX: readonly number[];
  readonly acfY: readonly number[];
}

export interface SamplingPreset {
  readonly id: SamplingPresetId;
  readonly name: string;
  readonly targetDistribution: TargetDistributionId;
  readonly recommendedAlgorithm: SamplingAlgorithmId;
  readonly description: string;
  readonly educationalNotes: string;
  readonly defaultProposalStd?: number;
  readonly defaultHmcEpsilon?: number;
  readonly defaultHmcL?: number;
  readonly defaultTemperature?: number;
  readonly defaultTopK?: number;
  readonly defaultTopP?: number;
  readonly defaultStartPoint: Vector2;
}

export interface ProbabilisticSamplingStudioProps {
  readonly initialDistribution?: TargetDistributionId;
  readonly initialAlgorithm?: SamplingAlgorithmId;
  readonly initialPreset?: SamplingPresetId;
  readonly width?: number;
  readonly height?: number;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onSampleAccepted?: (sample: Vector2 | string) => void;
  readonly onDiagnosticsUpdate?: (diagnostics: ChainDiagnostics) => void;
}

// ============================================================================
// 2. MATHEMATICAL DEFAULTS & CONFIGURATIONS
// ============================================================================

export const DEFAULT_GMM_CONFIG: GMMConfig = {
  components: [
    {
      weight: 0.35,
      mean: [-2.0, -1.8],
      cov: [
        [0.6, 0.2],
        [0.2, 0.5],
      ],
    },
    {
      weight: 0.4,
      mean: [2.2, 1.8],
      cov: [
        [0.5, -0.25],
        [-0.25, 0.7],
      ],
    },
    {
      weight: 0.25,
      mean: [-1.8, 2.2],
      cov: [
        [0.4, 0.0],
        [0.0, 0.4],
      ],
    },
  ],
};

export const DEFAULT_ROSENBROCK_CONFIG: RosenbrockConfig = {
  a: 1.0,
  b: 1.0,
  sx: 1.0,
  sy: 0.5,
};

export const DEFAULT_DOUGHNUT_CONFIG: DoughnutConfig = {
  r0: 2.5,
  sigma: 0.4,
};

export const DEFAULT_BIVARIATE_GAUSSIAN_CONFIG: BivariateGaussianConfig = {
  mean: [0.0, 0.0],
  sigma1: 1.4,
  sigma2: 1.0,
  rho: 0.85,
};

export const DEFAULT_DISCRETE_TOKENS: readonly DiscreteTokenItem[] = [
  { token: "quantum", logit: 4.8, category: "physics" },
  { token: "neural", logit: 4.6, category: "ai" },
  { token: "gradient", logit: 4.2, category: "math" },
  { token: "entropy", logit: 3.9, category: "physics" },
  { token: "markov", logit: 3.5, category: "stats" },
  { token: "tensor", logit: 3.2, category: "math" },
  { token: "manifold", logit: 2.8, category: "geometry" },
  { token: "posterior", logit: 2.5, category: "stats" },
  { token: "gibbs", logit: 2.1, category: "stats" },
  { token: "hamiltonian", logit: 1.8, category: "physics" },
  { token: "divergence", logit: 1.4, category: "math" },
  { token: "likelihood", logit: 0.9, category: "stats" },
];

export const SAMPLING_PRESETS: Record<SamplingPresetId, SamplingPreset> = {
  gmm_multimodal_trapping: {
    id: "gmm_multimodal_trapping",
    name: "GMM Multi-Modal Energy Wells & Barrier Trapping",
    targetDistribution: "multimodal_gmm",
    recommendedAlgorithm: "metropolis_hastings",
    description:
      "3 separated Gaussian modes with deep energy barriers. Demonstrates how small-step Random Walk MH gets trapped in a local mode, while HMC or Gibbs bridges modes.",
    educationalNotes:
      "In multi-modal distributions, random walk proposals rarely jump over the low-probability barrier between modes, leading to severe mode collapse and broken ergodicity.",
    defaultProposalStd: 0.45,
    defaultHmcEpsilon: 0.12,
    defaultHmcL: 18,
    defaultStartPoint: [-2.0, -1.8],
  },
  rosenbrock_hmc_ridge: {
    id: "rosenbrock_hmc_ridge",
    name: "Rosenbrock Banana Ridge Symplectic Flow",
    targetDistribution: "rosenbrock_banana",
    recommendedAlgorithm: "hamiltonian_monte_carlo",
    description:
      "Curved non-linear ridge valley. HMC uses Hamiltonian vector fields to smoothly glide along high-curvature ravines with 90%+ acceptance.",
    educationalNotes:
      "Random walk Metropolis diffuses as O(sqrt(N)) and jams against narrow curved walls. HMC introduces auxiliary momentum p ~ N(0, I) and symplectic leapfrog integration to follow energy contours.",
    defaultProposalStd: 0.35,
    defaultHmcEpsilon: 0.08,
    defaultHmcL: 20,
    defaultStartPoint: [-1.2, 1.44],
  },
  correlated_gaussian_gibbs_vs_mh: {
    id: "correlated_gaussian_gibbs_vs_mh",
    name: "Correlated Gaussian: Gibbs vs MH",
    targetDistribution: "bivariate_correlated_gaussian",
    recommendedAlgorithm: "gibbs",
    description:
      "Bivariate Gaussian with high correlation (rho = 0.92). Gibbs takes exact orthogonal conditional steps with 100% acceptance, but exhibits slow mixing along diagonal axes.",
    educationalNotes:
      "Gibbs sampling updates one coordinate at a time conditioned on all others: x1 | x2 ~ N(mu1 + rho*(s1/s2)*(x2-mu2), s1^2*(1-rho^2)). As |rho| -> 1, steps become tightly constrained.",
    defaultProposalStd: 0.5,
    defaultHmcEpsilon: 0.1,
    defaultHmcL: 15,
    defaultStartPoint: [-2.5, -2.0],
  },
  concentric_doughnut_tunneling: {
    id: "concentric_doughnut_tunneling",
    name: "Concentric Doughnut Basin & Central Barrier",
    targetDistribution: "concentric_doughnut",
    recommendedAlgorithm: "hamiltonian_monte_carlo",
    description:
      "Circular potential well with an empty central peak. Demonstrates phase space rotation and orbit dynamics in non-convex topologies.",
    educationalNotes:
      "Ring-shaped targets have non-trivial topology with zero gradient at the central peak and radial force pointing inward/outward toward r = r0.",
    defaultProposalStd: 0.4,
    defaultHmcEpsilon: 0.07,
    defaultHmcL: 22,
    defaultStartPoint: [2.5, 0.0],
  },
  llm_creative_nucleus_generation: {
    id: "llm_creative_nucleus_generation",
    name: "LLM Token Generation: Temperature & Top-p Nucleus",
    targetDistribution: "discrete_vocab_logits",
    recommendedAlgorithm: "discrete_top_k_p",
    description:
      "Discrete vocabulary token sampling. Adjust temperature to sharpen/flatten logits, apply Top-k truncation and Top-p nucleus filtering.",
    educationalNotes:
      "Softmax scaling p_i = exp(z_i / T) / sum_j exp(z_j / T) controls entropy. Nucleus (Top-p) dynamically bounds cumulative probability mass, preventing absurd tail hallucinations.",
    defaultTemperature: 0.85,
    defaultTopK: 5,
    defaultTopP: 0.9,
    defaultStartPoint: [0, 0],
  },
};

// ============================================================================
// 3. LINEAR ALGEBRA & STATISTICAL HELPER FUNCTIONS
// ============================================================================

export function invertMatrix2x2(m: Matrix2x2): Matrix2x2 {
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  if (Math.abs(det) < 1e-14) {
    return [
      [1, 0],
      [0, 1],
    ];
  }
  const invDet = 1 / det;
  return [
    [m[1][1] * invDet, -m[0][1] * invDet],
    [-m[1][0] * invDet, m[0][0] * invDet],
  ];
}

export function mahalanobisQuad2D(diff: Vector2, invCov: Matrix2x2): number {
  const dx = diff[0];
  const dy = diff[1];
  return (
    dx * (invCov[0][0] * dx + invCov[0][1] * dy) + dy * (invCov[1][0] * dx + invCov[1][1] * dy)
  );
}

export function sampleStandardNormal(rng: () => number = Math.random): number {
  let u1 = rng();
  while (u1 <= 1e-15) u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

export function sampleNormal2D(
  mean: Vector2,
  std: number,
  rng: () => number = Math.random,
): Vector2 {
  return [mean[0] + std * sampleStandardNormal(rng), mean[1] + std * sampleStandardNormal(rng)];
}

// ============================================================================
// 4. POTENTIAL ENERGY & GRADIENT EVALUATORS
// ============================================================================

/**
 * 2D Gaussian Mixture Model Potential Energy:
 * p(x) = sum_k w_k N(x; mu_k, Sigma_k)
 * U(x) = -log(p(x) + 1e-15)
 */
export function computeEnergyGMM(point: Vector2, config: GMMConfig = DEFAULT_GMM_CONFIG): number {
  let totalDensity = 0;
  for (const comp of config.components) {
    const det = comp.cov[0][0] * comp.cov[1][1] - comp.cov[0][1] * comp.cov[1][0];
    if (det <= 1e-12) continue;
    const invCov = invertMatrix2x2(comp.cov);
    const diff: Vector2 = [point[0] - comp.mean[0], point[1] - comp.mean[1]];
    const quad = mahalanobisQuad2D(diff, invCov);
    const normConst = 1.0 / (2.0 * Math.PI * Math.sqrt(det));
    const compDensity = comp.weight * normConst * Math.exp(-0.5 * quad);
    totalDensity += compDensity;
  }
  return -Math.log(Math.max(totalDensity, 1e-15));
}

/**
 * Analytical Gradient of GMM Potential Energy:
 * grad U(x) = sum_k gamma_k(x) Sigma_k^{-1} (x - mu_k)
 * where gamma_k(x) is the component responsibility.
 */
export function computeGradientGMM(
  point: Vector2,
  config: GMMConfig = DEFAULT_GMM_CONFIG,
): Vector2 {
  let totalDensity = 0;
  const compDensities: number[] = [];
  const compInvCovs: Matrix2x2[] = [];

  for (let i = 0; i < config.components.length; i++) {
    const comp = config.components[i];
    const det = comp.cov[0][0] * comp.cov[1][1] - comp.cov[0][1] * comp.cov[1][0];
    const invCov = invertMatrix2x2(comp.cov);
    compInvCovs.push(invCov);

    if (det <= 1e-12) {
      compDensities.push(0);
      continue;
    }
    const diff: Vector2 = [point[0] - comp.mean[0], point[1] - comp.mean[1]];
    const quad = mahalanobisQuad2D(diff, invCov);
    const normConst = 1.0 / (2.0 * Math.PI * Math.sqrt(det));
    const density = comp.weight * normConst * Math.exp(-0.5 * quad);
    compDensities.push(density);
    totalDensity += density;
  }

  if (totalDensity <= 1e-15) {
    // Return regularized pull toward center if in deep zero-density void
    return [point[0] * 0.1, point[1] * 0.1];
  }

  let gradX = 0;
  let gradY = 0;

  for (let i = 0; i < config.components.length; i++) {
    const comp = config.components[i];
    const gamma = compDensities[i] / totalDensity;
    if (gamma <= 1e-12) continue;
    const invCov = compInvCovs[i];
    const dx = point[0] - comp.mean[0];
    const dy = point[1] - comp.mean[1];

    const invDx = invCov[0][0] * dx + invCov[0][1] * dy;
    const invDy = invCov[1][0] * dx + invCov[1][1] * dy;

    gradX += gamma * invDx;
    gradY += gamma * invDy;
  }

  return [gradX, gradY];
}

/**
 * Banana / Rosenbrock Potential Energy:
 * U(x, y) = (a - x)^2 / (2 sx^2) + (y - b x^2)^2 / (2 sy^2)
 */
export function computeEnergyRosenbrock(
  point: Vector2,
  config: RosenbrockConfig = DEFAULT_ROSENBROCK_CONFIG,
): number {
  const x = point[0];
  const y = point[1];
  const term1 = Math.pow(config.a - x, 2) / (2 * config.sx * config.sx);
  const term2 = Math.pow(y - config.b * x * x, 2) / (2 * config.sy * config.sy);
  return term1 + term2;
}

/**
 * Analytical Gradient of Rosenbrock Potential:
 * dU/dx = (x - a)/sx^2 - 2 b x (y - b x^2) / sy^2
 * dU/dy = (y - b x^2) / sy^2
 */
export function computeGradientRosenbrock(
  point: Vector2,
  config: RosenbrockConfig = DEFAULT_ROSENBROCK_CONFIG,
): Vector2 {
  const x = point[0];
  const y = point[1];
  const sx2 = config.sx * config.sx;
  const sy2 = config.sy * config.sy;
  const quadResidual = y - config.b * x * x;

  const gradX = (x - config.a) / sx2 - (2 * config.b * x * quadResidual) / sy2;
  const gradY = quadResidual / sy2;
  return [gradX, gradY];
}

/**
 * Concentric Doughnut / Ring Potential Energy:
 * U(x, y) = (sqrt(x^2 + y^2) - r0)^2 / (2 sigma^2)
 */
export function computeEnergyDoughnut(
  point: Vector2,
  config: DoughnutConfig = DEFAULT_DOUGHNUT_CONFIG,
): number {
  const r = Math.sqrt(point[0] * point[0] + point[1] * point[1]);
  return Math.pow(r - config.r0, 2) / (2 * config.sigma * config.sigma);
}

/**
 * Analytical Gradient of Doughnut Potential:
 * grad U = ((r - r0) / sigma^2) * [x/r, y/r]
 */
export function computeGradientDoughnut(
  point: Vector2,
  config: DoughnutConfig = DEFAULT_DOUGHNUT_CONFIG,
): Vector2 {
  const x = point[0];
  const y = point[1];
  const r = Math.sqrt(x * x + y * y);
  if (r < 1e-12) {
    return [0, 0];
  }
  const factor = (r - config.r0) / (config.sigma * config.sigma * r);
  return [factor * x, factor * y];
}

/**
 * Bivariate Correlated Gaussian Potential Energy:
 * U(x) = 0.5 * (x - mu)^T Sigma^{-1} (x - mu) + 0.5 * log(det Sigma) + log(2pi)
 */
export function computeEnergyBivariateGaussian(
  point: Vector2,
  config: BivariateGaussianConfig = DEFAULT_BIVARIATE_GAUSSIAN_CONFIG,
): number {
  const dx = point[0] - config.mean[0];
  const dy = point[1] - config.mean[1];
  const s1 = config.sigma1;
  const s2 = config.sigma2;
  const rho = Math.max(-0.999, Math.min(0.999, config.rho));
  const oneMinusRho2 = 1 - rho * rho;

  const quad = (dx * dx) / (s1 * s1) - (2 * rho * dx * dy) / (s1 * s2) + (dy * dy) / (s2 * s2);

  const energy =
    quad / (2 * oneMinusRho2) + Math.log(2 * Math.PI * s1 * s2 * Math.sqrt(oneMinusRho2));
  return energy;
}

/**
 * Analytical Gradient of Bivariate Correlated Gaussian:
 * grad U = Sigma^{-1} (x - mu)
 */
export function computeGradientBivariateGaussian(
  point: Vector2,
  config: BivariateGaussianConfig = DEFAULT_BIVARIATE_GAUSSIAN_CONFIG,
): Vector2 {
  const dx = point[0] - config.mean[0];
  const dy = point[1] - config.mean[1];
  const s1 = config.sigma1;
  const s2 = config.sigma2;
  const rho = Math.max(-0.999, Math.min(0.999, config.rho));
  const oneMinusRho2 = 1 - rho * rho;

  const gradX = (dx / (s1 * s1) - (rho * dy) / (s1 * s2)) / oneMinusRho2;
  const gradY = (dy / (s2 * s2) - (rho * dx) / (s1 * s2)) / oneMinusRho2;

  return [gradX, gradY];
}

// ============================================================================
// 5. MCMC SAMPLING ENGINES
// ============================================================================

/**
 * Metropolis-Hastings 2D Random Walk Step
 */
export function stepMetropolisHastings(
  currentPoint: Vector2,
  energyFn: (pt: Vector2) => number,
  proposalStd: number = 0.5,
  rng: () => number = Math.random,
): MHStepResult {
  const proposal: Vector2 = [
    currentPoint[0] + proposalStd * sampleStandardNormal(rng),
    currentPoint[1] + proposalStd * sampleStandardNormal(rng),
  ];

  const energyCurrent = energyFn(currentPoint);
  const energyProposal = energyFn(proposal);
  const deltaU = energyProposal - energyCurrent;
  const alpha = Math.min(1.0, Math.exp(-deltaU));

  const u = rng();
  const accepted = u < alpha;
  const nextPoint = accepted ? proposal : currentPoint;

  return {
    accepted,
    proposal,
    nextPoint,
    alpha,
    energyCurrent,
    energyProposal,
  };
}

/**
 * Exact Coordinate-wise Gibbs Sampling on Bivariate Gaussian
 */
export function stepGibbsGaussian(
  currentPoint: Vector2,
  config: BivariateGaussianConfig = DEFAULT_BIVARIATE_GAUSSIAN_CONFIG,
  rng: () => number = Math.random,
): GibbsStepResult {
  const mu1 = config.mean[0];
  const mu2 = config.mean[1];
  const s1 = config.sigma1;
  const s2 = config.sigma2;
  const rho = Math.max(-0.999, Math.min(0.999, config.rho));
  const condVar1 = s1 * s1 * (1 - rho * rho);
  const condStd1 = Math.sqrt(Math.max(1e-12, condVar1));
  const condVar2 = s2 * s2 * (1 - rho * rho);
  const condStd2 = Math.sqrt(Math.max(1e-12, condVar2));

  // Step 1: Sample x1 | x2
  const condMean1 = mu1 + rho * (s1 / s2) * (currentPoint[1] - mu2);
  const nextX1 = condMean1 + condStd1 * sampleStandardNormal(rng);
  const intermediatePoint: Vector2 = [nextX1, currentPoint[1]];

  // Step 2: Sample x2 | x1
  const condMean2 = mu2 + rho * (s2 / s1) * (nextX1 - mu1);
  const nextX2 = condMean2 + condStd2 * sampleStandardNormal(rng);
  const nextPoint: Vector2 = [nextX1, nextX2];

  return {
    intermediatePoint,
    nextPoint,
    accepted: true,
    alpha: 1.0,
  };
}

/**
 * Approximate Gibbs Sampling on GMM via component conditional mixtures
 */
export function stepGibbsGMM(
  currentPoint: Vector2,
  config: GMMConfig = DEFAULT_GMM_CONFIG,
  rng: () => number = Math.random,
): GibbsStepResult {
  // Coordinate-wise slice / 1D mixture conditional for GMM
  const sample1DConditional = (fixedCoord: number, isFixingY: boolean): number => {
    const weights: number[] = [];
    const means: number[] = [];
    const stds: number[] = [];

    for (const comp of config.components) {
      const muFixed = isFixingY ? comp.mean[1] : comp.mean[0];
      const muFree = isFixingY ? comp.mean[0] : comp.mean[1];
      const sFixed = isFixingY ? Math.sqrt(comp.cov[1][1]) : Math.sqrt(comp.cov[0][0]);
      const sFree = isFixingY ? Math.sqrt(comp.cov[0][0]) : Math.sqrt(comp.cov[1][1]);
      const covCross = comp.cov[0][1];
      const rho = covCross / (sFixed * sFree + 1e-12);

      const condMean = muFree + rho * (sFree / sFixed) * (fixedCoord - muFixed);
      const condStd = Math.sqrt(Math.max(1e-12, sFree * sFree * (1 - rho * rho)));

      // Marginal likelihood of fixed coordinate under this component
      const diffFixed = fixedCoord - muFixed;
      const marginalPdf =
        (1.0 / (Math.sqrt(2 * Math.PI) * sFixed)) *
        Math.exp(-0.5 * Math.pow(diffFixed / sFixed, 2));

      weights.push(comp.weight * marginalPdf);
      means.push(condMean);
      stds.push(condStd);
    }

    // Normalize weights
    const totalW = weights.reduce((a, b) => a + b, 0);
    const uComp = rng() * Math.max(totalW, 1e-15);
    let cumW = 0;
    let chosen = 0;
    for (let i = 0; i < weights.length; i++) {
      cumW += weights[i];
      if (uComp <= cumW) {
        chosen = i;
        break;
      }
    }

    return means[chosen] + stds[chosen] * sampleStandardNormal(rng);
  };

  const nextX = sample1DConditional(currentPoint[1], true);
  const intermediate: Vector2 = [nextX, currentPoint[1]];
  const nextY = sample1DConditional(nextX, false);
  const nextPoint: Vector2 = [nextX, nextY];

  return {
    intermediatePoint: intermediate,
    nextPoint,
    accepted: true,
    alpha: 1.0,
  };
}

/**
 * Symplectic Leapfrog Integrator for Hamiltonian Monte Carlo
 */
export function runLeapfrogIntegrator(
  q0: Vector2,
  p0: Vector2,
  gradientFn: (q: Vector2) => Vector2,
  epsilon: number,
  steps: number,
): {
  readonly qTraj: readonly Vector2[];
  readonly pTraj: readonly Vector2[];
  readonly finalQ: Vector2;
  readonly finalP: Vector2;
} {
  let qx = q0[0];
  let qy = q0[1];
  let px = p0[0];
  let py = p0[1];

  const qTraj: Vector2[] = [[qx, qy]];
  const pTraj: Vector2[] = [[px, py]];

  // Initial half-step for momentum
  let grad = gradientFn([qx, qy]);
  px -= 0.5 * epsilon * grad[0];
  py -= 0.5 * epsilon * grad[1];

  for (let i = 0; i < steps; i++) {
    // Full step for position
    qx += epsilon * px;
    qy += epsilon * py;
    qTraj.push([qx, qy]);

    // Compute new gradient
    grad = gradientFn([qx, qy]);

    // Momentum update: full step unless at final iteration
    if (i < steps - 1) {
      px -= epsilon * grad[0];
      py -= epsilon * grad[1];
      pTraj.push([px, py]);
    } else {
      // Final half-step for momentum
      px -= 0.5 * epsilon * grad[0];
      py -= 0.5 * epsilon * grad[1];
      pTraj.push([px, py]);
    }
  }

  // Momentum negation for time-reversibility
  const finalP: Vector2 = [-px, -py];
  const finalQ: Vector2 = [qx, qy];

  return {
    qTraj,
    pTraj,
    finalQ,
    finalP,
  };
}

/**
 * Hamiltonian Monte Carlo Step with Symplectic Leapfrog & Metropolis Filter
 */
export function stepHamiltonianMonteCarlo(
  currentPoint: Vector2,
  energyFn: (q: Vector2) => number,
  gradientFn: (q: Vector2) => Vector2,
  epsilon: number = 0.1,
  steps: number = 15,
  rng: () => number = Math.random,
): HMCStepResult {
  // 1. Draw momentum p ~ N(0, I)
  const p0: Vector2 = [sampleStandardNormal(rng), sampleStandardNormal(rng)];

  // Kinetic energy: K(p) = 0.5 * ||p||^2
  const kinetic0 = 0.5 * (p0[0] * p0[0] + p0[1] * p0[1]);
  const potential0 = energyFn(currentPoint);
  const h0 = potential0 + kinetic0;

  // 2. Symplectic Leapfrog Integration
  const { qTraj, finalQ, finalP } = runLeapfrogIntegrator(
    currentPoint,
    p0,
    gradientFn,
    epsilon,
    steps,
  );

  // 3. Evaluate proposed Hamiltonian
  const kinetic1 = 0.5 * (finalP[0] * finalP[0] + finalP[1] * finalP[1]);
  const potential1 = energyFn(finalQ);
  const h1 = potential1 + kinetic1;

  const deltaH = h1 - h0;
  const alpha = Math.min(1.0, Math.exp(-deltaH));

  // 4. Metropolis Filter
  const u = rng();
  const accepted = Number.isFinite(alpha) && u < alpha;
  const nextPoint = accepted ? finalQ : currentPoint;

  return {
    accepted,
    proposal: finalQ,
    nextPoint,
    trajectory: qTraj,
    initialMomentum: p0,
    finalMomentum: finalP,
    initialHamiltonian: h0,
    finalHamiltonian: h1,
    deltaH,
    alpha: Number.isFinite(alpha) ? alpha : 0,
  };
}

// ============================================================================
// 6. DISCRETE VOCABULARY, TOP-K / TOP-P NUCLEUS SAMPLER
// ============================================================================

export function computeSoftmaxWithTemperature(
  logits: readonly number[],
  temperature: number = 1.0,
): number[] {
  const T = Math.max(0.01, temperature);
  let maxLogit = -Infinity;
  for (const z of logits) {
    if (z > maxLogit) maxLogit = z;
  }

  const expValues = logits.map((z) => Math.exp((z - maxLogit) / T));
  const sumExp = expValues.reduce((a, b) => a + b, 0);

  return expValues.map((v) => (sumExp > 0 ? v / sumExp : 1 / logits.length));
}

export function filterTopK(
  probs: readonly number[],
  topK: number,
): { filtered: number[]; keptIndices: number[] } {
  const k = Math.max(1, Math.min(topK, probs.length));
  const indexed = probs.map((p, idx) => ({ p, idx }));
  indexed.sort((a, b) => b.p - a.p);

  const keptIndices = indexed.slice(0, k).map((item) => item.idx);
  const filtered = new Array(probs.length).fill(0);
  for (const idx of keptIndices) {
    filtered[idx] = probs[idx];
  }

  // Renormalize
  const sum = filtered.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (let i = 0; i < filtered.length; i++) {
      filtered[i] /= sum;
    }
  }

  return { filtered, keptIndices };
}

export function filterTopP(
  probs: readonly number[],
  topP: number,
): { filtered: number[]; keptIndices: number[] } {
  const pThreshold = Math.max(0.01, Math.min(1.0, topP));
  const indexed = probs.map((p, idx) => ({ p, idx }));
  indexed.sort((a, b) => b.p - a.p);

  let cumSum = 0;
  const keptIndices: number[] = [];

  for (const item of indexed) {
    keptIndices.push(item.idx);
    cumSum += item.p;
    if (cumSum >= pThreshold) {
      break;
    }
  }

  const filtered = new Array(probs.length).fill(0);
  for (const idx of keptIndices) {
    filtered[idx] = probs[idx];
  }

  // Renormalize
  const sum = filtered.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (let i = 0; i < filtered.length; i++) {
      filtered[i] /= sum;
    }
  }

  return { filtered, keptIndices };
}

export function filterTopKTopP(
  probs: readonly number[],
  topK: number,
  topP: number,
): { filtered: number[]; keptIndices: number[] } {
  const { filtered: kFiltered } = filterTopK(probs, topK);
  return filterTopP(kFiltered, topP);
}

export function sampleCategorical(
  probs: readonly number[],
  rng: () => number = Math.random,
): number {
  const u = rng();
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i];
    if (u <= cum) {
      return i;
    }
  }
  return probs.length - 1;
}

export function stepDiscreteSampling(
  tokens: readonly DiscreteTokenItem[],
  temperature: number = 1.0,
  topK: number = 5,
  topP: number = 0.9,
  rng: () => number = Math.random,
): DiscreteStepResult {
  const logits = tokens.map((t) => t.logit);
  const rawProbs = computeSoftmaxWithTemperature(logits, 1.0);
  const scaledProbs = computeSoftmaxWithTemperature(logits, temperature);
  const { filtered: filteredProbs, keptIndices } = filterTopKTopP(scaledProbs, topK, topP);

  // Cumulative distribution for visualization
  const cumulativeProbs: number[] = [];
  let cum = 0;
  for (const p of filteredProbs) {
    cum += p;
    cumulativeProbs.push(cum);
  }

  const sampledIndex = sampleCategorical(filteredProbs, rng);
  const sampledToken = tokens[sampledIndex]?.token ?? "token";

  return {
    rawProbs,
    scaledProbs,
    filteredProbs,
    cumulativeProbs,
    keptIndices,
    sampledIndex,
    sampledToken,
  };
}

// ============================================================================
// 7. DIAGNOSTICS & STATISTICAL METRICS (ACF, ESS, COVARIANCE)
// ============================================================================

export function computeAutocorrelation(samples: readonly number[], maxLag: number = 30): number[] {
  const N = samples.length;
  if (N < 2) return [1.0];

  let sum = 0;
  for (let i = 0; i < N; i++) sum += samples[i];
  const mean = sum / N;

  let varSum = 0;
  for (let i = 0; i < N; i++) {
    const d = samples[i] - mean;
    varSum += d * d;
  }
  const variance = varSum / N;

  if (variance < 1e-14) {
    return new Array(Math.min(maxLag + 1, N)).fill(1.0);
  }

  const acf: number[] = [];
  const actualMaxLag = Math.min(maxLag, N - 1);

  for (let k = 0; k <= actualMaxLag; k++) {
    let covSum = 0;
    for (let t = 0; t < N - k; t++) {
      covSum += (samples[t] - mean) * (samples[t + k] - mean);
    }
    const gammaK = covSum / (N - k);
    acf.push(Math.max(-1.0, Math.min(1.0, gammaK / variance)));
  }

  return acf;
}

export function computeEffectiveSampleSize(
  samples: readonly number[],
  maxLag: number = 50,
): number {
  const N = samples.length;
  if (N < 4) return Math.max(1, N);

  const acf = computeAutocorrelation(samples, maxLag);
  let sumRho = 0;

  // Geyer's initial positive sequence estimator
  for (let k = 1; k < acf.length; k++) {
    if (acf[k] <= 0.05) break;
    sumRho += acf[k];
  }

  const denom = 1 + 2 * sumRho;
  const ess = N / Math.max(1, denom);
  return Math.min(N, Math.max(1, Math.round(ess * 100) / 100));
}

export function computeSampleMeanAndCovariance(samples: readonly Vector2[]): {
  readonly mean: Vector2;
  readonly cov: Matrix2x2;
  readonly varianceX: number;
  readonly varianceY: number;
  readonly covarianceXY: number;
  readonly correlation: number;
} {
  const N = samples.length;
  if (N === 0) {
    return {
      mean: [0, 0],
      cov: [
        [0, 0],
        [0, 0],
      ],
      varianceX: 0,
      varianceY: 0,
      covarianceXY: 0,
      correlation: 0,
    };
  }

  let sumX = 0;
  let sumY = 0;
  for (const pt of samples) {
    sumX += pt[0];
    sumY += pt[1];
  }
  const meanX = sumX / N;
  const meanY = sumY / N;

  if (N === 1) {
    return {
      mean: [meanX, meanY],
      cov: [
        [0, 0],
        [0, 0],
      ],
      varianceX: 0,
      varianceY: 0,
      covarianceXY: 0,
      correlation: 0,
    };
  }

  let varX = 0;
  let varY = 0;
  let covXY = 0;

  for (const pt of samples) {
    const dx = pt[0] - meanX;
    const dy = pt[1] - meanY;
    varX += dx * dx;
    varY += dy * dy;
    covXY += dx * dy;
  }

  const denom = N - 1;
  const sxx = varX / denom;
  const syy = varY / denom;
  const sxy = covXY / denom;
  const stdX = Math.sqrt(Math.max(0, sxx));
  const stdY = Math.sqrt(Math.max(0, syy));
  const corr = stdX > 1e-12 && stdY > 1e-12 ? Math.max(-1, Math.min(1, sxy / (stdX * stdY))) : 0;

  return {
    mean: [meanX, meanY],
    cov: [
      [sxx, sxy],
      [sxy, syy],
    ],
    varianceX: sxx,
    varianceY: syy,
    covarianceXY: sxy,
    correlation: corr,
  };
}

export function compute1DMarginalHistogram(
  samples: readonly number[],
  bins: number = 24,
  minVal: number = -4.5,
  maxVal: number = 4.5,
): {
  readonly binCenters: readonly number[];
  readonly counts: readonly number[];
  readonly density: readonly number[];
} {
  const range = maxVal - minVal;
  const binWidth = range / bins;
  const counts = new Array(bins).fill(0);
  const binCenters = new Array(bins).fill(0).map((_, i) => minVal + (i + 0.5) * binWidth);

  for (const val of samples) {
    if (val >= minVal && val <= maxVal) {
      const b = Math.min(bins - 1, Math.floor((val - minVal) / binWidth));
      counts[b]++;
    }
  }

  const N = Math.max(1, samples.length);
  const density = counts.map((c) => c / (N * binWidth));

  return { binCenters, counts, density };
}

// ============================================================================
// 8. REACT COMPONENT: ProbabilisticSamplingStudio
// ============================================================================

export const ProbabilisticSamplingStudio: React.FC<ProbabilisticSamplingStudioProps> = ({
  initialDistribution = "multimodal_gmm",
  initialAlgorithm = "metropolis_hastings",
  initialPreset = "gmm_multimodal_trapping",
  width = 860,
  height = 540,
  standalone = true,
  title = "Probabilistic Sampling & MCMC Hamiltonian Studio",
  onSampleAccepted,
  onDiagnosticsUpdate,
}) => {
  // State: Core Configuration
  const [targetDistribution, setTargetDistribution] =
    useState<TargetDistributionId>(initialDistribution);
  const [algorithm, setAlgorithm] = useState<SamplingAlgorithmId>(initialAlgorithm);
  const [currentPreset, setCurrentPreset] = useState<SamplingPresetId>(initialPreset);

  // State: Distribution Parameters
  const [gmmConfig] = useState<GMMConfig>(DEFAULT_GMM_CONFIG);
  const [rosenbrockConfig] = useState<RosenbrockConfig>(DEFAULT_ROSENBROCK_CONFIG);
  const [doughnutConfig] = useState<DoughnutConfig>(DEFAULT_DOUGHNUT_CONFIG);
  const [bivariateConfig, setBivariateConfig] = useState<BivariateGaussianConfig>(
    DEFAULT_BIVARIATE_GAUSSIAN_CONFIG,
  );
  const [discreteTokens] = useState<readonly DiscreteTokenItem[]>(DEFAULT_DISCRETE_TOKENS);

  // State: Sampler Hyperparameters
  const [proposalStd, setProposalStd] = useState<number>(0.45);
  const [hmcEpsilon, setHmcEpsilon] = useState<number>(0.1);
  const [hmcL, setHmcL] = useState<number>(18);
  const [temperature, setTemperature] = useState<number>(0.85);
  const [topK, setTopK] = useState<number>(5);
  const [topP, setTopP] = useState<number>(0.9);
  const [burnIn, setBurnIn] = useState<number>(50);

  // State: Chain Progression & History
  const [currentPoint, setCurrentPoint] = useState<Vector2>([-2.0, -1.8]);
  const [history, setHistory] = useState<SampleHistoryItem[]>([]);
  const [activeTrajectory, setActiveTrajectory] = useState<readonly Vector2[] | null>(null);
  const [generatedTokensStream, setGeneratedTokensStream] = useState<string[]>([]);
  const [recentDiscreteStep, setRecentDiscreteStep] = useState<DiscreteStepResult | null>(null);

  // State: Interactive Animation & Canvas
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animationSpeedMs, setAnimationSpeedMs] = useState<number>(60);
  const [hoverCoord, setHoverCoord] = useState<Vector2 | null>(null);
  const [activeTab, setActiveTab] = useState<"visualizer" | "diagnostics" | "theory">("visualizer");

  // Canvas References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Unified Energy and Gradient Dispatchers
  const evaluateEnergy = useCallback(
    (pt: Vector2): number => {
      switch (targetDistribution) {
        case "multimodal_gmm":
          return computeEnergyGMM(pt, gmmConfig);
        case "rosenbrock_banana":
          return computeEnergyRosenbrock(pt, rosenbrockConfig);
        case "concentric_doughnut":
          return computeEnergyDoughnut(pt, doughnutConfig);
        case "bivariate_correlated_gaussian":
          return computeEnergyBivariateGaussian(pt, bivariateConfig);
        case "discrete_vocab_logits":
        default:
          return 0;
      }
    },
    [targetDistribution, gmmConfig, rosenbrockConfig, doughnutConfig, bivariateConfig],
  );

  const evaluateGradient = useCallback(
    (pt: Vector2): Vector2 => {
      switch (targetDistribution) {
        case "multimodal_gmm":
          return computeGradientGMM(pt, gmmConfig);
        case "rosenbrock_banana":
          return computeGradientRosenbrock(pt, rosenbrockConfig);
        case "concentric_doughnut":
          return computeGradientDoughnut(pt, doughnutConfig);
        case "bivariate_correlated_gaussian":
          return computeGradientBivariateGaussian(pt, bivariateConfig);
        case "discrete_vocab_logits":
        default:
          return [0, 0];
      }
    },
    [targetDistribution, gmmConfig, rosenbrockConfig, doughnutConfig, bivariateConfig],
  );

  // Apply Preset Handler
  const applyPreset = useCallback((presetId: SamplingPresetId) => {
    const p = SAMPLING_PRESETS[presetId];
    if (!p) return;
    setCurrentPreset(presetId);
    setTargetDistribution(p.targetDistribution);
    setAlgorithm(p.recommendedAlgorithm);
    setCurrentPoint(p.defaultStartPoint);
    setHistory([]);
    setActiveTrajectory(null);

    if (p.defaultProposalStd !== undefined) setProposalStd(p.defaultProposalStd);
    if (p.defaultHmcEpsilon !== undefined) setHmcEpsilon(p.defaultHmcEpsilon);
    if (p.defaultHmcL !== undefined) setHmcL(p.defaultHmcL);
    if (p.defaultTemperature !== undefined) setTemperature(p.defaultTemperature);
    if (p.defaultTopK !== undefined) setTopK(p.defaultTopK);
    if (p.defaultTopP !== undefined) setTopP(p.defaultTopP);

    if (p.targetDistribution === "discrete_vocab_logits") {
      const stepRes = stepDiscreteSampling(
        DEFAULT_DISCRETE_TOKENS,
        p.defaultTemperature ?? 0.85,
        p.defaultTopK ?? 5,
        p.defaultTopP ?? 0.9,
      );
      setRecentDiscreteStep(stepRes);
      setGeneratedTokensStream([stepRes.sampledToken]);
    }
  }, []);

  // Perform a single sampling step
  const executeStep = useCallback(() => {
    if (targetDistribution === "discrete_vocab_logits") {
      const res = stepDiscreteSampling(discreteTokens, temperature, topK, topP);
      setRecentDiscreteStep(res);
      setGeneratedTokensStream((prev) => [...prev.slice(-24), res.sampledToken]);
      onSampleAccepted?.(res.sampledToken);
      return;
    }

    let nextPt: Vector2 = currentPoint;
    let accepted = true;
    let alpha = 1.0;
    let trajectory: readonly Vector2[] | undefined = undefined;

    if (algorithm === "metropolis_hastings") {
      const mhRes = stepMetropolisHastings(currentPoint, evaluateEnergy, proposalStd);
      nextPt = mhRes.nextPoint;
      accepted = mhRes.accepted;
      alpha = mhRes.alpha;
    } else if (algorithm === "hamiltonian_monte_carlo") {
      const hmcRes = stepHamiltonianMonteCarlo(
        currentPoint,
        evaluateEnergy,
        evaluateGradient,
        hmcEpsilon,
        hmcL,
      );
      nextPt = hmcRes.nextPoint;
      accepted = hmcRes.accepted;
      alpha = hmcRes.alpha;
      trajectory = hmcRes.trajectory;
      setActiveTrajectory(hmcRes.trajectory);
    } else if (algorithm === "gibbs") {
      if (targetDistribution === "bivariate_correlated_gaussian") {
        const gibbsRes = stepGibbsGaussian(currentPoint, bivariateConfig);
        nextPt = gibbsRes.nextPoint;
      } else {
        const gibbsRes = stepGibbsGMM(currentPoint, gmmConfig);
        nextPt = gibbsRes.nextPoint;
      }
      accepted = true;
      alpha = 1.0;
    }

    const energy = evaluateEnergy(nextPt);
    const newSample: SampleHistoryItem = {
      id: history.length + 1,
      point: nextPt,
      accepted,
      algorithm,
      trajectory,
      alpha,
      energy,
    };

    setCurrentPoint(nextPt);
    setHistory((prev) => [...prev, newSample]);

    if (accepted) {
      onSampleAccepted?.(nextPt);
    }
  }, [
    targetDistribution,
    algorithm,
    currentPoint,
    evaluateEnergy,
    evaluateGradient,
    proposalStd,
    hmcEpsilon,
    hmcL,
    discreteTokens,
    temperature,
    topK,
    topP,
    bivariateConfig,
    gmmConfig,
    history.length,
    onSampleAccepted,
  ]);

  // Batch sample generator
  const executeBatch = useCallback(
    (count: number) => {
      if (targetDistribution === "discrete_vocab_logits") {
        const newTokens: string[] = [];
        let lastStep: DiscreteStepResult | null = null;
        for (let i = 0; i < count; i++) {
          lastStep = stepDiscreteSampling(discreteTokens, temperature, topK, topP);
          newTokens.push(lastStep.sampledToken);
        }
        if (lastStep) setRecentDiscreteStep(lastStep);
        setGeneratedTokensStream((prev) => [...prev.slice(-30), ...newTokens].slice(-40));
        return;
      }

      const newHistoryItems: SampleHistoryItem[] = [];
      let pt = currentPoint;
      let lastTraj: readonly Vector2[] | undefined = undefined;

      for (let i = 0; i < count; i++) {
        let nextPt = pt;
        let accepted = true;
        let alpha = 1.0;
        let trajectory: readonly Vector2[] | undefined = undefined;

        if (algorithm === "metropolis_hastings") {
          const mhRes = stepMetropolisHastings(pt, evaluateEnergy, proposalStd);
          nextPt = mhRes.nextPoint;
          accepted = mhRes.accepted;
          alpha = mhRes.alpha;
        } else if (algorithm === "hamiltonian_monte_carlo") {
          const hmcRes = stepHamiltonianMonteCarlo(
            pt,
            evaluateEnergy,
            evaluateGradient,
            hmcEpsilon,
            hmcL,
          );
          nextPt = hmcRes.nextPoint;
          accepted = hmcRes.accepted;
          alpha = hmcRes.alpha;
          trajectory = hmcRes.trajectory;
          lastTraj = trajectory;
        } else if (algorithm === "gibbs") {
          if (targetDistribution === "bivariate_correlated_gaussian") {
            const gRes = stepGibbsGaussian(pt, bivariateConfig);
            nextPt = gRes.nextPoint;
          } else {
            const gRes = stepGibbsGMM(pt, gmmConfig);
            nextPt = gRes.nextPoint;
          }
        }

        const energy = evaluateEnergy(nextPt);
        newHistoryItems.push({
          id: history.length + i + 1,
          point: nextPt,
          accepted,
          algorithm,
          trajectory,
          alpha,
          energy,
        });

        pt = nextPt;
      }

      setCurrentPoint(pt);
      if (lastTraj) setActiveTrajectory(lastTraj);
      setHistory((prev) => [...prev, ...newHistoryItems]);
    },
    [
      targetDistribution,
      discreteTokens,
      temperature,
      topK,
      topP,
      currentPoint,
      history.length,
      algorithm,
      evaluateEnergy,
      evaluateGradient,
      proposalStd,
      hmcEpsilon,
      hmcL,
      bivariateConfig,
      gmmConfig,
    ],
  );

  // Animation Loop Effect
  useEffect(() => {
    if (!isPlaying) {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
      return;
    }

    animationTimerRef.current = setInterval(
      () => {
        executeStep();
      },
      Math.max(16, animationSpeedMs),
    );

    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, [isPlaying, animationSpeedMs, executeStep]);

  // Compute Diagnostics
  const diagnostics: ChainDiagnostics = useMemo(() => {
    const totalProposals = history.length;
    if (totalProposals === 0) {
      return {
        totalProposals: 0,
        acceptedCount: 0,
        acceptanceRate: 0,
        recentAcceptanceRate: 0,
        effectiveSampleSizeX: 0,
        effectiveSampleSizeY: 0,
        essEfficiency: 0,
        sampleMean: [0, 0],
        sampleVariance: [0, 0],
        sampleCovariance: 0,
        sampleCorrelation: 0,
        acfX: [1],
        acfY: [1],
      };
    }

    const acceptedCount = history.filter((h) => h.accepted).length;
    const acceptanceRate = acceptedCount / totalProposals;

    const recentSlice = history.slice(-50);
    const recentAccepted = recentSlice.filter((h) => h.accepted).length;
    const recentAcceptanceRate = recentSlice.length > 0 ? recentAccepted / recentSlice.length : 0;

    // Post burn-in samples
    const postBurnin = history
      .slice(Math.min(burnIn, Math.max(0, history.length - 1)))
      .map((h) => h.point);

    const xSamples = postBurnin.map((p) => p[0]);
    const ySamples = postBurnin.map((p) => p[1]);

    const essX = computeEffectiveSampleSize(xSamples, 30);
    const essY = computeEffectiveSampleSize(ySamples, 30);
    const avgEss = (essX + essY) / 2;
    const essEfficiency = postBurnin.length > 0 ? avgEss / postBurnin.length : 0;

    const acfX = computeAutocorrelation(xSamples, 20);
    const acfY = computeAutocorrelation(ySamples, 20);

    const { mean, varianceX, varianceY, covarianceXY, correlation } =
      computeSampleMeanAndCovariance(postBurnin);

    const diagResult: ChainDiagnostics = {
      totalProposals,
      acceptedCount,
      acceptanceRate,
      recentAcceptanceRate,
      effectiveSampleSizeX: essX,
      effectiveSampleSizeY: essY,
      essEfficiency,
      sampleMean: mean,
      sampleVariance: [varianceX, varianceY],
      sampleCovariance: covarianceXY,
      sampleCorrelation: correlation,
      acfX,
      acfY,
    };

    onDiagnosticsUpdate?.(diagResult);
    return diagResult;
  }, [history, burnIn, onDiagnosticsUpdate]);

  const DOMAIN_MIN_X = -4.5;
  const DOMAIN_MAX_X = 4.5;
  const DOMAIN_MIN_Y = -4.5;
  const DOMAIN_MAX_Y = 4.5;

  const toCanvasX = (x: number, cWidth: number) => {
    return ((x - DOMAIN_MIN_X) / (DOMAIN_MAX_X - DOMAIN_MIN_X)) * cWidth;
  };

  const toCanvasY = (y: number, cHeight: number) => {
    return cHeight - ((y - DOMAIN_MIN_Y) / (DOMAIN_MAX_Y - DOMAIN_MIN_Y)) * cHeight;
  };

  const toDomainX = (cx: number, cWidth: number) => {
    return DOMAIN_MIN_X + (cx / cWidth) * (DOMAIN_MAX_X - DOMAIN_MIN_X);
  };

  const toDomainY = (cy: number, cHeight: number) => {
    return DOMAIN_MAX_Y - (cy / cHeight) * (DOMAIN_MAX_Y - DOMAIN_MIN_Y);
  };

  // Render 2D Canvas Density Heatmap, Contours, Trajectories & Particles
  useEffect(() => {
    if (targetDistribution === "discrete_vocab_logits") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cWidth = rect.width || width;
    const cHeight = rect.height || height;

    canvas.width = cWidth * dpr;
    canvas.height = cHeight * dpr;
    ctx.scale(dpr, dpr);

    // 1. Clear background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, cWidth, cHeight);

    // 2. Render Density Heatmap
    const gridCols = 80;
    const gridRows = 60;
    const cellW = cWidth / gridCols;
    const cellH = cHeight / gridRows;

    let maxDensity = 0;
    const densityGrid: number[][] = [];

    for (let r = 0; r < gridRows; r++) {
      densityGrid[r] = [];
      const wy = DOMAIN_MAX_Y - (r / gridRows) * (DOMAIN_MAX_Y - DOMAIN_MIN_Y);
      for (let c = 0; c < gridCols; c++) {
        const wx = DOMAIN_MIN_X + (c / gridCols) * (DOMAIN_MAX_X - DOMAIN_MIN_X);
        const energy = evaluateEnergy([wx, wy]);
        const density = Math.exp(-Math.min(25, energy));
        densityGrid[r][c] = density;
        if (density > maxDensity) maxDensity = density;
      }
    }

    if (maxDensity > 0) {
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const norm = Math.pow(densityGrid[r][c] / maxDensity, 0.45);
          if (norm > 0.01) {
            const red = Math.floor(norm * 240);
            const green = Math.floor(norm * 180);
            const blue = Math.floor(180 + norm * 75);
            const alpha = Math.min(0.7, norm * 0.75);

            ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
            ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1);
          }
        }
      }
    }

    // 3. Grid Axes & Coordinates
    ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
    ctx.lineWidth = 1;
    const cx0 = toCanvasX(0, cWidth);
    const cy0 = toCanvasY(0, cHeight);

    ctx.beginPath();
    ctx.moveTo(0, cy0);
    ctx.lineTo(cWidth, cy0);
    ctx.moveTo(cx0, 0);
    ctx.lineTo(cx0, cHeight);
    ctx.stroke();

    // 4. Marginal 1D Histograms
    const postBurnin = history
      .slice(Math.min(burnIn, Math.max(0, history.length - 1)))
      .map((h) => h.point);

    if (postBurnin.length > 5) {
      const xHist = compute1DMarginalHistogram(
        postBurnin.map((p) => p[0]),
        24,
        DOMAIN_MIN_X,
        DOMAIN_MAX_X,
      );
      const yHist = compute1DMarginalHistogram(
        postBurnin.map((p) => p[1]),
        20,
        DOMAIN_MIN_Y,
        DOMAIN_MAX_Y,
      );

      // Top X Marginal
      const maxDensityX = Math.max(0.001, ...xHist.density);
      const barTopH = 38;
      const barW = cWidth / xHist.density.length;

      ctx.fillStyle = "rgba(56, 189, 248, 0.28)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
      for (let i = 0; i < xHist.density.length; i++) {
        const hNorm = (xHist.density[i] / maxDensityX) * barTopH;
        ctx.fillRect(i * barW, barTopH - hNorm, barW - 1, hNorm);
      }

      // Right Y Marginal
      const maxDensityY = Math.max(0.001, ...yHist.density);
      const barRightW = 38;
      const barH = cHeight / yHist.density.length;

      ctx.fillStyle = "rgba(168, 85, 247, 0.28)";
      ctx.strokeStyle = "rgba(168, 85, 247, 0.8)";
      for (let i = 0; i < yHist.density.length; i++) {
        const wNorm = (yHist.density[i] / maxDensityY) * barRightW;
        ctx.fillRect(cWidth - wNorm, cHeight - (i + 1) * barH, wNorm, barH - 1);
      }
    }

    // 5. Chain Path Line
    if (history.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(99, 102, 241, 0.35)";
      ctx.lineWidth = 1.2;

      const recentHistory = history.slice(-300);
      for (let i = 0; i < recentHistory.length; i++) {
        const pt = recentHistory[i].point;
        const sx = toCanvasX(pt[0], cWidth);
        const sy = toCanvasY(pt[1], cHeight);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // 6. Particle Scatter (Accepted & Rejected)
    const renderLimit = 500;
    const visibleSamples = history.slice(-renderLimit);

    for (const item of visibleSamples) {
      const sx = toCanvasX(item.point[0], cWidth);
      const sy = toCanvasY(item.point[1], cHeight);

      if (item.accepted) {
        ctx.fillStyle = "rgba(45, 212, 191, 0.65)";
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        // Rejected X marker
        ctx.strokeStyle = "rgba(244, 63, 94, 0.75)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sx - 2.5, sy - 2.5);
        ctx.lineTo(sx + 2.5, sy + 2.5);
        ctx.moveTo(sx + 2.5, sy - 2.5);
        ctx.lineTo(sx - 2.5, sy + 2.5);
        ctx.stroke();
      }
    }

    // 7. Active HMC Leapfrog Trajectory Flow
    if (activeTrajectory && activeTrajectory.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(251, 191, 36, 0.95)";
      ctx.lineWidth = 2.4;
      ctx.setLineDash([4, 2]);

      for (let i = 0; i < activeTrajectory.length; i++) {
        const pt = activeTrajectory[i];
        const sx = toCanvasX(pt[0], cWidth);
        const sy = toCanvasY(pt[1], cHeight);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Trajectory Leapfrog Step Nodes
      for (const pt of activeTrajectory) {
        const sx = toCanvasX(pt[0], cWidth);
        const sy = toCanvasY(pt[1], cHeight);
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(sx, sy, 2.8, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // 8. Current Chain Position Beacon
    const curSx = toCanvasX(currentPoint[0], cWidth);
    const curSy = toCanvasY(currentPoint[1], cHeight);

    // Glowing outer ring
    ctx.strokeStyle = "rgba(234, 179, 8, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(curSx, curSy, 10, 0, 2 * Math.PI);
    ctx.stroke();

    // Solid core
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(curSx, curSy, 4.5, 0, 2 * Math.PI);
    ctx.fill();

    // 9. Interactive Hover Crosshair Probe
    if (hoverCoord) {
      const hx = toCanvasX(hoverCoord[0], cWidth);
      const hy = toCanvasY(hoverCoord[1], cHeight);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, 2 * Math.PI);
      ctx.stroke();

      const hoverEnergy = evaluateEnergy(hoverCoord);
      const hoverGrad = evaluateGradient(hoverCoord);

      // Probe tooltip text
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.fillRect(hx + 10, hy - 40, 150, 48);
      ctx.strokeStyle = "rgba(99, 102, 241, 0.8)";
      ctx.strokeRect(hx + 10, hy - 40, 150, 48);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "10px monospace";
      ctx.fillText(
        `q: (${hoverCoord[0].toFixed(2)}, ${hoverCoord[1].toFixed(2)})`,
        hx + 16,
        hy - 26,
      );
      ctx.fillText(`U(q): ${hoverEnergy.toFixed(3)}`, hx + 16, hy - 14);
      ctx.fillText(
        `||grad||: ${Math.hypot(hoverGrad[0], hoverGrad[1]).toFixed(3)}`,
        hx + 16,
        hy - 2,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    targetDistribution,
    evaluateEnergy,
    evaluateGradient,
    currentPoint,
    history,
    activeTrajectory,
    hoverCoord,
    burnIn,
    width,
    height,
  ]);

  // Canvas Mouse Move & Click Handlers
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const wx = toDomainX(cx, rect.width);
    const wy = toDomainY(cy, rect.height);
    setHoverCoord([wx, wy]);
  };

  const handleCanvasMouseLeave = () => {
    setHoverCoord(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const wx = toDomainX(cx, rect.width);
    const wy = toDomainY(cy, rect.height);
    setCurrentPoint([wx, wy]);
    setActiveTrajectory(null);
  };

  // Reset Chain
  const resetChain = () => {
    setIsPlaying(false);
    setHistory([]);
    setActiveTrajectory(null);
    setGeneratedTokensStream([]);
    const preset = SAMPLING_PRESETS[currentPreset];
    if (preset) {
      setCurrentPoint(preset.defaultStartPoint);
    } else {
      setCurrentPoint([-2.0, -1.8]);
    }
  };

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans ${
        standalone ? "w-full max-w-6xl mx-auto p-4 md:p-6" : "w-full h-full p-3"
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-50 flex items-center gap-2">
              {title}
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                {algorithm.toUpperCase().replace(/_/g, " ")}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Energy Potentials, Symplectic Leapfrog Flows & Nucleus LLM Sampling
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Preset:
          </label>
          <select
            value={currentPreset}
            onChange={(e) => applyPreset(e.target.value as SamplingPresetId)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {Object.values(SAMPLING_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Top Execution & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-1 border-b border-slate-800/60 bg-slate-900/40 rounded-lg my-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
              isPlaying
                ? "bg-rose-600 hover:bg-rose-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Play Run"}
          </button>

          <button
            onClick={executeStep}
            disabled={isPlaying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Step (1)
          </button>

          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => executeBatch(10)}
              disabled={isPlaying}
              className="px-2 py-1 text-xs hover:bg-slate-700 rounded text-slate-300 transition"
            >
              +10
            </button>
            <button
              onClick={() => executeBatch(50)}
              disabled={isPlaying}
              className="px-2 py-1 text-xs hover:bg-slate-700 rounded text-slate-300 transition"
            >
              +50
            </button>
            <button
              onClick={() => executeBatch(500)}
              disabled={isPlaying}
              className="px-2 py-1 text-xs hover:bg-slate-700 rounded text-slate-300 transition"
            >
              +500
            </button>
          </div>

          <button
            onClick={resetChain}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Chain
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab("visualizer")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              activeTab === "visualizer"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Visualizer
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              activeTab === "diagnostics"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Diagnostics
          </button>
          <button
            onClick={() => setActiveTab("theory")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              activeTab === "theory"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Math Theory
          </button>
        </div>
      </div>

      {/* 3. Main Studio Body Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-2">
        {/* Left / Center View: Canvas / Discrete Chart */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {activeTab === "visualizer" && (
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-2 overflow-hidden shadow-inner flex flex-col items-center justify-center min-h-[460px]">
              {targetDistribution === "discrete_vocab_logits" ? (
                /* Discrete Vocabulary View */
                <div className="w-full flex flex-col p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-cyan-400" />
                      Discrete Vocabulary Softmax & Nucleus Truncation (T={temperature.toFixed(2)},
                      k={topK}, p={topP.toFixed(2)})
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Vocab Size: {discreteTokens.length} tokens
                    </span>
                  </div>

                  {/* Discrete Tokens Bar Chart */}
                  <div className="space-y-2 mt-2">
                    {discreteTokens.map((item, idx) => {
                      const step = recentDiscreteStep;
                      const rawProb = step ? step.rawProbs[idx] : 1 / discreteTokens.length;
                      const scaledProb = step ? step.scaledProbs[idx] : rawProb;
                      const isKept = step ? step.keptIndices.includes(idx) : true;
                      const isSampled = step ? step.sampledIndex === idx : false;

                      return (
                        <div
                          key={item.token}
                          className={`flex items-center gap-3 p-1.5 rounded-lg text-xs font-mono transition-all ${
                            isSampled
                              ? "bg-amber-500/20 border border-amber-500/50 text-amber-200"
                              : isKept
                                ? "bg-slate-900/60 border border-slate-800 text-slate-300"
                                : "bg-slate-950/40 border border-slate-900/40 text-slate-600 opacity-45 line-through"
                          }`}
                        >
                          <span className="w-20 font-semibold truncate">{item.token}</span>
                          <span className="w-12 text-slate-400 text-[11px]">
                            z={item.logit.toFixed(1)}
                          </span>
                          <div className="flex-1 h-3.5 bg-slate-950 rounded-full overflow-hidden relative border border-slate-800">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isSampled
                                  ? "bg-gradient-to-r from-amber-400 to-yellow-300 shadow-md shadow-amber-500/40"
                                  : isKept
                                    ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                                    : "bg-slate-700"
                              }`}
                              style={{ width: `${(scaledProb * 100).toFixed(1)}%` }}
                            />
                          </div>
                          <span className="w-14 text-right font-medium">
                            {(scaledProb * 100).toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Generated Stream Tape */}
                  <div className="mt-5 p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mb-2">
                      <Flame className="w-3.5 h-3.5 text-rose-400" /> Sampled Sequence Tape:
                    </span>
                    <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                      {generatedTokensStream.length === 0 ? (
                        <span className="text-xs text-slate-600 italic">
                          Click "Step" or "Play" to generate tokens...
                        </span>
                      ) : (
                        generatedTokensStream.map((tok, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
                              i === generatedTokensStream.length - 1
                                ? "bg-amber-400 text-slate-950 font-bold animate-pulse shadow-sm"
                                : "bg-slate-800 text-cyan-300 border border-slate-700"
                            }`}
                          >
                            {tok}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* 2D Canvas Density & MCMC Path Visualizer */
                <div className="w-full flex flex-col items-center">
                  <div className="flex items-center justify-between w-full px-2 pb-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      Density Map, Symplectic Flow & Marginal Histograms
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Click canvas to set starting point q0
                    </span>
                  </div>
                  <canvas
                    ref={canvasRef}
                    style={{ width: "100%", height: "420px" }}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={handleCanvasMouseLeave}
                    onClick={handleCanvasClick}
                    className="cursor-crosshair rounded-lg border border-slate-900 bg-slate-950"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "diagnostics" && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Markov Chain Monte Carlo Diagnostics & Mixing Convergence
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Total Proposals</span>
                  <p className="text-lg font-bold text-slate-100 font-mono">
                    {diagnostics.totalProposals}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Acceptance Rate</span>
                  <p
                    className={`text-lg font-bold font-mono ${
                      diagnostics.acceptanceRate > 0.15 && diagnostics.acceptanceRate < 0.85
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {(diagnostics.acceptanceRate * 100).toFixed(1)}%
                  </p>
                  <span className="text-[10px] text-slate-500">
                    Target:{" "}
                    {algorithm === "metropolis_hastings"
                      ? "~23.4%"
                      : algorithm === "hamiltonian_monte_carlo"
                        ? "~65-80%"
                        : "100%"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Effective Sample Size (ESS)</span>
                  <p className="text-lg font-bold text-cyan-400 font-mono">
                    {(
                      (diagnostics.effectiveSampleSizeX + diagnostics.effectiveSampleSizeY) /
                      2
                    ).toFixed(1)}
                  </p>
                  <span className="text-[10px] text-slate-500">
                    Eff: {(diagnostics.essEfficiency * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Sample Correlation</span>
                  <p className="text-lg font-bold text-indigo-400 font-mono">
                    {diagnostics.sampleCorrelation.toFixed(3)}
                  </p>
                </div>
              </div>

              {/* ACF Decay Line Chart */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  Autocorrelation Function &rho;(k) Decay Across Lags (0 to 20)
                </span>
                <div className="h-32 flex items-end gap-1.5 pt-4 pb-1 px-2 bg-slate-950 rounded border border-slate-900">
                  {diagnostics.acfX.map((val, lag) => {
                    const hPx = Math.max(2, Math.min(100, Math.abs(val) * 100));
                    return (
                      <div key={lag} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t transition-all ${
                            val >= 0 ? "bg-cyan-500" : "bg-rose-500"
                          }`}
                          style={{ height: `${hPx}px` }}
                        />
                        <span className="text-[9px] text-slate-500 font-mono">{lag}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                  <span>Lag 0 (rho=1.0)</span>
                  <span className="text-emerald-400">
                    Threshold: rho &lt; 0.05 indicates decorrelation
                  </span>
                  <span>Lag 20</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "theory" && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs leading-relaxed text-slate-300">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                Mathematical Foundations & Symplectic Dynamics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-amber-300">
                    1. Hamiltonian Monte Carlo & Leapfrog Integration
                  </span>
                  <p className="text-slate-400">
                    Augments state with momentum p ~ N(0, I). Total Hamiltonian:
                  </p>
                  <code className="block p-2 rounded bg-slate-950 text-cyan-300 font-mono text-[11px]">
                    H(q, p) = U(q) + 0.5 * ||p||^2
                  </code>
                  <p className="text-slate-400">
                    Symplectic leapfrog updates conserve phase-space volume and preserve total
                    energy H, achieving high acceptance over long exploration distances.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-cyan-300">
                    2. Metropolis-Hastings Acceptance Filter
                  </span>
                  <p className="text-slate-400">
                    For symmetric proposal q(x' | x) ~ N(x, &sigma;^2 I):
                  </p>
                  <code className="block p-2 rounded bg-slate-950 text-cyan-300 font-mono text-[11px]">
                    &alpha; = min(1, exp(-(U(x') - U(x))))
                  </code>
                  <p className="text-slate-400">
                    Optimal acceptance rate for Gaussian targets in high dimensions approaches
                    23.4%.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-emerald-300">
                    3. Exact Coordinate Gibbs Sampling
                  </span>
                  <p className="text-slate-400">Draws sequentially from exact 1D conditionals:</p>
                  <code className="block p-2 rounded bg-slate-950 text-cyan-300 font-mono text-[11px]">
                    x1 | x2 ~ N(&mu;1 + &rho;(&sigma;1/&sigma;2)(x2 - &mu;2), &sigma;1^2(1 -
                    &rho;^2))
                  </code>
                  <p className="text-slate-400">
                    Acceptance rate is strictly 100%, but steps are constrained along coordinate
                    axes.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-purple-300">
                    4. Temperature & Nucleus (Top-p) Filtering
                  </span>
                  <p className="text-slate-400">
                    Scales logits by T and dynamically truncates the cumulative mass:
                  </p>
                  <code className="block p-2 rounded bg-slate-950 text-cyan-300 font-mono text-[11px]">
                    pi = exp(zi / T) / sum_j exp(zj / T), sum_(j in kept) pj &ge; P
                  </code>
                  <p className="text-slate-400">
                    Removes low-probability tail hallucinations while preserving generative
                    diversity.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Parameters & Controls Panel */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Target Distribution Selector */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-400" /> Target Distribution
            </span>
            <div className="grid grid-cols-1 gap-1">
              {[
                { id: "multimodal_gmm", name: "2D Gaussian Mixture (3 Modes)" },
                { id: "rosenbrock_banana", name: "Rosenbrock Banana Ridge" },
                { id: "concentric_doughnut", name: "Concentric Doughnut Ring" },
                { id: "bivariate_correlated_gaussian", name: "Correlated Gaussian (rho=0.85)" },
                { id: "discrete_vocab_logits", name: "LLM Discrete Vocab Logits" },
              ].map((dist) => (
                <button
                  key={dist.id}
                  onClick={() => {
                    setTargetDistribution(dist.id as TargetDistributionId);
                    setHistory([]);
                    setActiveTrajectory(null);
                  }}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    targetDistribution === dist.id
                      ? "bg-indigo-600/30 border border-indigo-500/60 text-indigo-200"
                      : "bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {dist.name}
                </button>
              ))}
            </div>
          </div>

          {/* Algorithm Selector */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Sampling Algorithm
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "metropolis_hastings", name: "Metropolis-Hastings" },
                { id: "hamiltonian_monte_carlo", name: "Hamiltonian MC (HMC)" },
                { id: "gibbs", name: "Gibbs Sampling" },
                { id: "discrete_top_k_p", name: "Top-k / Top-p LLM" },
              ].map((algo) => (
                <button
                  key={algo.id}
                  onClick={() => setAlgorithm(algo.id as SamplingAlgorithmId)}
                  className={`text-center px-2 py-1.5 rounded-lg text-xs font-medium transition ${
                    algorithm === algo.id
                      ? "bg-cyan-600/30 border border-cyan-500/60 text-cyan-200"
                      : "bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {algo.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sampler Hyperparameters */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-400" /> Hyperparameter Sliders
            </span>

            {/* MH Proposal Std Slider */}
            {algorithm === "metropolis_hastings" && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">
                    Proposal Std (&sigma;<sub>prop</sub>):
                  </span>
                  <span className="font-mono text-cyan-300">{proposalStd.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="2.5"
                  step="0.05"
                  value={proposalStd}
                  onChange={(e) => setProposalStd(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            )}

            {/* HMC Step Size & L Steps */}
            {algorithm === "hamiltonian_monte_carlo" && (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Leapfrog Step Size (&epsilon;):</span>
                    <span className="font-mono text-amber-300">{hmcEpsilon.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.35"
                    step="0.01"
                    value={hmcEpsilon}
                    onChange={(e) => setHmcEpsilon(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Leapfrog Steps (L):</span>
                    <span className="font-mono text-amber-300">{hmcL}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    step="1"
                    value={hmcL}
                    onChange={(e) => setHmcL(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </>
            )}

            {/* Discrete Temperature, Top-k, Top-p Sliders */}
            {targetDistribution === "discrete_vocab_logits" && (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Temperature (T):</span>
                    <span className="font-mono text-rose-300">{temperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.5"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Top-k Truncation:</span>
                    <span className="font-mono text-cyan-300">{topK}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={discreteTokens.length}
                    step="1"
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Top-p Nucleus:</span>
                    <span className="font-mono text-indigo-300">{topP.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </>
            )}

            {/* Correlation rho for Gaussian */}
            {targetDistribution === "bivariate_correlated_gaussian" && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Correlation (&rho;):</span>
                  <span className="font-mono text-indigo-300">
                    {bivariateConfig.rho.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.95"
                  max="0.95"
                  step="0.05"
                  value={bivariateConfig.rho}
                  onChange={(e) =>
                    setBivariateConfig((prev) => ({
                      ...prev,
                      rho: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            )}

            {/* Burn-in Slider */}
            <div className="space-y-1 pt-1 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Burn-in Cutoff:</span>
                <span className="font-mono text-slate-300">{burnIn} samples</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={burnIn}
                onChange={(e) => setBurnIn(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-500"
              />
            </div>

            {/* Animation Speed Slider */}
            <div className="space-y-1 pt-1 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Step Delay:</span>
                <span className="font-mono text-slate-300">{animationSpeedMs} ms</span>
              </div>
              <input
                type="range"
                min="16"
                max="250"
                step="10"
                value={animationSpeedMs}
                onChange={(e) => setAnimationSpeedMs(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
