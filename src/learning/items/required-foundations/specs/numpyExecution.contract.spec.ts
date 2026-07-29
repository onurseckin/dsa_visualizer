import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { deepStrictEqual } from "node:assert";
import { describe, expect, test } from "vitest";
import { validatePythonExecutionSpec } from "@dsa-visualizer/execution-contracts";

import { getLearningItemPlayground } from "../../../types";
import { tensorDtypeDeviceBoundary } from "../tensor-dtype-device-boundary";
import { tensorLayoutExplorer } from "../tensor-layout-explorer";

const numpyItems = [tensorDtypeDeviceBoundary, tensorLayoutExplorer] as const;

describe("NumPy required-foundation execution boundary", () => {
  test("binds both exact specs to the pinned container NumPy runtime", () => {
    const dockerfile = readFileSync(resolve(process.cwd(), "Dockerfile.runner"), "utf8");
    const compose = readFileSync(resolve(process.cwd(), "compose.yaml"), "utf8");
    const amd64Requirements = readFileSync(
      resolve(process.cwd(), "docker/python-runner/requirements-linux-amd64.txt"),
      "utf8",
    );
    const arm64Requirements = readFileSync(
      resolve(process.cwd(), "docker/python-runner/requirements-linux-arm64.txt"),
      "utf8",
    );

    expect(dockerfile).toContain("apps/python-runner");
    expect(compose).toContain("Dockerfile.runner");
    expect(compose).toContain("python-runner");
    expect(amd64Requirements).toMatch(/^numpy==2\.2\.5 /m);
    expect(arm64Requirements).toMatch(/^numpy==2\.2\.5 /m);

    for (const item of numpyItems) {
      const playground = getLearningItemPlayground(item);
      expect(playground).toBeDefined();
      if (!playground) continue;
      expect(playground.execution.packages).toEqual(["numpy"]);
      expect(validatePythonExecutionSpec({ ...playground.execution, runtime: "server" }).ok).toBe(
        true,
      );
    }
  });
});

describe.runIf(process.env.REQUIRED_FOUNDATIONS_DOCKER_EXECUTION_GATE === "1")(
  "NumPy references through the authoritative Compose runner",
  () => {
    test("passes every exact case inside the running python-runner container", () => {
      for (const item of numpyItems) {
        const playground = getLearningItemPlayground(item);
        expect(playground).toBeDefined();
        if (!playground) continue;

        const completed = spawnSync(
          "docker",
          ["compose", "exec", "-T", "python-runner", "python", "-I", "/app/execution_harness.py"],
          {
            input: JSON.stringify({
              runId: `required-docker-${item.id}`,
              code: playground.code,
              spec: { ...playground.execution, runtime: "server" },
            }),
            encoding: "utf8",
            maxBuffer: 2 * 1024 * 1024,
            timeout: 30_000,
          },
        );

        expect(completed.error).toBeUndefined();
        expect(completed.status).toBe(0);
        const result = JSON.parse(completed.stdout) as {
          readonly status: string;
          readonly cases: readonly { readonly status: string }[];
        };
        expect(result.status).toBe("passed");
        expect(result.cases).toHaveLength(playground.execution.cases.length);
        expect(result.cases.every((testCase) => testCase.status === "passed")).toBe(true);
      }
    }, 120_000);
  },
);

describe("NumPy references through pinned Pyodide", () => {
  test("passes the same exact specs in Pyodide 314.0.3", async () => {
    const { loadPyodide } = await import("pyodide");
    const pyodideDirectory = dirname(
      createRequire(import.meta.url).resolve("pyodide/package.json"),
    );
    const runtime = await loadPyodide({
      indexURL: pyodideDirectory,
      stdout: () => undefined,
      stderr: () => undefined,
    });
    expect(runtime.version).toBe("314.0.3");
    await runtime.loadPackage("numpy");

    for (const item of numpyItems) {
      const playground = getLearningItemPlayground(item);
      expect(playground).toBeDefined();
      if (!playground) continue;
      for (const testCase of playground.execution.cases) {
        const invocation = `${playground.code}
import json
_record = json.loads(${JSON.stringify(JSON.stringify(testCase.input))})
json.dumps(${playground.execution.entrypoint}(_record), sort_keys=True)`;
        const actual = JSON.parse(await runtime.runPythonAsync(invocation)) as unknown;
        deepStrictEqual(actual, testCase.expected);
      }
    }
  }, 120_000);
});
