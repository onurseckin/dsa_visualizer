import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CapstoneAssessment } from "../CapstoneAssessment";

describe("CapstoneAssessment", () => {
  it("saves a design, checklist, rubric, and incident timeline without averaging critical failures", () => {
    const onSave = vi.fn();
    render(
      <CapstoneAssessment
        title="Promotion design"
        prompt={{ context: "Delayed labels arrive after rollout.", question: "Design the gates." }}
        payload={{
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
        onSave={onSave}
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

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        design: "Stage a canary and retain a fallback.",
        checklist: ["rollback"],
        rubric: expect.objectContaining({ criteria: expect.any(Array) }),
      }),
    );
    expect(screen.getByText(/critical criteria are never averaged away/i)).toBeInTheDocument();
  });
});
