import { NODES_GROUP_1, type TopicRoadmapNode } from "./nodesGroup1";
import { NODES_GROUP_2 } from "./nodesGroup2";

export type { TopicRoadmapNode };

export const TOPIC_ROADMAP_NODES: TopicRoadmapNode[] = [...NODES_GROUP_1, ...NODES_GROUP_2];

export const TOPIC_ROADMAP_NODE_MAP = new Map<string, TopicRoadmapNode>(
  TOPIC_ROADMAP_NODES.map((n) => [n.id, n]),
);
