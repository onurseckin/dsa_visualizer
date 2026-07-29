import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAttemptStorage } from "../../../../learning/progress/storage";
import { AssessmentWorkspace } from "../AssessmentWorkspace";

const traceItem = (id: string, title: string, currentState: string, referenceNextState: string) =>
  ({
    id,
    kind: "trace",
    title,
    description: "Predict the next queue state.",
    assessment: {
      kind: "trace",
      renderer: "trace-assessment",
      triviaEligible: false,
      payload: {
        variant: "changed-queue",
        changedContext: true,
        isomorphicRetest: false,
        prompt: "Which job runs next?",
        currentState,
        referenceNextState,
        delayedRetrievalDueAt: 86_400_000,
        delayedRetrievalCompletedAt: 86_400_000,
      },
    },
  }) as never;

describe("AssessmentWorkspace", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("dispatches a trace item with shared confidence and evidence inputs", () => {
    render(
      <AssessmentWorkspace
        item={traceItem("queue-trace", "Queue trace", "ready: [A]", "running: A")}
        storage={createAttemptStorage({ sync: vi.fn() })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Queue trace" })).toBeInTheDocument();
    expect(screen.getByRole("main", { name: "Queue trace assessment" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Confidence" })).toHaveValue("3");
    expect(
      screen.getByRole("textbox", { name: "Governing invariant evidence" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Tradeoff evidence" })).toBeInTheDocument();
  });

  it("immediately persists a typed pending submission and reports it after reload", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    const item = traceItem("queue-trace", "Queue trace", "ready: [A]", "running: A");
    const view = render(<AssessmentWorkspace item={item} storage={storage} now={() => 1_000} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Confidence" }), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Governing invariant evidence" }), {
      target: { value: "FIFO selects A first." },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Predicted next state" }), {
      target: { value: "A starts running" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reveal next state" }));

    expect(storage.load()).toEqual([
      expect.objectContaining({
        itemId: "queue-trace",
        mode: "trace",
        variant: "changed-queue",
        gradingStatus: "pending",
        score: 0,
        confidence: 5,
        changedContext: true,
        isomorphicRetest: false,
        invariantEvidence: "FIFO selects A first.",
        delayedRetrievalDueAt: 86_400_000,
        createdAt: 1_000,
        updatedAt: 1_000,
        response: { prediction: "A starts running" },
      }),
    ]);
    expect(storage.load()[0]).not.toHaveProperty("delayedRetrievalCompletedAt");
    expect(screen.getByText("1 saved attempt")).toBeInTheDocument();

    view.unmount();
    render(<AssessmentWorkspace item={item} storage={storage} now={() => 2_000} />);
    expect(screen.getByText("1 saved attempt")).toBeInTheDocument();
  });

  it("records the workspace clock as retrieval completion only when the attempt is due", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    const completedAt = 86_400_500;
    render(
      <AssessmentWorkspace
        item={traceItem("queue-retrieval", "Queue retrieval", "ready: [A]", "running: A")}
        storage={storage}
        now={() => completedAt}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Predicted next state" }), {
      target: { value: "A starts running" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reveal next state" }));

    expect(storage.load()[0]).toMatchObject({
      delayedRetrievalDueAt: 86_400_000,
      delayedRetrievalCompletedAt: completedAt,
      createdAt: completedAt,
      updatedAt: completedAt,
    });
  });

  it("resets same-kind form state on navigation while retaining item-scoped attempts", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    const itemA = traceItem("queue-trace-a", "Queue trace A", "ready: [A]", "running: A");
    const itemB = traceItem("queue-trace-b", "Queue trace B", "ready: [B]", "running: B");
    const view = render(<AssessmentWorkspace item={itemA} storage={storage} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Predicted next state" }), {
      target: { value: "A starts" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reveal next state" }));
    expect(screen.getByText("running: A")).toBeInTheDocument();

    view.rerender(<AssessmentWorkspace item={itemB} storage={storage} />);
    expect(screen.getByRole("textbox", { name: "Predicted next state" })).toHaveValue("");
    expect(screen.queryByText("running: A")).toBeNull();
    expect(screen.getByText("0 saved attempts")).toBeInTheDocument();

    view.rerender(<AssessmentWorkspace item={itemA} storage={storage} />);
    expect(screen.getByRole("textbox", { name: "Predicted next state" })).toHaveValue("");
    expect(screen.getByText("1 saved attempt")).toBeInTheDocument();
  });

  it("renders a separate executable playground for a rubric-scored scenario", () => {
    const scenario = {
      id: "determinism-triage",
      kind: "scenario",
      title: "Determinism triage",
      description: "Diagnose a reproducibility incident without exact-answer grading.",
      objective: "Separate deterministic replay from unsupported guarantees.",
      completionEvidence: "A rubric response and a passing artifact validator.",
      topicIds: ["ml_python_scientific_computing"],
      difficultyProfile: {
        prerequisite: 2,
        representations: 2,
        horizon: 3,
        tradeoffs: 3,
      },
      difficultyLabel: "Advanced",
      difficulty: "Hard",
      sources: [
        {
          kind: "ml_infra",
          label: "PyTorch reproducibility",
          provenance: "verified",
          url: "https://docs.pytorch.org/docs/stable/notes/randomness.html",
        },
      ],
      assessment: {
        kind: "scenario",
        renderer: "scenario-assessment",
        triviaEligible: false,
        payload: {
          variant: "incident-triage",
          changedContext: true,
          isomorphicRetest: true,
        },
      },
      prompt: {
        context: "Two runs diverge after an environment change.",
        question: "What evidence would you collect before promising deterministic replay?",
      },
      rubric: {
        criteria: [
          {
            id: "boundary",
            label: "Boundary",
            description: "Names the platform and version boundary.",
            points: 1,
          },
        ],
      },
      playground: {
        code: "def validate_replay(record):\n    return record['seeded']",
        starterCode: "def validate_replay(record):\n    pass",
        execution: {
          runtime: "browser",
          entrypoint: "validate_replay",
          invocation: {
            kind: "function",
            arguments: [{ from: "input", path: [] }],
          },
          packages: [],
          outputContract: "Return whether the replay record declares a seed.",
          cases: [
            {
              id: "basic",
              label: "Seeded",
              input: { seeded: true },
              expected: true,
              comparison: "deep-equal",
            },
          ],
        },
        generateSteps: () => [],
      },
    } as never;

    render(
      <AssessmentWorkspace item={scenario} storage={createAttemptStorage({ sync: vi.fn() })} />,
    );

    expect(screen.getByRole("main", { name: "Determinism triage assessment" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Determinism triage code workspace" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/separate from the rubric-scored response/i)).toBeInTheDocument();
  });
});
