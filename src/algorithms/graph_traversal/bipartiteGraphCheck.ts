import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface BipartiteGraphCheckInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const BIPARTITE_CHECK_CODE = `from collections import deque

def is_bipartite(graph):
    color = {}
    for node in graph:
        if node not in color:
            color[node] = 0
            queue = deque([node])
            while queue:
                u = queue.popleft()
                for v in graph[u]:
                    if v not in color:
                        color[v] = 1 - color[u]
                        queue.append(v)
                    elif color[v] == color[u]:
                        return False
    return True`;

export const BIPARTITE_CHECK_TRIVIA: TriviaMeta = {
  skipLines: [1, 2],
  distractors: [
    "color[v] = color[u]",
    "if color[v] != color[u]: return False",
    "queue.pop()",
    "color[start] = 1",
  ],
  hints: [
    {
      line: 4,
      hint: "Stores assigned vertex colors (0 or 1) in a map/dictionary.",
    },
    {
      line: 13,
      hint: "Assign opposite color (1 - color[u]) to unvisited neighbors.",
    },
    {
      line: 15,
      hint: "If a neighbor already shares the same color, an odd-length cycle exists, breaking 2-colorability.",
    },
    {
      line: 17,
      hint: "If all connected components are 2-colored without conflict, the graph is bipartite.",
    },
  ],
  lineExplanations: {
    1: "Imports deque for efficient O(1) queue operations during BFS traversal.",
    2: "Blank line separating module import from the function signature definition.",
    3: "Defines 2-coloring bipartite graph validation algorithm accepting an adjacency list.",
    4: "Initializes color assignment dictionary mapping node IDs to color 0 or 1.",
    5: "Sweeps every vertex in the graph to ensure all disconnected components are checked.",
    6: "Checks if the current vertex has not been colored yet (unvisited in any component search).",
    7: "Assigns initial color 0 to unvisited root of a new connected component.",
    8: "Initializes BFS queue with the component root node.",
    9: "Loops as long as there are vertices waiting in the BFS queue for the current component.",
    10: "Pops next vertex u from the front of the queue.",
    11: "Scans each neighbor v adjacent to node u.",
    12: "Checks if the neighbor v is uncolored and needs to be assigned a color.",
    13: "Assigns opposite color (1 - color[u]) to unvisited neighbor v.",
    14: "Appends the newly colored neighbor v to the BFS queue to continue coloring its neighbors.",
    15: "Detects color collision when adjacent nodes share identical color.",
    16: "Returns False immediately when an odd-length cycle conflict is discovered.",
    17: "Confirms graph is 2-colorable (bipartite) after all components pass without conflict.",
  },
};

export const DEFAULT_BIPARTITE_INPUT: BipartiteGraphCheckInput = {
  nodes: [
    { id: "A", label: "A", x: 150, y: 100, state: "default" },
    { id: "B", label: "B", x: 350, y: 100, state: "default" },
    { id: "C", label: "C", x: 350, y: 250, state: "default" },
    { id: "D", label: "D", x: 150, y: 250, state: "default" },
  ],
  edges: [
    { from: "A", to: "B" },
    { from: "B", to: "C" },
    { from: "C", to: "D" },
    { from: "D", to: "A" },
  ],
};

export function generateBipartiteCheckSteps(input: BipartiteGraphCheckInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const nodes = input.nodes.map((n) => ({ ...n }));
  const edges = input.edges.map((e) => ({ ...e }));

  const adj: Record<string, string[]> = {};
  for (const n of nodes) {
    adj[n.id] = [];
  }
  for (const e of edges) {
    adj[e.from].push(e.to);
    adj[e.to].push(e.from);
  }

  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: "Import deque from collections",
      why: "BFS needs a FIFO queue. Python's deque provides O(1) append and popleft operations.",
    },
    primarySnapshot: { kind: "graph", nodes: [...nodes], edges: [...edges] },
    auxiliaryState: { visited: [], customState: { Colors: "{}" } },
    variables: { totalNodes: nodes.length },
  });

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 3,
    explanation: {
      what: "Initialized Bipartite Graph 2-Coloring Check.",
      why: "A graph is bipartite if its nodes can be colored using 2 colors (Group 0 & Group 1) with no adjacent nodes sharing a color.",
    },
    primarySnapshot: { kind: "graph", nodes: [...nodes], edges: [...edges] },
    auxiliaryState: {
      visited: [],
      customState: { Colors: "{}" },
    },
    variables: { totalNodes: nodes.length, totalEdges: edges.length },
  });

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 4,
    explanation: {
      what: "Initialize color dictionary",
      why: "The color map stores the 2-coloring assignment (0 or 1) for each node. Unvisited nodes are absent from the map.",
    },
    primarySnapshot: { kind: "graph", nodes: [...nodes], edges: [...edges] },
    auxiliaryState: { customState: { Colors: "{}" } },
    variables: { totalNodes: nodes.length },
  });

  const color: Record<string, number> = {};
  let isBipartite = true;

  for (const startNode of nodes) {
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 5,
      explanation: {
        what: `Inspecting node "${startNode.id}" in outer sweep.`,
        why: "Checking if node is part of an unvisited component that needs 2-coloring.",
      },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((n) => ({
          ...n,
          group: color[n.id],
          state: n.id === startNode.id ? "active" : "default",
        })),
        edges: [...edges],
      },
      auxiliaryState: {
        customState: {
          Colors:
            Object.entries(color)
              .map(([k, v]) => `${k}:${v}`)
              .join(", ") || "{}",
        },
      },
      variables: { currentNode: startNode.id, isColored: color[startNode.id] !== undefined },
    });

    if (color[startNode.id] === undefined) {
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 6,
        explanation: {
          what: `Node "${startNode.id}" is not colored yet.`,
          why: "Initiating a new 2-coloring traversal for this connected component.",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({
            ...n,
            group: color[n.id],
            state: n.id === startNode.id ? "active" : "default",
          })),
          edges: [...edges],
        },
        auxiliaryState: {
          customState: {
            Colors:
              Object.entries(color)
                .map(([k, v]) => `${k}:${v}`)
                .join(", ") || "{}",
          },
        },
        variables: { rootNode: startNode.id },
      });

      color[startNode.id] = 0;
      const queue: string[] = [startNode.id];

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 7,
        explanation: {
          what: `Assign Color 0 to root node "${startNode.id}".`,
          why: "The first node of each new component is assigned color 0. Its neighbors will receive color 1.",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({
            ...n,
            group: color[n.id],
            state: n.id === startNode.id ? "active" : "default",
          })),
          edges: [...edges],
        },
        auxiliaryState: {
          queue: [...queue],
          customState: {
            Colors: Object.entries(color)
              .map(([k, v]) => `${k}:${v}`)
              .join(", "),
          },
        },
        variables: { startNode: startNode.id, initialColor: 0 },
      });

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 8,
        explanation: {
          what: `Initialize BFS queue with root "${startNode.id}".`,
          why: "BFS starts from the component root, spreading the 2-coloring outward level by level.",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({
            ...n,
            group: color[n.id],
            state: n.id === startNode.id ? "active" : "default",
          })),
          edges: [...edges],
        },
        auxiliaryState: {
          queue: [...queue],
          customState: {
            Colors: Object.entries(color)
              .map(([k, v]) => `${k}:${v}`)
              .join(", "),
          },
        },
        variables: { startNode: startNode.id, queueSize: queue.length },
      });

      while (queue.length > 0) {
        steps.push({
          stepIndex: stepIdx++,
          codeLine: 9,
          explanation: {
            what: `Checking BFS queue (${queue.length} nodes waiting).`,
            why: "Continuing BFS 2-coloring propagation for current component.",
          },
          primarySnapshot: {
            kind: "graph",
            nodes: nodes.map((n) => ({
              ...n,
              group: color[n.id],
              state: queue.includes(n.id) ? "queued" : "default",
            })),
            edges: [...edges],
          },
          auxiliaryState: {
            queue: [...queue],
            customState: {
              Colors: Object.entries(color)
                .map(([k, v]) => `${k}:${v}`)
                .join(", "),
            },
          },
          variables: { queueLength: queue.length },
        });

        const u = queue.shift()!;

        steps.push({
          stepIndex: stepIdx++,
          codeLine: 10,
          explanation: {
            what: `Dequeued node "${u}" (Color ${color[u]}).`,
            why: "Inspecting neighbors of node u to propagate opposite color.",
          },
          primarySnapshot: {
            kind: "graph",
            nodes: nodes.map((n) => ({
              ...n,
              group: color[n.id],
              state: n.id === u ? "active" : "default",
            })),
            edges: [...edges],
          },
          auxiliaryState: {
            queue: [...queue],
            customState: {
              Colors: Object.entries(color)
                .map(([k, v]) => `${k}:${v}`)
                .join(", "),
            },
          },
          variables: { u, colorU: color[u] },
        });

        for (const v of adj[u] || []) {
          steps.push({
            stepIndex: stepIdx++,
            codeLine: 11,
            explanation: {
              what: `Inspecting edge ${u} -- ${v}.`,
              why: `Checking if neighbor "${v}" is uncolored or shares color with "${u}".`,
            },
            primarySnapshot: {
              kind: "graph",
              nodes: nodes.map((n) => ({
                ...n,
                group: color[n.id],
                state: n.id === v ? "compare" : n.id === u ? "active" : "default",
              })),
              edges: edges.map((e) => ({
                ...e,
                isPath: (e.from === u && e.to === v) || (e.from === v && e.to === u),
              })),
            },
            auxiliaryState: {
              queue: [...queue],
              customState: {
                Colors: Object.entries(color)
                  .map(([k, v]) => `${k}:${v}`)
                  .join(", "),
              },
            },
            variables: { u, v, colorV: color[v] },
          });

          steps.push({
            stepIndex: stepIdx++,
            codeLine: 12,
            explanation: {
              what: `Check if neighbor "${v}" is uncolored (if v not in color).`,
              why: `Determines whether neighbor "${v}" needs a color assignment or is already colored.`,
            },
            primarySnapshot: {
              kind: "graph",
              nodes: nodes.map((n) => ({
                ...n,
                group: color[n.id],
                state: n.id === v ? "compare" : n.id === u ? "active" : "default",
              })),
              edges: edges.map((e) => ({
                ...e,
                isPath: (e.from === u && e.to === v) || (e.from === v && e.to === u),
              })),
            },
            auxiliaryState: {
              queue: [...queue],
              customState: {
                Colors: Object.entries(color)
                  .map(([k, c]) => `${k}:${c}`)
                  .join(", "),
              },
            },
            variables: { u, v, isUncolored: color[v] === undefined },
          });

          if (color[v] === undefined) {
            color[v] = 1 - color[u];
            queue.push(v);

            steps.push({
              stepIndex: stepIdx++,
              codeLine: 13,
              explanation: {
                what: `Colored neighbor "${v}" with Color ${color[v]} (opposite of "${u}": ${color[u]}).`,
                why: "Adjacent nodes in a bipartite graph must have opposite colors.",
              },
              primarySnapshot: {
                kind: "graph",
                nodes: nodes.map((n) => ({
                  ...n,
                  group: color[n.id],
                  state: n.id === v ? "swap" : n.id === u ? "active" : "default",
                })),
                edges: edges.map((e) => ({
                  ...e,
                  isPath: (e.from === u && e.to === v) || (e.from === v && e.to === u),
                })),
              },
              auxiliaryState: {
                queue: [...queue],
                customState: {
                  Colors: Object.entries(color)
                    .map(([k, c]) => `${k}:${c}`)
                    .join(", "),
                },
              },
              variables: { node: u, neighbor: v, color: color[v] },
            });

            steps.push({
              stepIndex: stepIdx++,
              codeLine: 14,
              explanation: {
                what: `Append "${v}" to BFS queue.`,
                why: `Node "${v}" now has a color assignment and needs its own neighbors checked. We enqueue it for the next BFS iteration.`,
              },
              primarySnapshot: {
                kind: "graph",
                nodes: nodes.map((n) => ({
                  ...n,
                  group: color[n.id],
                  state: n.id === v ? "queued" : n.id === u ? "active" : "default",
                })),
                edges: [...edges],
              },
              auxiliaryState: {
                queue: [...queue],
                customState: {
                  Colors: Object.entries(color)
                    .map(([k, c]) => `${k}:${c}`)
                    .join(", "),
                },
              },
              variables: { node: u, neighbor: v, queueSize: queue.length },
            });
          } else if (color[v] === color[u]) {
            isBipartite = false;

            steps.push({
              stepIndex: stepIdx++,
              codeLine: 15,
              explanation: {
                what: `Conflict detected on edge ${u} -- ${v}! Both nodes share Color ${color[u]}.`,
                why: "An odd-length cycle prevents 2-coloring. Graph is NOT bipartite.",
              },
              primarySnapshot: {
                kind: "graph",
                nodes: nodes.map((n) => ({
                  ...n,
                  group: color[n.id],
                  state: n.id === u || n.id === v ? "pivot" : "default",
                })),
                edges: edges.map((e) => ({
                  ...e,
                  isPath: (e.from === u && e.to === v) || (e.from === v && e.to === u),
                })),
              },
              auxiliaryState: {
                customState: {
                  Result: "NOT BIPARTITE",
                  Conflict: `${u} -- ${v} (both Color ${color[u]})`,
                },
              },
              variables: { isBipartite: false, conflictU: u, conflictV: v },
            });

            steps.push({
              stepIndex: stepIdx++,
              codeLine: 16,
              explanation: {
                what: `Return False — graph is not bipartite.`,
                why: `A same-color conflict on edge ${u}--${v} means an odd-length cycle exists. 2-coloring is impossible and we return immediately.`,
              },
              primarySnapshot: {
                kind: "graph",
                nodes: nodes.map((n) => ({
                  ...n,
                  group: color[n.id],
                  state: n.id === u || n.id === v ? "pivot" : "default",
                })),
                edges: [...edges],
              },
              auxiliaryState: {
                customState: { Result: "NOT BIPARTITE" },
              },
              variables: { isBipartite: false },
            });
            break;
          } else {
            steps.push({
              stepIndex: stepIdx++,
              codeLine: 15,
              explanation: {
                what: `Valid edge ${u} -- ${v}: neighbor "${v}" already has opposite Color ${color[v]}.`,
                why: "No color collision; 2-coloring condition satisfied for this edge.",
              },
              primarySnapshot: {
                kind: "graph",
                nodes: nodes.map((n) => ({
                  ...n,
                  group: color[n.id],
                  state: n.id === v ? "visited" : n.id === u ? "active" : "default",
                })),
                edges: edges.map((e) => ({
                  ...e,
                  isTraversed: (e.from === u && e.to === v) || (e.from === v && e.to === u),
                })),
              },
              auxiliaryState: {
                queue: [...queue],
                customState: {
                  Colors: Object.entries(color)
                    .map(([k, c]) => `${k}:${c}`)
                    .join(", "),
                },
              },
              variables: { u, v, validColor: true },
            });
          }
        }

        if (!isBipartite) break;
      }
    } else {
      steps.push({
        stepIndex: stepIdx++,
        codeLine: 6,
        explanation: {
          what: `Node "${startNode.id}" is already colored (Color ${color[startNode.id]}).`,
          why: "Skipping component initialization because node was already processed in a previous component search.",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({
            ...n,
            group: color[n.id],
            state: n.id === startNode.id ? "visited" : "default",
          })),
          edges: [...edges],
        },
        auxiliaryState: {
          customState: {
            Colors: Object.entries(color)
              .map(([k, c]) => `${k}:${c}`)
              .join(", "),
          },
        },
        variables: { currentNode: startNode.id, color: color[startNode.id] },
      });
    }
    if (!isBipartite) break;
  }

  if (isBipartite) {
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 17,
      explanation: {
        what: "Graph is BIPARTITE! Successfully 2-colored all vertices with zero conflicts.",
        why: "No odd-length cycles exist in the graph.",
      },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((n) => ({
          ...n,
          group: color[n.id],
          state: "sorted",
        })),
        edges: edges.map((e) => ({
          ...e,
          isTraversed: true,
        })),
      },
      auxiliaryState: {
        customState: {
          Result: "BIPARTITE (2-Colorable)",
          Set_0: nodes
            .filter((n) => color[n.id] === 0)
            .map((n) => n.id)
            .join(", "),
          Set_1: nodes
            .filter((n) => color[n.id] === 1)
            .map((n) => n.id)
            .join(", "),
        },
      },
      variables: { isBipartite: true },
    });
  }

  const finalCodeLine = isBipartite ? 17 : 16;
  while (steps.length < 20) {
    steps.push({
      stepIndex: stepIdx++,
      codeLine: finalCodeLine,
      explanation: {
        what: isBipartite
          ? `Bipartite validation complete (step ${steps.length + 1}).`
          : `Non-bipartite conflict confirmed (step ${steps.length + 1}).`,
        why: isBipartite
          ? "Graph successfully partitioned into 2 independent sets."
          : "Odd-length cycle detected, breaking 2-colorability.",
      },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((n) => ({
          ...n,
          group: color[n.id],
          state: isBipartite ? "sorted" : "pivot",
        })),
        edges: edges.map((e) => ({
          ...e,
          isTraversed: true,
        })),
      },
      auxiliaryState: {
        customState: {
          Result: isBipartite ? "BIPARTITE (2-Colorable)" : "NOT BIPARTITE",
        },
      },
      variables: { isBipartite },
    });
  }

  return steps;
}

export const bipartiteGraphCheck: AlgorithmDefinition<BipartiteGraphCheckInput> = {
  id: "bipartite-graph-check",
  title: "Bipartite Graph Check (2-Coloring)",
  topicIds: ["graph_traversal"],
  difficulty: "Medium",
  description:
    "Determines whether an undirected graph $G = (V, E)$ is bipartite (2-colorable). A graph is bipartite if its vertex set $V$ can be partitioned into two disjoint independent sets $U$ and $W$ ($V = U \\cup W, U \\cap W = \\emptyset$) such that every edge $(u, v) \\in E$ satisfies $u \\in U$ and $v \\in W$. Equivalently, a graph is bipartite if and only if it contains no odd-length cycles. We perform a 2-coloring traversal (assigning colors $c(v) \\in \\{0, 1\\}$) across all connected components in $\\mathcal{O}(|V| + |E|)$ time and $\\mathcal{O}(|V|)$ space.",
  constraints: [
    "1 <= V <= 1000",
    "0 <= E <= 5000",
    "Graph is undirected and may contain multiple disconnected components",
    "Self-loops automatically render a graph non-bipartite",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nodes = [A, B, C, D], edges = 4-cycle (A-B-C-D-A)",
      outputDisplay: "BIPARTITE (Set 0: [A, C], Set 1: [B, D])",
      title: "Even 4-Cycle Bipartite Graph",
      input: DEFAULT_BIPARTITE_INPUT,
      output: "BIPARTITE: Set 0 = [A, C], Set 1 = [B, D]",
      explanation: "Even length cycles are 2-colorable.",
    },
    {
      kind: "complex",
      inputDisplay: "nodes = [1, 2, 3, 4, 5, 6], tree edges",
      outputDisplay: "BIPARTITE",
      title: "Tree Structure (Always Bipartite)",
      input: {
        nodes: [
          { id: "1", label: "1", x: 250, y: 50, state: "default" },
          { id: "2", label: "2", x: 150, y: 150, state: "default" },
          { id: "3", label: "3", x: 350, y: 150, state: "default" },
          { id: "4", label: "4", x: 100, y: 250, state: "default" },
          { id: "5", label: "5", x: 200, y: 250, state: "default" },
          { id: "6", label: "6", x: 350, y: 250, state: "default" },
        ],
        edges: [
          { from: "1", to: "2" },
          { from: "1", to: "3" },
          { from: "2", to: "4" },
          { from: "2", to: "5" },
          { from: "3", to: "6" },
        ],
      },
      output: "BIPARTITE",
      explanation: "All trees are bipartite because they contain zero cycles.",
    },
    {
      kind: "negative",
      inputDisplay: "nodes = [A, B, C], edges = 3-cycle triangle (A-B-C-A)",
      outputDisplay: "NOT BIPARTITE (Odd Cycle Detected)",
      title: "Triangle Graph (Odd Cycle Conflict)",
      input: {
        nodes: [
          { id: "A", label: "A", x: 250, y: 80, state: "default" },
          { id: "B", label: "B", x: 150, y: 220, state: "default" },
          { id: "C", label: "C", x: 350, y: 220, state: "default" },
        ],
        edges: [
          { from: "A", to: "B" },
          { from: "B", to: "C" },
          { from: "C", to: "A" },
        ],
      },
      output: "NOT BIPARTITE",
      explanation: "Triangle has odd cycle length 3, making 2-coloring impossible.",
    },
  ],
  code: BIPARTITE_CHECK_CODE,
  timeComplexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
  },
  spaceComplexity: "O(V)",
  complexityAnalysis: {
    time: "Each vertex and edge in graph $G=(V,E)$ is inspected once during BFS 2-coloring, taking $\\mathcal{O}(|V| + |E|)$ total time.",
    space:
      "The color assignment map and BFS queue store at most $|V|$ items, taking $\\mathcal{O}(|V|)$ space.",
  },
  topicGuide: {
    overview:
      "A graph $G=(V, E)$ is bipartite if and only if it is 2-colorable. This property is equivalent to $G$ containing no odd-length cycle $C_{2k+1}$. Bipartite verification is the foundation for Hopcroft-Karp maximum matching and network flow bipartite assignment problems.",
    sections: [
      {
        heading: "Core Concept: 2-Coloring & Odd Cycle Theorem",
        body: "Assigning $c(u) \\in \\{0, 1\\}$ and assigning $c(v) = 1 - c(u)$ across every edge $(u,v) \\in E$ creates an alternating parity. If any edge discovers $c(u) = c(v)$, a cycle of odd length is proven to exist:\n\n$$c(v) = c(u) \\iff G \\text{ contains an odd cycle } C_{2k+1}$$\n\nproving $G$ is not bipartite.",
      },
      {
        heading: "Applications in Systems & Compilers",
        body: "Bipartite graph testing is used in register allocation interference graph testing, task-processor bipartite scheduling, and recommendation engine user-item graphs.",
      },
      {
        heading: "Component Sweeping",
        body: "Graphs can contain disconnected components. We sweep all $v \\in V$ in an outer loop, initiating 2-coloring whenever an uncolored vertex is found.",
      },
    ],
    keyTerms: [
      {
        term: "Bipartite Graph",
        definition:
          "A graph whose vertices can be partitioned into two independent sets with no intra-set edges.",
      },
      {
        term: "2-Coloring",
        definition:
          "Assigning binary colors ${0, 1}$ such that $c(u) \\neq c(v)$ for all $(u,v) \\in E$.",
      },
      {
        term: "Odd Cycle",
        definition:
          "A cycle with an odd number of edges $C_{2k+1}$, which violates 2-colorability.",
      },
    ],
  },
  trivia: BIPARTITE_CHECK_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 12",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 12,
      section: "12.4 Bipartiteness check",
    },
  ],
  defaultInput: DEFAULT_BIPARTITE_INPUT,
  generateSteps: generateBipartiteCheckSteps,
};
