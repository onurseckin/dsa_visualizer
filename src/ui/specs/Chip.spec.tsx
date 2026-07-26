import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Chip } from "../Chip";

describe("Chip render spec", () => {
  it("renders label and value with separator", () => {
    render(<Chip label="Time" value="O(N)" />);
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText(":")).toBeInTheDocument();
    expect(screen.getByText("O(N)")).toBeInTheDocument();
  });

  it("renders label alone without separator", () => {
    render(<Chip label="Label Only" />);
    expect(screen.getByText("Label Only")).toBeInTheDocument();
    expect(screen.queryByText(":")).toBeNull();
  });

  it("renders value alone without separator", () => {
    render(<Chip value="Value Only" />);
    expect(screen.getByText("Value Only")).toBeInTheDocument();
    expect(screen.queryByText(":")).toBeNull();
  });

  it('supports size="md" and variant="subtle" classes and custom className', () => {
    const { container } = render(
      <Chip label="Tag" size="md" variant="subtle" className="custom-chip">
        Extra Child
      </Chip>,
    );
    const chip = container.querySelector(".ui-chip");
    expect(chip).toHaveClass("ui-chip--md", "ui-chip--subtle", "custom-chip");
    expect(screen.getByText("Extra Child")).toBeInTheDocument();
  });

  it("renders standalone Chip.Label and Chip.Value subcomponents", () => {
    render(
      <div>
        <Chip.Label>SubLabel</Chip.Label>
        <Chip.Value>SubValue</Chip.Value>
      </div>,
    );
    expect(screen.getByText("SubLabel")).toHaveClass("ui-chip__label");
    expect(screen.getByText("SubValue")).toHaveClass("ui-chip__value");
  });
});
