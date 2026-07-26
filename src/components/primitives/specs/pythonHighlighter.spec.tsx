import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { highlightPythonLine } from "../code_block/pythonHighlighter";

describe("pythonHighlighter Spec", () => {
  it("highlights comments starting with #", () => {
    const nodes = highlightPythonLine("# this is a comment");
    const { container } = render(<div>{nodes}</div>);
    const commentSpan = container.querySelector(".italic");
    expect(commentSpan).toHaveTextContent("# this is a comment");
  });

  it("highlights double and single quoted strings, including escapes and unclosed strings", () => {
    const nodes1 = highlightPythonLine('"hello \\"world\\""');
    const { container: c1 } = render(<div>{nodes1}</div>);
    expect(c1.querySelector(".text-\\[\\#86efac\\]")?.textContent).toBe('"hello \\"world\\""');

    const nodes2 = highlightPythonLine("'single quote'");
    const { container: c2 } = render(<div>{nodes2}</div>);
    expect(c2.querySelector(".text-\\[\\#86efac\\]")).toHaveTextContent("'single quote'");

    const nodes3 = highlightPythonLine('"unclosed string');
    const { container: c3 } = render(<div>{nodes3}</div>);
    expect(c3.querySelector(".text-\\[\\#86efac\\]")).toHaveTextContent('"unclosed string');
  });

  it("highlights numbers including integers, floats, and hex literals", () => {
    const nodes = highlightPythonLine("x = 42 + 3.14 + 0xFF");
    const { container } = render(<div>{nodes}</div>);
    const numSpans = container.querySelectorAll(".text-\\[\\#fb923c\\]");
    expect(numSpans).toHaveLength(3);
    expect(numSpans[0]).toHaveTextContent("42");
    expect(numSpans[1]).toHaveTextContent("3.14");
    expect(numSpans[2]).toHaveTextContent("0xFF");
  });

  it("highlights keywords, builtins, function names after def, and default identifiers", () => {
    const nodes = highlightPythonLine("def solve(nums: list) -> None: return self.append(nums)");
    const { container } = render(<div>{nodes}</div>);

    // Keywords: def, None, return -> text-[#c084fc]
    const keywords = Array.from(container.querySelectorAll(".text-\\[\\#c084fc\\]")).map(
      (n) => n.textContent,
    );
    expect(keywords).toEqual(["def", "None", "return"]);

    // Function name after def: solve -> text-[#facc15]
    const funcNames = Array.from(container.querySelectorAll(".text-\\[\\#facc15\\]")).map(
      (n) => n.textContent,
    );
    expect(funcNames).toEqual(["solve"]);

    // Builtins: list, self, append -> text-[#38bdf8]
    const builtins = Array.from(container.querySelectorAll(".text-\\[\\#38bdf8\\]")).map(
      (n) => n.textContent,
    );
    expect(builtins).toEqual(["list", "self", "append"]);

    // General identifiers: nums -> text-[#e4e4e7]
    const identifiers = Array.from(container.querySelectorAll(".text-\\[\\#e4e4e7\\]")).map(
      (n) => n.textContent,
    );
    expect(identifiers).toContain("nums");
  });

  it("handles def token boundaries correctly so defdef is not treated as def", () => {
    const nodes = highlightPythonLine("defdef foo()");
    const { container } = render(<div>{nodes}</div>);
    const funcNames = container.querySelectorAll(".text-\\[\\#facc15\\]");
    expect(funcNames).toHaveLength(0); // foo is not preceded by 'def '
  });

  it("highlights operators, punctuation, and pass-through characters", () => {
    const nodes = highlightPythonLine("a += b * (c / d) @ wrapper");
    const { container } = render(<div>{nodes}</div>);
    const ops = Array.from(container.querySelectorAll(".text-\\[\\#94a3b8\\]")).map(
      (n) => n.textContent,
    );
    expect(ops).toContain("+");
    expect(ops).toContain("=");
    expect(ops).toContain("*");
    expect(ops).toContain("/");
    // @ is pass-through character (not in operator regex)
    expect(container.textContent).toContain("@");
  });
});
