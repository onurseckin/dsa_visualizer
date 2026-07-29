import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface TwoSatClause {
  u: string;
  v: string;
}

export interface TwoSatSolverInput {
  variables: string[];
  clauses: TwoSatClause[];
}

export const TWO_SAT_CODE = `def solve_2sat(variables, clauses):
    adj = {}
    for var in variables:
        adj[var] = []
        adj[f"~{var}"] = []
        
    def not_lit(lit):
        return lit[1:] if lit.startswith("~") else f"~{lit}"
        
    for lit1, lit2 in clauses:
        adj[not_lit(lit1)].append(lit2)
        adj[not_lit(lit2)].append(lit1)
        
    scc = kosaraju_scc(variables, adj)
    
    for var in variables:
        if scc[var] == scc[f"~{var}"]:
            return False, {}
            
    assignment = {var: scc[var] > scc[f"~{var}"] for var in variables}
    return True, assignment

def kosaraju_scc(variables, graph):
    literals = list(graph)
    visited = set()
    finish_order = []

    def dfs1(literal):
        visited.add(literal)
        for neighbor in graph[literal]:
            if neighbor not in visited:
                dfs1(neighbor)
        finish_order.append(literal)

    for literal in literals:
        if literal not in visited:
            dfs1(literal)

    reverse_graph = {literal: [] for literal in literals}
    for literal, neighbors in graph.items():
        for neighbor in neighbors:
            reverse_graph[neighbor].append(literal)

    components = {}

    def dfs2(literal, component_id):
        components[literal] = component_id
        for neighbor in reverse_graph[literal]:
            if neighbor not in components:
                dfs2(neighbor, component_id)

    component_id = 0
    while finish_order:
        literal = finish_order.pop()
        if literal not in components:
            dfs2(literal, component_id)
            component_id += 1

    return components`;

export const DEFAULT_TWO_SAT_INPUT: TwoSatSolverInput = {
  variables: ["x1", "x2", "x3"],
  clauses: [
    { u: "x1", v: "x2" },
    { u: "~x1", v: "x2" },
    { u: "x1", v: "~x2" },
    { u: "x2", v: "x3" },
  ],
};

function negateLiteral(lit: string): string {
  return lit.startsWith("~") ? lit.slice(1) : `~${lit}`;
}

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The 2-Satisfiability (2-SAT) problem determines whether a boolean formula in 2-CNF format (clauses of 2 literals) has a satisfying truth assignment.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "x1", label: "x1", state: "active" },
        { id: "~x1", label: "~x1", state: "default" },
        { id: "x2", label: "x2", state: "active" },
        { id: "~x2", label: "~x2", state: "default" },
      ],
      edges: [
        { from: "~x1", to: "x2" },
        { from: "~x2", to: "x1" },
      ],
    },
  },
  {
    narrative:
      "Every clause disjunction (A or B) translates into two equivalent implication rules: (~A -> B) and (~B -> A).",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "~A", label: "~A", state: "visited" },
        { id: "B", label: "B", state: "visited" },
        { id: "~B", label: "~B", state: "visited" },
        { id: "A", label: "A", state: "visited" },
      ],
      edges: [
        { from: "~A", to: "B", isTraversed: true },
        { from: "~B", to: "A", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "An Implication Graph G is constructed where nodes represent all positive and negated literals, and directed edges represent implication rules.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "x1", label: "x1", state: "default" },
        { id: "~x1", label: "~x1", state: "default" },
        { id: "x2", label: "x2", state: "default" },
        { id: "~x2", label: "~x2", state: "default" },
      ],
      edges: [
        { from: "~x1", to: "x2" },
        { from: "~x2", to: "x1" },
        { from: "x1", to: "~x2" },
        { from: "x2", to: "~x1" },
      ],
    },
  },
  {
    narrative:
      "Directed paths in the implication graph represent transitive logical consequences: if literal A is true, then target literal B must also be true.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "x1", label: "True x1", state: "active" },
        { id: "x2", label: "True x2", state: "swap" },
        { id: "x3", label: "True x3", state: "swap" },
      ],
      edges: [
        { from: "x1", to: "x2", isPath: true },
        { from: "x2", to: "x3", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Strongly Connected Components (SCCs) group literals that mutually imply each other into unified equivalence classes.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "x1", label: "SCC 1", state: "visited" },
        { id: "~x2", label: "SCC 1", state: "visited" },
        { id: "~x1", label: "SCC 2", state: "compare" },
        { id: "x2", label: "SCC 2", state: "compare" },
      ],
      edges: [
        { from: "x1", to: "~x2", isPath: true },
        { from: "~x2", to: "x1", isPath: true },
        { from: "~x1", to: "x2", isPath: true },
        { from: "x2", to: "~x1", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Contradiction Rule: If any variable x and its negation ~x fall into the exact same SCC, the formula is UNSATISFIABLE.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "x1", label: "x1 (Same SCC!)", state: "swap" },
        { id: "~x1", label: "~x1 (Same SCC!)", state: "swap" },
      ],
      edges: [
        { from: "x1", to: "~x1", isTraversed: true },
        { from: "~x1", to: "x1", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "When every variable x and ~x belong to distinct SCCs, a topological ordering of component ranks exists without implication cycles.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "x1", label: "SCC 2 (Rank 2)", state: "sorted" },
        { id: "~x1", label: "SCC 1 (Rank 1)", state: "default" },
      ],
      edges: [{ from: "~x1", to: "x1" }],
    },
  },
  {
    narrative:
      "A valid satisfying boolean assignment is constructed by setting x = true if SCC(x) > SCC(~x), ensuring no implication arrow flows from true to false.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "x1", label: "x1 = TRUE", state: "sorted" },
        { id: "~x1", label: "~x1 = FALSE", state: "default" },
        { id: "x2", label: "x2 = TRUE", state: "sorted" },
        { id: "~x2", label: "~x2 = FALSE", state: "default" },
      ],
      edges: [
        { from: "~x1", to: "x2" },
        { from: "~x2", to: "x1" },
      ],
    },
  },
  {
    narrative:
      "Using Kosaraju's SCC algorithm, 2-SAT is solved in linear O(V + E) time and O(V + E) auxiliary space.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "x1", label: "SATISFIABLE", state: "sorted" },
        { id: "x2", label: "x1=true", state: "sorted" },
        { id: "x3", label: "x2=true", state: "sorted" },
        { id: "x4", label: "x3=true", state: "sorted" },
      ],
      edges: [
        { from: "x1", to: "x2", isPath: true },
        { from: "x2", to: "x3", isPath: true },
        { from: "x3", to: "x4", isPath: true },
      ],
    },
  },
];

export function generateTwoSatSteps(input: TwoSatSolverInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  // Intro Phase (9 snapshots)
  const intro = createIntroSnapshots();
  for (const item of intro) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "intro",
        narrative: item.narrative,
        primarySnapshot: item.primarySnapshot,
      }),
    );
  }

  // Walkthrough Phase
  const safeInput = input && typeof input === "object" ? input : DEFAULT_TWO_SAT_INPUT;
  const variables =
    Array.isArray(safeInput.variables) && safeInput.variables.length > 0
      ? safeInput.variables
      : DEFAULT_TWO_SAT_INPUT.variables;
  const clauses = Array.isArray(safeInput.clauses)
    ? safeInput.clauses
    : DEFAULT_TWO_SAT_INPUT.clauses;

  const literals: string[] = [];
  for (const v of variables) {
    literals.push(v, `~${v}`);
  }

  const nodes: GraphNodeItem[] = literals.map((lit) => {
    const isNeg = lit.startsWith("~");
    const baseVarIdx = variables.indexOf(isNeg ? lit.slice(1) : lit);
    const x = 120 + baseVarIdx * 150;
    const y = isNeg ? 220 : 100;
    return {
      id: lit,
      label: lit,
      x,
      y,
      state: "default",
    };
  });

  const edges: GraphEdgeItem[] = [];
  const adj: Record<string, string[]> = {};
  for (const lit of literals) {
    adj[lit] = [];
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Initialized implication graph with ${literals.length} literal nodes: [${literals.join(", ")}].`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({ ...n, state: "active" })),
        edges: [],
      },
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { totalVars: variables.length, totalClauses: clauses.length },
    }),
  );

  for (const clause of clauses) {
    const notU = negateLiteral(clause.u);
    const notV = negateLiteral(clause.v);

    adj[notU].push(clause.v);
    adj[notV].push(clause.u);

    edges.push({ from: notU, to: clause.v });
    edges.push({ from: notV, to: clause.u });

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Added implication edges: ${notU} -> ${clause.v} and ${notV} -> ${clause.u} for clause (${clause.u} v ${clause.v}).`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: nodes.map((n) => ({
            ...n,
            state: n.id === clause.u || n.id === clause.v ? "compare" : "default",
          })),
          edges: edges.map((e) => ({
            ...e,
            isTraversed:
              (e.from === notU && e.to === clause.v) || (e.from === notV && e.to === clause.u),
          })),
        },
        auxiliaryState: {
          stack: [],
          visited: [],
        },
        variables: { clauseU: clause.u, clauseV: clause.v, totalEdges: edges.length },
      }),
    );
  }

  // Kosaraju Pass 1: DFS order
  const visited = new Set<string>();
  const finishStack: string[] = [];

  function dfs1(u: string) {
    visited.add(u);
    for (const v of adj[u] || []) {
      if (!visited.has(v)) {
        dfs1(v);
      }
    }
    finishStack.push(u);
  }

  for (const lit of literals) {
    if (!visited.has(lit)) {
      dfs1(lit);
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Completed Kosaraju Pass 1 DFS: computed finish order stack [${[...finishStack].reverse().join(", ")}].`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({ ...n, state: "visited" })),
        edges: edges.map((e) => ({ ...e, isTraversed: false })),
      },
      auxiliaryState: {
        stack: [...finishStack],
        visited: Array.from(visited),
      },
      variables: { finishStackLength: finishStack.length },
    }),
  );

  // Kosaraju Pass 2: Transpose graph DFS to compute SCCs
  const radj: Record<string, string[]> = {};
  for (const lit of literals) {
    radj[lit] = [];
  }
  for (const e of edges) {
    radj[e.to].push(e.from);
  }

  const sccId: Record<string, number> = {};
  let currentScc = 0;

  function dfs2(u: string, compId: number) {
    sccId[u] = compId;
    for (const v of radj[u] || []) {
      if (sccId[v] === undefined) {
        dfs2(v, compId);
      }
    }
  }

  const finishStackCopy = [...finishStack];
  while (finishStackCopy.length > 0) {
    const u = finishStackCopy.pop()!;
    if (sccId[u] === undefined) {
      dfs2(u, currentScc);
      currentScc++;
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Completed Kosaraju Pass 2: identified ${currentScc} Strongly Connected Component(s).`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({
          ...n,
          group: sccId[n.id],
          state: "default",
        })),
        edges: edges.map((e) => ({
          ...e,
          isTraversed: false,
          group: sccId[e.from] === sccId[e.to] ? sccId[e.from] : undefined,
        })),
      },
      auxiliaryState: {
        stack: [],
        visited: Array.from(visited),
      },
      variables: { totalSCCs: currentScc },
    }),
  );

  // Check satisfiability for each variable
  let isSat = true;
  const assignment: Record<string, boolean> = {};

  for (const v of variables) {
    const posScc = sccId[v];
    const negScc = sccId[negateLiteral(v)];

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Checking variable '${v}': scc[${v}] = ${posScc}, scc[~${v}] = ${negScc}.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: nodes.map((n) => ({
            ...n,
            group: sccId[n.id],
            state: n.id === v || n.id === negateLiteral(v) ? "compare" : "default",
          })),
          edges: edges.map((e) => ({
            ...e,
            group: sccId[e.from] === sccId[e.to] ? sccId[e.from] : undefined,
          })),
        },
        auxiliaryState: {
          stack: [],
          visited: Array.from(visited),
        },
        variables: { currentVar: v, posScc, negScc },
      }),
    );

    if (posScc === negScc) {
      isSat = false;
      steps.push(
        createTutorialStep({
          stepIndex: stepIdx++,
          phase: "walkthrough",
          narrative: `Contradiction detected: '${v}' and '~${v}' both belong to SCC ${posScc}! Formula is UNSATISFIABLE.`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: nodes.map((n) => ({
              ...n,
              group: sccId[n.id],
              state: n.id === v || n.id === negateLiteral(v) ? "swap" : "default",
            })),
            edges: edges.map((e) => ({
              ...e,
              group: sccId[e.from] === sccId[e.to] ? sccId[e.from] : undefined,
            })),
          },
          auxiliaryState: {
            stack: [],
            visited: Array.from(visited),
          },
          variables: { isSatisfiable: false, failingVar: v },
        }),
      );
      break;
    }

    assignment[v] = posScc > negScc;
  }

  if (isSat) {
    const assignmentStr = Object.entries(assignment)
      .map(([k, val]) => `${k}=${val}`)
      .join(", ");

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Formula is SATISFIABLE. Valid truth assignment derived from SCC topological ranks: [${assignmentStr}].`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: nodes.map((n) => ({
            ...n,
            group: sccId[n.id],
            state: assignment[n.id.replace("~", "")]
              ? n.id.startsWith("~")
                ? "default"
                : "sorted"
              : n.id.startsWith("~")
                ? "sorted"
                : "default",
          })),
          edges: edges.map((e) => ({
            ...e,
            group: sccId[e.from] === sccId[e.to] ? sccId[e.from] : undefined,
          })),
        },
        auxiliaryState: {
          stack: [],
          visited: Array.from(visited),
        },
        variables: { isSatisfiable: true, assignment: assignmentStr },
      }),
    );
  }

  return steps;
}

export const TWO_SAT_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines 2-SAT solver function via implication graph and SCC decomposition.",
    2: "Initializes graph adjacency dictionary.",
    3: "Iterates through variables.",
    4: "Initializes positive literal list.",
    5: "Initializes negated literal list.",
    7: "Defines helper function to negate literal.",
    10: "Iterates through clauses.",
    11: "Adds ~A -> B edge.",
    12: "Adds ~B -> A edge.",
    14: "Runs Kosaraju SCC decomposition.",
    16: "Iterates over variables to check for contradiction cycles.",
    17: "If x and ~x share SCC, returns UNSATISFIABLE.",
    18: "Returns False.",
    20: "Assigns boolean values based on topological order.",
    21: "Returns True and truth assignment.",
  },
};

export const twoSatSolver: AlgorithmDefinition<TwoSatSolverInput> = {
  id: "two-sat-solver",
  title: "2-SAT Solver",
  topicIds: ["graph_directed_and_scc"],
  difficulty: "Hard",
  description:
    "<p>Given a 2-CNF boolean formula with <code>N</code> variables and <code>M</code> clauses, determine whether a satisfying boolean assignment exists and construct a valid assignment in linear time.</p><h3>Problem Statement</h3><p>Build a directed implication graph (<code>~u &rarr; v</code> and <code>~v &rarr; u</code> for each clause <code>(u v v)</code>) and compute Strongly Connected Components (SCCs). If any variable <code>x</code> and its negation <code>~x</code> belong to the same SCC, return UNSATISFIABLE. Otherwise, output a valid truth assignment setting <code>x = true</code> if <code>SCC(x) > SCC(~x)</code>.</p><h3>Input Parameters</h3><ul><li><code>variables</code>: Array of boolean variable identifiers (e.g. ['x1', 'x2']).</li><li><code>clauses</code>: Array of clause objects <code>{ u, v }</code> containing positive or negated literals.</li></ul><h3>Output</h3><p>Returns boolean satisfiability status and the derived truth assignment dictionary.</p>",
  constraints: [
    "1 <= Variables <= 500",
    "1 <= Clauses <= 2000",
    "Each clause consists of exactly 2 literals",
    "Literals can be positive (x) or negated (~x)",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay:
        "variables = [x1, x2, x3], clauses = (x1 v x2) ^ (~x1 v x2) ^ (x1 v ~x2) ^ (x2 v x3)",
      outputDisplay: "SATISFIABLE {x1: true, x2: true, x3: true}",
      title: "Standard Satisfiable 2-SAT Formula",
      input: DEFAULT_TWO_SAT_INPUT,
      output: "SATISFIABLE: x1=true, x2=true, x3=true",
      explanation: "All 4 clauses are satisfied under the boolean assignment.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay:
        "variables = [x1, x2], clauses = (x1 v x2) ^ (~x1 v x2) ^ (x1 v ~x2) ^ (~x1 v ~x2)",
      outputDisplay: "UNSATISFIABLE",
      title: "Adversarial Unsatisfiable 4-Clause Contradiction",
      input: {
        variables: ["x1", "x2"],
        clauses: [
          { u: "x1", v: "x2" },
          { u: "~x1", v: "x2" },
          { u: "x1", v: "~x2" },
          { u: "~x1", v: "~x2" },
        ],
      },
      output: "UNSATISFIABLE",
      explanation:
        "x1 and ~x1 fall into the same SCC because all combinations of truth values force contradictions.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "variables = [x1], clauses = (x1 v x1) ^ (~x1 v ~x1)",
      outputDisplay: "UNSATISFIABLE",
      title: "Boundary Direct Self-Contradiction",
      input: {
        variables: ["x1"],
        clauses: [
          { u: "x1", v: "x1" },
          { u: "~x1", v: "~x1" },
        ],
      },
      output: "UNSATISFIABLE",
      explanation: "Forces x1 to be true and ~x1 to be true simultaneously.",
    },
  ],
  code: TWO_SAT_CODE,
  timeComplexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
  },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Constructing the implication graph takes O(V + E) time. Finding SCCs via Kosaraju's algorithm takes O(V + E) time. Validating contradictions takes O(V) time. Total runtime is linear O(V + E).",
    space:
      "The implication graph, transpose graph, and SCC data structures consume O(V + E) auxiliary space.",
  },
  topicGuide: {
    overview:
      "<p>While general 3-SAT and Boolean Satisfiability are famous NP-complete problems (<strong>Cook-Levin Theorem</strong>), <strong>2-SAT</strong> is restricted to 2 literals per clause and is solvable in linear time <code>O(V + E)</code>. The key reduction transforms logic clauses into a directed <strong>Implication Graph</strong> <code>G = (V, E)</code> and analyzes its Strongly Connected Components (SCCs).</p>",
    sections: [
      {
        heading: "Core Concept: Implication Graph Reduction",
        body: "<p>A disjunction clause <code>(u &or; v)</code> is logically equivalent to two implication rules: <code>&not;u &rArr; v</code> (<code>&not;u &rarr; v</code>) and <code>&not;v &rArr; u</code> (<code>&not;v &rarr; u</code>). Constructing these directed edges for all clauses creates an Implication Graph <code>G = (V, E)</code> where vertices represent literals.</p>",
      },
      {
        heading: "Contradiction Condition & Topological Assignment",
        body: "<p>If a variable <code>x</code> and its negation <code>&not;x</code> belong to the same SCC, then <code>x &rArr; &not;x</code> and <code>&not;x &rArr; x</code> both hold, establishing a logical contradiction that renders the formula <strong>UNSATISFIABLE</strong>. Otherwise, assigning truth values according to the topological rank of SCCs (setting <code>x = true</code> if <code>scc[x] &gt; scc[&not;x]</code>) guarantees a valid satisfying assignment.</p>",
      },
      {
        heading: "Systems Applications & Automated Reasoning",
        body: "<p>2-SAT solvers power package dependency resolution (Apt, Cargo, npm), hardware design verification (signal equivalence checking), register allocation under two-way interference, and automated theorem proving.</p>",
      },
      {
        heading: "Implementation Nuances & Edge Cases",
        body: "<p>Single literal constraints <code>(x)</code> are encoded as <code>(x &or; x)</code>, producing implication <code>&not;x &rarr; x</code>. Tautological clauses <code>(x &or; &not;x)</code> produce no constraint edges.</p>",
      },
      {
        heading: "Complexity Analysis",
        body: "<p><strong>Time Complexity:</strong> <code>O(V + E)</code><br/><strong>Space Complexity:</strong> <code>O(V + E)</code><br/>Graph construction, Kosaraju SCC decomposition, and topological rank assignments run in linear <code>O(V + E)</code> time. Adjacency lists and SCC maps take <code>O(V + E)</code> memory.</p>",
      },
    ],
    keyTerms: [
      {
        term: "2-SAT",
        definition: "Boolean satisfiability problem where each clause contains exactly 2 literals.",
      },
      {
        term: "Implication Graph",
        definition:
          "A directed graph representing logical implications (not-u -> v, not-v -> u) derived from clause disjunctions (u OR v).",
      },
      {
        term: "Strongly Connected Component (SCC)",
        definition:
          "A maximal directed subgraph where every vertex is reachable from every other vertex. In 2-SAT, SCCs encapsulate mutual implication loops.",
      },
      {
        term: "Topological Rank Assignment",
        definition:
          "Constructing a satisfying truth assignment by evaluating reverse topological order of SCCs, setting variable x = true if scc[x] > scc[not-x].",
      },
      {
        term: "Cook-Levin Theorem & 3-SAT",
        definition:
          "Foundational complexity theorem establishing general 3-SAT as NP-complete, highlighting why 2-SAT's linear O(V + E) time reduction is uniquely tractable.",
      },
    ],
  },
  trivia: TWO_SAT_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 17",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 17,
      section: "17.2 2-SAT problem",
    },
  ],
  defaultInput: DEFAULT_TWO_SAT_INPUT,
  generateSteps: generateTwoSatSteps,
};

export default twoSatSolver;
