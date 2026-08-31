import type { TopicFamilyId } from "./topicFamilies";
import type { TopicId } from "../../../curriculum/topics";

export interface DsaCurriculumPlacement {
  readonly id: string;
  readonly topicId: TopicId;
  readonly title: string;
  readonly description: string;
  readonly difficulty: "Easy" | "Medium" | "Hard";
  readonly family: TopicFamilyId;
  readonly prerequisites: readonly string[];
  readonly x: number;
  readonly y: number;
}

export const DSA_TREE_PLACEMENTS: readonly DsaCurriculumPlacement[] = [];
export const DSA_TREE_PLACEMENT_MAP: ReadonlyMap<string, DsaCurriculumPlacement> = new Map<
  string,
  DsaCurriculumPlacement
>();
