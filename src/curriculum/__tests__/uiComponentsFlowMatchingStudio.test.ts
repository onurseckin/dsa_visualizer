import { describe, it, expect } from "bun:test";
import React from "react";
import {
  FlowMatchingStudio,
  SeededRNG,
  norm2D,
  normSq2D,
  dist2D,
  distSq2D,
  add2D,
  sub2D,
  scale2D,
  lerp2D,
  dot2D,
  normalize2D,
  generateFlowDataset,
  computeLinearPathPoint,
  computeConditionalTargetVelocity,
  computeIndependentCoupling,
  computeHungarianOTCoupling,
  computeSinkhornOTCoupling,
  computeTransportCost,
  computeTrajectoryStraightness,
  computeMarginalVectorField,
  computeAnalyticalDivergence,
  computeVectorFieldGrid,
  eulerStep,
  midpointStep,
  rk4Step,
  integrateODE,
  runODEBenchmark,
  solveHungarian,
  solveSinkhorn,
  doLineSegmentsIntersect,
  countLineCrossings,
  odeStepEuler,
  odeStepMidpoint,
  odeStepRK4,
  stepODE,
  integrateTrajectory,
  computeConditionalVelocity,
  computeMarginalVelocity,
  computeVectorFieldDivergence,
  computeW2Cost,
  computeStraightness,
  computeCurvature,
  computeODEBenchmark,
  FLOW_MATCHING_PRESETS,
  FLOW_MATCHING_STUDIO_PRESETS,
  CLASS_PALETTE,
  DEFAULT_VIEW_BOUNDS,
  type FlowDatasetId,
  type Vector2,
} from "../../components/primitives/FlowMatchingStudio";

// ============================================================================
// 1. COMPONENT INSTANTIATION & PROPS TESTS
// ============================================================================

describe("Flow Matching & Optimal Transport Studio - Component Structure", () => {
  it("should create React element with default configuration", () => {
    const element = React.createElement(FlowMatchingStudio, {});
    expect(element).toBeDefined();
    expect(element.type).toBe(FlowMatchingStudio);
    expect(element.props).toEqual({});
  });

  it("should create React element with custom props", () => {
    const onStepChange = () => {};
    const element = React.createElement(FlowMatchingStudio, {
      initialPreset: "ot_flow_swiss_roll_rk4",
      initialSourceDataset: "gaussian",
      initialTargetDataset: "swiss_roll",
      initialCoupling: "optimal_transport",
      initialSolver: "rk4",
      initialSteps: 40,
      seed: 12345,
      onStepChange,
      className: "custom-flow-studio",
    });

    expect(element.props.initialPreset).toBe("ot_flow_swiss_roll_rk4");
    expect(element.props.initialSourceDataset).toBe("gaussian");
    expect(element.props.initialTargetDataset).toBe("swiss_roll");
    expect(element.props.initialCoupling).toBe("optimal_transport");
    expect(element.props.initialSolver).toBe("rk4");
    expect(element.props.initialSteps).toBe(40);
    expect(element.props.seed).toBe(12345);
    expect(element.props.className).toBe("custom-flow-studio");
  });
});

// ============================================================================
// 2. PRNG & VECTOR UTILITIES TESTS
// ============================================================================

describe("Deterministic PRNG & 2D Vector Math", () => {
  it("should produce reproducible pseudo-random numbers with fixed seed", () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);

    for (let i = 0; i < 20; i++) {
      expect(rng1.next()).toBeCloseTo(rng2.next(), 8);
    }
  });

  it("should generate Gaussian distribution samples with approximately zero mean and unit variance", () => {
    const rng = new SeededRNG(12345);
    const N = 5000;
    let sum = 0;
    let sumSq = 0;

    for (let i = 0; i < N; i++) {
      const g = rng.nextGaussian(0, 1);
      sum += g;
      sumSq += g * g;
    }

    const mean = sum / N;
    const variance = sumSq / N - mean * mean;
    expect(Math.abs(mean)).toBeLessThan(0.08);
    expect(Math.abs(variance - 1)).toBeLessThan(0.12);
  });

  it("should support helper methods: nextInt, choice, shuffle", () => {
    const rng = new SeededRNG(999);
    const val = rng.nextInt(1, 10);
    expect(val).toBeGreaterThanOrEqual(1);
    expect(val).toBeLessThanOrEqual(10);

    const items = ["a", "b", "c", "d"];
    const chosen = rng.choice(items);
    expect(items).toContain(chosen);

    const shuffled = rng.shuffle([1, 2, 3, 4, 5]);
    expect(shuffled).toHaveLength(5);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("should perform basic 2D vector operations correctly", () => {
    const a: Vector2 = [3, 4];
    const b: Vector2 = [1, 2];

    expect(add2D(a, b)).toEqual([4, 6]);
    expect(sub2D(a, b)).toEqual([2, 2]);
    expect(scale2D(a, 2)).toEqual([6, 8]);
    expect(lerp2D(a, b, 0.5)).toEqual([2, 3]);
    expect(dot2D(a, b)).toBe(11);
    expect(normSq2D(a)).toBe(25);
    expect(norm2D(a)).toBe(5);
    expect(distSq2D(a, b)).toBe(8);
    expect(dist2D(a, b)).toBeCloseTo(Math.sqrt(8), 6);

    const normA = normalize2D(a);
    expect(normA[0]).toBeCloseTo(0.6, 6);
    expect(normA[1]).toBeCloseTo(0.8, 6);
    expect(norm2D(normA)).toBeCloseTo(1, 6);
    expect(normalize2D([0, 0])).toEqual([0, 0]);
  });

  it("should export valid DEFAULT_VIEW_BOUNDS and CLASS_PALETTE constants", () => {
    expect(DEFAULT_VIEW_BOUNDS).toEqual([-3.5, 3.5, -3.5, 3.5]);
    expect(CLASS_PALETTE.length).toBeGreaterThanOrEqual(6);
  });
});

// ============================================================================
// 3. 2D DATASET GENERATORS TESTS
// ============================================================================

describe("2D Flow Matching Datasets", () => {
  const datasets: FlowDatasetId[] = [
    "gaussian",
    "swiss_roll",
    "eight_gaussians",
    "two_moons",
    "concentric_rings",
    "pinwheel",
    "four_corners",
  ];

  datasets.forEach((ds) => {
    it(`should generate valid points for dataset '${ds}'`, () => {
      const rng = new SeededRNG(101);
      const count = 40;
      const points = generateFlowDataset(ds, count, rng);

      expect(points.length).toBe(count);
      points.forEach((p, idx) => {
        expect(p.id).toBe(idx);
        expect(p.point.length).toBe(2);
        expect(Number.isFinite(p.point[0])).toBe(true);
        expect(Number.isFinite(p.point[1])).toBe(true);
        expect(typeof p.classLabel).toBe("number");
        expect(p.color).toBeDefined();
      });
    });
  });

  it("should have 8 distinct modes for eight_gaussians dataset", () => {
    const rng = new SeededRNG(42);
    const points = generateFlowDataset("eight_gaussians", 64, rng, 0.0);
    const labels = new Set(points.map((p) => p.classLabel));
    expect(labels.size).toBe(8);
  });

  it("should have 4 distinct modes for four_corners dataset", () => {
    const rng = new SeededRNG(42);
    const points = generateFlowDataset("four_corners", 40, rng, 0.0);
    const labels = new Set(points.map((p) => p.classLabel));
    expect(labels.size).toBe(4);
  });
});

// ============================================================================
// 4. LINEAR PROBABILITY PATHS & TARGET CONDITIONAL VELOCITIES
// ============================================================================

describe("Probability Paths & Conditional Velocities", () => {
  it("should satisfy boundary conditions of linear probability path", () => {
    const x0: Vector2 = [1, 2];
    const x1: Vector2 = [5, 8];
    const sigmaMin = 1e-4;

    const pathAt0 = computeLinearPathPoint(x0, x1, 0, sigmaMin);
    expect(pathAt0[0]).toBeCloseTo(x0[0], 5);
    expect(pathAt0[1]).toBeCloseTo(x0[1], 5);

    const pathAt1 = computeLinearPathPoint(x0, x1, 1, sigmaMin);
    expect(pathAt1[0]).toBeCloseTo(x1[0] + sigmaMin * x0[0], 5);
    expect(pathAt1[1]).toBeCloseTo(x1[1] + sigmaMin * x0[1], 5);

    const pathAtMid = computeLinearPathPoint(x0, x1, 0.5, 0.0);
    expect(pathAtMid[0]).toBeCloseTo(3, 5);
    expect(pathAtMid[1]).toBeCloseTo(5, 5);
  });

  it("should compute target conditional velocity u_t = x_1 - (1 - sigmaMin) * x_0", () => {
    const x0: Vector2 = [2, 3];
    const x1: Vector2 = [6, 7];

    const uT = computeConditionalTargetVelocity(x0, x1, 0.0);
    expect(uT[0]).toBeCloseTo(4, 5);
    expect(uT[1]).toBeCloseTo(4, 5);

    expect(computeConditionalVelocity(x0, x1)).toEqual([4, 4]);
  });
});

// ============================================================================
// 5. COUPLINGS & OPTIMAL TRANSPORT TESTS
// ============================================================================

describe("Optimal Transport vs Independent Couplings", () => {
  it("should compute Hungarian optimal transport bipartite matching", () => {
    const rng = new SeededRNG(42);
    const src = generateFlowDataset("gaussian", 20, rng);
    const tgt = generateFlowDataset("eight_gaussians", 20, rng);

    const otPairs = computeHungarianOTCoupling(src, tgt);
    const indepPairs = computeIndependentCoupling(src, tgt, rng);

    expect(otPairs.length).toBe(20);
    expect(indepPairs.length).toBe(20);

    const otCost = computeTransportCost(otPairs);
    const indepCost = computeTransportCost(indepPairs);

    // OT cost must be strictly less than or equal to Independent cost
    expect(otCost).toBeLessThanOrEqual(indepCost);
    expect(computeW2Cost(otPairs)).toBeCloseTo(Math.sqrt(otCost), 6);
  });

  it("should compute Entropic Regularized Sinkhorn transport", () => {
    const rng = new SeededRNG(1337);
    const src = generateFlowDataset("two_moons", 15, rng);
    const tgt = generateFlowDataset("concentric_rings", 15, rng);

    const { pairs, plan } = computeSinkhornOTCoupling(src, tgt, 0.05, 50);
    expect(pairs.length).toBe(15);
    expect(plan.length).toBe(15);
    expect(plan[0].length).toBe(15);

    // Row sum of Sinkhorn transport plan (sums to 1/N for doubly stochastic OT plan)
    const rowSum = plan[0].reduce((s, p) => s + p, 0);
    expect(rowSum).toBeCloseTo(1 / 15, 2);
  });

  it("should compute standalone solveHungarian and solveSinkhorn functions", () => {
    const costMatrix = [
      [10, 1],
      [1, 10],
    ];
    const assignment = solveHungarian(costMatrix);
    expect(assignment).toEqual([1, 0]);

    const P = solveSinkhorn(costMatrix, 0.05, 100);
    expect(P.length).toBe(2);
    expect(P[0].length).toBe(2);
    expect(P[0][1]).toBeGreaterThan(P[0][0]);
  });

  it("should detect line crossings among coupled trajectories", () => {
    expect(doLineSegmentsIntersect([0, -1], [0, 1], [-1, 0], [1, 0])).toBe(true);
    expect(doLineSegmentsIntersect([0, 0], [1, 0], [0, 1], [1, 1])).toBe(false);

    const crossingPairs = [
      {
        source: { id: 0, point: [-1, -1] as Vector2, classLabel: 0 },
        target: { id: 0, point: [1, 1] as Vector2, classLabel: 0 },
        cost: 8,
      },
      {
        source: { id: 1, point: [-1, 1] as Vector2, classLabel: 0 },
        target: { id: 1, point: [1, -1] as Vector2, classLabel: 0 },
        cost: 8,
      },
    ];
    expect(countLineCrossings(crossingPairs)).toBe(1);
  });

  it("should compute trajectory curvature and straightness index correctly", () => {
    const straightTraj: Vector2[][] = [
      [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
    ];
    const straightMetrics = computeTrajectoryStraightness(straightTraj);
    expect(straightMetrics.meanCurvature).toBeCloseTo(0, 5);
    expect(straightMetrics.straightnessIndex).toBeCloseTo(1, 5);
    expect(computeStraightness(straightTraj[0])).toBeCloseTo(1, 5);
    expect(computeCurvature(straightTraj[0])).toBeCloseTo(0, 5);

    const curvedTraj: Vector2[][] = [
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
      ],
    ];
    const curvedMetrics = computeTrajectoryStraightness(curvedTraj);
    expect(curvedMetrics.meanCurvature).toBeGreaterThan(0);
    expect(curvedMetrics.straightnessIndex).toBeLessThan(1);
  });
});

// ============================================================================
// 6. CONTINUOUS VECTOR FIELD & DIVERGENCE TESTS
// ============================================================================

describe("Continuous Marginal Vector Field & Divergence", () => {
  it("should compute smooth marginal vector field with Log-Sum-Exp stabilization", () => {
    const rng = new SeededRNG(77);
    const src = generateFlowDataset("gaussian", 10, rng);
    const tgt = generateFlowDataset("swiss_roll", 10, rng);
    const pairs = computeHungarianOTCoupling(src, tgt);

    const vec0 = computeMarginalVectorField([0, 0], 0.0, pairs, 1e-4, 0.25);
    const vecMid = computeMarginalVectorField([0, 0], 0.5, pairs, 1e-4, 0.25);
    const vec1 = computeMarginalVectorField([0, 0], 1.0, pairs, 1e-4, 0.25);

    expect(Number.isFinite(vec0[0])).toBe(true);
    expect(Number.isFinite(vec0[1])).toBe(true);
    expect(Number.isFinite(vecMid[0])).toBe(true);
    expect(Number.isFinite(vecMid[1])).toBe(true);
    expect(Number.isFinite(vec1[0])).toBe(true);
    expect(Number.isFinite(vec1[1])).toBe(true);

    const aliasVec = computeMarginalVelocity([0, 0], 0.5, pairs, 1e-4, 0.25);
    expect(aliasVec).toEqual(vecMid);
  });

  it("should compute finite analytical divergence on vector field", () => {
    const rng = new SeededRNG(99);
    const src = generateFlowDataset("gaussian", 10, rng);
    const tgt = generateFlowDataset("four_corners", 10, rng);
    const pairs = computeHungarianOTCoupling(src, tgt);

    const div = computeAnalyticalDivergence([0, 0], 0.5, pairs, 1e-4, 0.25);
    expect(Number.isFinite(div)).toBe(true);

    const aliasDiv = computeVectorFieldDivergence([0, 0], 0.5, pairs, 1e-4, 0.25);
    expect(aliasDiv).toBeCloseTo(div, 6);
  });

  it("should generate spatial vector field grid with divergence values", () => {
    const rng = new SeededRNG(42);
    const src = generateFlowDataset("gaussian", 8, rng);
    const tgt = generateFlowDataset("pinwheel", 8, rng);
    const pairs = computeHungarianOTCoupling(src, tgt);

    const grid = computeVectorFieldGrid(5, 2.0, 0.5, pairs, 1e-4, 0.25);
    expect(grid.length).toBe(25);
    grid.forEach((cell) => {
      expect(Number.isFinite(cell.x)).toBe(true);
      expect(Number.isFinite(cell.y)).toBe(true);
      expect(Number.isFinite(cell.magnitude)).toBe(true);
      expect(Number.isFinite(cell.divergence)).toBe(true);
    });
  });
});

// ============================================================================
// 7. ODE NUMERICAL INTEGRATORS (EULER, MIDPOINT, RK4) TESTS
// ============================================================================

describe("Neural ODE Numerical Integrators", () => {
  const constVf = () => [1, 2] as Vector2;

  it("should solve constant vector field exactly across Euler, Midpoint, and RK4", () => {
    const x0: Vector2 = [0, 0];

    const eulerRes = integrateODE(x0, "euler", 10, constVf, 0, 1);
    const midRes = integrateODE(x0, "midpoint", 10, constVf, 0, 1);
    const rk4Res = integrateODE(x0, "rk4", 10, constVf, 0, 1);

    expect(eulerRes.trajectory[10][0]).toBeCloseTo(1, 6);
    expect(eulerRes.trajectory[10][1]).toBeCloseTo(2, 6);
    expect(midRes.trajectory[10][0]).toBeCloseTo(1, 6);
    expect(midRes.trajectory[10][1]).toBeCloseTo(2, 6);
    expect(rk4Res.trajectory[10][0]).toBeCloseTo(1, 6);
    expect(rk4Res.trajectory[10][1]).toBeCloseTo(2, 6);

    expect(eulerRes.nfe).toBe(10);
    expect(midRes.nfe).toBe(20);
    expect(rk4Res.nfe).toBe(40);
  });

  it("should verify stepODE and step functions (eulerStep, midpointStep, rk4Step)", () => {
    const x0: Vector2 = [1, 2];
    const vf = (_pt: Vector2, _t: number): Vector2 => [2, 3];
    const dt = 0.5;

    const e = eulerStep(x0, 0, dt, vf);
    const m = midpointStep(x0, 0, dt, vf);
    const r = rk4Step(x0, 0, dt, vf);

    expect(e).toEqual([2, 3.5]);
    expect(m).toEqual([2, 3.5]);
    expect(r).toEqual([2, 3.5]);

    expect(stepODE("euler", x0, 0, dt, vf)).toEqual(odeStepEuler(x0, 0, dt, vf));
    expect(stepODE("midpoint", x0, 0, dt, vf)).toEqual(odeStepMidpoint(x0, 0, dt, vf));
    expect(stepODE("rk4", x0, 0, dt, vf)).toEqual(odeStepRK4(x0, 0, dt, vf));
  });

  it("should show higher accuracy for RK4 compared to Euler on non-linear ODE", () => {
    const orbitVf = (pt: Vector2) => [-pt[1], pt[0]] as Vector2;
    const x0: Vector2 = [1, 0];
    const exactEnd: Vector2 = [Math.cos(1), Math.sin(1)];

    const eulerRes = integrateODE(x0, "euler", 20, orbitVf, 0, 1);
    const rk4Res = integrateODE(x0, "rk4", 20, orbitVf, 0, 1);

    const eulerErr = dist2D(eulerRes.trajectory[20], exactEnd);
    const rk4Err = dist2D(rk4Res.trajectory[20], exactEnd);

    expect(rk4Err).toBeLessThan(eulerErr);
  });

  it("should run multi-solver ODE benchmark profiling", () => {
    const rng = new SeededRNG(42);
    const src = generateFlowDataset("gaussian", 5, rng);
    const tgt = generateFlowDataset("eight_gaussians", 5, rng);
    const pairs = computeHungarianOTCoupling(src, tgt);

    const sample = src.map((p) => p.point);
    const benchmark = runODEBenchmark(sample, pairs, [2, 10]);

    expect(benchmark.euler.length).toBe(2);
    expect(benchmark.midpoint.length).toBe(2);
    expect(benchmark.rk4.length).toBe(2);

    expect(benchmark.euler[0].nfe).toBe(2);
    expect(benchmark.midpoint[0].nfe).toBe(4);
    expect(benchmark.rk4[0].nfe).toBe(8);

    const aliasBench = computeODEBenchmark(sample, pairs, [2, 10]);
    expect(aliasBench.euler[0].nfe).toBe(2);
  });

  it("should support integrateTrajectory alias", () => {
    const res = integrateTrajectory([0, 0], 5, "rk4", constVf, 0);
    expect(res).toHaveLength(6);
    expect(res[0].pos).toBeDefined();
    expect(res[0].velocity).toBeDefined();
  });
});

// ============================================================================
// 8. PRESETS INTEGRITY & CONFIGURATION TESTS
// ============================================================================

describe("Flow Matching Studio Presets", () => {
  it("should contain at least 6 curated presets", () => {
    const presetKeys = Object.keys(FLOW_MATCHING_PRESETS);
    expect(presetKeys.length).toBeGreaterThanOrEqual(6);
    expect(FLOW_MATCHING_STUDIO_PRESETS.length).toBeGreaterThanOrEqual(6);
  });

  it("should have valid configurations for every preset", () => {
    Object.values(FLOW_MATCHING_PRESETS).forEach((preset) => {
      expect(preset.id).toBeDefined();
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
      expect(preset.sourceDataset).toBeDefined();
      expect(preset.targetDataset).toBeDefined();
      expect(["independent", "optimal_transport", "sinkhorn"]).toContain(preset.coupling);
      expect(["euler", "midpoint", "rk4"]).toContain(preset.solver);
      expect(preset.numSteps).toBeGreaterThan(0);
      expect(preset.sigmaMin).toBeGreaterThan(0);
      expect(preset.bandwidth).toBeGreaterThan(0);
      expect(preset.activeTab).toBeDefined();
    });
  });
});
