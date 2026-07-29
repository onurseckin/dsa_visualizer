import { describe, expect, it } from "vitest";
import { mlIncidentCapstone } from "../mlIncidentCapstone";

describe("ml-incident-capstone", () => {
  it("requires containment, evidence preservation, and verified recovery", () => {
    expect(mlIncidentCapstone).toMatchObject({
      id: "ml-incident-capstone",
      kind: "capstone",
      topicIds: ["ml_platform_capstone"],
    });
    expect(
      mlIncidentCapstone.rubric.criteria
        .filter((criterion) => criterion.critical)
        .map((criterion) => criterion.id),
    ).toEqual(["containment", "evidence", "recovery"]);
    expect(mlIncidentCapstone.assessment.payload?.incidentTimeline).toHaveLength(6);
    const playground = mlIncidentCapstone.playground;
    expect(playground).toBeDefined();
    if (!playground) throw new Error("Expected the incident capstone to have a playground");
    const steps = playground.generateSteps({});
    expect(steps).toHaveLength(6);
    expect(steps.at(-1)?.primarySnapshot).toMatchObject({
      nodes: [
        { id: "detect", label: "Detect · 6 missing", state: "sorted" },
        { id: "contain", label: "Contain · missing", state: "sorted" },
        { id: "preserve", label: "Preserve · 0 artifacts", state: "sorted" },
        { id: "diagnose", label: "Diagnose", state: "sorted" },
        { id: "recover", label: "Recover · 6 missing", state: "sorted" },
        { id: "learn", label: "Learn · owner missing", state: "active" },
      ],
      edges: expect.arrayContaining([{ from: "recover", to: "learn", isTraversed: true }]),
    });
    const complete = playground.generateSteps(playground.execution.cases[0]!.input);
    const empty = playground.generateSteps(playground.execution.cases[1]!.input);
    expect(complete).not.toEqual(empty);
    expect(JSON.stringify(complete)).toContain("INC-42");
    expect(JSON.stringify(empty)).toContain("6 missing");
  });
});
