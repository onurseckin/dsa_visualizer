import type { LearningItem } from "../learning/types";
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

export const getLearningItemTopics = (item: LearningItem): readonly [TopicId, ...TopicId[]] =>
  item.topicIds;

export const getLearningItemTopicLabels = (item: LearningItem): string[] =>
  item.topicIds.map(getTopicLabel).sort((left, right) => left.localeCompare(right));

export const isMlInfraLearningItem = (item: LearningItem): boolean =>
  item.topicIds.some(isMlInfraTopic);
