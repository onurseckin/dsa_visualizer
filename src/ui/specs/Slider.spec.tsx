import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "../index";

describe("Slider", () => {
  it("renders a range input wired to the label", () => {
    render(<Slider label="Speed" value={3} min={1} max={10} onChange={() => undefined} />);
    const slider = screen.getByRole("slider", { name: "Speed" });
    expect(slider).toHaveAttribute("type", "range");
    expect(slider).toHaveAttribute("min", "1");
    expect(slider).toHaveAttribute("max", "10");
    expect(slider).toHaveValue("3");
  });

  it("shows the raw value when no formatValue is given", () => {
    render(<Slider label="Speed" value={4} min={1} max={10} onChange={() => undefined} />);
    expect(screen.getByText("4")).toHaveClass("ui-slider__value");
  });

  it("formats the displayed value with formatValue", () => {
    render(
      <Slider
        label="Speed"
        value={2}
        min={1}
        max={10}
        onChange={() => undefined}
        formatValue={(v: number): string => `${v}x`}
      />,
    );
    expect(screen.getByText("2x")).toHaveClass("ui-slider__value");
  });

  it("calls onChange with a number on input change", () => {
    const onChange = vi.fn();
    render(<Slider label="Speed" value={3} min={1} max={10} onChange={onChange} />);
    fireEvent.change(screen.getByRole("slider", { name: "Speed" }), {
      target: { value: "7" },
    });
    expect(onChange).toHaveBeenCalledWith(7);
    expect(onChange.mock.calls[0][0]).toBeTypeOf("number");
  });

  it("passes step through to the input", () => {
    render(<Slider label="Zoom" value={1} min={0} max={2} step={0.5} onChange={() => undefined} />);
    expect(screen.getByRole("slider", { name: "Zoom" })).toHaveAttribute("step", "0.5");
  });

  it("handles undefined label and custom id, className, and style", () => {
    const { container } = render(
      <Slider
        id="custom-slider-id"
        value={5}
        min={0}
        max={10}
        onChange={() => undefined}
        className="my-slider"
        style={{ margin: "10px" }}
      />,
    );
    const wrapper = container.querySelector(".ui-slider");
    expect(wrapper).toHaveClass("ui-slider", "my-slider");
    expect(wrapper).toHaveStyle({ margin: "10px" });
    const root = container.querySelector(".ui-slider__root");
    expect(root).toHaveAttribute("id", "custom-slider-id");
    expect(container.querySelector(".ui-slider__header span")).toBeInTheDocument();
  });
});
