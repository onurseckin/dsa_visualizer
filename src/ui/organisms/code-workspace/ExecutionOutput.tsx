import type { PythonExecutionStatus, PythonRunResult } from "@dsa-visualizer/execution-contracts";

import { TestCaseList } from "./TestCaseList";

export interface ExecutionOutputProps {
  readonly caseLabels?: ReadonlyMap<string, string>;
  readonly message?: string;
  readonly result?: PythonRunResult;
}

const MAX_RENDERED_OUTPUT_CHARS = 64 * 1024;

export function ExecutionOutput({
  caseLabels,
  message,
  result,
}: ExecutionOutputProps): React.ReactElement {
  if (!result) {
    return (
      <div className="code-workspace__output-empty">
        {message ?? "Run your code to see output."}
      </div>
    );
  }

  const cases = result.cases.map((caseResult) => ({
    id: caseResult.id,
    label: caseLabels?.get(caseResult.id) ?? caseResult.id,
    input: null,
    expected: null,
    comparison: "deep-equal" as const,
  }));

  return (
    <div className="code-workspace__output">
      <div className="code-workspace__output-summary">
        <strong>{statusLabel(result.status)}</strong>
        <span>{result.durationMs} ms</span>
        <span>{result.runtime === "browser" ? "Browser runtime" : "Docker runtime"}</span>
      </div>
      <section aria-label="Standard output" className="code-workspace__output-well">
        <h4>stdout</h4>
        <pre>{visibleOutput(result.stdout, "No stdout.")}</pre>
      </section>
      <section aria-label="Standard error" className="code-workspace__output-well">
        <h4>stderr</h4>
        <pre>{visibleOutput(result.stderr, "No stderr.")}</pre>
      </section>
      {cases.length > 0 ? <TestCaseList cases={cases} results={result.cases} /> : null}
    </div>
  );
}

function visibleOutput(value: string, fallback: string): string {
  if (value.length === 0) return fallback;
  if (value.length <= MAX_RENDERED_OUTPUT_CHARS) return value;
  return `${value.slice(0, MAX_RENDERED_OUTPUT_CHARS)}\n… output truncated`;
}

function statusLabel(status: PythonExecutionStatus): string {
  switch (status) {
    case "passed":
      return "Passed";
    case "failed":
      return "Failed";
    case "timeout":
      return "Timed out";
    case "error":
      return "Error";
  }
}
