import type { PythonExecutionSpec } from "@dsa-visualizer/execution-contracts";

/**
 * The canonical execution-spec seam. Task 9 enrolls the 88 retained DSA specs
 * here; until then a missing entry deliberately means "scratchpad only".
 */
const PYTHON_EXECUTION_SPECS: ReadonlyMap<string, PythonExecutionSpec> = new Map();

export function getPythonExecutionSpec(itemId: string): PythonExecutionSpec | undefined {
  return PYTHON_EXECUTION_SPECS.get(itemId);
}
