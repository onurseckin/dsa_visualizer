import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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
    return True, assignment`;

export const TWO_SAT_TRIVIA: TriviaMeta = {
  skipLines: [6, 9, 13, 15, 19],
  distractors: [
    "if scc_ids[v] != scc_ids[f'~{v}']: return 'UNSATISFIABLE'",
    "adj[u].append(v)",
    "assignment[v] = True",
    "scc_ids = topological_sort(adj)",
  ],
  hints: [
    {
      line: 10,
      hint: "A clause (A or B) is logically equivalent to (~A -> B) and (~B -> A).",
    },
    {
      line: 14,
      hint: "Kosaraju's SCC decomposition identifies cycles of implications.",
    },
    {
      line: 17,
      hint: "If a variable and its negation belong to the same SCC, a contradiction exists (x => ~x and ~x => x), making the formula UNSATISFIABLE.",
    },
    {
      line: 20,
      hint: "If all variables reside in distinct SCCs from their negations, set x = true if SCC(x) comes after SCC(~x) topologically.",
    },
  ],
  lineExplanations: {
    1: "Defines the 2-SAT solver function via implication graph and SCC decomposition.",
    2: "Initializes graph adjacency dictionary for variables and negations.",
    3: "Iterates through all variables to set up empty adjacency lists.",
    4: "Initializes adjacency list for the positive literal.",
    5: "Initializes adjacency list for the negated literal.",
    7: "Defines helper function to return logical negation of a literal.",
    8: "Strips ~ if literal is negated, otherwise prepends ~.",
    10: "Iterates through each clause disjunction (A or B).",
    11: "Adds implication edge ~A -> B to the adjacency list.",
    12: "Adds implication edge ~B -> A to the adjacency list.",
    14: "Decomposes the implication graph into Strongly Connected Components (SCCs) via Kosaraju's algorithm.",
    16: "Iterates over variables to check for unsatisfiable contradiction cycles.",
    17: "If x and ~x belong to the same SCC, returns False (UNSATISFIABLE).",
    18: "Returns False and empty dict when formula is unsatisfiable.",
    20: "Assigns boolean values based on topological order of SCC indices.",
    21: "Returns True and the satisfying boolean truth assignment.",
  },
};

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

export function generateTwoSatSteps(input: TwoSatSolverInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const variables = input.variables;
  const clauses = input.clauses;

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

  let stepIdx = 0;

  // Step 1: Initialize graph
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 2,
    explanation: {
      what: `Initialized implication graph with ${literals.length} literal nodes: [${literals.join(", ")}].`,
      why: "Each boolean variable x yields two nodes in the implication graph: x and ~x.",
    },
    primarySnapshot: { kind: "graph", nodes: nodes.map((n) => ({ ...n })), edges: [] },
    auxiliaryState: {
      visited: [],
      customState: { Clauses: clauses.map((c) => `(${c.u} v ${c.v})`).join(" ^ ") },
    },
    variables: { totalVars: variables.length, totalClauses: clauses.length },
  });

  // Step 2: Build implication edges for each clause
  for (const clause of clauses) {
    const notU = negateLiteral(clause.u);
    const notV = negateLiteral(clause.v);

    adj[notU].push(clause.v);
    adj[notV].push(clause.u);

    edges.push({ from: notU, to: clause.v });
    edges.push({ from: notV, to: clause.u });

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 10,
      explanation: {
        what: `Added implication edges: ${notU} -> ${clause.v} and ${notV} -> ${clause.u} for clause (${clause.u} v ${clause.v}).`,
        why: "Disjunction clause (A v B) is logically equivalent to (~A -> B) and (~B -> A).",
      },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((n) => ({ ...n })),
        edges: edges.map((e) => ({
          ...e,
          isTraversed:
            (e.from === notU && e.to === clause.v) || (e.from === notV && e.to === clause.u),
        })),
      },
      auxiliaryState: {
        visited: [],
        customState: {
          Clause: `(${clause.u} v ${clause.v})`,
          "Added Edges": `${notU}->${clause.v}, ${notV}->${clause.u}`,
        },
      },
      variables: { clauseU: clause.u, clauseV: clause.v, totalEdges: edges.length },
    });
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

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 14,
    explanation: {
      what: `Completed Kosaraju Pass 1: compute finish order stack [${finishStack.join(", ")}].`,
      why: "Post-order finish stack determines top-down order for SCC processing in Pass 2.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({ ...n, state: "visited" })),
      edges: edges.map((e) => ({ ...e, isTraversed: false })),
    },
    auxiliaryState: {
      stack: [...finishStack],
      customState: { "Finish Order": finishStack.join(", ") },
    },
    variables: { finishStackLength: finishStack.length },
  });

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

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 14,
    explanation: {
      what: `Identified ${currentScc} Strongly Connected Components (SCCs).`,
      why: "Nodes in the same SCC form mutually reachable implication loops.",
    },
    primarySnapshot: {
      kind: "graph",
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
      customState: {
        "SCC Map": Object.entries(sccId)
          .map(([k, v]) => `${k}:${v}`)
          .join(", "),
      },
    },
    variables: { totalSCCs: currentScc },
  });

  // Check satisfiability for each variable
  let isSat = true;
  const assignment: Record<string, boolean> = {};

  for (const v of variables) {
    const posScc = sccId[v];
    const negScc = sccId[negateLiteral(v)];

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 16,
      explanation: {
        what: `Checking variable '${v}': scc[${v}] = ${posScc}, scc[~${v}] = ${negScc}.`,
        why: "If variable x and ~x belong to the same SCC, an unsatisfiable contradiction exists.",
      },
      primarySnapshot: {
        kind: "graph",
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
        customState: {
          Checking: `${v} (SCC ${posScc}) vs ~${v} (SCC ${negScc})`,
        },
      },
      variables: { currentVar: v, posScc, negScc },
    });

    if (posScc === negScc) {
      isSat = false;
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 17,
        explanation: {
          what: `Contradiction detected: '${v}' and '~${v}' are both in SCC ${posScc}!`,
          why: `Both ${v} => ~${v} and ~${v} => ${v} hold, making the formula UNSATISFIABLE.`,
        },
        primarySnapshot: {
          kind: "graph",
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
          customState: { Result: "UNSATISFIABLE", Contradiction: `${v} === ~${v}` },
        },
        variables: { isSatisfiable: false, failingVar: v },
      });

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 18,
        explanation: {
          what: "Returned False and empty assignment dictionary.",
          why: "Formula cannot be satisfied due to contradiction cycle in implication graph.",
        },
        primarySnapshot: {
          kind: "graph",
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
          customState: { Result: "UNSATISFIABLE" },
        },
        variables: { isSatisfiable: false },
      });
      break;
    }

    assignment[v] = posScc > negScc;
  }

  if (isSat) {
    const assignmentStr = Object.entries(assignment)
      .map(([k, val]) => `${k}=${val}`)
      .join(", ");

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 20,
      explanation: {
        what: `Derived boolean truth assignment: ${assignmentStr}.`,
        why: "Setting x = true if scc[x] > scc[~x] respects topological rank without implication violations.",
      },
      primarySnapshot: {
        kind: "graph",
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
        customState: {
          Assignment: assignmentStr,
        },
      },
      variables: { assignment: assignmentStr },
    });

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 21,
      explanation: {
        what: `Formula is SATISFIABLE with assignment: ${assignmentStr}.`,
        why: "All variables were evaluated without contradiction; SCC topological order provides a valid assignment.",
      },
      primarySnapshot: {
        kind: "graph",
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
        customState: {
          Result: "SATISFIABLE",
          Assignment: assignmentStr,
        },
      },
      variables: {
        isSatisfiable: true,
        assignment: assignmentStr,
      },
    });
  }

  return steps;
}

export const twoSatSolver: AlgorithmDefinition<TwoSatSolverInput> = {
  id: "two-sat-solver",
  title: "2-SAT Solver",
  topicIds: ["graph_directed_and_scc"],
  difficulty: "Hard",
  description:
    "Solves the 2-Satisfiability (2-SAT) problem in linear O(V + E) time. Given a 2-CNF boolean formula with N variables and M clauses (where each clause contains 2 literals), 2-SAT is solved by constructing a directed implication graph (~u -> v) and (~v -> u). Kosaraju's algorithm computes the Strongly Connected Components (SCCs). If any variable x and its negation ~x belong to the same SCC, the formula is UNSATISFIABLE. Otherwise, a valid truth assignment is derived from the topological rank of SCCs.",
  constraints: [
    "1 <= Variables <= 500",
    "1 <= Clauses <= 2000",
    "Each clause consists of exactly 2 literals",
    "Literals can be positive (x) or negated (~x)",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay:
        "variables = [x1, x2, x3], clauses = (x1 v x2) ^ (~x1 v x2) ^ (x1 v ~x2) ^ (x2 v x3)",
      outputDisplay: "SATISFIABLE {x1: true, x2: true, x3: true}",
      title: "Satisfiable 2-SAT Formula",
      input: DEFAULT_TWO_SAT_INPUT,
      output: "SATISFIABLE: x1=true, x2=true, x3=true",
      explanation: "All 4 clauses are satisfied under the boolean assignment.",
    },
    {
      kind: "complex",
      inputDisplay:
        "variables = [x1, x2], clauses = (x1 v x2) ^ (~x1 v x2) ^ (x1 v ~x2) ^ (~x1 v ~x2)",
      outputDisplay: "UNSATISFIABLE",
      title: "Unsatisfiable 4-Clause Contradiction",
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
      inputDisplay: "variables = [x1], clauses = (x1 v x1) ^ (~x1 v ~x1)",
      outputDisplay: "UNSATISFIABLE",
      title: "Direct Self-Contradiction",
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
    time: "Constructing the implication graph takes $\\mathcal{O}(V + E)$ time. Finding SCCs via Kosaraju's algorithm takes $\\mathcal{O}(V + E)$ time. Validating contradictions takes $\\mathcal{O}(V)$ time. Total runtime is linear $\\mathcal{O}(V + E)$.",
    space:
      "The implication graph, transpose graph, and SCC data structures consume $\\mathcal{O}(V + E)$ auxiliary space.",
  },
  topicGuide: {
    overview:
      "While general 3-SAT and Boolean Satisfiability are famous NP-complete problems (**Cook-Levin Theorem**), **2-SAT** is restricted to 2 literals per clause and is solvable in linear time $\\mathcal{O}(V + E)$. The key reduction transforms logic clauses into a directed **Implication Graph** $G = (V, E)$ and analyzes its Strongly Connected Components (SCCs).",
    sections: [
      {
        heading: "Core Concept: Implication Graph Reduction",
        body: "A disjunction clause $(u \\lor v)$ is logically equivalent to two implication rules: $\\neg u \\implies v$ ($\\neg u \\to v$) and $\\neg v \\implies u$ ($\\neg v \\to u$). Constructing these directed edges for all clauses creates an Implication Graph $G = (V, E)$ where vertices represent literals.",
      },
      {
        heading: "Contradiction Condition & Topological Assignment",
        body: "If a variable $x$ and its negation $\\neg x$ belong to the same SCC, then $x \\implies \\neg x$ and $\\neg x \\implies x$ both hold, establishing a logical contradiction that renders the formula **UNSATISFIABLE**. Otherwise, assigning truth values according to the topological rank of SCCs (setting $x = \\text{true}$ if $\\text{scc}[x] > \\text{scc}[\\neg x]$) guarantees a valid satisfying assignment.",
      },
      {
        heading: "Systems Applications & Automated Reasoning",
        body: "2-SAT solvers power package dependency resolution (Apt, Cargo, npm), hardware design verification (signal equivalence checking), register allocation under two-way interference, and automated theorem proving.",
      },
      {
        heading: "Implementation Nuances & Edge Cases",
        body: "Single literal constraints $(x)$ are encoded as $(x \\lor x)$, producing implication $\\neg x \\to x$. Tautological clauses $(x \\lor \\neg x)$ produce no constraint edges.",
      },
      {
        heading: "Complexity Analysis",
        body: "$$\\text{Time Complexity}: \\mathcal{O}(V + E)$$\n$$\\text{Space Complexity}: \\mathcal{O}(V + E)$$\n- **Time**: Graph construction, Kosaraju SCC decomposition, and topological rank assignments run in linear $\\mathcal{O}(V + E)$ time.\n- **Space**: Adjacency lists and SCC maps take $\\mathcal{O}(V + E)$ memory.",
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
          "A directed graph representing logical implications $(\\neg u \\to v, \\neg v \\to u)$ derived from clause disjunctions $(u \\lor v)$.",
      },
      {
        term: "Strongly Connected Component (SCC)",
        definition:
          "A maximal directed subgraph where every vertex is reachable from every other vertex. In 2-SAT, SCCs encapsulate mutual implication loops.",
      },
      {
        term: "Topological Rank Assignment",
        definition:
          "Constructing a satisfying truth assignment by evaluating reverse topological order of SCCs, setting variable $x = \\text{true}$ if $\\text{scc}[x] > \\text{scc}[\\neg x]$.",
      },
      {
        term: "Cook-Levin Theorem & 3-SAT",
        definition:
          "Foundational complexity theorem establishing general 3-SAT as NP-complete, highlighting why 2-SAT's linear $\\mathcal{O}(V + E)$ time reduction is uniquely tractable.",
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
