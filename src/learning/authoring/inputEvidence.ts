import type { AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import type { PythonTestCase } from "@dsa-visualizer/execution-contracts";
import { deepFreezeCopy } from "./freeze";

function selectedInputValue(input: unknown, field: string): unknown {
  if (typeof input !== "object" || input === null || !(field in input)) return undefined;
  return input[field as keyof typeof input];
}

function displayValue(value: unknown): string {
  return JSON.stringify(value) ?? "missing";
}

function inputEntries(input: unknown, fields: readonly string[]) {
  return fields.map((field) => [field, displayValue(selectedInputValue(input, field))] as const);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

function expectedEntries(testCase: PythonTestCase | undefined) {
  if (!testCase) {
    return [
      ["case", "custom input"],
      ["status", "No authored expected output; run the code to observe this custom case."],
    ] as const;
  }
  const expected = testCase.expected;
  const values =
    typeof expected === "object" && expected !== null && !Array.isArray(expected)
      ? Object.entries(expected).map(([field, value]) => [field, displayValue(value)] as const)
      : ([["result", displayValue(expected)]] as const);
  return [["case", `${testCase.id} · ${testCase.label}`] as const, ...values];
}

function inputStateSnapshot(
  template: PrimaryVisualSnapshot,
  entries: readonly (readonly [string, string])[],
  role: "input" | "expected",
): PrimaryVisualSnapshot {
  const idPrefix = role === "input" ? "input" : "expected";
  const valueHeading = role === "input" ? "submitted value" : "authored expected value";
  const title = role === "input" ? "Submitted decision state" : "Authored expected output";
  switch (template.kind) {
    case "array":
      return {
        kind: "array",
        elements: entries.map(([field, value], index) => ({
          id: `${idPrefix}-${field}`,
          label: field,
          value,
          state: index === 0 ? "active" : "default",
        })),
      };
    case "matrix":
      return {
        kind: "matrix",
        rows: entries.length,
        cols: 2,
        rowHeaders: entries.map(([field]) => field),
        colHeaders: ["field", valueHeading],
        cells: entries.flatMap(([field, value], row) => [
          { row, col: 0, value: field, state: row === 0 ? "active" : "default" },
          { row, col: 1, value, state: row === 0 ? "active" : "default" },
        ]),
        title,
      };
    case "graph":
      return {
        kind: "graph",
        nodes: entries.map(([field, value], index) => ({
          id: `${idPrefix}-${field}`,
          label: `${field}=${value}`,
          state: index === 0 ? "active" : "default",
        })),
        edges: entries.slice(1).map((_, index) => ({
          from: `${idPrefix}-${entries[index]?.[0]}`,
          to: `${idPrefix}-${entries[index + 1]?.[0]}`,
        })),
      };
    case "vector":
      return {
        kind: "vector",
        vectors: entries.map(([field, value], index) => ({
          id: `${idPrefix}-${field}`,
          label: `${field}=${value}`,
          x: index + 1,
          y: 0,
          state: index === 0 ? "active" : "default",
        })),
        planeTitle: title,
      };
    case "quantization":
      return {
        kind: "quantization",
        title,
        originalValue: entries.map(([field, value]) => `${field}=${value}`).join(", "),
        bits: entries.map(([field], index) => ({
          index,
          label: field,
          value: index === 0 ? 1 : 0,
          state: index === 0 ? "active" : "default",
        })),
      };
    default:
      return {
        kind: "array",
        elements: entries.map(([field, value], index) => ({
          id: `${idPrefix}-${field}`,
          label: field,
          value,
          state: index === 0 ? "active" : "default",
        })),
      };
  }
}

function conceptualSnapshot(snapshot: PrimaryVisualSnapshot): PrimaryVisualSnapshot {
  switch (snapshot.kind) {
    case "array":
      return {
        ...snapshot,
        elements: snapshot.elements.map((element, index) =>
          index === 0 ? { ...element, value: `Conceptual trace · ${element.value}` } : element,
        ),
      };
    case "matrix":
      return {
        ...snapshot,
        title: `Conceptual trace · ${snapshot.title ?? "selected input shown above"}`,
      };
    case "graph":
      return {
        ...snapshot,
        nodes: snapshot.nodes.map((node, index) =>
          index === 0 ? { ...node, label: `Conceptual trace · ${node.label ?? node.id}` } : node,
        ),
      };
    case "vector":
      return {
        ...snapshot,
        vectors: snapshot.vectors.map((vector, index) =>
          index === 0 ? { ...vector, label: `Conceptual trace · ${vector.label}` } : vector,
        ),
      };
    case "quantization":
      return {
        ...snapshot,
        title: `Conceptual policy trace · ${snapshot.title ?? "selected input shown above"}`,
      };
    default:
      return snapshot;
  }
}

/**
 * Surrounds explicitly conceptual teaching frames with the selected case's
 * submitted values and executable expected output. Custom inputs never borrow
 * an authored case oracle.
 */
export function inputEvidenceSteps(
  steps: readonly AlgorithmStep[],
  input: unknown,
  fields: readonly string[],
  cases: readonly PythonTestCase[],
  labelConceptualFrames = true,
): AlgorithmStep[] {
  const firstStep = steps[0];
  if (!firstStep) return [];
  const finalStep = steps.at(-1) ?? firstStep;
  const entries = inputEntries(input, fields);
  const selectedCase = cases.find(
    (testCase) => canonicalJson(testCase.input) === canonicalJson(input),
  );
  const outputEntries = expectedEntries(selectedCase);
  return deepFreezeCopy([
    {
      ...firstStep,
      stepIndex: 0,
      explanation: {
        what: "Inspect the submitted values that determine this execution path.",
        why: "The visual trace must begin from the actual case rather than a fixed example.",
      },
      primarySnapshot: inputStateSnapshot(firstStep.primarySnapshot, entries, "input"),
      variables: { ...firstStep.variables, submittedInput: Object.fromEntries(entries) },
    },
    ...steps.map((step, index) => ({
      ...step,
      stepIndex: index + 1,
      explanation: labelConceptualFrames
        ? {
            what: `Conceptual trace — ${step.explanation.what}`,
            why: `${step.explanation.why} Compare this teaching frame with the submitted state above.`,
          }
        : step.explanation,
      primarySnapshot: labelConceptualFrames
        ? conceptualSnapshot(step.primarySnapshot)
        : step.primarySnapshot,
    })),
    {
      ...finalStep,
      stepIndex: steps.length + 1,
      explanation: selectedCase
        ? {
            what: `Inspect the authored expected output for case “${selectedCase.label}”.`,
            why: "This state is the executable case oracle, separate from the conceptual teaching frames.",
          }
        : {
            what: "No authored expected output exists for this custom input.",
            why: "Run the editable Python code to compute a result instead of treating conceptual constants as output.",
          },
      primarySnapshot: inputStateSnapshot(finalStep.primarySnapshot, outputEntries, "expected"),
      variables: {
        ...finalStep.variables,
        selectedCaseId: selectedCase?.id ?? null,
        expectedOutput: selectedCase?.expected ?? null,
      },
    },
  ]);
}
