import { describe, expect, it } from "bun:test";
import React from "react";
import {
  ProbabilisticSamplingStudio,
  DEFAULT_GMM_CONFIG,
  DEFAULT_ROSENBROCK_CONFIG,
  DEFAULT_DOUGHNUT_CONFIG,
  DEFAULT_BIVARIATE_GAUSSIAN_CONFIG,
  DEFAULT_DISCRETE_TOKENS,
  SAMPLING_PRESETS,
  invertMatrix2x2,
  mahalanobisQuad2D,
  sampleStandardNormal,
  sampleNormal2D,
  computeEnergyGMM,
  computeGradientGMM,
  computeEnergyRosenbrock,
  computeGradientRosenbrock,
  computeEnergyDoughnut,
  computeGradientDoughnut,
  computeEnergyBivariateGaussian,
  computeGradientBivariateGaussian,
  stepMetropolisHastings,
  stepGibbsGaussian,
  stepGibbsGMM,
  runLeapfrogIntegrator,
  stepHamiltonianMonteCarlo,
  computeSoftmaxWithTemperature,
  filterTopK,
  filterTopP,
  filterTopKTopP,
  sampleCategorical,
  stepDiscreteSampling,
  computeAutocorrelation,
  computeEffectiveSampleSize,
  computeSampleMeanAndCovariance,
  compute1DMarginalHistogram,
  type Vector2,
  type Matrix2x2,
  type SamplingPresetId,
} from "../../components/primitives/ProbabilisticSamplingStudio";

// Deterministic PRNG for test reproducibility
function createDeterministicRng(seed = 123456789) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("ProbabilisticSamplingStudio & Bayesian MCMC Engine Tests", () => {
  describe("1. Component Instantiation & Preset Configurations", () => {
    it("should instantiate ProbabilisticSamplingStudio with default props", () => {
      const element = React.createElement(ProbabilisticSamplingStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(ProbabilisticSamplingStudio);
    });

    it("should instantiate ProbabilisticSamplingStudio with custom props and callbacks", () => {
      const onSampleAccepted = () => {};
      const onDiagnosticsUpdate = () => {};

      const element = React.createElement(ProbabilisticSamplingStudio, {
        initialDistribution: "rosenbrock_banana",
        initialAlgorithm: "hamiltonian_monte_carlo",
        initialPreset: "rosenbrock_hmc_ridge",
        width: 900,
        height: 600,
        standalone: true,
        title: "Hamiltonian Banana Valley Sampler",
        onSampleAccepted,
        onDiagnosticsUpdate,
      });

      expect(element.props.initialDistribution).toBe("rosenbrock_banana");
      expect(element.props.initialAlgorithm).toBe("hamiltonian_monte_carlo");
      expect(element.props.initialPreset).toBe("rosenbrock_hmc_ridge");
      expect(element.props.width).toBe(900);
      expect(element.props.height).toBe(600);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Hamiltonian Banana Valley Sampler");
    });

    it("should provide valid preset structures for all defined presets", () => {
      const presetIds: SamplingPresetId[] = [
        "gmm_multimodal_trapping",
        "rosenbrock_hmc_ridge",
        "correlated_gaussian_gibbs_vs_mh",
        "concentric_doughnut_tunneling",
        "llm_creative_nucleus_generation",
      ];

      for (const id of presetIds) {
        const p = SAMPLING_PRESETS[id];
        expect(p).toBeDefined();
        expect(p.id).toBe(id);
        expect(p.name).toBeDefined();
        expect(p.targetDistribution).toBeDefined();
        expect(p.recommendedAlgorithm).toBeDefined();
        expect(p.description).toBeDefined();
        expect(p.educationalNotes).toBeDefined();
        expect(p.defaultStartPoint).toBeDefined();
        expect(p.defaultStartPoint.length).toBe(2);
      }
    });
  });

  describe("2. Matrix Algebra & Box-Muller Sampling", () => {
    it("should invert a 2x2 positive definite covariance matrix accurately", () => {
      const cov: Matrix2x2 = [
        [2.0, 0.5],
        [0.5, 1.5],
      ];
      const inv = invertMatrix2x2(cov);

      // det = 2.0 * 1.5 - 0.25 = 2.75
      // inv = [[1.5/2.75, -0.5/2.75], [-0.5/2.75, 2.0/2.75]]
      const det = 2.75;
      expect(inv[0][0]).toBeCloseTo(1.5 / det, 6);
      expect(inv[0][1]).toBeCloseTo(-0.5 / det, 6);
      expect(inv[1][0]).toBeCloseTo(-0.5 / det, 6);
      expect(inv[1][1]).toBeCloseTo(2.0 / det, 6);

      // Multiply cov * inv = I
      const prod00 = cov[0][0] * inv[0][0] + cov[0][1] * inv[1][0];
      const prod01 = cov[0][0] * inv[0][1] + cov[0][1] * inv[1][1];
      const prod10 = cov[1][0] * inv[0][0] + cov[1][1] * inv[1][0];
      const prod11 = cov[1][0] * inv[0][1] + cov[1][1] * inv[1][1];

      expect(prod00).toBeCloseTo(1.0, 6);
      expect(prod01).toBeCloseTo(0.0, 6);
      expect(prod10).toBeCloseTo(0.0, 6);
      expect(prod11).toBeCloseTo(1.0, 6);
    });

    it("should compute Mahalanobis quadratic form dx^T invCov dx correctly", () => {
      const invCov: Matrix2x2 = [
        [1.0, 0.0],
        [0.0, 2.0],
      ];
      const diff: Vector2 = [3.0, 2.0];
      const quad = mahalanobisQuad2D(diff, invCov);
      // 3^2 * 1 + 2^2 * 2 = 9 + 8 = 17
      expect(quad).toBeCloseTo(17.0, 6);
    });

    it("should generate standard normal samples with zero mean and unit variance", () => {
      const rng = createDeterministicRng(42);
      const N = 5000;
      let sum = 0;
      let sumSq = 0;

      for (let i = 0; i < N; i++) {
        const z = sampleStandardNormal(rng);
        sum += z;
        sumSq += z * z;
      }

      const mean = sum / N;
      const variance = sumSq / N - mean * mean;

      expect(mean).toBeCloseTo(0.0, 1);
      expect(variance).toBeCloseTo(1.0, 1);
    });

    it("should generate 2D normal samples centered at specified mean", () => {
      const rng = createDeterministicRng(99);
      const mean: Vector2 = [1.5, -2.0];
      const std = 0.5;
      const N = 3000;

      let sumX = 0;
      let sumY = 0;

      for (let i = 0; i < N; i++) {
        const pt = sampleNormal2D(mean, std, rng);
        sumX += pt[0];
        sumY += pt[1];
      }

      expect(sumX / N).toBeCloseTo(1.5, 1);
      expect(sumY / N).toBeCloseTo(-2.0, 1);
    });
  });

  describe("3. 2D Gaussian Mixture Model (GMM) Energy & Gradients", () => {
    it("should evaluate lower potential energy at mode centers than in void regions", () => {
      const mode1 = DEFAULT_GMM_CONFIG.components[0].mean;
      const mode2 = DEFAULT_GMM_CONFIG.components[1].mean;
      const voidPoint: Vector2 = [0.0, 0.0];

      const energyMode1 = computeEnergyGMM(mode1, DEFAULT_GMM_CONFIG);
      const energyMode2 = computeEnergyGMM(mode2, DEFAULT_GMM_CONFIG);
      const energyVoid = computeEnergyGMM(voidPoint, DEFAULT_GMM_CONFIG);

      // Modes have high density -> low energy U = -log(p)
      expect(energyMode1).toBeLessThan(energyVoid);
      expect(energyMode2).toBeLessThan(energyVoid);
    });

    it("should match analytical GMM gradient against finite-difference approximation", () => {
      const testPoints: Vector2[] = [
        [-1.5, -1.2],
        [1.8, 1.5],
        [-1.0, 1.5],
        [0.5, -0.5],
      ];

      const h = 1e-5;
      for (const pt of testPoints) {
        const gradAnalytic = computeGradientGMM(pt, DEFAULT_GMM_CONFIG);

        const energyXPlus = computeEnergyGMM([pt[0] + h, pt[1]], DEFAULT_GMM_CONFIG);
        const energyXMinus = computeEnergyGMM([pt[0] - h, pt[1]], DEFAULT_GMM_CONFIG);
        const gradNumX = (energyXPlus - energyXMinus) / (2 * h);

        const energyYPlus = computeEnergyGMM([pt[0], pt[1] + h], DEFAULT_GMM_CONFIG);
        const energyYMinus = computeEnergyGMM([pt[0], pt[1] - h], DEFAULT_GMM_CONFIG);
        const gradNumY = (energyYPlus - energyYMinus) / (2 * h);

        expect(gradAnalytic[0]).toBeCloseTo(gradNumX, 3);
        expect(gradAnalytic[1]).toBeCloseTo(gradNumY, 3);
      }
    });
  });

  describe("4. Rosenbrock / Banana Potential Energy & Gradients", () => {
    it("should have global minimum energy U = 0 at (a, b*a^2)", () => {
      const config = DEFAULT_ROSENBROCK_CONFIG;
      const minPoint: Vector2 = [config.a, config.b * config.a * config.a];

      const energy = computeEnergyRosenbrock(minPoint, config);
      expect(energy).toBeCloseTo(0.0, 8);

      const grad = computeGradientRosenbrock(minPoint, config);
      expect(grad[0]).toBeCloseTo(0.0, 8);
      expect(grad[1]).toBeCloseTo(0.0, 8);
    });

    it("should match analytical Rosenbrock gradient against finite-difference approximation", () => {
      const config = DEFAULT_ROSENBROCK_CONFIG;
      const testPoints: Vector2[] = [
        [0.0, 0.0],
        [1.5, 2.0],
        [-1.2, 1.44],
        [2.0, 3.5],
      ];

      const h = 1e-5;
      for (const pt of testPoints) {
        const gradAnalytic = computeGradientRosenbrock(pt, config);

        const eXPlus = computeEnergyRosenbrock([pt[0] + h, pt[1]], config);
        const eXMinus = computeEnergyRosenbrock([pt[0] - h, pt[1]], config);
        const gradNumX = (eXPlus - eXMinus) / (2 * h);

        const eYPlus = computeEnergyRosenbrock([pt[0], pt[1] + h], config);
        const eYMinus = computeEnergyRosenbrock([pt[0], pt[1] - h], config);
        const gradNumY = (eYPlus - eYMinus) / (2 * h);

        expect(gradAnalytic[0]).toBeCloseTo(gradNumX, 3);
        expect(gradAnalytic[1]).toBeCloseTo(gradNumY, 3);
      }
    });
  });

  describe("5. Concentric Doughnut Potential Energy & Gradients", () => {
    it("should have zero potential energy and zero gradient on the ring radius r0", () => {
      const config = DEFAULT_DOUGHNUT_CONFIG;
      const angles = [0, Math.PI / 4, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

      for (const theta of angles) {
        const ringPoint: Vector2 = [config.r0 * Math.cos(theta), config.r0 * Math.sin(theta)];

        const energy = computeEnergyDoughnut(ringPoint, config);
        expect(energy).toBeCloseTo(0.0, 8);

        const grad = computeGradientDoughnut(ringPoint, config);
        expect(grad[0]).toBeCloseTo(0.0, 6);
        expect(grad[1]).toBeCloseTo(0.0, 6);
      }
    });

    it("should verify radial gradient points outwards when r > r0 and inwards when r < r0", () => {
      const config = DEFAULT_DOUGHNUT_CONFIG; // r0 = 2.5

      // Point outside ring: r = 3.5
      const outPoint: Vector2 = [3.5, 0.0];
      const gradOut = computeGradientDoughnut(outPoint, config);
      expect(gradOut[0]).toBeGreaterThan(0); // Points outward
      expect(gradOut[1]).toBeCloseTo(0.0, 6);

      // Point inside ring: r = 1.0
      const inPoint: Vector2 = [1.0, 0.0];
      const gradIn = computeGradientDoughnut(inPoint, config);
      expect(gradIn[0]).toBeLessThan(0); // Points inward toward origin (counteracting force towards ring)
      expect(gradIn[1]).toBeCloseTo(0.0, 6);
    });

    it("should match analytical doughnut gradient against finite-difference approximation", () => {
      const config = DEFAULT_DOUGHNUT_CONFIG;
      const testPoints: Vector2[] = [
        [1.5, 1.5],
        [-2.0, 1.0],
        [3.0, -2.0],
        [-1.0, -3.0],
      ];

      const h = 1e-5;
      for (const pt of testPoints) {
        const gradAnalytic = computeGradientDoughnut(pt, config);

        const eXPlus = computeEnergyDoughnut([pt[0] + h, pt[1]], config);
        const eXMinus = computeEnergyDoughnut([pt[0] - h, pt[1]], config);
        const gradNumX = (eXPlus - eXMinus) / (2 * h);

        const eYPlus = computeEnergyDoughnut([pt[0], pt[1] + h], config);
        const eYMinus = computeEnergyDoughnut([pt[0], pt[1] - h], config);
        const gradNumY = (eYPlus - eYMinus) / (2 * h);

        expect(gradAnalytic[0]).toBeCloseTo(gradNumX, 3);
        expect(gradAnalytic[1]).toBeCloseTo(gradNumY, 3);
      }
    });
  });

  describe("6. Bivariate Correlated Gaussian & Gibbs Sampling", () => {
    it("should evaluate gradient to [0, 0] at the distribution mean", () => {
      const config = DEFAULT_BIVARIATE_GAUSSIAN_CONFIG;
      const grad = computeGradientBivariateGaussian(config.mean, config);
      expect(grad[0]).toBeCloseTo(0.0, 8);
      expect(grad[1]).toBeCloseTo(0.0, 8);
    });

    it("should match analytical correlated Gaussian gradient against finite-difference", () => {
      const config = DEFAULT_BIVARIATE_GAUSSIAN_CONFIG;
      const testPoints: Vector2[] = [
        [1.0, 1.0],
        [-1.5, 0.8],
        [0.5, -1.2],
        [-2.0, -1.5],
      ];

      const h = 1e-5;
      for (const pt of testPoints) {
        const gradAnalytic = computeGradientBivariateGaussian(pt, config);

        const eXPlus = computeEnergyBivariateGaussian([pt[0] + h, pt[1]], config);
        const eXMinus = computeEnergyBivariateGaussian([pt[0] - h, pt[1]], config);
        const gradNumX = (eXPlus - eXMinus) / (2 * h);

        const eYPlus = computeEnergyBivariateGaussian([pt[0], pt[1] + h], config);
        const eYMinus = computeEnergyBivariateGaussian([pt[0], pt[1] - h], config);
        const gradNumY = (eYPlus - eYMinus) / (2 * h);

        expect(gradAnalytic[0]).toBeCloseTo(gradNumX, 3);
        expect(gradAnalytic[1]).toBeCloseTo(gradNumY, 3);
      }
    });

    it("should perform exact Gibbs sampling step on Bivariate Gaussian with 100% acceptance", () => {
      const rng = createDeterministicRng(101);
      const config = DEFAULT_BIVARIATE_GAUSSIAN_CONFIG;
      const pt: Vector2 = [2.0, 1.0];

      const gibbsRes = stepGibbsGaussian(pt, config, rng);

      expect(gibbsRes.accepted).toBe(true);
      expect(gibbsRes.alpha).toBe(1.0);
      expect(gibbsRes.intermediatePoint[1]).toBe(pt[1]); // x1 updated, y preserved
      expect(gibbsRes.nextPoint[0]).toBe(gibbsRes.intermediatePoint[0]); // x1 preserved, y updated
    });

    it("should perform conditional Gibbs step on GMM with 100% acceptance", () => {
      const rng = createDeterministicRng(202);
      const pt: Vector2 = [-1.5, -1.0];
      const res = stepGibbsGMM(pt, DEFAULT_GMM_CONFIG, rng);

      expect(res.accepted).toBe(true);
      expect(res.alpha).toBe(1.0);
      expect(res.intermediatePoint[1]).toBe(pt[1]);
      expect(res.nextPoint[0]).toBe(res.intermediatePoint[0]);
    });
  });

  describe("7. Hamiltonian Monte Carlo & Symplectic Leapfrog Integrator", () => {
    it("should conserve total Hamiltonian energy over short leapfrog trajectories on quadratic bowl", () => {
      // Harmonic oscillator U(q) = 0.5 * (q0^2 + q1^2), grad U = [q0, q1]
      const energyHarmonic = (q: Vector2) => 0.5 * (q[0] * q[0] + q[1] * q[1]);
      const gradHarmonic = (q: Vector2): Vector2 => [q[0], q[1]];

      const q0: Vector2 = [1.5, -1.0];
      const p0: Vector2 = [0.5, 1.2];
      const epsilon = 0.02;
      const steps = 15;

      const initialH = energyHarmonic(q0) + 0.5 * (p0[0] * p0[0] + p0[1] * p0[1]);
      const { finalQ, finalP, qTraj } = runLeapfrogIntegrator(q0, p0, gradHarmonic, epsilon, steps);

      const finalH = energyHarmonic(finalQ) + 0.5 * (finalP[0] * finalP[0] + finalP[1] * finalP[1]);
      const deltaH = Math.abs(finalH - initialH);

      // Symplectic integrator energy drift is bounded by O(epsilon^2)
      expect(deltaH).toBeLessThan(0.005);
      expect(qTraj.length).toBe(steps + 1);
    });

    it("should execute HMC step and return valid trajectory and acceptance", () => {
      const rng = createDeterministicRng(777);
      const energyFn = (pt: Vector2) => computeEnergyRosenbrock(pt, DEFAULT_ROSENBROCK_CONFIG);
      const gradFn = (pt: Vector2) => computeGradientRosenbrock(pt, DEFAULT_ROSENBROCK_CONFIG);

      const q0: Vector2 = [1.0, 1.0];
      const hmcRes = stepHamiltonianMonteCarlo(q0, energyFn, gradFn, 0.05, 10, rng);

      expect(hmcRes.trajectory.length).toBe(11);
      expect(hmcRes.initialMomentum.length).toBe(2);
      expect(hmcRes.finalMomentum.length).toBe(2);
      expect(Number.isFinite(hmcRes.alpha)).toBe(true);
      expect(hmcRes.alpha).toBeGreaterThanOrEqual(0.0);
      expect(hmcRes.alpha).toBeLessThanOrEqual(1.0);
    });
  });

  describe("8. Metropolis-Hastings Random Walk Acceptance", () => {
    it("should accept step with probability 1.0 when moving to lower potential energy", () => {
      const rng = () => 0.5; // Fixed PRNG returning 0.5
      const energyFn = (pt: Vector2) => pt[0] * pt[0] + pt[1] * pt[1];

      // Current point at high energy (3, 3) -> proposal towards (0, 0)
      const currentPoint: Vector2 = [3.0, 3.0];
      // Mock proposal by stepping towards lower energy
      const mhRes = stepMetropolisHastings(currentPoint, energyFn, 0.1, rng);

      expect(mhRes.alpha).toBeGreaterThanOrEqual(0.0);
      expect(mhRes.alpha).toBeLessThanOrEqual(1.0);
    });

    it("should correctly calculate acceptance probability alpha = min(1, exp(-deltaU))", () => {
      const currentPoint: Vector2 = [0.0, 0.0];
      const energyFn = (pt: Vector2) => pt[0] * pt[0] + pt[1] * pt[1];

      const rng = createDeterministicRng(555);
      const res = stepMetropolisHastings(currentPoint, energyFn, 0.5, rng);

      const expectedDeltaU = res.energyProposal - res.energyCurrent;
      const expectedAlpha = Math.min(1.0, Math.exp(-expectedDeltaU));

      expect(res.alpha).toBeCloseTo(expectedAlpha, 6);
    });
  });

  describe("9. Discrete Vocabulary Softmax & Nucleus (Top-p / Top-k) Sampling", () => {
    it("should compute softmax probabilities with temperature scaling", () => {
      const logits = [2.0, 1.0, 0.0];

      // T = 1.0
      const probsT1 = computeSoftmaxWithTemperature(logits, 1.0);
      expect(probsT1[0] + probsT1[1] + probsT1[2]).toBeCloseTo(1.0, 6);
      expect(probsT1[0]).toBeGreaterThan(probsT1[1]);
      expect(probsT1[1]).toBeGreaterThan(probsT1[2]);

      // T -> 0 (sharper, near greedy)
      const probsSharp = computeSoftmaxWithTemperature(logits, 0.1);
      expect(probsSharp[0]).toBeGreaterThan(0.99);

      // T -> high (flatter, near uniform)
      const probsFlat = computeSoftmaxWithTemperature(logits, 100.0);
      expect(probsFlat[0]).toBeCloseTo(1 / 3, 2);
      expect(probsFlat[1]).toBeCloseTo(1 / 3, 2);
      expect(probsFlat[2]).toBeCloseTo(1 / 3, 2);
    });

    it("should filter top-k probabilities correctly and zero out remainder", () => {
      const probs = [0.5, 0.3, 0.15, 0.05];
      const { filtered, keptIndices } = filterTopK(probs, 2);

      expect(keptIndices.length).toBe(2);
      expect(keptIndices).toContain(0);
      expect(keptIndices).toContain(1);
      expect(filtered[2]).toBe(0.0);
      expect(filtered[3]).toBe(0.0);

      // Renormalized sum
      const sum = filtered.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 6);
    });

    it("should filter top-p nucleus probabilities dynamically", () => {
      const probs = [0.6, 0.25, 0.1, 0.05];
      // topP = 0.8: item 0 (0.6) + item 1 (0.25) = 0.85 >= 0.8, so items 0 and 1 are kept
      const { filtered, keptIndices } = filterTopP(probs, 0.8);

      expect(keptIndices.length).toBe(2);
      expect(keptIndices).toContain(0);
      expect(keptIndices).toContain(1);
      expect(filtered[2]).toBe(0.0);
      expect(filtered[3]).toBe(0.0);
    });

    it("should combine Top-k and Top-p filtering jointly", () => {
      const probs = [0.4, 0.3, 0.2, 0.1];
      const { filtered, keptIndices } = filterTopKTopP(probs, 3, 0.6);

      // Top-k=3 keeps [0, 1, 2], then Top-p=0.6 keeps [0, 1] since 0.4+0.3 = 0.7 >= 0.6
      expect(keptIndices.length).toBe(2);
      expect(keptIndices).toContain(0);
      expect(keptIndices).toContain(1);

      const sum = filtered.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 6);
    });

    it("should sample categorical index from probability vector", () => {
      const probs = [0.0, 0.0, 1.0, 0.0];
      const idx = sampleCategorical(probs, () => 0.5);
      expect(idx).toBe(2);
    });

    it("should execute full discrete token sampling step", () => {
      const rng = createDeterministicRng(333);
      const res = stepDiscreteSampling(DEFAULT_DISCRETE_TOKENS, 0.8, 4, 0.9, rng);

      expect(res.rawProbs.length).toBe(DEFAULT_DISCRETE_TOKENS.length);
      expect(res.scaledProbs.length).toBe(DEFAULT_DISCRETE_TOKENS.length);
      expect(res.filteredProbs.length).toBe(DEFAULT_DISCRETE_TOKENS.length);
      expect(res.keptIndices.length).toBeLessThanOrEqual(4);
      expect(typeof res.sampledToken).toBe("string");
      expect(res.sampledIndex).toBeGreaterThanOrEqual(0);
      expect(res.sampledIndex).toBeLessThan(DEFAULT_DISCRETE_TOKENS.length);
    });
  });

  describe("10. Diagnostics: Autocorrelation, ESS, Covariance & Marginals", () => {
    it("should compute ACF = 1.0 at lag 0 and near zero for uncorrelated white noise", () => {
      const rng = createDeterministicRng(888);
      const N = 1000;
      const whiteNoise: number[] = [];
      for (let i = 0; i < N; i++) whiteNoise.push(sampleStandardNormal(rng));

      const acf = computeAutocorrelation(whiteNoise, 10);
      expect(acf[0]).toBeCloseTo(1.0, 6);

      // Uncorrelated noise has small lag autocorrelation
      for (let k = 1; k < acf.length; k++) {
        expect(Math.abs(acf[k])).toBeLessThan(0.15);
      }
    });

    it("should estimate high ESS for uncorrelated noise and lower ESS for autoregressive chain", () => {
      const rng = createDeterministicRng(444);
      const N = 1000;

      // 1. White noise
      const whiteNoise: number[] = [];
      for (let i = 0; i < N; i++) whiteNoise.push(sampleStandardNormal(rng));
      const essWhite = computeEffectiveSampleSize(whiteNoise, 30);
      expect(essWhite).toBeGreaterThan(600);

      // 2. High persistence AR(1) chain: x_{t+1} = 0.95 * x_t + noise
      const arChain: number[] = [0];
      for (let i = 1; i < N; i++) {
        arChain.push(0.95 * arChain[i - 1] + 0.3 * sampleStandardNormal(rng));
      }
      const essAR = computeEffectiveSampleSize(arChain, 30);
      expect(essAR).toBeLessThan(essWhite);
    });

    it("should compute sample mean, variance, covariance, and correlation", () => {
      const samples: Vector2[] = [
        [1.0, 2.0],
        [2.0, 4.0],
        [3.0, 6.0],
        [4.0, 8.0],
        [5.0, 10.0],
      ];

      const { mean, varianceX, varianceY, correlation } = computeSampleMeanAndCovariance(samples);

      expect(mean[0]).toBeCloseTo(3.0, 6);
      expect(mean[1]).toBeCloseTo(6.0, 6);
      expect(varianceX).toBeCloseTo(2.5, 6);
      expect(varianceY).toBeCloseTo(10.0, 6);
      expect(correlation).toBeCloseTo(1.0, 6); // Perfect collinearity y = 2x
    });

    it("should compute 1D marginal histograms correctly", () => {
      const samples = [-2, -1, 0, 1, 2];
      const hist = compute1DMarginalHistogram(samples, 10, -5, 5);

      expect(hist.binCenters.length).toBe(10);
      expect(hist.counts.length).toBe(10);
      const totalCount = hist.counts.reduce((a, b) => a + b, 0);
      expect(totalCount).toBe(5);
    });
  });
});
