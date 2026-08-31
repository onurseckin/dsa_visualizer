import { describe, expect, it } from "bun:test";
import React from "react";
import {
  BipartiteMatchingStudio,
  MATCHING_MODALITY_INFOS,
  BIPARTITE_MATCHING_PRESETS,
  runHopcroftKarpAlgorithm,
  runKonigDuality,
  runHungarianAlgorithm,
  runHallConditionScanner,
  type BipartiteStudioModality,
  type BipartitePresetId,
  type BipartiteGraph,
  type BipartiteAnimationStep,
} from "../../components/primitives";

describe("BipartiteMatchingStudio & Dual Combinatorial Matching Suite", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS CONFIGURATION
  // ==========================================================================
  describe("1. Component Instantiation & Props Configuration", () => {
    it("should instantiate BipartiteMatchingStudio with default props", () => {
      const element = React.createElement(BipartiteMatchingStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(BipartiteMatchingStudio);
    });

    it("should instantiate with custom modality, presets, and callbacks", () => {
      const onStepChangeMock = (_step: BipartiteAnimationStep) => {};
      const onModalityChangeMock = (_mod: BipartiteStudioModality) => {};
      const onPresetChangeMock = (_id: BipartitePresetId) => {};

      const element = React.createElement(BipartiteMatchingStudio, {
        initialModality: "hungarian_min_cost_assignment",
        initialPreset: "cost_matrix_4x4",
        standalone: true,
        title: "Assignment Optimization Lab",
        onStepChange: onStepChangeMock,
        onModalityChange: onModalityChangeMock,
        onPresetChange: onPresetChangeMock,
      });

      expect(element.props.initialModality).toBe("hungarian_min_cost_assignment");
      expect(element.props.initialPreset).toBe("cost_matrix_4x4");
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Assignment Optimization Lab");
      expect(element.props.onStepChange).toBe(onStepChangeMock);
      expect(element.props.onModalityChange).toBe(onModalityChangeMock);
      expect(element.props.onPresetChange).toBe(onPresetChangeMock);
    });

    it("should accept custom bipartite graph props", () => {
      const customGraph: BipartiteGraph = {
        id: "custom_2x2",
        name: "Custom 2x2 Graph",
        description: "Small test bipartite graph",
        leftNodes: [
          { id: "A", label: "A", partition: "L", index: 0 },
          { id: "B", label: "B", partition: "L", index: 1 },
        ],
        rightNodes: [
          { id: "1", label: "1", partition: "R", index: 0 },
          { id: "2", label: "2", partition: "R", index: 1 },
        ],
        edges: [
          { id: "A-1", source: "A", target: "1", cost: 3 },
          { id: "A-2", source: "A", target: "2", cost: 5 },
          { id: "B-1", source: "B", target: "1", cost: 2 },
          { id: "B-2", source: "B", target: "2", cost: 4 },
        ],
      };

      const element = React.createElement(BipartiteMatchingStudio, {
        customGraph,
      });

      expect(element.props.customGraph).toBe(customGraph);
    });
  });

  // ==========================================================================
  // 2. PRESETS INTEGRITY & DOMAIN INVARIANTS
  // ==========================================================================
  describe("2. Presets Integrity & Domain Invariants", () => {
    const presetIds: BipartitePresetId[] = [
      "classic_job_assignment",
      "dense_bipartite_complete",
      "hall_violator_contracting",
      "hopcroft_karp_multi_layer",
      "cost_matrix_4x4",
      "k44_symmetric_assignment",
    ];

    it("should contain all required presets in BIPARTITE_MATCHING_PRESETS", () => {
      for (const id of presetIds) {
        const preset = BIPARTITE_MATCHING_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.theoryNotes.length).toBeGreaterThan(0);
        expect(preset.tags.length).toBeGreaterThan(0);
        expect(preset.graph.leftNodes.length).toBeGreaterThan(0);
        expect(preset.graph.rightNodes.length).toBeGreaterThan(0);
        expect(preset.graph.edges.length).toBeGreaterThan(0);
      }
    });

    it("should enforce valid bipartite node partitions and edge endpoints", () => {
      for (const id of presetIds) {
        const preset = BIPARTITE_MATCHING_PRESETS[id];
        const leftIds = new Set(preset.graph.leftNodes.map((n) => n.id));
        const rightIds = new Set(preset.graph.rightNodes.map((n) => n.id));

        // Partitions must be disjoint
        for (const lid of leftIds) {
          expect(rightIds.has(lid)).toBe(false);
        }

        // All nodes have valid partition attributes
        for (const n of preset.graph.leftNodes) {
          expect(n.partition).toBe("L");
        }
        for (const n of preset.graph.rightNodes) {
          expect(n.partition).toBe("R");
        }

        // All edges must bridge Left to Right
        for (const edge of preset.graph.edges) {
          expect(leftIds.has(edge.source)).toBe(true);
          expect(rightIds.has(edge.target)).toBe(true);
        }
      }
    });

    it("should provide valid modality configurations", () => {
      const modalities: BipartiteStudioModality[] = [
        "hopcroft_karp_matching",
        "konig_min_vertex_cover",
        "hungarian_min_cost_assignment",
        "hall_marriage_condition",
      ];

      for (const m of modalities) {
        const config = MATCHING_MODALITY_INFOS[m];
        expect(config).toBeDefined();
        expect(config.id).toBe(m);
        expect(config.title.length).toBeGreaterThan(0);
        expect(config.subtitle.length).toBeGreaterThan(0);
        expect(config.theory.length).toBeGreaterThan(0);
        expect(config.complexity.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // 3. HOPCROFT-KARP ALGORITHM CORRECTNESS
  // ==========================================================================
  describe("3. Hopcroft-Karp Algorithm Correctness", () => {
    it("should find maximum matching of size 4 on classic_job_assignment", () => {
      const graph = BIPARTITE_MATCHING_PRESETS.classic_job_assignment.graph;
      const result = runHopcroftKarpAlgorithm(graph);

      expect(result.cardinality).toBe(4);
      expect(result.matching.size).toBe(4);

      // Verify each left node is matched to a distinct right node
      const matchedRight = new Set<string>();
      for (const [u, v] of result.matching.entries()) {
        expect(graph.leftNodes.some((n) => n.id === u)).toBe(true);
        expect(graph.rightNodes.some((n) => n.id === v)).toBe(true);
        expect(matchedRight.has(v)).toBe(false);
        matchedRight.add(v);
      }
    });

    it("should find perfect matching of size 5 on complete K5,5", () => {
      const graph = BIPARTITE_MATCHING_PRESETS.dense_bipartite_complete.graph;
      const result = runHopcroftKarpAlgorithm(graph);

      expect(result.cardinality).toBe(5);
      expect(result.matching.size).toBe(5);
    });

    it("should detect cardinality bottleneck (size 3) on hall_violator_contracting", () => {
      const graph = BIPARTITE_MATCHING_PRESETS.hall_violator_contracting.graph;
      const result = runHopcroftKarpAlgorithm(graph);

      expect(result.cardinality).toBe(3);
      expect(result.matching.size).toBe(3);
    });

    it("should correctly step through layered BFS and DFS augmentations", () => {
      const graph = BIPARTITE_MATCHING_PRESETS.hopcroft_karp_multi_layer.graph;
      const result = runHopcroftKarpAlgorithm(graph);

      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps[0].action).toBe("init");

      const hasBFS = result.steps.some(
        (s) => s.action === "hk_bfs_start" || s.action === "hk_bfs_sink_reached",
      );
      const hasAugment = result.steps.some((s) => s.action === "hk_dfs_augment");
      const hasComplete = result.steps.some((s) => s.action === "hk_complete");

      expect(hasBFS).toBe(true);
      expect(hasAugment).toBe(true);
      expect(hasComplete).toBe(true);
    });
  });

  // ==========================================================================
  // 4. KÖNIG'S THEOREM DUALITY VERIFICATION
  // ==========================================================================
  describe("4. König's Theorem Duality Verification", () => {
    it("should verify |M| = |MVC| and |MIS| = |V| - |MVC| on all presets", () => {
      const presets = Object.values(BIPARTITE_MATCHING_PRESETS);

      for (const preset of presets) {
        const graph = preset.graph;
        const totalV = graph.leftNodes.length + graph.rightNodes.length;

        const konig = runKonigDuality(graph);

        // 1. Cardinality equality |M| == |MVC|
        expect(konig.mvc.size).toBe(konig.matching.size);

        // 2. Gallai identity |MIS| == |V| - |MVC|
        expect(konig.mis.size).toBe(totalV - konig.mvc.size);

        // 3. MVC & MIS are disjoint and partition V
        for (const node of konig.mvc) {
          expect(konig.mis.has(node)).toBe(false);
        }

        // 4. Every edge is covered by MVC (at least one endpoint in MVC)
        for (const edge of graph.edges) {
          const uInMVC = konig.mvc.has(edge.source);
          const vInMVC = konig.mvc.has(edge.target);
          expect(uInMVC || vInMVC).toBe(true);
        }

        // 5. Independent Set property (no edge has both endpoints in MIS)
        for (const edge of graph.edges) {
          const uInMIS = konig.mis.has(edge.source);
          const vInMIS = konig.mis.has(edge.target);
          expect(uInMIS && vInMIS).toBe(false);
        }
      }
    });

    it("should verify König duality sets on k44_symmetric_assignment", () => {
      const graph = BIPARTITE_MATCHING_PRESETS.k44_symmetric_assignment.graph;
      const konig = runKonigDuality(graph);

      expect(konig.matching.size).toBe(3);
      expect(konig.mvc.size).toBe(3);
      expect(konig.mis.size).toBe(8 - 3); // 5

      const verifiedStep = konig.steps.find((s) => s.action === "konig_verified");
      expect(verifiedStep).toBeDefined();
      expect(verifiedStep?.telemetry.isOptimal).toBe(true);
    });
  });

  // ==========================================================================
  // 5. HUNGARIAN ALGORITHM (KUHN-MUNKRES) CORRECTNESS
  // ==========================================================================
  describe("5. Hungarian Algorithm (Kuhn-Munkres) Correctness", () => {
    it("should find optimal minimum cost 13 on classic_job_assignment", () => {
      const graph = BIPARTITE_MATCHING_PRESETS.classic_job_assignment.graph;
      const result = runHungarianAlgorithm(graph);

      expect(result.assignment.size).toBe(4);
      expect(result.minCost).toBe(13);

      // Verify specific optimal assignment: W1->J2(2), W2->J1(6), W3->J3(1), W4->J4(4)
      expect(result.assignment.get("W1")).toBe("J2");
      expect(result.assignment.get("W2")).toBe("J1");
      expect(result.assignment.get("W3")).toBe("J3");
      expect(result.assignment.get("W4")).toBe("J4");
    });

    it("should satisfy dual feasibility u_i + v_j <= c_ij and complementary slackness", () => {
      const graph = BIPARTITE_MATCHING_PRESETS.classic_job_assignment.graph;
      const result = runHungarianAlgorithm(graph);

      // Check dual feasibility for all edges
      for (const edge of graph.edges) {
        const u = result.uPotentials[edge.source];
        const v = result.vPotentials[edge.target];
        const cost = edge.cost ?? 0;
        expect(u + v).toBeLessThanOrEqual(cost + 1e-9);
      }

      // Check complementary slackness on matched edges: u_i + v_j == c_ij
      let dualSum = 0;
      for (const [uNode, vNode] of result.assignment.entries()) {
        const edge = graph.edges.find((e) => e.source === uNode && e.target === vNode);
        expect(edge).toBeDefined();

        const u = result.uPotentials[uNode];
        const v = result.vPotentials[vNode];
        expect(u + v).toBe(edge!.cost!);
        dualSum += u + v;
      }

      // Primal-dual cost equality
      expect(result.minCost).toBe(dualSum);
    });

    it("should solve Kuhn-Munkres benchmark cost_matrix_4x4", () => {
      const graph = BIPARTITE_MATCHING_PRESETS.cost_matrix_4x4.graph;
      const result = runHungarianAlgorithm(graph);

      expect(result.assignment.size).toBe(4);
      expect(result.minCost).toBeGreaterThan(0);

      // Verify dual equality
      let sumPotentials = 0;
      for (const u of graph.leftNodes) sumPotentials += result.uPotentials[u.id];
      for (const v of graph.rightNodes) sumPotentials += result.vPotentials[v.id];
      expect(result.minCost).toBe(sumPotentials);
    });
  });

  // ==========================================================================
  // 6. HALL'S MARRIAGE CONDITION SCANNER
  // ==========================================================================
  describe("6. Hall's Marriage Condition Scanner", () => {
    it("should confirm Hall condition holds on classic_job_assignment", () => {
      const graph = BIPARTITE_MATCHING_PRESETS.classic_job_assignment.graph;
      const scan = runHallConditionScanner(graph);

      expect(scan.satisfied).toBe(true);
      expect(scan.maxDefect).toBe(0);
      expect(scan.violatorSubset).toBeUndefined();

      // All 2^4 - 1 = 15 non-empty subsets satisfy |N(S)| >= |S|
      expect(scan.allSubsets.length).toBe(15);
      for (const s of scan.allSubsets) {
        expect(s.satisfied).toBe(true);
        expect(s.defect).toBeLessThanOrEqual(0);
      }
    });

    it("should detect contracting violator bottleneck on hall_violator_contracting", () => {
      const graph = BIPARTITE_MATCHING_PRESETS.hall_violator_contracting.graph;
      const scan = runHallConditionScanner(graph);

      expect(scan.satisfied).toBe(false);
      expect(scan.maxDefect).toBe(1);
      expect(scan.violatorSubset).toBeDefined();

      // Violator subset {L1, L2, L3} has neighborhood {R1, R2} of size 2 < 3
      const violator = scan.allSubsets.find(
        (s) => s.subset.length === 3 && s.neighborhood.length === 2,
      );
      expect(violator).toBeDefined();
      expect(violator?.defect).toBe(1);

      // König-Ore formula: max matching = |L| - max_defect = 4 - 1 = 3
      const hk = runHopcroftKarpAlgorithm(graph);
      expect(hk.cardinality).toBe(graph.leftNodes.length - scan.maxDefect);
    });
  });

  // ==========================================================================
  // 7. STEP GENERATOR SNAPSHOTS & TRACE INTEGRITY
  // ==========================================================================
  describe("7. Step Generator Snapshots & Trace Integrity", () => {
    it("should produce strictly contiguous step indices and valid telemetry", () => {
      const graph = BIPARTITE_MATCHING_PRESETS.classic_job_assignment.graph;
      const modalities: BipartiteStudioModality[] = [
        "hopcroft_karp_matching",
        "konig_min_vertex_cover",
        "hungarian_min_cost_assignment",
        "hall_marriage_condition",
      ];

      for (const mod of modalities) {
        let steps: BipartiteAnimationStep[];
        if (mod === "hopcroft_karp_matching") steps = runHopcroftKarpAlgorithm(graph).steps;
        else if (mod === "konig_min_vertex_cover") steps = runKonigDuality(graph).steps;
        else if (mod === "hungarian_min_cost_assignment")
          steps = runHungarianAlgorithm(graph).steps;
        else steps = runHallConditionScanner(graph).steps;

        expect(steps.length).toBeGreaterThan(0);

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          expect(step.stepIndex).toBe(i);
          expect(step.modality).toBe(mod);
          expect(step.title.length).toBeGreaterThan(0);
          expect(step.description.length).toBeGreaterThan(0);
          expect(step.telemetry).toBeDefined();
          expect(typeof step.telemetry.cardinality).toBe("number");
        }
      }
    });
  });
});
