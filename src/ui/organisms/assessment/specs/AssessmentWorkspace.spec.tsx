import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { determinismTriage } from "../../../../learning/items/required-foundations";
import { createAttemptStorage } from "../../../../learning/progress/storage";
import { createAttemptRecord } from "../../../../learning/progress/types";
import { AssessmentWorkspace } from "../AssessmentWorkspace";

const traceItem = (
  id: string,
  title: string,
  currentState: string,
  referenceNextState: string,
  includeAuthoredRetrieval = true,
) =>
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
        ...(includeAuthoredRetrieval
          ? {
              delayedRetrievalDueAt: 86_400_000,
              delayedRetrievalCompletedAt: 86_400_000,
            }
          : {}),
      },
    },
  }) as never;

const debuggingItem = (id: string, title: string) =>
  ({
    id,
    kind: "debugging",
    title,
    description: "Repair the point-in-time join.",
    code: "def corrected_join(features, labels):\n    return join_asof(features, labels)",
    generateSteps: () => [],
    assessment: {
      kind: "debugging",
      renderer: "debugging-assessment",
      triviaEligible: false,
      payload: {
        variant: "point-in-time-repair",
        changedContext: true,
        isomorphicRetest: false,
        faultyStarter: "join(features, labels)",
        evidence: [{ label: "Leakage", content: "future labels entered training rows" }],
        failingTests: ["future labels are absent"],
        hints: ["Use an as-of boundary."],
      },
    },
  }) as never;

const scenarioItem = (id: string, title: string) =>
  ({
    id,
    kind: "scenario",
    title,
    description: "Choose an operational response.",
    prompt: {
      context: "A canary exceeds its latency budget.",
      question: "What should the on-call engineer do?",
      constraints: ["Protect the serving SLO."],
    },
    rubric: {
      criteria: [
        {
          id: "decision",
          label: "Safe decision",
          description: "The response protects the serving SLO before optimizing throughput.",
          points: 2,
          critical: true,
        },
      ],
    },
    assessment: {
      kind: "scenario",
      renderer: "scenario-assessment",
      triviaEligible: false,
      payload: {
        variant: "canary-slo",
        changedContext: true,
        isomorphicRetest: false,
        choices: ["Roll back", "Continue rollout"],
      },
    },
  }) as never;

const progressRecord = (createdAt: number, dueAt?: number) =>
  createAttemptRecord({
    itemId: "queue-retrieval-loop",
    mode: "trace",
    variant: `attempt-${createdAt}`,
    response: { prediction: "A starts running" },
    gradingStatus: "graded",
    score: 1,
    rubric: [{ id: "prediction", score: 1, maxScore: 1 }],
    criticalFailures: [],
    confidence: 4,
    misconceptionCodes: [],
    repairedMisconceptionCodes: [],
    isomorphicRetest: false,
    changedContext: true,
    invariantEvidence: "FIFO selects A.",
    tradeoffEvidence: "",
    delayedRetrievalDueAt: dueAt,
    delayedRetrievalCompletedAt: dueAt,
    createdAt,
    updatedAt: createdAt,
  });

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
    fireEvent.change(screen.getByRole("textbox", { name: "Tradeoff evidence" }), {
      target: { value: "Running the oldest job first reduces queue fairness risk." },
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
        tradeoffEvidence: "Running the oldest job first reduces queue fairness risk.",
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
    expect(screen.getByRole("region", { name: "Queue trace self review" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Saved attempt response" })).toHaveTextContent(
      "A starts running",
    );
    expect(screen.getByRole("region", { name: "Authored trace reference" })).toHaveTextContent(
      "running: A",
    );
  });

  it("restores a saved debugging diagnosis beside the immutable corrected reference", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    const item = debuggingItem("join-debug", "Join debug");
    const view = render(<AssessmentWorkspace item={item} storage={storage} now={() => 1_000} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Diagnosis and correction" }), {
      target: { value: "The equality join leaks future labels; use a point-in-time join." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reveal corrected reference" }));
    view.unmount();

    render(<AssessmentWorkspace item={item} storage={storage} now={() => 2_000} />);

    expect(screen.getByRole("region", { name: "Saved attempt response" })).toHaveTextContent(
      "The equality join leaks future labels",
    );
    expect(screen.getByRole("region", { name: "Immutable corrected reference" })).toHaveTextContent(
      "return join_asof(features, labels)",
    );
  });

  it("restores saved semantic-completion evidence beside the canonical code", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    const item = {
      id: "queue-completion",
      kind: "trace",
      title: "Queue completion",
      description: "Complete the FIFO scheduler.",
      code: "def schedule(queue):\n    return queue.pop(0)",
      generateSteps: () => [],
      assessment: {
        kind: "trace",
        renderer: "trace-assessment",
        triviaEligible: false,
        payload: {
          variant: "queue-trace",
          changedContext: true,
          isomorphicRetest: false,
          prompt: "Which job runs next?",
          currentState: "ready: [A]",
          referenceNextState: "running: A",
          completion: {
            variant: "fifo-completion",
            changedContext: true,
            isomorphicRetest: false,
            prompt: "Complete the scheduling decision.",
            context: "next_job = ____",
            requiredConcepts: ["FIFO"],
            consequencePrompt: "Explain the fairness consequence.",
          },
        },
      },
    } as never;
    const view = render(<AssessmentWorkspace item={item} storage={storage} now={() => 1_000} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Semantic completion" }), {
      target: { value: "queue.pop(0)" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Why this preserves the invariant" }), {
      target: { value: "It selects the oldest queued job." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit completion" }));
    view.unmount();

    render(<AssessmentWorkspace item={item} storage={storage} now={() => 2_000} />);

    expect(screen.getByRole("region", { name: "Saved attempt response" })).toHaveTextContent(
      "queue.pop(0)",
    );
    expect(screen.getByRole("region", { name: "Canonical code reference" })).toHaveTextContent(
      "return queue.pop(0)",
    );
  });

  it("restores a scenario response beside its authored prompt and rubric", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    const item = scenarioItem("canary-scenario", "Canary scenario");
    const view = render(<AssessmentWorkspace item={item} storage={storage} now={() => 1_000} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Decision" }), {
      target: { value: "Roll back" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Rationale" }), {
      target: { value: "Roll back the unhealthy canary to protect the serving SLO." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save response" }));
    view.unmount();

    render(<AssessmentWorkspace item={item} storage={storage} now={() => 2_000} />);

    expect(screen.getByRole("region", { name: "Saved attempt response" })).toHaveTextContent(
      "Roll back the unhealthy canary",
    );
    expect(
      screen.getByRole("region", { name: "Authored prompt and rubric reference" }),
    ).toHaveTextContent("Protect the serving SLO");
    expect(
      screen.getByRole("region", { name: "Authored prompt and rubric reference" }),
    ).toHaveTextContent("Safe decision (2 points, critical)");
  });

  it("turns a pending response into one explicitly reviewed graded attempt", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    const item = traceItem("queue-review", "Queue review", "ready: [A]", "running: A");
    let timestamp = 1_000;
    render(<AssessmentWorkspace item={item} storage={storage} now={() => timestamp} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Predicted next state" }), {
      target: { value: "A starts running" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reveal next state" }));
    expect(storage.load()[0]).toMatchObject({ gradingStatus: "pending", score: 0 });

    fireEvent.click(screen.getByRole("checkbox", { name: /prediction/i }));
    timestamp = 2_000;
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed grade" }));

    expect(storage.load()).toHaveLength(1);
    expect(storage.load()[0]).toMatchObject({
      gradingStatus: "graded",
      score: 1,
      createdAt: 1_000,
      updatedAt: 2_000,
      criticalFailures: [],
    });
    expect(screen.queryByRole("region", { name: "Queue review self review" })).toBeNull();
    expect(screen.getByText(/reviewed grade saved/i)).toBeInTheDocument();
  });

  it("keeps same-millisecond submissions distinct and advances through the pending review queue", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    const item = traceItem("queue-review-order", "Queue review order", "ready: [A]", "running: A");
    let timestamp = 1_000;
    render(<AssessmentWorkspace item={item} storage={storage} now={() => timestamp} />);

    const prediction = screen.getByRole("textbox", { name: "Predicted next state" });
    fireEvent.change(prediction, { target: { value: "first prediction" } });
    fireEvent.click(screen.getByRole("button", { name: "Reveal next state" }));
    fireEvent.change(prediction, { target: { value: "second prediction" } });
    fireEvent.click(screen.getByRole("button", { name: "Reveal next state" }));

    expect(storage.load().map(({ createdAt }) => createdAt)).toEqual([1_000, 1_001]);

    timestamp = 2_000;
    fireEvent.click(screen.getByRole("checkbox", { name: /prediction/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed grade" }));
    expect(storage.load().map(({ gradingStatus }) => gradingStatus)).toEqual(["pending", "graded"]);
    expect(
      screen.getByRole("region", { name: "Queue review order self review" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: /prediction/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed grade" }));
    expect(storage.load().map(({ gradingStatus }) => gradingStatus)).toEqual(["graded", "graded"]);
    expect(screen.queryByRole("region", { name: "Queue review order self review" })).toBeNull();
  });

  it("automatically assigns the next delayed-retrieval window when metadata omits one", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    const item = traceItem("queue-schedule", "Queue schedule", "ready: [A]", "running: A", false);
    render(<AssessmentWorkspace item={item} storage={storage} now={() => 1_000} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Predicted next state" }), {
      target: { value: "A starts running" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reveal next state" }));

    expect(storage.load()[0]).toMatchObject({
      delayedRetrievalDueAt: 86_401_000,
    });
    expect(storage.load()[0]).not.toHaveProperty("delayedRetrievalCompletedAt");
    expect(screen.getByText(/next retrieval is scheduled/i)).toBeInTheDocument();
  });

  it("presents a due retrieval as an actionable re-attempt", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    storage.save(progressRecord(0));

    render(
      <AssessmentWorkspace
        item={traceItem(
          "queue-retrieval-loop",
          "Queue retrieval loop",
          "ready: [A]",
          "running: A",
          false,
        )}
        storage={storage}
        now={() => 86_400_000}
      />,
    );

    expect(screen.getByLabelText("Retrieval schedule")).toHaveTextContent(
      /due now.*re-attempt.*self-review/i,
    );
  });

  it("reports when all three delayed-retrieval windows are complete", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    storage.save(progressRecord(0));
    for (const dueAt of [86_400_000, 7 * 86_400_000, 24 * 86_400_000]) {
      storage.save(progressRecord(dueAt, dueAt));
    }

    render(
      <AssessmentWorkspace
        item={traceItem(
          "queue-retrieval-loop",
          "Queue retrieval loop",
          "ready: [A]",
          "running: A",
          false,
        )}
        storage={storage}
        now={() => 24 * 86_400_000}
      />,
    );

    expect(screen.getByLabelText("Retrieval schedule")).toHaveTextContent(
      /all scheduled retrieval windows are complete/i,
    );
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
    expect(
      within(screen.getByRole("region", { name: "Queue trace A trace assessment" })).getByText(
        "running: A",
      ),
    ).toBeInTheDocument();

    view.rerender(<AssessmentWorkspace item={itemB} storage={storage} />);
    expect(screen.getByRole("textbox", { name: "Predicted next state" })).toHaveValue("");
    expect(screen.queryByText("running: A")).toBeNull();
    expect(screen.getByText("0 saved attempts")).toBeInTheDocument();

    view.rerender(<AssessmentWorkspace item={itemA} storage={storage} />);
    expect(screen.getByRole("textbox", { name: "Predicted next state" })).toHaveValue("");
    expect(screen.getByText("1 saved attempt")).toBeInTheDocument();
  });

  it("renders a separate executable playground for a rubric-scored scenario", () => {
    render(
      <AssessmentWorkspace
        item={determinismTriage}
        storage={createAttemptStorage({ sync: vi.fn() })}
      />,
    );

    expect(screen.getByRole("main", { name: "Determinism Triage assessment" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Determinism Triage code workspace" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Determinism Triage visual walkthrough" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/separate from the rubric-scored response/i)).toBeInTheDocument();
  });
});
