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

function hasUniqueTopologicalOrder(input: unknown): boolean {
  if (
    typeof input !== "object" ||
    input === null ||
    !("nodes" in input) ||
    !Array.isArray(input.nodes) ||
    !("edges" in input) ||
    !Array.isArray(input.edges)
  ) {
    return false;
  }

  const nodes = input.nodes.filter((node): node is string => typeof node === "string");
  const adjacency = new Map(nodes.map((node) => [node, [] as string[]]));
  const inDegree = new Map(nodes.map((node) => [node, 0]));
  for (const edge of input.edges) {
    if (!Array.isArray(edge) || edge.length !== 2) return false;
    const [from, to] = edge;
    if (
      typeof from !== "string" ||
      typeof to !== "string" ||
      !adjacency.has(from) ||
      !inDegree.has(to)
    ) {
      return false;
    }
    adjacency.get(from)?.push(to);
    inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
  }

  const ready = nodes.filter((node) => inDegree.get(node) === 0);
  let visited = 0;
  while (ready.length > 0) {
    if (ready.length !== 1) return false;
    const node = ready.shift();
    if (node === undefined) return false;
    visited += 1;
    for (const neighbor of adjacency.get(node) ?? []) {
      const nextDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, nextDegree);
      if (nextDegree === 0) ready.push(neighbor);
    }
  }
  return visited === nodes.length;
}

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

  test("uses semantic comparison or uniquely determined fixtures for order-ambiguous results", () => {
    const topologicalSort = DSA_EXECUTION_SPECS.get("topological-sort");
    expect(topologicalSort).toBeDefined();
    for (const testCase of topologicalSort?.cases ?? []) {
      expect(testCase.comparison).toBe("deep-equal");
      expect(hasUniqueTopologicalOrder(testCase.input)).toBe(true);
    }

    for (const id of [
      "generating-subsets",
      "kosaraju-scc",
      "kruskal-mst",
      "sweep-line-intersections",
    ]) {
      const spec = DSA_EXECUTION_SPECS.get(id);
      expect(spec, `missing audited execution spec ${id}`).toBeDefined();
      expect(
        spec?.cases.map((testCase) => testCase.comparison),
        `${id} has order-insensitive mathematical output`,
      ).toEqual(["unordered", "unordered", "unordered"]);
    }

    expect(DSA_EXECUTION_SPECS.size).toBe(88);
  });

  test("provides parseable starter code with canonical semantic Python signatures", () => {
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
        referenceCode: algorithm?.code ?? "",
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
          "import ast, json, re, sys",
          "items = json.load(sys.stdin)",
          "issues = []",
          "def parameter_names(node):",
          "    names = [arg.arg for arg in node.args.posonlyargs]",
          "    names.extend(arg.arg for arg in node.args.args)",
          "    if node.args.vararg is not None:",
          "        names.append(node.args.vararg.arg)",
          "    names.extend(arg.arg for arg in node.args.kwonlyargs)",
          "    if node.args.kwarg is not None:",
          "        names.append(node.args.kwarg.arg)",
          "    return names",
          "for item in items:",
          "    try:",
          "        tree = ast.parse(item['code'], filename=item['id'])",
          "        reference_tree = ast.parse(item['referenceCode'], filename=f\"{item['id']}-reference\")",
          "        invocation = item['invocation']",
          "        symbol = next((node for node in tree.body if getattr(node, 'name', None) == item['entrypoint']), None)",
          "        reference_symbol = next((node for node in reference_tree.body if getattr(node, 'name', None) == item['entrypoint']), None)",
          "        expected_kind = ast.ClassDef if invocation['kind'] == 'class-method' else ast.FunctionDef",
          "        if not isinstance(symbol, expected_kind):",
          "            issues.append(f\"{item['id']}: missing declared top-level symbol\")",
          "            continue",
          "        if not isinstance(reference_symbol, expected_kind):",
          "            issues.append(f\"{item['id']}: missing canonical top-level symbol\")",
          "            continue",
          "        if invocation['kind'] == 'function':",
          "            if len(symbol.args.args) != len(invocation['arguments']):",
          "                issues.append(f\"{item['id']}: function arity mismatch\")",
          "            starter_names = parameter_names(symbol)",
          "            reference_names = parameter_names(reference_symbol)",
          "            if starter_names != reference_names:",
          "                issues.append(f\"{item['id']}: starter parameters {starter_names} do not match canonical {reference_names}\")",
          "            if ast.dump(symbol.args, include_attributes=False) != ast.dump(reference_symbol.args, include_attributes=False):",
          "                issues.append(f\"{item['id']}: starter ast.arguments differ from canonical semantics\")",
          "            if any(re.fullmatch(r'arg\\d+', name) for name in starter_names):",
          "                issues.append(f\"{item['id']}: generic argN function parameter\")",
          "        elif invocation['kind'] == 'class-method':",
          "            methods = {node.name: node for node in symbol.body if isinstance(node, ast.FunctionDef)}",
          "            reference_methods = {node.name: node for node in reference_symbol.body if isinstance(node, ast.FunctionDef)}",
          "            expected = {'__init__': len(invocation['constructor']), invocation['method']: len(invocation['arguments'])}",
          "            for setup in invocation.get('setup', []):",
          "                expected[setup['method']] = len(setup['arguments'])",
          "            for name, arity in expected.items():",
          "                method = methods.get(name)",
          "                reference_method = reference_methods.get(name)",
          "                if method is None or len(method.args.args) - 1 != arity:",
          "                    issues.append(f\"{item['id']}: {name} arity mismatch\")",
          "                    continue",
          "                if reference_method is None:",
          "                    issues.append(f\"{item['id']}: missing canonical {name}\")",
          "                    continue",
          "                starter_names = parameter_names(method)",
          "                reference_names = parameter_names(reference_method)",
          "                if starter_names != reference_names:",
          "                    issues.append(f\"{item['id']}: {name} starter parameters {starter_names} do not match canonical {reference_names}\")",
          "                if ast.dump(method.args, include_attributes=False) != ast.dump(reference_method.args, include_attributes=False):",
          "                    issues.append(f\"{item['id']}: {name} starter ast.arguments differ from canonical semantics\")",
          "                if any(re.fullmatch(r'arg\\d+', parameter) for parameter in starter_names):",
          "                    issues.append(f\"{item['id']}: generic argN parameter in {name}\")",
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
