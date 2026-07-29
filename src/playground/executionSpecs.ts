import type { PythonExecutionSpec } from "@dsa-visualizer/execution-contracts";
import { DSA_EXECUTION_SPECS, DSA_STARTER_CODE } from "./specs-data/dsa";

const PYTHON_EXECUTION_SPECS: ReadonlyMap<string, PythonExecutionSpec> = DSA_EXECUTION_SPECS;
const PYTHON_STARTER_CODE: ReadonlyMap<string, string> = DSA_STARTER_CODE;

export function getPythonExecutionSpec(itemId: string): PythonExecutionSpec | undefined {
  return PYTHON_EXECUTION_SPECS.get(itemId);
}

export function getPythonStarterCode(itemId: string): string | undefined {
  return PYTHON_STARTER_CODE.get(itemId);
}
