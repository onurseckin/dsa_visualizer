import { describe, expect, it } from "bun:test";
import React from "react";
import {
  ManifoldLearningStudio,
  MANIFOLD_DATASETS,
  MANIFOLD_PRESETS,
  MANIFOLD_ALGORITHM_META,
  createDeterministicRngManifold,
  computePairwiseDistancesManifold,
  computePairwiseSquaredDistancesManifold,
  computeSymmetricEigenvaluesAndVectors,
  getManifoldColor,
  generateSwissRoll,
  generateConcentricSpheres,
  generateSeveredSphere,
  generateTwinPeaks,
  generateTrefoilKnot,
  generateInterlockingRings,
  generateManifoldDataset,
  computePCA,
  computeTSNEPerplexitySigma,
  computeTSNESymmetrizedP,
  computeTSNEStudentTDist,
  stepTSNE,
  computeUMAPLocalMetrics,
  computeUMAPFuzzyUnion,
  findUMAPABParams,
  stepUMAP,
  buildKNNGraph,
  computeAllPairsShortestPathsDijkstra,
  classicalMDS,
  computeIsomap,
  computeTrustworthiness,
  computeContinuity,
  computeNeighborhoodPreservationRatio,
  computeManifoldDiagnostics,
  project3DTo2D,
  type Point3D,
  type ManifoldPoint2D,
  type ManifoldDatasetId,
  type ManifoldAlgorithmId,
  type ManifoldPresetId,
} from "../../components/primitives";

describe("ManifoldLearningStudio & Non-Linear Dimensionality Reduction Engine", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS CONFIGURATION
  // ==========================================================================
  describe("1. Component Instantiation & Props Configuration", () => {
    it("should instantiate ManifoldLearningStudio with default props", () => {
      const element = React.createElement(ManifoldLearningStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(ManifoldLearningStudio);
    });

    it("should instantiate with custom dataset, algorithm, preset, and callbacks", () => {
      const onDatasetChange = () => {};
      const onAlgorithmChange = () => {};
      const onStepChange = () => {};
      const onDiagnosticsUpdate = () => {};

      const element = React.createElement(ManifoldLearningStudio, {
        initialDataset: "concentric_spheres",
        initialAlgorithm: "tsne",
        initialPreset: "concentric_spheres_separation",
        initialSampleSize: 180,
        initialNoise: 0.04,
        initialPerplexity: 30,
        initialLearningRate: 200,
        initialUMAPNeighbors: 12,
        initialIsomapNeighbors: 10,
        initialMetricK: 8,
        width: 1024,
        height: 720,
        standalone: true,
        title: "Concentric Spheres t-SNE Clustering Studio",
        onDatasetChange,
        onAlgorithmChange,
        onStepChange,
        onDiagnosticsUpdate,
      });

      expect(element.props.initialDataset).toBe("concentric_spheres");
      expect(element.props.initialAlgorithm).toBe("tsne");
      expect(element.props.initialPreset).toBe("concentric_spheres_separation");
      expect(element.props.initialSampleSize).toBe(180);
      expect(element.props.initialNoise).toBe(0.04);
      expect(element.props.initialPerplexity).toBe(30);
      expect(element.props.initialLearningRate).toBe(200);
      expect(element.props.initialUMAPNeighbors).toBe(12);
      expect(element.props.initialIsomapNeighbors).toBe(10);
      expect(element.props.initialMetricK).toBe(8);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Concentric Spheres t-SNE Clustering Studio");
    });

    it("should define valid metadata for all 6 benchmark datasets", () => {
      const datasetIds: ManifoldDatasetId[] = [
        "swiss_roll",
        "concentric_spheres",
        "severed_sphere",
        "twin_peaks",
        "trefoil_knot",
        "interlocking_rings",
      ];

      for (const id of datasetIds) {
        const meta = MANIFOLD_DATASETS[id];
        expect(meta).toBeDefined();
        expect(meta.id).toBe(id);
        expect(meta.name.length).toBeGreaterThan(0);
        expect(meta.description.length).toBeGreaterThan(0);
        expect(meta.intrinsicDimension).toBeGreaterThanOrEqual(1);
        expect(meta.ambientDimension).toBe(3);
        expect(meta.topologicalChallenge.length).toBeGreaterThan(0);
      }
    });

    it("should define valid configurations for all 6 studio presets", () => {
      const presetIds: ManifoldPresetId[] = [
        "swiss_roll_unroll",
        "concentric_spheres_separation",
        "severed_sphere_puncture",
        "twin_peaks_clustering",
        "trefoil_knot_untangling",
        "interlocking_rings_topology",
      ];

      for (const id of presetIds) {
        const p = MANIFOLD_PRESETS[id];
        expect(p).toBeDefined();
        expect(p.id).toBe(id);
        expect(p.name.length).toBeGreaterThan(0);
        expect(p.description.length).toBeGreaterThan(0);
        expect(MANIFOLD_DATASETS[p.datasetId]).toBeDefined();
        expect(MANIFOLD_ALGORITHM_META[p.algorithmId]).toBeDefined();
        expect(p.educationalInsight.length).toBeGreaterThan(0);
      }
    });

    it("should define valid metadata for all 5 reduction algorithms", () => {
      const algoIds: ManifoldAlgorithmId[] = ["pca", "tsne", "umap", "isomap", "mds"];
      for (const id of algoIds) {
        const meta = MANIFOLD_ALGORITHM_META[id];
        expect(meta).toBeDefined();
        expect(meta.name.length).toBeGreaterThan(0);
        expect(meta.type.length).toBeGreaterThan(0);
        expect(meta.complexity.length).toBeGreaterThan(0);
        expect(meta.objective.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // 2. DATASET GENERATORS & GEOMETRIC VERIFICATION
  // ==========================================================================
  describe("2. Benchmark Manifold Dataset Generators", () => {
    it("should generate Swiss Roll with continuous unwrapped spiral", () => {
      const rng = createDeterministicRngManifold(42);
      const N = 100;
      const res = generateSwissRoll(N, 0.05, rng);

      expect(res.points.length).toBe(N);
      expect(res.colors.length).toBe(N);
      expect(res.labels.length).toBe(N);

      for (const p of res.points) {
        expect(p.length).toBe(3);
        expect(Number.isFinite(p[0])).toBe(true);
        expect(Number.isFinite(p[1])).toBe(true);
        expect(Number.isFinite(p[2])).toBe(true);
        // Radius r = sqrt(x^2 + z^2) should be within [1.5*pi, 4.5*pi] approx
        const r = Math.hypot(p[0], p[2]);
        expect(r).toBeGreaterThan(3.5);
        expect(r).toBeLessThan(16.0);
      }
    });

    it("should generate Concentric Spheres with distinct inner and outer radii", () => {
      const rng = createDeterministicRngManifold(99);
      const N = 100;
      const res = generateConcentricSpheres(N, 0.02, rng);

      expect(res.points.length).toBe(N);
      const innerPoints = res.points.slice(0, 50);
      const outerPoints = res.points.slice(50);

      for (const p of innerPoints) {
        const r = Math.hypot(p[0], p[1], p[2]);
        expect(r).toBeGreaterThan(0.8);
        expect(r).toBeLessThan(1.2);
      }

      for (const p of outerPoints) {
        const r = Math.hypot(p[0], p[1], p[2]);
        expect(r).toBeGreaterThan(2.5);
        expect(r).toBeLessThan(3.1);
      }
    });

    it("should generate Severed Sphere with polar slit", () => {
      const rng = createDeterministicRngManifold(101);
      const N = 80;
      const res = generateSeveredSphere(N, 0.02, rng);

      expect(res.points.length).toBe(N);
      for (const p of res.points) {
        const r = Math.hypot(p[0], p[1], p[2]);
        expect(r).toBeGreaterThan(1.7);
        expect(r).toBeLessThan(2.3);
      }
    });

    it("should generate Twin Peaks landscape", () => {
      const rng = createDeterministicRngManifold(123);
      const N = 90;
      const res = generateTwinPeaks(N, 0.02, rng);

      expect(res.points.length).toBe(N);
      for (const p of res.points) {
        expect(p[0]).toBeGreaterThanOrEqual(-3.5);
        expect(p[0]).toBeLessThanOrEqual(3.5);
        expect(p[1]).toBeGreaterThanOrEqual(-3.5);
        expect(p[1]).toBeLessThanOrEqual(3.5);
      }
    });

    it("should generate Trefoil Knot 1D closed loop", () => {
      const rng = createDeterministicRngManifold(555);
      const N = 100;
      const res = generateTrefoilKnot(N, 0.01, rng);

      expect(res.points.length).toBe(N);
      for (const p of res.points) {
        const norm = Math.hypot(p[0], p[1], p[2]);
        expect(norm).toBeGreaterThan(0.5);
        expect(norm).toBeLessThan(4.5);
      }
    });

    it("should generate Interlocking Rings (Hopf Link)", () => {
      const rng = createDeterministicRngManifold(777);
      const N = 100;
      const res = generateInterlockingRings(N, 0.01, rng);

      expect(res.points.length).toBe(N);
      const ring1 = res.points.slice(0, 50);
      const ring2 = res.points.slice(50);

      // Ring 1 centered around x = -0.75
      const avgX1 = ring1.reduce((acc, p) => acc + p[0], 0) / 50;
      expect(avgX1).toBeCloseTo(-0.75, 0.5);

      // Ring 2 centered around x = 0.75
      const avgX2 = ring2.reduce((acc, p) => acc + p[0], 0) / 50;
      expect(avgX2).toBeCloseTo(0.75, 0.5);
    });

    it("should generate datasets reliably via universal dispatcher", () => {
      const dataset = generateManifoldDataset("swiss_roll", 60, 0.05, 42);
      expect(dataset.id).toBe("swiss_roll");
      expect(dataset.points.length).toBe(60);
      expect(dataset.colors.length).toBe(60);
    });

    it("should compute valid manifold HSL colors for any t in [0, 1]", () => {
      const c0 = getManifoldColor(0.0);
      const cMid = getManifoldColor(0.5);
      const c1 = getManifoldColor(1.0);

      expect(c0).toMatch(/^hsl\(\d+,\s*88%,\s*60%\)$/);
      expect(cMid).toMatch(/^hsl\(\d+,\s*88%,\s*60%\)$/);
      expect(c1).toMatch(/^hsl\(\d+,\s*88%,\s*60%\)$/);
    });
  });

  // ==========================================================================
  // 3. PCA SVD & EIGENDECOMPOSITION
  // ==========================================================================
  describe("3. PCA Linear Projection & Eigendecomposition", () => {
    it("should compute exact 3x3 symmetric eigendecomposition", () => {
      // Diagonal matrix with known eigenvalues [5, 3, 1]
      const A = [
        [5, 0, 0],
        [0, 3, 0],
        [0, 0, 1],
      ];
      const { eigenvalues, eigenvectors } = computeSymmetricEigenvaluesAndVectors(A);

      expect(eigenvalues[0]).toBeCloseTo(5, 5);
      expect(eigenvalues[1]).toBeCloseTo(3, 5);
      expect(eigenvalues[2]).toBeCloseTo(1, 5);

      // Check orthonormality of eigenvectors
      for (let i = 0; i < 3; i++) {
        const norm = Math.hypot(...eigenvectors[i]);
        expect(norm).toBeCloseTo(1.0, 5);
      }
      const dot01 =
        eigenvectors[0][0] * eigenvectors[1][0] +
        eigenvectors[0][1] * eigenvectors[1][1] +
        eigenvectors[0][2] * eigenvectors[1][2];
      expect(Math.abs(dot01)).toBeLessThan(1e-5);
    });

    it("should project 3D planar points to 2D preserving 100% variance", () => {
      // Create purely 2D planar points embedded in 3D: z = 0
      const X: Point3D[] = [
        [1, 2, 0],
        [2, 4, 0],
        [-1, -2, 0],
        [-2, -4, 0],
        [3, -1, 0],
        [-3, 1, 0],
      ];

      const pca = computePCA(X);
      expect(pca.embedding.length).toBe(6);
      expect(pca.explainedVarianceRatio[0] + pca.explainedVarianceRatio[1]).toBeCloseTo(1.0, 5);
      expect(pca.eigenvalues[2]).toBeCloseTo(0.0, 5);
    });
  });

  // ==========================================================================
  // 4. t-SNE MATHEMATICAL ENGINE
  // ==========================================================================
  describe("4. t-SNE Probabilistic Affinities & KL Gradient Updates", () => {
    it("should find precision sigma_i matching target perplexity via binary search", () => {
      const X: Point3D[] = [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
        [1, 1, 0],
        [5, 5, 5],
        [6, 5, 5],
      ];
      const distSq = computePairwiseSquaredDistancesManifold(X);
      const targetPerplexity = 3.0;
      const { sigmas, conditionalP } = computeTSNEPerplexitySigma(distSq, targetPerplexity, 1e-5);

      expect(sigmas.length).toBe(X.length);
      expect(conditionalP.length).toBe(X.length);

      // Verify each row's Shannon entropy in bits matches log2(Perplexity)
      for (let i = 0; i < X.length; i++) {
        expect(sigmas[i]).toBeGreaterThan(0);
        let rowSum = 0;
        let entropy = 0;
        for (let j = 0; j < X.length; j++) {
          rowSum += conditionalP[i][j];
          if (conditionalP[i][j] > 1e-12) {
            entropy -= conditionalP[i][j] * Math.log2(conditionalP[i][j]);
          }
        }
        expect(rowSum).toBeCloseTo(1.0, 4);
        expect(entropy).toBeCloseTo(Math.log2(targetPerplexity), 3);
      }
    });

    it("should symmetrize conditional probabilities into joint distribution sum to 1", () => {
      const condP = [
        [0.0, 0.6, 0.4],
        [0.7, 0.0, 0.3],
        [0.5, 0.5, 0.0],
      ];
      const P = computeTSNESymmetrizedP(condP);

      expect(P.length).toBe(3);
      let totalP = 0;
      for (let i = 0; i < 3; i++) {
        expect(P[i][i]).toBe(0);
        for (let j = 0; j < 3; j++) {
          expect(P[i][j]).toBeCloseTo(P[j][i], 6);
          totalP += P[i][j];
        }
      }
      expect(totalP).toBeCloseTo(1.0, 5);
    });

    it("should compute Student-t distribution q_ij with sum = 1", () => {
      const Y: ManifoldPoint2D[] = [
        [0, 0],
        [1, 0],
        [0, 2],
        [3, 3],
      ];
      const { Q, sumQ } = computeTSNEStudentTDist(Y);

      expect(sumQ).toBeGreaterThan(0);
      let totalQ = 0;
      for (let i = 0; i < 4; i++) {
        expect(Q[i][i]).toBe(0);
        for (let j = 0; j < 4; j++) {
          totalQ += Q[i][j];
          expect(Q[i][j]).toBeCloseTo(Q[j][i], 6);
        }
      }
      expect(totalQ).toBeCloseTo(1.0, 5);
    });

    it("should compute analytical KL gradient and step update with momentum", () => {
      const Y: ManifoldPoint2D[] = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      const velocities: ManifoldPoint2D[] = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ];

      // Uniform symmetric P
      const P = [
        [0, 1 / 6, 1 / 6, 1 / 6],
        [1 / 6, 0, 1 / 6, 1 / 6],
        [1 / 6, 1 / 6, 0, 1 / 6],
        [1 / 6, 1 / 6, 1 / 6, 0],
      ];

      const { nextY, nextVelocities, loss, gradNorm } = stepTSNE(Y, velocities, P, 100, 0.5, 1.0);

      expect(nextY.length).toBe(4);
      expect(nextVelocities.length).toBe(4);
      expect(loss).toBeGreaterThanOrEqual(0);
      expect(gradNorm).toBeGreaterThanOrEqual(0);

      // Embedding must be zero-centered
      const meanX = nextY.reduce((acc, p) => acc + p[0], 0) / 4;
      const meanY = nextY.reduce((acc, p) => acc + p[1], 0) / 4;
      expect(Math.abs(meanX)).toBeLessThan(1e-10);
      expect(Math.abs(meanY)).toBeLessThan(1e-10);
    });
  });

  // ==========================================================================
  // 5. UMAP FUZZY SIMPLICIAL SETS & GRADIENT UPDATES
  // ==========================================================================
  describe("5. UMAP Fuzzy Simplicial Sets & Cross-Entropy Engine", () => {
    it("should compute local metric rho_i and scaling sigma_i for UMAP", () => {
      const X: Point3D[] = [
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
        [10, 0, 0],
      ];
      const dist = computePairwiseDistancesManifold(X);
      const k = 3;
      const { sigmas, rhos } = computeUMAPLocalMetrics(dist, k);

      expect(sigmas.length).toBe(4);
      expect(rhos.length).toBe(4);
      expect(rhos[0]).toBeCloseTo(1.0, 4); // Distance to nearest neighbor [1, 0, 0] is 1.0

      for (let i = 0; i < 4; i++) {
        expect(sigmas[i]).toBeGreaterThan(0);
      }
    });

    it("should compute symmetrized fuzzy simplicial set union", () => {
      const condP = [
        [0.0, 0.8, 0.2],
        [0.5, 0.0, 0.4],
        [0.1, 0.3, 0.0],
      ];
      const V = computeUMAPFuzzyUnion(condP);

      expect(V.length).toBe(3);
      for (let i = 0; i < 3; i++) {
        expect(V[i][i]).toBe(0);
        for (let j = 0; j < 3; j++) {
          expect(V[i][j]).toBeCloseTo(V[j][i], 6);
          expect(V[i][j]).toBeGreaterThanOrEqual(0.0);
          expect(V[i][j]).toBeLessThanOrEqual(1.0);
        }
      }
      // V[0][1] = 0.8 + 0.5 - 0.8*0.5 = 0.9
      expect(V[0][1]).toBeCloseTo(0.9, 5);
    });

    it("should fit UMAP curve parameters (a, b)", () => {
      const params = findUMAPABParams(1.0, 0.1);
      expect(params.a).toBeGreaterThan(0.5);
      expect(params.b).toBeGreaterThan(0.5);
    });

    it("should compute UMAP attractive and repulsive gradients and perform step", () => {
      const Y: ManifoldPoint2D[] = [
        [-0.5, -0.5],
        [0.5, -0.5],
        [0.0, 0.5],
      ];
      const velocities: ManifoldPoint2D[] = [
        [0, 0],
        [0, 0],
        [0, 0],
      ];
      const V = [
        [0, 0.9, 0.1],
        [0.9, 0, 0.1],
        [0.1, 0.1, 0],
      ];

      const { a, b } = findUMAPABParams(1.0, 0.1);
      const { nextY, nextVelocities, loss } = stepUMAP(Y, velocities, V, a, b, 0.5, 0.5);

      expect(nextY.length).toBe(3);
      expect(nextVelocities.length).toBe(3);
      expect(loss).toBeGreaterThanOrEqual(0);

      // Centered embedding
      const meanX = nextY.reduce((acc, p) => acc + p[0], 0) / 3;
      const meanY = nextY.reduce((acc, p) => acc + p[1], 0) / 3;
      expect(Math.abs(meanX)).toBeLessThan(1e-10);
      expect(Math.abs(meanY)).toBeLessThan(1e-10);
    });
  });

  // ==========================================================================
  // 6. ISOMAP & CLASSICAL MDS
  // ==========================================================================
  describe("6. Isomap Shortest Paths & Classical MDS", () => {
    it("should construct k-NN adjacency graph", () => {
      const dist = [
        [0, 1, 5, 10],
        [1, 0, 2, 8],
        [5, 2, 0, 1],
        [10, 8, 1, 0],
      ];
      const { adj } = buildKNNGraph(dist, 2);

      expect(adj.length).toBe(4);
      // Point 0's 2 nearest are 1 (dist 1) and 2 (dist 5)
      expect(adj[0].some((e) => e.node === 1)).toBe(true);
    });

    it("should compute all-pairs geodesic shortest paths with Dijkstra", () => {
      // 4 points on a linear chain: 0 - 1 - 2 - 3 with edge length 1
      const adj = [
        [{ node: 1, weight: 1 }],
        [
          { node: 0, weight: 1 },
          { node: 2, weight: 1 },
        ],
        [
          { node: 1, weight: 1 },
          { node: 3, weight: 1 },
        ],
        [{ node: 2, weight: 1 }],
      ];

      const { geodesicDistances, disconnectedCount } = computeAllPairsShortestPathsDijkstra(adj, 4);

      expect(disconnectedCount).toBe(0);
      expect(geodesicDistances[0][3]).toBeCloseTo(3, 5);
      expect(geodesicDistances[0][2]).toBeCloseTo(2, 5);
      expect(geodesicDistances[1][3]).toBeCloseTo(2, 5);
    });

    it("should compute classical MDS with double centering Gram matrix", () => {
      // 3 points forming an equilateral triangle of side length 2 in 2D
      const D = [
        [0, 2, 2],
        [2, 0, 2],
        [2, 2, 0],
      ];

      const mds = classicalMDS(D, 2);
      expect(mds.embedding.length).toBe(3);
      expect(mds.stress).toBeLessThan(0.1);

      // Verify pairwise embedded distances match original distance 2
      const d01 = Math.hypot(
        mds.embedding[0][0] - mds.embedding[1][0],
        mds.embedding[0][1] - mds.embedding[1][1],
      );
      expect(d01).toBeCloseTo(2, 3);
    });

    it("should run complete Isomap pipeline on 3D Swiss Roll subset", () => {
      const dataset = generateManifoldDataset("swiss_roll", 30, 0.01, 42);
      const iso = computeIsomap(dataset.points, 6);

      expect(iso.embedding.length).toBe(30);
      expect(iso.eigenvalues.length).toBe(30);
      expect(iso.stress).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // 7. TELEMETRY & DIAGNOSTIC METRICS
  // ==========================================================================
  describe("7. Telemetry & Diagnostic Quality Metrics", () => {
    it("should yield 100% Trustworthiness and Continuity for perfect identical embeddings", () => {
      const X: Point3D[] = [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
        [2, 2, 0],
        [5, 5, 0],
        [6, 5, 0],
      ];
      const Y: ManifoldPoint2D[] = [
        [0, 0],
        [1, 0],
        [0, 1],
        [2, 2],
        [5, 5],
        [6, 5],
      ];

      const highDist = computePairwiseDistancesManifold(X);
      const lowDist = computePairwiseDistancesManifold(Y);
      const k = 2;

      const T = computeTrustworthiness(highDist, lowDist, k);
      const C = computeContinuity(highDist, lowDist, k);
      const NPR = computeNeighborhoodPreservationRatio(highDist, lowDist, k);

      expect(T).toBeCloseTo(1.0, 5);
      expect(C).toBeCloseTo(1.0, 5);
      expect(NPR).toBeCloseTo(1.0, 5);
    });

    it("should penalize Trustworthiness and NPR on randomly scrambled low-D embeddings", () => {
      const X: Point3D[] = [
        [0, 0, 0],
        [0.1, 0, 0],
        [0.2, 0, 0],
        [10, 0, 0],
        [10.1, 0, 0],
        [10.2, 0, 0],
      ];
      // Scramble: pair distant points together
      const Y: ManifoldPoint2D[] = [
        [0, 0],
        [10, 0],
        [20, 0],
        [0.1, 0],
        [10.1, 0],
        [20.1, 0],
      ];

      const highDist = computePairwiseDistancesManifold(X);
      const lowDist = computePairwiseDistancesManifold(Y);
      const k = 2;

      const T = computeTrustworthiness(highDist, lowDist, k);
      const NPR = computeNeighborhoodPreservationRatio(highDist, lowDist, k);

      expect(T).toBeLessThan(1.0);
      expect(NPR).toBeLessThan(1.0);
    });

    it("should compute composite manifold diagnostics object", () => {
      const X: Point3D[] = [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
        [1, 1, 0],
      ];
      const Y: ManifoldPoint2D[] = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ];
      const highDist = computePairwiseDistancesManifold(X);

      const diag = computeManifoldDiagnostics(highDist, Y, 2, 0.05, {
        computationTimeMs: 12.5,
      });

      expect(diag.trustworthiness).toBeGreaterThan(0.9);
      expect(diag.continuity).toBeGreaterThan(0.9);
      expect(diag.neighborhoodPreservation).toBeGreaterThan(0.9);
      expect(diag.stressOrLoss).toBe(0.05);
      expect(diag.computationTimeMs).toBe(12.5);
    });
  });

  // ==========================================================================
  // 8. 3D PROJECTION & NUMERICAL EDGE CASES
  // ==========================================================================
  describe("8. 3D Camera Projection & Numerical Edge Cases", () => {
    it("should project 3D coordinates to 2D screen with depth sorting", () => {
      const p: Point3D = [2, 3, 4];
      const camera = { azimuth: 45, elevation: 30, zoom: 1.0 };
      const proj = project3DTo2D(p, camera, 400, 400);

      expect(Number.isFinite(proj.x)).toBe(true);
      expect(Number.isFinite(proj.y)).toBe(true);
      expect(Number.isFinite(proj.zDepth)).toBe(true);
    });

    it("should handle identical points without NaN or divide-by-zero", () => {
      const X: Point3D[] = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ];
      const distSq = computePairwiseSquaredDistancesManifold(X);
      const { sigmas, conditionalP } = computeTSNEPerplexitySigma(distSq, 2);

      for (const s of sigmas) {
        expect(Number.isFinite(s)).toBe(true);
      }
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          expect(Number.isFinite(conditionalP[i][j])).toBe(true);
        }
      }
    });

    it("should handle zero noise smoothly", () => {
      const rng = createDeterministicRngManifold(1);
      const res = generateSwissRoll(40, 0.0, rng);
      expect(res.points.length).toBe(40);
      for (const p of res.points) {
        expect(Number.isFinite(p[0])).toBe(true);
      }
    });
  });
});
