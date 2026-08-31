import { describe, it, expect } from "bun:test";
import React from "react";
import {
  DiffusionScoreMatchingStudio,
  SeededRNG,
  norm2D,
  computeLinearSchedule,
  computeCosineSchedule,
  computeSigmoidSchedule,
  buildNoiseSchedule,
  generateDiffusionDataset,
  qSample,
  computeExactScore,
  scoreToEpsilon,
  epsilonToScore,
  predictX0FromEps,
  predictX0FromScore,
  computeCFGScore,
  ddpmReverseStep,
  ddimReverseStep,
  evaluateContinuousVPDriftAndDiffusion,
  evaluateContinuousVEDriftAndDiffusion,
  computeScoreVectorField,
  computeELBOBreakdown,
  DIFFUSION_STUDIO_PRESETS,
  type DiffusionDatasetId,
  type NoiseScheduleType,
} from "../../components/primitives/DiffusionScoreMatchingStudio";

// ============================================================================
// 1. COMPONENT INSTANTIATION & PROPS TESTS
// ============================================================================

describe("Diffusion Models & Continuous SDE Studio - Component Structure", () => {
  it("should create React element with default configuration", () => {
    const element = React.createElement(DiffusionScoreMatchingStudio, {});
    expect(element).toBeDefined();
    expect(element.type).toBe(DiffusionScoreMatchingStudio);
    expect(element.props).toEqual({});
  });

  it("should create React element with custom props", () => {
    const onStepChange = () => {};
    const element = React.createElement(DiffusionScoreMatchingStudio, {
      initialPreset: "ddim_fast_20step_swiss_roll",
      initialDataset: "swiss_roll",
      initialFramework: "ddim",
      initialSchedule: "cosine",
      initialSteps: 50,
      seed: 12345,
      onStepChange,
      className: "custom-diffusion-studio",
    });

    expect(element.props.initialPreset).toBe("ddim_fast_20step_swiss_roll");
    expect(element.props.initialDataset).toBe("swiss_roll");
    expect(element.props.initialFramework).toBe("ddim");
    expect(element.props.initialSchedule).toBe("cosine");
    expect(element.props.initialSteps).toBe(50);
    expect(element.props.seed).toBe(12345);
    expect(element.props.className).toBe("custom-diffusion-studio");
  });
});

// ============================================================================
// 2. PRNG & VECTOR UTILITIES TESTS
// ============================================================================

describe("Deterministic PRNG & Vector Math", () => {
  it("should produce reproducible pseudo-random numbers with fixed seed", () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);

    for (let i = 0; i < 20; i++) {
      expect(rng1.next()).toBeCloseTo(rng2.next(), 8);
    }
  });

  it("should produce distinct sequences with different seeds", () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(999);

    const val1 = rng1.next();
    const val2 = rng2.next();
    expect(val1).not.toBe(val2);
  });

  it("should generate standard normal Gaussian samples with approximately 0 mean and 1 variance", () => {
    const rng = new SeededRNG(101);
    let sum = 0;
    let sumSq = 0;
    const N = 2000;

    for (let i = 0; i < N; i++) {
      const g = rng.nextGaussian(0, 1);
      sum += g;
      sumSq += g * g;
    }

    const mean = sum / N;
    const variance = sumSq / N - mean * mean;

    expect(Math.abs(mean)).toBeLessThan(0.1);
    expect(Math.abs(variance - 1.0)).toBeLessThan(0.15);
  });

  it("should compute exact 2D Euclidean norm", () => {
    expect(norm2D([3, 4])).toBeCloseTo(5.0, 6);
    expect(norm2D([0, 0])).toBe(0);
    expect(norm2D([-1, 1])).toBeCloseTo(Math.SQRT2, 6);
  });
});

// ============================================================================
// 3. NOISE SCHEDULES & MONOTONIC INVARIANTS
// ============================================================================

describe("Diffusion Noise Schedules (Linear, Cosine, Sigmoid)", () => {
  const scheduleTypes: NoiseScheduleType[] = ["linear", "cosine", "sigmoid"];

  scheduleTypes.forEach((schedType) => {
    describe(`Schedule Type: ${schedType}`, () => {
      const T = 50;
      const schedule = buildNoiseSchedule(schedType, T);

      it("should have correct array lengths matching T+1 timesteps", () => {
        expect(schedule.timesteps.length).toBe(T + 1);
        expect(schedule.betas.length).toBe(T + 1);
        expect(schedule.alphas.length).toBe(T + 1);
        expect(schedule.alphasBar.length).toBe(T + 1);
        expect(schedule.sqrtAlphasBar.length).toBe(T + 1);
        expect(schedule.sqrtOneMinusAlphasBar.length).toBe(T + 1);
        expect(schedule.posteriorVariance.length).toBe(T + 1);
        expect(schedule.snr.length).toBe(T + 1);
      });

      it("should satisfy boundary conditions at t=0 (alphaBar=1, sqrtOneMinusAlphaBar=0)", () => {
        expect(schedule.alphasBar[0]).toBe(1.0);
        expect(schedule.sqrtAlphasBar[0]).toBe(1.0);
        expect(schedule.sqrtOneMinusAlphasBar[0]).toBe(0.0);
      });

      it("should strictly monotonically decrease cumulative variance alphaBar_t", () => {
        for (let t = 1; t <= T; t++) {
          expect(schedule.alphasBar[t]).toBeLessThan(schedule.alphasBar[t - 1]);
          expect(schedule.alphasBar[t]).toBeGreaterThan(0);
        }
      });

      it("should satisfy alphaBar_t = product_{s=1}^t alpha_s", () => {
        let prod = 1.0;
        for (let t = 1; t <= T; t++) {
          prod *= schedule.alphas[t];
          expect(schedule.alphasBar[t]).toBeCloseTo(prod, 4);
        }
      });

      it("should have non-negative step betas in range (0, 1)", () => {
        for (let t = 1; t <= T; t++) {
          expect(schedule.betas[t]).toBeGreaterThan(0);
          expect(schedule.betas[t]).toBeLessThan(1);
        }
      });

      it("should have strictly decreasing signal-to-noise ratio SNR(t)", () => {
        for (let t = 2; t <= T; t++) {
          expect(schedule.snr[t]).toBeLessThan(schedule.snr[t - 1]);
        }
      });

      it("should compute non-negative posterior variance tilde{beta}_t", () => {
        for (let t = 1; t <= T; t++) {
          expect(schedule.posteriorVariance[t]).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  it("should support direct linear schedule custom start and end betas", () => {
    const sched = computeLinearSchedule(20, 1e-3, 0.05);
    expect(sched.betas[1]).toBeCloseTo(1e-3, 6);
    expect(sched.betas[20]).toBeCloseTo(0.05, 6);
  });

  it("should support cosine schedule preventing sudden noise blowout", () => {
    const sched = computeCosineSchedule(100, 0.008);
    expect(sched.alphasBar[1]).toBeGreaterThan(0.99);
    expect(sched.alphasBar[100]).toBeLessThan(0.01);
  });

  it("should support sigmoid schedule with smooth S-curve transition", () => {
    const sched = computeSigmoidSchedule(80, -3, 3);
    expect(sched.alphasBar[1]).toBeGreaterThan(0.95);
    expect(sched.alphasBar[80]).toBeLessThan(0.05);
  });
});

// ============================================================================
// 4. 2D DATASET GENERATORS (ALL 6 DISTRIBUTIONS)
// ============================================================================

describe("2D Synthetic Dataset Sampling Engines", () => {
  const datasets: DiffusionDatasetId[] = [
    "two_moons",
    "swiss_roll",
    "pinwheel",
    "concentric_rings",
    "eight_gaussians",
    "four_corners",
  ];

  datasets.forEach((distId) => {
    it(`should generate valid point cloud for dataset: ${distId}`, () => {
      const N = 180;
      const points = generateDiffusionDataset(distId, N, 42);

      expect(points.length).toBe(N);

      points.forEach((p, idx) => {
        expect(p.id).toBe(idx);
        expect(Number.isFinite(p.point[0])).toBe(true);
        expect(Number.isFinite(p.point[1])).toBe(true);
        expect(typeof p.classLabel).toBe("number");
        expect(p.classLabel).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it("should produce reproducible datasets when seed is identical", () => {
    const pts1 = generateDiffusionDataset("two_moons", 100, 777);
    const pts2 = generateDiffusionDataset("two_moons", 100, 777);

    for (let i = 0; i < 100; i++) {
      expect(pts1[i].point[0]).toBe(pts2[i].point[0]);
      expect(pts1[i].point[1]).toBe(pts2[i].point[1]);
      expect(pts1[i].classLabel).toBe(pts2[i].classLabel);
    }
  });

  it("should assign correct class count for eight_gaussians (8 classes)", () => {
    const pts = generateDiffusionDataset("eight_gaussians", 160, 42);
    const classSet = new Set(pts.map((p) => p.classLabel));
    expect(classSet.size).toBe(8);
  });

  it("should assign correct class count for concentric_rings (3 classes)", () => {
    const pts = generateDiffusionDataset("concentric_rings", 150, 42);
    const classSet = new Set(pts.map((p) => p.classLabel));
    expect(classSet.size).toBe(3);
  });

  it("should assign correct class count for four_corners (4 classes)", () => {
    const pts = generateDiffusionDataset("four_corners", 120, 42);
    const classSet = new Set(pts.map((p) => p.classLabel));
    expect(classSet.size).toBe(4);
  });
});

// ============================================================================
// 5. FORWARD NOISING PROCESS q(x_t | x_0)
// ============================================================================

describe("Forward Noising Diffusion Process q(x_t | x_0)", () => {
  it("should return x_0 exactly when alphaBar = 1 (no noise)", () => {
    const x0: [number, number] = [1.5, -2.3];
    const noise: [number, number] = [0.7, -0.4];
    const xt = qSample(x0, 1.0, noise);

    expect(xt[0]).toBeCloseTo(x0[0], 6);
    expect(xt[1]).toBeCloseTo(x0[1], 6);
  });

  it("should return pure noise when alphaBar = 0 (infinite timestep)", () => {
    const x0: [number, number] = [1.5, -2.3];
    const noise: [number, number] = [0.7, -0.4];
    const xt = qSample(x0, 0.0, noise);

    expect(xt[0]).toBeCloseTo(noise[0], 6);
    expect(xt[1]).toBeCloseTo(noise[1], 6);
  });

  it("should interpolate mean and variance correctly according to sqrt(alphaBar)", () => {
    const x0: [number, number] = [2.0, 0.0];
    const noise: [number, number] = [0.0, 2.0];
    const alphaBar = 0.64; // sqrt(0.64) = 0.8, sqrt(1 - 0.64) = 0.6

    const xt = qSample(x0, alphaBar, noise);
    expect(xt[0]).toBeCloseTo(1.6, 6);
    expect(xt[1]).toBeCloseTo(1.2, 6);
  });
});

// ============================================================================
// 6. EXACT ANALYTICAL SCORE MATCHING & LOG-SUM-EXP STABILITY
// ============================================================================

describe("Exact Analytical Score Matching Engine", () => {
  const dataset = generateDiffusionDataset("two_moons", 100, 42);

  it("should evaluate score vector and epsilon prediction without NaN or Infinity", () => {
    const xt: [number, number] = [0.5, 0.5];
    const alphaBar = 0.5;

    const evalRes = computeExactScore(xt, alphaBar, dataset);

    expect(Number.isFinite(evalRes.score[0])).toBe(true);
    expect(Number.isFinite(evalRes.score[1])).toBe(true);
    expect(Number.isFinite(evalRes.epsilon[0])).toBe(true);
    expect(Number.isFinite(evalRes.epsilon[1])).toBe(true);
    expect(Number.isFinite(evalRes.x0Pred[0])).toBe(true);
    expect(Number.isFinite(evalRes.x0Pred[1])).toBe(true);
    expect(Number.isFinite(evalRes.logLikelihood)).toBe(true);
  });

  it("should calculate exact score for a single-point dataset matching theoretical formula", () => {
    const singleDataPoint = [{ id: 0, point: [2.0, 1.0] as [number, number], classLabel: 0 }];
    const xt: [number, number] = [0.0, 0.0];
    const alphaBar = 0.36; // sqrt(alphaBar) = 0.6, sigma^2 = 1 - 0.36 = 0.64

    const evalRes = computeExactScore(xt, alphaBar, singleDataPoint);

    // Expected score = (sqrt(alphaBar) * x0 - xt) / (1 - alphaBar)
    const expectedScoreX = (0.6 * 2.0 - 0.0) / 0.64; // 1.2 / 0.64 = 1.875
    const expectedScoreY = (0.6 * 1.0 - 0.0) / 0.64; // 0.6 / 0.64 = 0.9375

    expect(evalRes.score[0]).toBeCloseTo(expectedScoreX, 5);
    expect(evalRes.score[1]).toBeCloseTo(expectedScoreY, 5);
    expect(evalRes.x0Pred[0]).toBeCloseTo(2.0, 5);
    expect(evalRes.x0Pred[1]).toBeCloseTo(1.0, 5);
  });

  it("should maintain numerical stability at extreme noise levels (alphaBar -> 0)", () => {
    const xt: [number, number] = [10.0, -15.0];
    const evalRes = computeExactScore(xt, 1e-6, dataset);

    expect(Number.isFinite(evalRes.score[0])).toBe(true);
    expect(Number.isFinite(evalRes.score[1])).toBe(true);
    expect(Number.isFinite(evalRes.logLikelihood)).toBe(true);
  });

  it("should maintain numerical stability at tiny noise levels (alphaBar -> 1)", () => {
    const xt: [number, number] = [0.0, 0.0];
    const evalRes = computeExactScore(xt, 0.999, dataset);

    expect(Number.isFinite(evalRes.score[0])).toBe(true);
    expect(Number.isFinite(evalRes.score[1])).toBe(true);
  });
});

// ============================================================================
// 7. SCORE <-> EPSILON EQUIVALENCE & x_0 RECONSTRUCTION
// ============================================================================

describe("Score to Epsilon Equivalence & Reconstruction Identities", () => {
  it("should correctly invert scoreToEpsilon and epsilonToScore", () => {
    const alphaBar = 0.75;
    const testScore: [number, number] = [-2.4, 3.1];

    const eps = scoreToEpsilon(testScore, alphaBar);
    const recoveredScore = epsilonToScore(eps, alphaBar);

    expect(recoveredScore[0]).toBeCloseTo(testScore[0], 6);
    expect(recoveredScore[1]).toBeCloseTo(testScore[1], 6);
  });

  it("should yield identical x0 predictions from score and from epsilon", () => {
    const alphaBar = 0.5;
    const xt: [number, number] = [1.2, -0.8];
    const dataset = generateDiffusionDataset("concentric_rings", 50, 42);

    const evalRes = computeExactScore(xt, alphaBar, dataset);

    const x0FromEps = predictX0FromEps(xt, evalRes.epsilon, alphaBar);
    const x0FromScore = predictX0FromScore(xt, evalRes.score, alphaBar);

    expect(x0FromEps[0]).toBeCloseTo(x0FromScore[0], 5);
    expect(x0FromEps[1]).toBeCloseTo(x0FromScore[1], 5);
    expect(x0FromEps[0]).toBeCloseTo(evalRes.x0Pred[0], 5);
    expect(x0FromEps[1]).toBeCloseTo(evalRes.x0Pred[1], 5);
  });
});

// ============================================================================
// 8. DDPM REVERSE SAMPLING ENGINE
// ============================================================================

describe("DDPM Reverse Sampling Step", () => {
  const schedule = buildNoiseSchedule("linear", 50);

  it("should return x_t unchanged when t = 0", () => {
    const xt: [number, number] = [0.5, -0.5];
    const res = ddpmReverseStep(xt, 0, schedule, [0.1, 0.1]);
    expect(res).toEqual(xt);
  });

  it("should be deterministic when t = 1 (sigma_1 = 0)", () => {
    const xt: [number, number] = [0.5, -0.5];
    const eps: [number, number] = [0.2, -0.1];
    const noiseZ1: [number, number] = [1.5, -2.0];
    const noiseZ2: [number, number] = [-3.0, 4.0];

    const step1 = ddpmReverseStep(xt, 1, schedule, eps, noiseZ1);
    const step2 = ddpmReverseStep(xt, 1, schedule, eps, noiseZ2);

    expect(step1[0]).toBeCloseTo(step2[0], 6);
    expect(step1[1]).toBeCloseTo(step2[1], 6);
  });

  it("should inject stochastic noise proportional to posterior variance when t > 1", () => {
    const xt: [number, number] = [0.5, -0.5];
    const eps: [number, number] = [0.0, 0.0];
    const noiseZ: [number, number] = [1.0, 0.0];

    const stepNoNoise = ddpmReverseStep(xt, 10, schedule, eps, [0, 0]);
    const stepWithNoise = ddpmReverseStep(xt, 10, schedule, eps, noiseZ);

    const expectedSigma = Math.sqrt(schedule.posteriorVariance[10]);
    expect(stepWithNoise[0] - stepNoNoise[0]).toBeCloseTo(expectedSigma, 5);
    expect(stepWithNoise[1] - stepNoNoise[1]).toBeCloseTo(0.0, 5);
  });
});

// ============================================================================
// 9. DDIM REVERSE SAMPLING ENGINE
// ============================================================================

describe("DDIM Accelerated Reverse Sampling Step", () => {
  const schedule = buildNoiseSchedule("cosine", 50);

  it("should be completely deterministic when eta = 0", () => {
    const xt: [number, number] = [1.0, 1.0];
    const eps: [number, number] = [-0.3, 0.4];
    const z1: [number, number] = [2.0, -3.0];
    const z2: [number, number] = [-5.0, 1.2];

    const step1 = ddimReverseStep(xt, 40, 30, schedule, eps, 0.0, z1);
    const step2 = ddimReverseStep(xt, 40, 30, schedule, eps, 0.0, z2);

    expect(step1[0]).toBeCloseTo(step2[0], 6);
    expect(step1[1]).toBeCloseTo(step2[1], 6);
  });

  it("should return x0 prediction directly when prevT = 0", () => {
    const xt: [number, number] = [1.0, 1.0];
    const eps: [number, number] = [0.5, 0.5];
    const curT = 10;

    const res = ddimReverseStep(xt, curT, 0, schedule, eps, 0.0);
    const expectedX0 = predictX0FromEps(xt, eps, schedule.alphasBar[curT]);

    expect(res[0]).toBeCloseTo(expectedX0[0], 6);
    expect(res[1]).toBeCloseTo(expectedX0[1], 6);
  });

  it("should match DDPM transition when eta = 1 and step size is 1", () => {
    const xt: [number, number] = [0.8, -0.4];
    const eps: [number, number] = [0.1, -0.2];
    const z: [number, number] = [0.5, -0.5];
    const t = 20;

    const ddimStep = ddimReverseStep(xt, t, t - 1, schedule, eps, 1.0, z);
    const ddpmStep = ddpmReverseStep(xt, t, schedule, eps, z);

    expect(ddimStep[0]).toBeCloseTo(ddpmStep[0], 4);
    expect(ddimStep[1]).toBeCloseTo(ddpmStep[1], 4);
  });
});

// ============================================================================
// 10. CLASSIFIER-FREE GUIDANCE (CFG) ENGINE
// ============================================================================

describe("Classifier-Free Guidance (CFG) Scoring", () => {
  const dataset = generateDiffusionDataset("eight_gaussians", 160, 42);

  it("should match unconditional score when guidanceScale w = 0", () => {
    const xt: [number, number] = [1.0, 0.0];
    const alphaBar = 0.5;

    const cfgRes = computeCFGScore(xt, alphaBar, dataset, 3, 0.0);
    const uncondRes = computeExactScore(xt, alphaBar, dataset, null);

    expect(cfgRes.score[0]).toBeCloseTo(uncondRes.score[0], 5);
    expect(cfgRes.score[1]).toBeCloseTo(uncondRes.score[1], 5);
    expect(cfgRes.epsilon[0]).toBeCloseTo(uncondRes.epsilon[0], 5);
    expect(cfgRes.epsilon[1]).toBeCloseTo(uncondRes.epsilon[1], 5);
  });

  it("should match standard class-conditional score when guidanceScale w = 1", () => {
    const xt: [number, number] = [1.0, 0.0];
    const alphaBar = 0.5;

    const cfgRes = computeCFGScore(xt, alphaBar, dataset, 2, 1.0);
    const condRes = computeExactScore(xt, alphaBar, dataset, 2);

    expect(cfgRes.score[0]).toBeCloseTo(condRes.score[0], 5);
    expect(cfgRes.score[1]).toBeCloseTo(condRes.score[1], 5);
  });

  it("should extrapolate along the conditional difference vector when w > 1", () => {
    const xt: [number, number] = [0.0, 0.0];
    const alphaBar = 0.5;

    const uncond = computeExactScore(xt, alphaBar, dataset, null);
    const cond = computeExactScore(xt, alphaBar, dataset, 4);
    const cfg3 = computeCFGScore(xt, alphaBar, dataset, 4, 3.0);

    const expectedEpsX = uncond.epsilon[0] + 3.0 * (cond.epsilon[0] - uncond.epsilon[0]);
    const expectedEpsY = uncond.epsilon[1] + 3.0 * (cond.epsilon[1] - uncond.epsilon[1]);

    expect(cfg3.epsilon[0]).toBeCloseTo(expectedEpsX, 5);
    expect(cfg3.epsilon[1]).toBeCloseTo(expectedEpsY, 5);
  });
});

// ============================================================================
// 11. CONTINUOUS VP-SDE & VE-SDE & PROBABILITY FLOW ODE
// ============================================================================

describe("Continuous SDE & Probability Flow ODE Dynamics", () => {
  it("should compute continuous VP-SDE reverse drift and diffusion", () => {
    const x: [number, number] = [1.0, -1.0];
    const score: [number, number] = [-0.5, 0.8];
    const normT = 0.5;

    const res = evaluateContinuousVPDriftAndDiffusion(x, normT, score);

    // beta(0.5) = 0.1 + 0.5 * 19.9 = 10.05
    const beta = 10.05;
    expect(res.diffusion).toBeCloseTo(Math.sqrt(beta), 5);
    expect(res.reverseSDEDrift[0]).toBeCloseTo(-0.5 * beta * 1.0 - beta * -0.5, 4);
    expect(res.probabilityFlowODEDrift[0]).toBeCloseTo(-0.5 * beta * 1.0 - 0.5 * beta * -0.5, 4);
  });

  it("should compute continuous VE-SDE drift and diffusion", () => {
    const x: [number, number] = [2.0, 2.0];
    const score: [number, number] = [0.3, -0.4];
    const normT = 0.5;

    const res = evaluateContinuousVEDriftAndDiffusion(x, normT, score);

    expect(res.diffusion).toBeGreaterThan(0);
    expect(res.reverseSDEDrift[0]).toBeCloseTo(-res.diffusion * res.diffusion * score[0], 5);
    expect(res.probabilityFlowODEDrift[0]).toBeCloseTo(
      -0.5 * res.diffusion * res.diffusion * score[0],
      5,
    );
  });
});

// ============================================================================
// 12. VECTOR FIELD & ELBO BREAKDOWN
// ============================================================================

describe("Spatial Vector Field & Variational ELBO Breakdown", () => {
  const dataset = generateDiffusionDataset("concentric_rings", 60, 42);

  it("should compute score vector field grid with correct dimensions and finite norms", () => {
    const bounds = { minX: -2, maxX: 2, minY: -2, maxY: 2 };
    const density = 8;
    const field = computeScoreVectorField(bounds, density, 0.5, dataset);

    expect(field.length).toBe(density * density); // 64 cells

    field.forEach((cell) => {
      expect(Number.isFinite(cell.norm)).toBe(true);
      expect(cell.norm).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(cell.normalizedScore[0])).toBe(true);
      expect(Number.isFinite(cell.normalizedScore[1])).toBe(true);
    });
  });

  it("should compute positive variational ELBO breakdown across timesteps", () => {
    const schedule = buildNoiseSchedule("linear", 20);
    const elbo = computeELBOBreakdown(schedule, dataset, 15);

    expect(elbo.L0).toBeGreaterThanOrEqual(0);
    expect(elbo.LT).toBeGreaterThanOrEqual(0);
    expect(elbo.totalELBO).toBeGreaterThan(0);
    expect(elbo.Lt.length).toBe(21);
  });
});

// ============================================================================
// 13. PRESETS CATALOG INTEGRITY
// ============================================================================

describe("Diffusion Studio Presets Catalog Integrity", () => {
  it("should have at least 6 distinct curated presets", () => {
    expect(DIFFUSION_STUDIO_PRESETS.length).toBeGreaterThanOrEqual(6);
  });

  it("should have unique preset IDs", () => {
    const ids = DIFFUSION_STUDIO_PRESETS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should contain valid dataset and framework configurations for all presets", () => {
    const validDatasets = new Set([
      "two_moons",
      "swiss_roll",
      "pinwheel",
      "concentric_rings",
      "eight_gaussians",
      "four_corners",
    ]);

    const validFrameworks = new Set([
      "ddpm",
      "ddim",
      "cfg",
      "continuous_vp_sde",
      "continuous_ve_sde",
      "probability_flow_ode",
    ]);

    DIFFUSION_STUDIO_PRESETS.forEach((preset) => {
      expect(validDatasets.has(preset.dataset)).toBe(true);
      expect(validFrameworks.has(preset.framework)).toBe(true);
      expect(preset.totalSteps).toBeGreaterThan(0);
      expect(preset.numParticles).toBeGreaterThan(0);
      expect(preset.gridDensity).toBeGreaterThan(0);
    });
  });
});
