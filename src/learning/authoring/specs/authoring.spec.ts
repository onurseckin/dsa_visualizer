import {
  validatePythonExecutionSpec,
  type PythonTestCase,
} from "@dsa-visualizer/execution-contracts";
import { describe, expect, it } from "vitest";

import {
  arraySteps,
  authoredDifficulty,
  defineCalculatorItem,
  defineCapstoneItem,
  defineDebuggingItem,
  defineScenarioItem,
  defineTraceItem,
  functionExecution,
  graphSteps,
  matrixSteps,
  profile,
  quantizationSteps,
  semanticStarter,
  vectorSteps,
  verifiedSource,
} from "../index";

const executionCases = [
  {
    id: "ordinary",
    label: "Ordinary input",
    input: { values: [3, 1] },
    expected: [1, 3],
    comparison: "deep-equal",
  },
  {
    id: "empty",
    label: "Empty input",
    input: { values: [] },
    expected: [],
    comparison: "deep-equal",
  },
  {
    id: "duplicate",
    label: "Duplicate values",
    input: { values: [2, 2] },
    expected: [2, 2],
    comparison: "deep-equal",
  },
] as const;

const execution = functionExecution({
  entrypoint: "normalize_values",
  outputContract: "Return the values in nondecreasing order.",
  cases: executionCases,
});

const source = verifiedSource({
  label: "Python sorting HOWTO",
  url: "https://docs.python.org/3/howto/sorting.html",
});

describe("learning item authoring kit", () => {
  it("authors frozen P/R/H/T profiles and verified HTTP(S) sources", () => {
    expect(profile(1, 2, 2, 1)).toEqual({
      prerequisite: 1,
      representations: 2,
      horizon: 2,
      tradeoffs: 1,
    });
    expect(Object.isFrozen(profile(1, 2, 2, 1))).toBe(true);
    expect(source).toEqual({
      kind: "ml_infra",
      label: "Python sorting HOWTO",
      provenance: "verified",
      url: "https://docs.python.org/3/howto/sorting.html",
    });
    expect(() => verifiedSource({ label: "Relative", url: "/not-authoritative" })).toThrow(
      /verified HTTP/,
    );
    expect(() =>
      authoredDifficulty({
        prerequisite: 4,
        representations: 0,
        horizon: 0,
        tradeoffs: 0,
      } as never),
    ).toThrow(/valid P\/R\/H\/T/);
  });

  it("builds validated three-case browser function contracts", () => {
    expect(validatePythonExecutionSpec(execution).ok).toBe(true);
    expect(execution).toMatchObject({
      runtime: "browser",
      entrypoint: "normalize_values",
      invocation: {
        kind: "function",
        arguments: [{ from: "input", path: [] }],
      },
      packages: [],
      outputContract: "Return the values in nondecreasing order.",
    });
    expect(execution.cases).toHaveLength(3);
    expect(() =>
      functionExecution({
        entrypoint: "underspecified",
        outputContract: "Return a value.",
        cases: executionCases.slice(0, 2),
      }),
    ).toThrow(/at least three/);
    expect(() =>
      functionExecution({
        entrypoint: "duplicate_cases",
        outputContract: "Return a value.",
        cases: [executionCases[0], executionCases[0], executionCases[2]],
      }),
    ).toThrow(/distinct/);
    expect(() =>
      functionExecution({
        entrypoint: "missing_contract",
        outputContract: " ",
        cases: executionCases,
      }),
    ).toThrow(/output contract/);
  });

  it("supports validated bindings, result selection, runtimes, and allowlisted packages", () => {
    const configured = functionExecution({
      entrypoint: "select_result",
      outputContract: "Return the normalized values field.",
      runtime: "server",
      packages: ["numpy", "torch"],
      arguments: [
        { from: "input", path: ["record"], convert: "namespace" },
        { from: "input", path: ["scale"] },
      ],
      result: { from: "return", path: ["values"], project: "json" },
      cases: [
        {
          id: "one",
          label: "One",
          input: { record: { values: [1] }, scale: 1 },
          expected: [1],
          comparison: "deep-equal",
        },
        {
          id: "two",
          label: "Two",
          input: { record: { values: [2] }, scale: 2 },
          expected: [4],
          comparison: "deep-equal",
        },
        {
          id: "three",
          label: "Three",
          input: { record: { values: [3] }, scale: 3 },
          expected: [9],
          comparison: "deep-equal",
        },
      ],
    });

    expect(configured).toMatchObject({
      runtime: "server",
      packages: ["numpy", "torch"],
      invocation: {
        arguments: [
          { from: "input", path: ["record"], convert: "namespace" },
          { from: "input", path: ["scale"] },
        ],
        result: { from: "return", path: ["values"], project: "json" },
      },
    });
    expect(validatePythonExecutionSpec(configured).ok).toBe(true);
  });

  it("generates semantic Python starters instead of solved or pass-only bodies", () => {
    const starter = semanticStarter({
      entrypoint: "normalize_values",
      parameters: ["record"],
      contract: "Return a new sorted values list from record.",
    });

    expect(starter).toContain("def normalize_values(record):");
    expect(starter).toContain("# Return a new sorted values list from record.");
    expect(starter).toContain('raise NotImplementedError("Implement normalize_values")');
    expect(starter).not.toMatch(/\bpass\b/);
    expect(() =>
      semanticStarter({
        entrypoint: "not-valid()",
        parameters: ["record"],
        contract: "Return a result.",
      }),
    ).toThrow(/Python identifier/);
  });

  it("creates indexed, explanatory array, matrix, graph, vector, and quantization snapshots", () => {
    const array = arraySteps([
      {
        codeLine: 2,
        what: "Read the unsorted values.",
        why: "The original order is the comparison baseline.",
        values: [3, 1],
        activeIndices: [0, 1],
        variables: { phase: "read" },
      },
      {
        codeLine: 3,
        what: "Emit the normalized order.",
        why: "The contract requires nondecreasing values.",
        values: [1, 3],
        activeIndices: [0, 1],
        variables: { phase: "return" },
      },
    ]);
    const matrix = matrixSteps([
      {
        codeLine: 2,
        what: "Inspect the source matrix.",
        why: "Shape and layout constrain legal indexing.",
        values: [
          [1, 2],
          [3, 4],
        ],
      },
      {
        codeLine: 3,
        what: "Select a matrix cell.",
        why: "The active cell exposes the governing stride.",
        values: [
          [1, 2],
          [3, 4],
        ],
        activeCells: [[1, 0]],
      },
    ]);
    const graph = graphSteps([
      {
        codeLine: 2,
        what: "Load artifact lineage.",
        why: "Every output must name its upstream artifacts.",
        nodes: [
          { id: "dataset", label: "Dataset" },
          { id: "model", label: "Model" },
        ],
        edges: [{ from: "dataset", to: "model" }],
        activeNodeIds: ["dataset"],
      },
      {
        codeLine: 3,
        what: "Traverse the producing edge.",
        why: "The edge establishes model provenance.",
        nodes: [
          { id: "dataset", label: "Dataset" },
          { id: "model", label: "Model" },
        ],
        edges: [{ from: "dataset", to: "model" }],
        activeNodeIds: ["model"],
        traversedEdgeIndexes: [0],
      },
    ]);
    const vector = vectorSteps([
      {
        codeLine: 2,
        what: "Read the source vector.",
        why: "Its direction is the transformation baseline.",
        vectors: [{ id: "source", label: "Source", x: 1, y: 2 }],
        activeVectorIds: ["source"],
      },
      {
        codeLine: 3,
        what: "Add the transformed vector.",
        why: "The result exposes the changed representation.",
        vectors: [
          { id: "source", label: "Source", x: 1, y: 2 },
          { id: "result", label: "Result", x: 2, y: 4 },
        ],
        activeVectorIds: ["result"],
      },
    ]);
    const quantization = quantizationSteps([
      {
        codeLine: 2,
        what: "Inspect the source bits.",
        why: "The original representation sets the precision baseline.",
        originalValue: 3.25,
        bits: [
          { index: 0, value: 0, bitGroup: "sign" },
          { index: 1, value: 1, bitGroup: "magnitude" },
        ],
        activeBitIndices: [1],
      },
      {
        codeLine: 3,
        what: "Emit the quantized bits.",
        why: "Fewer representable values introduce quantization error.",
        originalValue: 3.25,
        quantizedValue: 3,
        scale: 1,
        zeroPoint: 0,
        bits: [
          { index: 0, value: 0, bitGroup: "sign" },
          { index: 1, value: 1, bitGroup: "magnitude" },
        ],
        quantizedBitIndices: [0, 1],
      },
    ]);

    for (const steps of [array, matrix, graph, vector, quantization]) {
      expect(steps.map((step) => step.stepIndex)).toEqual([0, 1]);
      expect(steps.every((step) => step.explanation.what.length > 0)).toBe(true);
      expect(steps.every((step) => step.explanation.why.length > 0)).toBe(true);
    }
    expect(array[0].primarySnapshot.kind).toBe("array");
    expect(matrix[0].primarySnapshot.kind).toBe("matrix");
    expect(graph[1].primarySnapshot).toMatchObject({
      kind: "graph",
      edges: [{ from: "dataset", to: "model", isTraversed: true }],
    });
    expect(vector[1].primarySnapshot.kind).toBe("vector");
    expect(quantization[1].primarySnapshot).toMatchObject({
      kind: "quantization",
      quantizedValue: 3,
    });
  });

  it("derives all five nonalgorithm item variants without coupling rubric grading to execution", () => {
    const shared = {
      id: "neutral-authoring-fixture",
      title: "Neutral authoring fixture",
      topicIds: ["ml_experiment_lineage"] as const,
      difficultyProfile: profile(1, 2, 2, 1),
      description: "A topic-neutral authoring fixture.",
      objective: "Apply an invariant to a changed input.",
      completionEvidence: "A passing executable artifact with written evidence.",
      sources: [source] as const,
    };
    const code = "def normalize_values(record):\n    return sorted(record['values'])";
    const starterCode = semanticStarter({
      entrypoint: "normalize_values",
      parameters: ["record"],
      contract: "Return the values in nondecreasing order.",
    });
    const steps = () =>
      arraySteps([
        {
          codeLine: 1,
          what: "Read values.",
          why: "Inputs determine the normalized result.",
          values: [3, 1],
        },
        {
          codeLine: 2,
          what: "Sort values.",
          why: "The output contract requires ordering.",
          values: [1, 3],
        },
      ]);
    const trace = defineTraceItem({
      ...shared,
      code,
      starterCode,
      execution,
      generateSteps: steps,
      assessmentPayload: {
        variant: "changed-order",
        changedContext: true,
        isomorphicRetest: true,
        prompt: "Predict the normalized values.",
        currentState: "values=[3, 1]",
        referenceNextState: "values=[1, 3]",
      },
    });
    const calculator = defineCalculatorItem({
      ...shared,
      id: "neutral-calculator-fixture",
      code,
      starterCode,
      execution,
      generateSteps: steps,
      assessmentPayload: {
        variant: "changed-scale",
        changedContext: true,
        isomorphicRetest: true,
        prompt: "Calculate the normalized count.",
        inputs: [{ id: "count", label: "Count", defaultValue: "2" }],
        result: { value: 2, unit: "items", tolerance: 0 },
      },
    });
    const debugging = defineDebuggingItem({
      ...shared,
      id: "neutral-debugging-fixture",
      code,
      starterCode,
      execution,
      generateSteps: steps,
      assessmentPayload: {
        variant: "changed-failure",
        changedContext: true,
        isomorphicRetest: true,
        faultyStarter: "def normalize_values(record):\n    return record['values']",
        evidence: [{ label: "Failure", content: "Output is not sorted." }],
        failingTests: ["Unsorted input must be normalized."],
        hints: ["Compare the output contract with the returned order."],
      },
    });
    const scenario = defineScenarioItem({
      ...shared,
      id: "neutral-scenario-fixture",
      prompt: {
        context: "A data contract changed.",
        question: "Which evidence is required before promotion?",
      },
      rubric: {
        criteria: [
          {
            id: "evidence",
            label: "Evidence",
            description: "Names executable validation evidence.",
            points: 1,
            critical: true,
          },
        ],
      },
      playground: { code, starterCode, execution, generateSteps: steps },
      assessmentPayload: {
        variant: "changed-contract",
        changedContext: true,
        isomorphicRetest: true,
      },
    });
    const capstone = defineCapstoneItem({
      ...shared,
      id: "neutral-capstone-fixture",
      prompt: {
        context: "Several contract failures reached production.",
        question: "How will you restore and verify the pipeline?",
      },
      rubric: {
        criteria: [
          {
            id: "restore",
            label: "Restore",
            description: "Restores the invariant and verifies it.",
            points: 1,
            critical: true,
          },
        ],
      },
      playground: { code, starterCode, execution, generateSteps: steps },
      assessmentPayload: {
        variant: "changed-incident",
        changedContext: true,
        isomorphicRetest: true,
        checklist: [{ id: "verify", label: "Verify the repaired contract" }],
        incidentTimeline: [{ id: "detect", label: "Detect the first invalid artifact" }],
      },
    });

    expect(trace).toMatchObject({
      kind: "trace",
      difficultyLabel: "Proficient",
      difficulty: "Medium",
      assessment: { kind: "trace", renderer: "trace-assessment" },
    });
    expect(calculator.assessment).toMatchObject({
      kind: "calculator",
      renderer: "calculator-assessment",
    });
    expect(debugging.assessment).toMatchObject({
      kind: "debugging",
      renderer: "debugging-assessment",
    });
    expect(scenario).toMatchObject({
      kind: "scenario",
      difficultyLabel: "Proficient",
      difficulty: "Medium",
      assessment: { kind: "scenario", renderer: "scenario-assessment" },
    });
    expect(scenario).not.toHaveProperty("code");
    expect(scenario.playground).toMatchObject({ code, starterCode, execution });
    expect(Object.isFrozen(scenario)).toBe(true);
    expect(Object.isFrozen(scenario.rubric.criteria)).toBe(true);
    expect(capstone).not.toHaveProperty("code");
    expect(capstone.assessment).toMatchObject({
      kind: "capstone",
      renderer: "capstone-assessment",
    });
  });

  it("deep-freezes authored contracts without aliasing mutable author input", () => {
    const mutableCases: PythonTestCase[] = executionCases.map(
      (testCase) =>
        ({
          ...testCase,
          input: structuredClone(testCase.input),
          expected: structuredClone(testCase.expected),
        }) as PythonTestCase,
    );
    const authored = functionExecution({
      entrypoint: "normalize_values",
      outputContract: "Return values in nondecreasing order.",
      cases: mutableCases,
    });

    const firstMutable = mutableCases[0] as unknown as {
      label: string;
      input: { values: number[] };
    };
    firstMutable.label = "Mutated after authorship";
    firstMutable.input.values.push(99);

    expect(authored.cases[0]).toMatchObject({
      label: "Ordinary input",
      input: { values: [3, 1] },
    });
    expect(Object.isFrozen(authored)).toBe(true);
    expect(Object.isFrozen(authored.cases)).toBe(true);
    expect(Object.isFrozen(authored.cases[0])).toBe(true);
    expect(Object.isFrozen(authored.cases[0].input)).toBe(true);
  });
});
