import { describe, expect, it } from "bun:test";
import React from "react";
import {
  GraphNetworkFlowStudio,
  NETWORK_FLOW_PRESETS,
  FLOW_ALGORITHMS,
  edgeKey,
  computeResidualCapacityMap,
  computeLevelGraphBFS,
  computeMinCutPartition,
  computeFlowTelemetry,
  runDinicAlgorithm,
  runEdmondsKarpAlgorithm,
  runPushRelabelAlgorithm,
  runBellmanFordDijkstra,
  type FlowAlgorithmMode,
  type NetworkFlowPresetId,
} from "../../components/primitives/GraphNetworkFlowStudio";

describe("GraphNetworkFlowStudio & Network Flow Algorithms Test Suite", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & CONFIGURATIONS
  // ==========================================================================
  describe("1. Component Instantiation & Props Configuration", () => {
    it("should instantiate GraphNetworkFlowStudio with default props", () => {
      const element = React.createElement(GraphNetworkFlowStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(GraphNetworkFlowStudio);
    });

    it("should instantiate GraphNetworkFlowStudio with custom props and handlers", () => {
      const onPresetMock = () => {};
      const onAlgorithmMock = () => {};
      const onStepMock = () => {};

      const element = React.createElement(GraphNetworkFlowStudio, {
        initialPreset: "max_flow_bottleneck",
        initialAlgorithm: "dinic",
        initialEdgeLabelMode: "residual",
        width: 1080,
        height: 720,
        standalone: true,
        title: "Max-Flow Min-Cut Dual Workbench",
        onPresetChange: onPresetMock,
        onAlgorithmChange: onAlgorithmMock,
        onStepChange: onStepMock,
      });

      expect(element.props.initialPreset).toBe("max_flow_bottleneck");
      expect(element.props.initialAlgorithm).toBe("dinic");
      expect(element.props.initialEdgeLabelMode).toBe("residual");
      expect(element.props.width).toBe(1080);
      expect(element.props.height).toBe(720);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Max-Flow Min-Cut Dual Workbench");
    });
  });

  // ==========================================================================
  // 2. PRESET DEFINITIONS & GRAPH STRUCTURAL INTEGRITY
  // ==========================================================================
  describe("2. Preset Definitions & Graph Structural Integrity", () => {
    const presetIds: NetworkFlowPresetId[] = [
      "bipartite_matching",
      "max_flow_bottleneck",
      "circulation_with_demands",
      "push_relabel_discharge",
      "negative_cycle_detection",
    ];

    it("should define all 5 required presets with valid metadata", () => {
      for (const id of presetIds) {
        const p = NETWORK_FLOW_PRESETS[id];
        expect(p).toBeDefined();
        expect(p.id).toBe(id);
        expect(p.name).toBeDefined();
        expect(p.description).toBeDefined();
        expect(p.expectedMaxFlow).toBeGreaterThan(0);
        expect(p.expectedMinCutCapacity).toBeGreaterThan(0);
        expect(p.source).toBeDefined();
        expect(p.sink).toBeDefined();
      }
    });

    it("should define all flow algorithm specifications with complexities", () => {
      const algoIds: FlowAlgorithmMode[] = [
        "edmonds_karp",
        "dinic",
        "push_relabel",
        "bellman_ford",
      ];

      for (const id of algoIds) {
        const spec = FLOW_ALGORITHMS[id];
        expect(spec).toBeDefined();
        expect(spec.id).toBe(id);
        expect(spec.name).toBeDefined();
        expect(spec.timeComplexity).toBeDefined();
        expect(spec.spaceComplexity).toBeDefined();
        expect(spec.description).toBeDefined();
      }
    });

    it("should verify node uniqueness and coordinate constraints for each preset", () => {
      for (const id of presetIds) {
        const p = NETWORK_FLOW_PRESETS[id];
        const ids = new Set<string>();

        for (const node of p.nodes) {
          expect(ids.has(node.id)).toBe(false);
          ids.add(node.id);
          expect(node.label).toBeDefined();
          if (node.x !== undefined) expect(node.x).toBeGreaterThanOrEqual(0);
          if (node.y !== undefined) expect(node.y).toBeGreaterThanOrEqual(0);
        }

        expect(ids.has(p.source)).toBe(true);
        expect(ids.has(p.sink)).toBe(true);
      }
    });

    it("should verify edge connectivity and positive capacities for each preset", () => {
      for (const id of presetIds) {
        const p = NETWORK_FLOW_PRESETS[id];
        const nodeIds = new Set(p.nodes.map((n) => n.id));

        for (const edge of p.edges) {
          expect(nodeIds.has(edge.source)).toBe(true);
          expect(nodeIds.has(edge.target)).toBe(true);
          expect(edge.capacity).toBeGreaterThan(0);
        }
      }
    });
  });

  // ==========================================================================
  // 3. EDMONDS-KARP ALGORITHM & AUGMENTING PATH SOLVER
  // ==========================================================================
  describe("3. Edmonds-Karp Algorithm & Augmenting Path Solver", () => {
    it("should compute exact maximum flow for bipartite matching (Flow = 4)", () => {
      const p = NETWORK_FLOW_PRESETS.bipartite_matching;
      const res = runEdmondsKarpAlgorithm(p.nodes, p.edges, p.source, p.sink);

      expect(res.finalFlow).toBe(4);
      expect(res.maxFlow).toBe(4);
      expect(res.steps.length).toBeGreaterThan(2);
      expect(res.telemetry.isConservationSatisfied).toBe(true);
    });

    it("should compute exact maximum flow for bottleneck diamond network (Flow = 14)", () => {
      const p = NETWORK_FLOW_PRESETS.max_flow_bottleneck;
      const res = runEdmondsKarpAlgorithm(p.nodes, p.edges, p.source, p.sink);

      expect(res.finalFlow).toBe(14);
      expect(res.maxFlow).toBe(14);
      expect(res.minCut.minCutCapacity).toBe(14);
    });

    it("should compute exact maximum flow for circulation network (Flow = 10)", () => {
      const p = NETWORK_FLOW_PRESETS.circulation_with_demands;
      const res = runEdmondsKarpAlgorithm(p.nodes, p.edges, p.source, p.sink);

      expect(res.finalFlow).toBe(10);
      expect(res.maxFlow).toBe(10);
    });

    it("should compute exact maximum flow for push-relabel network (Flow = 20)", () => {
      const p = NETWORK_FLOW_PRESETS.push_relabel_discharge;
      const res = runEdmondsKarpAlgorithm(p.nodes, p.edges, p.source, p.sink);

      expect(res.finalFlow).toBe(20);
      expect(res.maxFlow).toBe(20);
    });

    it("should maintain capacity constraints (0 <= f <= c) and flow conservation at all intermediate nodes", () => {
      const p = NETWORK_FLOW_PRESETS.max_flow_bottleneck;
      const res = runEdmondsKarpAlgorithm(p.nodes, p.edges, p.source, p.sink);

      for (const e of p.edges) {
        const flow = res.finalFlowMap[edgeKey(e.source, e.target)] ?? 0;
        expect(flow).toBeGreaterThanOrEqual(0);
        expect(flow).toBeLessThanOrEqual(e.capacity);
      }

      // Conservation check
      for (const node of p.nodes) {
        if (node.id === p.source || node.id === p.sink) continue;
        let inFlow = 0;
        let outFlow = 0;
        for (const e of p.edges) {
          if (e.target === node.id) inFlow += res.finalFlowMap[edgeKey(e.source, e.target)] ?? 0;
          if (e.source === node.id) outFlow += res.finalFlowMap[edgeKey(e.source, e.target)] ?? 0;
        }
        expect(inFlow).toBe(outFlow);
      }
    });
  });

  // ==========================================================================
  // 4. DINIC'S ALGORITHM (LEVEL GRAPH BFS + DFS BLOCKING FLOW)
  // ==========================================================================
  describe("4. Dinic's Algorithm (BFS Level Graph & DFS Blocking Flow)", () => {
    it("should compute exact maximum flow across all flow presets", () => {
      const cases: { id: NetworkFlowPresetId; expected: number }[] = [
        { id: "bipartite_matching", expected: 4 },
        { id: "max_flow_bottleneck", expected: 14 },
        { id: "circulation_with_demands", expected: 10 },
        { id: "push_relabel_discharge", expected: 20 },
      ];

      for (const { id, expected } of cases) {
        const p = NETWORK_FLOW_PRESETS[id];
        const res = runDinicAlgorithm(p.nodes, p.edges, p.source, p.sink);
        expect(res.finalFlow).toBe(expected);
        expect(res.maxFlow).toBe(expected);
        expect(res.minCut.minCutCapacity).toBe(expected);
      }
    });

    it("should generate structured phase traces including BFS level construction and DFS blocking pushes", () => {
      const p = NETWORK_FLOW_PRESETS.max_flow_bottleneck;
      const res = runDinicAlgorithm(p.nodes, p.edges, p.source, p.sink);

      expect(res.steps.length).toBeGreaterThan(0);
      expect(res.minCut.minCutCapacity).toBe(14);
      expect(res.telemetry.isConservationSatisfied).toBe(true);
    });
  });

  // ==========================================================================
  // 5. PUSH-RELABEL (PREFLOW-PUSH) ALGORITHM
  // ==========================================================================
  describe("5. Push-Relabel (Preflow-Push) Algorithm & Invariants", () => {
    it("should compute exact maximum flow matching Edmonds-Karp and Dinic", () => {
      const cases: { id: NetworkFlowPresetId; expected: number }[] = [
        { id: "bipartite_matching", expected: 4 },
        { id: "max_flow_bottleneck", expected: 14 },
        { id: "circulation_with_demands", expected: 10 },
        { id: "push_relabel_discharge", expected: 20 },
      ];

      for (const { id, expected } of cases) {
        const p = NETWORK_FLOW_PRESETS[id];
        const res = runPushRelabelAlgorithm(p.nodes, p.edges, p.source, p.sink);
        expect(res.finalFlow).toBe(expected);
        expect(res.maxFlow).toBe(expected);
        expect(res.minCut.minCutCapacity).toBe(expected);
      }
    });

    it("should verify push and relabel operations in step traces", () => {
      const p = NETWORK_FLOW_PRESETS.push_relabel_discharge;
      const res = runPushRelabelAlgorithm(p.nodes, p.edges, p.source, p.sink);

      expect(res.steps.length).toBeGreaterThan(0);
      expect(res.telemetry.isConservationSatisfied).toBe(true);
      expect(res.maxFlow).toBe(20);
    });
  });

  // ==========================================================================
  // 6. MAX-FLOW MIN-CUT THEOREM DUALITY VERIFICATION
  // ==========================================================================
  describe("6. Max-Flow Min-Cut Theorem Duality (max |f| = min c(S, T))", () => {
    it("should satisfy duality exactly across all flow presets", () => {
      const flowPresets: NetworkFlowPresetId[] = [
        "bipartite_matching",
        "max_flow_bottleneck",
        "circulation_with_demands",
        "push_relabel_discharge",
      ];

      for (const id of flowPresets) {
        const p = NETWORK_FLOW_PRESETS[id];
        const res = runDinicAlgorithm(p.nodes, p.edges, p.source, p.sink);
        const minCut = computeMinCutPartition(p.nodes, p.edges, res.finalFlowMap, p.source);

        // Theorem 1: Max Flow equals Min Cut Capacity
        expect(res.maxFlow).toBe(minCut.minCutCapacity);

        // Theorem 2: Source in S, Sink in T
        expect(minCut.reachableS.includes(p.source)).toBe(true);
        expect(minCut.unreachableT.includes(p.sink)).toBe(true);
        expect(minCut.reachableS.includes(p.sink)).toBe(false);

        // Theorem 3: Partition completeness (S ∪ T = V, S ∩ T = ∅)
        expect(minCut.reachableS.length + minCut.unreachableT.length).toBe(p.nodes.length);
      }
    });
  });

  // ==========================================================================
  // 7. BELLMAN-FORD SHORTEST PATHS & NEGATIVE CYCLE DETECTION
  // ==========================================================================
  describe("7. Bellman-Ford Shortest Paths & Negative Cycle Detection", () => {
    it("should detect the negative cost cycle [C -> D -> E -> C] in negative_cycle_detection preset", () => {
      const p = NETWORK_FLOW_PRESETS.negative_cycle_detection;
      const res = runBellmanFordDijkstra(p.nodes, p.edges, p.source, p.sink);

      expect(res.hasNegativeCycle).toBe(true);
      expect(res.cycleNodes).toBeDefined();
      expect(res.cycleNodes.length).toBeGreaterThan(0);
    });

    it("should compute valid shortest paths and converge without negative cycle on positive graphs", () => {
      const p = NETWORK_FLOW_PRESETS.max_flow_bottleneck;
      const res = runBellmanFordDijkstra(p.nodes, p.edges, p.source, p.sink);

      expect(res.hasNegativeCycle).toBe(false);
      expect(res.distances[p.source]).toBe(0);
      expect(res.distances[p.sink]).toBeDefined();
      expect(res.distances[p.sink]).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 8. RESIDUAL GRAPH & BFS LEVEL COMPUTATION HELPERS
  // ==========================================================================
  describe("8. Residual Graph & BFS Level Computation Helpers", () => {
    it("should compute residual capacities correctly for forward and backward edges", () => {
      const p = NETWORK_FLOW_PRESETS.max_flow_bottleneck;
      const flowMap: Record<string, number> = {};
      flowMap[edgeKey("S", "A")] = 6;

      const res = computeResidualCapacityMap(p.edges, flowMap);
      // Forward residual capacity = 10 - 6 = 4
      expect(res[edgeKey("S", "A")]).toBe(4);
      // Reverse residual capacity = 6
      expect(res[edgeKey("A", "S")]).toBe(6);
    });

    it("should compute correct BFS levels in residual network", () => {
      const p = NETWORK_FLOW_PRESETS.max_flow_bottleneck;
      const flowMap: Record<string, number> = {};
      const levels = computeLevelGraphBFS(p.nodes, p.edges, flowMap, p.source);

      expect(levels.get("S")).toBe(0);
      expect(levels.get("A")).toBe(1);
      expect(levels.get("B")).toBe(1);
      expect(levels.get("C")).toBe(2);
      expect(levels.get("D")).toBe(2);
      expect(levels.get("T")).toBe(3);
    });
  });

  // ==========================================================================
  // 9. FLOW TELEMETRY COMPUTATIONS
  // ==========================================================================
  describe("9. Flow Telemetry Computations", () => {
    it("should compute comprehensive telemetry stats including conservation and saturated edges", () => {
      const p = NETWORK_FLOW_PRESETS.max_flow_bottleneck;
      const res = runDinicAlgorithm(p.nodes, p.edges, p.source, p.sink);
      const tel = computeFlowTelemetry(p.nodes, p.edges, res.finalFlowMap, p.source, p.sink);

      expect(tel.isConservationSatisfied).toBe(true);
      expect(tel.sourceNetOutflow).toBe(14);
      expect(tel.sinkNetInflow).toBe(14);
      expect(tel.minCutCapacity).toBe(14);
      expect(tel.saturatedEdgesCount).toBeGreaterThan(0);
      expect(tel.totalEdgesCount).toBe(p.edges.length);
    });
  });
});
