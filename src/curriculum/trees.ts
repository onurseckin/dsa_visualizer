import type { DifficultyLevel } from "../types/dsa";
import type { TopicId } from "./topics";

export type CurriculumTreeId = "dsa" | "ml-infra";

export interface CurriculumPlacement<TFamilyId extends string = string> {
  id: string;
  topicId: TopicId;
  title: string;
  description: string;
  prerequisites: readonly string[];
  difficulty: DifficultyLevel;
  family: TFamilyId;
  x: number;
  y: number;
}

export interface CurriculumTree<TFamilyId extends string = string> {
  id: CurriculumTreeId;
  placements: readonly CurriculumPlacement<TFamilyId>[];
}

export const indexPlacements = <TPlacement extends CurriculumPlacement>(
  placements: readonly TPlacement[],
): ReadonlyMap<string, TPlacement> =>
  new Map(placements.map((placement) => [placement.id, placement]));
