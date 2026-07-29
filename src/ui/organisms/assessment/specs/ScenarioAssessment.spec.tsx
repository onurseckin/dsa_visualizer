import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScenarioAssessment } from "../ScenarioAssessment";

describe("ScenarioAssessment", () => {
  it("captures a constrained choice and rationale without claiming an exact output", () => {
    render(
      <ScenarioAssessment
        title="Serving decision"
        prompt={{
          context: "Traffic has doubled while p99 remains fixed.",
          question: "Which response is defensible?",
          constraints: ["Keep p99 under 120 ms"],
        }}
        payload={{
          choices: ["Batch more aggressively", "Add capacity"],
          consequences: "Explain the latency and fairness consequence.",
        }}
        rubric={{
          criteria: [
            { id: "tradeoff", label: "Tradeoff", description: "Names a tradeoff.", points: 2 },
          ],
        }}
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
  });
});
