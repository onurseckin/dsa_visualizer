import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ScenarioAssessment } from "../ScenarioAssessment";

describe("ScenarioAssessment", () => {
  it("captures a constrained choice and rationale without claiming an exact output", () => {
    const onSubmit = vi.fn(() => true);
    render(
      <ScenarioAssessment
        title="Serving decision"
        prompt={{
          context: "Traffic has doubled while p99 remains fixed.",
          question: "Which response is defensible?",
          constraints: ["Keep p99 under 120 ms"],
        }}
        payload={{
          variant: "doubled-traffic",
          changedContext: true,
          isomorphicRetest: false,
          choices: ["Batch more aggressively", "Add capacity"],
          consequences: "Explain the latency and fairness consequence.",
        }}
        rubric={{
          criteria: [
            { id: "tradeoff", label: "Tradeoff", description: "Names a tradeoff.", points: 2 },
          ],
        }}
        submissionContext={{
          confidence: 4,
          invariantEvidence: "",
          tradeoffEvidence: "Capacity preserves the latency budget.",
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Decision" }), {
      target: { value: "Add capacity" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Rationale" }), {
      target: { value: "It protects latency while preserving fairness." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save response" }));

    expect(screen.getByRole("status")).toHaveTextContent("saved for rubric review");
    expect(screen.queryByText(/correct answer/i)).toBeNull();
    expect(screen.getByText("Tradeoff")).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "scenario",
        gradingStatus: "pending",
        changedContext: true,
        response: expect.objectContaining({ decision: "Add capacity" }),
      }),
    );
  });

  it("does not claim a response was saved when persistence declines it", () => {
    render(
      <ScenarioAssessment
        title="Serving decision"
        prompt={{ context: "Context", question: "Decision?" }}
        payload={{
          variant: "default",
          changedContext: false,
          isomorphicRetest: false,
          choices: ["A", "B"],
        }}
        rubric={{
          criteria: [{ id: "reasoning", label: "Reasoning", description: "Explains.", points: 1 }],
        }}
        submissionContext={{ confidence: 3, invariantEvidence: "", tradeoffEvidence: "" }}
        onSubmit={() => false}
      />,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Decision" }), {
      target: { value: "A" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Rationale" }), {
      target: { value: "Because of the constraint." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save response" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Response was not saved. No rubric review was queued.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(/pending/i);
    expect(screen.queryByText(/saved for rubric review/i)).toBeNull();
  });
});
