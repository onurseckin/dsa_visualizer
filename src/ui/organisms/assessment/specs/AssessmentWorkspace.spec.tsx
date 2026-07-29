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
});
