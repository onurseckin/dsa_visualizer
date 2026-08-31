import { describe, expect, it } from "bun:test";
import React from "react";
import {
  TarjanSCC2SATStudio,
  SCC_PALETTE,
  TARJAN_MODALITY_CONFIGS,
  TARJAN_2SAT_PRESETS,
  runTarjanSCC,
  findBridgesAndArticulationPoints,
  buildCondensationGraph,
  parse2SATFormula,
  build2SATImplicationGraph,
  solve2SAT,
  evaluate2SATFormula,
  generateTarjanSteps,
  negate2SATLiteral,
  format2SATLiteral,
  format2SATClause,
  format2SATFormula,
  type TarjanStudioModality,
  type TarjanPresetId,
  type TarjanGraph,
  type TwoSATFormula,
  type TarjanAnimationStep,
} from "../../components/primitives";

describe("TarjanSCC2SATStudio & Graph Low-Link / 2-SAT Suite Tests", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS CONFIGURATION
  // ==========================================================================
  describe("1. Component Instantiation & Props Configuration", () => {
    it("should instantiate TarjanSCC2SATStudio with default props", () => {
      const element = React.createElement(TarjanSCC2SATStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(TarjanSCC2SATStudio);
    });

    it("should instantiate TarjanSCC2SATStudio with custom modalities, presets, and callbacks", () => {
      const onStepChangeMock = (_step: TarjanAnimationStep) => {};
      const onModalityChangeMock = (_mod: TarjanStudioModality) => {};
      const onPresetChangeMock = (_id: TarjanPresetId) => {};

      const element = React.createElement(TarjanSCC2SATStudio, {
        initialModality: "two_sat_implication_engine",
        initialPreset: "twosat_satisfiable_3var",
        standalone: true,
        title: "Custom 2-SAT Laboratory",
        onStepChange: onStepChangeMock,
        onModalityChange: onModalityChangeMock,
        onPresetChange: onPresetChangeMock,
      });

      expect(element.props.initialModality).toBe("two_sat_implication_engine");
      expect(element.props.initialPreset).toBe("twosat_satisfiable_3var");
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Custom 2-SAT Laboratory");
      expect(element.props.onStepChange).toBe(onStepChangeMock);
      expect(element.props.onModalityChange).toBe(onModalityChangeMock);
      expect(element.props.onPresetChange).toBe(onPresetChangeMock);
    });

    it("should accept custom graph and custom 2-SAT formula props", () => {
      const customGraph: TarjanGraph = {
        id: "test_g",
        name: "Test Graph",
        description: "Small test",
        directed: true,
        nodes: [
          { id: "1", label: "1", x: 10, y: 10 },
          { id: "2", label: "2", x: 20, y: 20 },
        ],
        edges: [{ id: "e12", source: "1", target: "2", directed: true }],
      };

      const customFormula: TwoSATFormula = parse2SATFormula("(X | Y) & (~X | ~Y)");

      const element = React.createElement(TarjanSCC2SATStudio, {
        customGraph,
        custom2SATFormula: customFormula,
      });

      expect(element.props.customGraph).toBe(customGraph);
      expect(element.props.custom2SATFormula).toBe(customFormula);
    });
  });

  // ==========================================================================
  // 2. PRESETS INTEGRITY & DOMAIN INVARIANTS
  // ==========================================================================
  describe("2. Presets Integrity & Domain Invariants", () => {
    const presetIds: TarjanPresetId[] = [
      "scc_classic_kosaraju_tarjan",
      "scc_interconnected_rings",
      "scc_dag_chain_diamonds",
      "scc_dense_strongly_connected",
      "bridges_bowtie_graph",
      "bridges_tree_articulations",
      "bridges_cycle_with_antennas",
      "twosat_satisfiable_3var",
      "twosat_unsatisfiable_contradiction",
      "twosat_graph_coloring_scheduling",
      "twosat_pigeonhole_conflict",
    ];

    it("should contain all 11 presets with valid metadata", () => {
      for (const id of presetIds) {
        const preset = TARJAN_2SAT_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.subtitle.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.theoryNotes.length).toBeGreaterThan(0);
        expect(preset.tags.length).toBeGreaterThan(0);
        expect(preset.defaultModality).toBeDefined();

        if (preset.graph) {
          expect(preset.graph.nodes.length).toBeGreaterThan(0);
          expect(preset.graph.edges.length).toBeGreaterThan(0);
        }
        if (preset.twoSATFormula) {
          expect(preset.twoSATFormula.variables.length).toBeGreaterThan(0);
          expect(preset.twoSATFormula.clauses.length).toBeGreaterThan(0);
        }
      }
    });

    it("should provide valid modality configs for all 4 modalities", () => {
      const modalities: TarjanStudioModality[] = [
        "tarjan_scc_discovery",
        "bridges_and_articulation_points",
        "scc_dag_condensation",
        "two_sat_implication_engine",
      ];

      for (const mod of modalities) {
        const config = TARJAN_MODALITY_CONFIGS[mod];
        expect(config).toBeDefined();
        expect(config.title.length).toBeGreaterThan(0);
        expect(config.subtitle.length).toBeGreaterThan(0);
        expect(config.theory.length).toBeGreaterThan(0);
        expect(config.badgeColor.length).toBeGreaterThan(0);
        expect(config.iconName.length).toBeGreaterThan(0);
      }
    });

    it("should define a rich palette with at least 10 distinct hex colors", () => {
      expect(SCC_PALETTE.length).toBeGreaterThanOrEqual(10);
      const uniqueColors = new Set(SCC_PALETTE);
      expect(uniqueColors.size).toBe(SCC_PALETTE.length);
    });
  });

  // ==========================================================================
  // 3. PURE TARJAN SCC ALGORITHM TESTS
  // ==========================================================================
  describe("3. Pure Tarjan SCC Algorithm Correctness", () => {
    it("should decompose single vertex graph into 1 singleton SCC", () => {
      const graph: TarjanGraph = {
        id: "single",
        name: "Single Node",
        description: "",
        directed: true,
        nodes: [{ id: "A", label: "A", x: 0, y: 0 }],
        edges: [],
      };

      const result = runTarjanSCC(graph);
      expect(result.sccCount).toBe(1);
      expect(result.sccList).toEqual([["A"]]);
      expect(result.nodeToSccIndex["A"]).toBe(0);
      expect(result.tin["A"]).toBe(1);
      expect(result.low["A"]).toBe(1);
    });

    it("should handle isolated vertices with 0 edges", () => {
      const graph: TarjanGraph = {
        id: "isolated",
        name: "Isolated",
        description: "",
        directed: true,
        nodes: [
          { id: "A", label: "A", x: 0, y: 0 },
          { id: "B", label: "B", x: 10, y: 10 },
          { id: "C", label: "C", x: 20, y: 20 },
        ],
        edges: [],
      };

      const result = runTarjanSCC(graph);
      expect(result.sccCount).toBe(3);
      expect(result.sccList.length).toBe(3);
    });

    it("should correctly identify SCCs in classic textbook 3-component graph", () => {
      const graph = TARJAN_2SAT_PRESETS.scc_classic_kosaraju_tarjan.graph!;
      const result = runTarjanSCC(graph);

      expect(result.sccCount).toBe(3);

      // Components should partition {A, B, C}, {D, E}, and {F, G, H}
      const sccSets = result.sccList.map((c) => new Set(c));

      const hasABC = sccSets.some((s) => s.has("A") && s.has("B") && s.has("C") && s.size === 3);
      const hasDE = sccSets.some((s) => s.has("D") && s.has("E") && s.size === 2);
      const hasFGH = sccSets.some((s) => s.has("F") && s.has("G") && s.has("H") && s.size === 3);

      expect(hasABC).toBe(true);
      expect(hasDE).toBe(true);
      expect(hasFGH).toBe(true);

      // Verify node mapping consistency
      expect(result.nodeToSccIndex["A"]).toBe(result.nodeToSccIndex["B"]);
      expect(result.nodeToSccIndex["B"]).toBe(result.nodeToSccIndex["C"]);
      expect(result.nodeToSccIndex["D"]).toBe(result.nodeToSccIndex["E"]);
      expect(result.nodeToSccIndex["F"]).toBe(result.nodeToSccIndex["G"]);
      expect(result.nodeToSccIndex["G"]).toBe(result.nodeToSccIndex["H"]);
      expect(result.nodeToSccIndex["A"]).not.toBe(result.nodeToSccIndex["D"]);
      expect(result.nodeToSccIndex["D"]).not.toBe(result.nodeToSccIndex["F"]);
    });

    it("should identify every node as its own SCC on a pure DAG", () => {
      const graph = TARJAN_2SAT_PRESETS.scc_dag_chain_diamonds.graph!;
      const result = runTarjanSCC(graph);

      expect(result.sccCount).toBe(graph.nodes.length);
      for (const scc of result.sccList) {
        expect(scc.length).toBe(1);
      }
    });

    it("should identify 1 single massive SCC on a dense strongly connected graph", () => {
      const graph = TARJAN_2SAT_PRESETS.scc_dense_strongly_connected.graph!;
      const result = runTarjanSCC(graph);

      expect(result.sccCount).toBe(1);
      expect(result.sccList[0]?.length).toBe(graph.nodes.length);
    });

    it("should handle self-loops correctly as a 1-node cycle", () => {
      const graph: TarjanGraph = {
        id: "self_loop",
        name: "Self Loop",
        description: "",
        directed: true,
        nodes: [
          { id: "1", label: "1", x: 0, y: 0 },
          { id: "2", label: "2", x: 10, y: 10 },
        ],
        edges: [
          { id: "e11", source: "1", target: "1", directed: true },
          { id: "e12", source: "1", target: "2", directed: true },
        ],
      };

      const result = runTarjanSCC(graph);
      expect(result.sccCount).toBe(2);
    });

    it("should handle disconnected graphs with multiple cycle components", () => {
      const graph: TarjanGraph = {
        id: "disconnected_cycles",
        name: "Two Disconnected Cycles",
        description: "",
        directed: true,
        nodes: [
          { id: "A", label: "A", x: 0, y: 0 },
          { id: "B", label: "B", x: 10, y: 0 },
          { id: "X", label: "X", x: 100, y: 0 },
          { id: "Y", label: "Y", x: 110, y: 0 },
        ],
        edges: [
          { id: "e_ab", source: "A", target: "B", directed: true },
          { id: "e_ba", source: "B", target: "A", directed: true },
          { id: "e_xy", source: "X", target: "Y", directed: true },
          { id: "e_yx", source: "Y", target: "X", directed: true },
        ],
      };

      const result = runTarjanSCC(graph);
      expect(result.sccCount).toBe(2);
      expect(result.nodeToSccIndex["A"]).toBe(result.nodeToSccIndex["B"]);
      expect(result.nodeToSccIndex["X"]).toBe(result.nodeToSccIndex["Y"]);
      expect(result.nodeToSccIndex["A"]).not.toBe(result.nodeToSccIndex["X"]);
    });
  });

  // ==========================================================================
  // 4. BRIDGES & ARTICULATION POINTS DETECTION TESTS
  // ==========================================================================
  describe("4. Bridges & Articulation Points Detection", () => {
    it("should find exactly 1 bridge and 2 cut vertices in the Bowtie / Barbell graph", () => {
      const graph = TARJAN_2SAT_PRESETS.bridges_bowtie_graph.graph!;
      const result = findBridgesAndArticulationPoints(graph);

      // Edge C-E is the bridge
      expect(result.bridges.length).toBe(1);
      const bridge = result.bridges[0];
      expect(bridge).toBeDefined();
      expect(
        (bridge!.u === "C" && bridge!.v === "E") || (bridge!.u === "E" && bridge!.v === "C"),
      ).toBe(true);

      // C and E are articulation points
      expect(result.articulationPoints.length).toBe(2);
      expect(result.articulationPoints).toContain("C");
      expect(result.articulationPoints).toContain("E");
    });

    it("should identify all edges as bridges and all internal nodes as cut vertices on a tree", () => {
      const graph = TARJAN_2SAT_PRESETS.bridges_tree_articulations.graph!;
      const result = findBridgesAndArticulationPoints(graph);

      // In a tree with N vertices, all N - 1 edges are bridges
      expect(result.bridges.length).toBe(graph.edges.length);

      // Internal vertices: R, A, B
      expect(result.articulationPoints).toContain("R");
      expect(result.articulationPoints).toContain("A");
      expect(result.articulationPoints).toContain("B");

      // Leaves should NOT be articulation points
      expect(result.articulationPoints).not.toContain("A1");
      expect(result.articulationPoints).not.toContain("A2");
      expect(result.articulationPoints).not.toContain("B1");
      expect(result.articulationPoints).not.toContain("B2");
    });

    it("should identify 3 antenna bridges and 3 cut vertices on cycle with antenna leaves", () => {
      const graph = TARJAN_2SAT_PRESETS.bridges_cycle_with_antennas.graph!;
      const result = findBridgesAndArticulationPoints(graph);

      expect(result.bridges.length).toBe(3);
      // Attachment nodes C1, C2, C4 should be cut vertices
      expect(result.articulationPoints).toContain("C1");
      expect(result.articulationPoints).toContain("C2");
      expect(result.articulationPoints).toContain("C4");

      // C3 is on the cycle with no antenna attached, so it is not an articulation point
      expect(result.articulationPoints).not.toContain("C3");
    });

    it("should find 0 bridges and 0 articulation points in a pure cycle graph (K3 / Triangle)", () => {
      const graph: TarjanGraph = {
        id: "triangle",
        name: "Triangle",
        description: "",
        directed: false,
        nodes: [
          { id: "1", label: "1", x: 0, y: 0 },
          { id: "2", label: "2", x: 10, y: 0 },
          { id: "3", label: "3", x: 5, y: 10 },
        ],
        edges: [
          { id: "e12", source: "1", target: "2", directed: false },
          { id: "e23", source: "2", target: "3", directed: false },
          { id: "e31", source: "3", target: "1", directed: false },
        ],
      };

      const result = findBridgesAndArticulationPoints(graph);
      expect(result.bridges.length).toBe(0);
      expect(result.articulationPoints.length).toBe(0);
    });

    it("should find 0 bridges and 0 articulation points in a complete graph K4", () => {
      const graph: TarjanGraph = {
        id: "k4",
        name: "K4 Complete",
        description: "",
        directed: false,
        nodes: [
          { id: "1", label: "1", x: 0, y: 0 },
          { id: "2", label: "2", x: 10, y: 0 },
          { id: "3", label: "3", x: 10, y: 10 },
          { id: "4", label: "4", x: 0, y: 10 },
        ],
        edges: [
          { id: "e12", source: "1", target: "2", directed: false },
          { id: "e13", source: "1", target: "3", directed: false },
          { id: "e14", source: "1", target: "4", directed: false },
          { id: "e23", source: "2", target: "3", directed: false },
          { id: "e24", source: "2", target: "4", directed: false },
          { id: "e34", source: "3", target: "4", directed: false },
        ],
      };

      const result = findBridgesAndArticulationPoints(graph);
      expect(result.bridges.length).toBe(0);
      expect(result.articulationPoints.length).toBe(0);
    });

    it("should detect single edge as bridge but neither endpoint as cut vertex", () => {
      const graph: TarjanGraph = {
        id: "two_node_bridge",
        name: "A - B",
        description: "",
        directed: false,
        nodes: [
          { id: "A", label: "A", x: 0, y: 0 },
          { id: "B", label: "B", x: 10, y: 0 },
        ],
        edges: [{ id: "e_ab", source: "A", target: "B", directed: false }],
      };

      const result = findBridgesAndArticulationPoints(graph);
      expect(result.bridges.length).toBe(1);
      expect(result.articulationPoints.length).toBe(0);
    });
  });

  // ==========================================================================
  // 5. CONDENSATION DAG GENERATION & TOPOLOGICAL SORT TESTS
  // ==========================================================================
  describe("5. Condensation DAG Generation & Topological Sort", () => {
    it("should condense 3-SCC graph into a 3-node DAG with valid topological order", () => {
      const graph = TARJAN_2SAT_PRESETS.scc_classic_kosaraju_tarjan.graph!;
      const sccResult = runTarjanSCC(graph);
      const cond = buildCondensationGraph(graph, sccResult);

      expect(cond.isDAG).toBe(true);
      expect(cond.nodes.length).toBe(3);
      expect(cond.topologicalOrder.length).toBe(3);

      // Total members across super-nodes must equal original vertex count
      const totalMembers = cond.nodes.reduce((acc, n) => acc + n.members.length, 0);
      expect(totalMembers).toBe(graph.nodes.length);

      // Verify that topological order has no reverse edge violations
      const rankMap: Record<string, number> = {};
      cond.topologicalOrder.forEach((id, index) => {
        rankMap[id] = index;
      });

      for (const edge of cond.edges) {
        expect(rankMap[edge.source]!).toBeLessThan(rankMap[edge.target]!);
      }
    });

    it("should collapse dense 1-SCC graph into a single super-node with 0 inter-component edges", () => {
      const graph = TARJAN_2SAT_PRESETS.scc_dense_strongly_connected.graph!;
      const sccResult = runTarjanSCC(graph);
      const cond = buildCondensationGraph(graph, sccResult);

      expect(cond.nodes.length).toBe(1);
      expect(cond.edges.length).toBe(0);
      expect(cond.topologicalOrder).toEqual(["C0"]);
      expect(cond.nodes[0]?.members.length).toBe(graph.nodes.length);
    });

    it("should deduplicate multiple parallel inter-component edges", () => {
      const graph: TarjanGraph = {
        id: "multi_bridge",
        name: "Multi Bridge",
        description: "",
        directed: true,
        nodes: [
          { id: "A1", label: "A1", x: 0, y: 0 },
          { id: "A2", label: "A2", x: 0, y: 10 },
          { id: "B1", label: "B1", x: 20, y: 0 },
          { id: "B2", label: "B2", x: 20, y: 10 },
        ],
        edges: [
          // SCC A: A1 <-> A2
          { id: "e_a1a2", source: "A1", target: "A2", directed: true },
          { id: "e_a2a1", source: "A2", target: "A1", directed: true },
          // SCC B: B1 <-> B2
          { id: "e_b1b2", source: "B1", target: "B2", directed: true },
          { id: "e_b2b1", source: "B2", target: "B1", directed: true },
          // Multiple edges from SCC A to SCC B
          { id: "e_a1b1", source: "A1", target: "B1", directed: true },
          { id: "e_a2b2", source: "A2", target: "B2", directed: true },
        ],
      };

      const sccResult = runTarjanSCC(graph);
      expect(sccResult.sccCount).toBe(2);

      const cond = buildCondensationGraph(graph, sccResult);
      expect(cond.nodes.length).toBe(2);
      expect(cond.edges.length).toBe(1); // Deduplicated to 1 super edge
      expect(cond.edges[0]?.originalEdges.length).toBe(2);
    });
  });

  // ==========================================================================
  // 6. 2-SAT FORMULA PARSING & UTILITIES TESTS
  // ==========================================================================
  describe("6. 2-SAT Formula Parsing & Formatting", () => {
    it("should parse standard 2-CNF formulas with various syntax styles", () => {
      const f1 = parse2SATFormula("(A | B) & (~A | C) & (~B | ~C)");
      expect(f1.variables).toEqual(["A", "B", "C"]);
      expect(f1.clauses.length).toBe(3);

      expect(f1.clauses[0]?.literalA).toEqual({ name: "A", negated: false });
      expect(f1.clauses[0]?.literalB).toEqual({ name: "B", negated: false });
      expect(f1.clauses[1]?.literalA).toEqual({ name: "A", negated: true });
      expect(f1.clauses[1]?.literalB).toEqual({ name: "C", negated: false });
      expect(f1.clauses[2]?.literalA).toEqual({ name: "B", negated: true });
      expect(f1.clauses[2]?.literalB).toEqual({ name: "C", negated: true });
    });

    it("should parse unit clauses converting them into (X v X)", () => {
      const f = parse2SATFormula("A, ~B");
      expect(f.variables).toEqual(["A", "B"]);
      expect(f.clauses.length).toBe(2);
      expect(f.clauses[0]?.literalA).toEqual({ name: "A", negated: false });
      expect(f.clauses[0]?.literalB).toEqual({ name: "A", negated: false });
      expect(f.clauses[1]?.literalA).toEqual({ name: "B", negated: true });
      expect(f.clauses[1]?.literalB).toEqual({ name: "B", negated: true });
    });

    it("should format literals, clauses, and formulas cleanly", () => {
      const litA = { name: "X", negated: false };
      const litNotA = negate2SATLiteral(litA);

      expect(format2SATLiteral(litA)).toBe("X");
      expect(format2SATLiteral(litNotA)).toBe("¬X");

      const clause = { id: "c1", literalA: litA, literalB: litNotA };
      expect(format2SATClause(clause)).toBe("(X ∨ ¬X)");

      const formula = { variables: ["X"], clauses: [clause] };
      expect(format2SATFormula(formula)).toBe("(X ∨ ¬X)");

      expect(format2SATFormula({ variables: [], clauses: [] })).toBe("∅");
    });
  });

  // ==========================================================================
  // 7. 2-SAT IMPLICATION GRAPH & SOLVER TESTS
  // ==========================================================================
  describe("7. 2-SAT Implication Graph & Satisfiability Engine", () => {
    it("should construct directed implication graph with (~A -> B) and (~B -> A)", () => {
      const formula = parse2SATFormula("(A | B)");
      const imp = build2SATImplicationGraph(formula.variables, formula.clauses);

      expect(imp.graph.nodes.length).toBe(4); // pos_A, neg_A, pos_B, neg_B
      expect(imp.graph.edges.length).toBe(2); // neg_A -> pos_B and neg_B -> pos_A

      const edge1 = imp.graph.edges.find((e) => e.source === "neg_A" && e.target === "pos_B");
      const edge2 = imp.graph.edges.find((e) => e.source === "neg_B" && e.target === "pos_A");

      expect(edge1).toBeDefined();
      expect(edge2).toBeDefined();
    });

    it("should solve 3-variable satisfiable formula and produce a valid truth assignment", () => {
      const formula = TARJAN_2SAT_PRESETS.twosat_satisfiable_3var.twoSATFormula!;
      const result = solve2SAT(formula.variables, formula.clauses);

      expect(result.isSatisfiable).toBe(true);
      expect(result.contradictions.length).toBe(0);
      expect(result.assignment).toBeDefined();

      // Verify that every clause is satisfied by the computed assignment
      const allClausesSatisfied = evaluate2SATFormula(formula.clauses, result.assignment);
      expect(allClausesSatisfied).toBe(true);
    });

    it("should detect contradiction and return UNSATISFIABLE for conflicting formula", () => {
      const formula = TARJAN_2SAT_PRESETS.twosat_unsatisfiable_contradiction.twoSATFormula!;
      const result = solve2SAT(formula.variables, formula.clauses);

      expect(result.isSatisfiable).toBe(false);
      expect(result.contradictions.length).toBeGreaterThan(0);

      // In this contradiction preset, both A and B are in the same SCC as their negations
      const contradictionVars = result.contradictions.map((c) => c.variable);
      expect(contradictionVars).toContain("A");
    });

    it("should solve 2-Coloring & Mutex scheduling formula", () => {
      const formula = TARJAN_2SAT_PRESETS.twosat_graph_coloring_scheduling.twoSATFormula!;
      const result = solve2SAT(formula.variables, formula.clauses);

      expect(result.isSatisfiable).toBe(true);
      expect(result.contradictions.length).toBe(0);

      const isValid = evaluate2SATFormula(formula.clauses, result.assignment);
      expect(isValid).toBe(true);
    });

    it("should detect unsatisfiability in Pigeonhole conflict preset", () => {
      const formula = TARJAN_2SAT_PRESETS.twosat_pigeonhole_conflict.twoSATFormula!;
      const result = solve2SAT(formula.variables, formula.clauses);

      expect(result.isSatisfiable).toBe(false);
      expect(result.contradictions.length).toBeGreaterThan(0);
    });

    it("should enforce single variable forced truth values correctly", () => {
      // Force A = true via (A v A) and B = false via (~B v ~B)
      const formula = parse2SATFormula("(A | A) & (~B | ~B) & (A | B)");
      const result = solve2SAT(formula.variables, formula.clauses);

      expect(result.isSatisfiable).toBe(true);
      expect(result.assignment["A"]).toBe(true);
      expect(result.assignment["B"]).toBe(false);

      expect(evaluate2SATFormula(formula.clauses, result.assignment)).toBe(true);
    });

    it("should detect unsatisfiability when a variable is forced both true and false", () => {
      const formula = parse2SATFormula("(A | A) & (~A | ~A)");
      const result = solve2SAT(formula.variables, formula.clauses);

      expect(result.isSatisfiable).toBe(false);
      expect(result.contradictions.some((c) => c.variable === "A")).toBe(true);
    });

    it("should return true when evaluating empty clause list", () => {
      expect(evaluate2SATFormula([], {})).toBe(true);
    });
  });

  // ==========================================================================
  // 8. ANIMATION STEP GENERATOR & TRACE VERIFICATION
  // ==========================================================================
  describe("8. Animation Step Generator & Trace Verification", () => {
    it("should generate valid animation steps for modality: tarjan_scc_discovery", () => {
      const graph = TARJAN_2SAT_PRESETS.scc_classic_kosaraju_tarjan.graph!;
      const steps = generateTarjanSteps("tarjan_scc_discovery", graph);

      expect(steps.length).toBeGreaterThan(10);
      expect(steps[0]?.action).toBe("dfs_enter");
      expect(steps[steps.length - 1]?.action).toBe("complete");

      // Verify that step indices are strictly sequential
      steps.forEach((step, idx) => {
        expect(step.stepIndex).toBe(idx);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.telemetry).toBeDefined();
      });

      // Verify root detection and pop steps exist
      const hasRootStep = steps.some((s) => s.action === "dfs_scc_root_found");
      const hasPopStep = steps.some((s) => s.action === "dfs_scc_pop_node");
      expect(hasRootStep).toBe(true);
      expect(hasPopStep).toBe(true);
    });

    it("should generate valid animation steps for modality: bridges_and_articulation_points", () => {
      const graph = TARJAN_2SAT_PRESETS.bridges_bowtie_graph.graph!;
      const steps = generateTarjanSteps("bridges_and_articulation_points", graph);

      expect(steps.length).toBeGreaterThan(5);
      const hasBridgeStep = steps.some((s) => s.action === "dfs_bridge_detected");
      const hasCutVertexStep = steps.some((s) => s.action === "dfs_cut_vertex_detected");

      expect(hasBridgeStep).toBe(true);
      expect(hasCutVertexStep).toBe(true);
    });

    it("should generate valid animation steps for modality: scc_dag_condensation", () => {
      const graph = TARJAN_2SAT_PRESETS.scc_dag_chain_diamonds.graph!;
      const steps = generateTarjanSteps("scc_dag_condensation", graph);

      expect(steps.length).toBeGreaterThan(5);
      const hasShrinkStep = steps.some((s) => s.action === "condensation_shrink");
      expect(hasShrinkStep).toBe(true);
      expect(steps[steps.length - 1]?.telemetry.isDAG).toBe(true);
    });

    it("should generate valid animation steps for modality: two_sat_implication_engine", () => {
      const formula = TARJAN_2SAT_PRESETS.twosat_satisfiable_3var.twoSATFormula!;
      const impGraph = build2SATImplicationGraph(formula.variables, formula.clauses).graph;
      const steps = generateTarjanSteps("two_sat_implication_engine", impGraph, formula);

      expect(steps.length).toBeGreaterThan(5);
      const hasConstructStep = steps.some((s) => s.action === "two_sat_construct_clause");
      const hasCheckStep = steps.some((s) => s.action === "two_sat_check_satisfiability");
      const hasAssignStep = steps.some((s) => s.action === "two_sat_assign_truth");

      expect(hasConstructStep).toBe(true);
      expect(hasCheckStep).toBe(true);
      expect(hasAssignStep).toBe(true);
    });
  });
});
