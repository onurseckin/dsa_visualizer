import { ALGORITHMS } from "../src/algorithms/registry";
import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TutorialScenarioKind,
} from "../src/types/dsa";

type PrimitiveUsage = Map<string, number>;
type ScenarioExample = { scenario: TutorialScenarioKind; input: unknown };

const SCENARIOS: readonly TutorialScenarioKind[] = ["standard", "boundary", "adversarial"];

interface VisualizerHealth {
  algorithmCount: number;
  defaultInputStepCount: number;
  defaultInputCodeLinkedSteps: number;
  defaultInputScalarNarrativeSteps: number;
  defaultInputAdjacentDuplicatePrimarySnapshots: number;
  defaultInputPrimitiveUsage: PrimitiveUsage;
  scenarioMatrixMetadataAlgorithms: number;
  contractReadyTutorialIds: string[];
  legacyTutorialIds: string[];
  missingScenarioMatrixIds: string[];
  readinessNotes: string[];
}

interface RunInspection {
  readonly introSnapshots: readonly string[];
  readonly issues: readonly string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasScalarNarrative(step: AlgorithmStep): boolean {
  return typeof step.narrative === "string" && step.narrative.trim().length > 0;
}

function hasTutorialMetadata(step: AlgorithmStep): boolean {
  const tutorial = step.tutorial;
  if (!tutorial) return false;
  if (tutorial.phase === "intro" || tutorial.phase === "walkthrough") {
    return tutorial.scenario === undefined;
  }
  return tutorial.phase === "scenario" && SCENARIOS.includes(tutorial.scenario);
}

function findScenarioMatrix(
  algorithm: (typeof ALGORITHMS)[number],
): readonly ScenarioExample[] | undefined {
  const examples = algorithm.examples;
  if (!examples || examples.length !== SCENARIOS.length) return undefined;

  const byScenario = new Map<TutorialScenarioKind, ScenarioExample>();
  for (const example of examples) {
    if (
      !example.scenario ||
      !SCENARIOS.includes(example.scenario) ||
      byScenario.has(example.scenario)
    ) {
      return undefined;
    }
    byScenario.set(example.scenario, { scenario: example.scenario, input: example.input });
  }

  return SCENARIOS.map((scenario) => byScenario.get(scenario)!);
}

function recordPrimitiveUsage(snapshot: PrimaryVisualSnapshot, usage: PrimitiveUsage): void {
  usage.set(snapshot.kind, (usage.get(snapshot.kind) ?? 0) + 1);

  if (snapshot.kind === "composite") {
    for (const item of snapshot.items) {
      recordPrimitiveUsage(item.snapshot, usage);
    }
  }
}

function serializePrimarySnapshot(
  snapshot: unknown,
  context: string,
): { snapshot: PrimaryVisualSnapshot; serialized: string } {
  if (!isRecord(snapshot) || typeof snapshot.kind !== "string") {
    throw new Error(`${context}: step primarySnapshot is malformed`);
  }

  try {
    const serialized = JSON.stringify(snapshot);
    if (typeof serialized !== "string") {
      throw new Error("primarySnapshot could not be serialized");
    }
    return { snapshot: snapshot as PrimaryVisualSnapshot, serialized };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${context}: malformed primarySnapshot (${message})`, { cause: error });
  }
}

function generateSteps(
  algorithm: AlgorithmDefinition,
  input: unknown,
  inputLabel: string,
): AlgorithmStep[] {
  const context = `${algorithm.id} (${inputLabel})`;
  try {
    const steps = algorithm.generateSteps(input);
    if (!Array.isArray(steps)) {
      throw new Error("generateSteps must return an array");
    }
    return steps;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${context}: generateSteps failed (${message})`, { cause: error });
  }
}

function inspectRun(
  steps: readonly AlgorithmStep[],
  context: string,
  isStandardInput: boolean = true,
): RunInspection {
  const issues: string[] = [];
  const introSnapshots: string[] = [];
  let previousSnapshot: string | undefined;
  let introLength = 0;

  if (steps.length === 0) {
    return { introSnapshots, issues: ["returned no steps"] };
  }

  for (const [position, step] of steps.entries()) {
    if (!isRecord(step)) {
      throw new Error(`${context}: step ${position} is malformed`);
    }
    if (step.stepIndex !== position) {
      issues.push(`step indexes are not sequential at position ${position}`);
    }
    if (step.codeLine !== undefined) {
      issues.push(`step ${position} is still code-linked`);
    }
    if (!hasScalarNarrative(step)) {
      issues.push(`step ${position} lacks a scalar narrative`);
    }
    if (!hasTutorialMetadata(step)) {
      issues.push(`step ${position} lacks valid tutorial metadata`);
    }

    const { serialized } = serializePrimarySnapshot(
      step.primarySnapshot,
      `${context}, step ${position}`,
    );
    if (serialized === previousSnapshot) {
      issues.push(`adjacent primary snapshots repeat at step ${position}`);
    }
    previousSnapshot = serialized;

    if (step.tutorial?.phase === "intro" && introLength === position) {
      introSnapshots.push(serialized);
      introLength += 1;
    } else if (step.tutorial?.phase === "intro") {
      issues.push(`intro frames are not contiguous at step ${position}`);
    }
  }

  if (isStandardInput && (introLength < 8 || introLength > 12)) {
    issues.push(`expected 8–12 opening intro frames, found ${introLength}`);
  }
  if (!steps.some((step) => step.tutorial?.phase === "walkthrough")) {
    issues.push("has no walkthrough frame");
  }

  return { introSnapshots, issues };
}

function collectDefaultInputAggregates(
  steps: readonly AlgorithmStep[],
  health: VisualizerHealth,
  context: string,
): void {
  health.defaultInputStepCount += steps.length;
  let previousSnapshot: string | undefined;

  for (const [position, step] of steps.entries()) {
    if (!isRecord(step)) {
      throw new Error(`${context}: step ${position} is malformed`);
    }
    if (step.codeLine !== undefined) health.defaultInputCodeLinkedSteps += 1;
    if (hasScalarNarrative(step)) health.defaultInputScalarNarrativeSteps += 1;

    const { snapshot, serialized } = serializePrimarySnapshot(
      step.primarySnapshot,
      `${context}, step ${position}`,
    );
    if (serialized === previousSnapshot) {
      health.defaultInputAdjacentDuplicatePrimarySnapshots += 1;
    }
    previousSnapshot = serialized;
    recordPrimitiveUsage(snapshot, health.defaultInputPrimitiveUsage);
  }
}

function summarizeIssues(issues: readonly string[]): string {
  return [...new Set(issues)].join("; ");
}

function collectVisualizerHealth(): VisualizerHealth {
  const health: VisualizerHealth = {
    algorithmCount: ALGORITHMS.length,
    defaultInputStepCount: 0,
    defaultInputCodeLinkedSteps: 0,
    defaultInputScalarNarrativeSteps: 0,
    defaultInputAdjacentDuplicatePrimarySnapshots: 0,
    defaultInputPrimitiveUsage: new Map(),
    scenarioMatrixMetadataAlgorithms: 0,
    contractReadyTutorialIds: [],
    legacyTutorialIds: [],
    missingScenarioMatrixIds: [],
    readinessNotes: [],
  };

  for (const algorithm of ALGORITHMS) {
    const defaultContext = `${algorithm.id} (default input)`;
    const defaultSteps = generateSteps(algorithm, algorithm.defaultInput, "default input");
    collectDefaultInputAggregates(defaultSteps, health, defaultContext);
    const defaultInspection = inspectRun(defaultSteps, defaultContext);

    const scenarioMatrix = findScenarioMatrix(algorithm);
    if (!scenarioMatrix) {
      health.legacyTutorialIds.push(algorithm.id);
      health.missingScenarioMatrixIds.push(algorithm.id);
      continue;
    }
    health.scenarioMatrixMetadataAlgorithms += 1;

    const scenarioInspections: Array<{
      scenario: TutorialScenarioKind;
      inspection: RunInspection;
    }> = [];
    const issues = [...defaultInspection.issues];
    for (const example of scenarioMatrix) {
      const inputLabel = `${example.scenario} scenario example`;
      const scenarioSteps = generateSteps(algorithm, example.input, inputLabel);
      const inspection = inspectRun(
        scenarioSteps,
        `${algorithm.id} (${inputLabel})`,
        example.scenario === "standard",
      );
      scenarioInspections.push({ scenario: example.scenario, inspection });
      issues.push(...inspection.issues.map((issue) => `${example.scenario}: ${issue}`));
    }

    const defaultIntro = defaultInspection.introSnapshots;
    for (const { scenario, inspection } of scenarioInspections) {
      if (
        scenario === "standard" &&
        JSON.stringify(inspection.introSnapshots) !== JSON.stringify(defaultIntro)
      ) {
        issues.push(`${scenario}: opening intro frames depend on the selected input`);
      }
    }

    if (issues.length === 0) {
      health.contractReadyTutorialIds.push(algorithm.id);
    } else {
      health.legacyTutorialIds.push(algorithm.id);
      health.readinessNotes.push(`${algorithm.id}: ${summarizeIssues(issues)}`);
    }
  }

  return health;
}

function formatPrimitiveUsage(usage: PrimitiveUsage): string {
  return [...usage.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([kind, count]) => `    ${kind}: ${count}`)
    .join("\n");
}

function printVisualizerHealth(health: VisualizerHealth): void {
  console.log("Visualizer migration health (informational)");
  console.log(`Algorithms: ${health.algorithmCount}`);
  console.log("Default-input aggregates:");
  console.log(`  Generated steps: ${health.defaultInputStepCount}`);
  console.log(`  Code-linked steps: ${health.defaultInputCodeLinkedSteps}`);
  console.log(`  Scalar narrative steps: ${health.defaultInputScalarNarrativeSteps}`);
  console.log(
    `  Adjacent duplicate primary snapshots: ${health.defaultInputAdjacentDuplicatePrimarySnapshots}`,
  );
  console.log("  Primitive-kind usage:");
  console.log(formatPrimitiveUsage(health.defaultInputPrimitiveUsage));
  console.log(`Scenario-matrix metadata: ${health.scenarioMatrixMetadataAlgorithms} algorithms`);
  console.log(`Contract-ready tutorials: ${health.contractReadyTutorialIds.length}`);
  console.log(
    `  IDs: ${health.contractReadyTutorialIds.length ? health.contractReadyTutorialIds.join(", ") : "(none)"}`,
  );
  console.log(`Legacy or not-ready tutorials: ${health.legacyTutorialIds.length}`);
  console.log(
    `  IDs: ${health.legacyTutorialIds.length ? health.legacyTutorialIds.join(", ") : "(none)"}`,
  );
  console.log(`Missing scenario matrix: ${health.missingScenarioMatrixIds.length}`);
  if (health.readinessNotes.length > 0) {
    console.log("Readiness notes (informational):");
    for (const note of health.readinessNotes) console.log(`  ${note}`);
  }
}

printVisualizerHealth(collectVisualizerHealth());
