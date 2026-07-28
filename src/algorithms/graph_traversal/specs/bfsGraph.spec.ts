import { describe, expect, it } from "vitest";
import { bfsGraph, DEFAULT_BFS_INPUT, generateBFSGraphSteps } from "../bfsGraph";

describe("bfsGraph spec logic", () => {
  it("has category graph_traversal and valid metadata", () => {
    expect(bfsGraph.id).toBe("bfs-graph");
    expect(bfsGraph.title).toBe("BFS Graph Traversal");
    expect(bfsGraph.topicIds).toContain("graph_traversal");
    expect(bfsGraph.defaultInput).toEqual(DEFAULT_BFS_INPUT);
    expect(bfsGraph.difficulty).toBe("Medium");
  });

  it("generates non-empty steps with queue and visited auxiliary state", () => {
    const steps = generateBFSGraphSteps(DEFAULT_BFS_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const hasQueueState = steps.some((step) => step.auxiliaryState.queue !== undefined);
    expect(hasQueueState).toBe(true);

    const hasVisitedState = steps.some((step) => step.auxiliaryState.visited !== undefined);
    expect(hasVisitedState).toBe(true);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("complete");

    const snap = lastStep.primarySnapshot;
    if (snap.kind === "graph") {
      const visitedNodes = snap.nodes.filter((n) => n.state === "visited");
      expect(visitedNodes.length).toBe(6);
    }
  });

  it("produces at least 20 steps for default input", () => {
    const steps = generateBFSGraphSteps(DEFAULT_BFS_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
  });

  it("handles disconnected graph components", () => {
    const customInput = {
      startNodeId: "A",
      nodes: [
        { id: "A", label: "A", state: "default" as const },
        { id: "B", label: "B", state: "default" as const },
        { id: "C", label: "C", state: "default" as const },
      ],
      edges: [{ from: "A", to: "B" }],
    };

    const steps = generateBFSGraphSteps(customInput);
    const lastStep = steps[steps.length - 1];
    const snap = lastStep.primarySnapshot;

    if (snap.kind === "graph") {
      const visitedIds = snap.nodes.filter((n) => n.state === "visited").map((n) => n.id);
      expect(visitedIds).toContain("A");
      expect(visitedIds).toContain("B");
      expect(visitedIds).not.toContain("C");
    }
  });

  it("handles non-existent start node", () => {
    const customInput = {
      startNodeId: "Z",
      nodes: [{ id: "A", label: "A", state: "default" as const }],
      edges: [],
    };

    const steps = generateBFSGraphSteps(customInput);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.explanation.what).toContain("complete");
  });
});

describe("bfsGraph trivia metadata", () => {
  const meta = bfsGraph.trivia;
  const lines = bfsGraph.code.replace(/\s+$/, "").split("\n");

  it("maps every non-blank code line in lineExplanations", () => {
    expect(meta?.lineExplanations).toBeDefined();
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (line.trim().length > 0) {
        expect(meta?.lineExplanations?.[lineNum]).toBeDefined();
        expect(typeof meta?.lineExplanations?.[lineNum]).toBe("string");
      }
    });
  });

  it("points skipLines and hints at real, non-empty lines", () => {
    expect(meta).toBeDefined();
    const skipped = meta?.skipLines ?? [];
    const hinted = (meta?.hints ?? []).map((entry) => entry.line);
    expect(hinted.length).toBeGreaterThanOrEqual(2);
    [...skipped, ...hinted].forEach((line) => {
      expect(line).toBeGreaterThanOrEqual(1);
      expect(line).toBeLessThanOrEqual(lines.length);
      expect(lines[line - 1].trim()).not.toBe("");
    });
    // A hint on a line the drill never hides would never be shown.
    hinted.forEach((line) => expect(skipped).not.toContain(line));
  });

  it("never offers a distractor that is actually a correct line", () => {
    const real = new Set(lines.map((line) => line.trim()));
    const distractors = meta?.distractors ?? [];
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    expect(new Set(distractors).size).toBe(distractors.length);
    distractors.forEach((distractor) => {
      expect(real.has(distractor.trim())).toBe(false);
    });
  });
});
