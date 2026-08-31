import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Compass,
  Activity,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
  BarChart2,
  Crosshair,
} from "lucide-react";
import { useCanvasBox } from "./vizGeometry";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type LandscapeId =
  | "rosenbrock"
  | "beale"
  | "monkey_saddle"
  | "rastrigin"
  | "ill_conditioned_quadratic"
  | "ackley";

export type OptimizerId = "sgd" | "momentum" | "rmsprop" | "adam" | "adamw" | "newton_cg";

export type StudioViewMode =
  | "contour_2d"
  | "surface_3d"
  | "race_comparison"
  | "analytics"
  | "theory";

export type Vector2D = [number, number];
export type Matrix2x2 = [[number, number], [number, number]];

export type CurvatureType = "minimum" | "maximum" | "saddle" | "degenerate";

export interface EigenResult {
  readonly lambda1: number;
  readonly lambda2: number;
  readonly conditionNumber: number;
  readonly curvatureType: CurvatureType;
  readonly principalVector1: Vector2D;
  readonly principalVector2: Vector2D;
}

export interface Domain2D {
  readonly xMin: number;
  readonly xMax: number;
  readonly yMin: number;
  readonly yMax: number;
}

export interface LandscapeDefinition {
  readonly id: LandscapeId;
  readonly name: string;
  readonly category: "ravine" | "multimodal" | "saddle" | "quadratic" | "plateau";
  readonly formulaTeX: string;
  readonly domain: Domain2D;
  readonly globalMinimum: {
    readonly point: Vector2D;
    readonly value: number;
  };
  readonly defaultStartPoint: Vector2D;
  readonly alternativeStartPoints: readonly {
    readonly label: string;
    readonly point: Vector2D;
  }[];
  readonly description: string;
  readonly educationalNotes: string;
  readonly defaultStepSize: number;
  readonly maxRecommendedSteps: number;
  readonly fn: (x: number, y: number) => number;
  readonly grad: (x: number, y: number) => Vector2D;
  readonly hessian: (x: number, y: number) => Matrix2x2;
}

export interface OptimizerHyperparameters {
  readonly learningRate: number;
  readonly momentumBeta1?: number;
  readonly rmspropBeta2?: number;
  readonly adamBeta1?: number;
  readonly adamBeta2?: number;
  readonly epsilon?: number;
  readonly weightDecay?: number;
  readonly newtonDamping?: number;
}

export interface OptimizerConfig {
  readonly id: OptimizerId;
  readonly name: string;
  readonly shortName: string;
  readonly color: string;
  readonly hexColor: string;
  readonly formulaTeX: string;
  readonly description: string;
  readonly defaultHyperparameters: OptimizerHyperparameters;
}

export interface TrajectoryPoint {
  readonly step: number;
  readonly point: Vector2D;
  readonly loss: number;
  readonly grad: Vector2D;
  readonly gradNorm: number;
  readonly stepDistance: number;
  readonly cumulativeDistance: number;
  readonly hessian: Matrix2x2;
  readonly eigenvalues: [number, number];
  readonly conditionNumber: number;
  readonly curvatureType: CurvatureType;
}

export interface TrajectoryResult {
  readonly optimizerId: OptimizerId;
  readonly optimizerName: string;
  readonly color: string;
  readonly points: readonly TrajectoryPoint[];
  readonly converged: boolean;
  readonly diverged: boolean;
  readonly stepsToThreshold: number | null;
  readonly totalPathLength: number;
  readonly euclideanDistance: number;
  readonly tortuosity: number;
  readonly finalLoss: number;
  readonly finalGradNorm: number;
  readonly finalPoint: Vector2D;
}

export interface OptimizationLandscapeStudioProps {
  readonly initialLandscape?: LandscapeId;
  readonly initialStartPoint?: Vector2D;
  readonly initialOptimizers?: readonly OptimizerId[];
  readonly initialMaxSteps?: number;
  readonly initialTolerance?: number;
  readonly initialViewMode?: StudioViewMode;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onLandscapeChange?: (landscapeId: LandscapeId) => void;
  readonly onStepChange?: (step: number) => void;
  readonly onSimulationComplete?: (results: Record<OptimizerId, TrajectoryResult>) => void;
}

// ============================================================================
// 2. MATHEMATICAL BENCHMARK LANDSCAPES
// ============================================================================

export const OPTIMIZATION_LANDSCAPES: Record<LandscapeId, LandscapeDefinition> = {
  rosenbrock: {
    id: "rosenbrock",
    name: "Rosenbrock Banana Valley",
    category: "ravine",
    formulaTeX: "f(x, y) = (1 - x)^2 + 100(y - x^2)^2",
    domain: { xMin: -2.0, xMax: 2.0, yMin: -1.0, yMax: 3.0 },
    globalMinimum: { point: [1.0, 1.0], value: 0.0 },
    defaultStartPoint: [-1.2, 1.0],
    alternativeStartPoints: [
      { label: "Classic Benchmark (-1.2, 1.0)", point: [-1.2, 1.0] },
      { label: "Right Ridge (1.5, 2.0)", point: [1.5, 2.0] },
      { label: "Deep Basin (-1.5, -0.5)", point: [-1.5, -0.5] },
      { label: "High Plateau (0.0, 2.5)", point: [0.0, 2.5] },
    ],
    description:
      "Non-convex valley with a steep parabolic curvature. Finding the ravine is easy, but navigating along the curved narrow valley floor to the global minimum (1, 1) is notoriously challenging for first-order gradient descent.",
    educationalNotes:
      "The Hessian eigenvalues along the valley floor have extreme disparity: perpendicular curvature is ~1000 while along the valley is ~2. Vanilla SGD oscillates violently across the ravine walls without moving forward unless momentum or adaptive preconditioners dampen perpendicular oscillations.",
    defaultStepSize: 0.001,
    maxRecommendedSteps: 200,
    fn: (x: number, y: number): number => {
      const term1 = 1 - x;
      const term2 = y - x * x;
      return term1 * term1 + 100 * term2 * term2;
    },
    grad: (x: number, y: number): Vector2D => {
      const term2 = y - x * x;
      const dfdx = 2 * (x - 1) - 400 * x * term2;
      const dfdy = 200 * term2;
      return [dfdx, dfdy];
    },
    hessian: (x: number, y: number): Matrix2x2 => {
      const hxx = 2 - 400 * y + 1200 * x * x;
      const hxy = -400 * x;
      const hyy = 200;
      return [
        [hxx, hxy],
        [hxy, hyy],
      ];
    },
  },

  beale: {
    id: "beale",
    name: "Beale Multimodal Valley",
    category: "ravine",
    formulaTeX: "f(x, y) = (1.5 - x + xy)^2 + (2.25 - x + xy^2)^2 + (2.625 - x + xy^3)^2",
    domain: { xMin: -4.5, xMax: 4.5, yMin: -4.5, yMax: 4.5 },
    globalMinimum: { point: [3.0, 0.5], value: 0.0 },
    defaultStartPoint: [1.0, 1.0],
    alternativeStartPoints: [
      { label: "Corner Start (1.0, 1.0)", point: [1.0, 1.0] },
      { label: "Far Valley (-2.0, 2.0)", point: [-2.0, 2.0] },
      { label: "Steep Corner (2.0, 3.0)", point: [2.0, 3.0] },
      { label: "Origin (0.0, 0.0)", point: [0.0, 0.0] },
    ],
    description:
      "Multi-term polynomial surface featuring sharp corners and expansive flat regions with vanishing gradients near the boundaries.",
    educationalNotes:
      "Gradients can vary by several orders of magnitude across the domain. Optimizers without momentum or adaptive step scaling can easily stall in flat regions or overshoot near steep corners.",
    defaultStepSize: 0.01,
    maxRecommendedSteps: 200,
    fn: (x: number, y: number): number => {
      const t1 = 1.5 - x + x * y;
      const t2 = 2.25 - x + x * y * y;
      const t3 = 2.625 - x + x * y * y * y;
      return t1 * t1 + t2 * t2 + t3 * t3;
    },
    grad: (x: number, y: number): Vector2D => {
      const t1 = 1.5 - x + x * y;
      const t2 = 2.25 - x + x * y * y;
      const t3 = 2.625 - x + x * y * y * y;
      const dfdx = 2 * t1 * (y - 1) + 2 * t2 * (y * y - 1) + 2 * t3 * (y * y * y - 1);
      const dfdy = 2 * t1 * x + 4 * t2 * x * y + 6 * t3 * x * y * y;
      return [dfdx, dfdy];
    },
    hessian: (x: number, y: number): Matrix2x2 => {
      const t1 = 1.5 - x + x * y;
      const t2 = 2.25 - x + x * y * y;
      const t3 = 2.625 - x + x * y * y * y;
      const hxx =
        2 * (y - 1) * (y - 1) +
        2 * (y * y - 1) * (y * y - 1) +
        2 * (y * y * y - 1) * (y * y * y - 1);
      const hyy =
        2 * x * x +
        2 * (4 * x * x * y * y + t2 * 2 * x) +
        2 * (9 * x * x * Math.pow(y, 4) + t3 * 6 * x * y);
      const hxy =
        2 * (x * (y - 1) + t1) +
        4 * (x * y * (y * y - 1) + t2 * y) +
        6 * (x * y * y * (y * y * y - 1) + t3 * y * y);
      return [
        [hxx, hxy],
        [hxy, hyy],
      ];
    },
  },

  monkey_saddle: {
    id: "monkey_saddle",
    name: "Monkey Saddle Surface",
    category: "saddle",
    formulaTeX: "f(x, y) = x^3 - 3xy^2",
    domain: { xMin: -2.0, xMax: 2.0, yMin: -2.0, yMax: 2.0 },
    globalMinimum: { point: [0.0, 0.0], value: 0.0 },
    defaultStartPoint: [1.2, 0.2],
    alternativeStartPoints: [
      { label: "Ridge Descent (1.2, 0.2)", point: [1.2, 0.2] },
      { label: "Valley Entry (-1.2, 0.5)", point: [-1.2, 0.5] },
      { label: "Symmetric Saddle (0.5, 1.2)", point: [0.5, 1.2] },
      { label: "Near Degeneracy (0.05, 0.05)", point: [0.05, 0.05] },
    ],
    description:
      "A classic degenerate saddle point where three valleys meet three ridges (allowing space for a monkey's two legs and tail). At the origin (0, 0), both the gradient and Hessian vanish identically.",
    educationalNotes:
      "First-order gradient descent stalls near the origin because ||g|| -> 0. Pure second-order Newton steps fail or diverge because the Hessian has zero determinant at the saddle, necessitating Levenberg-Marquardt damping.",
    defaultStepSize: 0.02,
    maxRecommendedSteps: 150,
    fn: (x: number, y: number): number => {
      return x * x * x - 3 * x * y * y;
    },
    grad: (x: number, y: number): Vector2D => {
      const dfdx = 3 * x * x - 3 * y * y;
      const dfdy = -6 * x * y;
      return [dfdx, dfdy];
    },
    hessian: (x: number, y: number): Matrix2x2 => {
      const hxx = 6 * x;
      const hxy = -6 * y;
      const hyy = -6 * x;
      return [
        [hxx, hxy],
        [hxy, hyy],
      ];
    },
  },

  rastrigin: {
    id: "rastrigin",
    name: "Rastrigin Highly Multimodal Grid",
    category: "multimodal",
    formulaTeX: "f(x, y) = 20 + x^2 - 10\\cos(2\\pi x) + y^2 - 10\\cos(2\\pi y)",
    domain: { xMin: -5.12, xMax: 5.12, yMin: -5.12, yMax: 5.12 },
    globalMinimum: { point: [0.0, 0.0], value: 0.0 },
    defaultStartPoint: [3.5, 3.5],
    alternativeStartPoints: [
      { label: "Distant Corner (3.5, 3.5)", point: [3.5, 3.5] },
      { label: "Diagonal Trap (-4.0, 2.5)", point: [-4.0, 2.5] },
      { label: "Near Basin (1.5, -1.0)", point: [1.5, -1.0] },
      { label: "Valley Ridge (-2.5, -3.5)", point: [-2.5, -3.5] },
    ],
    description:
      "Non-convex multimodal landscape with regularly distributed sinusoidal local minima surrounding a global minimum at (0, 0).",
    educationalNotes:
      "Vanilla SGD and RMSprop get quickly trapped in local wells. Momentum and Adam can build sufficient kinetic velocity to tunnel or hop over energy barriers, but high learning rates risk overshooting.",
    defaultStepSize: 0.01,
    maxRecommendedSteps: 250,
    fn: (x: number, y: number): number => {
      const pi = Math.PI;
      return 20 + x * x - 10 * Math.cos(2 * pi * x) + y * y - 10 * Math.cos(2 * pi * y);
    },
    grad: (x: number, y: number): Vector2D => {
      const pi = Math.PI;
      const dfdx = 2 * x + 20 * pi * Math.sin(2 * pi * x);
      const dfdy = 2 * y + 20 * pi * Math.sin(2 * pi * y);
      return [dfdx, dfdy];
    },
    hessian: (x: number, y: number): Matrix2x2 => {
      const pi2 = Math.PI * Math.PI;
      const hxx = 2 + 40 * pi2 * Math.cos(2 * Math.PI * x);
      const hyy = 2 + 40 * pi2 * Math.cos(2 * Math.PI * y);
      return [
        [hxx, 0],
        [0, hyy],
      ];
    },
  },

  ill_conditioned_quadratic: {
    id: "ill_conditioned_quadratic",
    name: "Ill-Conditioned Quadratic Bowl (κ = 50)",
    category: "quadratic",
    formulaTeX: "f(x, y) = \\frac{1}{2}(50x^2 + y^2) = 25x^2 + 0.5y^2",
    domain: { xMin: -2.0, xMax: 2.0, yMin: -4.0, yMax: 4.0 },
    globalMinimum: { point: [0.0, 0.0], value: 0.0 },
    defaultStartPoint: [1.8, 3.5],
    alternativeStartPoints: [
      { label: "Steep Valley Wall (1.8, 3.5)", point: [1.8, 3.5] },
      { label: "Opposite Quadrant (-1.5, -3.0)", point: [-1.5, -3.0] },
      { label: "Sharp Off-Axis (1.5, -3.5)", point: [1.5, -3.5] },
      { label: "Pure X-Axis (1.8, 0.0)", point: [1.8, 0.0] },
    ],
    description:
      "A strictly convex quadratic bowl with condition number κ = λ_max / λ_min = 50. The x-axis is 50 times steeper than the y-axis.",
    educationalNotes:
      "This is the textbook demonstration of conditioning. If α > 2/50 = 0.04, SGD diverges along x. If α < 0.04, progress along y is painfully slow. Newton-CG converges in exactly 1 step because the inverse Hessian perfectly normalizes the anisotropic curvature.",
    defaultStepSize: 0.015,
    maxRecommendedSteps: 150,
    fn: (x: number, y: number): number => {
      return 0.5 * (50 * x * x + y * y);
    },
    grad: (x: number, y: number): Vector2D => {
      return [50 * x, y];
    },
    hessian: (): Matrix2x2 => {
      return [
        [50, 0],
        [0, 1],
      ];
    },
  },

  ackley: {
    id: "ackley",
    name: "Ackley Basin with High-Frequency Ripples",
    category: "multimodal",
    formulaTeX:
      "f(x, y) = -20\\exp\\left(-0.2\\sqrt{0.5(x^2+y^2)}\\right) - \\exp\\left(0.5(\\cos 2\\pi x + \\cos 2\\pi y)\\right) + e + 20",
    domain: { xMin: -5.0, xMax: 5.0, yMin: -5.0, yMax: 5.0 },
    globalMinimum: { point: [0.0, 0.0], value: 0.0 },
    defaultStartPoint: [3.5, 4.0],
    alternativeStartPoints: [
      { label: "Outer Rim (3.5, 4.0)", point: [3.5, 4.0] },
      { label: "Northwest Ridge (-4.0, 3.0)", point: [-4.0, 3.0] },
      { label: "Southeast Plateau (2.0, -3.5)", point: [2.0, -3.5] },
      { label: "Inner Funnel (1.0, 1.0)", point: [1.0, 1.0] },
    ],
    description:
      "A nearly flat outer region modulated by high-frequency ripples leading into a steep central funnel bowl with the global minimum at (0, 0).",
    educationalNotes:
      "The outer plateau has tiny exponential gradients, making standard gradient descent crawl slowly. Adaptive optimizers like Adam scale up effective step sizes in flat regions and adjust damping near the funnel.",
    defaultStepSize: 0.05,
    maxRecommendedSteps: 200,
    fn: (x: number, y: number): number => {
      const r = Math.sqrt(0.5 * (x * x + y * y));
      const trig = 0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y));
      return -20 * Math.exp(-0.2 * r) - Math.exp(trig) + Math.E + 20;
    },
    grad: (x: number, y: number): Vector2D => {
      const r = Math.sqrt(0.5 * (x * x + y * y));
      const trig = 0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y));
      const expTrig = Math.exp(trig);
      const term1X = r > 1e-12 ? (2 * x * Math.exp(-0.2 * r)) / r : 0;
      const term1Y = r > 1e-12 ? (2 * y * Math.exp(-0.2 * r)) / r : 0;
      const term2X = Math.PI * Math.sin(2 * Math.PI * x) * expTrig;
      const term2Y = Math.PI * Math.sin(2 * Math.PI * y) * expTrig;
      return [term1X + term2X, term1Y + term2Y];
    },
    hessian: (x: number, y: number): Matrix2x2 => {
      const r = Math.sqrt(0.5 * (x * x + y * y));
      const trig = 0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y));
      const expTrig = Math.exp(trig);
      let uXX = 0;
      let uYY = 0;
      let uXY = 0;
      if (r > 1e-6) {
        const expR = Math.exp(-0.2 * r);
        const factor = 0.2 * r + 1;
        uXX = (expR / r) * (2 - (x * x * factor) / (r * r));
        uYY = (expR / r) * (2 - (y * y * factor) / (r * r));
        uXY = -(x * y * expR * factor) / (r * r * r);
      }
      const pi2 = Math.PI * Math.PI;
      const sinX = Math.sin(2 * Math.PI * x);
      const sinY = Math.sin(2 * Math.PI * y);
      const cosX = Math.cos(2 * Math.PI * x);
      const cosY = Math.cos(2 * Math.PI * y);

      const vXX = 2 * pi2 * cosX * expTrig - pi2 * sinX * sinX * expTrig;
      const vYY = 2 * pi2 * cosY * expTrig - pi2 * sinY * sinY * expTrig;
      const vXY = -pi2 * sinX * sinY * expTrig;

      return [
        [uXX + vXX, uXY + vXY],
        [uXY + vXY, uYY + vYY],
      ];
    },
  },
};

// ============================================================================
// 3. NUMERICAL VERIFICATION & LINEAR ALGEBRA UTILITIES
// ============================================================================

export function computeNumericalGradient(
  fn: (x: number, y: number) => number,
  x: number,
  y: number,
  h = 1e-5,
): Vector2D {
  const dfdx = (fn(x + h, y) - fn(x - h, y)) / (2 * h);
  const dfdy = (fn(x, y + h) - fn(x, y - h)) / (2 * h);
  return [dfdx, dfdy];
}

export function computeNumericalHessian(
  fn: (x: number, y: number) => number,
  x: number,
  y: number,
  h = 1e-4,
): Matrix2x2 {
  const f0 = fn(x, y);
  const hxx = (fn(x + h, y) - 2 * f0 + fn(x - h, y)) / (h * h);
  const hyy = (fn(x, y + h) - 2 * f0 + fn(x, y - h)) / (h * h);
  const hxy =
    (fn(x + h, y + h) - fn(x + h, y - h) - fn(x - h, y + h) + fn(x - h, y - h)) / (4 * h * h);
  return [
    [hxx, hxy],
    [hxy, hyy],
  ];
}

export function compute2x2SymmetricEigen(H: Matrix2x2): EigenResult {
  const a = H[0][0];
  const b = H[0][1];
  const d = H[1][1];

  const trace = a + d;
  const discriminant = Math.max(0, (a - d) * (a - d) + 4 * b * b);
  const sqrtDisc = Math.sqrt(discriminant);

  const lambda1 = (trace + sqrtDisc) / 2;
  const lambda2 = (trace - sqrtDisc) / 2;

  let v1: Vector2D;
  let v2: Vector2D;

  if (Math.abs(b) > 1e-10) {
    const rawV1X = lambda1 - d;
    const rawV1Y = b;
    const norm1 = Math.hypot(rawV1X, rawV1Y);
    v1 = [rawV1X / norm1, rawV1Y / norm1];
    v2 = [-v1[1], v1[0]];
  } else {
    if (a >= d) {
      v1 = [1, 0];
      v2 = [0, 1];
    } else {
      v1 = [0, 1];
      v2 = [1, 0];
    }
  }

  const abs1 = Math.abs(lambda1);
  const abs2 = Math.abs(lambda2);
  const maxAbs = Math.max(abs1, abs2);
  const minAbs = Math.min(abs1, abs2);

  const conditionNumber = minAbs > 1e-10 ? Math.min(1e6, maxAbs / minAbs) : Infinity;

  let curvatureType: CurvatureType = "degenerate";
  if (lambda1 > 1e-5 && lambda2 > 1e-5) {
    curvatureType = "minimum";
  } else if (lambda1 < -1e-5 && lambda2 < -1e-5) {
    curvatureType = "maximum";
  } else if (lambda1 * lambda2 < -1e-5) {
    curvatureType = "saddle";
  } else {
    curvatureType = "degenerate";
  }

  return {
    lambda1,
    lambda2,
    conditionNumber,
    curvatureType,
    principalVector1: v1,
    principalVector2: v2,
  };
}

// ============================================================================
// 4. OPTIMIZER ALGORITHMS & STEP UPDATES
// ============================================================================

export const OPTIMIZER_CONFIGS: Record<OptimizerId, OptimizerConfig> = {
  sgd: {
    id: "sgd",
    name: "Stochastic Gradient Descent",
    shortName: "SGD",
    color: "amber",
    hexColor: "#F59E0B",
    formulaTeX: "\\theta_{t+1} = \\theta_t - \\alpha g_t",
    description:
      "Vanilla first-order gradient descent. Follows the negative gradient direction with a constant step size.",
    defaultHyperparameters: {
      learningRate: 0.001,
    },
  },

  momentum: {
    id: "momentum",
    name: "Polyak Heavy-Ball Momentum",
    shortName: "Momentum",
    color: "blue",
    hexColor: "#3B82F6",
    formulaTeX: "v_{t+1} = \\beta_1 v_t + \\alpha g_t, \\quad \\theta_{t+1} = \\theta_t - v_{t+1}",
    description:
      "Accumulates velocity along persistent gradient directions and damps high-frequency oscillations across steep ravines.",
    defaultHyperparameters: {
      learningRate: 0.001,
      momentumBeta1: 0.9,
    },
  },

  rmsprop: {
    id: "rmsprop",
    name: "RMSprop (Root Mean Square Prop)",
    shortName: "RMSprop",
    color: "purple",
    hexColor: "#A855F7",
    formulaTeX:
      "s_{t+1} = \\beta_2 s_t + (1-\\beta_2)g_t^2, \\quad \\theta_{t+1} = \\theta_t - \\frac{\\alpha}{\\sqrt{s_{t+1}}+\\epsilon} g_t",
    description:
      "Adaptive learning rates via exponentially decaying average of squared gradients, automatically scaling coordinates with disparate curvatures.",
    defaultHyperparameters: {
      learningRate: 0.02,
      rmspropBeta2: 0.99,
      epsilon: 1e-8,
    },
  },

  adam: {
    id: "adam",
    name: "Adam (Adaptive Moment Estimation)",
    shortName: "Adam",
    color: "emerald",
    hexColor: "#10B981",
    formulaTeX:
      "\\hat{m} = \\frac{m_t}{1-\\beta_1^t}, \\; \\hat{v} = \\frac{v_t}{1-\\beta_2^t}, \\; \\theta_{t+1} = \\theta_t - \\frac{\\alpha}{\\sqrt{\\hat{v}}+\\epsilon} \\hat{m}",
    description:
      "Combines first-moment velocity with second-moment preconditioning and bias correction for initial time steps.",
    defaultHyperparameters: {
      learningRate: 0.05,
      adamBeta1: 0.9,
      adamBeta2: 0.999,
      epsilon: 1e-8,
    },
  },

  adamw: {
    id: "adamw",
    name: "AdamW (Decoupled Weight Decay)",
    shortName: "AdamW",
    color: "cyan",
    hexColor: "#06B6D4",
    formulaTeX:
      "\\theta_{t+1} = \\theta_t(1 - \\alpha\\lambda) - \\frac{\\alpha}{\\sqrt{\\hat{v}}+\\epsilon}\\hat{m}",
    description:
      "Loshchilov & Hutter formulation decoupling L2 regularization from adaptive gradient second-moment updates.",
    defaultHyperparameters: {
      learningRate: 0.05,
      adamBeta1: 0.9,
      adamBeta2: 0.999,
      epsilon: 1e-8,
      weightDecay: 0.01,
    },
  },

  newton_cg: {
    id: "newton_cg",
    name: "Damped Newton-CG (2nd Order)",
    shortName: "Newton-CG",
    color: "rose",
    hexColor: "#F43F5E",
    formulaTeX: "(H_t + \\mu I) d_t = -g_t, \\quad \\theta_{t+1} = \\theta_t + \\alpha d_t",
    description:
      "Second-order curvature optimization solving the damped Newton linear system (H + μI)d = -g. Converges quadratically on convex regions.",
    defaultHyperparameters: {
      learningRate: 1.0,
      newtonDamping: 0.01,
    },
  },
};

export interface OptimizerStepState {
  readonly t: number;
  readonly v?: Vector2D;
  readonly s?: Vector2D;
  readonly m?: Vector2D;
}

export function simulateOptimizerStep(
  optimizerId: OptimizerId,
  point: Vector2D,
  grad: Vector2D,
  hessian: Matrix2x2,
  state: OptimizerStepState,
  hyperparams: OptimizerHyperparameters,
): { readonly nextPoint: Vector2D; readonly nextState: OptimizerStepState } {
  const [x, y] = point;
  const [gx, gy] = grad;
  const currentT = state.t || 0;
  const nextT = currentT + 1;

  switch (optimizerId) {
    case "sgd": {
      const alpha = hyperparams.learningRate;
      const nextPoint: Vector2D = [x - alpha * gx, y - alpha * gy];
      return { nextPoint, nextState: { t: nextT } };
    }

    case "momentum": {
      const alpha = hyperparams.learningRate;
      const beta1 = hyperparams.momentumBeta1 ?? 0.9;
      const prevV = state.v ?? [0, 0];
      const vx = beta1 * prevV[0] + alpha * gx;
      const vy = beta1 * prevV[1] + alpha * gy;
      const nextPoint: Vector2D = [x - vx, y - vy];
      return { nextPoint, nextState: { t: nextT, v: [vx, vy] } };
    }

    case "rmsprop": {
      const alpha = hyperparams.learningRate;
      const beta2 = hyperparams.rmspropBeta2 ?? 0.99;
      const eps = hyperparams.epsilon ?? 1e-8;
      const prevS = state.s ?? [0, 0];
      const sx = beta2 * prevS[0] + (1 - beta2) * gx * gx;
      const sy = beta2 * prevS[1] + (1 - beta2) * gy * gy;
      const nextPoint: Vector2D = [
        x - (alpha / (Math.sqrt(sx) + eps)) * gx,
        y - (alpha / (Math.sqrt(sy) + eps)) * gy,
      ];
      return { nextPoint, nextState: { t: nextT, s: [sx, sy] } };
    }

    case "adam": {
      const alpha = hyperparams.learningRate;
      const beta1 = hyperparams.adamBeta1 ?? 0.9;
      const beta2 = hyperparams.adamBeta2 ?? 0.999;
      const eps = hyperparams.epsilon ?? 1e-8;
      const prevM = state.m ?? [0, 0];
      const prevV = state.v ?? [0, 0];

      const mx = beta1 * prevM[0] + (1 - beta1) * gx;
      const my = beta1 * prevM[1] + (1 - beta1) * gy;
      const vx = beta2 * prevV[0] + (1 - beta2) * gx * gx;
      const vy = beta2 * prevV[1] + (1 - beta2) * gy * gy;

      const biasCorrection1 = 1 - Math.pow(beta1, nextT);
      const biasCorrection2 = 1 - Math.pow(beta2, nextT);

      const mHatX = mx / (biasCorrection1 || 1e-12);
      const mHatY = my / (biasCorrection1 || 1e-12);
      const vHatX = vx / (biasCorrection2 || 1e-12);
      const vHatY = vy / (biasCorrection2 || 1e-12);

      const nextPoint: Vector2D = [
        x - (alpha / (Math.sqrt(Math.max(0, vHatX)) + eps)) * mHatX,
        y - (alpha / (Math.sqrt(Math.max(0, vHatY)) + eps)) * mHatY,
      ];
      return {
        nextPoint,
        nextState: { t: nextT, m: [mx, my], v: [vx, vy] },
      };
    }

    case "adamw": {
      const alpha = hyperparams.learningRate;
      const beta1 = hyperparams.adamBeta1 ?? 0.9;
      const beta2 = hyperparams.adamBeta2 ?? 0.999;
      const eps = hyperparams.epsilon ?? 1e-8;
      const lambda = hyperparams.weightDecay ?? 0.01;
      const prevM = state.m ?? [0, 0];
      const prevV = state.v ?? [0, 0];

      const mx = beta1 * prevM[0] + (1 - beta1) * gx;
      const my = beta1 * prevM[1] + (1 - beta1) * gy;
      const vx = beta2 * prevV[0] + (1 - beta2) * gx * gx;
      const vy = beta2 * prevV[1] + (1 - beta2) * gy * gy;

      const biasCorrection1 = 1 - Math.pow(beta1, nextT);
      const biasCorrection2 = 1 - Math.pow(beta2, nextT);

      const mHatX = mx / (biasCorrection1 || 1e-12);
      const mHatY = my / (biasCorrection1 || 1e-12);
      const vHatX = vx / (biasCorrection2 || 1e-12);
      const vHatY = vy / (biasCorrection2 || 1e-12);

      const decayedX = x * (1 - alpha * lambda);
      const decayedY = y * (1 - alpha * lambda);

      const nextPoint: Vector2D = [
        decayedX - (alpha / (Math.sqrt(Math.max(0, vHatX)) + eps)) * mHatX,
        decayedY - (alpha / (Math.sqrt(Math.max(0, vHatY)) + eps)) * mHatY,
      ];
      return {
        nextPoint,
        nextState: { t: nextT, m: [mx, my], v: [vx, vy] },
      };
    }

    case "newton_cg": {
      const alpha = hyperparams.learningRate ?? 1.0;
      const mu = hyperparams.newtonDamping ?? 0.01;

      let hxx = hessian[0][0] + mu;
      const hxy = hessian[0][1];
      let hyy = hessian[1][1] + mu;

      let det = hxx * hyy - hxy * hxy;

      if (det <= 1e-6 || hxx + hyy <= 0) {
        const extraDamp = Math.max(0.5, 2.0 - Math.min(hxx, hyy));
        hxx += extraDamp;
        hyy += extraDamp;
        det = hxx * hyy - hxy * hxy;
      }

      let dx = (-hyy * gx + hxy * gy) / (det || 1e-10);
      let dy = (hxy * gx - hxx * gy) / (det || 1e-10);

      const stepNorm = Math.hypot(dx, dy);
      const maxAllowedStep = 25.0;
      if (stepNorm > maxAllowedStep) {
        dx = (dx / stepNorm) * maxAllowedStep;
        dy = (dy / stepNorm) * maxAllowedStep;
      }

      const nextPoint: Vector2D = [x + alpha * dx, y + alpha * dy];
      return { nextPoint, nextState: { t: nextT } };
    }
  }
}

export function simulateFullTrajectory(
  landscapeId: LandscapeId,
  optimizerId: OptimizerId,
  startPoint: Vector2D,
  maxSteps: number,
  customHyperparams?: Partial<OptimizerHyperparameters>,
  tolerance = 1e-5,
): TrajectoryResult {
  const landscape = OPTIMIZATION_LANDSCAPES[landscapeId];
  const config = OPTIMIZER_CONFIGS[optimizerId];
  const hyperparams: OptimizerHyperparameters = {
    ...config.defaultHyperparameters,
    learningRate:
      customHyperparams?.learningRate ??
      landscape.defaultStepSize *
        (optimizerId === "newton_cg"
          ? 1.0
          : optimizerId === "adam" || optimizerId === "adamw"
            ? 3.0
            : optimizerId === "rmsprop"
              ? 2.0
              : 1.0),
    ...customHyperparams,
  };

  const points: TrajectoryPoint[] = [];
  let currentPoint: Vector2D = [startPoint[0], startPoint[1]];
  let currentState: OptimizerStepState = { t: 0 };
  let converged = false;
  let diverged = false;
  let stepsToThreshold: number | null = null;
  let cumulativeDistance = 0;

  for (let step = 0; step <= maxSteps; step++) {
    const [x, y] = currentPoint;

    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e4 || Math.abs(y) > 1e4) {
      diverged = true;
      break;
    }

    const loss = landscape.fn(x, y);
    if (!Number.isFinite(loss) || loss > 1e8) {
      diverged = true;
      break;
    }

    const grad = landscape.grad(x, y);
    const gradNorm = Math.hypot(grad[0], grad[1]);
    const hessian = landscape.hessian(x, y);
    const eigen = compute2x2SymmetricEigen(hessian);

    let stepDistance = 0;
    if (step > 0 && points.length > 0) {
      const prev = points[points.length - 1].point;
      stepDistance = Math.hypot(x - prev[0], y - prev[1]);
      cumulativeDistance += stepDistance;
    }

    const trajPt: TrajectoryPoint = {
      step,
      point: [x, y],
      loss,
      grad,
      gradNorm,
      stepDistance,
      cumulativeDistance,
      hessian,
      eigenvalues: [eigen.lambda1, eigen.lambda2],
      conditionNumber: eigen.conditionNumber,
      curvatureType: eigen.curvatureType,
    };
    points.push(trajPt);

    const lossDiff = Math.abs(loss - landscape.globalMinimum.value);
    if ((lossDiff < tolerance || gradNorm < tolerance) && stepsToThreshold === null) {
      converged = true;
      stepsToThreshold = step;
    }

    if (step === maxSteps) break;

    const update = simulateOptimizerStep(
      optimizerId,
      currentPoint,
      grad,
      hessian,
      currentState,
      hyperparams,
    );
    currentPoint = update.nextPoint;
    currentState = update.nextState;
  }

  const lastPt = points[points.length - 1] ?? {
    loss: Infinity,
    gradNorm: Infinity,
    point: startPoint,
  };
  const totalPathLength = cumulativeDistance;
  const euclideanDistance = Math.hypot(
    lastPt.point[0] - startPoint[0],
    lastPt.point[1] - startPoint[1],
  );
  const tortuosity =
    euclideanDistance > 1e-6 ? Math.max(1.0, totalPathLength / euclideanDistance) : 1.0;

  return {
    optimizerId,
    optimizerName: config.name,
    color: config.hexColor,
    points,
    converged,
    diverged,
    stepsToThreshold,
    totalPathLength,
    euclideanDistance,
    tortuosity,
    finalLoss: lastPt.loss,
    finalGradNorm: lastPt.gradNorm,
    finalPoint: lastPt.point,
  };
}

export function simulateAllOptimizers(
  landscapeId: LandscapeId,
  activeOptimizerIds: readonly OptimizerId[],
  startPoint: Vector2D,
  maxSteps: number,
  customHyperparams?: Partial<Record<OptimizerId, OptimizerHyperparameters>>,
  tolerance = 1e-5,
): Record<OptimizerId, TrajectoryResult> {
  const results = {} as Record<OptimizerId, TrajectoryResult>;
  for (const optId of activeOptimizerIds) {
    results[optId] = simulateFullTrajectory(
      landscapeId,
      optId,
      startPoint,
      maxSteps,
      customHyperparams?.[optId],
      tolerance,
    );
  }
  return results;
}

function getElevationColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  let r = 0;
  let g = 0;
  let b = 0;
  if (clamped < 0.33) {
    const s = clamped / 0.33;
    r = Math.round(15 + s * 70);
    g = Math.round(23 + s * 40);
    b = Math.round(60 + s * 140);
  } else if (clamped < 0.66) {
    const s = (clamped - 0.33) / 0.33;
    r = Math.round(85 + s * 110);
    g = Math.round(63 + s * 30);
    b = Math.round(200 - s * 100);
  } else {
    const s = (clamped - 0.66) / 0.34;
    r = Math.round(195 + s * 55);
    g = Math.round(93 + s * 140);
    b = Math.round(100 - s * 80);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

// ============================================================================
// 6. REACT COMPONENT IMPLEMENTATION
// ============================================================================

export const OptimizationLandscapeStudio: React.FC<OptimizationLandscapeStudioProps> = ({
  initialLandscape = "rosenbrock",
  initialStartPoint,
  initialOptimizers = ["sgd", "momentum", "rmsprop", "adam", "adamw", "newton_cg"],
  initialMaxSteps = 100,
  initialTolerance = 1e-4,
  initialViewMode = "contour_2d",
  width = 980,
  height = 620,
  standalone = false,
  title = "Optimization & Loss Landscape Studio",
  onLandscapeChange,
  onStepChange,
  onSimulationComplete,
}) => {
  const numWidth = typeof width === "number" ? width : 980;
  const numHeight = typeof height === "number" ? height : 620;
  const { ref: containerRef } = useCanvasBox({ width: numWidth, height: numHeight });

  const [landscapeId, setLandscapeId] = useState<LandscapeId>(initialLandscape);
  const [viewMode, setViewMode] = useState<StudioViewMode>(initialViewMode);
  const [activeOptimizers, setActiveOptimizers] = useState<OptimizerId[]>(
    initialOptimizers as OptimizerId[],
  );
  const [maxSteps, setMaxSteps] = useState<number>(initialMaxSteps);
  const [tolerance] = useState<number>(initialTolerance);

  const currentLandscapeDef = OPTIMIZATION_LANDSCAPES[landscapeId];
  const [startPoint, setStartPoint] = useState<Vector2D>(
    initialStartPoint ?? currentLandscapeDef.defaultStartPoint,
  );

  const [customHyperparams, setCustomHyperparams] = useState<
    Partial<Record<OptimizerId, OptimizerHyperparameters>>
  >({});
  const [showHyperparamDrawer, setShowHyperparamDrawer] = useState<boolean>(false);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const [showVectorField, setShowVectorField] = useState<boolean>(true);
  const [vectorFieldDensity] = useState<number>(14);
  const [probePoint, setProbePoint] = useState<Vector2D | null>(null);
  const [isDraggingStart, setIsDraggingStart] = useState<boolean>(false);

  const [azimuthDeg, setAzimuthDeg] = useState<number>(45);
  const [elevationDeg, setElevationDeg] = useState<number>(35);
  const [zoom3D, setZoom3D] = useState<number>(1.0);
  const isOrbitingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const simulationResults = useMemo(() => {
    const results = simulateAllOptimizers(
      landscapeId,
      activeOptimizers,
      startPoint,
      maxSteps,
      customHyperparams,
      tolerance,
    );
    onSimulationComplete?.(results);
    return results;
  }, [
    landscapeId,
    activeOptimizers,
    startPoint,
    maxSteps,
    customHyperparams,
    tolerance,
    onSimulationComplete,
  ]);

  const handleSelectLandscape = (newId: LandscapeId) => {
    setLandscapeId(newId);
    const newDef = OPTIMIZATION_LANDSCAPES[newId];
    setStartPoint(newDef.defaultStartPoint);
    setCurrentStep(0);
    setIsPlaying(false);
    setProbePoint(null);
    onLandscapeChange?.(newId);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(20, Math.floor(100 / playbackSpeed));
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= maxSteps) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        onStepChange?.(next);
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, maxSteps, playbackSpeed, onStepChange]);

  const handleTogglePlay = () => {
    if (currentStep >= maxSteps) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => {
      const next = Math.min(maxSteps, prev + 1);
      onStepChange?.(next);
      return next;
    });
  };

  const handleStepBackward = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => {
      const next = Math.max(0, prev - 1);
      onStepChange?.(next);
      return next;
    });
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    onStepChange?.(0);
  };

  const toggleOptimizer = (id: OptimizerId) => {
    setActiveOptimizers((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const contourCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = contourCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const { xMin, xMax, yMin, yMax } = currentLandscapeDef.domain;
    const xSpan = xMax - xMin;
    const ySpan = yMax - yMin;

    const worldToScreen = (wx: number, wy: number): [number, number] => {
      const sx = ((wx - xMin) / xSpan) * canvasWidth;
      const sy = canvasHeight - ((wy - yMin) / ySpan) * canvasHeight;
      return [sx, sy];
    };

    const fMin = currentLandscapeDef.globalMinimum.value;
    const sampleLosses: number[] = [];
    for (let j = 0; j <= 20; j++) {
      for (let i = 0; i <= 20; i++) {
        const wx = xMin + (i / 20) * xSpan;
        const wy = yMin + (j / 20) * ySpan;
        sampleLosses.push(currentLandscapeDef.fn(wx, wy));
      }
    }
    const maxSample = Math.max(...sampleLosses, 10);
    const logRange = Math.log10(1 + maxSample - fMin);

    for (let py = 0; py < canvasHeight; py += 3) {
      const wy = yMax - (py / canvasHeight) * ySpan;
      for (let px = 0; px < canvasWidth; px += 3) {
        const wx = xMin + (px / canvasWidth) * xSpan;
        const lossVal = currentLandscapeDef.fn(wx, wy);
        const logVal = Math.log10(1 + Math.max(0, lossVal - fMin));
        const normalized = Math.min(1.0, logVal / (logRange || 1));

        const colStr = getElevationColor(normalized);
        ctx.fillStyle = colStr;
        ctx.fillRect(px, py, 3, 3);
      }
    }

    if (showVectorField) {
      const density = vectorFieldDensity;
      const stepX = xSpan / density;
      const stepY = ySpan / density;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1.2;

      for (let i = 0; i <= density; i++) {
        const wx = xMin + (i + 0.5) * stepX;
        for (let j = 0; j <= density; j++) {
          const wy = yMin + (j + 0.5) * stepY;
          const [gx, gy] = currentLandscapeDef.grad(wx, wy);
          const gNorm = Math.hypot(gx, gy);
          if (gNorm < 1e-10) continue;

          const dirX = -gx / gNorm;
          const dirY = -gy / gNorm;
          const arrowLen = 10;

          const [sx, sy] = worldToScreen(wx, wy);
          const ex = sx + dirX * arrowLen;
          const ey = sy - dirY * arrowLen;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();

          const headLen = 3.5;
          const angle = Math.atan2(-dirY, dirX);
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(
            ex - headLen * Math.cos(angle - Math.PI / 6),
            ey - headLen * Math.sin(angle - Math.PI / 6),
          );
          ctx.lineTo(
            ex - headLen * Math.cos(angle + Math.PI / 6),
            ey - headLen * Math.sin(angle + Math.PI / 6),
          );
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    const [minSx, minSy] = worldToScreen(
      currentLandscapeDef.globalMinimum.point[0],
      currentLandscapeDef.globalMinimum.point[1],
    );
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#FBBF24";
    ctx.fillStyle = "#FBBF24";
    ctx.beginPath();
    ctx.arc(minSx, minSy, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    for (const optId of activeOptimizers) {
      const traj = simulationResults[optId];
      if (!traj || traj.points.length === 0) continue;

      const ptsToRender = traj.points.slice(0, Math.min(currentStep + 1, traj.points.length));
      if (ptsToRender.length === 0) continue;

      ctx.beginPath();
      const [startSx, startSy] = worldToScreen(ptsToRender[0].point[0], ptsToRender[0].point[1]);
      ctx.moveTo(startSx, startSy);

      for (let k = 1; k < ptsToRender.length; k++) {
        const [px, py] = worldToScreen(ptsToRender[k].point[0], ptsToRender[k].point[1]);
        ctx.lineTo(px, py);
      }

      ctx.strokeStyle = traj.color;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = traj.color;
      ctx.stroke();
      ctx.shadowBlur = 0;

      for (let k = 0; k < ptsToRender.length; k++) {
        const [px, py] = worldToScreen(ptsToRender[k].point[0], ptsToRender[k].point[1]);
        ctx.fillStyle = traj.color;
        ctx.beginPath();
        ctx.arc(px, py, k === ptsToRender.length - 1 ? 4.5 : 2, 0, 2 * Math.PI);
        ctx.fill();
      }

      const currentHead = ptsToRender[ptsToRender.length - 1];
      const [headSx, headSy] = worldToScreen(currentHead.point[0], currentHead.point[1]);

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(headSx, headSy, 7, 0, 2 * Math.PI);
      ctx.stroke();
    }

    const [spSx, spSy] = worldToScreen(startPoint[0], startPoint[1]);
    ctx.fillStyle = "#38BDF8";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#38BDF8";
    ctx.beginPath();
    ctx.arc(spSx, spSy, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (probePoint) {
      const [probeSx, probeSy] = worldToScreen(probePoint[0], probePoint[1]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(probeSx, 0);
      ctx.lineTo(probeSx, canvasHeight);
      ctx.moveTo(0, probeSy);
      ctx.lineTo(canvasWidth, probeSy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#F43F5E";
      ctx.beginPath();
      ctx.arc(probeSx, probeSy, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();
    }
  }, [
    currentLandscapeDef,
    activeOptimizers,
    simulationResults,
    currentStep,
    startPoint,
    probePoint,
    showVectorField,
    vectorFieldDensity,
  ]);

  const handleContourCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = contourCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const { xMin, xMax, yMin, yMax } = currentLandscapeDef.domain;
    const wx = xMin + (clickX / rect.width) * (xMax - xMin);
    const wy = yMax - (clickY / rect.height) * (yMax - yMin);

    const distToStart = Math.hypot(wx - startPoint[0], wy - startPoint[1]);
    if (distToStart < (xMax - xMin) * 0.08) {
      setIsDraggingStart(true);
    } else {
      setStartPoint([wx, wy]);
      setCurrentStep(0);
      setIsPlaying(false);
    }
  };

  const handleContourCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = contourCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { xMin, xMax, yMin, yMax } = currentLandscapeDef.domain;
    const wx = xMin + (mouseX / rect.width) * (xMax - xMin);
    const wy = yMax - (mouseY / rect.height) * (yMax - yMin);

    if (isDraggingStart) {
      setStartPoint([wx, wy]);
      setCurrentStep(0);
      setIsPlaying(false);
    } else {
      setProbePoint([wx, wy]);
    }
  };

  const handleContourCanvasMouseUp = () => {
    setIsDraggingStart(false);
  };

  const handleContourCanvasMouseLeave = () => {
    setIsDraggingStart(false);
    setProbePoint(null);
  };

  const surfaceCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (viewMode !== "surface_3d") return;
    const canvas = surfaceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const { xMin, xMax, yMin, yMax } = currentLandscapeDef.domain;
    const fMin = currentLandscapeDef.globalMinimum.value;

    const radAz = (azimuthDeg * Math.PI) / 180;
    const radEl = (elevationDeg * Math.PI) / 180;
    const cosAz = Math.cos(radAz);
    const sinAz = Math.sin(radAz);
    const cosEl = Math.cos(radEl);
    const sinEl = Math.sin(radEl);

    const project3D = (
      wx: number,
      wy: number,
      wz: number,
    ): { readonly sx: number; readonly sy: number; readonly depth: number } => {
      const nx = ((wx - xMin) / (xMax - xMin)) * 2 - 1;
      const ny = ((wy - yMin) / (yMax - yMin)) * 2 - 1;
      const logZ = Math.log10(1 + Math.max(0, wz - fMin));
      const nz = Math.min(2.0, logZ * 0.8) - 0.5;

      const rx = nx * cosAz - ny * sinAz;
      const ry = nx * sinAz + ny * cosAz;

      const rz = ry * sinEl + nz * cosEl;
      const depth = ry * cosEl - nz * sinEl;

      const scale = (canvasWidth * 0.36 * zoom3D) / (2.5 + depth * 0.4);
      const sx = canvasWidth / 2 + rx * scale;
      const sy = canvasHeight / 2 - rz * scale + 30;

      return { sx, sy, depth };
    };

    const gridN = 28;
    interface MeshQuad {
      pts: [
        { sx: number; sy: number },
        { sx: number; sy: number },
        { sx: number; sy: number },
        { sx: number; sy: number },
      ];
      avgDepth: number;
      avgZ: number;
    }

    const quads: MeshQuad[] = [];
    for (let i = 0; i < gridN; i++) {
      const wx0 = xMin + (i / gridN) * (xMax - xMin);
      const wx1 = xMin + ((i + 1) / gridN) * (xMax - xMin);
      for (let j = 0; j < gridN; j++) {
        const wy0 = yMin + (j / gridN) * (yMax - yMin);
        const wy1 = yMin + ((j + 1) / gridN) * (yMax - yMin);

        const z00 = currentLandscapeDef.fn(wx0, wy0);
        const z10 = currentLandscapeDef.fn(wx1, wy0);
        const z11 = currentLandscapeDef.fn(wx1, wy1);
        const z01 = currentLandscapeDef.fn(wx0, wy1);

        const p00 = project3D(wx0, wy0, z00);
        const p10 = project3D(wx1, wy0, z10);
        const p11 = project3D(wx1, wy1, z11);
        const p01 = project3D(wx0, wy1, z01);

        const avgDepth = (p00.depth + p10.depth + p11.depth + p01.depth) / 4;
        const avgZ = (z00 + z10 + z11 + z01) / 4;

        quads.push({
          pts: [p00, p10, p11, p01],
          avgDepth,
          avgZ,
        });
      }
    }

    quads.sort((a, b) => b.avgDepth - a.avgDepth);

    for (const q of quads) {
      const logZ = Math.log10(1 + Math.max(0, q.avgZ - fMin));
      const col = getElevationColor(Math.min(1.0, logZ * 0.4));

      ctx.beginPath();
      ctx.moveTo(q.pts[0].sx, q.pts[0].sy);
      ctx.lineTo(q.pts[1].sx, q.pts[1].sy);
      ctx.lineTo(q.pts[2].sx, q.pts[2].sy);
      ctx.lineTo(q.pts[3].sx, q.pts[3].sy);
      ctx.closePath();

      ctx.fillStyle = col;
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    for (const optId of activeOptimizers) {
      const traj = simulationResults[optId];
      if (!traj || traj.points.length === 0) continue;

      const ptsToRender = traj.points.slice(0, Math.min(currentStep + 1, traj.points.length));
      if (ptsToRender.length === 0) continue;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      for (const pt of ptsToRender) {
        const topP = project3D(pt.point[0], pt.point[1], pt.loss);
        const baseP = project3D(pt.point[0], pt.point[1], fMin);
        ctx.beginPath();
        ctx.moveTo(topP.sx, topP.sy);
        ctx.lineTo(baseP.sx, baseP.sy);
        ctx.stroke();
      }

      ctx.beginPath();
      const p0 = project3D(ptsToRender[0].point[0], ptsToRender[0].point[1], ptsToRender[0].loss);
      ctx.moveTo(p0.sx, p0.sy);

      for (let k = 1; k < ptsToRender.length; k++) {
        const pk = project3D(ptsToRender[k].point[0], ptsToRender[k].point[1], ptsToRender[k].loss);
        ctx.lineTo(pk.sx, pk.sy);
      }

      ctx.strokeStyle = traj.color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 8;
      ctx.shadowColor = traj.color;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const head = ptsToRender[ptsToRender.length - 1];
      const headProj = project3D(head.point[0], head.point[1], head.loss);

      ctx.fillStyle = traj.color;
      ctx.beginPath();
      ctx.arc(headProj.sx, headProj.sy, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const min3D = project3D(
      currentLandscapeDef.globalMinimum.point[0],
      currentLandscapeDef.globalMinimum.point[1],
      currentLandscapeDef.globalMinimum.value,
    );
    ctx.fillStyle = "#FBBF24";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FBBF24";
    ctx.beginPath();
    ctx.arc(min3D.sx, min3D.sy, 7, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [
    viewMode,
    currentLandscapeDef,
    activeOptimizers,
    simulationResults,
    currentStep,
    azimuthDeg,
    elevationDeg,
    zoom3D,
  ]);

  const handleSurfaceCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isOrbitingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleSurfaceCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isOrbitingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setAzimuthDeg((prev) => (prev + dx * 0.6 + 360) % 360);
    setElevationDeg((prev) => Math.max(10, Math.min(85, prev - dy * 0.4)));
  };

  const handleSurfaceCanvasMouseUp = () => {
    isOrbitingRef.current = false;
  };

  const inspectedData = useMemo(() => {
    const target = probePoint ?? startPoint;
    const loss = currentLandscapeDef.fn(target[0], target[1]);
    const grad = currentLandscapeDef.grad(target[0], target[1]);
    const gradNorm = Math.hypot(grad[0], grad[1]);
    const hessian = currentLandscapeDef.hessian(target[0], target[1]);
    const eigen = compute2x2SymmetricEigen(hessian);

    return {
      target,
      loss,
      grad,
      gradNorm,
      hessian,
      eigen,
    };
  }, [probePoint, startPoint, currentLandscapeDef]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans ${
        standalone ? "w-full max-w-7xl mx-auto my-4" : "w-full h-full"
      }`}
      style={{ minHeight: typeof height === "number" ? height : 600 }}
    >
      {/* HEADER & VIEW TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-100 tracking-tight flex items-center gap-2">
              {title}
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                v3.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive 2D/3D loss contours, multi-optimizer race simulations & curvature
              analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("contour_2d")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === "contour_2d"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            2D Contour
          </button>
          <button
            type="button"
            onClick={() => setViewMode("surface_3d")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === "surface_3d"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            3D Wireframe
          </button>
          <button
            type="button"
            onClick={() => setViewMode("race_comparison")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === "race_comparison"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Race Leaderboard
          </button>
          <button
            type="button"
            onClick={() => setViewMode("analytics")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === "analytics"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Convergence Curves
          </button>
          <button
            type="button"
            onClick={() => setViewMode("theory")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === "theory"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Theory Guide
          </button>
        </div>
      </div>

      {/* SECONDARY CONTROL BAR: LANDSCAPES & PRESET SELECTORS */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Landscape:</span>
          <select
            value={landscapeId}
            onChange={(e) => handleSelectLandscape(e.target.value as LandscapeId)}
            aria-label="Select benchmark landscape"
            className="bg-slate-950 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            {Object.values(OPTIMIZATION_LANDSCAPES).map((land) => (
              <option key={land.id} value={land.id}>
                {land.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Start (x₀, y₀):</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              value={Number(startPoint[0].toFixed(2))}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (Number.isFinite(val)) {
                  setStartPoint([val, startPoint[1]]);
                  setCurrentStep(0);
                }
              }}
              aria-label="Start point X coordinate"
              className="w-16 px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-center text-indigo-300 font-mono"
            />
            <input
              type="number"
              step="0.1"
              value={Number(startPoint[1].toFixed(2))}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (Number.isFinite(val)) {
                  setStartPoint([startPoint[0], val]);
                  setCurrentStep(0);
                }
              }}
              aria-label="Start point Y coordinate"
              className="w-16 px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-center text-indigo-300 font-mono"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1">
            {currentLandscapeDef.alternativeStartPoints.map((alt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setStartPoint(alt.point);
                  setCurrentStep(0);
                }}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
                title={alt.label}
              >
                P{idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHyperparamDrawer(!showHyperparamDrawer)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            Hyperparameters
            {showHyperparamDrawer ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* OPTIMIZER FILTER BADGES & QUICK TOGGLES */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 text-xs">
        <span className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">
          Active Optimizers:
        </span>
        {Object.values(OPTIMIZER_CONFIGS).map((opt) => {
          const isActive = activeOptimizers.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleOptimizer(opt.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                isActive
                  ? "bg-slate-800 text-white border-slate-600 shadow-sm"
                  : "bg-slate-950/60 text-slate-500 border-slate-800/80 opacity-60 hover:opacity-100"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: isActive ? opt.hexColor : "#64748B" }}
              />
              {opt.shortName}
            </button>
          );
        })}
      </div>

      {/* EXPANDABLE HYPERPARAMETER DRAWER */}
      {showHyperparamDrawer && (
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {activeOptimizers.map((optId) => {
            const config = OPTIMIZER_CONFIGS[optId];
            const currentParams = {
              ...config.defaultHyperparameters,
              ...customHyperparams[optId],
            };

            return (
              <div
                key={optId}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[11px]" style={{ color: config.hexColor }}>
                    {config.shortName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    α = {currentParams.learningRate.toFixed(4)}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>LR (α)</span>
                  </div>
                  <input
                    type="range"
                    min="0.0001"
                    max="0.2"
                    step="0.0005"
                    value={currentParams.learningRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCustomHyperparams((prev) => ({
                        ...prev,
                        [optId]: { ...currentParams, learningRate: val },
                      }));
                      setCurrentStep(0);
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {optId === "momentum" && (
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Momentum (β₁)</span>
                      <span>{(currentParams.momentumBeta1 ?? 0.9).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.99"
                      step="0.01"
                      value={currentParams.momentumBeta1 ?? 0.9}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCustomHyperparams((prev) => ({
                          ...prev,
                          momentum: { ...currentParams, momentumBeta1: val },
                        }));
                        setCurrentStep(0);
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                )}

                {optId === "adamw" && (
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Decay (λ)</span>
                      <span>{(currentParams.weightDecay ?? 0.01).toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.1"
                      step="0.005"
                      value={currentParams.weightDecay ?? 0.01}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCustomHyperparams((prev) => ({
                          ...prev,
                          adamw: { ...currentParams, weightDecay: val },
                        }));
                        setCurrentStep(0);
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                )}

                {optId === "newton_cg" && (
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Damping (μ)</span>
                      <span>{(currentParams.newtonDamping ?? 0.01).toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.01"
                      value={currentParams.newtonDamping ?? 0.01}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCustomHyperparams((prev) => ({
                          ...prev,
                          newton_cg: { ...currentParams, newtonDamping: val },
                        }));
                        setCurrentStep(0);
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MAIN VIEWPORT STAGE */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[380px] relative overflow-hidden bg-slate-950">
        {viewMode === "contour_2d" && (
          <div className="flex-1 flex flex-col items-center justify-center p-3 relative select-none">
            <canvas
              ref={contourCanvasRef}
              width={640}
              height={420}
              onMouseDown={handleContourCanvasMouseDown}
              onMouseMove={handleContourCanvasMouseMove}
              onMouseUp={handleContourCanvasMouseUp}
              onMouseLeave={handleContourCanvasMouseLeave}
              className="rounded-lg border border-slate-800 shadow-inner cursor-crosshair bg-slate-900 w-full max-w-2xl h-auto"
            />

            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVectorField}
                  onChange={(e) => setShowVectorField(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                Vector Field Arrows (-∇f)
              </label>

              <span className="text-slate-600">|</span>

              <span className="text-[11px]">
                Click or drag anywhere to set start position (x₀, y₀)
              </span>
            </div>
          </div>
        )}

        {viewMode === "surface_3d" && (
          <div className="flex-1 flex flex-col items-center justify-center p-3 relative select-none">
            <canvas
              ref={surfaceCanvasRef}
              width={640}
              height={420}
              onMouseDown={handleSurfaceCanvasMouseDown}
              onMouseMove={handleSurfaceCanvasMouseMove}
              onMouseUp={handleSurfaceCanvasMouseUp}
              className="rounded-lg border border-slate-800 shadow-inner cursor-grab active:cursor-grabbing bg-slate-900 w-full max-w-2xl h-auto"
            />

            <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Azimuth (φ): {Math.round(azimuthDeg)}°</span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={azimuthDeg}
                  onChange={(e) => setAzimuthDeg(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-slate-800 rounded accent-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>Elevation (θ): {Math.round(elevationDeg)}°</span>
                <input
                  type="range"
                  min="10"
                  max="85"
                  value={elevationDeg}
                  onChange={(e) => setElevationDeg(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-slate-800 rounded accent-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>Zoom: {zoom3D.toFixed(1)}x</span>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={zoom3D}
                  onChange={(e) => setZoom3D(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-slate-800 rounded accent-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {viewMode === "race_comparison" && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-4xl mx-auto flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">
                    Multi-Optimizer Race Simulation: {currentLandscapeDef.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Live performance metrics evaluated at step {currentStep} / {maxSteps}
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Tolerance Threshold: {tolerance.toExponential(1)}
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Optimizer</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Loss f(θ)</th>
                      <th className="py-2.5 px-3">||∇f||</th>
                      <th className="py-2.5 px-3">Steps to Min</th>
                      <th className="py-2.5 px-3">Path Length</th>
                      <th className="py-2.5 px-3">Tortuosity (L/D)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {Object.values(simulationResults)
                      .sort((a, b) => {
                        const ptA = a.points[Math.min(currentStep, a.points.length - 1)] ?? {
                          loss: Infinity,
                        };
                        const ptB = b.points[Math.min(currentStep, b.points.length - 1)] ?? {
                          loss: Infinity,
                        };
                        return ptA.loss - ptB.loss;
                      })
                      .map((traj, rankIdx) => {
                        const curPt = traj.points[
                          Math.min(currentStep, traj.points.length - 1)
                        ] ?? { loss: Infinity, gradNorm: Infinity };

                        const isConv =
                          traj.converged &&
                          traj.stepsToThreshold !== null &&
                          currentStep >= traj.stepsToThreshold;
                        const isDiv = traj.diverged;

                        return (
                          <tr
                            key={traj.optimizerId}
                            className="hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-semibold">
                              {rankIdx === 0
                                ? "🥇 1st"
                                : rankIdx === 1
                                  ? "🥈 2nd"
                                  : rankIdx === 2
                                    ? "🥉 3rd"
                                    : `${rankIdx + 1}th`}
                            </td>
                            <td className="py-2.5 px-3 font-sans font-medium flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: traj.color }}
                              />
                              {traj.optimizerName}
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              {isConv ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[10px]">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Converged (step {traj.stepsToThreshold})
                                </span>
                              ) : isDiv ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60 text-[10px]">
                                  <AlertTriangle className="w-3 h-3" />
                                  Diverged
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60 text-[10px]">
                                  <Activity className="w-3 h-3" />
                                  Iterating...
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-indigo-300 font-semibold">
                              {curPt.loss < 1e-4
                                ? curPt.loss.toExponential(3)
                                : curPt.loss.toFixed(4)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {curPt.gradNorm.toFixed(4)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {traj.stepsToThreshold !== null
                                ? `${traj.stepsToThreshold} steps`
                                : "N/A"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {traj.totalPathLength.toFixed(3)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                                  traj.tortuosity < 1.5
                                    ? "bg-emerald-900/40 text-emerald-300"
                                    : traj.tortuosity < 4.0
                                      ? "bg-amber-900/40 text-amber-300"
                                      : "bg-rose-900/40 text-rose-300"
                                }`}
                              >
                                {traj.tortuosity.toFixed(2)}x
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {viewMode === "analytics" && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-4xl mx-auto flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">
                    Convergence Dynamics: Loss f(θ) & Gradient Norm vs Steps
                  </h2>
                  <p className="text-xs text-slate-400">
                    Logarithmic scale profiles across all simulated optimizers
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-xs font-medium text-slate-300 mb-2 flex items-center justify-between">
                  <span>Log₁₀(Loss - f*) vs Steps</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Scrubber: Step {currentStep}
                  </span>
                </div>
                <div className="w-full h-44 relative bg-slate-950 rounded border border-slate-800/80 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                    <line
                      x1="0"
                      y1="40"
                      x2="500"
                      y2="40"
                      stroke="#334155"
                      strokeDasharray="4 4"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="0"
                      y1="80"
                      x2="500"
                      y2="80"
                      stroke="#334155"
                      strokeDasharray="4 4"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="0"
                      y1="120"
                      x2="500"
                      y2="120"
                      stroke="#334155"
                      strokeDasharray="4 4"
                      strokeWidth="0.8"
                    />

                    <line
                      x1={(currentStep / maxSteps) * 500}
                      y1="0"
                      x2={(currentStep / maxSteps) * 500}
                      y2="160"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />

                    {activeOptimizers.map((optId) => {
                      const traj = simulationResults[optId];
                      if (!traj || traj.points.length < 2) return null;

                      const d = traj.points
                        .map((p, idx) => {
                          const px = (p.step / maxSteps) * 500;
                          const logLoss = Math.log10(
                            Math.max(1e-8, p.loss - currentLandscapeDef.globalMinimum.value),
                          );
                          const py = Math.max(10, Math.min(150, 150 - ((logLoss + 6) / 10) * 140));
                          return `${idx === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
                        })
                        .join(" ");

                      return (
                        <path
                          key={optId}
                          d={d}
                          fill="none"
                          stroke={traj.color}
                          strokeWidth="2"
                          strokeOpacity={0.85}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-xs font-medium text-slate-300 mb-2">
                  <span>Log₁₀(||∇f||) Gradient Norm vs Steps</span>
                </div>
                <div className="w-full h-36 relative bg-slate-950 rounded border border-slate-800/80 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 500 140" preserveAspectRatio="none">
                    <line
                      x1={(currentStep / maxSteps) * 500}
                      y1="0"
                      x2={(currentStep / maxSteps) * 500}
                      y2="140"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />

                    {activeOptimizers.map((optId) => {
                      const traj = simulationResults[optId];
                      if (!traj || traj.points.length < 2) return null;

                      const d = traj.points
                        .map((p, idx) => {
                          const px = (p.step / maxSteps) * 500;
                          const logG = Math.log10(Math.max(1e-8, p.gradNorm));
                          const py = Math.max(10, Math.min(130, 130 - ((logG + 6) / 9) * 120));
                          return `${idx === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
                        })
                        .join(" ");

                      return (
                        <path key={optId} d={d} fill="none" stroke={traj.color} strokeWidth="1.8" />
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === "theory" && (
          <div className="flex-1 p-5 overflow-y-auto">
            <div className="max-w-4xl mx-auto flex flex-col gap-6 text-slate-300 text-xs leading-relaxed">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Optimization Theory: Curvature, Preconditioning & Dynamics
                </h2>
                <p className="text-slate-400 text-xs">
                  Rigorous breakdown of first-order and second-order optimization mechanics
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-2">
                <h3 className="font-semibold text-indigo-300 text-sm">
                  1. Condition Numbers & Ravine Oscillations
                </h3>
                <p>
                  The condition number of the Hessian matrix{" "}
                  <span className="font-mono text-indigo-300">κ = λ_max / λ_min</span> determines
                  the ratio of maximum to minimum curvature. When{" "}
                  <span className="font-mono">κ ≫ 1</span> (e.g. in Rosenbrock or Ill-Conditioned
                  Quadratic), the loss surface forms an elongated narrow ravine.
                </p>
                <p>
                  Standard gradient descent step{" "}
                  <span className="font-mono">θ_{`{t+1}`} = θ_t - α ∇f</span> is perpendicular to
                  the contour lines, pointing predominantly across the steep valley walls rather
                  than along the gentle valley floor. If the step size{" "}
                  <span className="font-mono">α &gt; 2 / λ_max</span>, SGD diverges orthogonally
                  across the walls.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-2">
                <h3 className="font-semibold text-blue-300 text-sm">
                  2. Polyak Heavy-Ball Momentum & Kinetic Damping
                </h3>
                <p>
                  Polyak momentum introduces an inertial velocity state{" "}
                  <span className="font-mono">v_{`{t+1}`} = β₁ v_t + α g_t</span>. Because the
                  gradient oscillations across the ravine flip sign every step (+g, -g), the
                  velocity vector averages these opposing forces to zero while continually
                  accelerating along the consistent longitudinal valley direction.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-2">
                <h3 className="font-semibold text-emerald-300 text-sm">
                  3. Adaptive Preconditioners (RMSprop, Adam & AdamW)
                </h3>
                <p>
                  Adaptive methods approximate the diagonal of the Hessian by tracking moving
                  averages of squared gradients{" "}
                  <span className="font-mono">s_{`{t+1}`} = β₂ s_t + (1 - β₂) g_t^2</span>. Dividing
                  by <span className="font-mono">√(s_{`{t+1}`}) + ε</span> scales down coordinates
                  with steep high-frequency oscillations and amplifies coordinates with shallow
                  sluggish gradients.
                </p>
                <p>
                  <strong className="text-cyan-300">AdamW Decoupled Decay:</strong> Standard Adam
                  with L2 regularization adds <span className="font-mono">λ θ_t</span> into the
                  gradient <span className="font-mono">g_t</span>, causing weights with large
                  gradients to experience LESS regularization. Loshchilov & Hutter decoupled decay{" "}
                  <span className="font-mono">θ_{`{t+1}`} = θ_t(1 - α λ) - ...</span> restores
                  invariant weight decay scaling.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-2">
                <h3 className="font-semibold text-rose-300 text-sm">
                  4. Exact Curvature & Damped Newton-CG
                </h3>
                <p>
                  Newton's method fits a local second-order quadratic Taylor expansion:
                  <span className="font-mono block my-1 text-center text-slate-200">
                    d_t = -(H_t + μ I)^{-1} ∇f(θ_t)
                  </span>
                  On quadratic surfaces, Newton converges in exactly 1 step regardless of
                  conditioning κ. In non-convex terrain where the Hessian may be indefinite (e.g.
                  saddle points with negative eigenvalues), Levenberg-Marquardt damping{" "}
                  <span className="font-mono">μ I</span> ensures positive-definiteness and descent
                  guarantee.
                </p>
              </div>
            </div>
          </div>
        )}

        {(viewMode === "contour_2d" || viewMode === "surface_3d") && (
          <div className="w-full md:w-80 bg-slate-900/90 border-t md:border-t-0 md:border-l border-slate-800 p-3.5 flex flex-col gap-3 text-xs overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-rose-400" />
                Curvature & Probe Inspector
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({inspectedData.target[0].toFixed(2)}, {inspectedData.target[1].toFixed(2)})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-400 block">Loss f(x, y)</span>
                <span className="font-mono font-semibold text-indigo-300">
                  {inspectedData.loss < 1e-4
                    ? inspectedData.loss.toExponential(3)
                    : inspectedData.loss.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Gradient ||∇f||</span>
                <span className="font-mono font-semibold text-amber-300">
                  {inspectedData.gradNorm.toFixed(4)}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 font-medium">
                Gradient Vector ∇f = [∂f/∂x, ∂f/∂y]ᵀ
              </span>
              <span className="font-mono text-slate-200 text-[11px]">
                [{inspectedData.grad[0].toFixed(4)}, {inspectedData.grad[1].toFixed(4)}]
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 font-medium">
                Hessian Matrix ∇²f (2x2)
              </span>
              <div className="font-mono text-[11px] bg-slate-900/80 p-1.5 rounded text-slate-200">
                <div>
                  [{inspectedData.hessian[0][0].toFixed(2)},{" "}
                  {inspectedData.hessian[0][1].toFixed(2)}]
                </div>
                <div>
                  [{inspectedData.hessian[1][0].toFixed(2)},{" "}
                  {inspectedData.hessian[1][1].toFixed(2)}]
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Eigenvalues (λ₁, λ₂)</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                    inspectedData.eigen.curvatureType === "minimum"
                      ? "bg-emerald-950 text-emerald-300"
                      : inspectedData.eigen.curvatureType === "saddle"
                        ? "bg-amber-950 text-amber-300"
                        : "bg-rose-950 text-rose-300"
                  }`}
                >
                  {inspectedData.eigen.curvatureType}
                </span>
              </div>
              <div className="font-mono text-xs text-slate-200 flex justify-between">
                <span>λ₁ = {inspectedData.eigen.lambda1.toFixed(3)}</span>
                <span>λ₂ = {inspectedData.eigen.lambda2.toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                <span className="text-slate-400">Condition Number κ:</span>
                <span className="font-mono font-semibold text-indigo-300">
                  {Number.isFinite(inspectedData.eigen.conditionNumber)
                    ? inspectedData.eigen.conditionNumber.toFixed(1)
                    : "∞"}
                </span>
              </div>
            </div>

            <div className="mt-auto bg-slate-950/60 p-2 rounded border border-slate-800/60 text-[11px] text-slate-400">
              <div className="flex justify-between items-center mb-1">
                <span>Step {currentStep} Progress:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {Math.round((currentStep / maxSteps) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-75"
                  style={{ width: `${(currentStep / maxSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* UNIVERSAL PLAYBACK & SCRUBBER CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleReset}
            title="Reset to Step 0"
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleStepBackward}
            title="Step Backward"
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleTogglePlay}
            title={isPlaying ? "Pause Simulation" : "Play Simulation"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-colors"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run Race
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleStepForward}
            title="Step Forward"
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 max-w-md flex items-center gap-3">
          <span className="text-slate-400 font-mono text-[11px] w-12 text-right">
            t = {currentStep}
          </span>
          <input
            type="range"
            min="0"
            max={maxSteps}
            value={currentStep}
            onChange={(e) => {
              setIsPlaying(false);
              const next = parseInt(e.target.value, 10);
              setCurrentStep(next);
              onStepChange?.(next);
            }}
            aria-label="Simulation step scrubber"
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-slate-500 font-mono text-[11px] w-8">{maxSteps}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">Speed:</span>
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  playbackSpeed === spd
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Max:</span>
            <select
              value={maxSteps}
              onChange={(e) => {
                const nextMax = parseInt(e.target.value, 10);
                setMaxSteps(nextMax);
                if (currentStep > nextMax) setCurrentStep(nextMax);
              }}
              aria-label="Max simulation steps"
              className="bg-slate-950 border border-slate-700 text-slate-300 text-[11px] px-1.5 py-0.5 rounded font-mono"
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
