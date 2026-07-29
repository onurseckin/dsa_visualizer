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
    expect(playground.generateSteps({})).toHaveLength(4);
  });
});
