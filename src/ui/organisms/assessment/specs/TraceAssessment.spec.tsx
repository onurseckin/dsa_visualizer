import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TraceAssessment } from "../TraceAssessment";

describe("TraceAssessment", () => {
  it("requires a next-state prediction before revealing the authored state", () => {
    render(
      <TraceAssessment
        title="Queue trace"
        payload={{
          prompt: "Which job runs next?",
          currentState: "ready: [A, B]",
          referenceNextState: "running: A; ready: [B]",
        }}
      />,
    );

    expect(screen.queryByText("running: A; ready: [B]")).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Predicted next state" }), {
      target: { value: "A moves to running" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reveal next state" }));

    expect(screen.getByText("running: A; ready: [B]")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Reference state revealed");
  });
});
