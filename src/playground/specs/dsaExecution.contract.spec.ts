import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { validatePythonExecutionSpec } from "@dsa-visualizer/execution-contracts";
import { ALGORITHMS } from "../../algorithms/registry";
import { TOPIC_CATALOG } from "../../curriculum/topics";
import {
  DSA_EXECUTION_AUDIT,
  DSA_EXECUTION_ENTRIES,
  DSA_EXECUTION_SPECS,
  DSA_STARTER_CODE,
} from "../specs-data/dsa";
import { getPythonExecutionSpec, getPythonStarterCode } from "../executionSpecs";

const topicTracks = new Map(TOPIC_CATALOG.map((topic) => [topic.id, topic.track]));
const dsaAlgorithms = ALGORITHMS.filter((algorithm) =>
  algorithm.topicIds.every((topicId) => topicTracks.get(topicId) === "dsa"),
);
const dsaIds = dsaAlgorithms.map((algorithm) => algorithm.id).sort();
const harnessPath = resolve(process.cwd(), "apps/python-runner/execution_harness.py");

describe("DSA Python execution catalog", () => {
  test("covers exactly the 88 retained DSA algorithms once", () => {
    expect(dsaAlgorithms).toHaveLength(88);
    expect(DSA_EXECUTION_ENTRIES).toHaveLength(88);
    expect(DSA_EXECUTION_SPECS.size).toBe(88);

    const entryIds = DSA_EXECUTION_ENTRIES.map((entry) => entry.id);
    expect(new Set(entryIds).size).toBe(entryIds.length);
    expect([...entryIds].sort()).toEqual(dsaIds);
    expect([...DSA_EXECUTION_SPECS.keys()].sort()).toEqual(dsaIds);
  });

  test("keeps a complete machine-readable audit beside every execution spec", () => {
    expect(DSA_EXECUTION_AUDIT).toHaveLength(88);
    expect(DSA_EXECUTION_AUDIT.map((entry) => entry.id).sort()).toEqual(dsaIds);

    const algorithmsById = new Map(dsaAlgorithms.map((algorithm) => [algorithm.id, algorithm]));
    for (const audit of DSA_EXECUTION_AUDIT) {
      const algorithm = algorithmsById.get(audit.id);
      const spec = DSA_EXECUTION_SPECS.get(audit.id);

      expect(algorithm).toBeDefined();
      expect(spec).toBeDefined();
      expect(audit.symbol).toBe(spec?.entrypoint);
      expect(audit.invocation).toBe(spec?.invocation.kind);
      expect(audit.packages).toEqual(spec?.packages);
      expect(audit.topicIds).toEqual(algorithm?.topicIds);
      expect(audit.defaultInput).toEqual(algorithm?.defaultInput);
      expect(audit.defaultInputShape.trim().length).toBeGreaterThan(0);
      expect(audit.signature.trim().length).toBeGreaterThan(0);
      expect(audit.argumentMapping.length).toBeGreaterThan(0);
      expect(audit.mutation.trim().length).toBeGreaterThan(0);
      expect(audit.returnBehavior.trim().length).toBeGreaterThan(0);
      expect(audit.examples.length).toBe(algorithm?.examples?.length ?? 0);
    }
  });

  test("validates every browser-compatible, package-exact execution contract", () => {
    for (const spec of DSA_EXECUTION_SPECS.values()) {
      expect(spec.runtime).toBe("browser");
      expect(spec.packages).toEqual([]);

      const validation = validatePythonExecutionSpec(spec);
      expect(validation).toEqual({ ok: true, value: spec });
    }
  });

  test("provides genuinely distinct basic, boundary, and complex cases", () => {
    for (const spec of DSA_EXECUTION_SPECS.values()) {
      expect(spec.cases.length).toBeGreaterThanOrEqual(3);

      const caseIds = spec.cases.map((testCase) => testCase.id);
      expect(new Set(caseIds).size).toBe(caseIds.length);
      expect(caseIds).toContain("basic");
      expect(caseIds).toContain("boundary");
      expect(caseIds).toContain("complex");

      const inputs = spec.cases.map((testCase) => JSON.stringify(testCase.input));
      const expected = spec.cases.map((testCase) => JSON.stringify(testCase.expected));
      expect(new Set(inputs).size).toBe(spec.cases.length);
      expect(new Set(expected).size).toBeGreaterThanOrEqual(2);
    }
  });

  test("provides parseable starter code with the declared Python signatures", () => {
    expect(DSA_STARTER_CODE.size).toBe(88);

    const algorithmsById = new Map(dsaAlgorithms.map((algorithm) => [algorithm.id, algorithm]));
    const starters = DSA_EXECUTION_ENTRIES.map((entry) => {
      const algorithm = algorithmsById.get(entry.id);
      const code = DSA_STARTER_CODE.get(entry.id);

      expect(code).toBe(entry.starterCode);
      expect(getPythonStarterCode(entry.id)).toBe(code);
      expect(getPythonExecutionSpec(entry.id)).toBe(entry.spec);
      expect(code?.trim().length).toBeGreaterThan(0);
      expect(Buffer.byteLength(code ?? "", "utf8")).toBeLessThanOrEqual(4_096);
      expect(code).not.toBe(algorithm?.code);

      return {
        id: entry.id,
        code,
        entrypoint: entry.spec.entrypoint,
        invocation: entry.spec.invocation,
      };
    });
    expect(getPythonStarterCode("not-a-real-item")).toBeUndefined();
    expect(getPythonExecutionSpec("not-a-real-item")).toBeUndefined();

    const inspection = spawnSync(
      "python3",
      [
        "-I",
        "-c",
        [
          "import ast, json, sys",
          "items = json.load(sys.stdin)",
          "issues = []",
          "for item in items:",
          "    try:",
          "        tree = ast.parse(item['code'], filename=item['id'])",
          "        invocation = item['invocation']",
          "        symbol = next((node for node in tree.body if getattr(node, 'name', None) == item['entrypoint']), None)",
          "        expected_kind = ast.ClassDef if invocation['kind'] == 'class-method' else ast.FunctionDef",
          "        if not isinstance(symbol, expected_kind):",
          "            issues.append(f\"{item['id']}: missing declared top-level symbol\")",
          "            continue",
          "        if invocation['kind'] == 'function':",
          "            if len(symbol.args.args) != len(invocation['arguments']):",
          "                issues.append(f\"{item['id']}: function arity mismatch\")",
          "        elif invocation['kind'] == 'class-method':",
          "            methods = {node.name: node for node in symbol.body if isinstance(node, ast.FunctionDef)}",
          "            expected = {'__init__': len(invocation['constructor']), invocation['method']: len(invocation['arguments'])}",
          "            for setup in invocation.get('setup', []):",
          "                expected[setup['method']] = len(setup['arguments'])",
          "            for name, arity in expected.items():",
          "                method = methods.get(name)",
          "                if method is None or len(method.args.args) - 1 != arity:",
          "                    issues.append(f\"{item['id']}: {name} arity mismatch\")",
          "    except (SyntaxError, TypeError, ValueError) as error:",
          "        issues.append(f\"{item['id']}: {error}\")",
          "print(json.dumps(issues))",
        ].join("\n"),
      ],
      {
        input: JSON.stringify(starters),
        encoding: "utf8",
        maxBuffer: 2 * 1024 * 1024,
        timeout: 10_000,
      },
    );

    expect(inspection.error).toBeUndefined();
    expect(inspection.status).toBe(0);
    expect(JSON.parse(inspection.stdout)).toEqual([]);
  });
});

describe("DSA immutable references through the production CPython harness", () => {
  test("passes every authored case through the exact isolated JSON protocol", () => {
    const referenceFailures: string[] = [];
    for (const algorithm of dsaAlgorithms) {
      const spec = DSA_EXECUTION_SPECS.get(algorithm.id);
      if (!spec) {
        referenceFailures.push(`${algorithm.id}: missing execution spec`);
        continue;
      }

      const request = {
        runId: `dsa-${algorithm.id}`,
        code: algorithm.code,
        spec,
      };
      const completed = spawnSync("python3", ["-I", harnessPath], {
        input: JSON.stringify(request),
        encoding: "utf8",
        maxBuffer: 2 * 1024 * 1024,
        timeout: 30_000,
      });

      if (completed.error || completed.status !== 0) {
        referenceFailures.push(
          `${algorithm.id}: harness process failed: ${completed.error?.message ?? completed.stderr}`,
        );
        continue;
      }

      const result = JSON.parse(completed.stdout) as {
        readonly status: string;
        readonly stderr: string;
        readonly cases: readonly {
          readonly id: string;
          readonly status: string;
          readonly stderr: string;
          readonly actual?: unknown;
        }[];
      };
      const failures = result.cases.filter((testCase) => testCase.status !== "passed");
      if (
        failures.length > 0 ||
        result.status !== "passed" ||
        result.cases.length !== spec.cases.length
      ) {
        referenceFailures.push(
          `${algorithm.id}: ${result.stderr}\n${JSON.stringify(failures, null, 2)}`,
        );
      }
    }

    expect(referenceFailures).toEqual([]);
  }, 120_000);
});

describe.runIf(process.env.DSA_DOCKER_EXECUTION_GATE === "1")(
  "DSA references through the authoritative Compose runner",
  () => {
    test("passes all cases inside the running python-runner container", () => {
      for (const algorithm of dsaAlgorithms) {
        const spec = DSA_EXECUTION_SPECS.get(algorithm.id);
        expect(spec).toBeDefined();
        if (!spec) continue;

        const completed = spawnSync(
          "docker",
          ["compose", "exec", "-T", "python-runner", "python", "-I", "/app/execution_harness.py"],
          {
            input: JSON.stringify({
              runId: `dsa-docker-${algorithm.id}`,
              code: algorithm.code,
              spec,
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
          readonly stderr: string;
        };
        expect(result.status).toBe("passed");
      }
    }, 180_000);
  },
);
