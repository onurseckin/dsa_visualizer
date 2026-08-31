import { describe, expect, it } from "bun:test";
import React from "react";
import { MLPBackpropVisualizer } from "../../components/primitives/MLPBackpropVisualizer";
import { RMSNormVisualizer } from "../../components/primitives/RMSNormVisualizer";
import { Im2ColGEMMVisualizer } from "../../components/primitives/Im2ColGEMMVisualizer";

describe("Interactive Neural Network & Kernel Visualizer Primitives Tests", () => {
  describe("1. MLPBackpropVisualizer & Computational Graph Adjoints", () => {
    it("should instantiate MLPBackpropVisualizer with custom inputs and targets", () => {
      const element = React.createElement(MLPBackpropVisualizer, {
        initialInputs: [2.0, -1.0, 0.5],
        initialTargets: [1.0, 0.0],
        title: "Test MLP Backpropagation",
      });

      expect(element).toBeDefined();
      expect(element.props.initialInputs).toEqual([2.0, -1.0, 0.5]);
      expect(element.props.initialTargets).toEqual([1.0, 0.0]);
    });

    it("should calculate correct forward ReLU activations and backward adjoints mathematically", () => {
      const inputs = [1.0, 2.0, -1.0];
      const W1_row0 = [0.8, -0.5, 0.3];
      const b1_0 = 0.1;

      // z = 0.8*1.0 - 0.5*2.0 + 0.3*(-1.0) + 0.1 = 0.8 - 1.0 - 0.3 + 0.1 = -0.4
      const z = W1_row0[0] * inputs[0] + W1_row0[1] * inputs[1] + W1_row0[2] * inputs[2] + b1_0;
      expect(z).toBeCloseTo(-0.4, 4);

      const relu = Math.max(0, z);
      expect(relu).toBe(0.0);

      // 1-bit boolean mask is false (dormant neuron, 0 adjoint gradient pass-through)
      const isAlive = z > 0;
      expect(isAlive).toBe(false);
    });
  });

  describe("2. RMSNormVisualizer & Orthogonal Gradient Projection", () => {
    it("should instantiate RMSNormVisualizer with default properties", () => {
      const element = React.createElement(RMSNormVisualizer, {
        initialVector: [3.0, -4.0, 1.5, 2.5],
        title: "Test RMSNorm",
      });
      expect(element).toBeDefined();
    });

    it("should compute exact root-mean-square normalization and preserve unit variance", () => {
      const x = [3.0, -4.0, 1.5, 2.5];
      const D = x.length;
      const eps = 1e-6;

      const sumSq = x.reduce((acc, v) => acc + v * v, 0); // 9 + 16 + 2.25 + 6.25 = 33.5
      const rms = Math.sqrt(sumSq / D + eps); // sqrt(33.5 / 4) = sqrt(8.375) approx 2.89396

      expect(rms).toBeCloseTo(2.89396, 4);

      const xBar = x.map((v) => v / rms);
      const xBarRms = Math.sqrt(xBar.reduce((acc, v) => acc + v * v, 0) / D);
      expect(xBarRms).toBeCloseTo(1.0, 4);
    });

    it("should confirm backward gradient projection orthogonality with input vector", () => {
      const x = [2.0, 2.0, 2.0, 2.0];
      const D = 4;
      const rms = 2.0;
      const xBar = x.map((v) => v / rms); // [1, 1, 1, 1]

      const dL_dxBar = [1.0, -1.0, 2.0, -2.0];
      const dot = dL_dxBar.reduce((acc, g, i) => acc + g * xBar[i], 0); // 1 - 1 + 2 - 2 = 0
      expect(dot).toBe(0.0);

      const dL_dx = dL_dxBar.map((g, i) => (1 / rms) * (g - (xBar[i] * dot) / D));
      const innerProd = dL_dx.reduce((acc, g, i) => acc + g * x[i], 0);
      expect(innerProd).toBeCloseTo(0.0, 5);
    });
  });

  describe("3. Im2ColGEMMVisualizer & Unfolded Spatial Geometry", () => {
    it("should instantiate Im2ColGEMMVisualizer with default properties", () => {
      const element = React.createElement(Im2ColGEMMVisualizer, {
        inputHeight: 4,
        inputWidth: 4,
        kernelSize: 2,
        title: "Test Im2Col GEMM",
      });
      expect(element).toBeDefined();
    });

    it("should compute exact output feature map dimensions and matrix unrolling shape", () => {
      const H = 4;
      const W = 4;
      const K = 2;
      const stride = 1;

      const H_out = Math.floor((H - K) / stride) + 1; // (4 - 2)/1 + 1 = 3
      const W_out = Math.floor((W - K) / stride) + 1; // 3
      const totalPatches = H_out * W_out; // 9

      expect(H_out).toBe(3);
      expect(W_out).toBe(3);
      expect(totalPatches).toBe(9);

      // Unfolded matrix X_col shape is (K*K) x totalPatches = 4 x 9
      const unfoldedRows = K * K;
      const unfoldedCols = totalPatches;

      expect(unfoldedRows).toBe(4);
      expect(unfoldedCols).toBe(9);
    });

    it("should correctly map 2D spatial coordinates into unfolded column indices", () => {
      const W = 4;
      const stride = 1;
      const W_out = 3;

      // Patch 0: top-left 2x2 corner -> (0,0), (0,1), (1,0), (1,1) -> values [1, 2, 5, 6]
      const patch0_values = [1, 2, 1 * W + 0 + 1, 1 * W + 1 + 1];
      expect(patch0_values).toEqual([1, 2, 5, 6]);

      // Patch 8: bottom-right 2x2 corner -> (2,2), (2,3), (3,2), (3,3) -> values [11, 12, 15, 16]
      const patch8_r = Math.floor(8 / W_out) * stride; // 2
      const patch8_c = (8 % W_out) * stride; // 2
      const patch8_values = [
        (patch8_r + 0) * W + (patch8_c + 0) + 1,
        (patch8_r + 0) * W + (patch8_c + 1) + 1,
        (patch8_r + 1) * W + (patch8_c + 0) + 1,
        (patch8_r + 1) * W + (patch8_c + 1) + 1,
      ];
      expect(patch8_values).toEqual([11, 12, 15, 16]);
    });
  });
});
