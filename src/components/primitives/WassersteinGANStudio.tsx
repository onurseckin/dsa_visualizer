import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Activity,
  Sliders,
  Compass,
  Layers,
  Shield,
  BarChart2,
  TrendingUp,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type Vector2 = [number, number];

export type GANParadigmId = "standard_gan" | "wgan_clip" | "wgan_gp" | "sngan";

export type DatasetId =
  | "eight_gaussians"
  | "twenty_five_gaussians"
  | "swiss_roll"
  | "two_moons"
  | "concentric_rings"
  | "pinwheel";

export type StudioTabId =
  | "phase_space"
  | "gradient_penalty"
  | "mode_collapse"
  | "training_curves"
  | "theory";

export type PresetId =
  | "wgan_gp_8_gaussians"
  | "standard_gan_mode_collapse"
  | "wgan_clipping_underuse"
  | "sngan_25_gaussians"
  | "wgan_gp_swiss_roll"
  | "two_moons_comparison";

export interface DatasetModeInfo {
  readonly id: number;
  readonly center: Vector2;
  readonly radius: number;
  readonly label: string;
}

export interface DatasetBatch {
  readonly points: readonly Vector2[];
  readonly modeAssignments: readonly number[];
  readonly modeInfos: readonly DatasetModeInfo[];
}

export interface MLPLayer {
  weights: number[][]; // [outDim][inDim]
  biases: number[]; // [outDim]
  u?: number[]; // left singular vector for spectral norm [outDim]
  v?: number[]; // right singular vector for spectral norm [inDim]
  sigma?: number; // estimated spectral norm
}

export interface MLPNetwork {
  readonly inputDim: number;
  readonly hiddenDims: readonly number[];
  readonly outputDim: number;
  readonly activation: "leaky_relu" | "relu" | "tanh";
  readonly outputActivation: "linear" | "sigmoid";
  readonly layers: MLPLayer[];
}

export interface MLPForwardCache {
  readonly activations: readonly number[][]; // [layerIdx][dim]
  readonly preActivations: readonly number[][]; // [layerIdx][dim]
  readonly output: readonly number[];
}

export interface AdamOptimizerState {
  m: { weights: number[][]; biases: number[] }[];
  v: { weights: number[][]; biases: number[] }[];
  t: number;
}

export interface RMSPropOptimizerState {
  v: { weights: number[][]; biases: number[] }[];
}

export interface GANTrainingState {
  critic: MLPNetwork;
  generator: MLPNetwork;
  criticAdam?: AdamOptimizerState;
  criticRMSProp?: RMSPropOptimizerState;
  genAdam: AdamOptimizerState;
  iteration: number;
  totalRealSeen: number;
}

export interface MetricsSnapshot {
  readonly iteration: number;
  readonly criticLoss: number;
  readonly genLoss: number;
  readonly wassersteinD: number;
  readonly slicedWassersteinD: number;
  readonly jsDivergence: number;
  readonly gpNormMean: number;
  readonly gpNormVariance: number;
  readonly gpLoss: number;
  readonly maxLipschitz: number;
  readonly capturedModes: number;
  readonly totalModes: number;
  readonly modeEntropy: number;
  readonly maxPossibleEntropy: number;
  readonly modeCollapseRatio: number;
  readonly modeHistogram: readonly number[];
}

export interface VectorFieldPoint {
  readonly x: number;
  readonly y: number;
  readonly criticVal: number;
  readonly gradX: number;
  readonly gradY: number;
  readonly gradNorm: number;
}

export interface GPInterpolationLine {
  readonly real: Vector2;
  readonly fake: Vector2;
  readonly interp: Vector2;
  readonly gradNorm: number;
  readonly epsilon: number;
}

export interface PresetConfig {
  readonly id: PresetId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly paradigm: GANParadigmId;
  readonly dataset: DatasetId;
  readonly lr: number;
  readonly nCritic: number;
  readonly lambdaGP: number;
  readonly clipC: number;
  readonly batchSize: number;
  readonly hiddenDim: number;
}

export interface GANParadigmInfo {
  readonly id: GANParadigmId;
  readonly name: string;
  readonly paperYear: string;
  readonly authors: string;
  readonly objectiveFormula: string;
  readonly lipschitzEnforcement: string;
  readonly keyAdvantage: string;
  readonly knownFailureMode: string;
  readonly color: string;
}

export interface WassersteinGANStudioProps {
  readonly initialPreset?: PresetId;
  readonly initialParadigm?: GANParadigmId;
  readonly initialDataset?: DatasetId;
  readonly seed?: number;
  readonly onStepChange?: (snapshot: MetricsSnapshot) => void;
  readonly className?: string;
}

// ============================================================================
// 2. DETERMINISTIC PRNG & VECTOR UTILITIES
// ============================================================================

export class SeededRNG {
  private state: number;

  constructor(seed: number = 42) {
    this.state = (seed ^ 0x6d2b79f5) >>> 0;
    if (this.state === 0) {
      this.state = 1;
    }
  }

  public next(): number {
    // Mulberry32 32-bit generator
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextGaussian(mean: number = 0, std: number = 1): number {
    let u1 = this.next();
    let u2 = this.next();
    while (u1 <= 1e-15) {
      u1 = this.next();
    }
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * std;
  }

  public nextUniform(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.nextUniform(min, max + 1));
  }
}

export function norm2D(v: Vector2): number {
  return Math.hypot(v[0], v[1]);
}

export function dist2D(a: Vector2, b: Vector2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function dot2D(a: Vector2, b: Vector2): number {
  return a[0] * b[0] + a[1] * b[1];
}

export function add2D(a: Vector2, b: Vector2): Vector2 {
  return [a[0] + b[0], a[1] + b[1]];
}

export function sub2D(a: Vector2, b: Vector2): Vector2 {
  return [a[0] - b[0], a[1] - b[1]];
}

export function scale2D(v: Vector2, s: number): Vector2 {
  return [v[0] * s, v[1] * s];
}

export function lerp2D(a: Vector2, b: Vector2, t: number): Vector2 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// ============================================================================
// 3. 2D DATASET GENERATORS
// ============================================================================

export function generateEightGaussians(
  n: number,
  rng: SeededRNG,
  radius: number = 2.0,
  std: number = 0.08,
): DatasetBatch {
  const points: Vector2[] = [];
  const modeAssignments: number[] = [];
  const modeInfos: DatasetModeInfo[] = [];

  for (let k = 0; k < 8; k++) {
    const angle = (2 * Math.PI * k) / 8;
    modeInfos.push({
      id: k,
      center: [radius * Math.cos(angle), radius * Math.sin(angle)],
      radius: std * 3.5,
      label: `Mode ${k + 1} (${Math.round((angle * 180) / Math.PI)}°)`,
    });
  }

  for (let i = 0; i < n; i++) {
    const modeIdx = rng.nextInt(0, 7);
    const center = modeInfos[modeIdx].center;
    const x = rng.nextGaussian(center[0], std);
    const y = rng.nextGaussian(center[1], std);
    points.push([x, y]);
    modeAssignments.push(modeIdx);
  }

  return { points, modeAssignments, modeInfos };
}

export function generateTwentyFiveGaussians(
  n: number,
  rng: SeededRNG,
  gridSpacing: number = 1.0,
  std: number = 0.05,
): DatasetBatch {
  const points: Vector2[] = [];
  const modeAssignments: number[] = [];
  const modeInfos: DatasetModeInfo[] = [];

  let modeId = 0;
  for (let row = -2; row <= 2; row++) {
    for (let col = -2; col <= 2; col++) {
      const cx = col * gridSpacing;
      const cy = row * gridSpacing;
      modeInfos.push({
        id: modeId,
        center: [cx, cy],
        radius: std * 3.5,
        label: `Mode (${col}, ${row})`,
      });
      modeId++;
    }
  }

  for (let i = 0; i < n; i++) {
    const modeIdx = rng.nextInt(0, 24);
    const center = modeInfos[modeIdx].center;
    const x = rng.nextGaussian(center[0], std);
    const y = rng.nextGaussian(center[1], std);
    points.push([x, y]);
    modeAssignments.push(modeIdx);
  }

  return { points, modeAssignments, modeInfos };
}

export function generateSwissRoll(
  n: number,
  rng: SeededRNG,
  noiseStd: number = 0.05,
): DatasetBatch {
  const points: Vector2[] = [];
  const modeAssignments: number[] = [];
  const modeInfos: DatasetModeInfo[] = [];

  const numAnchors = 8;
  for (let k = 0; k < numAnchors; k++) {
    const t = 1.5 * Math.PI + (3.0 * Math.PI * k) / (numAnchors - 1);
    const scale = 2.4 / (4.5 * Math.PI);
    const cx = t * Math.cos(t) * scale;
    const cy = t * Math.sin(t) * scale;
    modeInfos.push({
      id: k,
      center: [cx, cy],
      radius: 0.35,
      label: `Spiral Sector ${k + 1}`,
    });
  }

  for (let i = 0; i < n; i++) {
    const t = 1.5 * Math.PI + 3.0 * Math.PI * Math.sqrt(rng.next());
    const scale = 2.4 / (4.5 * Math.PI);
    const cx = t * Math.cos(t) * scale;
    const cy = t * Math.sin(t) * scale;
    const x = cx + rng.nextGaussian(0, noiseStd);
    const y = cy + rng.nextGaussian(0, noiseStd);
    points.push([x, y]);

    let bestDist = Infinity;
    let bestIdx = 0;
    for (let k = 0; k < numAnchors; k++) {
      const d = dist2D([x, y], modeInfos[k].center);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = k;
      }
    }
    modeAssignments.push(bestIdx);
  }

  return { points, modeAssignments, modeInfos };
}

export function generateTwoMoons(n: number, rng: SeededRNG, noiseStd: number = 0.06): DatasetBatch {
  const points: Vector2[] = [];
  const modeAssignments: number[] = [];
  const modeInfos: DatasetModeInfo[] = [];

  for (let k = 0; k < 4; k++) {
    const angle = (Math.PI * k) / 3;
    modeInfos.push({
      id: k,
      center: [-0.6 + 1.2 * Math.cos(angle), 0.2 + 1.2 * Math.sin(angle)],
      radius: 0.3,
      label: `Upper Moon ${k + 1}`,
    });
  }
  for (let k = 0; k < 4; k++) {
    const angle = Math.PI + (Math.PI * k) / 3;
    modeInfos.push({
      id: k + 4,
      center: [0.6 + 1.2 * Math.cos(angle), -0.2 + 1.2 * Math.sin(angle)],
      radius: 0.3,
      label: `Lower Moon ${k + 1}`,
    });
  }

  for (let i = 0; i < n; i++) {
    const isUpper = rng.next() > 0.5;
    const angle = rng.nextUniform(0, Math.PI);
    let cx = 0;
    let cy = 0;
    if (isUpper) {
      cx = -0.6 + 1.2 * Math.cos(angle);
      cy = 0.2 + 1.2 * Math.sin(angle);
    } else {
      cx = 0.6 + 1.2 * Math.cos(angle + Math.PI);
      cy = -0.2 + 1.2 * Math.sin(angle + Math.PI);
    }
    const x = cx + rng.nextGaussian(0, noiseStd);
    const y = cy + rng.nextGaussian(0, noiseStd);
    points.push([x, y]);

    let bestDist = Infinity;
    let bestIdx = 0;
    for (let k = 0; k < modeInfos.length; k++) {
      const d = dist2D([x, y], modeInfos[k].center);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = k;
      }
    }
    modeAssignments.push(bestIdx);
  }

  return { points, modeAssignments, modeInfos };
}

export function generateConcentricRings(
  n: number,
  rng: SeededRNG,
  innerRadius: number = 1.0,
  outerRadius: number = 2.2,
  std: number = 0.08,
): DatasetBatch {
  const points: Vector2[] = [];
  const modeAssignments: number[] = [];
  const modeInfos: DatasetModeInfo[] = [];

  for (let k = 0; k < 4; k++) {
    const a = (2 * Math.PI * k) / 4;
    modeInfos.push({
      id: k,
      center: [innerRadius * Math.cos(a), innerRadius * Math.sin(a)],
      radius: 0.3,
      label: `Inner Ring ${k + 1}`,
    });
  }
  for (let k = 0; k < 8; k++) {
    const a = (2 * Math.PI * k) / 8;
    modeInfos.push({
      id: k + 4,
      center: [outerRadius * Math.cos(a), outerRadius * Math.sin(a)],
      radius: 0.35,
      label: `Outer Ring ${k + 1}`,
    });
  }

  for (let i = 0; i < n; i++) {
    const isInner = rng.next() > 0.6;
    const r = (isInner ? innerRadius : outerRadius) + rng.nextGaussian(0, std);
    const theta = rng.nextUniform(0, 2 * Math.PI);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    points.push([x, y]);

    let bestDist = Infinity;
    let bestIdx = 0;
    for (let k = 0; k < modeInfos.length; k++) {
      const d = dist2D([x, y], modeInfos[k].center);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = k;
      }
    }
    modeAssignments.push(bestIdx);
  }

  return { points, modeAssignments, modeInfos };
}

export function generatePinwheel(
  n: number,
  rng: SeededRNG,
  numArms: number = 5,
  noiseStd: number = 0.06,
): DatasetBatch {
  const points: Vector2[] = [];
  const modeAssignments: number[] = [];
  const modeInfos: DatasetModeInfo[] = [];

  for (let k = 0; k < numArms; k++) {
    const baseAngle = (2 * Math.PI * k) / numArms;
    const midR = 1.4;
    const midTheta = baseAngle + midR * 0.75;
    modeInfos.push({
      id: k,
      center: [midR * Math.cos(midTheta), midR * Math.sin(midTheta)],
      radius: 0.45,
      label: `Arm ${k + 1}`,
    });
  }

  for (let i = 0; i < n; i++) {
    const arm = rng.nextInt(0, numArms - 1);
    const r = rng.nextUniform(0.3, 2.3);
    const baseAngle = (2 * Math.PI * arm) / numArms;
    const theta = baseAngle + r * 0.75 + rng.nextGaussian(0, noiseStd * 1.5);
    const radialNoise = rng.nextGaussian(0, noiseStd);
    const x = (r + radialNoise) * Math.cos(theta);
    const y = (r + radialNoise) * Math.sin(theta);
    points.push([x, y]);
    modeAssignments.push(arm);
  }

  return { points, modeAssignments, modeInfos };
}

export function generateDatasetBatch(
  datasetId: DatasetId,
  n: number,
  rng: SeededRNG,
): DatasetBatch {
  switch (datasetId) {
    case "eight_gaussians":
      return generateEightGaussians(n, rng);
    case "twenty_five_gaussians":
      return generateTwentyFiveGaussians(n, rng);
    case "swiss_roll":
      return generateSwissRoll(n, rng);
    case "two_moons":
      return generateTwoMoons(n, rng);
    case "concentric_rings":
      return generateConcentricRings(n, rng);
    case "pinwheel":
      return generatePinwheel(n, rng);
    default:
      return generateEightGaussians(n, rng);
  }
}

export const DATASET_DEFINITIONS: Record<
  DatasetId,
  { name: string; description: string; modeCount: number }
> = {
  eight_gaussians: {
    name: "8 Gaussians in a Ring",
    description:
      "8 distinct isotropic Gaussian modes evenly distributed at radius R=2.0 with σ=0.08.",
    modeCount: 8,
  },
  twenty_five_gaussians: {
    name: "25 Gaussians (5x5 Grid)",
    description:
      "25 tight Gaussian modes arranged on a regular 5x5 grid from -2 to +2 with σ=0.05.",
    modeCount: 25,
  },
  swiss_roll: {
    name: "Swiss Roll 2D Manifold",
    description: "A continuous 1D non-linear spiral manifold embedded in 2D Euclidean space.",
    modeCount: 8,
  },
  two_moons: {
    name: "Two Moons Interlocking",
    description: "Two curved interlocking crescent semicircles with non-convex decision boundary.",
    modeCount: 8,
  },
  concentric_rings: {
    name: "Concentric Doughnut Rings",
    description:
      "Two concentric circular rings with different radii, testing non-connected topology.",
    modeCount: 12,
  },
  pinwheel: {
    name: "Pinwheel Spiral Clusters",
    description: "5 radial swirling arms testing multi-modal curvature and spatial continuity.",
    modeCount: 5,
  },
};

// ============================================================================
// 4. NEURAL NETWORK MLP ENGINE (AUTODIFF, SPECTRAL NORM, WEIGHT CLIPPING)
// ============================================================================

export function createMLPLayer(inDim: number, outDim: number, rng: SeededRNG): MLPLayer {
  const scale = Math.sqrt(2.0 / inDim);
  const weights: number[][] = [];
  for (let o = 0; o < outDim; o++) {
    const row: number[] = [];
    for (let i = 0; i < inDim; i++) {
      row.push(rng.nextGaussian(0, scale));
    }
    weights.push(row);
  }

  const biases: number[] = new Array(outDim).fill(0.01);

  const u: number[] = [];
  for (let o = 0; o < outDim; o++) {
    u.push(rng.nextGaussian(0, 1));
  }
  const uNorm = Math.hypot(...u) || 1;
  for (let o = 0; o < outDim; o++) {
    u[o] /= uNorm;
  }

  const v: number[] = [];
  for (let i = 0; i < inDim; i++) {
    v.push(rng.nextGaussian(0, 1));
  }
  const vNorm = Math.hypot(...v) || 1;
  for (let i = 0; i < inDim; i++) {
    v[i] /= vNorm;
  }

  return { weights, biases, u, v, sigma: 1.0 };
}

export function createMLPNetwork(
  inputDim: number,
  hiddenDims: readonly number[],
  outputDim: number,
  activation: "leaky_relu" | "relu" | "tanh",
  outputActivation: "linear" | "sigmoid",
  rng: SeededRNG,
): MLPNetwork {
  const layers: MLPLayer[] = [];
  const allDims = [inputDim, ...hiddenDims, outputDim];

  for (let l = 0; l < allDims.length - 1; l++) {
    layers.push(createMLPLayer(allDims[l], allDims[l + 1], rng));
  }

  return {
    inputDim,
    hiddenDims,
    outputDim,
    activation,
    outputActivation,
    layers,
  };
}

export function applyActivationFn(
  x: number,
  act: "leaky_relu" | "relu" | "tanh" | "linear" | "sigmoid",
): number {
  switch (act) {
    case "leaky_relu":
      return x >= 0 ? x : 0.2 * x;
    case "relu":
      return x >= 0 ? x : 0;
    case "tanh":
      return Math.tanh(x);
    case "sigmoid":
      return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, x))));
    case "linear":
    default:
      return x;
  }
}

export function applyActivationDerivative(
  preAct: number,
  postAct: number,
  act: "leaky_relu" | "relu" | "tanh" | "linear" | "sigmoid",
): number {
  switch (act) {
    case "leaky_relu":
      return preAct >= 0 ? 1.0 : 0.2;
    case "relu":
      return preAct >= 0 ? 1.0 : 0.0;
    case "tanh":
      return 1.0 - postAct * postAct;
    case "sigmoid":
      return postAct * (1.0 - postAct);
    case "linear":
    default:
      return 1.0;
  }
}

/**
 * 1-step Power Iteration for Spectral Normalization
 */
export function powerIterationSpectralNorm(layer: MLPLayer, numIters: number = 1): number {
  const W = layer.weights;
  const outDim = W.length;
  const inDim = W[0].length;

  let u = layer.u ?? new Array(outDim).fill(1 / Math.sqrt(outDim));
  let v = layer.v ?? new Array(inDim).fill(1 / Math.sqrt(inDim));

  for (let it = 0; it < numIters; it++) {
    const newV: number[] = new Array(inDim).fill(0);
    for (let j = 0; j < inDim; j++) {
      let sum = 0;
      for (let i = 0; i < outDim; i++) {
        sum += W[i][j] * u[i];
      }
      newV[j] = sum;
    }
    const normV = Math.hypot(...newV) || 1e-12;
    for (let j = 0; j < inDim; j++) {
      newV[j] /= normV;
    }
    v = newV;

    const newU: number[] = new Array(outDim).fill(0);
    for (let i = 0; i < outDim; i++) {
      let sum = 0;
      for (let j = 0; j < inDim; j++) {
        sum += W[i][j] * v[j];
      }
      newU[i] = sum;
    }
    const normU = Math.hypot(...newU) || 1e-12;
    for (let i = 0; i < outDim; i++) {
      newU[i] /= normU;
    }
    u = newU;
  }

  let sigma = 0;
  for (let i = 0; i < outDim; i++) {
    for (let j = 0; j < inDim; j++) {
      sigma += u[i] * W[i][j] * v[j];
    }
  }

  sigma = Math.max(sigma, 1e-6);
  layer.u = u;
  layer.v = v;
  layer.sigma = sigma;
  return sigma;
}

export function updateSpectralNorm(net: MLPNetwork, numIters: number = 1): void {
  for (const layer of net.layers) {
    powerIterationSpectralNorm(layer, numIters);
  }
}

export function clipWeights(net: MLPNetwork, c: number): void {
  for (const layer of net.layers) {
    for (let i = 0; i < layer.weights.length; i++) {
      for (let j = 0; j < layer.weights[i].length; j++) {
        layer.weights[i][j] = Math.max(-c, Math.min(c, layer.weights[i][j]));
      }
    }
    for (let i = 0; i < layer.biases.length; i++) {
      layer.biases[i] = Math.max(-c, Math.min(c, layer.biases[i]));
    }
  }
}

export function forwardMLP(
  net: MLPNetwork,
  input: readonly number[],
  useSpectralNorm: boolean = false,
): MLPForwardCache {
  const activations: number[][] = [[...input]];
  const preActivations: number[][] = [[]];

  let current = [...input];

  for (let l = 0; l < net.layers.length; l++) {
    const layer = net.layers[l];
    const isLast = l === net.layers.length - 1;
    const actType = isLast ? net.outputActivation : net.activation;
    const sigma = useSpectralNorm && layer.sigma ? layer.sigma : 1.0;

    const outDim = layer.weights.length;
    const inDim = layer.weights[0].length;
    const preAct: number[] = new Array(outDim);
    const postAct: number[] = new Array(outDim);

    for (let o = 0; o < outDim; o++) {
      let sum = layer.biases[o];
      const row = layer.weights[o];
      for (let i = 0; i < inDim; i++) {
        sum += (row[i] / sigma) * current[i];
      }
      preAct[o] = sum;
      postAct[o] = applyActivationFn(sum, actType);
    }

    preActivations.push(preAct);
    activations.push(postAct);
    current = postAct;
  }

  return {
    activations,
    preActivations,
    output: current,
  };
}

/**
 * Exact analytical input gradient \nabla_x D(x) for 2D inputs.
 */
export function computeInputGradient(
  net: MLPNetwork,
  input: readonly number[],
  useSpectralNorm: boolean = false,
): Vector2 {
  const cache = forwardMLP(net, input, useSpectralNorm);
  const numLayers = net.layers.length;

  const isLastLinear = net.outputActivation === "linear";
  let delta: number[];

  if (isLastLinear) {
    delta = [1.0];
  } else {
    const y = cache.output[0];
    delta = [y * (1.0 - y)];
  }

  for (let l = numLayers - 1; l >= 0; l--) {
    const layer = net.layers[l];
    const sigma = useSpectralNorm && layer.sigma ? layer.sigma : 1.0;
    const inDim = layer.weights[0].length;
    const outDim = layer.weights.length;

    const deltaIn: number[] = new Array(inDim).fill(0);
    for (let j = 0; j < inDim; j++) {
      let sum = 0;
      for (let i = 0; i < outDim; i++) {
        sum += (layer.weights[i][j] / sigma) * delta[i];
      }
      deltaIn[j] = sum;
    }

    if (l > 0) {
      const preActs = cache.preActivations[l];
      const postActs = cache.activations[l];
      for (let j = 0; j < inDim; j++) {
        deltaIn[j] *= applyActivationDerivative(preActs[j], postActs[j], net.activation);
      }
      delta = deltaIn;
    } else {
      return [deltaIn[0], deltaIn[1]];
    }
  }

  return [0, 0];
}

export function backwardMLP(
  net: MLPNetwork,
  gradOutput: readonly number[],
  forwardCache: MLPForwardCache,
  useSpectralNorm: boolean = false,
): {
  gradWeights: number[][][];
  gradBiases: number[][];
  gradInput: number[];
} {
  const numLayers = net.layers.length;
  const gradWeights: number[][][] = [];
  const gradBiases: number[][] = [];

  let delta = [...gradOutput];
  const lastPre = forwardCache.preActivations[numLayers];
  const lastPost = forwardCache.activations[numLayers];
  for (let i = 0; i < delta.length; i++) {
    delta[i] *= applyActivationDerivative(lastPre[i], lastPost[i], net.outputActivation);
  }

  for (let l = numLayers - 1; l >= 0; l--) {
    const layer = net.layers[l];
    const inAct = forwardCache.activations[l];
    const sigma = useSpectralNorm && layer.sigma ? layer.sigma : 1.0;
    const outDim = layer.weights.length;
    const inDim = layer.weights[0].length;

    const layerGW: number[][] = [];
    const layerGB: number[] = new Array(outDim);

    for (let o = 0; o < outDim; o++) {
      layerGB[o] = delta[o];
      const rowGW: number[] = new Array(inDim);
      for (let i = 0; i < inDim; i++) {
        rowGW[i] = (delta[o] * inAct[i]) / sigma;
      }
      layerGW.push(rowGW);
    }
    gradWeights.unshift(layerGW);
    gradBiases.unshift(layerGB);

    if (l > 0) {
      const nextDelta: number[] = new Array(inDim).fill(0);
      for (let j = 0; j < inDim; j++) {
        let sum = 0;
        for (let i = 0; i < outDim; i++) {
          sum += (layer.weights[i][j] / sigma) * delta[i];
        }
        const pre = forwardCache.preActivations[l][j];
        const post = forwardCache.activations[l][j];
        nextDelta[j] = sum * applyActivationDerivative(pre, post, net.activation);
      }
      delta = nextDelta;
    } else {
      const gradInput: number[] = new Array(inDim).fill(0);
      for (let j = 0; j < inDim; j++) {
        let sum = 0;
        for (let i = 0; i < outDim; i++) {
          sum += (layer.weights[i][j] / sigma) * delta[i];
        }
        gradInput[j] = sum;
      }
      return { gradWeights, gradBiases, gradInput };
    }
  }

  return { gradWeights, gradBiases, gradInput: [] };
}

export function createAdamState(net: MLPNetwork): AdamOptimizerState {
  const m = net.layers.map((l) => ({
    weights: l.weights.map((row) => new Array(row.length).fill(0)),
    biases: new Array(l.biases.length).fill(0),
  }));
  const v = net.layers.map((l) => ({
    weights: l.weights.map((row) => new Array(row.length).fill(0)),
    biases: new Array(l.biases.length).fill(0),
  }));
  return { m, v, t: 0 };
}

export function stepAdam(
  net: MLPNetwork,
  opt: AdamOptimizerState,
  gradWeights: readonly number[][][],
  gradBiases: readonly number[][],
  lr: number,
  beta1: number = 0.5,
  beta2: number = 0.999,
  eps: number = 1e-8,
): void {
  opt.t += 1;
  const t = opt.t;
  const biasCorrection1 = 1.0 - Math.pow(beta1, t);
  const biasCorrection2 = 1.0 - Math.pow(beta2, t);

  for (let l = 0; l < net.layers.length; l++) {
    const layer = net.layers[l];
    const gw = gradWeights[l];
    const gb = gradBiases[l];
    const mw = opt.m[l].weights;
    const mb = opt.m[l].biases;
    const vw = opt.v[l].weights;
    const vb = opt.v[l].biases;

    for (let o = 0; o < layer.weights.length; o++) {
      for (let i = 0; i < layer.weights[o].length; i++) {
        const g = Math.max(-10, Math.min(10, gw[o][i]));
        mw[o][i] = beta1 * mw[o][i] + (1 - beta1) * g;
        vw[o][i] = beta2 * vw[o][i] + (1 - beta2) * g * g;

        const mHat = mw[o][i] / biasCorrection1;
        const vHat = vw[o][i] / biasCorrection2;
        layer.weights[o][i] -= (lr * mHat) / (Math.sqrt(vHat) + eps);
      }
    }

    for (let o = 0; o < layer.biases.length; o++) {
      const g = Math.max(-10, Math.min(10, gb[o]));
      mb[o] = beta1 * mb[o] + (1 - beta1) * g;
      vb[o] = beta2 * vb[o] + (1 - beta2) * g * g;

      const mHat = mb[o] / biasCorrection1;
      const vHat = vb[o] / biasCorrection2;
      layer.biases[o] -= (lr * mHat) / (Math.sqrt(vHat) + eps);
    }
  }
}

export function createRMSPropState(net: MLPNetwork): RMSPropOptimizerState {
  const v = net.layers.map((l) => ({
    weights: l.weights.map((row) => new Array(row.length).fill(0)),
    biases: new Array(l.biases.length).fill(0),
  }));
  return { v };
}

export function stepRMSProp(
  net: MLPNetwork,
  opt: RMSPropOptimizerState,
  gradWeights: readonly number[][][],
  gradBiases: readonly number[][],
  lr: number,
  alpha: number = 0.99,
  eps: number = 1e-8,
): void {
  for (let l = 0; l < net.layers.length; l++) {
    const layer = net.layers[l];
    const gw = gradWeights[l];
    const gb = gradBiases[l];
    const vw = opt.v[l].weights;
    const vb = opt.v[l].biases;

    for (let o = 0; o < layer.weights.length; o++) {
      for (let i = 0; i < layer.weights[o].length; i++) {
        const g = Math.max(-10, Math.min(10, gw[o][i]));
        vw[o][i] = alpha * vw[o][i] + (1 - alpha) * g * g;
        layer.weights[o][i] -= (lr * g) / (Math.sqrt(vw[o][i]) + eps);
      }
    }

    for (let o = 0; o < layer.biases.length; o++) {
      const g = Math.max(-10, Math.min(10, gb[o]));
      vb[o] = alpha * vb[o] + (1 - alpha) * g * g;
      layer.biases[o] -= (lr * g) / (Math.sqrt(vb[o]) + eps);
    }
  }
}

// ============================================================================
// 5. METRICS, DIVERGENCES & DIAGNOSTICS
// ============================================================================

export function computeKantorovichWasserstein(
  critic: MLPNetwork,
  realSamples: readonly Vector2[],
  fakeSamples: readonly Vector2[],
  useSN: boolean = false,
): number {
  if (realSamples.length === 0 || fakeSamples.length === 0) return 0;
  let sumReal = 0;
  for (const r of realSamples) {
    const out = forwardMLP(critic, r, useSN).output[0];
    sumReal += out;
  }
  let sumFake = 0;
  for (const f of fakeSamples) {
    const out = forwardMLP(critic, f, useSN).output[0];
    sumFake += out;
  }
  return sumReal / realSamples.length - sumFake / fakeSamples.length;
}

export function computeSlicedWassersteinDistance(
  realSamples: readonly Vector2[],
  fakeSamples: readonly Vector2[],
  numProjections: number = 32,
  rng?: SeededRNG,
): number {
  if (realSamples.length === 0 || fakeSamples.length === 0) return 0;
  const n = Math.min(realSamples.length, fakeSamples.length);
  let totalDistance = 0;

  for (let p = 0; p < numProjections; p++) {
    const theta = rng ? rng.nextUniform(0, Math.PI) : (Math.PI * p) / numProjections;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const projReal: number[] = new Array(n);
    const projFake: number[] = new Array(n);

    for (let i = 0; i < n; i++) {
      projReal[i] = realSamples[i][0] * cosT + realSamples[i][1] * sinT;
      projFake[i] = fakeSamples[i][0] * cosT + fakeSamples[i][1] * sinT;
    }

    projReal.sort((a, b) => a - b);
    projFake.sort((a, b) => a - b);

    let projDist = 0;
    for (let i = 0; i < n; i++) {
      projDist += Math.abs(projReal[i] - projFake[i]);
    }
    totalDistance += projDist / n;
  }

  return totalDistance / numProjections;
}

export function computeJensenShannonDivergence(
  realSamples: readonly Vector2[],
  fakeSamples: readonly Vector2[],
  bins: number = 16,
  domain: [number, number] = [-3, 3],
): number {
  if (realSamples.length === 0 || fakeSamples.length === 0) return 0;
  const span = domain[1] - domain[0];
  const numBins = bins * bins;
  const pHist = new Array(numBins).fill(1e-5);
  const qHist = new Array(numBins).fill(1e-5);

  const toBin = (pt: Vector2): number => {
    const bx = Math.floor(((pt[0] - domain[0]) / span) * bins);
    const by = Math.floor(((pt[1] - domain[0]) / span) * bins);
    const cx = Math.max(0, Math.min(bins - 1, bx));
    const cy = Math.max(0, Math.min(bins - 1, by));
    return cy * bins + cx;
  };

  for (const r of realSamples) {
    pHist[toBin(r)] += 1;
  }
  for (const f of fakeSamples) {
    qHist[toBin(f)] += 1;
  }

  const sumP = pHist.reduce((a, b) => a + b, 0);
  const sumQ = qHist.reduce((a, b) => a + b, 0);
  for (let i = 0; i < numBins; i++) {
    pHist[i] /= sumP;
    qHist[i] /= sumQ;
  }

  let js = 0;
  for (let i = 0; i < numBins; i++) {
    const m = 0.5 * (pHist[i] + qHist[i]);
    if (pHist[i] > 1e-12) {
      js += 0.5 * pHist[i] * Math.log2(pHist[i] / m);
    }
    if (qHist[i] > 1e-12) {
      js += 0.5 * qHist[i] * Math.log2(qHist[i] / m);
    }
  }

  return Math.max(0, js);
}

export function computeModeCoverageMetrics(
  fakeSamples: readonly Vector2[],
  modeInfos: readonly DatasetModeInfo[],
): {
  capturedModes: number;
  totalModes: number;
  entropy: number;
  maxPossibleEntropy: number;
  modeEntropy: number;
  modeCollapseRatio: number;
  modeHistogram: number[];
} {
  const totalModes = modeInfos.length;
  if (totalModes === 0 || fakeSamples.length === 0) {
    return {
      capturedModes: 0,
      totalModes: 0,
      entropy: 0,
      maxPossibleEntropy: 1,
      modeEntropy: 0,
      modeCollapseRatio: 1,
      modeHistogram: [],
    };
  }

  const counts = new Array(totalModes).fill(0);

  for (const f of fakeSamples) {
    let bestDist = Infinity;
    let bestIdx = 0;
    for (let m = 0; m < totalModes; m++) {
      const d = dist2D(f, modeInfos[m].center);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = m;
      }
    }
    if (bestDist <= modeInfos[bestIdx].radius * 2.0) {
      counts[bestIdx]++;
    }
  }

  const threshold = Math.max(1, Math.floor(fakeSamples.length * (0.25 / totalModes)));
  let capturedModes = 0;
  for (let m = 0; m < totalModes; m++) {
    if (counts[m] >= threshold) {
      capturedModes++;
    }
  }

  const totalAssigned = counts.reduce((a, b) => a + b, 0) || 1;
  let entropy = 0;
  for (let m = 0; m < totalModes; m++) {
    const p = counts[m] / totalAssigned;
    if (p > 1e-9) {
      entropy -= p * Math.log2(p);
    }
  }

  const maxPossibleEntropy = Math.log2(totalModes);
  const entropyRatio = maxPossibleEntropy > 0 ? entropy / maxPossibleEntropy : 1;
  const modeCollapseRatio = 1.0 - Math.min(1.0, (capturedModes / totalModes + entropyRatio) / 2);

  return {
    capturedModes,
    totalModes,
    entropy,
    maxPossibleEntropy,
    modeEntropy: entropy,
    modeCollapseRatio,
    modeHistogram: counts.map((c) => c / totalAssigned),
  };
}

export function computeVectorField(
  critic: MLPNetwork,
  gridSize: number = 18,
  domain: [number, number] = [-3, 3],
  useSN: boolean = false,
): VectorFieldPoint[][] {
  const grid: VectorFieldPoint[][] = [];
  const step = (domain[1] - domain[0]) / (gridSize - 1);

  for (let row = 0; row < gridSize; row++) {
    const rowPoints: VectorFieldPoint[] = [];
    const y = domain[1] - row * step;
    for (let col = 0; col < gridSize; col++) {
      const x = domain[0] + col * step;
      const cache = forwardMLP(critic, [x, y], useSN);
      const criticVal = cache.output[0];
      const grad = computeInputGradient(critic, [x, y], useSN);
      const gradNorm = norm2D(grad);

      rowPoints.push({
        x,
        y,
        criticVal,
        gradX: grad[0],
        gradY: grad[1],
        gradNorm,
      });
    }
    grid.push(rowPoints);
  }

  return grid;
}

export function computeGPInterpolations(
  critic: MLPNetwork,
  realSamples: readonly Vector2[],
  fakeSamples: readonly Vector2[],
  count: number = 16,
  rng: SeededRNG,
  useSN: boolean = false,
): GPInterpolationLine[] {
  const lines: GPInterpolationLine[] = [];
  const n = Math.min(count, realSamples.length, fakeSamples.length);

  for (let i = 0; i < n; i++) {
    const real = realSamples[i];
    const fake = fakeSamples[i];
    const epsilon = rng.next();
    const interp = lerp2D(fake, real, epsilon);
    const grad = computeInputGradient(critic, interp, useSN);
    const gradNorm = norm2D(grad);

    lines.push({
      real,
      fake,
      interp,
      gradNorm,
      epsilon,
    });
  }

  return lines;
}

export function computeLipschitzGrid(
  critic: MLPNetwork,
  gridSize: number = 24,
  domain: [number, number] = [-3, 3],
  useSN: boolean = false,
): { maxGradNorm: number; meanGradNorm: number; norms: number[] } {
  let maxGradNorm = 0;
  let sumNorm = 0;
  const norms: number[] = [];
  const step = (domain[1] - domain[0]) / (gridSize - 1);

  for (let r = 0; r < gridSize; r++) {
    const y = domain[0] + r * step;
    for (let c = 0; c < gridSize; c++) {
      const x = domain[0] + c * step;
      const grad = computeInputGradient(critic, [x, y], useSN);
      const g = norm2D(grad);
      norms.push(g);
      sumNorm += g;
      if (g > maxGradNorm) {
        maxGradNorm = g;
      }
    }
  }

  return {
    maxGradNorm,
    meanGradNorm: sumNorm / norms.length,
    norms,
  };
}

// ============================================================================
// 6. GAN TRAINING STEP FOR ALL 4 PARADIGMS
// ============================================================================

export function trainGANStep(
  state: GANTrainingState,
  realBatch: readonly Vector2[],
  datasetInfo: DatasetBatch,
  paradigm: GANParadigmId,
  hyperparams: {
    lr: number;
    nCritic: number;
    lambdaGP: number;
    clipC: number;
    batchSize: number;
  },
  rng: SeededRNG,
): {
  state: GANTrainingState;
  snapshot: MetricsSnapshot;
  fakeSamples: Vector2[];
} {
  const { critic, generator } = state;
  const { lr, nCritic, lambdaGP, clipC, batchSize } = hyperparams;
  const useSN = paradigm === "sngan";

  let lastCriticLoss = 0;
  let lastGPLoss = 0;
  const gpNorms: number[] = [];

  for (let step = 0; step < nCritic; step++) {
    if (useSN) {
      updateSpectralNorm(critic, 1);
    }

    const zBatch: Vector2[] = [];
    const fakePoints: Vector2[] = [];
    for (let b = 0; b < batchSize; b++) {
      const z: Vector2 = [rng.nextGaussian(0, 1), rng.nextGaussian(0, 1)];
      zBatch.push(z);
      const gOut = forwardMLP(generator, z, false).output;
      fakePoints.push([gOut[0], gOut[1]]);
    }

    const totalGradW = critic.layers.map((l) =>
      l.weights.map((row) => new Array(row.length).fill(0)),
    );
    const totalGradB = critic.layers.map((l) => new Array(l.biases.length).fill(0));

    let batchCriticLoss = 0;

    // 1. Loss on Real Data
    for (let b = 0; b < batchSize; b++) {
      const realPt = realBatch[b % realBatch.length];
      const cache = forwardMLP(critic, realPt, useSN);
      const out = cache.output[0];

      let gradLossWrtOutput = 0;
      if (paradigm === "standard_gan") {
        const p = Math.max(1e-7, Math.min(1 - 1e-7, out));
        batchCriticLoss -= Math.log(p) / batchSize;
        gradLossWrtOutput = -1.0 / (p * batchSize);
      } else {
        batchCriticLoss -= out / batchSize;
        gradLossWrtOutput = -1.0 / batchSize;
      }

      const back = backwardMLP(critic, [gradLossWrtOutput], cache, useSN);
      for (let l = 0; l < critic.layers.length; l++) {
        for (let o = 0; o < critic.layers[l].weights.length; o++) {
          for (let i = 0; i < critic.layers[l].weights[o].length; i++) {
            totalGradW[l][o][i] += back.gradWeights[l][o][i];
          }
          totalGradB[l][o] += back.gradBiases[l][o];
        }
      }
    }

    // 2. Loss on Fake Data
    for (let b = 0; b < batchSize; b++) {
      const fakePt = fakePoints[b];
      const cache = forwardMLP(critic, fakePt, useSN);
      const out = cache.output[0];

      let gradLossWrtOutput = 0;
      if (paradigm === "standard_gan") {
        const p = Math.max(1e-7, Math.min(1 - 1e-7, out));
        batchCriticLoss -= Math.log(1 - p) / batchSize;
        gradLossWrtOutput = 1.0 / ((1 - p) * batchSize);
      } else {
        batchCriticLoss += out / batchSize;
        gradLossWrtOutput = 1.0 / batchSize;
      }

      const back = backwardMLP(critic, [gradLossWrtOutput], cache, useSN);
      for (let l = 0; l < critic.layers.length; l++) {
        for (let o = 0; o < critic.layers[l].weights.length; o++) {
          for (let i = 0; i < critic.layers[l].weights[o].length; i++) {
            totalGradW[l][o][i] += back.gradWeights[l][o][i];
          }
          totalGradB[l][o] += back.gradBiases[l][o];
        }
      }
    }

    // 3. WGAN-GP: Gradient Penalty
    if (paradigm === "wgan_gp" && lambdaGP > 0) {
      let gpLossSum = 0;
      const gpSubsample = Math.min(batchSize, 32);

      for (let b = 0; b < gpSubsample; b++) {
        const realPt = realBatch[b % realBatch.length];
        const fakePt = fakePoints[b];
        const eps = rng.next();
        const interp: Vector2 = lerp2D(fakePt, realPt, eps);

        const grad = computeInputGradient(critic, interp, false);
        const gNorm = norm2D(grad);
        gpNorms.push(gNorm);

        const penalty = (gNorm - 1.0) * (gNorm - 1.0);
        gpLossSum += penalty;

        const cacheInterp = forwardMLP(critic, interp, false);
        const backInterp = backwardMLP(critic, [1.0], cacheInterp, false);

        for (let l = 0; l < critic.layers.length; l++) {
          for (let o = 0; o < critic.layers[l].weights.length; o++) {
            for (let i = 0; i < critic.layers[l].weights[o].length; i++) {
              totalGradW[l][o][i] +=
                backInterp.gradWeights[l][o][i] * (gNorm - 1.0) * (lambdaGP / gpSubsample);
            }
            totalGradB[l][o] +=
              backInterp.gradBiases[l][o] * (gNorm - 1.0) * (lambdaGP / gpSubsample);
          }
        }
      }

      lastGPLoss = (lambdaGP * gpLossSum) / gpSubsample;
      batchCriticLoss += lastGPLoss;
    }

    lastCriticLoss = batchCriticLoss;

    if (paradigm === "wgan_clip") {
      if (!state.criticRMSProp) {
        state.criticRMSProp = createRMSPropState(critic);
      }
      stepRMSProp(critic, state.criticRMSProp, totalGradW, totalGradB, lr);
      clipWeights(critic, clipC);
    } else {
      if (!state.criticAdam) {
        state.criticAdam = createAdamState(critic);
      }
      const beta1 = paradigm === "standard_gan" ? 0.5 : 0.0;
      stepAdam(critic, state.criticAdam, totalGradW, totalGradB, lr, beta1, 0.9);
    }
  }

  // ==========================================
  // B. TRAIN GENERATOR (1 step)
  // ==========================================
  const genGradW = generator.layers.map((l) =>
    l.weights.map((row) => new Array(row.length).fill(0)),
  );
  const genGradB = generator.layers.map((l) => new Array(l.biases.length).fill(0));

  let genLoss = 0;
  const currentFakePoints: Vector2[] = [];

  for (let b = 0; b < batchSize; b++) {
    const z: Vector2 = [rng.nextGaussian(0, 1), rng.nextGaussian(0, 1)];
    const gCache = forwardMLP(generator, z, false);
    const fakePt: Vector2 = [gCache.output[0], gCache.output[1]];
    currentFakePoints.push(fakePt);

    const cCache = forwardMLP(critic, fakePt, useSN);
    const dOut = cCache.output[0];

    let dLossWrtCriticOut = 0;
    if (paradigm === "standard_gan") {
      const p = Math.max(1e-7, Math.min(1 - 1e-7, dOut));
      genLoss -= Math.log(p) / batchSize;
      dLossWrtCriticOut = -1.0 / (p * batchSize);
    } else {
      genLoss -= dOut / batchSize;
      dLossWrtCriticOut = -1.0 / batchSize;
    }

    const cBack = backwardMLP(critic, [dLossWrtCriticOut], cCache, useSN);
    const gradWrtGOut = [cBack.gradInput[0], cBack.gradInput[1]];

    const gBack = backwardMLP(generator, gradWrtGOut, gCache, false);
    for (let l = 0; l < generator.layers.length; l++) {
      for (let o = 0; o < generator.layers[l].weights.length; o++) {
        for (let i = 0; i < generator.layers[l].weights[o].length; i++) {
          genGradW[l][o][i] += gBack.gradWeights[l][o][i];
        }
        genGradB[l][o] += gBack.gradBiases[l][o];
      }
    }
  }

  const gBeta1 = paradigm === "standard_gan" ? 0.5 : 0.0;
  stepAdam(generator, state.genAdam, genGradW, genGradB, lr, gBeta1, 0.9);

  state.iteration += 1;
  state.totalRealSeen += batchSize * nCritic;

  // ==========================================
  // C. COMPUTE DIAGNOSTIC METRICS
  // ==========================================
  const wassersteinD = computeKantorovichWasserstein(
    critic,
    realBatch.slice(0, 100),
    currentFakePoints,
    useSN,
  );
  const slicedWassersteinD = computeSlicedWassersteinDistance(
    realBatch.slice(0, 100),
    currentFakePoints,
    24,
    rng,
  );
  const jsDivergence = computeJensenShannonDivergence(
    realBatch.slice(0, 100),
    currentFakePoints,
    16,
  );
  const modeMetrics = computeModeCoverageMetrics(currentFakePoints, datasetInfo.modeInfos);

  let gpNormMean = 1.0;
  let gpNormVar = 0.0;
  if (gpNorms.length > 0) {
    const sum = gpNorms.reduce((a, b) => a + b, 0);
    gpNormMean = sum / gpNorms.length;
    const sumSq = gpNorms.reduce((a, b) => a + (b - gpNormMean) ** 2, 0);
    gpNormVar = sumSq / gpNorms.length;
  }

  const lipschitzGrid = computeLipschitzGrid(critic, 12, [-3, 3], useSN);

  const snapshot: MetricsSnapshot = {
    iteration: state.iteration,
    criticLoss: lastCriticLoss,
    genLoss,
    wassersteinD,
    slicedWassersteinD,
    jsDivergence,
    gpNormMean,
    gpNormVariance: gpNormVar,
    gpLoss: lastGPLoss,
    maxLipschitz: lipschitzGrid.maxGradNorm,
    capturedModes: modeMetrics.capturedModes,
    totalModes: modeMetrics.totalModes,
    modeEntropy: modeMetrics.entropy,
    maxPossibleEntropy: modeMetrics.maxPossibleEntropy,
    modeCollapseRatio: modeMetrics.modeCollapseRatio,
    modeHistogram: modeMetrics.modeHistogram,
  };

  return { state, snapshot, fakeSamples: currentFakePoints };
}

// ============================================================================
// 7. PRESETS & PARADIGM DESCRIPTIONS
// ============================================================================

export const GAN_PARADIGM_INFOS: Record<GANParadigmId, GANParadigmInfo> = {
  standard_gan: {
    id: "standard_gan",
    name: "Standard Minimax GAN",
    paperYear: "2014",
    authors: "Goodfellow et al.",
    objectiveFormula: "min_G max_D E[log D(x)] + E[log(1 - D(G(z)))]",
    lipschitzEnforcement: "None (Unconstrained neural network with Sigmoid activation)",
    keyAdvantage:
      "Pioneering generative adversarial foundation with clear probabilistic interpretation.",
    knownFailureMode:
      "Severe mode collapse; vanishing gradients when supports do not overlap (JS divergence stays constant at log 2).",
    color: "rose",
  },
  wgan_clip: {
    id: "wgan_clip",
    name: "WGAN (Weight Clipping)",
    paperYear: "2017",
    authors: "Arjovsky, Chintala, Bottou",
    objectiveFormula: "min_G max_{D in D_L} E_{x ~ p_data}[D(x)] - E_{x_fake ~ p_g}[D(x_fake)]",
    lipschitzEnforcement: "Hard weight clamping: w_ij in [-c, c] after each gradient step",
    keyAdvantage:
      "Continuous, smooth Wasserstein W_1 metric correlating directly with sample quality.",
    knownFailureMode:
      "Capacity underuse: weights saturate at clipping bounds ±c, leading to vanishing or exploding gradients in deep nets.",
    color: "amber",
  },
  wgan_gp: {
    id: "wgan_gp",
    name: "WGAN-GP (Gradient Penalty)",
    paperYear: "2017",
    authors: "Gulrajani, Ahmed, Arjovsky, Dumoulin, Courville",
    objectiveFormula:
      "L = E[D(x_fake)] - E[D(x)] + lambda E_{x_hat}[(||grad_{x_hat} D(x_hat)||_2 - 1)^2]",
    lipschitzEnforcement:
      "Soft 1-Lipschitz regularizer on interpolations x_hat = eps x + (1-eps) x_fake",
    keyAdvantage:
      "Stable 1-Lipschitz critic without capacity reduction; outstanding multi-modal capture.",
    knownFailureMode:
      "Computationally requires second-order input gradient backpropagation during training.",
    color: "emerald",
  },
  sngan: {
    id: "sngan",
    name: "Spectral Normalization GAN",
    paperYear: "2018",
    authors: "Miyato, Kataoka, Koyama, Yoshida",
    objectiveFormula: "W_{SN} = W / sigma(W) where sigma(W) = max_{h != 0} ||Wh||_2 / ||h||_2",
    lipschitzEnforcement:
      "Exact layer-wise Lipschitz bound Lip(f_l) <= 1 via 1-step power iteration",
    keyAdvantage:
      "Guaranteed 1-Lipschitz everywhere with zero extra gradient overhead during backward pass.",
    knownFailureMode:
      "Can overly constrain intermediate representations if layers are deep and unscaled.",
    color: "cyan",
  },
};

export const WGAN_STUDIO_PRESETS: Record<PresetId, PresetConfig> = {
  wgan_gp_8_gaussians: {
    id: "wgan_gp_8_gaussians",
    name: "WGAN-GP on 8 Gaussians (Stable Convergence)",
    subtitle: "Full 8-mode capture with smooth Wasserstein slope",
    description:
      "Demonstrates how WGAN-GP with gradient penalty λ=10 easily captures all 8 Gaussian modes without mode collapse, keeping the critic gradient norm near 1.0.",
    paradigm: "wgan_gp",
    dataset: "eight_gaussians",
    lr: 0.003,
    nCritic: 5,
    lambdaGP: 10,
    clipC: 0.01,
    batchSize: 64,
    hiddenDim: 32,
  },
  standard_gan_mode_collapse: {
    id: "standard_gan_mode_collapse",
    name: "Standard GAN Mode Collapse on 8 Gaussians",
    subtitle: "Pathology of Jensen-Shannon divergence saturation",
    description:
      "Shows standard minimax GAN oscillating and collapsing to 1 or 2 modes because JS divergence provides zero informative gradient when real and fake clusters are disjoint.",
    paradigm: "standard_gan",
    dataset: "eight_gaussians",
    lr: 0.002,
    nCritic: 1,
    lambdaGP: 0,
    clipC: 0.01,
    batchSize: 64,
    hiddenDim: 32,
  },
  wgan_clipping_underuse: {
    id: "wgan_clipping_underuse",
    name: "WGAN Weight Clipping Capacity Underuse",
    subtitle: "Weight saturation pathology at [-c, c]",
    description:
      "Illustrates original WGAN with weight clipping c=0.01 on 25 Gaussians grid, demonstrating slow convergence and loss of critic expressivity due to boundary saturation.",
    paradigm: "wgan_clip",
    dataset: "twenty_five_gaussians",
    lr: 0.001,
    nCritic: 5,
    lambdaGP: 0,
    clipC: 0.01,
    batchSize: 64,
    hiddenDim: 32,
  },
  sngan_25_gaussians: {
    id: "sngan_25_gaussians",
    name: "SNGAN on 25 Gaussians Grid",
    subtitle: "Exact 1-Lipschitz continuity via spectral normalization",
    description:
      "Applies Spectral Normalization (SNGAN) to train a 1-Lipschitz critic across all 25 grid modes without calculating input gradient penalties.",
    paradigm: "sngan",
    dataset: "twenty_five_gaussians",
    lr: 0.002,
    nCritic: 3,
    lambdaGP: 0,
    clipC: 0.01,
    batchSize: 64,
    hiddenDim: 32,
  },
  wgan_gp_swiss_roll: {
    id: "wgan_gp_swiss_roll",
    name: "WGAN-GP on Swiss Roll Manifold",
    subtitle: "Unrolling non-linear 1D continuous manifold",
    description:
      "Evaluates WGAN-GP capability to reconstruct continuous manifold topology with non-convex curvature without disconnecting the spiral arm.",
    paradigm: "wgan_gp",
    dataset: "swiss_roll",
    lr: 0.003,
    nCritic: 5,
    lambdaGP: 10,
    clipC: 0.01,
    batchSize: 64,
    hiddenDim: 32,
  },
  two_moons_comparison: {
    id: "two_moons_comparison",
    name: "Two Moons Comparison",
    subtitle: "Interlocking crescent non-convex geometry",
    description:
      "Tests generator ability to separate interlocking upper and lower moons without bridging fake samples across the void.",
    paradigm: "wgan_gp",
    dataset: "two_moons",
    lr: 0.003,
    nCritic: 5,
    lambdaGP: 10,
    clipC: 0.01,
    batchSize: 64,
    hiddenDim: 32,
  },
};

// ============================================================================
// 8. REACT CANVAS RENDERING & COMPONENT IMPLEMENTATION
// ============================================================================

export const WassersteinGANStudio: React.FC<WassersteinGANStudioProps> = ({
  initialPreset = "wgan_gp_8_gaussians",
  initialParadigm,
  initialDataset,
  seed = 42,
  onStepChange,
  className = "",
}) => {
  const presetConfig =
    WGAN_STUDIO_PRESETS[initialPreset] ?? WGAN_STUDIO_PRESETS.wgan_gp_8_gaussians;

  const [activeTab, setActiveTab] = useState<StudioTabId>("phase_space");
  const [paradigm, setParadigm] = useState<GANParadigmId>(initialParadigm ?? presetConfig.paradigm);
  const [datasetId, setDatasetId] = useState<DatasetId>(initialDataset ?? presetConfig.dataset);
  const [lr, setLr] = useState<number>(presetConfig.lr);
  const [nCritic, setNCritic] = useState<number>(presetConfig.nCritic);
  const [lambdaGP, setLambdaGP] = useState<number>(presetConfig.lambdaGP);
  const [clipC, setClipC] = useState<number>(presetConfig.clipC);
  const [batchSize, setBatchSize] = useState<number>(presetConfig.batchSize);
  const [hiddenDim, setHiddenDim] = useState<number>(presetConfig.hiddenDim);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSeed, setCurrentSeed] = useState<number>(seed);

  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showVectorField, setShowVectorField] = useState<boolean>(true);
  const [showGPLines, setShowGPLines] = useState<boolean>(true);
  const [showRealData, setShowRealData] = useState<boolean>(true);
  const [showFakeData, setShowFakeData] = useState<boolean>(true);
  const [showModeCenters, setShowModeCenters] = useState<boolean>(true);

  const [hoverCoord, setHoverCoord] = useState<{
    x: number;
    y: number;
    criticVal: number;
    gradNorm: number;
  } | null>(null);

  const [history, setHistory] = useState<MetricsSnapshot[]>([]);
  const [fakeParticles, setFakeParticles] = useState<Vector2[]>([]);

  const rngRef = useRef<SeededRNG>(new SeededRNG(currentSeed));
  const datasetBatchRef = useRef<DatasetBatch>(
    generateDatasetBatch(datasetId, 256, rngRef.current),
  );
  const trainingStateRef = useRef<GANTrainingState | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const resetSimulation = useCallback(() => {
    const rng = new SeededRNG(currentSeed);
    rngRef.current = rng;
    datasetBatchRef.current = generateDatasetBatch(datasetId, 256, rng);

    const critic = createMLPNetwork(
      2,
      [hiddenDim, hiddenDim],
      1,
      "leaky_relu",
      paradigm === "standard_gan" ? "sigmoid" : "linear",
      rng,
    );
    const generator = createMLPNetwork(2, [hiddenDim, hiddenDim], 2, "leaky_relu", "linear", rng);

    const state: GANTrainingState = {
      critic,
      generator,
      genAdam: createAdamState(generator),
      criticAdam: paradigm !== "wgan_clip" ? createAdamState(critic) : undefined,
      criticRMSProp: paradigm === "wgan_clip" ? createRMSPropState(critic) : undefined,
      iteration: 0,
      totalRealSeen: 0,
    };

    trainingStateRef.current = state;

    const initialFakes: Vector2[] = [];
    for (let i = 0; i < batchSize; i++) {
      const z: Vector2 = [rng.nextGaussian(0, 1), rng.nextGaussian(0, 1)];
      const out = forwardMLP(generator, z, false).output;
      initialFakes.push([out[0], out[1]]);
    }
    setFakeParticles(initialFakes);

    const initialMetrics: MetricsSnapshot = {
      iteration: 0,
      criticLoss: 0,
      genLoss: 0,
      wassersteinD: 0,
      slicedWassersteinD: computeSlicedWassersteinDistance(
        datasetBatchRef.current.points.slice(0, 100),
        initialFakes,
        24,
        rng,
      ),
      jsDivergence: computeJensenShannonDivergence(
        datasetBatchRef.current.points.slice(0, 100),
        initialFakes,
        16,
      ),
      gpNormMean: 1.0,
      gpNormVariance: 0.0,
      gpLoss: 0,
      maxLipschitz: 1.0,
      capturedModes: 0,
      totalModes: datasetBatchRef.current.modeInfos.length,
      modeEntropy: 0,
      maxPossibleEntropy: Math.log2(datasetBatchRef.current.modeInfos.length || 1),
      modeCollapseRatio: 1.0,
      modeHistogram: new Array(datasetBatchRef.current.modeInfos.length).fill(0),
    };

    setHistory([initialMetrics]);
    if (onStepChange) onStepChange(initialMetrics);
  }, [currentSeed, datasetId, paradigm, hiddenDim, batchSize, onStepChange]);

  const executeStep = useCallback(
    (numSteps: number = 1) => {
      if (!trainingStateRef.current) return;
      const rng = rngRef.current;
      let lastSnap: MetricsSnapshot | null = null;
      let latestFakes: Vector2[] = [];

      for (let s = 0; s < numSteps; s++) {
        const result = trainGANStep(
          trainingStateRef.current,
          datasetBatchRef.current.points,
          datasetBatchRef.current,
          paradigm,
          { lr, nCritic, lambdaGP, clipC, batchSize },
          rng,
        );
        trainingStateRef.current = result.state;
        lastSnap = result.snapshot;
        latestFakes = result.fakeSamples;
      }

      if (lastSnap) {
        setFakeParticles(latestFakes);
        setHistory((prev) => [...prev.slice(-150), lastSnap!]);
        if (onStepChange) onStepChange(lastSnap);
      }
    },
    [paradigm, lr, nCritic, lambdaGP, clipC, batchSize, onStepChange],
  );

  const applyPreset = useCallback((presetId: PresetId) => {
    const config = WGAN_STUDIO_PRESETS[presetId];
    if (!config) return;
    setParadigm(config.paradigm);
    setDatasetId(config.dataset);
    setLr(config.lr);
    setNCritic(config.nCritic);
    setLambdaGP(config.lambdaGP);
    setClipC(config.clipC);
    setBatchSize(config.batchSize);
    setHiddenDim(config.hiddenDim);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();
    const loop = (time: number) => {
      if (time - lastTime >= 16) {
        executeStep(speedMultiplier);
        lastTime = time;
      }
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying, speedMultiplier, executeStep]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !trainingStateRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const domain: [number, number] = [-3.0, 3.0];
    const span = domain[1] - domain[0];

    const toCanvasX = (x: number) => ((x - domain[0]) / span) * width;
    const toCanvasY = (y: number) => height - ((y - domain[0]) / span) * height;

    ctx.clearRect(0, 0, width, height);

    const useSN = paradigm === "sngan";
    const critic = trainingStateRef.current.critic;

    // 1. Heatmap
    if (showHeatmap) {
      const gridRes = 36;
      const cellW = width / gridRes;
      const cellH = height / gridRes;

      let minVal = Infinity;
      let maxVal = -Infinity;
      const gridVals: number[][] = [];

      for (let r = 0; r < gridRes; r++) {
        const rowVals: number[] = [];
        const y = domain[1] - (r + 0.5) * (span / gridRes);
        for (let c = 0; c < gridRes; c++) {
          const x = domain[0] + (c + 0.5) * (span / gridRes);
          const out = forwardMLP(critic, [x, y], useSN).output[0];
          rowVals.push(out);
          if (out < minVal) minVal = out;
          if (out > maxVal) maxVal = out;
        }
        gridVals.push(rowVals);
      }

      if (paradigm === "standard_gan") {
        minVal = 0;
        maxVal = 1;
      } else {
        const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal), 0.5);
        minVal = -absMax;
        maxVal = absMax;
      }

      for (let r = 0; r < gridRes; r++) {
        for (let c = 0; c < gridRes; c++) {
          const val = gridVals[r][c];
          let norm = (val - minVal) / (maxVal - minVal || 1);
          norm = Math.max(0, Math.min(1, norm));

          let rC = 0,
            gC = 0,
            bC = 0;
          if (norm < 0.5) {
            const t = norm * 2.0;
            rC = Math.round(15 + t * (24 - 15));
            gC = Math.round(23 + t * (24 - 23));
            bC = Math.round(42 + t * (27 - 42));
          } else {
            const t = (norm - 0.5) * 2.0;
            rC = Math.round(24 + t * (16 - 24));
            gC = Math.round(24 + t * (185 - 24));
            bC = Math.round(27 + t * (129 - 27));
          }

          ctx.fillStyle = `rgb(${rC}, ${gC}, ${bC})`;
          ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
        }
      }
    } else {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    for (let g = -2; g <= 2; g++) {
      const gx = toCanvasX(g);
      const gy = toCanvasY(g);
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }

    // 3. Gradient Vector Field
    if (showVectorField) {
      const fieldRes = 14;
      const step = span / (fieldRes - 1);
      ctx.lineWidth = 1.2;

      for (let r = 0; r < fieldRes; r++) {
        const y = domain[0] + r * step;
        for (let c = 0; c < fieldRes; c++) {
          const x = domain[0] + c * step;
          const grad = computeInputGradient(critic, [x, y], useSN);
          const gLen = norm2D(grad);
          if (gLen < 1e-4) continue;

          const cx = toCanvasX(x);
          const cy = toCanvasY(y);

          const arrowLen = Math.min(18, Math.max(5, Math.log1p(gLen) * 10));
          const nx = (grad[0] / gLen) * arrowLen;
          const ny = -(grad[1] / gLen) * arrowLen;

          const endX = cx + nx;
          const endY = cy + ny;

          const ratio = Math.abs(gLen - 1.0);
          const strokeCol =
            ratio < 0.3
              ? "rgba(16, 185, 129, 0.5)"
              : ratio < 0.8
                ? "rgba(245, 158, 11, 0.45)"
                : "rgba(239, 68, 68, 0.4)";

          ctx.strokeStyle = strokeCol;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          const angle = Math.atan2(ny, nx);
          const headLen = 3.5;
          ctx.fillStyle = strokeCol;
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
          ctx.fill();
        }
      }
    }

    // 4. GP Interpolation Lines
    if (showGPLines && paradigm === "wgan_gp" && fakeParticles.length > 0) {
      const rngTemp = new SeededRNG(1234);
      const lines = computeGPInterpolations(
        critic,
        datasetBatchRef.current.points,
        fakeParticles,
        14,
        rngTemp,
        useSN,
      );

      for (const line of lines) {
        const rx = toCanvasX(line.real[0]);
        const ry = toCanvasY(line.real[1]);
        const fx = toCanvasX(line.fake[0]);
        const fy = toCanvasY(line.fake[1]);
        const ix = toCanvasX(line.interp[0]);
        const iy = toCanvasY(line.interp[1]);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(fx, fy);
        ctx.stroke();
        ctx.setLineDash([]);

        const diff = Math.abs(line.gradNorm - 1.0);
        ctx.fillStyle = diff < 0.2 ? "#10b981" : diff < 0.6 ? "#f59e0b" : "#ef4444";
        ctx.beginPath();
        ctx.arc(ix, iy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Mode Centers
    if (showModeCenters) {
      for (const mode of datasetBatchRef.current.modeInfos) {
        const mx = toCanvasX(mode.center[0]);
        const my = toCanvasY(mode.center[1]);
        const rPix = (mode.radius / span) * width;

        ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(mx, my, Math.max(6, rPix), 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(6, 182, 212, 0.1)";
        ctx.fill();

        ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
        ctx.beginPath();
        ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 6. Real Data Points (Cyan)
    if (showRealData) {
      ctx.fillStyle = "rgba(6, 182, 212, 0.75)";
      for (const pt of datasetBatchRef.current.points) {
        const px = toCanvasX(pt[0]);
        const py = toCanvasY(pt[1]);
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 7. Fake Data Points (Amber)
    if (showFakeData && fakeParticles.length > 0) {
      for (const pt of fakeParticles) {
        const px = toCanvasX(pt[0]);
        const py = toCanvasY(pt[1]);

        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(px, py, 3.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 8. Hover Crosshair
    if (hoverCoord) {
      const hx = toCanvasX(hoverCoord.x);
      const hy = toCanvasY(hoverCoord.y);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, hy);
      ctx.lineTo(width, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(hx, hy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [
    showHeatmap,
    showVectorField,
    showGPLines,
    showRealData,
    showFakeData,
    showModeCenters,
    fakeParticles,
    paradigm,
    hoverCoord,
  ]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !trainingStateRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const pixelX = (e.clientX - rect.left) * scaleX;
    const pixelY = (e.clientY - rect.top) * scaleY;

    const domain: [number, number] = [-3.0, 3.0];
    const span = domain[1] - domain[0];
    const x = domain[0] + (pixelX / canvas.width) * span;
    const y = domain[1] - (pixelY / canvas.height) * span;

    const useSN = paradigm === "sngan";
    const cache = forwardMLP(trainingStateRef.current.critic, [x, y], useSN);
    const grad = computeInputGradient(trainingStateRef.current.critic, [x, y], useSN);
    const gradNorm = norm2D(grad);

    setHoverCoord({
      x,
      y,
      criticVal: cache.output[0],
      gradNorm,
    });
  };

  const handleCanvasMouseLeave = () => {
    setHoverCoord(null);
  };

  const currentSnapshot = history[history.length - 1] ?? {
    iteration: 0,
    criticLoss: 0,
    genLoss: 0,
    wassersteinD: 0,
    slicedWassersteinD: 0,
    jsDivergence: 0,
    gpNormMean: 1.0,
    gpNormVariance: 0.0,
    gpLoss: 0,
    maxLipschitz: 1.0,
    capturedModes: 0,
    totalModes: 8,
    modeEntropy: 0,
    maxPossibleEntropy: 3.0,
    modeCollapseRatio: 1.0,
    modeHistogram: [],
  };

  return (
    <div
      className={`flex flex-col w-full bg-zinc-950 text-zinc-100 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden ${className}`}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-zinc-100">
                Wasserstein GAN & WGAN-GP Studio
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {GAN_PARADIGM_INFOS[paradigm].name}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Kantorovich-Rubinstein duality, 1-Lipschitz continuity, and vector field transport on
              2D manifolds
            </p>
          </div>
        </div>

        {/* PRESET SELECTOR DROPDOWN */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="text-xs font-medium text-zinc-400">Preset:</span>
          <select
            className="bg-zinc-800 text-xs text-zinc-200 border border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            defaultValue={initialPreset}
            onChange={(e) => applyPreset(e.target.value as PresetId)}
          >
            {Object.entries(WGAN_STUDIO_PRESETS).map(([id, p]) => (
              <option key={id} value={id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/30 px-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("phase_space")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "phase_space"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Activity className="w-4 h-4" />
          Phase Space & Vector Field
        </button>

        <button
          onClick={() => setActiveTab("gradient_penalty")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "gradient_penalty"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Shield className="w-4 h-4" />
          Gradient Penalty & Lipschitz
        </button>

        <button
          onClick={() => setActiveTab("mode_collapse")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "mode_collapse"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Mode Collapse & Metrics
        </button>

        <button
          onClick={() => setActiveTab("training_curves")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "training_curves"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Training Curves
        </button>

        <button
          onClick={() => setActiveTab("theory")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "theory"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Theory & Dualities
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* LEFT COLUMN: VISUALIZATION CANVAS & TAB PANELS (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* TAB 1: 2D PHASE SPACE & VECTOR FIELD */}
          {activeTab === "phase_space" && (
            <div className="flex flex-col gap-4">
              <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-inner flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={460}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={handleCanvasMouseLeave}
                  className="w-full h-auto cursor-crosshair max-h-[500px]"
                />

                {hoverCoord && (
                  <div className="absolute top-3 left-3 bg-zinc-900/90 backdrop-blur border border-zinc-700/80 rounded-lg px-3 py-2 text-xs font-mono shadow-xl pointer-events-none text-zinc-300">
                    <div className="text-zinc-400 font-semibold text-[10px] mb-1">
                      LOCAL FIELD PROBE
                    </div>
                    <div>
                      Coord: ({hoverCoord.x.toFixed(2)}, {hoverCoord.y.toFixed(2)})
                    </div>
                    <div>
                      D(x):{" "}
                      <span className="text-emerald-400">{hoverCoord.criticVal.toFixed(3)}</span>
                    </div>
                    <div>
                      ||∇D||:{" "}
                      <span
                        className={
                          Math.abs(hoverCoord.gradNorm - 1.0) < 0.2
                            ? "text-emerald-400 font-bold"
                            : "text-amber-400"
                        }
                      >
                        {hoverCoord.gradNorm.toFixed(3)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-zinc-900/80 backdrop-blur px-2.5 py-1 rounded-md border border-zinc-800 text-[11px] text-zinc-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Real Data
                  </span>
                  <span className="flex items-center gap-1 ml-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />{" "}
                    Generator Fake
                  </span>
                  {paradigm === "wgan_gp" && (
                    <span className="flex items-center gap-1 ml-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> GP x̂
                    </span>
                  )}
                </div>
              </div>

              {/* OVERLAY TOGGLE BAR */}
              <div className="flex flex-wrap items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs">
                <span className="font-semibold text-zinc-400">Canvas Layers:</span>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                      className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0"
                    />
                    Critic Heatmap
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showVectorField}
                      onChange={(e) => setShowVectorField(e.target.checked)}
                      className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0"
                    />
                    Gradient Vector Field
                  </label>
                  {paradigm === "wgan_gp" && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={showGPLines}
                        onChange={(e) => setShowGPLines(e.target.checked)}
                        className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0"
                      />
                      GP Interpolations
                    </label>
                  )}
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showModeCenters}
                      onChange={(e) => setShowModeCenters(e.target.checked)}
                      className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0"
                    />
                    Mode Centers
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showRealData}
                      onChange={(e) => setShowRealData(e.target.checked)}
                      className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0"
                    />
                    Real Points
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showFakeData}
                      onChange={(e) => setShowFakeData(e.target.checked)}
                      className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0"
                    />
                    Fake Points
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GRADIENT PENALTY & LIPSCHITZ */}
          {activeTab === "gradient_penalty" && (
            <div className="flex flex-col gap-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    1-Lipschitz Regularization Diagnostics
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Analysis of gradient norms ||∇D(x̂)||₂ along interpolation lines and across 2D
                    phase space
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-400">Estimated W₁ Distance</div>
                  <div className="text-base font-bold text-emerald-400">
                    {currentSnapshot.wassersteinD.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* LIPSCHITZ STATS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/60">
                  <div className="text-[11px] text-zinc-400">Mean ||∇D(x̂)||₂</div>
                  <div className="text-lg font-bold text-zinc-100">
                    {currentSnapshot.gpNormMean.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-zinc-500">Target: 1.000</div>
                </div>
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/60">
                  <div className="text-[11px] text-zinc-400">Norm Variance</div>
                  <div className="text-lg font-bold text-zinc-100">
                    {currentSnapshot.gpNormVariance.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-zinc-500">Target: ≈ 0.0000</div>
                </div>
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/60">
                  <div className="text-[11px] text-zinc-400">Max Space Lipschitz</div>
                  <div className="text-lg font-bold text-zinc-100">
                    {currentSnapshot.maxLipschitz.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-500">Global Grid Bound</div>
                </div>
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/60">
                  <div className="text-[11px] text-zinc-400">GP Penalty Loss</div>
                  <div className="text-lg font-bold text-zinc-100">
                    {currentSnapshot.gpLoss.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-zinc-500">λ = {lambdaGP}</div>
                </div>
              </div>

              {/* COMPARATIVE LIPSCHITZ ARCHITECTURE TABLE */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs">
                <h4 className="font-semibold text-zinc-200 mb-3">
                  Lipschitz Enforcement Paradigm Comparison
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400">
                        <th className="pb-2">Paradigm</th>
                        <th className="pb-2">Lipschitz Bound Mechanism</th>
                        <th className="pb-2">Computational Cost</th>
                        <th className="pb-2">Gradient Quality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      <tr>
                        <td className="py-2.5 font-bold text-rose-400">Standard GAN</td>
                        <td>None (Sigmoid saturation)</td>
                        <td>1x Forward/Backward</td>
                        <td className="text-rose-300">Vanishes when supports disjoint</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-amber-400">WGAN (Clip)</td>
                        <td>Weight Clamping w ∈ [-c, c]</td>
                        <td>1x Forward + Clamping</td>
                        <td className="text-amber-300">Saturates at ±c; capacity underuse</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-emerald-400">WGAN-GP</td>
                        <td>Soft penalty on interpolations x̂</td>
                        <td>2x Backprop (2nd order)</td>
                        <td className="text-emerald-300">
                          Linear slope ||∇D|| = 1 everywhere on support
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-cyan-400">SNGAN</td>
                        <td>Spectral Norm W / σ(W)</td>
                        <td>1-step Power Iteration</td>
                        <td className="text-cyan-300">Exact 1-Lipschitz globally without GP</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MODE COLLAPSE & METRICS */}
          {activeTab === "mode_collapse" && (
            <div className="flex flex-col gap-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    Multi-Modal Coverage & Entropy Diagnostics
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Mode recovery statistics, dropped clusters, and Sliced Wasserstein vs
                    Jensen-Shannon divergence
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      currentSnapshot.capturedModes === currentSnapshot.totalModes
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {currentSnapshot.capturedModes} / {currentSnapshot.totalModes} Modes Captured
                  </span>
                </div>
              </div>

              {/* METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950">
                  <div className="text-xs text-zinc-400">Mode Distribution Entropy</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {currentSnapshot.modeEntropy.toFixed(2)}{" "}
                    <span className="text-xs text-zinc-500">
                      / {currentSnapshot.maxPossibleEntropy.toFixed(2)} bits
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Uniform mode distribution = {currentSnapshot.maxPossibleEntropy.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950">
                  <div className="text-xs text-zinc-400">Sliced Wasserstein Distance</div>
                  <div className="text-xl font-bold text-cyan-400 mt-1">
                    {currentSnapshot.slicedWassersteinD.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Invariant continuous optimal transport proxy
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950">
                  <div className="text-xs text-zinc-400">Jensen-Shannon Divergence</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {currentSnapshot.jsDivergence.toFixed(3)}{" "}
                    <span className="text-xs text-zinc-500">bits</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    JS saturates at 1.0 (log₂ 2) when disjoint
                  </div>
                </div>
              </div>

              {/* MODE CAPTURE HISTOGRAM VISUALIZER */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-semibold text-zinc-200">
                    Mode Assignment Distribution vs Uniform Target
                  </span>
                  <span className="text-zinc-400">
                    Collapse Ratio: {(currentSnapshot.modeCollapseRatio * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-end gap-1.5 h-32 pt-2 border-b border-zinc-800">
                  {datasetBatchRef.current.modeInfos.map((mode, idx) => {
                    const prob = currentSnapshot.modeHistogram[idx] ?? 0;
                    const uniform = 1.0 / datasetBatchRef.current.modeInfos.length;
                    const heightPct = Math.min(100, Math.max(4, prob * 350));
                    const isCaptured = prob >= uniform * 0.3;

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative"
                      >
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t transition-all ${
                            isCaptured ? "bg-emerald-500" : "bg-rose-500/70"
                          }`}
                        />
                        <span className="text-[9px] text-zinc-500 mt-1 truncate max-w-full">
                          {idx + 1}
                        </span>

                        <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-zinc-900 border border-zinc-700 text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10">
                          {mode.label}: {(prob * 100).toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRAINING CURVES */}
          {activeTab === "training_curves" && (
            <div className="flex flex-col gap-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Real-Time Learning Trajectories
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Evolution of Critic loss, Generator loss, Gradient Penalty, and Sliced
                    Wasserstein distance
                  </p>
                </div>
                <div className="text-xs text-zinc-400">
                  Iteration:{" "}
                  <span className="font-bold text-zinc-100">{currentSnapshot.iteration}</span>
                </div>
              </div>

              {/* MULTI-LINE SVG CHART */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Critic Loss
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> Generator Loss
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> Sliced W₁ Distance
                    </span>
                  </div>
                </div>

                <div className="relative w-full h-48">
                  {history.length > 1 ? (
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160">
                      <line
                        x1="0"
                        y1="40"
                        x2="500"
                        y2="40"
                        stroke="rgba(255,255,255,0.05)"
                        strokeDasharray="2,2"
                      />
                      <line
                        x1="0"
                        y1="80"
                        x2="500"
                        y2="80"
                        stroke="rgba(255,255,255,0.05)"
                        strokeDasharray="2,2"
                      />
                      <line
                        x1="0"
                        y1="120"
                        x2="500"
                        y2="120"
                        stroke="rgba(255,255,255,0.05)"
                        strokeDasharray="2,2"
                      />

                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1.8"
                        points={history
                          .map((h, i) => {
                            const x = (i / (history.length - 1)) * 500;
                            const y = 80 - Math.max(-60, Math.min(60, h.criticLoss * 20));
                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />

                      <polyline
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.8"
                        points={history
                          .map((h, i) => {
                            const x = (i / (history.length - 1)) * 500;
                            const y = 80 - Math.max(-60, Math.min(60, h.genLoss * 20));
                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />

                      <polyline
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1.8"
                        points={history
                          .map((h, i) => {
                            const x = (i / (history.length - 1)) * 500;
                            const y = 150 - Math.min(140, h.slicedWassersteinD * 60);
                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />
                    </svg>
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-zinc-500">
                      Step the simulation to generate training trajectories...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: THEORY & DUALITIES */}
          {activeTab === "theory" && (
            <div className="flex flex-col gap-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-xs text-zinc-300">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  Kantorovich-Rubinstein Duality & Optimal Transport Theory
                </h3>
                <p className="text-xs text-zinc-400">
                  Mathematical derivations and comparison of GAN divergence metrics
                </p>
              </div>

              {/* CARD 1: KANTOROVICH RUBINSTEIN DUALITY */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                <h4 className="font-bold text-emerald-400 text-sm mb-1">
                  1. Kantorovich-Rubinstein Duality Theorem
                </h4>
                <p className="text-zinc-400 mb-2 leading-relaxed">
                  The Earth Mover&apos;s Distance (Wasserstein-1) between probability distributions{" "}
                  <code className="text-emerald-300">P_r</code> and{" "}
                  <code className="text-emerald-300">P_g</code> is defined via optimal transport
                  plans:
                </p>
                <div className="p-3 rounded-lg bg-zinc-900 font-mono text-[11px] text-zinc-200 border border-zinc-800 mb-2">
                  {
                    "W₁(P_r, P_g) = inf_{γ ∈ Π} E_{(x, y) ~ γ}[ ||x - y|| ] = sup_{||D||_L ≤ 1} ( E_{x ~ P_r}[D(x)] - E_{y ~ P_g}[D(y)] )"
                  }
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  By transforming the intractable joint coupling search into a supremum over all
                  1-Lipschitz functions, the discriminator becomes a critic scoring the earth mover
                  potential.
                </p>
              </div>

              {/* CARD 2: VANISHING GRADIENTS IN STANDARD GAN */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                <h4 className="font-bold text-rose-400 text-sm mb-1">
                  2. Why Standard GAN Vanishes When Supports Are Disjoint
                </h4>
                <p className="text-zinc-400 leading-relaxed mb-2">
                  Consider two parallel lines in ℝ² separated by distance θ: Real distribution P_0 =
                  (0, y) and generated P_θ = (θ, y).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-rose-400 font-bold">Jensen-Shannon Divergence:</span>
                    <div className="mt-1 text-zinc-300">
                      JS(P_0 || P_θ) = log 2 (constant ∀ θ ≠ 0)
                    </div>
                    <div className="text-zinc-500 text-[10px]">
                      ∇_θ JS = 0 (Vanishing gradient!)
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-emerald-400 font-bold">Wasserstein Distance:</span>
                    <div className="mt-1 text-zinc-300">
                      W₁(P_0 || P_θ) = |θ| (linear everywhere)
                    </div>
                    <div className="text-zinc-500 text-[10px]">
                      ∇_θ W₁ = sign(θ) (Informative slope!)
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: GRADIENT PENALTY THEOREM */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                <h4 className="font-bold text-cyan-400 text-sm mb-1">
                  3. Gulrajani et al. Gradient Penalty Formulation
                </h4>
                <p className="text-zinc-400 leading-relaxed mb-2">
                  Under the optimal transport plan, the optimal critic D*(x) has straight lines
                  connecting paired points x and y, and satisfies:
                </p>
                <div className="p-3 rounded-lg bg-zinc-900 font-mono text-[11px] text-zinc-200 border border-zinc-800 mb-2">
                  {"||∇_{x̂} D*(x̂)||₂ = 1  almost everywhere on straight lines x̂ = ϵ x + (1 - ϵ) y"}
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Therefore, penalizing deviations from unit norm{" "}
                  <code className="text-cyan-300">(||∇_{"x̂"} D(x̂)||₂ - 1)²</code> enforces
                  1-Lipschitz continuity along the transport trajectories where it matters most.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CONTROLS, HYPERPARAMETERS & METRICS (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* PLAYBACK & STEP CONTROL PANEL */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Simulation Control
              </span>
              <span className="text-zinc-500 font-mono text-[11px]">
                Iter: {currentSnapshot.iteration}
              </span>
            </div>

            {/* BUTTON BAR */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold text-xs transition-all shadow-md ${
                  isPlaying
                    ? "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                    : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Train Live
                  </>
                )}
              </button>

              <button
                disabled={isPlaying}
                onClick={() => executeStep(1)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <SkipForward className="w-4 h-4" /> Step 1
              </button>

              <button
                onClick={resetSimulation}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>

            {/* SPEED MULTIPLIER & SEED */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span>Speed:</span>
                {[1, 3, 5, 10].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeedMultiplier(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      speedMultiplier === s
                        ? "bg-emerald-500 text-zinc-950"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const nextSeed = Math.floor(Math.random() * 100000);
                  setCurrentSeed(nextSeed);
                }}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-emerald-400"
              >
                <RefreshCw className="w-3 h-3" /> Seed {currentSeed}
              </button>
            </div>
          </div>

          {/* GAN PARADIGM & TARGET DATASET SELECTORS */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Architecture & Distribution
              </span>
            </div>

            {/* PARADIGM SELECTOR */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-zinc-400">GAN Paradigm:</label>
              <select
                value={paradigm}
                onChange={(e) => setParadigm(e.target.value as GANParadigmId)}
                className="bg-zinc-800 text-xs text-zinc-200 border border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {Object.entries(GAN_PARADIGM_INFOS).map(([id, info]) => (
                  <option key={id} value={id}>
                    {info.name} ({info.paperYear})
                  </option>
                ))}
              </select>
            </div>

            {/* DATASET SELECTOR */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-zinc-400">Target 2D Manifold:</label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value as DatasetId)}
                className="bg-zinc-800 text-xs text-zinc-200 border border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {Object.entries(DATASET_DEFINITIONS).map(([id, def]) => (
                  <option key={id} value={id}>
                    {def.name} ({def.modeCount} modes)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* HYPERPARAMETER SLIDERS */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Hyperparameters
              </span>
            </div>

            {/* n_critic Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Critic Steps (n_critic):</span>
                <span className="font-mono text-zinc-200 font-bold">{nCritic}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={nCritic}
                onChange={(e) => setNCritic(parseInt(e.target.value))}
                className="accent-emerald-500"
              />
            </div>

            {/* lambda_GP Slider (for WGAN-GP) */}
            {paradigm === "wgan_gp" && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Gradient Penalty Weight (λ):</span>
                  <span className="font-mono text-zinc-200 font-bold">{lambdaGP}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={1}
                  value={lambdaGP}
                  onChange={(e) => setLambdaGP(parseFloat(e.target.value))}
                  className="accent-emerald-500"
                />
              </div>
            )}

            {/* Clip bound c (for WGAN-Clip) */}
            {paradigm === "wgan_clip" && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Weight Clip Bound (c):</span>
                  <span className="font-mono text-zinc-200 font-bold">{clipC.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min={0.001}
                  max={0.08}
                  step={0.002}
                  value={clipC}
                  onChange={(e) => setClipC(parseFloat(e.target.value))}
                  className="accent-emerald-500"
                />
              </div>
            )}

            {/* Learning Rate Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Learning Rate (α):</span>
                <span className="font-mono text-zinc-200 font-bold">{lr.toFixed(4)}</span>
              </div>
              <input
                type="range"
                min={0.0005}
                max={0.01}
                step={0.0005}
                value={lr}
                onChange={(e) => setLr(parseFloat(e.target.value))}
                className="accent-emerald-500"
              />
            </div>

            {/* Batch Size Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Batch Size:</span>
                <span className="font-mono text-zinc-200 font-bold">{batchSize}</span>
              </div>
              <input
                type="range"
                min={32}
                max={128}
                step={16}
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                className="accent-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
