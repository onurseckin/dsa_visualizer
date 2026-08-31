import type { PythonExecutionSpec } from "@dsa-visualizer/execution-contracts";
import { DSA_EXECUTION_SPECS, DSA_STARTER_CODE } from "./specs-data/dsa";
import { ML_SPECS_MAP, ML_STARTER_CODE } from "./specs-data/ml";

const PYTHON_EXECUTION_SPECS: ReadonlyMap<string, PythonExecutionSpec> = new Map([
  ...DSA_EXECUTION_SPECS.entries(),
  ...ML_SPECS_MAP.entries(),
]);

const PYTHON_STARTER_CODE: ReadonlyMap<string, string> = new Map([
  ...DSA_STARTER_CODE.entries(),
  ...ML_STARTER_CODE.entries(),
]);

export function getPythonExecutionSpec(itemId: string): PythonExecutionSpec | undefined {
  return PYTHON_EXECUTION_SPECS.get(itemId);
}

export function getPythonStarterCode(itemId: string): string | undefined {
  return PYTHON_STARTER_CODE.get(itemId);
}
