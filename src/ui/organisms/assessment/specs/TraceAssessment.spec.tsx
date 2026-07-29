import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TraceAssessment } from "../TraceAssessment";

describe("TraceAssessment", () => {
  it("requires a next-state prediction before revealing the authored state", () => {
    const onSubmit = vi.fn(() => true);
    render(
      <TraceAssessment
        title="Queue trace"
        payload={{
          variant: "default",
          changedContext: false,
          isomorphicRetest: false,
          prompt: "Which job runs next?",
          currentState: "ready: [A, B]",
          referenceNextState: "running: A; ready: [B]",
        }}
        submissionContext={{
          confidence: 4,
          invariantEvidence: "FIFO selects A first.",
          tradeoffEvidence: "",
        }}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.queryByText("running: A; ready: [B]")).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Predicted next state" }), {
      target: { value: "A moves to running" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reveal next state" }));

    expect(screen.getByText("running: A; ready: [B]")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Reference state revealed");
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "trace",
        variant: "default",
        gradingStatus: "pending",
        score: 0,
        response: { prediction: "A moves to running" },
      }),
    );
  });

  it("explains when no authored trace payload is available", () => {
    render(
      <TraceAssessment
        title="Queue trace"
        submissionContext={{ confidence: 3, invariantEvidence: "", tradeoffEvidence: "" }}
        onSubmit={vi.fn(() => true)}
      />,
    );

    expect(screen.getByRole("heading", { name: "Queue trace" })).toBeInTheDocument();
    expect(screen.getByLabelText("Queue trace trace assessment")).toHaveTextContent(
      "This trace assessment has no authored payload yet.",
    );
  });
});
