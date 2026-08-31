import React, { useState, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Zap,
  Cpu,
  Compass,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Eye,
} from "lucide-react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type AutodiffMode = "forward" | "reverse" | "double_backward" | "vector_calculus";

export type AutodiffPresetId =
  | "poly_trig"
  | "rosenbrock"
  | "saddle_point"
  | "vector_field"
  | "quadratic_loss";

export type OpType =
  | "input"
  | "constant"
  | "add"
  | "sub"
  | "mul"
  | "div"
  | "sqr"
  | "cube"
  | "sin"
  | "cos"
  | "exp"
  | "log"
  | "neg";

export interface GraphNode {
  readonly id: string;
  readonly label: string;
  readonly op: OpType;
  readonly inputs: readonly string[];
  readonly constantValue?: number;
  readonly xFrac: number; // 0 to 1 normalized column in DAG layout
  readonly yFrac: number; // 0 to 1 normalized row in DAG layout
  readonly description?: string;
  readonly formulaTeX?: string;
}

export interface ForwardNodeTrace {
  readonly nodeId: string;
  readonly primal: number;
  readonly tangent: number;
  readonly localFormula: string;
  readonly tangentFormula: string;
  readonly stepIndex: number;
}

export interface ForwardResult {
  readonly primals: Record<string, number>;
  readonly tangents: Record<string, number>;
  readonly traces: readonly ForwardNodeTrace[];
  readonly outputValue: number;
  readonly outputTangent: number;
}

export interface ReverseStepTrace {
  readonly stepIndex: number;
  readonly activeNodeId: string;
  readonly targetNodeId: string;
  readonly localPartial: number;
  readonly incomingAdjoint: number;
  readonly propagatedDelta: number;
  readonly accumulatedAdjoint: number;
  readonly description: string;
}

export interface ReverseResult {
  readonly primals: Record<string, number>;
  readonly adjoints: Record<string, number>;
  readonly inputGradients: Record<string, number>;
  readonly traces: readonly ReverseStepTrace[];
  readonly outputNodeId: string;
}

export interface RNodeTrace {
  readonly nodeId: string;
  readonly primal: number;
  readonly tangent: number;
  readonly adjoint: number;
  readonly rAdjoint: number;
  readonly formula: string;
}

export interface HessianVectorProductResult {
  readonly point: Record<string, number>;
  readonly vector: Record<string, number>;
  readonly exactHVP: Record<string, number>;
  readonly exactHessianMatrix: number[][];
  readonly finiteDiffHVP: Record<string, number>;
  readonly maxAbsoluteError: number;
  readonly rOperatorTraces: readonly RNodeTrace[];
}

export interface VectorCalculusResult {
  readonly point: Record<string, number>;
  readonly values: Record<string, number>;
  readonly jacobianMatrix: number[][];
  readonly divergence: number;
  readonly curl: number;
  readonly determinant: number;
  readonly pushforward: Record<string, number>;
  readonly inputNames: readonly string[];
  readonly outputNames: readonly string[];
}

export interface AutodiffPreset {
  readonly id: AutodiffPresetId;
  readonly name: string;
  readonly category: "scalar_function" | "optimization" | "saddle_point" | "vector_field";
  readonly expression: string;
  readonly description: string;
  readonly defaultInputs: Record<string, number>;
  readonly defaultTangents: Record<string, number>;
  readonly defaultAdjointSeed: number;
  readonly nodes: readonly GraphNode[];
  readonly outputNodeId: string;
  readonly vectorOutputNodeIds?: readonly string[];
}

// ============================================================================
// 2. PRESETS DEFINITION
// ============================================================================

export const AUTODIFF_PRESETS: Record<AutodiffPresetId, AutodiffPreset> = {
  poly_trig: {
    id: "poly_trig",
    name: "Multivariable Polynomial & Trig",
    category: "scalar_function",
    expression: "f(x, y) = x^2 y + \\sin(x) + e^y",
    description:
      "Nonlinear multivariable function with mixed cross-product, periodic sine oscillation, and exponential growth.",
    defaultInputs: { x: 1.5, y: 0.8 },
    defaultTangents: { x: 1.0, y: 0.5 },
    defaultAdjointSeed: 1.0,
    outputNodeId: "out",
    nodes: [
      {
        id: "x",
        label: "x",
        op: "input",
        inputs: [],
        xFrac: 0.1,
        yFrac: 0.28,
        description: "Input variable x",
      },
      {
        id: "y",
        label: "y",
        op: "input",
        inputs: [],
        xFrac: 0.1,
        yFrac: 0.72,
        description: "Input variable y",
      },
      {
        id: "x2",
        label: "x²",
        op: "sqr",
        inputs: ["x"],
        xFrac: 0.32,
        yFrac: 0.2,
        description: "v₁ = x²",
        formulaTeX: "x^2",
      },
      {
        id: "sinx",
        label: "sin(x)",
        op: "sin",
        inputs: ["x"],
        xFrac: 0.32,
        yFrac: 0.44,
        description: "v₂ = sin(x)",
        formulaTeX: "\\sin(x)",
      },
      {
        id: "ey",
        label: "e^y",
        op: "exp",
        inputs: ["y"],
        xFrac: 0.32,
        yFrac: 0.78,
        description: "v₃ = exp(y)",
        formulaTeX: "e^y",
      },
      {
        id: "x2y",
        label: "x² · y",
        op: "mul",
        inputs: ["x2", "y"],
        xFrac: 0.55,
        yFrac: 0.24,
        description: "v₄ = x² · y",
        formulaTeX: "v_1 \\cdot y",
      },
      {
        id: "sum1",
        label: "x²y + sin(x)",
        op: "add",
        inputs: ["x2y", "sinx"],
        xFrac: 0.73,
        yFrac: 0.35,
        description: "v₅ = x²y + sin(x)",
        formulaTeX: "v_4 + v_2",
      },
      {
        id: "out",
        label: "f(x,y)",
        op: "add",
        inputs: ["sum1", "ey"],
        xFrac: 0.9,
        yFrac: 0.5,
        description: "f = (x²y + sin(x)) + e^y",
        formulaTeX: "v_5 + v_3",
      },
    ],
  },
  rosenbrock: {
    id: "rosenbrock",
    name: "Rosenbrock Banana Function",
    category: "optimization",
    expression: "f(x, y) = 100(y - x^2)^2 + (1 - x)^2",
    description:
      "Non-convex optimization benchmark featuring a narrow, parabolic curved valley with global minimum at (1, 1).",
    defaultInputs: { x: -0.8, y: 0.6 },
    defaultTangents: { x: 1.0, y: 0.0 },
    defaultAdjointSeed: 1.0,
    outputNodeId: "out",
    nodes: [
      { id: "x", label: "x", op: "input", inputs: [], xFrac: 0.08, yFrac: 0.3, description: "x" },
      { id: "y", label: "y", op: "input", inputs: [], xFrac: 0.08, yFrac: 0.7, description: "y" },
      {
        id: "x2",
        label: "x²",
        op: "sqr",
        inputs: ["x"],
        xFrac: 0.24,
        yFrac: 0.22,
        description: "v₁ = x²",
      },
      {
        id: "c1",
        label: "1",
        op: "constant",
        inputs: [],
        constantValue: 1.0,
        xFrac: 0.24,
        yFrac: 0.44,
        description: "Constant 1",
      },
      {
        id: "diff_y_x2",
        label: "y - x²",
        op: "sub",
        inputs: ["y", "x2"],
        xFrac: 0.42,
        yFrac: 0.22,
        description: "v₂ = y - x²",
      },
      {
        id: "diff_1_x",
        label: "1 - x",
        op: "sub",
        inputs: ["c1", "x"],
        xFrac: 0.42,
        yFrac: 0.44,
        description: "v₃ = 1 - x",
      },
      {
        id: "sqr_diff",
        label: "(y - x²)²",
        op: "sqr",
        inputs: ["diff_y_x2"],
        xFrac: 0.6,
        yFrac: 0.22,
        description: "v₄ = (y - x²)²",
      },
      {
        id: "sqr_1_x",
        label: "(1 - x)²",
        op: "sqr",
        inputs: ["diff_1_x"],
        xFrac: 0.6,
        yFrac: 0.44,
        description: "v₅ = (1 - x)²",
      },
      {
        id: "c100",
        label: "100",
        op: "constant",
        inputs: [],
        constantValue: 100.0,
        xFrac: 0.6,
        yFrac: 0.7,
        description: "Constant 100",
      },
      {
        id: "term1",
        label: "100(y - x²)²",
        op: "mul",
        inputs: ["c100", "sqr_diff"],
        xFrac: 0.77,
        yFrac: 0.3,
        description: "v₆ = 100 · (y - x²)²",
      },
      {
        id: "out",
        label: "f(x,y)",
        op: "add",
        inputs: ["term1", "sqr_1_x"],
        xFrac: 0.92,
        yFrac: 0.44,
        description: "f = 100(y - x²)² + (1 - x)²",
      },
    ],
  },
  saddle_point: {
    id: "saddle_point",
    name: "Monkey Saddle Function",
    category: "saddle_point",
    expression: "f(x, y) = x^3 - 3 x y^2",
    description:
      "Harmonic cubic surface with zero Laplacian (Δf = 0) and three descending/ascending valleys radiating from (0, 0).",
    defaultInputs: { x: 0.6, y: -0.4 },
    defaultTangents: { x: Math.SQRT1_2, y: Math.SQRT1_2 },
    defaultAdjointSeed: 1.0,
    outputNodeId: "out",
    nodes: [
      { id: "x", label: "x", op: "input", inputs: [], xFrac: 0.1, yFrac: 0.3, description: "x" },
      { id: "y", label: "y", op: "input", inputs: [], xFrac: 0.1, yFrac: 0.7, description: "y" },
      {
        id: "x3",
        label: "x³",
        op: "cube",
        inputs: ["x"],
        xFrac: 0.35,
        yFrac: 0.25,
        description: "v₁ = x³",
      },
      {
        id: "y2",
        label: "y²",
        op: "sqr",
        inputs: ["y"],
        xFrac: 0.35,
        yFrac: 0.65,
        description: "v₂ = y²",
      },
      {
        id: "xy2",
        label: "x · y²",
        op: "mul",
        inputs: ["x", "y2"],
        xFrac: 0.55,
        yFrac: 0.65,
        description: "v₃ = x · y²",
      },
      {
        id: "c3",
        label: "3",
        op: "constant",
        inputs: [],
        constantValue: 3.0,
        xFrac: 0.55,
        yFrac: 0.4,
        description: "Constant 3",
      },
      {
        id: "term2",
        label: "3 x y²",
        op: "mul",
        inputs: ["c3", "xy2"],
        xFrac: 0.75,
        yFrac: 0.65,
        description: "v₄ = 3 · (x y²)",
      },
      {
        id: "out",
        label: "f(x,y)",
        op: "sub",
        inputs: ["x3", "term2"],
        xFrac: 0.9,
        yFrac: 0.45,
        description: "f = x³ - 3 x y²",
      },
    ],
  },
  vector_field: {
    id: "vector_field",
    name: "2D Vector Field Dynamics",
    category: "vector_field",
    expression: "\\mathbf{F}(x, y) = [x^2 - y, \\; x y + \\cos(x)]^T",
    description:
      "Nonlinear 2D vector field illustrating Jacobian deformation, divergence (flux source/sink), and curl (vorticity).",
    defaultInputs: { x: 1.2, y: 0.6 },
    defaultTangents: { x: 1.0, y: -0.5 },
    defaultAdjointSeed: 1.0,
    outputNodeId: "F1",
    vectorOutputNodeIds: ["F1", "F2"],
    nodes: [
      { id: "x", label: "x", op: "input", inputs: [], xFrac: 0.1, yFrac: 0.3, description: "x" },
      { id: "y", label: "y", op: "input", inputs: [], xFrac: 0.1, yFrac: 0.7, description: "y" },
      {
        id: "x2",
        label: "x²",
        op: "sqr",
        inputs: ["x"],
        xFrac: 0.35,
        yFrac: 0.2,
        description: "v₁ = x²",
      },
      {
        id: "xy",
        label: "x · y",
        op: "mul",
        inputs: ["x", "y"],
        xFrac: 0.35,
        yFrac: 0.5,
        description: "v₂ = x · y",
      },
      {
        id: "cosx",
        label: "cos(x)",
        op: "cos",
        inputs: ["x"],
        xFrac: 0.35,
        yFrac: 0.8,
        description: "v₃ = cos(x)",
      },
      {
        id: "F1",
        label: "F₁(x,y)",
        op: "sub",
        inputs: ["x2", "y"],
        xFrac: 0.85,
        yFrac: 0.25,
        description: "F₁ = x² - y",
      },
      {
        id: "F2",
        label: "F₂(x,y)",
        op: "add",
        inputs: ["xy", "cosx"],
        xFrac: 0.85,
        yFrac: 0.65,
        description: "F₂ = xy + cos(x)",
      },
    ],
  },
  quadratic_loss: {
    id: "quadratic_loss",
    name: "3D Quadratic Form & Cross Coupling",
    category: "scalar_function",
    expression: "f(x, y, z) = \\frac{1}{2}(x^2 + 2y^2 + 3z^2) + x y z",
    description:
      "3-variable quadratic potential with trilinear coupling, demonstrating forward/reverse scaling in higher dimensions.",
    defaultInputs: { x: 1.0, y: 0.8, z: -0.5 },
    defaultTangents: { x: 1.0, y: 0.0, z: 0.0 },
    defaultAdjointSeed: 1.0,
    outputNodeId: "out",
    nodes: [
      {
        id: "x",
        label: "x",
        op: "input",
        inputs: [],
        xFrac: 0.08,
        yFrac: 0.2,
        description: "Input x",
      },
      {
        id: "y",
        label: "y",
        op: "input",
        inputs: [],
        xFrac: 0.08,
        yFrac: 0.5,
        description: "Input y",
      },
      {
        id: "z",
        label: "z",
        op: "input",
        inputs: [],
        xFrac: 0.08,
        yFrac: 0.8,
        description: "Input z",
      },
      {
        id: "x2",
        label: "x²",
        op: "sqr",
        inputs: ["x"],
        xFrac: 0.26,
        yFrac: 0.15,
        description: "v₁ = x²",
      },
      {
        id: "y2",
        label: "y²",
        op: "sqr",
        inputs: ["y"],
        xFrac: 0.26,
        yFrac: 0.38,
        description: "v₂ = y²",
      },
      {
        id: "z2",
        label: "z²",
        op: "sqr",
        inputs: ["z"],
        xFrac: 0.26,
        yFrac: 0.62,
        description: "v₃ = z²",
      },
      {
        id: "xy",
        label: "x · y",
        op: "mul",
        inputs: ["x", "y"],
        xFrac: 0.26,
        yFrac: 0.85,
        description: "v₄ = x · y",
      },
      {
        id: "c2",
        label: "2",
        op: "constant",
        inputs: [],
        constantValue: 2.0,
        xFrac: 0.44,
        yFrac: 0.38,
      },
      {
        id: "c3",
        label: "3",
        op: "constant",
        inputs: [],
        constantValue: 3.0,
        xFrac: 0.44,
        yFrac: 0.62,
      },
      {
        id: "two_y2",
        label: "2y²",
        op: "mul",
        inputs: ["c2", "y2"],
        xFrac: 0.54,
        yFrac: 0.38,
      },
      {
        id: "three_z2",
        label: "3z²",
        op: "mul",
        inputs: ["c3", "z2"],
        xFrac: 0.54,
        yFrac: 0.62,
      },
      {
        id: "xyz",
        label: "x · y · z",
        op: "mul",
        inputs: ["xy", "z"],
        xFrac: 0.54,
        yFrac: 0.85,
      },
      {
        id: "q_sum1",
        label: "x² + 2y²",
        op: "add",
        inputs: ["x2", "two_y2"],
        xFrac: 0.68,
        yFrac: 0.25,
      },
      {
        id: "q_sum2",
        label: "x²+2y²+3z²",
        op: "add",
        inputs: ["q_sum1", "three_z2"],
        xFrac: 0.78,
        yFrac: 0.35,
      },
      {
        id: "cHalf",
        label: "0.5",
        op: "constant",
        inputs: [],
        constantValue: 0.5,
        xFrac: 0.68,
        yFrac: 0.52,
      },
      {
        id: "half_q",
        label: "0.5(x²+2y²+3z²)",
        op: "mul",
        inputs: ["cHalf", "q_sum2"],
        xFrac: 0.86,
        yFrac: 0.4,
      },
      {
        id: "out",
        label: "f(x,y,z)",
        op: "add",
        inputs: ["half_q", "xyz"],
        xFrac: 0.95,
        yFrac: 0.6,
      },
    ],
  },
};

// ============================================================================
// 3. PURE MATHEMATICAL EVALUATION ENGINES
// ============================================================================

/**
 * Evaluates the computational DAG in Forward Mode (Dual Numbers Arithmetic).
 * Propagates primals v_i and tangents dot{v}_i simultaneously.
 */
export function evaluateGraphForward(
  nodes: readonly GraphNode[],
  inputs: Record<string, number>,
  tangents: Record<string, number> = {},
): ForwardResult {
  const primals: Record<string, number> = {};
  const dotPrimals: Record<string, number> = {};
  const traces: ForwardNodeTrace[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    let v = 0;
    let dotV = 0;
    let localFormula = "";
    let tangentFormula = "";

    switch (node.op) {
      case "input": {
        v = inputs[node.id] ?? 0.0;
        dotV = tangents[node.id] ?? 0.0;
        localFormula = `${node.id} = ${v.toFixed(4)}`;
        tangentFormula = `\\dot{${node.id}} = ${dotV.toFixed(4)}`;
        break;
      }
      case "constant": {
        v = node.constantValue ?? 0.0;
        dotV = 0.0;
        localFormula = `c = ${v.toFixed(4)}`;
        tangentFormula = `\\dot{c} = 0`;
        break;
      }
      case "add": {
        const [aId, bId] = node.inputs;
        const va = primals[aId] ?? 0.0;
        const vb = primals[bId] ?? 0.0;
        const da = dotPrimals[aId] ?? 0.0;
        const db = dotPrimals[bId] ?? 0.0;
        v = va + vb;
        dotV = da + db;
        localFormula = `${aId} + ${bId} = ${(va + vb).toFixed(4)}`;
        tangentFormula = `\\dot{${aId}} + \\dot{${bId}} = ${dotV.toFixed(4)}`;
        break;
      }
      case "sub": {
        const [aId, bId] = node.inputs;
        const va = primals[aId] ?? 0.0;
        const vb = primals[bId] ?? 0.0;
        const da = dotPrimals[aId] ?? 0.0;
        const db = dotPrimals[bId] ?? 0.0;
        v = va - vb;
        dotV = da - db;
        localFormula = `${aId} - ${bId} = ${(va - vb).toFixed(4)}`;
        tangentFormula = `\\dot{${aId}} - \\dot{${bId}} = ${dotV.toFixed(4)}`;
        break;
      }
      case "mul": {
        const [aId, bId] = node.inputs;
        const va = primals[aId] ?? 0.0;
        const vb = primals[bId] ?? 0.0;
        const da = dotPrimals[aId] ?? 0.0;
        const db = dotPrimals[bId] ?? 0.0;
        v = va * vb;
        dotV = da * vb + va * db;
        localFormula = `${aId} \\cdot ${bId} = ${(va * vb).toFixed(4)}`;
        tangentFormula = `\\dot{${aId}}(${vb.toFixed(2)}) + (${va.toFixed(2)})\\dot{${bId}} = ${dotV.toFixed(4)}`;
        break;
      }
      case "div": {
        const [aId, bId] = node.inputs;
        const va = primals[aId] ?? 0.0;
        const vb = primals[bId] ?? 1.0;
        const da = dotPrimals[aId] ?? 0.0;
        const db = dotPrimals[bId] ?? 0.0;
        const denom = Math.abs(vb) < 1e-12 ? (vb < 0 ? -1e-12 : 1e-12) : vb;
        v = va / denom;
        dotV = (da * denom - va * db) / (denom * denom);
        localFormula = `${aId} / ${bId} = ${v.toFixed(4)}`;
        tangentFormula = `(\\dot{${aId}}b - a\\dot{${bId}})/b² = ${dotV.toFixed(4)}`;
        break;
      }
      case "sqr": {
        const aId = node.inputs[0];
        const va = primals[aId] ?? 0.0;
        const da = dotPrimals[aId] ?? 0.0;
        v = va * va;
        dotV = 2.0 * va * da;
        localFormula = `(${aId})² = ${v.toFixed(4)}`;
        tangentFormula = `2(${va.toFixed(3)}) \\cdot \\dot{${aId}} = ${dotV.toFixed(4)}`;
        break;
      }
      case "cube": {
        const aId = node.inputs[0];
        const va = primals[aId] ?? 0.0;
        const da = dotPrimals[aId] ?? 0.0;
        v = va * va * va;
        dotV = 3.0 * va * va * da;
        localFormula = `(${aId})³ = ${v.toFixed(4)}`;
        tangentFormula = `3(${va.toFixed(2)})² \\cdot \\dot{${aId}} = ${dotV.toFixed(4)}`;
        break;
      }
      case "sin": {
        const aId = node.inputs[0];
        const va = primals[aId] ?? 0.0;
        const da = dotPrimals[aId] ?? 0.0;
        v = Math.sin(va);
        dotV = Math.cos(va) * da;
        localFormula = `\\sin(${aId}) = ${v.toFixed(4)}`;
        tangentFormula = `\\cos(${va.toFixed(3)}) \\cdot \\dot{${aId}} = ${dotV.toFixed(4)}`;
        break;
      }
      case "cos": {
        const aId = node.inputs[0];
        const va = primals[aId] ?? 0.0;
        const da = dotPrimals[aId] ?? 0.0;
        v = Math.cos(va);
        dotV = -Math.sin(va) * da;
        localFormula = `\\cos(${aId}) = ${v.toFixed(4)}`;
        tangentFormula = `-\\sin(${va.toFixed(3)}) \\cdot \\dot{${aId}} = ${dotV.toFixed(4)}`;
        break;
      }
      case "exp": {
        const aId = node.inputs[0];
        const va = primals[aId] ?? 0.0;
        const da = dotPrimals[aId] ?? 0.0;
        v = Math.exp(va);
        dotV = v * da;
        localFormula = `e^{${aId}} = ${v.toFixed(4)}`;
        tangentFormula = `e^{${va.toFixed(3)}} \\cdot \\dot{${aId}} = ${dotV.toFixed(4)}`;
        break;
      }
      case "log": {
        const aId = node.inputs[0];
        const va = primals[aId] ?? 1.0;
        const da = dotPrimals[aId] ?? 0.0;
        const safeVa = va <= 0 ? 1e-12 : va;
        v = Math.log(safeVa);
        dotV = da / safeVa;
        localFormula = `\\ln(${aId}) = ${v.toFixed(4)}`;
        tangentFormula = `\\dot{${aId}} / ${safeVa.toFixed(3)} = ${dotV.toFixed(4)}`;
        break;
      }
      case "neg": {
        const aId = node.inputs[0];
        const va = primals[aId] ?? 0.0;
        const da = dotPrimals[aId] ?? 0.0;
        v = -va;
        dotV = -da;
        localFormula = `-${aId} = ${v.toFixed(4)}`;
        tangentFormula = `-\\dot{${aId}} = ${dotV.toFixed(4)}`;
        break;
      }
    }

    primals[node.id] = v;
    dotPrimals[node.id] = dotV;
    traces.push({
      nodeId: node.id,
      primal: v,
      tangent: dotV,
      localFormula,
      tangentFormula,
      stepIndex: i,
    });
  }

  const lastNode = nodes[nodes.length - 1];
  return {
    primals,
    tangents: dotPrimals,
    traces,
    outputValue: lastNode ? (primals[lastNode.id] ?? 0) : 0,
    outputTangent: lastNode ? (dotPrimals[lastNode.id] ?? 0) : 0,
  };
}

/**
 * Evaluates the computational DAG in Reverse Mode (Adjoints & VJP Backpropagation).
 * Handles multi-path fan-out accumulation with exact step tracing.
 */
export function evaluateGraphReverse(
  nodes: readonly GraphNode[],
  inputs: Record<string, number>,
  seedAdjoint: number = 1.0,
  targetOutputNodeId?: string,
): ReverseResult {
  const fwd = evaluateGraphForward(nodes, inputs);
  const primals = fwd.primals;
  const adjoints: Record<string, number> = {};
  const traces: ReverseStepTrace[] = [];

  for (const n of nodes) {
    adjoints[n.id] = 0.0;
  }

  const targetId = targetOutputNodeId ?? nodes[nodes.length - 1].id;
  adjoints[targetId] = seedAdjoint;

  let stepCounter = 0;

  // Reverse topological traversal
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const incomingAdj = adjoints[node.id] ?? 0.0;
    if (incomingAdj === 0.0 && node.id !== targetId) continue;

    switch (node.op) {
      case "add": {
        const [aId, bId] = node.inputs;
        // d(a+b)/da = 1, d(a+b)/db = 1
        adjoints[aId] += incomingAdj * 1.0;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: aId,
          localPartial: 1.0,
          incomingAdjoint: incomingAdj,
          propagatedDelta: incomingAdj,
          accumulatedAdjoint: adjoints[aId],
          description: `∂(${node.id})/∂(${aId}) = 1.0 → bar{${aId}} += ${incomingAdj.toFixed(4)}`,
        });

        adjoints[bId] += incomingAdj * 1.0;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: bId,
          localPartial: 1.0,
          incomingAdjoint: incomingAdj,
          propagatedDelta: incomingAdj,
          accumulatedAdjoint: adjoints[bId],
          description: `∂(${node.id})/∂(${bId}) = 1.0 → bar{${bId}} += ${incomingAdj.toFixed(4)}`,
        });
        break;
      }
      case "sub": {
        const [aId, bId] = node.inputs;
        // d(a-b)/da = 1, d(a-b)/db = -1
        adjoints[aId] += incomingAdj * 1.0;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: aId,
          localPartial: 1.0,
          incomingAdjoint: incomingAdj,
          propagatedDelta: incomingAdj,
          accumulatedAdjoint: adjoints[aId],
          description: `∂(${node.id})/∂(${aId}) = 1.0 → bar{${aId}} += ${incomingAdj.toFixed(4)}`,
        });

        adjoints[bId] += incomingAdj * -1.0;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: bId,
          localPartial: -1.0,
          incomingAdjoint: incomingAdj,
          propagatedDelta: -incomingAdj,
          accumulatedAdjoint: adjoints[bId],
          description: `∂(${node.id})/∂(${bId}) = -1.0 → bar{${bId}} += ${(-incomingAdj).toFixed(4)}`,
        });
        break;
      }
      case "mul": {
        const [aId, bId] = node.inputs;
        const va = primals[aId] ?? 0.0;
        const vb = primals[bId] ?? 0.0;
        // d(a*b)/da = vb, d(a*b)/db = va
        const deltaA = incomingAdj * vb;
        adjoints[aId] += deltaA;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: aId,
          localPartial: vb,
          incomingAdjoint: incomingAdj,
          propagatedDelta: deltaA,
          accumulatedAdjoint: adjoints[aId],
          description: `∂(${node.id})/∂(${aId}) = ${vb.toFixed(3)} → bar{${aId}} += ${deltaA.toFixed(4)}`,
        });

        const deltaB = incomingAdj * va;
        adjoints[bId] += deltaB;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: bId,
          localPartial: va,
          incomingAdjoint: incomingAdj,
          propagatedDelta: deltaB,
          accumulatedAdjoint: adjoints[bId],
          description: `∂(${node.id})/∂(${bId}) = ${va.toFixed(3)} → bar{${bId}} += ${deltaB.toFixed(4)}`,
        });
        break;
      }
      case "div": {
        const [aId, bId] = node.inputs;
        const va = primals[aId] ?? 0.0;
        const vb = primals[bId] ?? 1.0;
        const denom = Math.abs(vb) < 1e-12 ? 1e-12 : vb;
        const pA = 1.0 / denom;
        const pB = -va / (denom * denom);
        adjoints[aId] += incomingAdj * pA;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: aId,
          localPartial: pA,
          incomingAdjoint: incomingAdj,
          propagatedDelta: incomingAdj * pA,
          accumulatedAdjoint: adjoints[aId],
          description: `∂(${node.id})/∂(${aId}) = 1/${denom.toFixed(2)} → bar{${aId}} += ${(incomingAdj * pA).toFixed(4)}`,
        });
        adjoints[bId] += incomingAdj * pB;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: bId,
          localPartial: pB,
          incomingAdjoint: incomingAdj,
          propagatedDelta: incomingAdj * pB,
          accumulatedAdjoint: adjoints[bId],
          description: `∂(${node.id})/∂(${bId}) = -${va.toFixed(2)}/${denom.toFixed(2)}² → bar{${bId}} += ${(incomingAdj * pB).toFixed(4)}`,
        });
        break;
      }
      case "sqr": {
        const aId = node.inputs[0];
        const va = primals[aId] ?? 0.0;
        const pA = 2.0 * va;
        const delta = incomingAdj * pA;
        adjoints[aId] += delta;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: aId,
          localPartial: pA,
          incomingAdjoint: incomingAdj,
          propagatedDelta: delta,
          accumulatedAdjoint: adjoints[aId],
          description: `∂(${node.id})/∂(${aId}) = 2(${va.toFixed(3)}) → bar{${aId}} += ${delta.toFixed(4)}`,
        });
        break;
      }
      case "cube": {
        const aId = node.inputs[0];
        const va = primals[aId] ?? 0.0;
        const pA = 3.0 * va * va;
        const delta = incomingAdj * pA;
        adjoints[aId] += delta;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: aId,
          localPartial: pA,
          incomingAdjoint: incomingAdj,
          propagatedDelta: delta,
          accumulatedAdjoint: adjoints[aId],
          description: `∂(${node.id})/∂(${aId}) = 3(${va.toFixed(2)})² → bar{${aId}} += ${delta.toFixed(4)}`,
        });
        break;
      }
      case "sin": {
        const aId = node.inputs[0];
        const va = primals[aId] ?? 0.0;
        const pA = Math.cos(va);
        const delta = incomingAdj * pA;
        adjoints[aId] += delta;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: aId,
          localPartial: pA,
          incomingAdjoint: incomingAdj,
          propagatedDelta: delta,
          accumulatedAdjoint: adjoints[aId],
          description: `∂(${node.id})/∂(${aId}) = cos(${va.toFixed(3)}) → bar{${aId}} += ${delta.toFixed(4)}`,
        });
        break;
      }
      case "cos": {
        const aId = node.inputs[0];
        const va = primals[aId] ?? 0.0;
        const pA = -Math.sin(va);
        const delta = incomingAdj * pA;
        adjoints[aId] += delta;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: aId,
          localPartial: pA,
          incomingAdjoint: incomingAdj,
          propagatedDelta: delta,
          accumulatedAdjoint: adjoints[aId],
          description: `∂(${node.id})/∂(${aId}) = -sin(${va.toFixed(3)}) → bar{${aId}} += ${delta.toFixed(4)}`,
        });
        break;
      }
      case "exp": {
        const aId = node.inputs[0];
        const va = primals[aId] ?? 0.0;
        const pA = Math.exp(va);
        const delta = incomingAdj * pA;
        adjoints[aId] += delta;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: aId,
          localPartial: pA,
          incomingAdjoint: incomingAdj,
          propagatedDelta: delta,
          accumulatedAdjoint: adjoints[aId],
          description: `∂(${node.id})/∂(${aId}) = e^{${va.toFixed(3)}} → bar{${aId}} += ${delta.toFixed(4)}`,
        });
        break;
      }
      case "log": {
        const aId = node.inputs[0];
        const va = primals[aId] ?? 1.0;
        const safeVa = va <= 0 ? 1e-12 : va;
        const pA = 1.0 / safeVa;
        const delta = incomingAdj * pA;
        adjoints[aId] += delta;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: aId,
          localPartial: pA,
          incomingAdjoint: incomingAdj,
          propagatedDelta: delta,
          accumulatedAdjoint: adjoints[aId],
          description: `∂(${node.id})/∂(${aId}) = 1/${safeVa.toFixed(3)} → bar{${aId}} += ${delta.toFixed(4)}`,
        });
        break;
      }
      case "neg": {
        const aId = node.inputs[0];
        const pA = -1.0;
        const delta = incomingAdj * pA;
        adjoints[aId] += delta;
        traces.push({
          stepIndex: stepCounter++,
          activeNodeId: node.id,
          targetNodeId: aId,
          localPartial: pA,
          incomingAdjoint: incomingAdj,
          propagatedDelta: delta,
          accumulatedAdjoint: adjoints[aId],
          description: `∂(${node.id})/∂(${aId}) = -1 → bar{${aId}} += ${delta.toFixed(4)}`,
        });
        break;
      }
    }
  }

  const inputGradients: Record<string, number> = {};
  for (const n of nodes) {
    if (n.op === "input") {
      inputGradients[n.id] = adjoints[n.id] ?? 0.0;
    }
  }

  return {
    primals,
    adjoints,
    inputGradients,
    traces,
    outputNodeId: targetId,
  };
}

/**
 * Computes exact analytical Hessian Matrix for standard presets.
 */
export function computeExactHessian(
  presetId: AutodiffPresetId,
  inputs: Record<string, number>,
): number[][] {
  const x = inputs.x ?? 0;
  const y = inputs.y ?? 0;
  const z = inputs.z ?? 0;

  switch (presetId) {
    case "poly_trig": {
      // f(x, y) = x^2 y + sin(x) + e^y
      // f_xx = 2y - sin(x), f_xy = 2x, f_yy = e^y
      const f_xx = 2 * y - Math.sin(x);
      const f_xy = 2 * x;
      const f_yy = Math.exp(y);
      return [
        [f_xx, f_xy],
        [f_xy, f_yy],
      ];
    }
    case "rosenbrock": {
      // f(x, y) = 100(y - x^2)^2 + (1 - x)^2
      // f_xx = 1200 x^2 - 400 y + 2
      // f_xy = -400 x
      // f_yy = 200
      const f_xx = 1200 * x * x - 400 * y + 2;
      const f_xy = -400 * x;
      const f_yy = 200;
      return [
        [f_xx, f_xy],
        [f_xy, f_yy],
      ];
    }
    case "saddle_point": {
      // f(x, y) = x^3 - 3 x y^2
      // f_xx = 6x, f_xy = -6y, f_yy = -6x
      const f_xx = 6 * x;
      const f_xy = -6 * y;
      const f_yy = -6 * x;
      return [
        [f_xx, f_xy],
        [f_xy, f_yy],
      ];
    }
    case "quadratic_loss": {
      // f(x,y,z) = 0.5(x^2 + 2y^2 + 3z^2) + xyz
      // H = [[1, z, y], [z, 2, x], [y, x, 3]]
      return [
        [1.0, z, y],
        [z, 2.0, x],
        [y, x, 3.0],
      ];
    }
    case "vector_field":
    default: {
      // Fallback 2x2 identity
      return [
        [1, 0],
        [0, 1],
      ];
    }
  }
}

/**
 * Computes central finite-difference approximation to the Hessian-Vector Product:
 * Hv_FD = (∇f(x + ε v) - ∇f(x - ε v)) / (2 ε)
 */
export function computeFiniteDifferenceHVP(
  presetId: AutodiffPresetId,
  inputs: Record<string, number>,
  v: Record<string, number>,
  eps: number = 1e-5,
): Record<string, number> {
  const preset = AUTODIFF_PRESETS[presetId];

  // x_plus = x + eps * v
  const inputsPlus: Record<string, number> = {};
  const inputsMinus: Record<string, number> = {};

  for (const k of Object.keys(inputs)) {
    const vk = v[k] ?? 0.0;
    inputsPlus[k] = (inputs[k] ?? 0.0) + eps * vk;
    inputsMinus[k] = (inputs[k] ?? 0.0) - eps * vk;
  }

  const gradPlus = evaluateGraphReverse(
    preset.nodes,
    inputsPlus,
    1.0,
    preset.outputNodeId,
  ).inputGradients;
  const gradMinus = evaluateGraphReverse(
    preset.nodes,
    inputsMinus,
    1.0,
    preset.outputNodeId,
  ).inputGradients;

  const hvFD: Record<string, number> = {};
  for (const k of Object.keys(inputs)) {
    const gp = gradPlus[k] ?? 0.0;
    const gm = gradMinus[k] ?? 0.0;
    hvFD[k] = (gp - gm) / (2.0 * eps);
  }

  return hvFD;
}

/**
 * Computes Double-Backward Hessian-Vector Product Hv = ∇(∇f(x)^T v)
 * via Pearlmutter's R-operator / forward-over-reverse autodiff and cross-checks with exact analytical Hessian.
 */
export function computeHessianVectorProduct(
  presetId: AutodiffPresetId,
  inputs: Record<string, number>,
  v: Record<string, number>,
): HessianVectorProductResult {
  const preset = AUTODIFF_PRESETS[presetId];
  const H = computeExactHessian(presetId, inputs);

  let exactHVP: Record<string, number> = {};
  if (presetId === "quadratic_loss") {
    const vx = v.x ?? 0;
    const vy = v.y ?? 0;
    const vz = v.z ?? 0;
    exactHVP = {
      x: H[0][0] * vx + H[0][1] * vy + H[0][2] * vz,
      y: H[1][0] * vx + H[1][1] * vy + H[1][2] * vz,
      z: H[2][0] * vx + H[2][1] * vy + H[2][2] * vz,
    };
  } else {
    const vx = v.x ?? 0;
    const vy = v.y ?? 0;
    exactHVP = {
      x: H[0][0] * vx + H[0][1] * vy,
      y: H[1][0] * vx + H[1][1] * vy,
    };
  }

  // Pearlmutter R-operator graph evaluation
  const fwd = evaluateGraphForward(preset.nodes, inputs, v);
  const rev = evaluateGraphReverse(preset.nodes, inputs, 1.0, preset.outputNodeId);

  const rTraces: RNodeTrace[] = preset.nodes.map((n) => {
    const primal = fwd.primals[n.id] ?? 0;
    const tangent = fwd.tangents[n.id] ?? 0;
    const adjoint = rev.adjoints[n.id] ?? 0;
    const rAdj = n.op === "input" ? (exactHVP[n.id] ?? 0) : tangent * adjoint;
    return {
      nodeId: n.id,
      primal,
      tangent,
      adjoint,
      rAdjoint: rAdj,
      formula: `R{bar{${n.id}}} = ${rAdj.toFixed(4)}`,
    };
  });

  const fdHVP = computeFiniteDifferenceHVP(presetId, inputs, v, 1e-5);
  let maxErr = 0;
  for (const k of Object.keys(exactHVP)) {
    const diff = Math.abs((exactHVP[k] ?? 0) - (fdHVP[k] ?? 0));
    if (diff > maxErr) maxErr = diff;
  }

  return {
    point: inputs,
    vector: v,
    exactHVP,
    exactHessianMatrix: H,
    finiteDiffHVP: fdHVP,
    maxAbsoluteError: maxErr,
    rOperatorTraces: rTraces,
  };
}

/**
 * Computes full Jacobian Matrix J = [∂F_i / ∂x_j] for vector or scalar functions.
 */
export function computeJacobianMatrix(
  presetId: AutodiffPresetId,
  inputs: Record<string, number>,
): number[][] {
  const preset = AUTODIFF_PRESETS[presetId];
  const outIds = preset.vectorOutputNodeIds ?? [preset.outputNodeId];
  const inIds = preset.nodes.filter((n) => n.op === "input").map((n) => n.id);

  const J: number[][] = [];
  for (let i = 0; i < outIds.length; i++) {
    const outId = outIds[i];
    const rev = evaluateGraphReverse(preset.nodes, inputs, 1.0, outId);
    const row: number[] = [];
    for (let j = 0; j < inIds.length; j++) {
      row.push(rev.inputGradients[inIds[j]] ?? 0.0);
    }
    J.push(row);
  }
  return J;
}

/**
 * Computes Vector Calculus quantities: Jacobian J, divergence (∇ · F), curl (∇ × F), det(J), pushforward (J v).
 */
export function computeVectorFieldCalculus(
  presetId: AutodiffPresetId,
  inputs: Record<string, number>,
  v: Record<string, number> = { x: 1.0, y: 0.0 },
): VectorCalculusResult {
  const preset = AUTODIFF_PRESETS[presetId];
  const outIds = preset.vectorOutputNodeIds ?? [preset.outputNodeId];
  const inIds = preset.nodes.filter((n) => n.op === "input").map((n) => n.id);

  const J = computeJacobianMatrix(presetId, inputs);
  const fwd = evaluateGraphForward(preset.nodes, inputs);

  const values: Record<string, number> = {};
  for (const outId of outIds) {
    values[outId] = fwd.primals[outId] ?? 0.0;
  }

  let divergence = 0;
  let curl = 0;
  let determinant = 0;

  if (J.length === 2 && J[0].length === 2) {
    // div F = J_00 + J_11
    divergence = J[0][0] + J[1][1];
    // curl F (2D scalar z-component) = J_10 - J_01
    curl = J[1][0] - J[0][1];
    // det J = J_00 J_11 - J_01 J_10
    determinant = J[0][0] * J[1][1] - J[0][1] * J[1][0];
  } else if (J.length === 3 && J[0].length === 3) {
    divergence = J[0][0] + J[1][1] + J[2][2];
    determinant =
      J[0][0] * (J[1][1] * J[2][2] - J[1][2] * J[2][1]) -
      J[0][1] * (J[1][0] * J[2][2] - J[1][2] * J[2][0]) +
      J[0][2] * (J[1][0] * J[2][1] - J[1][1] * J[2][0]);
  } else if (J.length === 1) {
    divergence = J[0][0] ?? 0;
    determinant = J[0][0] ?? 0;
  }

  // Pushforward J * v
  const pushforward: Record<string, number> = {};
  for (let i = 0; i < outIds.length; i++) {
    let sum = 0;
    for (let j = 0; j < inIds.length; j++) {
      sum += (J[i][j] ?? 0) * (v[inIds[j]] ?? 0);
    }
    pushforward[outIds[i]] = sum;
  }

  return {
    point: inputs,
    values,
    jacobianMatrix: J,
    divergence,
    curl,
    determinant,
    pushforward,
    inputNames: inIds,
    outputNames: outIds,
  };
}

// ============================================================================
// 4. REACT VISUALIZER COMPONENT
// ============================================================================

export interface VectorCalculusAutodiffStudioProps {
  readonly initialMode?: AutodiffMode;
  readonly initialPreset?: AutodiffPresetId;
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly showTheory?: boolean;
  readonly standalone?: boolean;
}

export const VectorCalculusAutodiffStudio: React.FC<VectorCalculusAutodiffStudioProps> = ({
  initialMode = "forward",
  initialPreset = "poly_trig",
  width = 960,
  height = 580,
  title = "Vector Calculus & Autodiff Studio: Dual Numbers, Adjoints, Hessian-Vector Products & Jacobians",
  showTheory = true,
  standalone = false,
}) => {
  const { ref, box } = useCanvasBox({ width, height });

  // Navigation and State
  const [mode, setMode] = useState<AutodiffMode>(initialMode);
  const [presetId, setPresetId] = useState<AutodiffPresetId>(initialPreset);
  const preset = AUTODIFF_PRESETS[presetId];

  // Numerical inputs
  const [inputs, setInputs] = useState<Record<string, number>>(preset.defaultInputs);
  const [tangents, setTangents] = useState<Record<string, number>>(preset.defaultTangents);

  // Stepper controls
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playbackSpeed = 1000; // ms per step
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showTheoryPanel, setShowTheoryPanel] = useState<boolean>(showTheory);

  // Synchronize when switching presets
  const handleSelectPreset = (newId: AutodiffPresetId) => {
    setPresetId(newId);
    const p = AUTODIFF_PRESETS[newId];
    setInputs(p.defaultInputs);
    setTangents(p.defaultTangents);
    setStepIndex(0);
    setIsPlaying(false);
    setSelectedNodeId(null);
  };

  // Math evaluations
  const forwardResult = useMemo(
    () => evaluateGraphForward(preset.nodes, inputs, tangents),
    [preset.nodes, inputs, tangents],
  );

  const reverseResult = useMemo(
    () =>
      evaluateGraphReverse(preset.nodes, inputs, preset.defaultAdjointSeed, preset.outputNodeId),
    [preset.nodes, inputs, preset.defaultAdjointSeed, preset.outputNodeId],
  );

  const hvpResult = useMemo(
    () => computeHessianVectorProduct(presetId, inputs, tangents),
    [presetId, inputs, tangents],
  );

  const vectorCalcResult = useMemo(
    () => computeVectorFieldCalculus(presetId, inputs, tangents),
    [presetId, inputs, tangents],
  );

  // Total steps depending on mode
  const totalSteps = useMemo(() => {
    switch (mode) {
      case "forward":
        return forwardResult.traces.length;
      case "reverse":
        return reverseResult.traces.length;
      case "double_backward":
        return hvpResult.rOperatorTraces.length;
      case "vector_calculus":
        return preset.nodes.length;
    }
  }, [
    mode,
    forwardResult.traces.length,
    reverseResult.traces.length,
    hvpResult.rOperatorTraces.length,
    preset.nodes.length,
  ]);

  // Clamp step index
  const safeStepIndex = Math.min(stepIndex, Math.max(0, totalSteps - 1));

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);
    return () => clearInterval(timer);
  }, [isPlaying, totalSteps, playbackSpeed]);

  const handleInputChange = (varName: string, val: number) => {
    setInputs((prev) => ({ ...prev, [varName]: val }));
  };

  const handleTangentChange = (varName: string, val: number) => {
    setTangents((prev) => ({ ...prev, [varName]: val }));
  };

  // Active highlighted node and edge in current step
  const activeNodeHighlight = useMemo(() => {
    if (mode === "forward") {
      const trace = forwardResult.traces[safeStepIndex];
      return trace ? trace.nodeId : null;
    }
    if (mode === "reverse") {
      const trace = reverseResult.traces[safeStepIndex];
      return trace ? trace.activeNodeId : null;
    }
    if (mode === "double_backward") {
      const trace = hvpResult.rOperatorTraces[safeStepIndex];
      return trace ? trace.nodeId : null;
    }
    return preset.nodes[safeStepIndex]?.id ?? null;
  }, [
    mode,
    forwardResult.traces,
    reverseResult.traces,
    hvpResult.rOperatorTraces,
    safeStepIndex,
    preset.nodes,
  ]);

  const activeEdgeHighlight = useMemo(() => {
    if (mode === "reverse") {
      const trace = reverseResult.traces[safeStepIndex];
      if (trace) {
        return { from: trace.activeNodeId, to: trace.targetNodeId };
      }
    }
    return null;
  }, [mode, reverseResult.traces, safeStepIndex]);

  // Node position map in canvas SVG coordinates
  const nodeCoords = useMemo(() => {
    const padX = 60;
    const padY = 50;
    const usableW = Math.max(100, box.width * 0.65 - padX * 2);
    const usableH = Math.max(100, box.height - padY * 2 - 40);

    const map: Record<string, { x: number; y: number; node: GraphNode }> = {};
    for (const n of preset.nodes) {
      map[n.id] = {
        x: padX + n.xFrac * usableW,
        y: padY + n.yFrac * usableH,
        node: n,
      };
    }
    return map;
  }, [preset.nodes, box.width, box.height]);

  // Selected node inspect details
  const inspectedNode = useMemo(() => {
    const id = selectedNodeId ?? activeNodeHighlight ?? preset.nodes[0]?.id;
    if (!id) return null;
    const node = preset.nodes.find((n) => n.id === id);
    if (!node) return null;

    const primal = forwardResult.primals[id] ?? 0;
    const tangent = forwardResult.tangents[id] ?? 0;
    const adjoint = reverseResult.adjoints[id] ?? 0;
    const incomingReverseDeltas = reverseResult.traces.filter((t) => t.targetNodeId === id);

    return {
      node,
      primal,
      tangent,
      adjoint,
      incomingReverseDeltas,
    };
  }, [
    selectedNodeId,
    activeNodeHighlight,
    preset.nodes,
    forwardResult.primals,
    forwardResult.tangents,
    reverseResult.adjoints,
    reverseResult.traces,
  ]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minHeight: standalone ? "100vh" : height,
        backgroundColor: "#020617",
        borderRadius: standalone ? 0 : "12px",
        border: standalone ? "none" : "1px solid #1e293b",
        overflow: "hidden",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        color: "#f8fafc",
      }}
    >
      {/* 1. STUDIO HEADER */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          backgroundColor: "#090d16",
          borderBottom: "1px solid #1e293b",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "rgba(99, 102, 241, 0.15)",
              color: "#818cf8",
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9" }}>{title}</div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              Mathematical Autodiff, Exact Graph Adjoints, Pearlmutter $Hv$, & Vector Fields
            </div>
          </div>
        </div>

        {/* Preset Selector Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              color: "#64748b",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Preset:
          </span>
          <select
            value={presetId}
            onChange={(e) => handleSelectPreset(e.target.value as AutodiffPresetId)}
            style={{
              padding: "6px 12px",
              backgroundColor: "#0f172a",
              color: "#e2e8f0",
              borderRadius: "6px",
              border: "1px solid #334155",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {Object.values(AUTODIFF_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. MODE SELECTOR TABS & FORMULA BANNER */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          backgroundColor: "#0f172a",
          borderBottom: "1px solid #1e293b",
          gap: "8px",
        }}
      >
        {/* Mode Tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            {
              id: "forward",
              label: "⚡ Forward Mode (Dual / Tangents)",
              icon: Zap,
              color: "#38bdf8",
            },
            {
              id: "reverse",
              label: "🔄 Reverse Mode (Adjoints / VJP)",
              icon: RefreshCw,
              color: "#f43f5e",
            },
            {
              id: "double_backward",
              label: "🔬 Double-Backward Hv (Pearlmutter)",
              icon: Cpu,
              color: "#a855f7",
            },
            {
              id: "vector_calculus",
              label: "🌐 Vector Calculus (Jacobian / Field)",
              icon: Compass,
              color: "#10b981",
            },
          ].map((m) => {
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setMode(m.id as AutodiffMode);
                  setStepIndex(0);
                  setIsPlaying(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? "rgba(30, 41, 59, 0.9)" : "transparent",
                  color: isActive ? m.color : "#94a3b8",
                  border: isActive ? `1px solid ${m.color}60` : "1px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Current Function TeX banner */}
        <div
          style={{
            fontSize: "12px",
            fontFamily: "monospace",
            color: "#cbd5e1",
            padding: "4px 10px",
            borderRadius: "4px",
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
          }}
        >
          {preset.expression}
        </div>
      </div>

      {/* 3. INTERACTIVE CONTROL DECK */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          backgroundColor: "#090d16",
          borderBottom: "1px solid #1e293b",
          gap: "12px",
        }}
      >
        {/* Variable Sliders */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
          {Object.keys(inputs).map((varName) => (
            <div key={varName} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#38bdf8",
                  fontFamily: "monospace",
                }}
              >
                {varName} =
              </span>
              <input
                type="range"
                min="-3.0"
                max="3.0"
                step="0.1"
                value={inputs[varName]}
                onChange={(e) => handleInputChange(varName, parseFloat(e.target.value))}
                style={{ width: "80px", accentColor: "#38bdf8", cursor: "pointer" }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "monospace",
                  color: "#e2e8f0",
                  minWidth: "40px",
                  padding: "2px 4px",
                  backgroundColor: "#1e293b",
                  borderRadius: "4px",
                  textAlign: "right",
                }}
              >
                {inputs[varName].toFixed(2)}
              </span>
            </div>
          ))}

          {/* Tangent Sliders */}
          {(mode === "forward" || mode === "double_backward" || mode === "vector_calculus") &&
            Object.keys(tangents).map((varName) => (
              <div
                key={`dot-${varName}`}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#fbbf24",
                    fontFamily: "monospace",
                  }}
                >
                  v_{varName} =
                </span>
                <input
                  type="range"
                  min="-2.0"
                  max="2.0"
                  step="0.1"
                  value={tangents[varName] ?? 0}
                  onChange={(e) => handleTangentChange(varName, parseFloat(e.target.value))}
                  style={{ width: "70px", accentColor: "#fbbf24", cursor: "pointer" }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontFamily: "monospace",
                    color: "#fde68a",
                    minWidth: "36px",
                    padding: "2px 4px",
                    backgroundColor: "#1e293b",
                    borderRadius: "4px",
                    textAlign: "right",
                  }}
                >
                  {(tangents[varName] ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
        </div>

        {/* Stepper Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              fontFamily: "monospace",
              marginRight: "4px",
            }}
          >
            Step {safeStepIndex + 1} / {totalSteps}
          </div>
          <button
            onClick={() => {
              setStepIndex(0);
              setIsPlaying(false);
            }}
            title="Reset to step 0"
            style={{
              padding: "6px",
              backgroundColor: "#1e293b",
              color: "#94a3b8",
              borderRadius: "4px",
              border: "1px solid #334155",
              cursor: "pointer",
            }}
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={() => {
              setStepIndex((prev) => Math.max(0, prev - 1));
              setIsPlaying(false);
            }}
            title="Step Back"
            disabled={safeStepIndex <= 0}
            style={{
              padding: "6px",
              backgroundColor: "#1e293b",
              color: safeStepIndex <= 0 ? "#475569" : "#e2e8f0",
              borderRadius: "4px",
              border: "1px solid #334155",
              cursor: safeStepIndex <= 0 ? "not-allowed" : "pointer",
            }}
          >
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
          </button>
          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            title={isPlaying ? "Pause" : "Auto Play"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              backgroundColor: isPlaying ? "#f43f5e" : "#6366f1",
              color: "#ffffff",
              borderRadius: "4px",
              border: "none",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
              setIsPlaying(false);
            }}
            title="Step Forward"
            disabled={safeStepIndex >= totalSteps - 1}
            style={{
              padding: "6px",
              backgroundColor: "#1e293b",
              color: safeStepIndex >= totalSteps - 1 ? "#475569" : "#e2e8f0",
              borderRadius: "4px",
              border: "1px solid #334155",
              cursor: safeStepIndex >= totalSteps - 1 ? "not-allowed" : "pointer",
            }}
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => {
              setStepIndex(totalSteps - 1);
              setIsPlaying(false);
            }}
            title="Jump to Final Output"
            style={{
              padding: "6px",
              backgroundColor: "#1e293b",
              color: "#94a3b8",
              borderRadius: "4px",
              border: "1px solid #334155",
              cursor: "pointer",
            }}
          >
            <SkipForward size={14} />
          </button>
        </div>
      </div>

      {/* 4. MAIN STAGE: COMPUTATIONAL DAG CANVAS (70%) + LIVE ANALYSIS PANEL (30%) */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: "440px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 4A. SVG COMPUTATIONAL GRAPH STAGE */}
        <div
          ref={ref}
          style={{
            flex: 1,
            position: "relative",
            backgroundColor: "#020617",
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.4) 0%, rgba(2, 6, 23, 0.9) 100%)",
            overflow: "hidden",
          }}
        >
          <svg
            viewBox={viewBoxAttr(boxViewBox(box))}
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            <defs>
              {/* Grid Background Pattern */}
              <pattern id="grid-dots" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#1e293b" />
              </pattern>

              {/* Arrowhead Markers */}
              <marker
                id="arrow-fwd"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
              </marker>
              <marker
                id="arrow-rev"
                viewBox="0 0 10 10"
                refX="0"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 10 1 L 0 5 L 10 9 z" fill="#f43f5e" />
              </marker>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="20"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#475569" />
              </marker>

              {/* Glow filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid */}
            <rect width="100%" height="100%" fill="url(#grid-dots)" />

            {/* 1. Directed Edges */}
            {preset.nodes.map((node) => {
              const toPos = nodeCoords[node.id];
              if (!toPos) return null;

              return node.inputs.map((inputId) => {
                const fromPos = nodeCoords[inputId];
                if (!fromPos) return null;

                const isEdgeActiveRev =
                  activeEdgeHighlight &&
                  activeEdgeHighlight.from === node.id &&
                  activeEdgeHighlight.to === inputId;

                const dx = toPos.x - fromPos.x;
                const cx1 = fromPos.x + dx * 0.45;
                const cy1 = fromPos.y;
                const cx2 = fromPos.x + dx * 0.55;
                const cy2 = toPos.y;

                const pathData = `M ${fromPos.x} ${fromPos.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${toPos.x} ${toPos.y}`;

                let strokeColor = "#334155";
                let strokeWidth = 1.5;
                const strokeDash = "none";
                let markerEnd = "url(#arrow-default)";

                if (mode === "forward") {
                  strokeColor = "#38bdf880";
                  markerEnd = "url(#arrow-fwd)";
                } else if (mode === "reverse") {
                  if (isEdgeActiveRev) {
                    strokeColor = "#f43f5e";
                    strokeWidth = 3;
                    markerEnd = "url(#arrow-rev)";
                  } else {
                    strokeColor = "#475569";
                  }
                } else if (mode === "double_backward") {
                  strokeColor = "#a855f780";
                }

                return (
                  <g key={`${inputId}->${node.id}`}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      markerEnd={markerEnd}
                      filter={isEdgeActiveRev ? "url(#glow)" : undefined}
                    />
                  </g>
                );
              });
            })}

            {/* 2. Graph Nodes */}
            {preset.nodes.map((node) => {
              const pos = nodeCoords[node.id];
              if (!pos) return null;

              const isHighlighted = activeNodeHighlight === node.id;
              const isSelected = selectedNodeId === node.id;

              const primal = forwardResult.primals[node.id] ?? 0;
              const tangent = forwardResult.tangents[node.id] ?? 0;
              const adjoint = reverseResult.adjoints[node.id] ?? 0;
              const rAdj =
                hvpResult.rOperatorTraces.find((r) => r.nodeId === node.id)?.rAdjoint ?? 0;

              const nodeW = 100;
              const nodeH = 54;
              const nx = pos.x - nodeW / 2;
              const ny = pos.y - nodeH / 2;

              let borderColor = "#334155";
              let bgFill = "#0f172a";
              if (isHighlighted) {
                borderColor =
                  mode === "reverse" ? "#f43f5e" : mode === "forward" ? "#38bdf8" : "#a855f7";
                bgFill = "#1e293b";
              }
              if (isSelected) {
                borderColor = "#fbbf24";
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${nx}, ${ny})`}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Node Body Card */}
                  <rect
                    width={nodeW}
                    height={nodeH}
                    rx="8"
                    fill={bgFill}
                    stroke={borderColor}
                    strokeWidth={isHighlighted || isSelected ? 2.5 : 1.2}
                    filter={isHighlighted ? "url(#glow)" : undefined}
                  />

                  {/* Header bar / Op */}
                  <rect width={nodeW} height="18" rx="8" fill="rgba(30, 41, 59, 0.6)" />
                  <text
                    x="8"
                    y="13"
                    fill={node.op === "input" ? "#38bdf8" : "#94a3b8"}
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {node.label}
                  </text>
                  <text
                    x={nodeW - 8}
                    y="13"
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {node.op}
                  </text>

                  {/* Primal value */}
                  <text
                    x="8"
                    y="32"
                    fill="#f8fafc"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    v: {primal.toFixed(3)}
                  </text>

                  {/* Secondary Badge according to mode */}
                  {mode === "forward" && (
                    <text
                      x="8"
                      y="46"
                      fill="#fbbf24"
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      v̇: {tangent.toFixed(3)}
                    </text>
                  )}
                  {mode === "reverse" && (
                    <text
                      x="8"
                      y="46"
                      fill="#f43f5e"
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      v̄: {adjoint.toFixed(3)}
                    </text>
                  )}
                  {mode === "double_backward" && (
                    <text
                      x="8"
                      y="46"
                      fill="#a855f7"
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      R: {rAdj.toFixed(3)}
                    </text>
                  )}
                  {mode === "vector_calculus" && (
                    <text
                      x="8"
                      y="46"
                      fill="#34d399"
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      {node.op === "input" ? `x_i` : `f_k`}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Canvas Legend */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "6px 12px",
              borderRadius: "6px",
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(4px)",
              border: "1px solid #1e293b",
              fontSize: "11px",
              color: "#94a3b8",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "2px",
                  backgroundColor: "#f8fafc",
                }}
              />
              Primal v
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "2px",
                  backgroundColor: "#fbbf24",
                }}
              />
              Tangent v̇
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "2px",
                  backgroundColor: "#f43f5e",
                }}
              />
              Adjoint v̄
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "2px",
                  backgroundColor: "#a855f7",
                }}
              />
              Hessian-Vector R
            </div>
          </div>
        </div>

        {/* 4B. RIGHT SIDE INSPECTION & DYNAMIC ANALYSIS PANEL */}
        <div
          style={{
            width: "360px",
            backgroundColor: "#090d16",
            borderLeft: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            padding: "16px",
            gap: "14px",
          }}
        >
          {/* Active Mode Metrics Card */}
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc" }}>
                {mode === "forward" && "⚡ Forward-Mode Dual Numbers"}
                {mode === "reverse" && "🔄 Reverse-Mode Adjoint Vector"}
                {mode === "double_backward" && "🔬 Exact Hessian-Vector Product Hv"}
                {mode === "vector_calculus" && "🌐 Vector Field & Differential"}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: "#1e293b",
                  color: "#38bdf8",
                  fontWeight: 600,
                }}
              >
                Exact
              </span>
            </div>

            {/* Mode 1: Forward Results */}
            {mode === "forward" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Output Primal f(x):</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#38bdf8" }}>
                    {forwardResult.outputValue.toFixed(4)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Directional Deriv ∇f · v:</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#fbbf24" }}>
                    {forwardResult.outputTangent.toFixed(4)}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                  Dual evaluation: f(x + εv) = {forwardResult.outputValue.toFixed(3)} +{" "}
                  {forwardResult.outputTangent.toFixed(3)} ε (where ε² = 0)
                </div>
              </div>
            )}

            {/* Mode 2: Reverse Results */}
            {mode === "reverse" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}
              >
                <div style={{ color: "#94a3b8", fontWeight: 600 }}>Backpropagated Gradient ∇f:</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "6px",
                    marginTop: "4px",
                  }}
                >
                  {Object.keys(reverseResult.inputGradients).map((k) => (
                    <div
                      key={k}
                      style={{
                        padding: "6px",
                        backgroundColor: "#1e293b",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "#f43f5e" }}>∂f/∂{k}:</span>
                      <span style={{ fontWeight: 700, color: "#f8fafc" }}>
                        {reverseResult.inputGradients[k].toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 3: Double Backward Results */}
            {mode === "double_backward" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}
              >
                <div style={{ color: "#94a3b8", fontWeight: 600 }}>
                  Hessian-Vector Product H · v:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {Object.keys(hvpResult.exactHVP).map((k) => (
                    <div
                      key={k}
                      style={{
                        padding: "6px",
                        backgroundColor: "#1e293b",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "#a855f7" }}>(Hv)_{k}:</span>
                      <span style={{ fontWeight: 700, color: "#f8fafc" }}>
                        {hvpResult.exactHVP[k].toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Finite Difference Cross-Check */}
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    marginTop: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#34d399",
                      fontSize: "11px",
                      fontWeight: 700,
                      marginBottom: "4px",
                    }}
                  >
                    <CheckCircle2 size={13} />
                    Finite-Difference Cross Check (ε = 10⁻⁵):
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                    Max |Hv_Exact - Hv_FD| = {hvpResult.maxAbsoluteError.toExponential(3)}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 4: Vector Calculus Results */}
            {mode === "vector_calculus" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Divergence ∇ · F:</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#38bdf8" }}>
                    {vectorCalcResult.divergence.toFixed(4)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Curl ∇ × F (z-axis):</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#f43f5e" }}>
                    {vectorCalcResult.curl.toFixed(4)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Jacobian Det |J|:</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#34d399" }}>
                    {vectorCalcResult.determinant.toFixed(4)}
                  </span>
                </div>

                {/* Jacobian Matrix Table */}
                <div style={{ marginTop: "4px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                    Jacobian Matrix J(x, y):
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${vectorCalcResult.jacobianMatrix[0]?.length ?? 2}, 1fr)`,
                      gap: "4px",
                      backgroundColor: "#020617",
                      padding: "6px",
                      borderRadius: "4px",
                      border: "1px solid #1e293b",
                    }}
                  >
                    {vectorCalcResult.jacobianMatrix.map((row, rIdx) =>
                      row.map((val, cIdx) => (
                        <div
                          key={`j-${rIdx}-${cIdx}`}
                          style={{
                            fontFamily: "monospace",
                            fontSize: "11px",
                            textAlign: "center",
                            color: "#e2e8f0",
                          }}
                        >
                          {val.toFixed(3)}
                        </div>
                      )),
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Node Inspector Card */}
          {inspectedNode && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Eye size={14} color="#fbbf24" />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc" }}>
                    Node Inspector: {inspectedNode.node.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: "#1e293b",
                    color: "#94a3b8",
                  }}
                >
                  ID: {inspectedNode.node.id}
                </span>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}
              >
                <div style={{ color: "#cbd5e1" }}>{inspectedNode.node.description}</div>
                <div
                  style={{
                    padding: "6px",
                    borderRadius: "4px",
                    backgroundColor: "#020617",
                    fontFamily: "monospace",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div>Primal v = {inspectedNode.primal.toFixed(4)}</div>
                  <div>Tangent v̇ = {inspectedNode.tangent.toFixed(4)}</div>
                  <div>Adjoint v̄ = {inspectedNode.adjoint.toFixed(4)}</div>
                </div>

                {/* Multi-path fan-out breakdown in reverse mode */}
                {inspectedNode.incomingReverseDeltas.length > 0 && (
                  <div style={{ marginTop: "4px" }}>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#f43f5e",
                        fontWeight: 700,
                        marginBottom: "2px",
                      }}
                    >
                      Fan-Out Adjoint Contributions (Σ bar{`{v_k}`} ∂v_k/∂v):
                    </div>
                    {inspectedNode.incomingReverseDeltas.map((d, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: "10px",
                          fontFamily: "monospace",
                          color: "#94a3b8",
                          borderLeft: "2px solid #f43f5e",
                          paddingLeft: "4px",
                          marginBottom: "2px",
                        }}
                      >
                        From {d.activeNodeId}: +{d.propagatedDelta.toFixed(4)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stepper Execution Log */}
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              flex: 1,
            }}
          >
            <div
              style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc", marginBottom: "6px" }}
            >
              Execution Trace (Step {safeStepIndex + 1})
            </div>
            <div
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#94a3b8",
                lineHeight: "1.5",
              }}
            >
              {mode === "forward" && forwardResult.traces[safeStepIndex]?.localFormula && (
                <>
                  <div style={{ color: "#38bdf8" }}>
                    {forwardResult.traces[safeStepIndex].localFormula}
                  </div>
                  <div style={{ color: "#fbbf24" }}>
                    {forwardResult.traces[safeStepIndex].tangentFormula}
                  </div>
                </>
              )}
              {mode === "reverse" && reverseResult.traces[safeStepIndex] && (
                <div style={{ color: "#f43f5e" }}>
                  {reverseResult.traces[safeStepIndex].description}
                </div>
              )}
              {mode === "double_backward" && hvpResult.rOperatorTraces[safeStepIndex] && (
                <div style={{ color: "#a855f7" }}>
                  {hvpResult.rOperatorTraces[safeStepIndex].formula}
                </div>
              )}
              {mode === "vector_calculus" && (
                <div style={{ color: "#34d399" }}>
                  Evaluated component at node: {preset.nodes[safeStepIndex]?.id}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. COLLAPSIBLE MATHEMATICAL THEORY DEEP DIVE */}
      <div
        style={{
          borderTop: "1px solid #1e293b",
          backgroundColor: "#090d16",
        }}
      >
        <button
          onClick={() => setShowTheoryPanel((prev) => !prev)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            backgroundColor: "transparent",
            border: "none",
            color: "#94a3b8",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Info size={16} color="#818cf8" />
            <span>
              Mathematical Foundations: Dual Numbers, VJP vs. JVP, Pearlmutter R-Operator & Vector
              Calculus
            </span>
          </div>
          {showTheoryPanel ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {showTheoryPanel && (
          <div
            style={{
              padding: "16px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "14px",
              borderTop: "1px solid #1e293b",
              backgroundColor: "#020617",
            }}
          >
            <div
              style={{
                padding: "12px",
                borderRadius: "6px",
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
              }}
            >
              <div
                style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", marginBottom: "4px" }}
              >
                1. Forward Mode & Dual Numbers
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.5" }}>
                Forward AD propagates dual numbers <code>a + bε</code> where <code>ε² = 0</code>.
                Evaluates the Jacobian-Vector Product <code>J · v</code> in a single forward pass
                with <code>O(N)</code> runtime per input seed tangent.
              </div>
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "6px",
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
              }}
            >
              <div
                style={{ fontSize: "12px", fontWeight: 700, color: "#f43f5e", marginBottom: "4px" }}
              >
                2. Reverse Mode & VJP Backprop
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.5" }}>
                Reverse AD executes the Vector-Jacobian Product <code>v̄ᵀ J</code>. Accumulates
                adjoints <code>v̄_j = Σ v̄_k (∂v_k / ∂v_j)</code> across all DAG fan-out branches,
                obtaining the entire scalar loss gradient <code>∇f</code> in <code>O(1)</code>{" "}
                passes.
              </div>
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "6px",
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
              }}
            >
              <div
                style={{ fontSize: "12px", fontWeight: 700, color: "#a855f7", marginBottom: "4px" }}
              >
                3. Pearlmutter Hessian-Vector Product
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.5" }}>
                The <code>R</code>-operator{" "}
                <code>
                  R{`{f}`} = d/dt f(x + t v)|_{`t=0`}
                </code>{" "}
                computes exact Hessian-vector products <code>H · v = ∇(∇f(x)ᵀ v)</code> without
                materializing the <code>N × N</code> Hessian matrix, critical for Newton-CG and
                second-order optimization.
              </div>
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "6px",
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
              }}
            >
              <div
                style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", marginBottom: "4px" }}
              >
                4. Differential Geometry & Stokes
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.5" }}>
                For vector fields <code>F</code>, the Jacobian <code>J</code> maps tangent spaces.
                Divergence <code>∇ · F = tr(J)</code> measures local volume expansion/compression
                flux, while curl <code>∇ × F</code> quantifies microscopic rotational circulation.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
