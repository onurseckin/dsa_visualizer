import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutionOutput } from "../ExecutionOutput";

describe("ExecutionOutput", () => {
  it("shows separate output wells, duration, and per-case results", () => {
    render(
      <ExecutionOutput
        result={{
          runId: "run-1",
          status: "failed",
          runtime: "server",
          stdout: "hello",
          stderr: "assertion failed",
          durationMs: 12,
          cases: [
            {
              id: "example",
              status: "failed",
              stdout: "hello",
              stderr: "assertion failed",
              durationMs: 12,
              actual: 4,
            },
          ],
        }}
        caseLabels={new Map([["example", "Example case"]])}
      />,
    );

    expect(screen.getAllByText("Failed")).toHaveLength(2);
    expect(screen.getByText("12 ms")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Standard output" })).toHaveTextContent("hello");
    expect(screen.getByRole("region", { name: "Standard error" })).toHaveTextContent(
      "assertion failed",
    );
    expect(screen.getByText("Example case")).toBeInTheDocument();
  });

  it("renders explicit empty and informational states", () => {
    const view = render(<ExecutionOutput message="Tests are not available yet." />);
    expect(screen.getByText("Tests are not available yet.")).toBeInTheDocument();

    view.rerender(<ExecutionOutput />);
    expect(screen.getByText("Run your code to see output.")).toBeInTheDocument();
  });
});
