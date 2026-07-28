import type { AlgorithmDefinition } from "../types/dsa";
import {
  TOPIC_CATALOG,
  getTopicLabel,
  isMlInfraTopic,
  isTopicId,
  type TopicId,
} from "../curriculum/topics";

export { getTopicLabel, isMlInfraTopic, isTopicId };

export const TOPICS: readonly { id: TopicId; label: string }[] = TOPIC_CATALOG.map(
  (topic, index) => ({
    id: topic.id,
    label: `${index + 1}. ${topic.label}`,
  }),
);

export const getAlgorithmTopics = (
  algorithm: AlgorithmDefinition,
): readonly [TopicId, ...TopicId[]] => algorithm.topicIds;

export const getAlgorithmTopicLabels = (algorithm: AlgorithmDefinition): string[] =>
  algorithm.topicIds.map(getTopicLabel).sort((left, right) => left.localeCompare(right));

export const isMlInfraAlgorithm = (algorithm: AlgorithmDefinition): boolean =>
  algorithm.topicIds.some(isMlInfraTopic);
