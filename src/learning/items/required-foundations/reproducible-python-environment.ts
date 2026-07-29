import {
  arraySteps,
  defineDebuggingItem,
  functionExecution,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "normalize_environment";

const code = `def normalize_environment(record):
    packages = record.get("packages", {})
    pins = []
    for raw_name, raw_version in packages.items():
        name = str(raw_name).strip().lower().replace("_", "-")
        version = str(raw_version).strip()
        if name and version:
            pins.append(f"{name}=={version}")
    return {
        "python": str(record["python"]).strip(),
        "packages": sorted(pins),
        "seed": int(record["seed"]),
    }`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Return a canonical environment record with an exact Python version, sorted normalized package pins, and integer seed.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return {python, packages, seed}; packages must be normalized name==version pins in lexicographic order.",
  cases: [
    {
      id: "unordered-pins",
      label: "Unordered package pins",
      input: {
        python: "3.12.4",
        packages: { scipy: "1.13.1", numpy: "2.0.0" },
        seed: 17,
      },
      expected: {
        python: "3.12.4",
        packages: ["numpy==2.0.0", "scipy==1.13.1"],
        seed: 17,
      },
      comparison: "deep-equal",
    },
    {
      id: "standard-library",
      label: "Standard-library-only environment",
      input: { python: "3.11.9", packages: {}, seed: 0 },
      expected: { python: "3.11.9", packages: [], seed: 0 },
      comparison: "deep-equal",
    },
    {
      id: "normalized-name",
      label: "Normalized distribution name",
      input: {
        python: " 3.10.14 ",
        packages: { SCIKIT_LEARN: " 1.5.0 ", pandas: "2.2.2" },
        seed: "42",
      },
      expected: {
        python: "3.10.14",
        packages: ["pandas==2.2.2", "scikit-learn==1.5.0"],
        seed: 42,
      },
      comparison: "deep-equal",
    },
  ],
});

function packagePins(input: unknown): string[] {
  if (typeof input !== "object" || input === null || !("packages" in input)) return [];
  const packages = input.packages;
  if (typeof packages !== "object" || packages === null || Array.isArray(packages)) return [];
  return Object.entries(packages).map(([name, version]) => `${name}=${String(version)}`);
}

export const reproduciblePythonEnvironment = defineDebuggingItem({
  id: "reproducible-python-environment",
  title: "Reproducible Python Environment",
  topicIds: ["ml_python_scientific_computing"],
  difficultyProfile: profile(1, 2, 2, 2),
  description:
    "Repair an environment normalizer so reruns carry explicit interpreter, dependency, and random-seed evidence.",
  objective:
    "Distinguish a reproducibility record from an unversioned package list and normalize it deterministically.",
  completionEvidence:
    "A passing normalizer for three changed environments plus an explanation of the interpreter, dependency, and seed boundaries.",
  sources: [
    verifiedSource({
      label: "Python virtual environments",
      url: "https://docs.python.org/3/library/venv.html",
    }),
    verifiedSource({
      label: "PyTorch reproducibility",
      url: "https://docs.pytorch.org/docs/stable/notes/randomness.html",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: (input) => {
    const pins = packagePins(input);
    const normalized = pins.map((pin) => pin.toLowerCase().replace("_", "-")).sort();
    return arraySteps([
      {
        codeLine: 2,
        what: "Read every declared package and version.",
        why: "A missing version leaves the dependency boundary ambiguous.",
        values: pins.length > 0 ? pins : ["standard-library"],
        activeIndices: pins.map((_, index) => index),
        variables: { packageCount: pins.length },
      },
      {
        codeLine: 5,
        what: "Normalize package distribution names.",
        why: "Canonical names prevent spelling variants from producing different lock evidence.",
        values: normalized.length > 0 ? normalized : ["standard-library"],
        activeIndices: normalized.map((_, index) => index),
      },
      {
        codeLine: 11,
        what: "Sort pins and attach interpreter and seed metadata.",
        why: "Stable ordering and explicit boundaries make the record comparable across reruns.",
        values: normalized.length > 0 ? normalized : ["standard-library"],
        completedIndices: normalized.map((_, index) => index),
        variables: { invariant: "interpreter + pins + seed" },
      },
    ]);
  },
  assessmentPayload: {
    variant: "missing-reproducibility-boundaries",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def normalize_environment(record):
    return {"python": record["python"], "packages": list(record["packages"])}`,
    evidence: [
      {
        label: "Unstable package order",
        content:
          "The same dependency mapping produces different evidence when insertion order changes.",
      },
      {
        label: "Missing seed",
        content: "The returned record cannot identify the authored random state.",
      },
    ],
    failingTests: [
      "Package pins must include exact versions in canonical order.",
      "The environment record must preserve an integer seed.",
    ],
    hints: [
      "Normalize names before sorting.",
      "Record the boundary; do not claim identical results across every platform and release.",
    ],
  },
});
