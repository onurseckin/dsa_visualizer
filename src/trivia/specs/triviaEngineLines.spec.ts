import { describe, expect, it } from "vitest";
import { blankableLines, parsePuzzleLines } from "../triviaEngine";

const SIMPLE_CODE = [
  "def f(n):",
  "    total = 0",
  "",
  "    for i in range(n):",
  "        total += i",
  "    return total",
].join("\n");

const THREE_LINE = "x = 1\ny = 2\nz = 3";

describe("parsePuzzleLines", () => {
  it("numbers lines from 1 and splits indentation from content", () => {
    const lines = parsePuzzleLines(SIMPLE_CODE);

    expect(lines).toHaveLength(6);
    expect(lines[0]).toEqual({
      number: 1,
      text: "def f(n):",
      indent: "",
      content: "def f(n):",
      blankable: true,
    });
    expect(lines[4]).toEqual({
      number: 5,
      text: "        total += i",
      indent: "        ",
      content: "total += i",
      blankable: true,
    });
  });

  it("never marks a blank line blankable", () => {
    const lines = parsePuzzleLines(SIMPLE_CODE);

    expect(lines[2]).toEqual({
      number: 3,
      text: "",
      indent: "",
      content: "",
      blankable: false,
    });
  });

  it("never marks a whitespace-only line blankable and keeps its spaces as indent", () => {
    const lines = parsePuzzleLines("a = 1\n   \nb = 2");

    expect(lines).toHaveLength(3);
    expect(lines[1]).toEqual({
      number: 2,
      text: "   ",
      indent: "   ",
      content: "",
      blankable: false,
    });
    expect(blankableLines(lines)).toEqual([1, 3]);
  });

  it("excludes meta.skipLines from blankable while keeping the line present", () => {
    const lines = parsePuzzleLines(SIMPLE_CODE, { skipLines: [1, 6] });

    expect(lines).toHaveLength(6);
    expect(lines[0].content).toBe("def f(n):");
    expect(lines[0].blankable).toBe(false);
    expect(lines[5].blankable).toBe(false);
    expect(blankableLines(lines)).toEqual([2, 4, 5]);
  });

  it("ignores skipLines that point past the end of the solution", () => {
    const lines = parsePuzzleLines(THREE_LINE, { skipLines: [99] });

    expect(blankableLines(lines)).toEqual([1, 2, 3]);
  });

  it("drops a trailing newline instead of emitting a phantom final line", () => {
    expect(parsePuzzleLines("a = 1\nb = 2\n")).toEqual(parsePuzzleLines("a = 1\nb = 2"));
  });

  it("keeps the last line drillable when the code has no trailing newline", () => {
    const lines = parsePuzzleLines("a = 1\n    return a");

    expect(lines).toHaveLength(2);
    expect(lines[1]).toEqual({
      number: 2,
      text: "    return a",
      indent: "    ",
      content: "return a",
      blankable: true,
    });
  });

  it("strips trailing blank and whitespace-only lines at the end of the file", () => {
    const lines = parsePuzzleLines("a = 1\nb = 2\n   \n\n");

    expect(lines).toHaveLength(2);
    expect(blankableLines(lines)).toEqual([1, 2]);
  });

  it("collapses whitespace-only input to a single non-blankable line", () => {
    const lines = parsePuzzleLines("   \n\t\n  ");

    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual({
      number: 1,
      text: "",
      indent: "",
      content: "",
      blankable: false,
    });
    expect(blankableLines(lines)).toEqual([]);
  });

  it("yields no blankable lines for an empty string", () => {
    expect(blankableLines(parsePuzzleLines(""))).toEqual([]);
  });

  it("keeps trailing spaces inside a mid-file line as content, not as a stripped edge", () => {
    const lines = parsePuzzleLines("a = 1  \nb = 2");

    expect(lines[0].content).toBe("a = 1  ");
  });
});
