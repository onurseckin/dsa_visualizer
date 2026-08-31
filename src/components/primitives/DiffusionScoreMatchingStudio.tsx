import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  Activity,
  Compass,
  Sliders,
  TrendingUp,
  BarChart2,
  RefreshCw,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type Vector2 = [number, number];

export type DiffusionDatasetId =
  | "two_moons"
  | "swiss_roll"
  | "pinwheel"
  | "concentric_rings"
  | "eight_gaussians"
  | "four_corners";

export type DiffusionFrameworkId =
  | "ddpm"
  | "ddim"
  | "cfg"
  | "continuous_vp_sde"
  | "continuous_ve_sde"
  | "probability_flow_ode";

export type NoiseScheduleType = "linear" | "cosine" | "sigmoid";

export type DiffusionStudioTabId =
  | "generation"
  | "sde_vs_ode"
  | "schedules_snr"
  | "elbo_diagnostics"
  | "cfg_explorer";

export type DiffusionPresetId =
  | "ddpm_two_moons_sampling"
  | "ddim_fast_20step_swiss_roll"
  | "cfg_8gaussians_guidance"
  | "vp_sde_vs_ode_pinwheel"
  | "concentric_rings_cosine_schedule"
  | "four_corners_ve_sde_langevin";

export interface DiffusionDatasetPoint {
  readonly id: number;
  readonly point: Vector2;
  readonly classLabel: number;
  readonly color?: string;
}

export interface NoiseSchedule {
  readonly type: NoiseScheduleType;
  readonly T: number;
  readonly timesteps: readonly number[];
  readonly betas: readonly number[];
  readonly alphas: readonly number[];
  readonly alphasBar: readonly number[];
  readonly sqrtAlphasBar: readonly number[];
  readonly sqrtOneMinusAlphasBar: readonly number[];
  readonly posteriorVariance: readonly number[];
  readonly posteriorMeanCoef1: readonly number[];
  readonly posteriorMeanCoef2: readonly number[];
  readonly snr: readonly number[];
  readonly logSnr: readonly number[];
}

export interface ScoreEvaluation {
  readonly score: Vector2;
  readonly epsilon: Vector2;
  readonly x0Pred: Vector2;
  readonly logLikelihood: number;
  readonly maxLogit: number;
  readonly classScores?: Record<number, Vector2>;
}

export interface ParticleState {
  readonly id: number;
  readonly currentPos: Vector2;
  readonly initialNoise: Vector2;
  readonly classLabel: number;
  readonly trajectory: readonly Vector2[];
  readonly x0Pred: Vector2;
  readonly x0PredTrajectory?: readonly Vector2[];
}

export interface VectorFieldCell {
  readonly x: number;
  readonly y: number;
  readonly score: Vector2;
  readonly epsilon: Vector2;
  readonly norm: number;
  readonly normalizedScore: Vector2;
}

export interface ELBOBreakdown {
  readonly L0: number;
  readonly Lt: readonly number[];
  readonly LT: number;
  readonly totalELBO: number;
  readonly fisherLosses: readonly number[];
}

export interface ContinuousSDEParams {
  readonly betaMin: number;
  readonly betaMax: number;
  readonly sigmaMin: number;
  readonly sigmaMax: number;
}

export interface SimulationHistoryStep {
  readonly stepIndex: number;
  readonly t: number;
  readonly normalizedT: number;
  readonly particles: readonly ParticleState[];
  readonly meanScoreNorm: number;
  readonly meanEpsNorm: number;
  readonly alphaBar: number;
  readonly beta: number;
  readonly snrDb: number;
  readonly driftMagnitude: number;
  readonly diffusionStd: number;
}

export interface DiffusionPreset {
  readonly id: DiffusionPresetId;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly dataset: DiffusionDatasetId;
  readonly numPoints: number;
  readonly framework: DiffusionFrameworkId;
  readonly scheduleType: NoiseScheduleType;
  readonly totalSteps: number;
  readonly ddimSteps: number;
  readonly ddimEta: number;
  readonly guidanceScale: number;
  readonly targetClass: number | null;
  readonly numParticles: number;
  readonly gridDensity: number;
  readonly activeTab: DiffusionStudioTabId;
}

export interface DiffusionScoreMatchingStudioProps {
  readonly initialPreset?: DiffusionPresetId;
  readonly initialDataset?: DiffusionDatasetId;
  readonly initialFramework?: DiffusionFrameworkId;
  readonly initialSchedule?: NoiseScheduleType;
  readonly initialSteps?: number;
  readonly seed?: number;
  readonly onStepChange?: (step: number, t: number) => void;
  readonly className?: string;
}

// ============================================================================
// 2. MATHEMATICAL & ALGORITHMIC FOUNDATIONS (PURE FUNCTIONS)
// ============================================================================

/**
 * High-performance deterministic PRNG (Mulberry32) and Box-Muller normal sampler.
 */
export class SeededRNG {
  private state: number;

  constructor(seed = 42) {
    this.state = (seed ^ 0xcafebabe) >>> 0;
  }

  public next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextGaussian(mean = 0, std = 1): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z0 * std;
  }

  public nextGaussian2D(mean: Vector2 = [0, 0], std = 1): Vector2 {
    return [this.nextGaussian(mean[0], std), this.nextGaussian(mean[1], std)];
  }
}

/**
 * 2D vector Euclidean norm.
 */
export function norm2D(v: Vector2): number {
  return Math.hypot(v[0], v[1]);
}

/**
 * Linear noise schedule generation.
 * beta_t = beta_start + (t - 1) / (T - 1) * (beta_end - beta_start)
 */
export function computeLinearSchedule(T: number, betaStart = 1e-4, betaEnd = 0.02): NoiseSchedule {
  const timesteps = Array.from({ length: T + 1 }, (_, i) => i);
  const betas = new Array<number>(T + 1).fill(0);
  const alphas = new Array<number>(T + 1).fill(1);
  const alphasBar = new Array<number>(T + 1).fill(1);
  const sqrtAlphasBar = new Array<number>(T + 1).fill(1);
  const sqrtOneMinusAlphasBar = new Array<number>(T + 1).fill(0);
  const posteriorVariance = new Array<number>(T + 1).fill(0);
  const posteriorMeanCoef1 = new Array<number>(T + 1).fill(0);
  const posteriorMeanCoef2 = new Array<number>(T + 1).fill(0);
  const snr = new Array<number>(T + 1).fill(Infinity);
  const logSnr = new Array<number>(T + 1).fill(Infinity);

  let runningAlphaBar = 1.0;

  for (let t = 1; t <= T; t++) {
    const frac = T > 1 ? (t - 1) / (T - 1) : 0;
    const beta = betaStart + frac * (betaEnd - betaStart);
    const alpha = 1.0 - beta;
    const prevAlphaBar = runningAlphaBar;
    runningAlphaBar *= alpha;

    betas[t] = beta;
    alphas[t] = alpha;
    alphasBar[t] = runningAlphaBar;
    sqrtAlphasBar[t] = Math.sqrt(runningAlphaBar);
    sqrtOneMinusAlphasBar[t] = Math.sqrt(Math.max(1e-12, 1.0 - runningAlphaBar));

    // Posterior variance: \tilde{beta}_t = beta_t * (1 - \bar{alpha}_{t-1}) / (1 - \bar{alpha}_t)
    const postVar = (beta * (1.0 - prevAlphaBar)) / Math.max(1e-12, 1.0 - runningAlphaBar);
    posteriorVariance[t] = t === 1 ? beta : postVar;

    // Posterior mean coefficients
    posteriorMeanCoef1[t] =
      (Math.sqrt(prevAlphaBar) * beta) / Math.max(1e-12, 1.0 - runningAlphaBar);
    posteriorMeanCoef2[t] =
      (Math.sqrt(alpha) * (1.0 - prevAlphaBar)) / Math.max(1e-12, 1.0 - runningAlphaBar);

    const snrVal = runningAlphaBar / Math.max(1e-12, 1.0 - runningAlphaBar);
    snr[t] = snrVal;
    logSnr[t] = Math.log(Math.max(1e-12, snrVal));
  }

  return {
    type: "linear",
    T,
    timesteps,
    betas,
    alphas,
    alphasBar,
    sqrtAlphasBar,
    sqrtOneMinusAlphasBar,
    posteriorVariance,
    posteriorMeanCoef1,
    posteriorMeanCoef2,
    snr,
    logSnr,
  };
}

/**
 * Cosine noise schedule generation (Nichol & Dhariwal, 2021).
 * \bar{\alpha}_t = f(t) / f(0), f(t) = \cos^2((t/T + s) / (1 + s) * \pi / 2)
 */
export function computeCosineSchedule(T: number, s = 0.008, maxBeta = 0.999): NoiseSchedule {
  const timesteps = Array.from({ length: T + 1 }, (_, i) => i);
  const betas = new Array<number>(T + 1).fill(0);
  const alphas = new Array<number>(T + 1).fill(1);
  const alphasBar = new Array<number>(T + 1).fill(1);
  const sqrtAlphasBar = new Array<number>(T + 1).fill(1);
  const sqrtOneMinusAlphasBar = new Array<number>(T + 1).fill(0);
  const posteriorVariance = new Array<number>(T + 1).fill(0);
  const posteriorMeanCoef1 = new Array<number>(T + 1).fill(0);
  const posteriorMeanCoef2 = new Array<number>(T + 1).fill(0);
  const snr = new Array<number>(T + 1).fill(Infinity);
  const logSnr = new Array<number>(T + 1).fill(Infinity);

  const f0 = Math.cos((s / (1 + s)) * (Math.PI / 2)) ** 2;

  for (let t = 1; t <= T; t++) {
    const ft = Math.cos(((t / T + s) / (1 + s)) * (Math.PI / 2)) ** 2;
    const alphaBarRaw = ft / f0;
    const alphaBar = Math.max(1e-8, Math.min(1.0, alphaBarRaw));
    const prevAlphaBar = alphasBar[t - 1];

    let beta = 1.0 - alphaBar / prevAlphaBar;
    beta = Math.max(1e-5, Math.min(maxBeta, beta));
    const alpha = 1.0 - beta;

    betas[t] = beta;
    alphas[t] = alpha;
    alphasBar[t] = alphaBar;
    sqrtAlphasBar[t] = Math.sqrt(alphaBar);
    sqrtOneMinusAlphasBar[t] = Math.sqrt(Math.max(1e-12, 1.0 - alphaBar));

    const postVar = (beta * (1.0 - prevAlphaBar)) / Math.max(1e-12, 1.0 - alphaBar);
    posteriorVariance[t] = t === 1 ? beta : postVar;

    posteriorMeanCoef1[t] = (Math.sqrt(prevAlphaBar) * beta) / Math.max(1e-12, 1.0 - alphaBar);
    posteriorMeanCoef2[t] =
      (Math.sqrt(alpha) * (1.0 - prevAlphaBar)) / Math.max(1e-12, 1.0 - alphaBar);

    const snrVal = alphaBar / Math.max(1e-12, 1.0 - alphaBar);
    snr[t] = snrVal;
    logSnr[t] = Math.log(Math.max(1e-12, snrVal));
  }

  return {
    type: "cosine",
    T,
    timesteps,
    betas,
    alphas,
    alphasBar,
    sqrtAlphasBar,
    sqrtOneMinusAlphasBar,
    posteriorVariance,
    posteriorMeanCoef1,
    posteriorMeanCoef2,
    snr,
    logSnr,
  };
}

/**
 * Sigmoid noise schedule generation.
 */
export function computeSigmoidSchedule(T: number, start = -3, end = 3): NoiseSchedule {
  const timesteps = Array.from({ length: T + 1 }, (_, i) => i);
  const betas = new Array<number>(T + 1).fill(0);
  const alphas = new Array<number>(T + 1).fill(1);
  const alphasBar = new Array<number>(T + 1).fill(1);
  const sqrtAlphasBar = new Array<number>(T + 1).fill(1);
  const sqrtOneMinusAlphasBar = new Array<number>(T + 1).fill(0);
  const posteriorVariance = new Array<number>(T + 1).fill(0);
  const posteriorMeanCoef1 = new Array<number>(T + 1).fill(0);
  const posteriorMeanCoef2 = new Array<number>(T + 1).fill(0);
  const snr = new Array<number>(T + 1).fill(Infinity);
  const logSnr = new Array<number>(T + 1).fill(Infinity);

  const sigmoid = (x: number) => 1.0 / (1.0 + Math.exp(-x));
  const sigStart = sigmoid(-start);
  const sigEnd = sigmoid(-end);

  for (let t = 1; t <= T; t++) {
    const v = start + (t / T) * (end - start);
    const sigV = sigmoid(-v);
    const normAlphaBar = (sigV - sigEnd) / (sigStart - sigEnd);
    const alphaBar = Math.max(1e-7, Math.min(0.9999, normAlphaBar));
    const prevAlphaBar = alphasBar[t - 1];

    let beta = 1.0 - alphaBar / prevAlphaBar;
    beta = Math.max(1e-5, Math.min(0.999, beta));
    const alpha = 1.0 - beta;

    betas[t] = beta;
    alphas[t] = alpha;
    alphasBar[t] = alphaBar;
    sqrtAlphasBar[t] = Math.sqrt(alphaBar);
    sqrtOneMinusAlphasBar[t] = Math.sqrt(Math.max(1e-12, 1.0 - alphaBar));

    const postVar = (beta * (1.0 - prevAlphaBar)) / Math.max(1e-12, 1.0 - alphaBar);
    posteriorVariance[t] = t === 1 ? beta : postVar;

    posteriorMeanCoef1[t] = (Math.sqrt(prevAlphaBar) * beta) / Math.max(1e-12, 1.0 - alphaBar);
    posteriorMeanCoef2[t] =
      (Math.sqrt(alpha) * (1.0 - prevAlphaBar)) / Math.max(1e-12, 1.0 - alphaBar);

    const snrVal = alphaBar / Math.max(1e-12, 1.0 - alphaBar);
    snr[t] = snrVal;
    logSnr[t] = Math.log(Math.max(1e-12, snrVal));
  }

  return {
    type: "sigmoid",
    T,
    timesteps,
    betas,
    alphas,
    alphasBar,
    sqrtAlphasBar,
    sqrtOneMinusAlphasBar,
    posteriorVariance,
    posteriorMeanCoef1,
    posteriorMeanCoef2,
    snr,
    logSnr,
  };
}

/**
 * Noise schedule factory dispatcher.
 */
export function buildNoiseSchedule(
  type: NoiseScheduleType,
  T: number,
  options?: { betaStart?: number; betaEnd?: number; cosineS?: number },
): NoiseSchedule {
  switch (type) {
    case "cosine":
      return computeCosineSchedule(T, options?.cosineS ?? 0.008);
    case "sigmoid":
      return computeSigmoidSchedule(T);
    case "linear":
    default:
      return computeLinearSchedule(T, options?.betaStart ?? 1e-4, options?.betaEnd ?? 0.02);
  }
}

/**
 * Generate 2D synthetic datasets with distinct class labels.
 */
export function generateDiffusionDataset(
  distribution: DiffusionDatasetId,
  numPoints = 200,
  seed = 42,
): readonly DiffusionDatasetPoint[] {
  const rng = new SeededRNG(seed);
  const points: DiffusionDatasetPoint[] = [];

  switch (distribution) {
    case "two_moons": {
      const half = Math.floor(numPoints / 2);
      for (let i = 0; i < half; i++) {
        const theta = (i / half) * Math.PI + rng.nextGaussian(0, 0.04);
        const r = 1.3 + rng.nextGaussian(0, 0.08);
        const x = r * Math.cos(theta) - 0.65;
        const y = r * Math.sin(theta) - 0.2;
        points.push({ id: i, point: [x, y], classLabel: 0, color: "#38bdf8" });
      }
      for (let i = 0; i < numPoints - half; i++) {
        const theta = (i / (numPoints - half)) * Math.PI + rng.nextGaussian(0, 0.04);
        const r = 1.3 + rng.nextGaussian(0, 0.08);
        const x = -r * Math.cos(theta) + 0.65;
        const y = -r * Math.sin(theta) + 0.5;
        points.push({
          id: half + i,
          point: [x, y],
          classLabel: 1,
          color: "#f43f5e",
        });
      }
      break;
    }

    case "swiss_roll": {
      for (let i = 0; i < numPoints; i++) {
        const t = 1.5 * Math.PI * (1 + 2 * (i / numPoints));
        const r = 0.55 * t + rng.nextGaussian(0, 0.12);
        const x = (r * Math.cos(t)) / 2.2;
        const y = (r * Math.sin(t)) / 2.2;
        const classLabel = Math.min(3, Math.floor((i / numPoints) * 4));
        const colors = ["#38bdf8", "#34d399", "#fbbf24", "#f43f5e"];
        points.push({ id: i, point: [x, y], classLabel, color: colors[classLabel] });
      }
      break;
    }

    case "pinwheel": {
      const numArms = 5;
      for (let i = 0; i < numPoints; i++) {
        const arm = i % numArms;
        const r = 0.4 + 2.2 * Math.sqrt(rng.next());
        const theta = (arm * 2 * Math.PI) / numArms + 0.55 * r + rng.nextGaussian(0, 0.1);
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const armColors = ["#38bdf8", "#818cf8", "#c084fc", "#f472b6", "#fb923c"];
        points.push({
          id: i,
          point: [x, y],
          classLabel: arm,
          color: armColors[arm % armColors.length],
        });
      }
      break;
    }

    case "concentric_rings": {
      const rings = [
        { radius: 0.8, std: 0.08, label: 0, color: "#38bdf8" },
        { radius: 1.8, std: 0.1, label: 1, color: "#34d399" },
        { radius: 2.7, std: 0.12, label: 2, color: "#f59e0b" },
      ];
      for (let i = 0; i < numPoints; i++) {
        const ring = rings[i % rings.length];
        const theta = rng.next() * 2 * Math.PI;
        const r = ring.radius + rng.nextGaussian(0, ring.std);
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        points.push({
          id: i,
          point: [x, y],
          classLabel: ring.label,
          color: ring.color,
        });
      }
      break;
    }

    case "eight_gaussians": {
      const numModes = 8;
      const radius = 2.4;
      const std = 0.18;
      for (let i = 0; i < numPoints; i++) {
        const mode = i % numModes;
        const angle = (mode * 2 * Math.PI) / numModes;
        const cx = radius * Math.cos(angle);
        const cy = radius * Math.sin(angle);
        const x = cx + rng.nextGaussian(0, std);
        const y = cy + rng.nextGaussian(0, std);
        const colors = [
          "#38bdf8",
          "#60a5fa",
          "#818cf8",
          "#a78bfa",
          "#c084fc",
          "#e879f9",
          "#f472b6",
          "#fb7185",
        ];
        points.push({
          id: i,
          point: [x, y],
          classLabel: mode,
          color: colors[mode % colors.length],
        });
      }
      break;
    }

    case "four_corners": {
      const centers: Vector2[] = [
        [-2.0, -2.0],
        [-2.0, 2.0],
        [2.0, -2.0],
        [2.0, 2.0],
      ];
      const colors = ["#38bdf8", "#34d399", "#fbbf24", "#f43f5e"];
      for (let i = 0; i < numPoints; i++) {
        const mode = i % 4;
        const [cx, cy] = centers[mode];
        const x = cx + rng.nextGaussian(0, 0.28);
        const y = cy + rng.nextGaussian(0, 0.28);
        points.push({
          id: i,
          point: [x, y],
          classLabel: mode,
          color: colors[mode],
        });
      }
      break;
    }
  }

  return points;
}

/**
 * Forward noising step q(x_t | x_0) = \sqrt{\bar{\alpha}_t} x_0 + \sqrt{1 - \bar{\alpha}_t} \epsilon
 */
export function qSample(x0: Vector2, alphaBar_t: number, noise: Vector2): Vector2 {
  const sqrtAlphaBar = Math.sqrt(Math.max(0, Math.min(1.0, alphaBar_t)));
  const sqrtOneMinusAlphaBar = Math.sqrt(Math.max(0, 1.0 - alphaBar_t));
  return [
    sqrtAlphaBar * x0[0] + sqrtOneMinusAlphaBar * noise[0],
    sqrtAlphaBar * x0[1] + sqrtOneMinusAlphaBar * noise[1],
  ];
}

/**
 * Computes exact analytical score function \nabla_{x_t} \log p_t(x_t)
 * for an empirical data distribution using numerically stabilized Log-Sum-Exp.
 */
export function computeExactScore(
  xt: Vector2,
  alphaBar_t: number,
  dataset: readonly DiffusionDatasetPoint[],
  classCondition?: number | null,
): ScoreEvaluation {
  const filteredData =
    classCondition !== undefined && classCondition !== null
      ? dataset.filter((p) => p.classLabel === classCondition)
      : dataset;

  const N = filteredData.length;
  if (N === 0) {
    return {
      score: [0, 0],
      epsilon: [0, 0],
      x0Pred: xt,
      logLikelihood: -Infinity,
      maxLogit: 0,
    };
  }

  const sqrtAlphaBar = Math.sqrt(Math.max(1e-12, alphaBar_t));
  const sigmaSquared = Math.max(1e-8, 1.0 - alphaBar_t);
  const twoSigmaSq = 2.0 * sigmaSquared;

  // 1. Compute unnormalized log weights: l_i = - ||x_t - \sqrt{\bar{\alpha}_t} x_0^{(i)}||^2 / (2 \sigma^2)
  const logWeights = new Float64Array(N);
  let maxLogit = -Infinity;

  for (let i = 0; i < N; i++) {
    const x0 = filteredData[i].point;
    const dx = xt[0] - sqrtAlphaBar * x0[0];
    const dy = xt[1] - sqrtAlphaBar * x0[1];
    const distSq = dx * dx + dy * dy;
    const lw = -distSq / twoSigmaSq;
    logWeights[i] = lw;
    if (lw > maxLogit) {
      maxLogit = lw;
    }
  }

  // 2. Numerically stable softmax: w_i = exp(l_i - maxLogit) / \sum_j exp(l_j - maxLogit)
  let sumExp = 0.0;
  for (let i = 0; i < N; i++) {
    sumExp += Math.exp(logWeights[i] - maxLogit);
  }

  let expectedX0_x = 0.0;
  let expectedX0_y = 0.0;

  for (let i = 0; i < N; i++) {
    const w = Math.exp(logWeights[i] - maxLogit) / sumExp;
    const x0 = filteredData[i].point;
    expectedX0_x += w * x0[0];
    expectedX0_y += w * x0[1];
  }

  const x0Pred: Vector2 = [expectedX0_x, expectedX0_y];

  // 3. Exact score = (\sqrt{\bar{\alpha}_t} \hat{x}_0 - x_t) / (1 - \bar{\alpha}_t)
  const scoreX = (sqrtAlphaBar * expectedX0_x - xt[0]) / sigmaSquared;
  const scoreY = (sqrtAlphaBar * expectedX0_y - xt[1]) / sigmaSquared;
  const score: Vector2 = [scoreX, scoreY];

  // 4. Equivalent epsilon = -\sqrt{1 - \bar{\alpha}_t} * score
  const sqrtOneMinusAlphaBar = Math.sqrt(sigmaSquared);
  const epsilon: Vector2 = [-sqrtOneMinusAlphaBar * scoreX, -sqrtOneMinusAlphaBar * scoreY];

  // Log-likelihood approximation (GMM marginal log-sum-exp)
  const logLikelihood = maxLogit + Math.log(sumExp / N) - Math.log(2.0 * Math.PI * sigmaSquared);

  return {
    score,
    epsilon,
    x0Pred,
    logLikelihood,
    maxLogit,
  };
}

/**
 * Convert score vector to equivalent predicted noise epsilon:
 * \epsilon = -\sqrt{1 - \bar{\alpha}_t} * score
 */
export function scoreToEpsilon(score: Vector2, alphaBar_t: number): Vector2 {
  const scale = -Math.sqrt(Math.max(1e-12, 1.0 - alphaBar_t));
  return [score[0] * scale, score[1] * scale];
}

/**
 * Convert predicted noise epsilon to score vector:
 * score = -\epsilon / \sqrt{1 - \bar{\alpha}_t}
 */
export function epsilonToScore(eps: Vector2, alphaBar_t: number): Vector2 {
  const scale = -1.0 / Math.sqrt(Math.max(1e-12, 1.0 - alphaBar_t));
  return [eps[0] * scale, eps[1] * scale];
}

/**
 * Predict x_0 from x_t and noise epsilon:
 * \hat{x}_0 = (x_t - \sqrt{1 - \bar{\alpha}_t} \epsilon) / \sqrt{\bar{\alpha}_t}
 */
export function predictX0FromEps(xt: Vector2, eps: Vector2, alphaBar_t: number): Vector2 {
  const sqrtAlphaBar = Math.sqrt(Math.max(1e-12, alphaBar_t));
  const sqrtOneMinusAlphaBar = Math.sqrt(Math.max(1e-12, 1.0 - alphaBar_t));
  return [
    (xt[0] - sqrtOneMinusAlphaBar * eps[0]) / sqrtAlphaBar,
    (xt[1] - sqrtOneMinusAlphaBar * eps[1]) / sqrtAlphaBar,
  ];
}

/**
 * Predict x_0 directly from score:
 * \hat{x}_0 = (x_t + (1 - \bar{\alpha}_t) * score) / \sqrt{\bar{\alpha}_t}
 */
export function predictX0FromScore(xt: Vector2, score: Vector2, alphaBar_t: number): Vector2 {
  const sqrtAlphaBar = Math.sqrt(Math.max(1e-12, alphaBar_t));
  const sigmaSquared = Math.max(1e-12, 1.0 - alphaBar_t);
  return [
    (xt[0] + sigmaSquared * score[0]) / sqrtAlphaBar,
    (xt[1] + sigmaSquared * score[1]) / sqrtAlphaBar,
  ];
}

/**
 * Classifier-Free Guidance (CFG) score & noise combination:
 * \tilde{\epsilon}(x_t, c) = \epsilon_{uncond} + w * (\epsilon_{cond} - \epsilon_{uncond})
 */
export function computeCFGScore(
  xt: Vector2,
  alphaBar_t: number,
  dataset: readonly DiffusionDatasetPoint[],
  classTarget: number,
  guidanceScale: number,
): ScoreEvaluation {
  const uncond = computeExactScore(xt, alphaBar_t, dataset, null);
  const cond = computeExactScore(xt, alphaBar_t, dataset, classTarget);

  const epsUncond = uncond.epsilon;
  const epsCond = cond.epsilon;

  const guidedEpsX = epsUncond[0] + guidanceScale * (epsCond[0] - epsUncond[0]);
  const guidedEpsY = epsUncond[1] + guidanceScale * (epsCond[1] - epsUncond[1]);
  const guidedEps: Vector2 = [guidedEpsX, guidedEpsY];

  const guidedScore = epsilonToScore(guidedEps, alphaBar_t);
  const x0Pred = predictX0FromEps(xt, guidedEps, alphaBar_t);

  return {
    score: guidedScore,
    epsilon: guidedEps,
    x0Pred,
    logLikelihood: cond.logLikelihood,
    maxLogit: cond.maxLogit,
  };
}

/**
 * DDPM Single Step Reverse Transition:
 * x_{t-1} = 1/\sqrt{\alpha_t} * (x_t - \beta_t / \sqrt{1 - \bar{\alpha}_t} * \epsilon) + \sigma_t * z
 */
export function ddpmReverseStep(
  xt: Vector2,
  t: number,
  schedule: NoiseSchedule,
  epsilon: Vector2,
  noiseZ: Vector2 = [0, 0],
): Vector2 {
  if (t <= 0) return xt;

  const alpha_t = schedule.alphas[t];
  const beta_t = schedule.betas[t];
  const sqrtAlpha_t = Math.sqrt(alpha_t);
  const sqrtOneMinusAlphaBar_t = schedule.sqrtOneMinusAlphasBar[t];
  const sigma_t = t > 1 ? Math.sqrt(schedule.posteriorVariance[t]) : 0;

  const meanX = (1.0 / sqrtAlpha_t) * (xt[0] - (beta_t / sqrtOneMinusAlphaBar_t) * epsilon[0]);
  const meanY = (1.0 / sqrtAlpha_t) * (xt[1] - (beta_t / sqrtOneMinusAlphaBar_t) * epsilon[1]);

  return [meanX + sigma_t * noiseZ[0], meanY + sigma_t * noiseZ[1]];
}

/**
 * DDIM Single Step Reverse Transition (Song et al., 2020):
 * Given current timestep t = \tau_i and previous target timestep s = \tau_{i-1}.
 */
export function ddimReverseStep(
  xt: Vector2,
  currentT: number,
  prevT: number,
  schedule: NoiseSchedule,
  epsilon: Vector2,
  eta = 0.0,
  noiseZ: Vector2 = [0, 0],
): Vector2 {
  const alphaBar_t = schedule.alphasBar[currentT];
  const alphaBar_prev = prevT > 0 ? schedule.alphasBar[prevT] : 1.0;

  const sqrtAlphaBar_t = Math.sqrt(alphaBar_t);
  const sqrtOneMinusAlphaBar_t = Math.sqrt(Math.max(1e-12, 1.0 - alphaBar_t));

  // 1. Predicted x_0
  const x0PredX = (xt[0] - sqrtOneMinusAlphaBar_t * epsilon[0]) / sqrtAlphaBar_t;
  const x0PredY = (xt[1] - sqrtOneMinusAlphaBar_t * epsilon[1]) / sqrtAlphaBar_t;

  if (prevT === 0) {
    return [x0PredX, x0PredY];
  }

  // 2. Variance parameter \sigma_t
  const sigma_t =
    eta *
    Math.sqrt(
      Math.max(
        0,
        ((1.0 - alphaBar_prev) / (1.0 - alphaBar_t)) * (1.0 - alphaBar_t / alphaBar_prev),
      ),
    );

  // 3. Direction pointing to x_t
  const dirScale = Math.sqrt(Math.max(0, 1.0 - alphaBar_prev - sigma_t * sigma_t));

  // 4. Next state x_{prevT}
  const sqrtAlphaBar_prev = Math.sqrt(alphaBar_prev);
  const nextX = sqrtAlphaBar_prev * x0PredX + dirScale * epsilon[0] + sigma_t * noiseZ[0];
  const nextY = sqrtAlphaBar_prev * x0PredY + dirScale * epsilon[1] + sigma_t * noiseZ[1];

  return [nextX, nextY];
}

/**
 * Continuous SDE and Probability Flow ODE Drift & Diffusion evaluations.
 */
export function evaluateContinuousVPDriftAndDiffusion(
  x: Vector2,
  normalizedT: number, // t \in [0, 1]
  score: Vector2,
  params: ContinuousSDEParams = { betaMin: 0.1, betaMax: 20.0, sigmaMin: 0.01, sigmaMax: 50.0 },
): {
  forwardDrift: Vector2;
  reverseSDEDrift: Vector2;
  probabilityFlowODEDrift: Vector2;
  diffusion: number;
} {
  const beta_t = params.betaMin + normalizedT * (params.betaMax - params.betaMin);
  const diffusion = Math.sqrt(beta_t);

  // Forward SDE drift: f(x, t) = -1/2 \beta(t) x
  const forwardDrift: Vector2 = [-0.5 * beta_t * x[0], -0.5 * beta_t * x[1]];

  // Reverse SDE drift: f_{rev}(x, t) = -1/2 \beta(t) x - \beta(t) \nabla_x \log p_t(x)
  const reverseSDEDrift: Vector2 = [
    -0.5 * beta_t * x[0] - beta_t * score[0],
    -0.5 * beta_t * x[1] - beta_t * score[1],
  ];

  // Probability Flow ODE drift: f_{ode}(x, t) = -1/2 \beta(t) x - 1/2 \beta(t) \nabla_x \log p_t(x)
  const probabilityFlowODEDrift: Vector2 = [
    -0.5 * beta_t * x[0] - 0.5 * beta_t * score[0],
    -0.5 * beta_t * x[1] - 0.5 * beta_t * score[1],
  ];

  return {
    forwardDrift,
    reverseSDEDrift,
    probabilityFlowODEDrift,
    diffusion,
  };
}

/**
 * Continuous VE-SDE evaluations (Variance Exploding).
 */
export function evaluateContinuousVEDriftAndDiffusion(
  _x: Vector2,
  normalizedT: number, // t \in [0, 1]
  score: Vector2,
  params: ContinuousSDEParams = { betaMin: 0.1, betaMax: 20.0, sigmaMin: 0.01, sigmaMax: 50.0 },
): {
  forwardDrift: Vector2;
  reverseSDEDrift: Vector2;
  probabilityFlowODEDrift: Vector2;
  diffusion: number;
} {
  const sigma_t = params.sigmaMin * (params.sigmaMax / params.sigmaMin) ** normalizedT;
  const g_t = sigma_t * Math.sqrt(2.0 * Math.log(params.sigmaMax / params.sigmaMin));

  const forwardDrift: Vector2 = [0, 0];
  const reverseSDEDrift: Vector2 = [-g_t * g_t * score[0], -g_t * g_t * score[1]];
  const probabilityFlowODEDrift: Vector2 = [
    -0.5 * g_t * g_t * score[0],
    -0.5 * g_t * g_t * score[1],
  ];

  return {
    forwardDrift,
    reverseSDEDrift,
    probabilityFlowODEDrift,
    diffusion: g_t,
  };
}

/**
 * Evaluates vector field grid for 2D spatial visualization.
 */
export function computeScoreVectorField(
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  density: number,
  alphaBar_t: number,
  dataset: readonly DiffusionDatasetPoint[],
  classCondition?: number | null,
  guidanceScale = 1.0,
): readonly VectorFieldCell[] {
  const cells: VectorFieldCell[] = [];
  const stepX = (bounds.maxX - bounds.minX) / (density - 1);
  const stepY = (bounds.maxY - bounds.minY) / (density - 1);

  for (let ix = 0; ix < density; ix++) {
    const x = bounds.minX + ix * stepX;
    for (let iy = 0; iy < density; iy++) {
      const y = bounds.minY + iy * stepY;
      const pt: Vector2 = [x, y];

      let evalRes: ScoreEvaluation;
      if (classCondition !== undefined && classCondition !== null && guidanceScale !== 1.0) {
        evalRes = computeCFGScore(pt, alphaBar_t, dataset, classCondition, guidanceScale);
      } else {
        evalRes = computeExactScore(pt, alphaBar_t, dataset, classCondition);
      }

      const norm = norm2D(evalRes.score);
      const safeNorm = Math.max(1e-8, norm);
      const normalizedScore: Vector2 = [evalRes.score[0] / safeNorm, evalRes.score[1] / safeNorm];

      cells.push({
        x,
        y,
        score: evalRes.score,
        epsilon: evalRes.epsilon,
        norm,
        normalizedScore,
      });
    }
  }

  return cells;
}

/**
 * Computes analytical ELBO breakdown and per-step KL divergences across all timesteps.
 */
export function computeELBOBreakdown(
  schedule: NoiseSchedule,
  dataset: readonly DiffusionDatasetPoint[],
  numEvaluationSamples = 40,
): ELBOBreakdown {
  const T = schedule.T;
  const Lt = new Array<number>(T + 1).fill(0);
  const fisherLosses = new Array<number>(T + 1).fill(0);
  const rng = new SeededRNG(1337);

  const evalPoints = dataset.slice(0, Math.min(dataset.length, numEvaluationSamples));
  const numPts = Math.max(1, evalPoints.length);

  // 1. Reconstruction Loss L_0: E_{q(x_1|x_0)} [-log p_\theta(x_0 | x_1)]
  let sumL0 = 0.0;
  const alphaBar1 = schedule.alphasBar[1];
  for (const pt of evalPoints) {
    const noise = rng.nextGaussian2D();
    const x1 = qSample(pt.point, alphaBar1, noise);
    const scoreEval = computeExactScore(x1, alphaBar1, dataset, null);
    const reconDistSq =
      (pt.point[0] - scoreEval.x0Pred[0]) ** 2 + (pt.point[1] - scoreEval.x0Pred[1]) ** 2;
    sumL0 += reconDistSq / (2.0 * Math.max(1e-5, 1.0 - alphaBar1));
  }
  const L0 = sumL0 / numPts;

  // 2. KL Divergence steps L_{t-1} = D_{KL}(q(x_{t-1} | x_t, x_0) || p_\theta(x_{t-1} | x_t))
  for (let t = 2; t <= T; t++) {
    const alphaBar_t = schedule.alphasBar[t];
    const beta_t = schedule.betas[t];
    const alpha_t = schedule.alphas[t];
    const postVar = schedule.posteriorVariance[t];

    let sumKL = 0.0;
    let sumFisher = 0.0;

    for (const pt of evalPoints) {
      const noise = rng.nextGaussian2D();
      const xt = qSample(pt.point, alphaBar_t, noise);
      const scoreEval = computeExactScore(xt, alphaBar_t, dataset, null);

      const epsErrorSq =
        (noise[0] - scoreEval.epsilon[0]) ** 2 + (noise[1] - scoreEval.epsilon[1]) ** 2;
      sumFisher += 0.5 * epsErrorSq;

      // KL divergence weighting coefficient
      const klWeight =
        (beta_t * beta_t) / (2.0 * alpha_t * (1.0 - alphaBar_t) * Math.max(1e-12, postVar));
      sumKL += klWeight * epsErrorSq;
    }

    Lt[t] = sumKL / numPts;
    fisherLosses[t] = sumFisher / numPts;
  }

  // 3. Prior matching loss L_T = D_{KL}(q(x_T | x_0) || N(0, I))
  const alphaBarT = schedule.alphasBar[T];
  let sumLT = 0.0;
  for (const pt of evalPoints) {
    const normSq = pt.point[0] * pt.point[0] + pt.point[1] * pt.point[1];
    sumLT += 0.5 * (alphaBarT * normSq);
  }
  const LT = sumLT / numPts;

  let totalELBO = L0 + LT;
  for (let t = 2; t <= T; t++) {
    totalELBO += Lt[t];
  }

  return {
    L0,
    Lt,
    LT,
    totalELBO,
    fisherLosses,
  };
}

// ============================================================================
// 3. PRESETS CATALOG
// ============================================================================

export const DIFFUSION_STUDIO_PRESETS: readonly DiffusionPreset[] = [
  {
    id: "ddpm_two_moons_sampling",
    name: "DDPM 100-Step Stochastic Two Moons",
    category: "Discrete DDPM",
    description:
      "Standard Ho et al. (2020) reverse Markov chain with 100 timesteps and isotropic Gaussian noise injection on interlocking moons.",
    dataset: "two_moons",
    numPoints: 200,
    framework: "ddpm",
    scheduleType: "linear",
    totalSteps: 100,
    ddimSteps: 100,
    ddimEta: 1.0,
    guidanceScale: 1.0,
    targetClass: null,
    numParticles: 150,
    gridDensity: 18,
    activeTab: "generation",
  },
  {
    id: "ddim_fast_20step_swiss_roll",
    name: "DDIM 20-Step Deterministic Swiss Roll",
    category: "Accelerated DDIM",
    description:
      "Deterministic non-Markovian sub-sampling with eta=0, generating high-fidelity Archimedean spiral particles in only 20 steps.",
    dataset: "swiss_roll",
    numPoints: 240,
    framework: "ddim",
    scheduleType: "cosine",
    totalSteps: 100,
    ddimSteps: 20,
    ddimEta: 0.0,
    guidanceScale: 1.0,
    targetClass: null,
    numParticles: 180,
    gridDensity: 18,
    activeTab: "generation",
  },
  {
    id: "cfg_8gaussians_guidance",
    name: "CFG Guided Mode Targeting (8-Gaussians)",
    category: "Classifier-Free Guidance",
    description:
      "Classifier-Free Guidance with w=3.5 targeting cluster mode #3, demonstrating mode collapse to target class with extreme precision.",
    dataset: "eight_gaussians",
    numPoints: 240,
    framework: "cfg",
    scheduleType: "linear",
    totalSteps: 80,
    ddimSteps: 80,
    ddimEta: 0.5,
    guidanceScale: 3.5,
    targetClass: 3,
    numParticles: 200,
    gridDensity: 20,
    activeTab: "cfg_explorer",
  },
  {
    id: "vp_sde_vs_ode_pinwheel",
    name: "Continuous VP-SDE vs Probability Flow ODE",
    category: "Continuous SDE / ODE",
    description:
      "Direct comparison between stochastic Langevin reverse VP-SDE diffusion and deterministic Probability Flow ODE on 5-arm pinwheel.",
    dataset: "pinwheel",
    numPoints: 250,
    framework: "probability_flow_ode",
    scheduleType: "cosine",
    totalSteps: 100,
    ddimSteps: 50,
    ddimEta: 0.0,
    guidanceScale: 1.0,
    targetClass: null,
    numParticles: 160,
    gridDensity: 18,
    activeTab: "sde_vs_ode",
  },
  {
    id: "concentric_rings_cosine_schedule",
    name: "Concentric Rings with Cosine Schedule",
    category: "Schedule Analysis",
    description:
      "Explores Cosine noise schedule preventing linear schedule high-frequency noise blowout at small timesteps on 3-ring topology.",
    dataset: "concentric_rings",
    numPoints: 240,
    framework: "ddim",
    scheduleType: "cosine",
    totalSteps: 60,
    ddimSteps: 30,
    ddimEta: 0.2,
    guidanceScale: 1.0,
    targetClass: null,
    numParticles: 180,
    gridDensity: 18,
    activeTab: "schedules_snr",
  },
  {
    id: "four_corners_ve_sde_langevin",
    name: "4-Corners Variance-Exploding SDE Flow",
    category: "VE-SDE Langevin",
    description:
      "Score matching under geometric variance expansion (Song et al., 2020b) converging into 4 isolated multimodal corners.",
    dataset: "four_corners",
    numPoints: 200,
    framework: "continuous_ve_sde",
    scheduleType: "sigmoid",
    totalSteps: 80,
    ddimSteps: 40,
    ddimEta: 1.0,
    guidanceScale: 1.0,
    targetClass: null,
    numParticles: 160,
    gridDensity: 18,
    activeTab: "elbo_diagnostics",
  },
];

// ============================================================================
// 4. REACT COMPONENT IMPLEMENTATION
// ============================================================================

export const DiffusionScoreMatchingStudio: React.FC<DiffusionScoreMatchingStudioProps> = ({
  initialPreset = "ddpm_two_moons_sampling",
  initialDataset,
  initialFramework,
  initialSchedule,
  initialSteps,
  seed = 42,
  onStepChange,
  className = "",
}) => {
  // Preset state
  const defaultPreset = useMemo(
    () =>
      DIFFUSION_STUDIO_PRESETS.find((p) => p.id === initialPreset) ?? DIFFUSION_STUDIO_PRESETS[0],
    [initialPreset],
  );

  // Configuration state
  const [activeTab, setActiveTab] = useState<DiffusionStudioTabId>(defaultPreset.activeTab);
  const [datasetId, setDatasetId] = useState<DiffusionDatasetId>(
    initialDataset ?? defaultPreset.dataset,
  );
  const [frameworkId, setFrameworkId] = useState<DiffusionFrameworkId>(
    initialFramework ?? defaultPreset.framework,
  );
  const [scheduleType, setScheduleType] = useState<NoiseScheduleType>(
    initialSchedule ?? defaultPreset.scheduleType,
  );
  const [totalSteps, setTotalSteps] = useState<number>(initialSteps ?? defaultPreset.totalSteps);
  const [ddimSteps, setDdimSteps] = useState<number>(defaultPreset.ddimSteps);
  const [ddimEta, setDdimEta] = useState<number>(defaultPreset.ddimEta);
  const [guidanceScale, setGuidanceScale] = useState<number>(defaultPreset.guidanceScale);
  const [targetClass, setTargetClass] = useState<number | null>(defaultPreset.targetClass);
  const [numParticles, setNumParticles] = useState<number>(defaultPreset.numParticles);
  const [gridDensity, setGridDensity] = useState<number>(defaultPreset.gridDensity);
  const [currentSeed, setCurrentSeed] = useState<number>(seed);

  // Visualization toggles
  const [showVectorField, setShowVectorField] = useState<boolean>(true);
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [showTargetData, setShowTargetData] = useState<boolean>(true);
  const [showX0Pred, setShowX0Pred] = useState<boolean>(false);
  const [vectorScale, setVectorScale] = useState<number>(1.2);
  const [fieldMode, setFieldMode] = useState<"score" | "epsilon">("score");

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 4x
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sdeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Apply preset handler
  const handleSelectPreset = useCallback((presetId: DiffusionPresetId) => {
    const p = DIFFUSION_STUDIO_PRESETS.find((item) => item.id === presetId);
    if (!p) return;
    setDatasetId(p.dataset);
    setFrameworkId(p.framework);
    setScheduleType(p.scheduleType);
    setTotalSteps(p.totalSteps);
    setDdimSteps(p.ddimSteps);
    setDdimEta(p.ddimEta);
    setGuidanceScale(p.guidanceScale);
    setTargetClass(p.targetClass);
    setNumParticles(p.numParticles);
    setGridDensity(p.gridDensity);
    setActiveTab(p.activeTab);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  // 1. Compute Dataset
  const dataset = useMemo(() => {
    return generateDiffusionDataset(datasetId, 240, currentSeed);
  }, [datasetId, currentSeed]);

  // Available classes in dataset
  const availableClasses = useMemo(() => {
    const classSet = new Set<number>();
    dataset.forEach((d) => classSet.add(d.classLabel));
    return Array.from(classSet).sort((a, b) => a - b);
  }, [dataset]);

  // 2. Compute Noise Schedule
  const schedule = useMemo(() => {
    return buildNoiseSchedule(scheduleType, totalSteps);
  }, [scheduleType, totalSteps]);

  // 3. Compute Sub-sampled Timestep Sequence (e.g. for DDIM / SDE)
  const timestepSequence = useMemo(() => {
    if (frameworkId === "ddim" && ddimSteps < totalSteps) {
      const stepStride = Math.max(1, Math.floor(totalSteps / ddimSteps));
      const seq: number[] = [0];
      for (let s = 1; s <= ddimSteps; s++) {
        const val = Math.min(totalSteps, s * stepStride);
        if (seq[seq.length - 1] !== val) {
          seq.push(val);
        }
      }
      if (seq[seq.length - 1] !== totalSteps) {
        seq.push(totalSteps);
      }
      return seq;
    }
    return Array.from({ length: totalSteps + 1 }, (_, i) => i);
  }, [frameworkId, ddimSteps, totalSteps]);

  // Reverse sequence (from T down to 0)
  const reverseSequence = useMemo(() => {
    return [...timestepSequence].reverse();
  }, [timestepSequence]);

  const maxSteps = reverseSequence.length - 1;

  // 4. Precompute Full Simulation Trajectories
  const simulationHistory = useMemo(() => {
    const rng = new SeededRNG(currentSeed + 777);
    const initialParticles: ParticleState[] = [];

    for (let i = 0; i < numParticles; i++) {
      const initNoise = rng.nextGaussian2D([0, 0], 1.0);
      const assignedClass =
        targetClass !== null ? targetClass : i % Math.max(1, availableClasses.length);

      initialParticles.push({
        id: i,
        currentPos: initNoise,
        initialNoise: initNoise,
        classLabel: assignedClass,
        trajectory: [initNoise],
        x0Pred: initNoise,
        x0PredTrajectory: [initNoise],
      });
    }

    const stepsHistory: SimulationHistoryStep[] = [];
    let currentParticles = initialParticles;

    // Step 0 corresponds to t = T
    const startT = reverseSequence[0];
    const startAlphaBar = schedule.alphasBar[startT];

    stepsHistory.push({
      stepIndex: 0,
      t: startT,
      normalizedT: startT / totalSteps,
      particles: currentParticles,
      meanScoreNorm: 0,
      meanEpsNorm: 0,
      alphaBar: startAlphaBar,
      beta: schedule.betas[startT],
      snrDb: 10 * Math.log10(Math.max(1e-12, schedule.snr[startT])),
      driftMagnitude: 0,
      diffusionStd: Math.sqrt(schedule.posteriorVariance[startT] || 0),
    });

    // Simulate forward in generation (backward in diffusion time)
    for (let stepIdx = 0; stepIdx < reverseSequence.length - 1; stepIdx++) {
      const curT = reverseSequence[stepIdx];
      const nextT = reverseSequence[stepIdx + 1];
      const curAlphaBar = schedule.alphasBar[curT];

      let scoreNormSum = 0;
      let epsNormSum = 0;
      let driftMagSum = 0;

      const nextParticles = currentParticles.map((p) => {
        let evalRes: ScoreEvaluation;

        if (frameworkId === "cfg") {
          evalRes = computeCFGScore(
            p.currentPos,
            curAlphaBar,
            dataset,
            p.classLabel,
            guidanceScale,
          );
        } else {
          evalRes = computeExactScore(
            p.currentPos,
            curAlphaBar,
            dataset,
            targetClass !== null ? targetClass : null,
          );
        }

        const score = evalRes.score;
        const eps = evalRes.epsilon;
        const x0Pred = evalRes.x0Pred;

        scoreNormSum += norm2D(score);
        epsNormSum += norm2D(eps);

        let nextPos: Vector2;
        const z = rng.nextGaussian2D([0, 0], 1.0);

        if (frameworkId === "ddpm") {
          nextPos = ddpmReverseStep(p.currentPos, curT, schedule, eps, z);
        } else if (frameworkId === "ddim" || frameworkId === "cfg") {
          nextPos = ddimReverseStep(p.currentPos, curT, nextT, schedule, eps, ddimEta, z);
        } else if (frameworkId === "continuous_vp_sde" || frameworkId === "probability_flow_ode") {
          const normT = curT / totalSteps;
          const dt = (curT - nextT) / totalSteps;
          const { reverseSDEDrift, probabilityFlowODEDrift, diffusion } =
            evaluateContinuousVPDriftAndDiffusion(p.currentPos, normT, score);

          if (frameworkId === "probability_flow_ode") {
            // ODE: dx = f_{ode} dt
            nextPos = [
              p.currentPos[0] - probabilityFlowODEDrift[0] * dt,
              p.currentPos[1] - probabilityFlowODEDrift[1] * dt,
            ];
          } else {
            // Reverse SDE: dx = f_{sde} dt + g dW
            const diffScale = diffusion * Math.sqrt(Math.max(1e-12, dt));
            nextPos = [
              p.currentPos[0] - reverseSDEDrift[0] * dt + diffScale * z[0],
              p.currentPos[1] - reverseSDEDrift[1] * dt + diffScale * z[1],
            ];
          }
        } else {
          // Continuous VE SDE
          const normT = curT / totalSteps;
          const dt = (curT - nextT) / totalSteps;
          const { reverseSDEDrift, diffusion } = evaluateContinuousVEDriftAndDiffusion(
            p.currentPos,
            normT,
            score,
          );
          const diffScale = diffusion * Math.sqrt(Math.max(1e-12, dt));
          nextPos = [
            p.currentPos[0] - reverseSDEDrift[0] * dt + diffScale * z[0],
            p.currentPos[1] - reverseSDEDrift[1] * dt + diffScale * z[1],
          ];
        }

        const driftDist = Math.hypot(nextPos[0] - p.currentPos[0], nextPos[1] - p.currentPos[1]);
        driftMagSum += driftDist;

        return {
          id: p.id,
          currentPos: nextPos,
          initialNoise: p.initialNoise,
          classLabel: p.classLabel,
          trajectory: [...p.trajectory, nextPos],
          x0Pred,
          x0PredTrajectory: p.x0PredTrajectory ? [...p.x0PredTrajectory, x0Pred] : [x0Pred],
        };
      });

      currentParticles = nextParticles;
      const nextAlphaBar = schedule.alphasBar[nextT];

      stepsHistory.push({
        stepIndex: stepIdx + 1,
        t: nextT,
        normalizedT: nextT / totalSteps,
        particles: currentParticles,
        meanScoreNorm: scoreNormSum / numParticles,
        meanEpsNorm: epsNormSum / numParticles,
        alphaBar: nextAlphaBar,
        beta: schedule.betas[nextT] || 0,
        snrDb: 10 * Math.log10(Math.max(1e-12, schedule.snr[nextT] || 1e-12)),
        driftMagnitude: driftMagSum / numParticles,
        diffusionStd: Math.sqrt(schedule.posteriorVariance[nextT] || 0),
      });
    }

    return stepsHistory;
  }, [
    currentSeed,
    numParticles,
    targetClass,
    availableClasses.length,
    reverseSequence,
    schedule,
    totalSteps,
    frameworkId,
    guidanceScale,
    dataset,
    ddimEta,
  ]);

  // Current Step Details
  const currentStepData = useMemo(() => {
    const idx = Math.min(currentStepIndex, simulationHistory.length - 1);
    return simulationHistory[idx] ?? simulationHistory[0];
  }, [currentStepIndex, simulationHistory]);

  // 5. Precompute Vector Field for current timestep
  const currentVectorField = useMemo(() => {
    if (!showVectorField) return [];
    const bounds = { minX: -3.6, maxX: 3.6, minY: -3.6, maxY: 3.6 };
    return computeScoreVectorField(
      bounds,
      gridDensity,
      currentStepData.alphaBar,
      dataset,
      frameworkId === "cfg" ? targetClass : null,
      frameworkId === "cfg" ? guidanceScale : 1.0,
    );
  }, [
    showVectorField,
    gridDensity,
    currentStepData.alphaBar,
    dataset,
    frameworkId,
    targetClass,
    guidanceScale,
  ]);

  // 6. Compute ELBO Breakdown
  const elboBreakdown = useMemo(() => {
    return computeELBOBreakdown(schedule, dataset, 30);
  }, [schedule, dataset]);

  // SDE vs ODE Dual trajectories simulation (for comparison tab)
  const sdeVsOdeComparison = useMemo(() => {
    const rng = new SeededRNG(currentSeed + 999);
    const count = 36;
    const pairs: {
      id: number;
      init: Vector2;
      sdePos: Vector2;
      odePos: Vector2;
      sdeTraj: Vector2[];
      odeTraj: Vector2[];
    }[] = [];

    for (let i = 0; i < count; i++) {
      const init = rng.nextGaussian2D([0, 0], 1.0);
      pairs.push({
        id: i,
        init,
        sdePos: init,
        odePos: init,
        sdeTraj: [init],
        odeTraj: [init],
      });
    }

    const T_steps = 60;
    const dt = 1.0 / T_steps;

    for (let step = 0; step < T_steps; step++) {
      const normT = 1.0 - step * dt;
      const alphaBar_t = Math.exp(-0.1 * normT - 0.5 * 19.9 * normT * normT);

      for (let i = 0; i < count; i++) {
        const item = pairs[i];
        const z = rng.nextGaussian2D([0, 0], 1.0);

        // Evaluate SDE particle
        const sdeScore = computeExactScore(item.sdePos, alphaBar_t, dataset, null).score;
        const sdeEval = evaluateContinuousVPDriftAndDiffusion(item.sdePos, normT, sdeScore);
        const diffScale = sdeEval.diffusion * Math.sqrt(dt);
        const nextSdePos: Vector2 = [
          item.sdePos[0] - sdeEval.reverseSDEDrift[0] * dt + diffScale * z[0],
          item.sdePos[1] - sdeEval.reverseSDEDrift[1] * dt + diffScale * z[1],
        ];

        // Evaluate ODE particle
        const odeScore = computeExactScore(item.odePos, alphaBar_t, dataset, null).score;
        const odeEval = evaluateContinuousVPDriftAndDiffusion(item.odePos, normT, odeScore);
        const nextOdePos: Vector2 = [
          item.odePos[0] - odeEval.probabilityFlowODEDrift[0] * dt,
          item.odePos[1] - odeEval.probabilityFlowODEDrift[1] * dt,
        ];

        item.sdePos = nextSdePos;
        item.odePos = nextOdePos;
        item.sdeTraj.push(nextSdePos);
        item.odeTraj.push(nextOdePos);
      }
    }

    return pairs;
  }, [currentSeed, dataset]);

  // Step change callback
  useEffect(() => {
    onStepChange?.(currentStepIndex, currentStepData.t);
  }, [currentStepIndex, currentStepData.t, onStepChange]);

  // Animation playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(
      () => {
        setCurrentStepIndex((prev) => {
          if (prev >= maxSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      },
      Math.max(20, 100 / playbackSpeed),
    );

    return () => clearInterval(interval);
  }, [isPlaying, maxSteps, playbackSpeed]);

  // --------------------------------------------------------------------------
  // Canvas Rendering Logic
  // --------------------------------------------------------------------------
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Coordinate mapping helper
    const domain = 3.8;
    const toCanvasX = (x: number) => ((x + domain) / (2 * domain)) * width;
    const toCanvasY = (y: number) => ((domain - y) / (2 * domain)) * height;

    // Clear background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    // Draw subtle coordinate grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let g = -3; g <= 3; g++) {
      ctx.moveTo(toCanvasX(g), 0);
      ctx.lineTo(toCanvasX(g), height);
      ctx.moveTo(0, toCanvasY(g));
      ctx.lineTo(width, toCanvasY(g));
    }
    ctx.stroke();

    // Draw Center Axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), height);
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(width, toCanvasY(0));
    ctx.stroke();

    // 1. Draw Target Data Points (Ground Truth p_{data}(x_0))
    if (showTargetData) {
      dataset.forEach((pt) => {
        const cx = toCanvasX(pt.point[0]);
        const cy = toCanvasY(pt.point[1]);
        ctx.fillStyle = pt.color ? `${pt.color}55` : "rgba(56, 189, 248, 0.35)";
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // 2. Draw Vector Field Glyphs (\nabla_x \log p_t(x) or -\epsilon)
    if (showVectorField && currentVectorField.length > 0) {
      const maxNorm = Math.max(1e-5, ...currentVectorField.map((c) => c.norm));

      currentVectorField.forEach((cell) => {
        const cx = toCanvasX(cell.x);
        const cy = toCanvasY(cell.y);
        const fieldVec = fieldMode === "score" ? cell.score : cell.epsilon;
        const norm = norm2D(fieldVec);
        const normFrac = Math.min(1.0, norm / maxNorm);

        // Arrow length
        const baseLen = 14 * vectorScale;
        const arrowLen = baseLen * Math.min(1.5, Math.max(0.2, normFrac * 1.5));
        const dirX = fieldVec[0] / Math.max(1e-8, norm);
        const dirY = fieldVec[1] / Math.max(1e-8, norm);

        const endX = cx + dirX * arrowLen;
        const endY = cy - dirY * arrowLen; // Flip Y for canvas

        // Color based on norm (blue -> cyan -> yellow -> orange)
        const hue = 200 - normFrac * 160;
        const opacity = 0.25 + normFrac * 0.65;
        ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${opacity})`;
        ctx.fillStyle = `hsla(${hue}, 90%, 60%, ${opacity})`;
        ctx.lineWidth = 1.2;

        // Arrow shaft
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Arrow head
        const headLen = 3.5;
        const angle = Math.atan2(-dirY, dirX);
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLen * Math.cos(angle - Math.PI / 6),
          endY - headLen * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          endX - headLen * Math.cos(angle + Math.PI / 6),
          endY - headLen * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fill();
      });
    }

    // 3. Draw Particle Trajectory Trails
    if (showTrails) {
      currentStepData.particles.forEach((p) => {
        if (p.trajectory.length < 2) return;
        ctx.strokeStyle = "rgba(147, 197, 253, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(p.trajectory[0][0]), toCanvasY(p.trajectory[0][1]));
        for (let i = 1; i < p.trajectory.length; i++) {
          ctx.lineTo(toCanvasX(p.trajectory[i][0]), toCanvasY(p.trajectory[i][1]));
        }
        ctx.stroke();
      });
    }

    // 4. Draw Predicted \hat{x}_0 Projections
    if (showX0Pred) {
      currentStepData.particles.forEach((p) => {
        const px = toCanvasX(p.currentPos[0]);
        const py = toCanvasY(p.currentPos[1]);
        const predX = toCanvasX(p.x0Pred[0]);
        const predY = toCanvasY(p.x0Pred[1]);

        ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(predX, predY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(predX, predY, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // 5. Draw Active Swarm Particles
    if (showParticles) {
      currentStepData.particles.forEach((p) => {
        const cx = toCanvasX(p.currentPos[0]);
        const cy = toCanvasY(p.currentPos[1]);

        // Particle glow
        const radGlow = ctx.createRadialGradient(cx, cy, 1, cx, cy, 6);
        radGlow.addColorStop(0, "rgba(56, 189, 248, 0.9)");
        radGlow.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = radGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Particle core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cx, cy, 2.2, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [
    currentStepData,
    dataset,
    showTargetData,
    showVectorField,
    currentVectorField,
    fieldMode,
    vectorScale,
    showTrails,
    showX0Pred,
    showParticles,
  ]);

  // Render on updates
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // SDE vs ODE Comparison Canvas Rendering
  const renderSdeCanvas = useCallback(() => {
    const canvas = sdeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const domain = 3.8;
    const toCanvasX = (x: number) => ((x + domain) / (2 * domain)) * width;
    const toCanvasY = (y: number) => ((domain - y) / (2 * domain)) * height;

    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    // Subtle grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let g = -3; g <= 3; g++) {
      ctx.moveTo(toCanvasX(g), 0);
      ctx.lineTo(toCanvasX(g), height);
      ctx.moveTo(0, toCanvasY(g));
      ctx.lineTo(width, toCanvasY(g));
    }
    ctx.stroke();

    // Data points overlay
    dataset.forEach((pt) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.arc(toCanvasX(pt.point[0]), toCanvasY(pt.point[1]), 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw SDE Trajectories (Rose / Orange, stochastic wiggle)
    sdeVsOdeComparison.forEach((item) => {
      ctx.strokeStyle = "rgba(244, 63, 94, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(item.sdeTraj[0][0]), toCanvasY(item.sdeTraj[0][1]));
      for (let i = 1; i < item.sdeTraj.length; i++) {
        ctx.lineTo(toCanvasX(item.sdeTraj[i][0]), toCanvasY(item.sdeTraj[i][1]));
      }
      ctx.stroke();

      // SDE endpoint
      const endPt = item.sdeTraj[item.sdeTraj.length - 1];
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(toCanvasX(endPt[0]), toCanvasY(endPt[1]), 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw Probability Flow ODE Trajectories (Cyan, smooth deterministic streamlines)
    sdeVsOdeComparison.forEach((item) => {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(item.odeTraj[0][0]), toCanvasY(item.odeTraj[0][1]));
      for (let i = 1; i < item.odeTraj.length; i++) {
        ctx.lineTo(toCanvasX(item.odeTraj[i][0]), toCanvasY(item.odeTraj[i][1]));
      }
      ctx.stroke();

      // ODE endpoint
      const endPt = item.odeTraj[item.odeTraj.length - 1];
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(toCanvasX(endPt[0]), toCanvasY(endPt[1]), 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [dataset, sdeVsOdeComparison]);

  useEffect(() => {
    if (activeTab === "sde_vs_ode") {
      renderSdeCanvas();
    }
  }, [activeTab, renderSdeCanvas]);

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 border border-slate-800 rounded-xl shadow-2xl overflow-hidden ${className}`}
      data-testid="diffusion-studio-root"
    >
      {/* -------------------------------------------------------------------- */}
      {/* HEADER & PRESETS BAR */}
      {/* -------------------------------------------------------------------- */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Diffusion Models & Continuous SDE Studio
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Score Matching
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive 2D reverse diffusion, DDPM/DDIM sampling, CFG extrapolation & VP/VE SDE
              flow
            </p>
          </div>
        </div>

        {/* Presets Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-400">Preset:</label>
          <select
            value={
              DIFFUSION_STUDIO_PRESETS.find(
                (p) =>
                  p.dataset === datasetId &&
                  p.framework === frameworkId &&
                  p.scheduleType === scheduleType,
              )?.id ?? ""
            }
            onChange={(e) => handleSelectPreset(e.target.value as DiffusionPresetId)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            data-testid="preset-select"
          >
            <option value="" disabled>
              Select Architecture Preset...
            </option>
            {DIFFUSION_STUDIO_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} ({preset.category})
              </option>
            ))}
          </select>

          <button
            onClick={() => setCurrentSeed((s) => s + 1)}
            title="Reseed Swarm & Data"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
            data-testid="reseed-btn"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* NAVIGATION TABS */}
      {/* -------------------------------------------------------------------- */}
      <nav className="flex items-center gap-1 px-5 py-2 bg-slate-900/60 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab("generation")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === "generation"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
          data-testid="tab-generation"
        >
          <Activity className="w-3.5 h-3.5" />
          Reverse Generation & Score Field
        </button>

        <button
          onClick={() => setActiveTab("sde_vs_ode")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === "sde_vs_ode"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
          data-testid="tab-sde-vs-ode"
        >
          <Compass className="w-3.5 h-3.5" />
          Continuous VP-SDE vs Probability Flow ODE
        </button>

        <button
          onClick={() => setActiveTab("schedules_snr")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === "schedules_snr"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
          data-testid="tab-schedules"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Noise Schedules & SNR Curves
        </button>

        <button
          onClick={() => setActiveTab("elbo_diagnostics")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === "elbo_diagnostics"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
          data-testid="tab-elbo"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          ELBO KL Breakdown & Score Norms
        </button>

        <button
          onClick={() => setActiveTab("cfg_explorer")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === "cfg_explorer"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
          data-testid="tab-cfg"
        >
          <Sliders className="w-3.5 h-3.5" />
          Classifier-Free Guidance Extrapolation
        </button>
      </nav>

      {/* -------------------------------------------------------------------- */}
      {/* MAIN WORKSPACE BODY */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 min-h-[580px]">
        {/* Left / Center Viewport (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col border-r border-slate-800 relative bg-slate-950">
          {/* TAB 1: Main Reverse Generation & Vector Field */}
          {activeTab === "generation" && (
            <div className="flex-1 flex flex-col p-4 relative">
              {/* Canvas Container with HUD Overlays */}
              <div className="relative flex-1 w-full min-h-[440px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={500}
                  className="w-full h-full object-contain"
                  data-testid="diffusion-canvas"
                />

                {/* HUD Overlay Top Left: Physics & State Diagnostics */}
                <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur border border-slate-800/80 rounded-lg p-2.5 text-[11px] font-mono shadow-lg text-slate-300 pointer-events-none space-y-1">
                  <div className="flex items-center justify-between gap-4 font-bold text-white border-b border-slate-800 pb-1">
                    <span>
                      STEP {currentStepIndex}/{maxSteps}
                    </span>
                    <span className="text-cyan-400">t = {currentStepData.t}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                    <span className="text-slate-400">ᾱ(t):</span>
                    <span className="text-right text-emerald-400">
                      {currentStepData.alphaBar.toFixed(5)}
                    </span>
                    <span className="text-slate-400">√(1 - ᾱ):</span>
                    <span className="text-right text-amber-400">
                      {Math.sqrt(Math.max(0, 1 - currentStepData.alphaBar)).toFixed(5)}
                    </span>
                    <span className="text-slate-400">SNR:</span>
                    <span className="text-right text-indigo-400">
                      {currentStepData.snrDb.toFixed(2)} dB
                    </span>
                    <span className="text-slate-400">‖∇log p‖:</span>
                    <span className="text-right text-purple-400">
                      {currentStepData.meanScoreNorm.toFixed(3)}
                    </span>
                    <span className="text-slate-400">Mean Drift:</span>
                    <span className="text-right text-cyan-300">
                      {currentStepData.driftMagnitude.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* HUD Overlay Top Right: Active Framework & Mode */}
                <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[10px] font-mono shadow-lg text-slate-300 pointer-events-none flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="uppercase font-semibold text-white">
                    {frameworkId.replace(/_/g, " ")}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-indigo-300">{scheduleType}</span>
                </div>

                {/* HUD Bottom Left: Vector Field Legend */}
                {showVectorField && (
                  <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[10px] shadow-lg text-slate-300 flex items-center gap-2">
                    <span className="text-slate-400 font-mono">Glyphs:</span>
                    <span className="text-cyan-400 font-semibold">
                      {fieldMode === "score" ? "∇x log pt(x)" : "-εθ(xt, t)"}
                    </span>
                    <span className="text-slate-500">|</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-blue-400">Min</span>
                      <div className="w-12 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-rose-500" />
                      <span className="text-[9px] text-rose-400">Max</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Scrubber & Playback Controls Bar */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                {/* Play / Step Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentStepIndex(0)}
                    title="Reset to t = T (Pure Noise)"
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition"
                    data-testid="reset-step-btn"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
                    disabled={currentStepIndex === 0}
                    title="Step Backward (Higher Noise)"
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded transition"
                    data-testid="step-back-btn"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition"
                    data-testid="play-pause-btn"
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>{isPlaying ? "Pause" : "Play Reverse"}</span>
                  </button>
                  <button
                    onClick={() => setCurrentStepIndex((i) => Math.min(maxSteps, i + 1))}
                    disabled={currentStepIndex >= maxSteps}
                    title="Step Forward (Denoising)"
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded transition"
                    data-testid="step-fwd-btn"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrubber Slider */}
                <div className="flex-1 min-w-[200px] flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">t=T</span>
                  <input
                    type="range"
                    min={0}
                    max={maxSteps}
                    value={currentStepIndex}
                    onChange={(e) => {
                      setCurrentStepIndex(Number(e.target.value));
                      setIsPlaying(false);
                    }}
                    className="flex-1 accent-indigo-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                    data-testid="timestep-slider"
                  />
                  <span className="text-[10px] font-mono text-slate-400">t=0</span>
                </div>

                {/* Speed Toggle */}
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[11px]">Speed:</span>
                  {[1, 2, 4].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                        playbackSpeed === spd
                          ? "bg-indigo-600 text-white font-bold"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SDE vs ODE Comparison */}
          {activeTab === "sde_vs_ode" && (
            <div className="flex-1 flex flex-col p-4">
              <div className="relative flex-1 w-full min-h-[440px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
                <canvas
                  ref={sdeCanvasRef}
                  width={640}
                  height={500}
                  className="w-full h-full object-contain"
                  data-testid="sde-vs-ode-canvas"
                />

                {/* Overlay legend */}
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-3 text-xs shadow-lg space-y-2 max-w-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    SDE vs ODE Trajectory Dynamics
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-1 bg-cyan-400 rounded-full" />
                      <span className="text-slate-300">
                        <strong className="text-cyan-400">Probability Flow ODE:</strong>{" "}
                        Deterministic streamlines (Song et al., 2020)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-1 bg-rose-500 rounded-full" />
                      <span className="text-slate-300">
                        <strong className="text-rose-400">Reverse SDE (VP/VE):</strong> Langevin
                        stochastic noise injection
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
                    Both processes share the exact same marginal probability densities pt(x) at all
                    continuous times t ∈ [0, 1].
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Noise Schedules & SNR Curves */}
          {activeTab === "schedules_snr" && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Alpha Bar Curve */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Cumulative Variance ᾱ(t)
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-400">ᾱ_t = ∏(1 - β_s)</span>
                  </div>
                  <div className="h-44 flex items-end gap-1 pt-4 px-2 border-b border-l border-slate-700 relative">
                    {schedule.alphasBar.slice(1).map((val, idx) => {
                      const isCurrent = idx + 1 === currentStepData.t;
                      return (
                        <div
                          key={idx}
                          title={`t=${idx + 1}, alphaBar=${val.toFixed(4)}`}
                          style={{ height: `${Math.max(2, val * 100)}%` }}
                          className={`flex-1 rounded-t-sm transition-all ${
                            isCurrent
                              ? "bg-emerald-400 shadow-md ring-1 ring-white"
                              : "bg-emerald-600/40 hover:bg-emerald-500"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>t=1</span>
                    <span>t={totalSteps / 2}</span>
                    <span>t={totalSteps}</span>
                  </div>
                </div>

                {/* Beta Step Schedule */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Step Variance β(t)
                    </h3>
                    <span className="text-[11px] font-mono text-cyan-400">
                      {scheduleType} schedule
                    </span>
                  </div>
                  <div className="h-44 flex items-end gap-1 pt-4 px-2 border-b border-l border-slate-700 relative">
                    {schedule.betas.slice(1).map((val, idx) => {
                      const maxB = Math.max(0.02, ...schedule.betas);
                      const isCurrent = idx + 1 === currentStepData.t;
                      return (
                        <div
                          key={idx}
                          title={`t=${idx + 1}, beta=${val.toFixed(5)}`}
                          style={{ height: `${Math.max(2, (val / maxB) * 100)}%` }}
                          className={`flex-1 rounded-t-sm transition-all ${
                            isCurrent
                              ? "bg-cyan-400 shadow-md ring-1 ring-white"
                              : "bg-cyan-600/40 hover:bg-cyan-500"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>t=1</span>
                    <span>t={totalSteps / 2}</span>
                    <span>t={totalSteps}</span>
                  </div>
                </div>

                {/* Log Signal-to-Noise Ratio (SNR) */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Signal-to-Noise Ratio λ(t) = log(ᾱ_t / (1 - ᾱ_t))
                    </h3>
                    <span className="text-[11px] font-mono text-purple-400">
                      Current: {currentStepData.snrDb.toFixed(2)} dB
                    </span>
                  </div>
                  <div className="h-44 flex items-end gap-1 pt-4 px-2 border-b border-l border-slate-700 relative">
                    {schedule.logSnr.slice(1).map((val, idx) => {
                      const clamped = Math.max(-10, Math.min(10, val));
                      const normH = ((clamped + 10) / 20) * 100;
                      const isCurrent = idx + 1 === currentStepData.t;
                      return (
                        <div
                          key={idx}
                          title={`t=${idx + 1}, logSNR=${val.toFixed(3)}`}
                          style={{ height: `${Math.max(2, normH)}%` }}
                          className={`flex-1 rounded-t-sm transition-all ${
                            isCurrent
                              ? "bg-purple-400 shadow-md ring-1 ring-white"
                              : "bg-purple-600/40 hover:bg-purple-500"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>High Signal (t=1)</span>
                    <span>Transition Threshold (λ=0)</span>
                    <span>Pure Noise (t=T)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ELBO & Loss Breakdown */}
          {activeTab === "elbo_diagnostics" && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
                  <span className="text-[11px] text-slate-400 block font-mono">
                    Reconstruction Loss L₀
                  </span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {elboBreakdown.L0.toFixed(4)}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    -E_{`q(x_1|x_0)`}[log p_θ(x_0|x_1)]
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
                  <span className="text-[11px] text-slate-400 block font-mono">
                    Prior Matching L_T
                  </span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {elboBreakdown.LT.toFixed(4)}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">D_{`KL`}(q(x_T|x_0) || N(0, I))</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
                  <span className="text-[11px] text-slate-400 block font-mono">
                    Total Variational ELBO
                  </span>
                  <span className="text-lg font-bold text-indigo-400 font-mono">
                    {elboBreakdown.totalELBO.toFixed(4)}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Sum of KL transitions + L₀ + L_T
                  </p>
                </div>
              </div>

              {/* Per-step KL Divergence Bar Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Step-by-Step KL Divergence Lt = D_KL(q(x_{`t-1`}|x_t, x_0) || p_θ(x_{`t-1`}
                    |x_t))
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    T = {totalSteps} timesteps
                  </span>
                </div>
                <div className="h-44 flex items-end gap-1 pt-4 px-2 border-b border-l border-slate-700 relative">
                  {elboBreakdown.Lt.slice(2).map((val, idx) => {
                    const maxLt = Math.max(1e-4, ...elboBreakdown.Lt);
                    const isCurrent = idx + 2 === currentStepData.t;
                    return (
                      <div
                        key={idx}
                        title={`t=${idx + 2}, KL=${val.toFixed(5)}`}
                        style={{ height: `${Math.max(2, (val / maxLt) * 100)}%` }}
                        className={`flex-1 rounded-t-sm transition-all ${
                          isCurrent
                            ? "bg-rose-400 shadow-md ring-1 ring-white"
                            : "bg-rose-600/40 hover:bg-rose-500"
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>t=2</span>
                  <span>t={totalSteps / 2}</span>
                  <span>t={totalSteps}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CFG Explorer */}
          {activeTab === "cfg_explorer" && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    Classifier-Free Guidance Extrapolation Formula
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    w = {guidanceScale.toFixed(2)}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono text-slate-300">
                  s̃(x_t, c, w) = s_uncond(x_t) +{" "}
                  <span className="text-indigo-400 font-bold">{guidanceScale.toFixed(1)}</span> ·
                  [s_cond(x_t | class={targetClass ?? 0}) - s_uncond(x_t)]
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Unconditional Mode (w=0)
                    </span>
                    <p className="text-slate-300 text-[11px]">
                      Particles distribute evenly across all modes without class bias. Full sample
                      diversity.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Standard Conditional (w=1)
                    </span>
                    <p className="text-slate-300 text-[11px]">
                      Particles follow class conditional density p(x_0 | c) matching class label.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Guidance Boost (w &gt; 1)
                    </span>
                    <p className="text-slate-300 text-[11px]">
                      Extrapolates score field into the mode core, sharply reducing entropy and
                      boosting fidelity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Class target buttons */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Select Target Condition Class c:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTargetClass(null)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                      targetClass === null
                        ? "bg-slate-200 text-slate-950 font-bold"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Unconditional (All Modes)
                  </button>
                  {availableClasses.map((c) => (
                    <button
                      key={c}
                      onClick={() => setTargetClass(c)}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                        targetClass === c
                          ? "bg-indigo-600 text-white font-bold"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Class Mode #{c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Interactive Controls (4 Cols) */}
        <div className="lg:col-span-4 p-5 bg-slate-900/90 border-t lg:border-t-0 flex flex-col gap-4 overflow-y-auto max-h-[620px] text-xs">
          {/* Framework Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Diffusion Framework
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "ddpm", label: "DDPM (Markov)" },
                { id: "ddim", label: "DDIM (Implicit)" },
                { id: "cfg", label: "CFG Guided" },
                { id: "continuous_vp_sde", label: "VP-SDE Continuous" },
                { id: "continuous_ve_sde", label: "VE-SDE Langevin" },
                { id: "probability_flow_ode", label: "Prob Flow ODE" },
              ].map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setFrameworkId(fw.id as DiffusionFrameworkId)}
                  className={`px-2.5 py-2 rounded text-left font-medium transition ${
                    frameworkId === fw.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  data-testid={`fw-${fw.id}`}
                >
                  {fw.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dataset Distribution */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              2D Target Distribution
            </label>
            <select
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value as DiffusionDatasetId)}
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              data-testid="dataset-select"
            >
              <option value="two_moons">Two Moons (Crescent Interlocking)</option>
              <option value="swiss_roll">Swiss Roll (Archimedean Spiral)</option>
              <option value="pinwheel">Pinwheel (5 Spiraling Arms)</option>
              <option value="concentric_rings">Concentric Rings (3 Shells)</option>
              <option value="eight_gaussians">8-Gaussians (Circular Modes)</option>
              <option value="four_corners">4-Corner Clusters (Isolated)</option>
            </select>
          </div>

          {/* Noise Schedule Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Noise Schedule β(t)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["linear", "cosine", "sigmoid"] as const).map((sched) => (
                <button
                  key={sched}
                  onClick={() => setScheduleType(sched)}
                  className={`py-1.5 rounded text-center font-medium capitalize transition ${
                    scheduleType === sched
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                  data-testid={`sched-${sched}`}
                >
                  {sched}
                </button>
              ))}
            </div>
          </div>

          {/* Timestep Count & DDIM Sub-sampling */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Total Timesteps (T):</span>
                <span className="font-mono text-indigo-400">{totalSteps}</span>
              </div>
              <input
                type="range"
                min={20}
                max={200}
                step={10}
                value={totalSteps}
                onChange={(e) => setTotalSteps(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
            </div>

            {/* DDIM Steps Slider */}
            {frameworkId === "ddim" && (
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>DDIM Sub-sample Steps (S):</span>
                  <span className="font-mono text-cyan-400">{ddimSteps}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={totalSteps}
                  step={5}
                  value={ddimSteps}
                  onChange={(e) => setDdimSteps(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>
            )}

            {/* DDIM Stochasticity Eta */}
            {(frameworkId === "ddim" || frameworkId === "cfg") && (
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Stochasticity η (0=ODE, 1=DDPM):</span>
                  <span className="font-mono text-purple-400">{ddimEta.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  value={ddimEta}
                  onChange={(e) => setDdimEta(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>
            )}

            {/* CFG Guidance Scale */}
            {frameworkId === "cfg" && (
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Guidance Scale (w):</span>
                  <span className="font-mono text-amber-400">{guidanceScale.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={8.0}
                  step={0.5}
                  value={guidanceScale}
                  onChange={(e) => setGuidanceScale(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>
            )}

            {/* Swarm Particle Count */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Particle Swarm Count:</span>
                <span className="font-mono text-emerald-400">{numParticles}</span>
              </div>
              <input
                type="range"
                min={50}
                max={400}
                step={25}
                value={numParticles}
                onChange={(e) => setNumParticles(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
            </div>
          </div>

          {/* Visualization Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Viewport Layers
            </label>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVectorField}
                  onChange={(e) => setShowVectorField(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                Vector Field
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showParticles}
                  onChange={(e) => setShowParticles(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                Swarm Particles
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTrails}
                  onChange={(e) => setShowTrails(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                Trajectory Trails
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTargetData}
                  onChange={(e) => setShowTargetData(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                Target Data p(x₀)
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showX0Pred}
                  onChange={(e) => setShowX0Pred(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                Predicted x̂₀ Pins
              </label>
            </div>

            {/* Field display mode & Vector scale */}
            {showVectorField && (
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Field Mode:</span>
                  <button
                    onClick={() => setFieldMode("score")}
                    className={`px-2 py-0.5 rounded text-[10px] transition ${
                      fieldMode === "score"
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    Score ∇log p
                  </button>
                  <button
                    onClick={() => setFieldMode("epsilon")}
                    className={`px-2 py-0.5 rounded text-[10px] transition ${
                      fieldMode === "epsilon"
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    Noise -ε
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Vector Arrow Scale:</span>
                    <span className="font-mono text-cyan-400">{vectorScale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.1}
                    value={vectorScale}
                    onChange={(e) => setVectorScale(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
