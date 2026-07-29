import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CapstoneAssessment } from "../CapstoneAssessment";

describe("CapstoneAssessment", () => {
  it("saves a design, checklist, rubric, and incident timeline without averaging critical failures", () => {
    const onSubmit = vi.fn(() => true);
    render(
      <CapstoneAssessment
        title="Promotion design"
        prompt={{ context: "Delayed labels arrive after rollout.", question: "Design the gates." }}
        payload={{
          variant: "delayed-label-rollout",
          changedContext: true,
          isomorphicRetest: false,
          checklist: [{ id: "rollback", label: "Rollback path" }],
          incidentTimeline: [{ id: "detect", label: "Detection" }],
        }}
        rubric={{
          criteria: [
            {
              id: "safety",
              label: "Safety",
              description: "Includes a safe rollback.",
              points: 3,
              critical: true,
            },
          ],
        }}
        submissionContext={{
          confidence: 4,
          invariantEvidence: "Rollback remains safe.",
          tradeoffEvidence: "Canaries slow promotion.",
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Design response" }), {
      target: { value: "Stage a canary and retain a fallback." },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Rollback path" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Detection incident timeline" }), {
      target: { value: "Alert when slice quality falls." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save capstone response" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "capstone",
        gradingStatus: "pending",
        response: expect.objectContaining({
          design: "Stage a canary and retain a fallback.",
          checklist: ["rollback"],
          rubric: expect.objectContaining({ criteria: expect.any(Array) }),
        }),
      }),
    );
    expect(screen.getByText(/critical criteria are never averaged away/i)).toBeInTheDocument();
  });

  it("does not claim a capstone was saved when persistence declines it", () => {
    render(
      <CapstoneAssessment
        title="Promotion design"
        prompt={{ context: "Context", question: "Design?" }}
        payload={{
          variant: "default",
          changedContext: false,
          isomorphicRetest: false,
          checklist: [],
          incidentTimeline: [],
        }}
        rubric={{
          criteria: [{ id: "design", label: "Design", description: "Defensible.", points: 1 }],
        }}
        submissionContext={{ confidence: 3, invariantEvidence: "", tradeoffEvidence: "" }}
        onSubmit={() => false}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Design response" }), {
      target: { value: "A design that still needs review." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save capstone response" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Capstone response was not saved. No analytic review was queued.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(/pending/i);
    expect(screen.queryByText(/response saved/i)).toBeNull();
  });
});
