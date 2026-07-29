import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DebuggingAssessment } from "../DebuggingAssessment";

describe("DebuggingAssessment", () => {
  it("keeps the corrected reference behind a learner response while showing authored evidence", () => {
    render(
      <DebuggingAssessment
        title="Leakage diagnosis"
        payload={{
          faultyStarter: "join(features, labels)",
          evidence: [{ label: "Log", content: "train AUC: 0.99; online AUC: 0.51" }],
          failingTests: ["point-in-time join rejects future labels"],
          hints: ["Compare event timestamps."],
        }}
        correctedReference="join_asof(features, labels, on='event_time')"
      />,
    );

    expect(screen.getByText("train AUC: 0.99; online AUC: 0.51")).toBeInTheDocument();
    expect(screen.queryByText("join_asof(features, labels, on='event_time')")).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Diagnosis and correction" }), {
      target: { value: "Use a point-in-time join." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reveal corrected reference" }));

    expect(screen.getByText("join_asof(features, labels, on='event_time')")).toBeInTheDocument();
  });
});
