import type { PythonCaseResult, PythonTestCase } from "@dsa-visualizer/execution-contracts";

import { cx } from "../../cx";

export interface TestCaseListProps {
  readonly cases?: readonly PythonTestCase[];
  readonly selectedIds?: readonly string[];
  readonly onSelectionChange?: (ids: readonly string[]) => void;
  readonly results?: readonly PythonCaseResult[];
}

export function TestCaseList({
  cases,
  onSelectionChange,
  results,
  selectedIds = [],
}: TestCaseListProps): React.ReactElement {
  if (!cases || cases.length === 0) {
    return (
      <p className="code-workspace__empty">
        Tests are not available yet. This item currently provides a saved scratchpad only.
      </p>
    );
  }

  const resultById = new Map(results?.map((result) => [result.id, result]));

  return (
    <fieldset className="code-workspace__cases">
      <legend>{onSelectionChange ? "Test cases" : "Case results"}</legend>
      {cases.map((testCase) => {
        const result = resultById.get(testCase.id);
        return (
          <label key={testCase.id} className="code-workspace__case">
            {onSelectionChange ? (
              <input
                type="checkbox"
                checked={selectedIds.includes(testCase.id)}
                onChange={() => {
                  const next = selectedIds.includes(testCase.id)
                    ? selectedIds.filter((id) => id !== testCase.id)
                    : [...selectedIds, testCase.id];
                  onSelectionChange(next);
                }}
              />
            ) : null}
            <span className="code-workspace__case-label">{testCase.label}</span>
            {result ? (
              <span
                className={cx(
                  "code-workspace__case-status",
                  `code-workspace__case-status--${result.status}`,
                )}
              >
                {statusLabel(result.status)}
              </span>
            ) : null}
          </label>
        );
      })}
    </fieldset>
  );
}

function statusLabel(status: PythonCaseResult["status"]): string {
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
