import { describe, expect, it } from "bun:test";
import React from "react";
import {
  VectorCalculusAutodiffStudio,
  AUTODIFF_PRESETS,
  evaluateGraphForward,
  evaluateGraphReverse,
  computeExactHessian,
  computeHessianVectorProduct,
  computeFiniteDifferenceHVP,
  computeJacobianMatrix,
  computeVectorFieldCalculus,
} from "../../components/primitives/VectorCalculusAutodiffStudio";

describe("VectorCalculusAutodiffStudio & Computational Graph Calculus Tests", () => {
  describe("1. Component Instantiation & Configurations", () => {
    it("should instantiate VectorCalculusAutodiffStudio with default props", () => {
      const element = React.createElement(VectorCalculusAutodiffStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(VectorCalculusAutodiffStudio);
    });

    it("should instantiate VectorCalculusAutodiffStudio with custom modes and presets", () => {
      const element = React.createElement(VectorCalculusAutodiffStudio, {
        initialMode: "reverse",
        initialPreset: "rosenbrock",
        width: 1024,
        height: 640,
        standalone: true,
        title: "Rosenbrock Optimization Visualizer",
      });

      expect(element.props.initialMode).toBe("reverse");
      expect(element.props.initialPreset).toBe("rosenbrock");
      expect(element.props.width).toBe(1024);
      expect(element.props.height).toBe(640);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Rosenbrock Optimization Visualizer");
    });

    it("should provide valid preset structures for all defined presets", () => {
      const presetIds = [
        "poly_trig",
        "rosenbrock",
        "saddle_point",
        "vector_field",
        "quadratic_loss",
      ] as const;
      for (const id of presetIds) {
        const p = AUTODIFF_PRESETS[id];
        expect(p).toBeDefined();
        expect(p.id).toBe(id);
        expect(p.nodes.length).toBeGreaterThan(0);
        expect(p.defaultInputs).toBeDefined();
        expect(p.defaultTangents).toBeDefined();
        expect(p.outputNodeId).toBeDefined();
      }
    });
  });

  describe("2. Forward-Mode Dual Numbers & Tangent Evaluation", () => {
    it("should compute exact primal and directional tangent on poly_trig function", () => {
      const preset = AUTODIFF_PRESETS.poly_trig;
      const inputs = { x: 1.5, y: 0.8 };
      const tangents = { x: 1.0, y: 0.5 };

      const fwd = evaluateGraphForward(preset.nodes, inputs, tangents);

      // f(x, y) = x^2 y + sin(x) + e^y
      const expectedPrimal = 1.5 * 1.5 * 0.8 + Math.sin(1.5) + Math.exp(0.8);
      expect(fwd.outputValue).toBeCloseTo(expectedPrimal, 6);

      // df/dx = 2xy + cos(x) = 2(1.5)(0.8) + cos(1.5) = 2.4 + cos(1.5)
      // df/dy = x^2 + e^y = 2.25 + e^0.8
      // Directional derivative = df/dx * vx + df/dy * vy
      const df_dx = 2 * 1.5 * 0.8 + Math.cos(1.5);
      const df_dy = 1.5 * 1.5 + Math.exp(0.8);
      const expectedTangent = df_dx * 1.0 + df_dy * 0.5;

      expect(fwd.outputTangent).toBeCloseTo(expectedTangent, 6);
    });

    it("should evaluate forward dual tangents independently for basis unit vectors", () => {
      const preset = AUTODIFF_PRESETS.poly_trig;
      const inputs = { x: 1.5, y: 0.8 };

      // Seed e_x = (1, 0) -> gives df/dx
      const fwdX = evaluateGraphForward(preset.nodes, inputs, { x: 1.0, y: 0.0 });
      const df_dx = 2 * 1.5 * 0.8 + Math.cos(1.5);
      expect(fwdX.outputTangent).toBeCloseTo(df_dx, 6);

      // Seed e_y = (0, 1) -> gives df/dy
      const fwdY = evaluateGraphForward(preset.nodes, inputs, { x: 0.0, y: 1.0 });
      const df_dy = 1.5 * 1.5 + Math.exp(0.8);
      expect(fwdY.outputTangent).toBeCloseTo(df_dy, 6);
    });

    it("should evaluate Monkey Saddle cubic function correctly", () => {
      const preset = AUTODIFF_PRESETS.saddle_point;
      const inputs = { x: 0.6, y: -0.4 };
      const tangents = { x: 1.0, y: -1.0 };

      const fwd = evaluateGraphForward(preset.nodes, inputs, tangents);

      // f(x, y) = x^3 - 3 x y^2 = 0.6^3 - 3 * 0.6 * 0.16 = 0.216 - 0.288 = -0.072
      expect(fwd.outputValue).toBeCloseTo(-0.072, 6);

      // df/dx = 3x^2 - 3y^2 = 3(0.36 - 0.16) = 0.6
      // df/dy = -6xy = -6(0.6)(-0.4) = 1.44
      // v = (1, -1) -> 0.6*(1) + 1.44*(-1) = 0.6 - 1.44 = -0.84
      expect(fwd.outputTangent).toBeCloseTo(-0.84, 6);
    });

    it("should evaluate 3D quadratic form correctly", () => {
      const preset = AUTODIFF_PRESETS.quadratic_loss;
      const inputs = { x: 1.0, y: 0.8, z: -0.5 };
      const tangents = { x: 1.0, y: 2.0, z: -1.0 };

      const fwd = evaluateGraphForward(preset.nodes, inputs, tangents);

      // f = 0.5*(1 + 2*0.64 + 3*0.25) + 1*0.8*(-0.5) = 0.5*(3.03) - 0.4 = 1.115
      expect(fwd.outputValue).toBeCloseTo(1.115, 6);

      // df/dx = x + yz = 1 + (0.8)(-0.5) = 0.6
      // df/dy = 2y + xz = 1.6 + (1)(-0.5) = 1.1
      // df/dz = 3z + xy = -1.5 + 0.8 = -0.7
      // Directional: 0.6*1 + 1.1*2 + (-0.7)*(-1) = 0.6 + 2.2 + 0.7 = 3.5
      expect(fwd.outputTangent).toBeCloseTo(3.5, 6);
    });
  });

  describe("3. Reverse-Mode Adjoints & Fan-Out Multi-Path Gradient Backpropagation", () => {
    it("should accumulate adjoints through fan-out paths and match forward directional derivative", () => {
      const preset = AUTODIFF_PRESETS.poly_trig;
      const inputs = { x: 1.5, y: 0.8 };

      const rev = evaluateGraphReverse(preset.nodes, inputs, 1.0);

      const df_dx = 2 * 1.5 * 0.8 + Math.cos(1.5);
      const df_dy = 1.5 * 1.5 + Math.exp(0.8);

      expect(rev.inputGradients.x).toBeCloseTo(df_dx, 6);
      expect(rev.inputGradients.y).toBeCloseTo(df_dy, 6);

      // Test duality: <grad f, v> == dot_f
      const v = { x: 0.7, y: -0.3 };
      const fwd = evaluateGraphForward(preset.nodes, inputs, v);
      const innerProduct = rev.inputGradients.x * v.x + rev.inputGradients.y * v.y;
      expect(fwd.outputTangent).toBeCloseTo(innerProduct, 6);
    });

    it("should verify Rosenbrock minimum gradient is zero at (1, 1)", () => {
      const preset = AUTODIFF_PRESETS.rosenbrock;
      const atMin = { x: 1.0, y: 1.0 };

      const rev = evaluateGraphReverse(preset.nodes, atMin, 1.0);
      expect(rev.inputGradients.x).toBeCloseTo(0.0, 6);
      expect(rev.inputGradients.y).toBeCloseTo(0.0, 6);

      const fwd = evaluateGraphForward(preset.nodes, atMin);
      expect(fwd.outputValue).toBeCloseTo(0.0, 6);
    });

    it("should compute exact non-zero gradients on Rosenbrock off-optimum", () => {
      const preset = AUTODIFF_PRESETS.rosenbrock;
      const pt = { x: -0.8, y: 0.6 };

      const rev = evaluateGraphReverse(preset.nodes, pt, 1.0);

      // df/dx = -400x(y - x^2) - 2(1 - x)
      // x = -0.8, y = 0.6 -> y - x^2 = 0.6 - 0.64 = -0.04
      // df/dx = -400(-0.8)(-0.04) - 2(1.8) = -12.8 - 3.6 = -16.4
      // df/dy = 200(y - x^2) = 200(-0.04) = -8.0
      expect(rev.inputGradients.x).toBeCloseTo(-16.4, 5);
      expect(rev.inputGradients.y).toBeCloseTo(-8.0, 5);
    });

    it("should verify Saddle Point critical point at (0, 0)", () => {
      const preset = AUTODIFF_PRESETS.saddle_point;
      const rev = evaluateGraphReverse(preset.nodes, { x: 0.0, y: 0.0 }, 1.0);
      expect(rev.inputGradients.x).toBeCloseTo(0.0, 6);
      expect(rev.inputGradients.y).toBeCloseTo(0.0, 6);
    });
  });

  describe("4. Double-Backward Hessian-Vector Product (Hv) & Finite-Difference Verification", () => {
    it("should compute exact analytical Hessian matrices across presets", () => {
      // poly_trig
      const H_poly = computeExactHessian("poly_trig", { x: 1.5, y: 0.8 });
      expect(H_poly[0][0]).toBeCloseTo(2 * 0.8 - Math.sin(1.5), 6);
      expect(H_poly[0][1]).toBeCloseTo(2 * 1.5, 6);
      expect(H_poly[1][0]).toBeCloseTo(2 * 1.5, 6);
      expect(H_poly[1][1]).toBeCloseTo(Math.exp(0.8), 6);

      // rosenbrock at (1, 1)
      const H_rosen = computeExactHessian("rosenbrock", { x: 1.0, y: 1.0 });
      expect(H_rosen[0][0]).toBe(802);
      expect(H_rosen[0][1]).toBe(-400);
      expect(H_rosen[1][0]).toBe(-400);
      expect(H_rosen[1][1]).toBe(200);

      // saddle_point at (0.6, -0.4)
      const H_saddle = computeExactHessian("saddle_point", { x: 0.6, y: -0.4 });
      expect(H_saddle[0][0]).toBeCloseTo(3.6, 6);
      expect(H_saddle[0][1]).toBeCloseTo(2.4, 6);
      expect(H_saddle[1][0]).toBeCloseTo(2.4, 6);
      expect(H_saddle[1][1]).toBeCloseTo(-3.6, 6);
      // Trace of harmonic saddle is exactly 0
      expect(H_saddle[0][0] + H_saddle[1][1]).toBeCloseTo(0.0, 6);
    });

    it("should match exact Hv with central finite-difference approximation within 1e-4 tolerance for poly_trig", () => {
      const inputs = { x: 1.5, y: 0.8 };
      const v = { x: 1.0, y: 0.5 };
      const res = computeHessianVectorProduct("poly_trig", inputs, v);

      expect(res.exactHVP.x).toBeCloseTo(res.finiteDiffHVP.x, 4);
      expect(res.exactHVP.y).toBeCloseTo(res.finiteDiffHVP.y, 4);
      expect(res.maxAbsoluteError).toBeLessThan(1e-4);
    });

    it("should match exact Hv with central finite-difference approximation on Rosenbrock curve", () => {
      const inputs = { x: -0.8, y: 0.6 };
      const v = { x: 1.0, y: -0.5 };
      const res = computeHessianVectorProduct("rosenbrock", inputs, v);

      expect(res.exactHVP.x).toBeCloseTo(res.finiteDiffHVP.x, 3);
      expect(res.exactHVP.y).toBeCloseTo(res.finiteDiffHVP.y, 3);
      expect(res.maxAbsoluteError).toBeLessThan(1e-3);
    });

    it("should match exact Hv with finite-difference on 3D quadratic form", () => {
      const inputs = { x: 1.0, y: 0.8, z: -0.5 };
      const v = { x: 1.0, y: -1.0, z: 0.5 };
      const res = computeHessianVectorProduct("quadratic_loss", inputs, v);

      expect(res.exactHVP.x).toBeCloseTo(res.finiteDiffHVP.x, 4);
      expect(res.exactHVP.y).toBeCloseTo(res.finiteDiffHVP.y, 4);
      expect(res.exactHVP.z).toBeCloseTo(res.finiteDiffHVP.z, 4);
      expect(res.maxAbsoluteError).toBeLessThan(1e-4);
    });

    it("should return zero vector when multiplying Hessian by zero vector", () => {
      const inputs = { x: 2.0, y: -1.5 };
      const v = { x: 0.0, y: 0.0 };
      const res = computeHessianVectorProduct("poly_trig", inputs, v);

      expect(res.exactHVP.x).toBe(0.0);
      expect(res.exactHVP.y).toBe(0.0);
    });

    it("should verify positive definiteness of Rosenbrock Hessian at (1, 1)", () => {
      const H = computeExactHessian("rosenbrock", { x: 1.0, y: 1.0 });
      const det = H[0][0] * H[1][1] - H[0][1] * H[1][0];
      const trace = H[0][0] + H[1][1];

      // det = 802 * 200 - 160000 = 160400 - 160000 = 400 > 0
      expect(det).toBe(400);
      expect(trace).toBe(1002);
      expect(det > 0 && trace > 0).toBe(true);
    });
  });

  describe("5. Vector Calculus: Jacobian, Divergence, Curl & Pushforward", () => {
    it("should compute full Jacobian matrix for 2D vector field", () => {
      // F(x, y) = [x^2 - y, xy + cos(x)]^T
      const pt = { x: 1.2, y: 0.6 };
      const J = computeJacobianMatrix("vector_field", pt);

      // J_00 = 2x = 2.4
      // J_01 = -1.0
      // J_10 = y - sin(x) = 0.6 - sin(1.2)
      // J_11 = x = 1.2
      expect(J[0][0]).toBeCloseTo(2.4, 6);
      expect(J[0][1]).toBeCloseTo(-1.0, 6);
      expect(J[1][0]).toBeCloseTo(0.6 - Math.sin(1.2), 6);
      expect(J[1][1]).toBeCloseTo(1.2, 6);
    });

    it("should compute exact Divergence (flux) and Curl (vorticity)", () => {
      const pt = { x: 1.2, y: 0.6 };
      const v = { x: 1.0, y: -0.5 };
      const calc = computeVectorFieldCalculus("vector_field", pt, v);

      // div F = 2x + x = 3x = 3.6
      expect(calc.divergence).toBeCloseTo(3.6, 6);

      // curl F = (y - sin(x)) - (-1) = y - sin(x) + 1 = 0.6 - sin(1.2) + 1 = 1.6 - sin(1.2)
      expect(calc.curl).toBeCloseTo(1.6 - Math.sin(1.2), 6);

      // det J = (2.4)(1.2) - (-1.0)(0.6 - sin(1.2)) = 2.88 + 0.6 - sin(1.2) = 3.48 - sin(1.2)
      expect(calc.determinant).toBeCloseTo(3.48 - Math.sin(1.2), 6);

      // Pushforward J * v
      // (J v)_0 = 2.4 * 1.0 + (-1.0) * (-0.5) = 2.4 + 0.5 = 2.9
      // (J v)_1 = (0.6 - sin(1.2)) * 1.0 + 1.2 * (-0.5) = 0.6 - sin(1.2) - 0.6 = -sin(1.2)
      expect(calc.pushforward.F1).toBeCloseTo(2.9, 6);
      expect(calc.pushforward.F2).toBeCloseTo(-Math.sin(1.2), 6);
    });
  });

  describe("6. Edge Cases & Numerical Robustness", () => {
    it("should handle negative coordinates smoothly without divergence", () => {
      const pt = { x: -2.0, y: -1.5 };
      const rev = evaluateGraphReverse(AUTODIFF_PRESETS.poly_trig.nodes, pt);

      expect(Number.isFinite(rev.inputGradients.x)).toBe(true);
      expect(Number.isFinite(rev.inputGradients.y)).toBe(true);
    });

    it("should correctly compute finite-difference HVP with small eps", () => {
      const fd = computeFiniteDifferenceHVP(
        "poly_trig",
        { x: 1.0, y: 1.0 },
        { x: 0.5, y: -0.5 },
        1e-6,
      );

      expect(Number.isFinite(fd.x)).toBe(true);
      expect(Number.isFinite(fd.y)).toBe(true);
    });
  });
});
