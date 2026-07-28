import { describe, expect, it } from "vitest";
import { ALGORITHM_REGISTRY } from "../registry";
import type { AlgorithmDefinition } from "../../types/dsa";
import { TOPIC_CATALOG } from "../../curriculum/topics";

const CANONICAL_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REMOVED_RELATION_FIELDS = [
  "category",
  "categories",
  "isMlInfra",
  "mlInfraCategory",
  "mlInfraLevel",
  "uuid",
] as const;

const topicIds = new Set<string>(TOPIC_CATALOG.map((topic) => topic.id));

const enrolledDefinitions = Object.entries(ALGORITHM_REGISTRY);

describe("canonical problem catalog contract", () => {
  it("enrolls every definition once, under its own canonical id", () => {
    const enrollmentIdsByDefinition = new Map<AlgorithmDefinition, string[]>();

    for (const [registryId, definition] of enrolledDefinitions) {
      enrollmentIdsByDefinition.set(definition, [
        ...(enrollmentIdsByDefinition.get(definition) ?? []),
        registryId,
      ]);
    }

    const duplicateEnrollments = [...enrollmentIdsByDefinition.entries()]
      .filter(([, registryIds]) => registryIds.length !== 1)
      .map(([definition, registryIds]) => ({ id: definition.id, registryIds }));
    const mismatchedIds = enrolledDefinitions
      .filter(([registryId, definition]) => registryId !== definition.id)
      .map(([registryId, definition]) => ({ registryId, definitionId: definition.id }));

    expect(duplicateEnrollments).toEqual([]);
    expect(mismatchedIds).toEqual([]);
  });

  it("uses canonical kebab-case ids for registry keys and definition ids", () => {
    const nonCanonicalKeys = enrolledDefinitions
      .map(([registryId]) => registryId)
      .filter((registryId) => !CANONICAL_ID.test(registryId));
    const nonCanonicalDefinitionIds = enrolledDefinitions
      .map(([, definition]) => definition.id)
      .filter((definitionId) => !CANONICAL_ID.test(definitionId));

    expect(nonCanonicalKeys).toEqual([]);
    expect(nonCanonicalDefinitionIds).toEqual([]);
  });

  it("relates every problem to one or more declared topics", () => {
    const invalidTopicRelations = enrolledDefinitions
      .map(([id, definition]) => {
        return {
          id,
          topics: definition.topicIds,
          missing: definition.topicIds.filter((topicId) => !topicIds.has(topicId)),
        };
      })
      .filter(({ topics, missing }) => topics.length === 0 || missing.length > 0);

    expect(invalidTopicRelations).toEqual([]);
  });

  it("contains no legacy or placement-specific relation fields", () => {
    const legacyFields = enrolledDefinitions.flatMap(([id, definition]) =>
      REMOVED_RELATION_FIELDS.filter((field) => Object.hasOwn(definition, field)).map((field) => ({
        id,
        field,
      })),
    );

    expect(legacyFields).toEqual([]);
  });
});
