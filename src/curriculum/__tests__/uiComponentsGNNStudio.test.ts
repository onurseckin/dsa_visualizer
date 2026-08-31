import { describe, expect, it } from "bun:test";
import React from "react";
import {
  GraphNeuralNetworkStudio,
  GNN_PRESETS,
  zerosMatrix,
  identityMatrix,
  matrixAdd,
  matrixSubtract,
  matrixMultiply,
  matrixVectorMultiply,
  matrixTranspose,
  dotProduct,
  vectorNorm,
  vectorNormalize,
  vectorCosineSimilarity,
  applyActivation,
  computeAdjacencyMatrix,
  computeDegreeVector,
  computeDegreeMatrix,
  computeNormalizedAdjacency,
  computeLaplacian,
  computeNormalizedLaplacian,
  computeRandomWalkLaplacian,
  computeEigenvaluesAndVectors,
  computeGraphFourierTransform,
  computeInverseGraphFourierTransform,
  computeChebyshevFilter,
  computeGCNLayer,
  computeGraphSAGELayer,
  computeGATLayer,
  computeGINLayer,
  computeDirichletEnergy,
  computeUnnormalizedDirichletEnergy,
  computeCosineSimilarityMatrix,
  computeAveragePairwiseCosineDistance,
  simulateLayerTrajectories,
  run1WLColorRefinement,
  compare1WLGraphPair,
  getWLColorHex,
  getHarmonicColor,
  type GNNPresetId,
  type GNNStudioTab,
  type MessagePassingArchitecture,
} from "../../components/primitives/GraphNeuralNetworkStudio";

describe("GraphNeuralNetworkStudio & Message Passing Math Engine Tests", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PRESET INTEGRITY
  // ==========================================================================
  describe("1. Component Instantiation & Preset Integrity", () => {
    it("should instantiate GraphNeuralNetworkStudio with default props", () => {
      const element = React.createElement(GraphNeuralNetworkStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(GraphNeuralNetworkStudio);
    });

    it("should instantiate GraphNeuralNetworkStudio with custom props and callbacks", () => {
      const onTabChange = () => {};
      const onPresetChange = () => {};
      const element = React.createElement(GraphNeuralNetworkStudio, {
        initialTab: "spectral" as GNNStudioTab,
        initialPreset: "cora_subgraph" as GNNPresetId,
        initialArchitecture: "gat" as MessagePassingArchitecture,
        width: 1024,
        height: 720,
        standalone: true,
        title: "Custom GNN Laboratory",
        onTabChange,
        onPresetChange,
      });

      expect(element.props.initialTab).toBe("spectral");
      expect(element.props.initialPreset).toBe("cora_subgraph");
      expect(element.props.initialArchitecture).toBe("gat");
      expect(element.props.width).toBe(1024);
      expect(element.props.height).toBe(720);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Custom GNN Laboratory");
    });

    it("should verify all 6 graph presets exist with valid node/edge topologies", () => {
      const presetIds: GNNPresetId[] = [
        "karate_club",
        "cora_subgraph",
        "wl_decagon_pentagons",
        "tree_bottleneck",
        "molecule_benzene_caffeine",
        "custom_editable",
      ];

      for (const id of presetIds) {
        const preset = GNN_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.nodes.length).toBeGreaterThan(0);
        expect(preset.edges.length).toBeGreaterThan(0);

        // Every node must have id, label, x, y, and features
        for (const node of preset.nodes) {
          expect(node.id).toBeDefined();
          expect(node.label).toBeDefined();
          expect(typeof node.x).toBe("number");
          expect(typeof node.y).toBe("number");
          expect(Array.isArray(node.features)).toBe(true);
        }

        // Every edge must reference valid node IDs
        const nodeIds = new Set(preset.nodes.map((n) => n.id));
        for (const edge of preset.edges) {
          expect(nodeIds.has(edge.source)).toBe(true);
          expect(nodeIds.has(edge.target)).toBe(true);
        }
      }
    });

    it("should verify Karate Club contains exactly 34 nodes and 78 edges", () => {
      const karate = GNN_PRESETS.karate_club;
      expect(karate.nodes.length).toBe(34);
      expect(karate.edges.length).toBe(78);
    });

    it("should verify Cora Subgraph contains 16 nodes and multi-class labels", () => {
      const cora = GNN_PRESETS.cora_subgraph;
      expect(cora.nodes.length).toBe(16);
      expect(cora.edges.length).toBe(22);
    });

    it("should verify 1-WL Counterexample Pair contains Decagon C10 and 2x C5 secondary graph", () => {
      const pairPreset = GNN_PRESETS.wl_decagon_pentagons;
      expect(pairPreset.isPair).toBe(true);
      expect(pairPreset.nodes.length).toBe(10);
      expect(pairPreset.edges.length).toBe(10);
      expect(pairPreset.secondaryGraph).toBeDefined();
      expect(pairPreset.secondaryGraph?.nodes.length).toBe(10);
      expect(pairPreset.secondaryGraph?.edges.length).toBe(10);
    });
  });

  // ==========================================================================
  // 2. LINEAR ALGEBRA & GRAPH MATRICES
  // ==========================================================================
  describe("2. Linear Algebra & Graph Matrices (A, D, A_hat)", () => {
    it("should generate zeros matrices and identity matrices of arbitrary dimension", () => {
      const Z = zerosMatrix(3, 4);
      expect(Z.length).toBe(3);
      expect(Z[0].length).toBe(4);
      expect(Z.every((row) => row.every((v) => v === 0))).toBe(true);

      const I = identityMatrix(3);
      expect(I).toEqual([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]);
    });

    it("should apply various activation functions (ReLU, LeakyReLU, ELU, Tanh, Sigmoid, Identity)", () => {
      expect(applyActivation(-2, "relu")).toBe(0);
      expect(applyActivation(3, "relu")).toBe(3);
      expect(applyActivation(-2, "leaky_relu", 0.2)).toBeCloseTo(-0.4, 6);
      expect(applyActivation(2, "leaky_relu", 0.2)).toBe(2);
      expect(applyActivation(-1, "elu", 1.0)).toBeCloseTo(Math.exp(-1) - 1, 6);
      expect(applyActivation(0, "tanh")).toBe(0);
      expect(applyActivation(0, "sigmoid")).toBeCloseTo(0.5, 6);
      expect(applyActivation(-5, "identity")).toBe(-5);
    });

    it("should perform matrix additions, subtractions, multiplications, and transpositions accurately", () => {
      const A = [
        [1, 2],
        [3, 4],
      ];
      const B = [
        [5, 6],
        [7, 8],
      ];

      const sum = matrixAdd(A, B);
      expect(sum).toEqual([
        [6, 8],
        [10, 12],
      ]);

      const diff = matrixSubtract(B, A);
      expect(diff).toEqual([
        [4, 4],
        [4, 4],
      ]);

      const prod = matrixMultiply(A, B);
      // [1*5+2*7, 1*6+2*8] = [19, 22]
      // [3*5+4*7, 3*6+4*8] = [43, 50]
      expect(prod).toEqual([
        [19, 22],
        [43, 50],
      ]);

      const At = matrixTranspose(A);
      expect(At).toEqual([
        [1, 3],
        [2, 4],
      ]);
    });

    it("should compute accurate vector dot products, norms, and cosine similarities", () => {
      const u = [3, 4];
      const v = [6, 8];
      expect(vectorNorm(u)).toBe(5);
      expect(dotProduct(u, v)).toBe(50);
      expect(vectorCosineSimilarity(u, v)).toBeCloseTo(1.0, 8);

      const orthogonalV = [-4, 3];
      expect(dotProduct(u, orthogonalV)).toBe(0);
      expect(vectorCosineSimilarity(u, orthogonalV)).toBeCloseTo(0.0, 8);

      const normalized = vectorNormalize(u);
      expect(normalized[0]).toBeCloseTo(0.6, 8);
      expect(normalized[1]).toBeCloseTo(0.8, 8);
      expect(vectorNorm(normalized)).toBeCloseTo(1.0, 8);
    });

    it("should build symmetric adjacency matrix and degree matrix for undirected graphs", () => {
      // Triangle graph (3 nodes, 3 edges: 0-1, 1-2, 2-0)
      const edges = [
        { source: "0", target: "1" },
        { source: "1", target: "2" },
        { source: "2", target: "0" },
      ];
      const map = { "0": 0, "1": 1, "2": 2 };
      const A = computeAdjacencyMatrix(3, edges, map, false);

      expect(A).toEqual([
        [0, 1, 1],
        [1, 0, 1],
        [1, 1, 0],
      ]);

      const degVec = computeDegreeVector(A);
      expect(degVec).toEqual([2, 2, 2]);

      const D = computeDegreeMatrix(A);
      expect(D).toEqual([
        [2, 0, 0],
        [0, 2, 0],
        [0, 0, 2],
      ]);
    });

    it("should compute Kipf & Welling Renormalized Adjacency A_hat = D~^(-1/2) A~ D~^(-1/2)", () => {
      // Path graph: 0 - 1 - 2
      const edges = [
        { source: "0", target: "1" },
        { source: "1", target: "2" },
      ];
      const map = { "0": 0, "1": 1, "2": 2 };
      const A = computeAdjacencyMatrix(3, edges, map, false);

      // A~ = A + I:
      // [1, 1, 0] -> row sum = 2
      // [1, 1, 1] -> row sum = 3
      // [0, 1, 1] -> row sum = 2
      const Ahat = computeNormalizedAdjacency(A, true);

      // A_hat[0][0] = 1 / sqrt(2 * 2) = 0.5
      // A_hat[0][1] = 1 / sqrt(2 * 3) = 1 / sqrt(6)
      // A_hat[1][1] = 1 / sqrt(3 * 3) = 1 / 3
      expect(Ahat[0][0]).toBeCloseTo(0.5, 6);
      expect(Ahat[0][1]).toBeCloseTo(1 / Math.sqrt(6), 6);
      expect(Ahat[1][0]).toBeCloseTo(1 / Math.sqrt(6), 6);
      expect(Ahat[1][1]).toBeCloseTo(1 / 3, 6);
      expect(Ahat[0][2]).toBe(0);

      // Verify A_hat is symmetric
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          expect(Ahat[i][j]).toBeCloseTo(Ahat[j][i], 8);
        }
      }
    });
  });

  // ==========================================================================
  // 3. LAPLACIAN MATRICES & PROPERTIES
  // ==========================================================================
  describe("3. Laplacian Matrices (L, L_sym, L_rw)", () => {
    it("should verify row sums of unnormalized Laplacian L = D - A are all 0 (L * 1 = 0)", () => {
      // Karate club Laplacian
      const nodes = GNN_PRESETS.karate_club.nodes;
      const edges = GNN_PRESETS.karate_club.edges;
      const map: Record<string, number> = {};
      nodes.forEach((n, i) => {
        map[n.id] = i;
      });

      const A = computeAdjacencyMatrix(nodes.length, edges, map, false);
      const L = computeLaplacian(A);

      expect(L.length).toBe(34);

      for (let i = 0; i < 34; i++) {
        let rowSum = 0;
        for (let j = 0; j < 34; j++) {
          rowSum += L[i][j];
        }
        expect(Math.abs(rowSum)).toBeLessThan(1e-10);
      }
    });

    it("should verify Normalized Symmetric Laplacian L_sym is symmetric and has eigenvalues in [0, 2]", () => {
      const nodes = GNN_PRESETS.cora_subgraph.nodes;
      const edges = GNN_PRESETS.cora_subgraph.edges;
      const map: Record<string, number> = {};
      nodes.forEach((n, i) => {
        map[n.id] = i;
      });

      const A = computeAdjacencyMatrix(nodes.length, edges, map, false);
      const Lsym = computeNormalizedLaplacian(A);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes.length; j++) {
          expect(Lsym[i][j]).toBeCloseTo(Lsym[j][i], 8);
        }
      }
    });

    it("should verify Random Walk Laplacian L_rw satisfies L_rw * 1 = 0", () => {
      const edges = [
        { source: "0", target: "1" },
        { source: "1", target: "2" },
        { source: "2", target: "3" },
      ];
      const map = { "0": 0, "1": 1, "2": 2, "3": 3 };
      const A = computeAdjacencyMatrix(4, edges, map, false);
      const Lrw = computeRandomWalkLaplacian(A);

      for (let i = 0; i < 4; i++) {
        let rowSum = 0;
        for (let j = 0; j < 4; j++) {
          rowSum += Lrw[i][j];
        }
        expect(Math.abs(rowSum)).toBeLessThan(1e-10);
      }
    });
  });

  // ==========================================================================
  // 4. EXACT SPECTRAL EIGENDECOMPOSITION (Jacobi Algorithm)
  // ==========================================================================
  describe("4. Exact Eigendecomposition (Jacobi Algorithm)", () => {
    it("should compute exact eigenvalues and orthonormal eigenvectors U with U^T U = I", () => {
      // 4-cycle graph C4
      const edges = [
        { source: "0", target: "1" },
        { source: "1", target: "2" },
        { source: "2", target: "3" },
        { source: "3", target: "0" },
      ];
      const map = { "0": 0, "1": 1, "2": 2, "3": 3 };
      const A = computeAdjacencyMatrix(4, edges, map, false);
      const Lsym = computeNormalizedLaplacian(A);

      const spectral = computeEigenvaluesAndVectors(Lsym);
      expect(spectral.eigenvalues.length).toBe(4);
      expect(spectral.eigenvectors.length).toBe(4);

      // Eigenvalues must be sorted ascending
      for (let i = 0; i < 3; i++) {
        expect(spectral.eigenvalues[i]).toBeLessThanOrEqual(spectral.eigenvalues[i + 1] + 1e-10);
      }

      // Smallest eigenvalue must be 0 for connected graph
      expect(spectral.eigenvalues[0]).toBeCloseTo(0.0, 6);

      // Orthonormality check: U^T U = I
      const U = spectral.eigenvectors;
      const Ut = matrixTranspose(U);
      const UtU = matrixMultiply(Ut, U);

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const expected = i === j ? 1.0 : 0.0;
          expect(UtU[i][j]).toBeCloseTo(expected, 6);
        }
      }

      // Spectral equation check: L_sym * u_k = lambda_k * u_k
      for (let k = 0; k < 4; k++) {
        const uk = U.map((row) => row[k]);
        const Luk = matrixVectorMultiply(Lsym, uk);
        const lambda = spectral.eigenvalues[k];

        for (let i = 0; i < 4; i++) {
          expect(Luk[i]).toBeCloseTo(lambda * uk[i], 6);
        }
      }
    });

    it("should correctly identify connected components via zero eigenvalues", () => {
      // Disjoint graph: Two disconnected edges 0-1 and 2-3
      const edges = [
        { source: "0", target: "1" },
        { source: "2", target: "3" },
      ];
      const map = { "0": 0, "1": 1, "2": 2, "3": 3 };
      const A = computeAdjacencyMatrix(4, edges, map, false);
      const Lsym = computeNormalizedLaplacian(A);

      const spectral = computeEigenvaluesAndVectors(Lsym);
      // Multiplicity of lambda = 0 must equal 2
      expect(spectral.eigenvalues[0]).toBeCloseTo(0.0, 6);
      expect(spectral.eigenvalues[1]).toBeCloseTo(0.0, 6);
      expect(spectral.eigenvalues[2]).toBeGreaterThan(0.5);
    });
  });

  // ==========================================================================
  // 5. GRAPH FOURIER TRANSFORM & CHEBYSHEV FILTERING
  // ==========================================================================
  describe("5. Graph Fourier Transform & Chebyshev Spectral Filtering", () => {
    it("should perform exact Graph Fourier Transform and Inverse Reconstruction (U U^T x = x)", () => {
      const edges = [
        { source: "0", target: "1" },
        { source: "1", target: "2" },
        { source: "2", target: "0" },
      ];
      const map = { "0": 0, "1": 1, "2": 2 };
      const A = computeAdjacencyMatrix(3, edges, map, false);
      const Lsym = computeNormalizedLaplacian(A);
      const { eigenvectors: U } = computeEigenvaluesAndVectors(Lsym);

      const signal = [2.5, -1.0, 4.2];

      // Forward Fourier
      const xHat = computeGraphFourierTransform(signal, U);
      expect(xHat.length).toBe(3);

      // Inverse Fourier
      const reconstructed = computeInverseGraphFourierTransform(xHat, U);

      for (let i = 0; i < 3; i++) {
        expect(reconstructed[i]).toBeCloseTo(signal[i], 6);
      }

      // Parseval's energy conservation: ||x||^2 = ||xHat||^2
      const energySignal = dotProduct(signal, signal);
      const energyFreq = dotProduct(xHat, xHat);
      expect(energySignal).toBeCloseTo(energyFreq, 6);
    });

    it("should compute Chebyshev polynomial recurrence terms T_0, T_1, T_2 and output", () => {
      const edges = [
        { source: "0", target: "1" },
        { source: "1", target: "2" },
      ];
      const map = { "0": 0, "1": 1, "2": 2 };
      const A = computeAdjacencyMatrix(3, edges, map, false);
      const Lsym = computeNormalizedLaplacian(A);

      const signal = [1.0, 0.0, 0.0];
      const thetas = [1.0, 0.5, -0.2];

      const res = computeChebyshevFilter(signal, Lsym, 2.0, thetas);
      expect(res.filtered.length).toBe(3);
      expect(res.chebyshevTerms.length).toBe(3);

      // T_0 = signal
      expect(res.chebyshevTerms[0]).toEqual(signal);
    });
  });

  // ==========================================================================
  // 6. MESSAGE PASSING ARCHITECTURES (GCN, GraphSAGE, GAT, GIN)
  // ==========================================================================
  describe("6. Message Passing Architectures (GCN, GraphSAGE, GAT, GIN)", () => {
    const H0 = [
      [1.0, 0.0],
      [0.0, 1.0],
      [0.5, 0.5],
    ];
    const edges = [
      { source: "0", target: "1" },
      { source: "1", target: "2" },
      { source: "2", target: "0" },
    ];
    const map = { "0": 0, "1": 1, "2": 2 };
    const A = computeAdjacencyMatrix(3, edges, map, false);

    it("should compute GCN forward layer update with correct dimensions and activation", () => {
      const W = [
        [1.0, 0.0, 0.5],
        [0.0, 1.0, 0.5],
      ];
      const HNext = computeGCNLayer(H0, A, W, "relu", true);

      expect(HNext.length).toBe(3);
      expect(HNext[0].length).toBe(3);

      // Verify all elements are non-negative due to ReLU
      for (const row of HNext) {
        for (const val of row) {
          expect(val).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("should compute GraphSAGE with Mean, Max, and Sum aggregators and L2 normalization", () => {
      const WS = [
        [1, 0],
        [0, 1],
      ];
      const WN = [
        [1, 0],
        [0, 1],
      ];

      const outMean = computeGraphSAGELayer(H0, A, WS, WN, "mean", true, "relu");
      const outMax = computeGraphSAGELayer(H0, A, WS, WN, "max", true, "relu");
      const outSum = computeGraphSAGELayer(H0, A, WS, WN, "sum", false, "relu");

      expect(outMean.length).toBe(3);
      expect(outMax.length).toBe(3);
      expect(outSum.length).toBe(3);

      // Verify L2 normalization: norm = 1.0
      for (let i = 0; i < 3; i++) {
        expect(vectorNorm(outMean[i])).toBeCloseTo(1.0, 6);
        expect(vectorNorm(outMax[i])).toBeCloseTo(1.0, 6);
      }
    });

    it("should compute GAT multi-head attention coefficients that sum exactly to 1.0 (softmax property)", () => {
      const W = [
        [1.0, 0.0],
        [0.0, 1.0],
      ];
      const aSrc = [1.0, 0.5];
      const aDst = [0.5, 1.0];

      const res = computeGATLayer(H0, A, [W, W], [aSrc, aSrc], [aDst, aDst], 2, 0.2, "elu", true);

      expect(res.HOut.length).toBe(3);
      expect(res.HOut[0].length).toBe(4); // 2 heads concatenated of dim 2 = 4
      expect(res.attentionWeights.length).toBe(2); // 2 heads

      // Check attention sum to 1.0 for each head and each node
      for (let h = 0; h < 2; h++) {
        for (let i = 0; i < 3; i++) {
          let alphaSum = 0;
          for (let j = 0; j < 3; j++) {
            alphaSum += res.attentionWeights[h][i][j];
          }
          expect(alphaSum).toBeCloseTo(1.0, 6);
        }
      }
    });

    it("should compute GIN layer with 1-WL expressivity and epsilon parameter", () => {
      const mlp = {
        W1: [
          [1, 0, 0],
          [0, 1, 0],
        ],
        b1: [0, 0, 0],
        W2: [
          [1, 0],
          [0, 1],
          [1, 1],
        ],
        b2: [0, 0],
      };

      const outEps0 = computeGINLayer(H0, A, mlp, 0.0, "relu");
      const outEps1 = computeGINLayer(H0, A, mlp, 0.5, "relu");

      expect(outEps0.length).toBe(3);
      expect(outEps0[0].length).toBe(2);
      expect(outEps1.length).toBe(3);

      // eps > 0 increases weight on self node
      expect(outEps1[0][0]).toBeGreaterThan(outEps0[0][0]);
    });
  });

  // ==========================================================================
  // 7. DIRICHLET ENERGY & OVERSMOOTHING TRAJECTORIES
  // ==========================================================================
  describe("7. Dirichlet Energy & Oversmoothing Analysis", () => {
    it("should compute normalized Dirichlet energy E(H) >= 0", () => {
      const nodes = GNN_PRESETS.cora_subgraph.nodes;
      const edges = GNN_PRESETS.cora_subgraph.edges;
      const map: Record<string, number> = {};
      nodes.forEach((n, i) => {
        map[n.id] = i;
      });

      const A = computeAdjacencyMatrix(nodes.length, edges, map, false);
      const Lsym = computeNormalizedLaplacian(A);
      const H = nodes.map((n) => n.features);

      const energy = computeDirichletEnergy(H, Lsym);
      const unnormEnergy = computeUnnormalizedDirichletEnergy(H, A);

      expect(energy).toBeGreaterThan(0);
      expect(unnormEnergy).toBeGreaterThan(0);
    });

    it("should demonstrate monotonic Dirichlet energy decay under deep GCN without residuals", () => {
      const nodes = GNN_PRESETS.karate_club.nodes;
      const edges = GNN_PRESETS.karate_club.edges;
      const map: Record<string, number> = {};
      nodes.forEach((n, i) => {
        map[n.id] = i;
      });

      const A = computeAdjacencyMatrix(nodes.length, edges, map, false);
      const H0 = nodes.map((n) => n.features);

      // Without residuals: exponential oversmoothing decay
      const noResTraj = simulateLayerTrajectories(H0, A, 8, "gcn", false, false, 1.0);
      expect(noResTraj.length).toBe(9); // Layers 0..8

      const initialE = noResTraj[0].dirichletEnergy;
      const finalE = noResTraj[8].dirichletEnergy;

      // Energy collapses towards 0 as node representations become identical
      expect(finalE).toBeLessThan(initialE * 0.1);

      // With residual connections: energy is preserved
      const withResTraj = simulateLayerTrajectories(H0, A, 8, "gcn", true, false, 1.0);
      const finalWithResE = withResTraj[8].dirichletEnergy;
      expect(finalWithResE).toBeGreaterThan(finalE);
    });

    it("should compute pairwise cosine similarity matrix and distance metrics", () => {
      const H = [
        [1, 0],
        [0, 1],
        [1, 1],
      ];
      const S = computeCosineSimilarityMatrix(H);

      expect(S[0][0]).toBeCloseTo(1.0, 6);
      expect(S[1][1]).toBeCloseTo(1.0, 6);
      expect(S[0][1]).toBeCloseTo(0.0, 6); // Orthogonal

      const avgDist = computeAveragePairwiseCosineDistance(H);
      expect(avgDist).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 8. 1-WL (WEISFEILER-LEHMAN) COLOR REFINEMENT & EXPRESSIVE LIMITS
  // ==========================================================================
  describe("8. 1-WL Color Refinement & Graph Isomorphism Limits", () => {
    it("should distinguish non-isomorphic graphs with different structures (Star vs Path)", () => {
      // Graph 1: Star graph on 4 nodes (center 0 connected to 1, 2, 3)
      const star = {
        nodes: ["0", "1", "2", "3"],
        edges: [
          ["0", "1"],
          ["0", "2"],
          ["0", "3"],
        ] as [string, string][],
      };

      // Graph 2: Path graph on 4 nodes (0 - 1 - 2 - 3)
      const path = {
        nodes: ["a", "b", "c", "d"],
        edges: [
          ["a", "b"],
          ["b", "c"],
          ["c", "d"],
        ] as [string, string][],
      };

      const comparison = compare1WLGraphPair(star, path, 4);
      expect(comparison.isDistinguishable).toBe(true);
      expect(comparison.distinctionStep).toBe(0); // Distinguishable immediately at step 0 by degrees
    });

    it("should reproduce classic 1-WL failure case: Decagon C10 vs Disjoint 2x C5 produce IDENTICAL color histograms", () => {
      // Graph 1: 10-cycle C10
      const c10Nodes = Array.from({ length: 10 }, (_, i) => `c10_${i}`);
      const c10Edges: [string, string][] = Array.from({ length: 10 }, (_, i) => [
        `c10_${i}`,
        `c10_${(i + 1) % 10}`,
      ]);

      // Graph 2: 2 disjoint 5-cycles (2 x C5)
      const p1Nodes = Array.from({ length: 5 }, (_, i) => `p1_${i}`);
      const p2Nodes = Array.from({ length: 5 }, (_, i) => `p2_${i}`);
      const c5_2xNodes = [...p1Nodes, ...p2Nodes];
      const c5_2xEdges: [string, string][] = [
        ...Array.from(
          { length: 5 },
          (_, i) => [`p1_${i}`, `p1_${(i + 1) % 5}`] as [string, string],
        ),
        ...Array.from(
          { length: 5 },
          (_, i) => [`p2_${i}`, `p2_${(i + 1) % 5}`] as [string, string],
        ),
      ];

      const comparison = compare1WLGraphPair(
        { nodes: c10Nodes, edges: c10Edges },
        { nodes: c5_2xNodes, edges: c5_2xEdges },
        5,
      );

      // 1-WL CANNOT distinguish 2-regular graphs with same node count!
      expect(comparison.isDistinguishable).toBe(false);
      expect(comparison.distinctionStep).toBeNull();
      expect(comparison.verdictExplanation).toContain("IDENTICAL color histograms");
    });

    it("should verify color refinement stabilization within N iterations", () => {
      const nodes = ["0", "1", "2", "3", "4"];
      const edges: [string, string][] = [
        ["0", "1"],
        ["1", "2"],
        ["2", "3"],
        ["3", "4"],
      ];

      const res = run1WLColorRefinement(nodes, edges, undefined, 6);
      expect(res.steps.length).toBe(7); // Steps 0..6
      expect(res.stabilizedStep).toBeLessThanOrEqual(5);
    });

    it("should verify color palettes and harmonic color generator utilities", () => {
      const col0 = getWLColorHex("C0");
      const col1 = getWLColorHex("C1");
      expect(col0).toBeDefined();
      expect(col1).toBeDefined();
      expect(col0).not.toBe(col1);

      const harmNeg = getHarmonicColor(-0.5);
      const harmPos = getHarmonicColor(0.5);
      expect(harmNeg.startsWith("rgb")).toBe(true);
      expect(harmPos.startsWith("rgb")).toBe(true);
    });
  });
});
