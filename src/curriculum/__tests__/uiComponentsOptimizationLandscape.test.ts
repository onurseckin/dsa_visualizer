import { describe, expect, it } from "bun:test";
import React from "react";
import {
  OptimizationLandscapeStudio,
  OPTIMIZATION_LANDSCAPES,
  OPTIMIZER_CONFIGS,
  computeNumericalGradient,
  computeNumericalHessian,
  compute2x2SymmetricEigen,
  simulateOptimizerStep,
  simulateFullTrajectory,
  simulateAllOptimizers,
  type LandscapeId,
  type OptimizerId,
  type Vector2D,
  type Matrix2x2,
} from "../../components/primitives/OptimizationLandscapeStudio";

describe("OptimizationLandscapeStudio & Loss Landscape Optimization Engine", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & LIFECYCLE
  // ==========================================================================
  describe("1. Component Instantiation & Props Configuration", () => {
    it("should instantiate OptimizationLandscapeStudio with default props", () => {
      const element = React.createElement(OptimizationLandscapeStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(OptimizationLandscapeStudio);
    });

    it("should instantiate with custom landscape, view mode, start point, and callbacks", () => {
      const onLandscapeChangeMock = () => {};
      const onStepChangeMock = () => {};
      const onSimulationCompleteMock = () => {};

      const element = React.createElement(OptimizationLandscapeStudio, {
        initialLandscape: "beale",
        initialStartPoint: [2.0, 1.5],
        initialOptimizers: ["adam", "momentum", "newton_cg"],
        initialMaxSteps: 150,
        initialTolerance: 1e-5,
        initialViewMode: "surface_3d",
        width: 1024,
        height: 640,
        standalone: true,
        title: "Beale Surface 3D Optimization Comparator",
        onLandscapeChange: onLandscapeChangeMock,
        onStepChange: onStepChangeMock,
        onSimulationComplete: onSimulationCompleteMock,
      });

      expect(element.props.initialLandscape).toBe("beale");
      expect(element.props.initialStartPoint).toEqual([2.0, 1.5]);
      expect(element.props.initialOptimizers).toEqual(["adam", "momentum", "newton_cg"]);
      expect(element.props.initialMaxSteps).toBe(150);
      expect(element.props.initialTolerance).toBe(1e-5);
      expect(element.props.initialViewMode).toBe("surface_3d");
      expect(element.props.width).toBe(1024);
      expect(element.props.height).toBe(640);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Beale Surface 3D Optimization Comparator");
    });

    it("should provide valid landscape structures for all 6 benchmark landscapes", () => {
      const landscapeIds: LandscapeId[] = [
        "rosenbrock",
        "beale",
        "monkey_saddle",
        "rastrigin",
        "ill_conditioned_quadratic",
        "ackley",
      ];

      for (const id of landscapeIds) {
        const def = OPTIMIZATION_LANDSCAPES[id];
        expect(def).toBeDefined();
        expect(def.id).toBe(id);
        expect(def.name).toBeDefined();
        expect(def.category).toBeDefined();
        expect(def.formulaTeX).toBeDefined();
        expect(def.domain).toBeDefined();
        expect(def.domain.xMin).toBeLessThan(def.domain.xMax);
        expect(def.domain.yMin).toBeLessThan(def.domain.yMax);
        expect(def.globalMinimum).toBeDefined();
        expect(def.defaultStartPoint.length).toBe(2);
        expect(def.alternativeStartPoints.length).toBeGreaterThanOrEqual(2);
        expect(def.description).toBeDefined();
        expect(def.educationalNotes).toBeDefined();
        expect(def.defaultStepSize).toBeGreaterThan(0);
        expect(typeof def.fn).toBe("function");
        expect(typeof def.grad).toBe("function");
        expect(typeof def.hessian).toBe("function");
      }
    });

    it("should provide valid optimizer configs for all 6 optimizer algorithms", () => {
      const optimizerIds: OptimizerId[] = [
        "sgd",
        "momentum",
        "rmsprop",
        "adam",
        "adamw",
        "newton_cg",
      ];

      for (const id of optimizerIds) {
        const config = OPTIMIZER_CONFIGS[id];
        expect(config).toBeDefined();
        expect(config.id).toBe(id);
        expect(config.name).toBeDefined();
        expect(config.shortName).toBeDefined();
        expect(config.hexColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(config.formulaTeX).toBeDefined();
        expect(config.description).toBeDefined();
        expect(config.defaultHyperparameters.learningRate).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // 2. MATHEMATICAL LANDSCAPE DEFINITIONS & CRITICAL VALUES
  // ==========================================================================
  describe("2. Mathematical Landscapes & Critical Point Validation", () => {
    it("should evaluate exact global minima for all benchmark landscapes", () => {
      // 1. Rosenbrock at (1, 1) -> f = 0
      const rb = OPTIMIZATION_LANDSCAPES.rosenbrock;
      expect(rb.fn(1, 1)).toBeCloseTo(0, 10);

      // 2. Beale at (3, 0.5) -> f = 0
      const beale = OPTIMIZATION_LANDSCAPES.beale;
      expect(beale.fn(3, 0.5)).toBeCloseTo(0, 10);

      // 3. Monkey Saddle at (0, 0) -> f = 0
      const monkey = OPTIMIZATION_LANDSCAPES.monkey_saddle;
      expect(monkey.fn(0, 0)).toBeCloseTo(0, 10);

      // 4. Rastrigin at (0, 0) -> f = 0
      const rast = OPTIMIZATION_LANDSCAPES.rastrigin;
      expect(rast.fn(0, 0)).toBeCloseTo(0, 10);

      // 5. Ill-Conditioned Quadratic at (0, 0) -> f = 0
      const quad = OPTIMIZATION_LANDSCAPES.ill_conditioned_quadratic;
      expect(quad.fn(0, 0)).toBeCloseTo(0, 10);

      // 6. Ackley at (0, 0) -> f = 0
      const ackley = OPTIMIZATION_LANDSCAPES.ackley;
      expect(ackley.fn(0, 0)).toBeCloseTo(0, 10);
    });

    it("should verify stationary zero gradients at the global minima / saddle points", () => {
      const rbGrad = OPTIMIZATION_LANDSCAPES.rosenbrock.grad(1, 1);
      expect(Math.hypot(rbGrad[0], rbGrad[1])).toBeCloseTo(0, 10);

      const bealeGrad = OPTIMIZATION_LANDSCAPES.beale.grad(3, 0.5);
      expect(Math.hypot(bealeGrad[0], bealeGrad[1])).toBeCloseTo(0, 10);

      const monkeyGrad = OPTIMIZATION_LANDSCAPES.monkey_saddle.grad(0, 0);
      expect(Math.hypot(monkeyGrad[0], monkeyGrad[1])).toBeCloseTo(0, 10);

      const rastGrad = OPTIMIZATION_LANDSCAPES.rastrigin.grad(0, 0);
      expect(Math.hypot(rastGrad[0], rastGrad[1])).toBeCloseTo(0, 10);

      const quadGrad = OPTIMIZATION_LANDSCAPES.ill_conditioned_quadratic.grad(0, 0);
      expect(Math.hypot(quadGrad[0], quadGrad[1])).toBeCloseTo(0, 10);

      const ackleyGrad = OPTIMIZATION_LANDSCAPES.ackley.grad(0, 0);
      expect(Math.hypot(ackleyGrad[0], ackleyGrad[1])).toBeCloseTo(0, 10);
    });
  });

  // ==========================================================================
  // 3. EXACT ANALYTICAL VS FINITE DIFFERENCE GRADIENTS & HESSIANS
  // ==========================================================================
  describe("3. Gradient & Hessian Exactness vs Finite Difference", () => {
    it("should match analytical gradients with central finite difference (< 1e-4 relative error)", () => {
      const testCases: { id: LandscapeId; points: Vector2D[] }[] = [
        {
          id: "rosenbrock",
          points: [
            [1.0, 1.0],
            [-1.2, 1.0],
            [0.5, -0.5],
            [1.5, 2.0],
          ],
        },
        {
          id: "beale",
          points: [
            [3.0, 0.5],
            [1.0, 1.0],
            [-2.0, 2.0],
            [0.0, 0.0],
          ],
        },
        {
          id: "monkey_saddle",
          points: [
            [0.0, 0.0],
            [1.2, -0.5],
            [-1.0, 1.2],
            [0.5, 0.5],
          ],
        },
        {
          id: "rastrigin",
          points: [
            [0.0, 0.0],
            [1.2, -0.8],
            [0.5, 0.5],
            [-2.5, 3.0],
          ],
        },
        {
          id: "ill_conditioned_quadratic",
          points: [
            [0.0, 0.0],
            [1.8, 3.5],
            [-1.5, -3.0],
            [0.5, -2.0],
          ],
        },
        {
          id: "ackley",
          points: [
            [1.2, -0.8],
            [2.0, 2.0],
            [-3.0, 1.5],
          ],
        },
      ];

      for (const tc of testCases) {
        const land = OPTIMIZATION_LANDSCAPES[tc.id];
        for (const [x, y] of tc.points) {
          const exactGrad = land.grad(x, y);
          const numGrad = computeNumericalGradient(land.fn, x, y, 1e-5);
          const gradError = Math.hypot(exactGrad[0] - numGrad[0], exactGrad[1] - numGrad[1]);

          expect(gradError).toBeLessThan(1e-4);
        }
      }
    });

    it("should match analytical Hessians with central finite difference (< 1e-3 error)", () => {
      const testCases: { id: LandscapeId; points: Vector2D[] }[] = [
        {
          id: "rosenbrock",
          points: [
            [1.0, 1.0],
            [-1.2, 1.0],
            [0.5, -0.5],
          ],
        },
        {
          id: "beale",
          points: [
            [3.0, 0.5],
            [1.0, 1.0],
            [-1.0, 2.0],
          ],
        },
        {
          id: "monkey_saddle",
          points: [
            [0.0, 0.0],
            [1.5, -0.5],
            [-1.0, 1.2],
          ],
        },
        {
          id: "rastrigin",
          points: [
            [0.0, 0.0],
            [1.2, -0.8],
            [0.5, 0.5],
          ],
        },
        {
          id: "ill_conditioned_quadratic",
          points: [
            [0.0, 0.0],
            [2.0, -3.0],
            [-1.5, 4.0],
          ],
        },
        {
          id: "ackley",
          points: [
            [1.2, -0.8],
            [2.0, 2.0],
          ],
        },
      ];

      for (const tc of testCases) {
        const land = OPTIMIZATION_LANDSCAPES[tc.id];
        for (const [x, y] of tc.points) {
          const exactH = land.hessian(x, y);
          const numH = computeNumericalHessian(land.fn, x, y, 1e-4);

          const maxDiff = Math.max(
            Math.abs(exactH[0][0] - numH[0][0]),
            Math.abs(exactH[0][1] - numH[0][1]),
            Math.abs(exactH[1][0] - numH[1][0]),
            Math.abs(exactH[1][1] - numH[1][1]),
          );

          expect(maxDiff).toBeLessThan(1e-3);
        }
      }
    });

    it("should accurately compute eigenvalues and condition numbers for symmetric Hessians", () => {
      // 1. Ill-conditioned quadratic has constant Hessian [[50, 0], [0, 1]]
      const HQuad: Matrix2x2 = [
        [50, 0],
        [0, 1],
      ];
      const eigenQuad = compute2x2SymmetricEigen(HQuad);
      expect(eigenQuad.lambda1).toBe(50);
      expect(eigenQuad.lambda2).toBe(1);
      expect(eigenQuad.conditionNumber).toBeCloseTo(50.0, 6);
      expect(eigenQuad.curvatureType).toBe("minimum");

      // 2. Monkey Saddle at (0, 0) has zero Hessian
      const HMonkey: Matrix2x2 = [
        [0, 0],
        [0, 0],
      ];
      const eigenMonkey = compute2x2SymmetricEigen(HMonkey);
      expect(eigenMonkey.lambda1).toBe(0);
      expect(eigenMonkey.lambda2).toBe(0);
      expect(eigenMonkey.curvatureType).toBe("degenerate");

      // 3. Saddle with positive & negative eigenvalues
      const HSaddle: Matrix2x2 = [
        [3, 0],
        [0, -2],
      ];
      const eigenSaddle = compute2x2SymmetricEigen(HSaddle);
      expect(eigenSaddle.lambda1).toBe(3);
      expect(eigenSaddle.lambda2).toBe(-2);
      expect(eigenSaddle.curvatureType).toBe("saddle");
      expect(eigenSaddle.conditionNumber).toBeCloseTo(1.5, 6);

      // 4. Concave Maximum (negative definite)
      const HMax: Matrix2x2 = [
        [-4, 0],
        [0, -6],
      ];
      const eigenMax = compute2x2SymmetricEigen(HMax);
      expect(eigenMax.curvatureType).toBe("maximum");
    });
  });

  // ==========================================================================
  // 4. OPTIMIZER ALGORITHM MECHANICS & SINGLE STEP TESTS
  // ==========================================================================
  describe("4. Optimizer Algorithm Mathematical Step Updates", () => {
    it("should compute exact SGD step: θ_1 = θ_0 - α g_0", () => {
      const point: Vector2D = [2.0, 3.0];
      const grad: Vector2D = [0.4, -0.6];
      const hess: Matrix2x2 = [
        [1, 0],
        [0, 1],
      ];
      const update = simulateOptimizerStep(
        "sgd",
        point,
        grad,
        hess,
        { t: 0 },
        { learningRate: 0.1 },
      );

      expect(update.nextPoint[0]).toBeCloseTo(2.0 - 0.1 * 0.4, 8);
      expect(update.nextPoint[1]).toBeCloseTo(3.0 - 0.1 * -0.6, 8);
      expect(update.nextState.t).toBe(1);
    });

    it("should compute Momentum velocity accumulation and damping across 2 steps", () => {
      const alpha = 0.1;
      const beta1 = 0.9;
      const p0: Vector2D = [0.0, 0.0];
      const g0: Vector2D = [1.0, 2.0];
      const hess: Matrix2x2 = [
        [1, 0],
        [0, 1],
      ];

      // Step 1: v_1 = alpha * g_0, p_1 = p_0 - v_1
      const step1 = simulateOptimizerStep(
        "momentum",
        p0,
        g0,
        hess,
        { t: 0 },
        { learningRate: alpha, momentumBeta1: beta1 },
      );
      expect(step1.nextState.v).toEqual([0.1 * 1.0, 0.1 * 2.0]);
      expect(step1.nextPoint[0]).toBeCloseTo(-0.1, 8);
      expect(step1.nextPoint[1]).toBeCloseTo(-0.2, 8);

      // Step 2: v_2 = beta1 * v_1 + alpha * g_1
      const g1: Vector2D = [1.0, -2.0]; // Oscillating in y
      const step2 = simulateOptimizerStep("momentum", step1.nextPoint, g1, hess, step1.nextState, {
        learningRate: alpha,
        momentumBeta1: beta1,
      });

      const expectedV2X = 0.9 * 0.1 + 0.1 * 1.0; // 0.09 + 0.1 = 0.19
      const expectedV2Y = 0.9 * 0.2 + 0.1 * -2.0; // 0.18 - 0.2 = -0.02 (damped y!)
      expect(step2.nextState.v?.[0]).toBeCloseTo(expectedV2X, 8);
      expect(step2.nextState.v?.[1]).toBeCloseTo(expectedV2Y, 8);
      expect(step2.nextPoint[0]).toBeCloseTo(-0.1 - expectedV2X, 8);
      expect(step2.nextPoint[1]).toBeCloseTo(-0.2 - expectedV2Y, 8);
    });

    it("should compute RMSprop second-moment scaling: s_1 = (1-β₂) g_0², θ_1 = θ_0 - (α/√(s_1)+ε) g_0", () => {
      const alpha = 0.01;
      const beta2 = 0.9;
      const eps = 1e-8;
      const p0: Vector2D = [1.0, 1.0];
      const g0: Vector2D = [2.0, 0.5];
      const hess: Matrix2x2 = [
        [1, 0],
        [0, 1],
      ];

      const step1 = simulateOptimizerStep(
        "rmsprop",
        p0,
        g0,
        hess,
        { t: 0 },
        { learningRate: alpha, rmspropBeta2: beta2, epsilon: eps },
      );

      const s1X = (1 - beta2) * 2.0 * 2.0; // 0.1 * 4 = 0.4
      const s1Y = (1 - beta2) * 0.5 * 0.5; // 0.1 * 0.25 = 0.025

      expect(step1.nextState.s?.[0]).toBeCloseTo(s1X, 8);
      expect(step1.nextState.s?.[1]).toBeCloseTo(s1Y, 8);
      expect(step1.nextPoint[0]).toBeCloseTo(1.0 - (alpha / (Math.sqrt(s1X) + eps)) * 2.0, 8);
      expect(step1.nextPoint[1]).toBeCloseTo(1.0 - (alpha / (Math.sqrt(s1Y) + eps)) * 0.5, 8);
    });

    it("should apply Adam bias correction at step 1 and step t", () => {
      const alpha = 0.01;
      const beta1 = 0.9;
      const beta2 = 0.999;
      const eps = 1e-8;
      const p0: Vector2D = [0.0, 0.0];
      const g0: Vector2D = [1.0, 1.0];
      const hess: Matrix2x2 = [
        [1, 0],
        [0, 1],
      ];

      const step1 = simulateOptimizerStep(
        "adam",
        p0,
        g0,
        hess,
        { t: 0 },
        { learningRate: alpha, adamBeta1: beta1, adamBeta2: beta2, epsilon: eps },
      );

      // m1 = (1 - 0.9) * 1.0 = 0.1
      // v1 = (1 - 0.999) * 1.0 = 0.001
      // mHat1 = 0.1 / (1 - 0.9^1) = 0.1 / 0.1 = 1.0
      // vHat1 = 0.001 / (1 - 0.999^1) = 0.001 / 0.001 = 1.0
      // step = alpha * (1.0 / (sqrt(1.0) + eps)) = alpha = 0.01
      expect(step1.nextPoint[0]).toBeCloseTo(-alpha, 6);
      expect(step1.nextPoint[1]).toBeCloseTo(-alpha, 6);
    });

    it("should verify AdamW decoupled weight decay applies independently of gradients", () => {
      const alpha = 0.1;
      const lambda = 0.05;
      const p0: Vector2D = [2.0, 4.0];
      const gZero: Vector2D = [0.0, 0.0];
      const hess: Matrix2x2 = [
        [1, 0],
        [0, 1],
      ];

      // Adam with zero gradient does not decay parameters
      const adamStep = simulateOptimizerStep(
        "adam",
        p0,
        gZero,
        hess,
        { t: 0 },
        { learningRate: alpha },
      );
      expect(adamStep.nextPoint[0]).toBeCloseTo(2.0, 8);
      expect(adamStep.nextPoint[1]).toBeCloseTo(4.0, 8);

      // AdamW decays parameters by (1 - alpha * lambda) directly
      const adamWStep = simulateOptimizerStep(
        "adamw",
        p0,
        gZero,
        hess,
        { t: 0 },
        { learningRate: alpha, weightDecay: lambda },
      );
      expect(adamWStep.nextPoint[0]).toBeCloseTo(2.0 * (1 - 0.1 * 0.05), 8);
      expect(adamWStep.nextPoint[1]).toBeCloseTo(4.0 * (1 - 0.1 * 0.05), 8);
    });

    it("should verify Newton-CG exact 1-step convergence on quadratic surface", () => {
      const p0: Vector2D = [1.8, -3.5];
      const quadDef = OPTIMIZATION_LANDSCAPES.ill_conditioned_quadratic;
      const g0 = quadDef.grad(p0[0], p0[1]);
      const H = quadDef.hessian(p0[0], p0[1]);

      const step1 = simulateOptimizerStep(
        "newton_cg",
        p0,
        g0,
        H,
        { t: 0 },
        { learningRate: 1.0, newtonDamping: 0.0 },
      );

      // Global min of quadratic is (0, 0)
      expect(step1.nextPoint[0]).toBeCloseTo(0.0, 8);
      expect(step1.nextPoint[1]).toBeCloseTo(0.0, 8);
      expect(quadDef.fn(step1.nextPoint[0], step1.nextPoint[1])).toBeCloseTo(0.0, 10);
    });
  });

  // ==========================================================================
  // 5. TRAJECTORY SIMULATION & CONVERGENCE METRICS
  // ==========================================================================
  describe("5. Trajectory Simulation & Convergence Analytics", () => {
    it("should simulate full trajectory on Ill-Conditioned Quadratic and verify Newton 1-step vs SGD oscillation", () => {
      const start: Vector2D = [1.5, 3.0];
      const maxSteps = 50;

      // Newton
      const newtonTraj = simulateFullTrajectory(
        "ill_conditioned_quadratic",
        "newton_cg",
        start,
        maxSteps,
        { learningRate: 1.0, newtonDamping: 0.0 },
        1e-5,
      );

      expect(newtonTraj.converged).toBe(true);
      expect(newtonTraj.stepsToThreshold).toBe(1);
      expect(newtonTraj.finalLoss).toBeCloseTo(0.0, 8);
      expect(newtonTraj.tortuosity).toBeCloseTo(1.0, 4);

      // SGD with learning rate 0.015
      const sgdTraj = simulateFullTrajectory(
        "ill_conditioned_quadratic",
        "sgd",
        start,
        maxSteps,
        { learningRate: 0.015 },
        1e-5,
      );

      expect(sgdTraj.points.length).toBe(maxSteps + 1);
      expect(sgdTraj.totalPathLength).toBeGreaterThan(0);
      expect(sgdTraj.tortuosity).toBeGreaterThan(1.0);
    });

    it("should simulate multi-optimizer bundle on Rosenbrock Banana Valley", () => {
      const start: Vector2D = [-1.2, 1.0];
      const activeOpts: OptimizerId[] = [
        "sgd",
        "momentum",
        "rmsprop",
        "adam",
        "adamw",
        "newton_cg",
      ];

      const results = simulateAllOptimizers("rosenbrock", activeOpts, start, 80, {}, 1e-4);

      for (const optId of activeOpts) {
        const traj = results[optId];
        expect(traj).toBeDefined();
        expect(traj.optimizerId).toBe(optId);
        expect(traj.points.length).toBeGreaterThan(10);
        expect(Number.isFinite(traj.finalLoss)).toBe(true);
        expect(traj.totalPathLength).toBeGreaterThan(0);
        expect(traj.tortuosity).toBeGreaterThanOrEqual(1.0);
      }
    });

    it("should track metrics consistency: path distance summation and tortuosity bounds", () => {
      const traj = simulateFullTrajectory(
        "rastrigin",
        "adam",
        [2.0, 2.0],
        40,
        { learningRate: 0.05 },
        1e-4,
      );

      let sumDist = 0;
      for (let i = 1; i < traj.points.length; i++) {
        const prev = traj.points[i - 1].point;
        const cur = traj.points[i].point;
        sumDist += Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
      }

      expect(traj.totalPathLength).toBeCloseTo(sumDist, 8);
      expect(traj.euclideanDistance).toBeLessThanOrEqual(traj.totalPathLength + 1e-6);
      expect(traj.tortuosity).toBeGreaterThanOrEqual(1.0);
    });

    it("should handle divergence safely without NaN or crash", () => {
      // Extremely high learning rate to trigger divergence
      const divTraj = simulateFullTrajectory(
        "rosenbrock",
        "sgd",
        [-1.2, 1.0],
        50,
        { learningRate: 10.0 }, // Overly aggressive LR
      );

      expect(divTraj.diverged).toBe(true);
      expect(divTraj.points.length).toBeLessThanOrEqual(51);
    });
  });
});
