import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Search } from "lucide-react";
import { Input } from "../Input";

describe("Input", () => {
  it("renders a text input with md sizing by default", () => {
    const { container } = render(<Input placeholder="Search" onChange={() => undefined} />);
    expect(screen.getByPlaceholderText("Search")).toHaveClass("ui-input__field");
    expect(container.querySelector(".ui-input")).toHaveClass("ui-input--md");
  });

  it("forwards the ref to the native input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} onChange={() => undefined} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("renders a leading icon and marks the wrapper", () => {
    const { container } = render(<Input leadingIcon={<Search />} onChange={() => undefined} />);
    expect(container.querySelector(".ui-input")).toHaveClass("ui-input--with-icon");
    expect(container.querySelector(".ui-input__leading")).toHaveAttribute("aria-hidden", "true");
  });

  it("hides the clear button when the value is empty", () => {
    render(<Input value="" onChange={() => undefined} onClear={() => undefined} />);
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
  });

  it("hides the clear button when onClear is not provided", () => {
    render(<Input value="bfs" onChange={() => undefined} />);
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
  });

  it("shows the clear button for a non-empty value and calls onClear on click", () => {
    const onClear = vi.fn();
    render(<Input value="bfs" onChange={() => undefined} onClear={onClear} />);
    const clear = screen.getByRole("button", { name: "Clear" });
    fireEvent.click(clear);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("applies size modifiers and merges className on the wrapper", () => {
    const { container } = render(<Input size="sm" className="grow" onChange={() => undefined} />);
    expect(container.querySelector(".ui-input")).toHaveClass("ui-input--sm", "grow");
  });
});
