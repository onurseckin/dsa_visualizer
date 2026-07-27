import { describe, expect, it } from "vitest";
import {
  huffmanCoding,
  DEFAULT_HUFFMAN_CODING_INPUT,
  generateHuffmanCodingSteps,
  PYTHON_HUFFMAN_CODE,
} from "../huffmanCoding";

describe("huffmanCoding spec logic", () => {
  it("has category greedy_algorithms and valid metadata", () => {
    expect(huffmanCoding.id).toBe("huffman-coding");
    expect(huffmanCoding.title).toBe("Huffman Coding");
    expect(huffmanCoding.category).toBe("greedy_algorithms");
    expect(huffmanCoding.difficulty).toBe("Medium");
    expect(huffmanCoding.defaultInput).toEqual(DEFAULT_HUFFMAN_CODING_INPUT);
    expect(huffmanCoding.code).toBe(PYTHON_HUFFMAN_CODE);
  });

  it("ships a topic guide teaching prefix codes and the greedy merge", () => {
    const guide = huffmanCoding.topicGuide;
    expect(guide.overview).toContain("prefix-free");
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);
    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.split(". ").length).toBeGreaterThanOrEqual(3);
    });
    expect(guide.keyTerms?.map((t) => t.term)).toContain("Min-heap");
  });

  it("uses Python code representation", () => {
    expect(huffmanCoding.code).toContain("import heapq");
    expect(huffmanCoding.code).toContain("def build_huffman_tree(text):");
    expect(huffmanCoding.code).toContain("class HuffmanNode:");
  });

  it('generates steps for default input "abracadabra"', () => {
    const steps = generateHuffmanCodingSteps(DEFAULT_HUFFMAN_CODING_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    const firstStep = steps[0];
    expect(firstStep.stepIndex).toBe(0);
    expect(firstStep.codeLine).toBe(15);
    expect(firstStep.explanation.what).toContain("abracadabra");

    const secondStep = steps[1];
    expect(secondStep.codeLine).toBe(16);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(27);
    expect(lastStep.explanation.what).toContain("complete");
    expect(lastStep.variables.rootFrequency).toBe(11);

    const snapshot = lastStep.primarySnapshot;
    expect(snapshot.kind).toBe("tree");
    if (snapshot.kind === "tree") {
      expect(snapshot.nodes.length).toBeGreaterThan(0);
    }

    // Verify derived character codes in auxiliary state
    expect(lastStep.auxiliaryState.hashMap).toBeDefined();
    expect(lastStep.auxiliaryState.hashMap?.["code_a"]).toBeDefined();
  });

  it("handles custom text input correctly", () => {
    const customInput = { text: "BCCABBDDAE" };
    const steps = generateHuffmanCodingSteps(customInput);
    expect(steps.length).toBeGreaterThan(0);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.rootFrequency).toBe(10);
  });

  it("handles empty input string gracefully", () => {
    const steps = generateHuffmanCodingSteps({ text: "" });
    expect(steps.length).toBe(1);
    expect(steps[0].codeLine).toBe(27);
    expect(steps[0].variables.textLength).toBe(0);
  });

  it("handles single character input text", () => {
    const steps = generateHuffmanCodingSteps({ text: "a" });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.auxiliaryState.hashMap?.["code_a"]).toBe("0");
  });

  it("handles deep multi-level merges with internal node pops and undefined text fallback", () => {
    const steps = generateHuffmanCodingSteps({ text: undefined as unknown as string });
    expect(steps.length).toBeGreaterThan(0);
    const mergeSteps = steps.filter((s) => s.explanation.what.includes("Pop"));
    expect(mergeSteps.length).toBeGreaterThan(0);
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(huffmanCoding.examples).toHaveLength(3);
    expect(huffmanCoding.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);
    expect(huffmanCoding.examples?.map((ex) => ex.title)).toEqual([
      "Basic Example",
      "Complex Edge Case",
      "Failing / Boundary Case",
    ]);

    for (const example of huffmanCoding.examples!) {
      const steps = huffmanCoding.generateSteps(example.input as { text: string });
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
