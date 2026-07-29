import type {
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import type { TopologicalSortInput } from "./definition";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Topological Sorting arranges the vertices of a Directed Acyclic Graph (DAG) into a linear sequence where for every directed edge u -> v, task u appears before task v.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A", state: "default" },
        { id: "B", label: "B", state: "default" },
        { id: "C", label: "C", state: "default" },
        { id: "D", label: "D", state: "default" },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
      ],
    },
  },
  {
    narrative:
      "If a directed graph contains a cycle (e.g., A -> B -> C -> A), no valid topological ordering exists because every node in the cycle depends on another member.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A", state: "active" },
        { id: "B", label: "B", state: "active" },
        { id: "C", label: "C", state: "active" },
      ],
      edges: [
        { from: "A", to: "B", isTraversed: true },
        { from: "B", to: "C", isTraversed: true },
        { from: "C", to: "A", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Kahn's algorithm uses in-degrees — the count of incoming directed edges pointing into each node — to measure remaining unfulfilled prerequisites.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (in: 0)", state: "active" },
        { id: "B", label: "B (in: 1)", state: "default" },
        { id: "C", label: "C (in: 1)", state: "default" },
        { id: "D", label: "D (in: 2)", state: "default" },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
      ],
    },
  },
  {
    narrative:
      "Nodes with in-degree equal to 0 have no incoming dependencies and can be scheduled immediately at the start of the ordering.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (Ready)", state: "queued" },
        { id: "B", label: "B (in: 1)", state: "default" },
        { id: "C", label: "C (in: 1)", state: "default" },
        { id: "D", label: "D (in: 2)", state: "default" },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
      ],
    },
  },
  {
    narrative:
      "A First-In-First-Out (FIFO) ready queue tracks all vertices whose in-degrees have dropped to 0, awaiting scheduling.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (Queue)", state: "queued" },
        { id: "B", label: "B (in: 1)", state: "default" },
        { id: "C", label: "C (in: 1)", state: "default" },
        { id: "D", label: "D (in: 2)", state: "default" },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
      ],
    },
  },
  {
    narrative:
      "When a ready vertex u is dequeued and appended to the topological sequence, its outgoing directed edges are removed, resolving dependencies.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (Sorted)", state: "sorted" },
        { id: "B", label: "B (in: 0)", state: "compare" },
        { id: "C", label: "C (in: 0)", state: "compare" },
        { id: "D", label: "D (in: 2)", state: "default" },
      ],
      edges: [
        { from: "A", to: "B", isTraversed: true },
        { from: "A", to: "C", isTraversed: true },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
      ],
    },
  },
  {
    narrative:
      "As dependencies are resolved, downstream neighbors have their in-degrees decremented; any neighbor reaching in-degree 0 joins the ready queue.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (Sorted)", state: "sorted" },
        { id: "B", label: "B (Ready)", state: "queued" },
        { id: "C", label: "C (Ready)", state: "queued" },
        { id: "D", label: "D (in: 2)", state: "default" },
      ],
      edges: [
        { from: "A", to: "B", isPath: true },
        { from: "A", to: "C", isPath: true },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
      ],
    },
  },
  {
    narrative:
      "This process repeats until the queue is empty: every node placed in sequence is marked settled and its outgoing edges are pruned.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (Sorted)", state: "sorted" },
        { id: "B", label: "B (Sorted)", state: "sorted" },
        { id: "C", label: "C (Sorted)", state: "sorted" },
        { id: "D", label: "D (Ready)", state: "queued" },
      ],
      edges: [
        { from: "A", to: "B", isPath: true },
        { from: "A", to: "C", isPath: true },
        { from: "B", to: "D", isPath: true },
        { from: "C", to: "D", isPath: true },
      ],
    },
  },
  {
    narrative:
      "If the output sequence contains all V vertices, Kahn's algorithm succeeds in O(V + E) time; if fewer nodes are processed, a cycle is confirmed.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "A", label: "A (1)", state: "sorted" },
        { id: "B", label: "B (2)", state: "sorted" },
        { id: "C", label: "C (3)", state: "sorted" },
        { id: "D", label: "D (4)", state: "sorted" },
      ],
      edges: [
        { from: "A", to: "B", isPath: true },
        { from: "A", to: "C", isPath: true },
        { from: "B", to: "D", isPath: true },
        { from: "C", to: "D", isPath: true },
      ],
    },
  },
];

export const generateTopologicalSortSteps = (input: TopologicalSortInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNodes = Array.isArray(input?.nodes) ? input.nodes : [];
  const rawEdges = Array.isArray(input?.edges) ? input.edges : [];

  // Intro Phase (9 snapshots)
  const intro = createIntroSnapshots();
  for (const item of intro) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: item.narrative,
        primarySnapshot: item.primarySnapshot,
      }),
    );
  }

  // Walkthrough Phase
  const nodes: GraphNodeItem[] = rawNodes.map((n) => ({
    ...n,
    state: "default",
  }));

  const edges: GraphEdgeItem[] = rawEdges.map((e) => ({
    ...e,
    isTraversed: false,
    isPath: false,
  }));

  const inDegree: Record<string, number> = {};
  const queue: string[] = [];
  const order: string[] = [];

  if (nodes.length === 0) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: "The input graph contains no vertices, so the topological ordering is empty.",
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: [],
          edges: [],
        },
        variables: { completed: true, orderLength: 0 },
      }),
    );
    return steps;
  }

  for (const n of nodes) {
    inDegree[n.id] = 0;
  }
  for (const e of edges) {
    if (inDegree[e.to] !== undefined) {
      inDegree[e.to]++;
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Calculated initial in-degrees for all ${nodes.length} vertices. Nodes with in-degree 0 have zero prerequisites.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({
          ...n,
          label: `${n.id} (in:${inDegree[n.id]})`,
          state: inDegree[n.id] === 0 ? "active" : "default",
        })),
        edges: edges.map((e) => ({ ...e })),
      },
      auxiliaryState: {
        queue: [],
        visited: [],
      },
      variables: { nodeCount: nodes.length, edgeCount: edges.length },
    }),
  );

  for (const n of nodes) {
    if (inDegree[n.id] === 0) {
      queue.push(n.id);
      n.state = "queued";
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative:
        queue.length > 0
          ? `Enqueued initial zero in-degree vertices: [${queue.join(", ")}]. These nodes are ready for scheduling.`
          : "Found no initial vertices with in-degree 0. The ready queue is empty.",
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({
          ...n,
          label: `${n.id} (in:${inDegree[n.id]})`,
          state: queue.includes(n.id) ? "queued" : "compare",
        })),
        edges: edges.map((e) => ({ ...e })),
      },
      auxiliaryState: {
        queue: [...queue],
        visited: [],
      },
      variables: { initialQueueSize: queue.length },
    }),
  );

  while (queue.length > 0) {
    const u = queue.shift()!;
    const uNode = nodes.find((n) => n.id === u);
    if (uNode) {
      uNode.state = "active";
    }

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Dequeued vertex '${u}' from ready queue. All prerequisites for '${u}' have been satisfied.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: nodes.map((n) => ({
            ...n,
            label: `${n.id} (in:${inDegree[n.id]})`,
          })),
          edges: edges.map((e) => ({ ...e })),
        },
        auxiliaryState: {
          queue: [...queue],
          visited: [...order],
        },
        variables: { current: u, queueSize: queue.length },
      }),
    );

    order.push(u);
    if (uNode) {
      uNode.state = "sorted";
    }

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Appended vertex '${u}' to topological output sequence: [${order.join(" -> ")}].`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: nodes.map((n) => ({
            ...n,
            label: `${n.id} (in:${inDegree[n.id]})`,
          })),
          edges: edges.map((e) => ({ ...e })),
        },
        auxiliaryState: {
          queue: [...queue],
          visited: [...order],
        },
        variables: { current: u, orderLength: order.length },
      }),
    );

    const outgoingEdges = edges.filter((e) => e.from === u);

    for (const edge of outgoingEdges) {
      edge.isTraversed = true;
      const v = edge.to;
      const vNode = nodes.find((n) => n.id === v);

      if (vNode && vNode.state !== "sorted") {
        vNode.state = "compare";
      }

      inDegree[v]--;

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Pruned directed edge '${u}' -> '${v}': decremented in-degree of neighbor '${v}' to ${inDegree[v]}.`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: nodes.map((n) => ({
              ...n,
              label: `${n.id} (in:${inDegree[n.id]})`,
            })),
            edges: edges.map((e) => ({ ...e })),
          },
          auxiliaryState: {
            queue: [...queue],
            visited: [...order],
          },
          variables: { u, v, newInDegree: inDegree[v] },
        }),
      );

      if (inDegree[v] === 0) {
        queue.push(v);
        if (vNode) {
          vNode.state = "queued";
        }

        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Vertex '${v}' reached in-degree 0: enqueued '${v}' as ready for scheduling.`,
            primarySnapshot: {
              kind: "graph",
              directed: true,
              nodes: nodes.map((n) => ({
                ...n,
                label: `${n.id} (in:${inDegree[n.id]})`,
              })),
              edges: edges.map((e) => ({ ...e })),
            },
            auxiliaryState: {
              queue: [...queue],
              visited: [...order],
            },
            variables: { v, queueSize: queue.length },
          }),
        );
      } else if (vNode && vNode.state !== "sorted") {
        vNode.state = "default";
      }
    }
  }

  const hasCycle = order.length < nodes.length;

  if (hasCycle) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Topological Sort failed: directed cycle detected! Only ${order.length} of ${nodes.length} vertices were scheduled because cycle members never reach in-degree 0.`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: nodes.map((n) => ({
            ...n,
            label: `${n.id} (in:${inDegree[n.id]})`,
            state: n.state === "sorted" ? "sorted" : "active",
          })),
          edges: edges.map((e) => ({ ...e })),
        },
        auxiliaryState: {
          queue: [],
          visited: [...order],
        },
        variables: { completed: true, hasCycle: true },
      }),
    );
  } else {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Topological Sort complete: successfully scheduled all ${nodes.length} vertices in valid order [${order.join(" -> ")}].`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: nodes.map((n) => ({
            ...n,
            label: `${n.id}`,
            state: "sorted",
          })),
          edges: edges.map((e) => ({ ...e, isPath: true })),
        },
        auxiliaryState: {
          queue: [],
          visited: [...order],
        },
        variables: { completed: true, hasCycle: false, result: order.join(" -> ") },
      }),
    );
  }

  return steps;
};
