import { useMemo, useState } from "react";

import { PrimaryVisualizerCanvas } from "../../../components/main-layout/components/PrimaryVisualizerCanvas";
import type { LearningItemPlayground } from "../../../learning/types";
import type { AlgorithmStep } from "../../../types/dsa";
import { Button } from "../../atoms/Button";

export interface AssessmentVisualizationProps {
  readonly title: string;
  readonly playground: LearningItemPlayground;
}

interface GeneratedSteps {
  readonly steps: readonly AlgorithmStep[];
  readonly error?: string;
}

export function AssessmentVisualization({
  title,
  playground,
}: AssessmentVisualizationProps): React.ReactElement {
  const [caseId, setCaseId] = useState(playground.execution.cases[0]?.id ?? "");
  const [stepIndex, setStepIndex] = useState(0);
  const selectedCase =
    playground.execution.cases.find((testCase) => testCase.id === caseId) ??
    playground.execution.cases[0];
  const generated = useMemo<GeneratedSteps>(() => {
    if (!selectedCase) {
      return { steps: [], error: "No executable case is authored for this walkthrough." };
    }
    try {
      const steps = playground.generateSteps(selectedCase.input);
      return steps.length > 0
        ? { steps }
        : { steps, error: "The authored generator returned no visual steps for this case." };
    } catch {
      return {
        steps: [],
        error: "The authored generator could not produce visual steps for this case.",
      };
    }
  }, [playground, selectedCase]);
  const boundedStepIndex = Math.min(stepIndex, Math.max(0, generated.steps.length - 1));
  const currentStep = generated.steps[boundedStepIndex];

  return (
    <section className="assessment-visualization" aria-label={`${title} visual walkthrough`}>
      <div className="assessment-visualization__header">
        <div>
          <p>Executable visual walkthrough</p>
          <h2>Inspect the authored state transitions</h2>
        </div>
        <label className="assessment-field">
          <span>Visualization case</span>
          <select
            aria-label="Visualization case"
            value={selectedCase?.id ?? ""}
            onChange={(event) => {
              setCaseId(event.target.value);
              setStepIndex(0);
            }}
          >
            {playground.execution.cases.map((testCase) => (
              <option key={testCase.id} value={testCase.id}>
                {testCase.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {generated.error || !currentStep ? (
        <p className="assessment-status" role="alert">
          {generated.error ?? "No authored visual step is available."}
        </p>
      ) : (
        <>
          <div className="assessment-visualization__canvas">
            <PrimaryVisualizerCanvas currentStep={currentStep} resolvedControlProps={null} />
          </div>
          <div className="assessment-visualization__controls">
            <Button
              aria-label="Previous visual step"
              disabled={boundedStepIndex === 0}
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            >
              Previous
            </Button>
            <span>
              Step {boundedStepIndex + 1} of {generated.steps.length}
            </span>
            <Button
              aria-label="Next visual step"
              disabled={boundedStepIndex === generated.steps.length - 1}
              onClick={() =>
                setStepIndex((current) => Math.min(generated.steps.length - 1, current + 1))
              }
            >
              Next
            </Button>
          </div>
          <div className="assessment-visualization__explanation" aria-live="polite">
            <div>
              <h3>What changes</h3>
              <p>{currentStep.explanation.what}</p>
            </div>
            <div>
              <h3>Why it changes</h3>
              <p>{currentStep.explanation.why}</p>
            </div>
          </div>
          <details className="assessment-visualization__state">
            <summary>Variables and auxiliary state</summary>
            <pre>
              {JSON.stringify(
                {
                  variables: currentStep.variables,
                  auxiliaryState: currentStep.auxiliaryState,
                },
                null,
                2,
              )}
            </pre>
          </details>
        </>
      )}
    </section>
  );
}
