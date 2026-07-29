import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AssessmentWorkspace } from "../AssessmentWorkspace";

describe("AssessmentWorkspace", () => {
  it("dispatches a trace learning item to its accessible assessment renderer", () => {
    render(
      <AssessmentWorkspace
        item={
          {
            id: "queue-trace",
            kind: "trace",
            title: "Queue trace",
            description: "Predict the next queue state.",
            assessment: {
              kind: "trace",
              renderer: "trace-assessment",
              triviaEligible: false,
              payload: {
                prompt: "Which job runs next?",
                currentState: "ready: [A]",
                referenceNextState: "running: A",
              },
            },
          } as never
        }
      />,
    );

    expect(screen.getByRole("heading", { name: "Queue trace" })).toBeInTheDocument();
    expect(screen.getByRole("main", { name: "Queue trace assessment" })).toBeInTheDocument();
  });
});
