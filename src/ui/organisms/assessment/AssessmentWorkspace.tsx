import type { LearningItem } from "../../../learning/types";
import { isAlgorithmLearningItem } from "../../../learning/types";
import { CalculatorAssessment } from "./CalculatorAssessment";
import { CapstoneAssessment } from "./CapstoneAssessment";
import { DebuggingAssessment } from "./DebuggingAssessment";
import { ScenarioAssessment } from "./ScenarioAssessment";
import { TraceAssessment, Unavailable } from "./TraceAssessment";

export interface AssessmentWorkspaceProps {
  readonly item: LearningItem;
}

/** Renders only authored assessment payloads; algorithm playback remains MainLayout-owned. */
export function AssessmentWorkspace({ item }: AssessmentWorkspaceProps): React.ReactElement {
  if (isAlgorithmLearningItem(item)) {
    return <Unavailable title={item.title} mode="algorithm" />;
  }

  let content: React.ReactNode;
  switch (item.kind) {
    case "trace":
      content = <TraceAssessment title={item.title} payload={item.assessment.payload} />;
      break;
    case "calculator":
      content = <CalculatorAssessment title={item.title} payload={item.assessment.payload} />;
      break;
    case "debugging":
      content = (
        <DebuggingAssessment
          title={item.title}
          payload={item.assessment.payload}
          correctedReference={item.code}
        />
      );
      break;
    case "scenario":
      content = (
        <ScenarioAssessment
          title={item.title}
          prompt={item.prompt}
          payload={item.assessment.payload}
          rubric={item.rubric}
        />
      );
      break;
    case "capstone":
      content = (
        <CapstoneAssessment
          title={item.title}
          prompt={item.prompt}
          payload={item.assessment.payload}
          rubric={item.rubric}
        />
      );
      break;
  }

  return (
    <main className="assessment-workspace" aria-label={`${item.title} assessment`}>
      <header className="assessment-workspace__header">
        <p>Assessment workspace</p>
        <h1>{item.title}</h1>
        <p>{item.description}</p>
      </header>
      {content}
    </main>
  );
}
