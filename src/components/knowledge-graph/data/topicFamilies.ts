import { vizSlotBg, vizSlotColor } from "../../primitives/vizPalette";

export type TopicFamilyId =
  | "foundations"
  | "linear-structures"
  | "searching"
  | "trees-and-heaps"
  | "recursion"
  | "graphs"
  | "dynamic-programming"
  | "math-and-geometry";

export interface TopicFamily {
  id: TopicFamilyId;
  label: string;
  /** Zero-based --viz-* slot; index in TOPIC_FAMILIES is the fixed slot order. */
  slot: number;
}

export const TOPIC_FAMILIES: TopicFamily[] = [
  { id: "foundations", label: "Arrays & windows", slot: 0 },
  { id: "linear-structures", label: "Linear structures", slot: 1 },
  { id: "searching", label: "Searching", slot: 2 },
  { id: "trees-and-heaps", label: "Trees & heaps", slot: 3 },
  { id: "recursion", label: "Recursion", slot: 4 },
  { id: "graphs", label: "Graphs", slot: 5 },
  { id: "dynamic-programming", label: "Dynamic programming", slot: 6 },
  { id: "math-and-geometry", label: "Math, bits & geometry", slot: 7 },
];

const FAMILY_BY_ID: Record<TopicFamilyId, TopicFamily> = TOPIC_FAMILIES.reduce(
  (acc, family) => {
    acc[family.id] = family;
    return acc;
  },
  {} as Record<TopicFamilyId, TopicFamily>,
);

export const topicFamilyColor = (family: TopicFamilyId): string =>
  vizSlotColor(FAMILY_BY_ID[family].slot);
export const topicFamilyLabel = (family: TopicFamilyId): string => FAMILY_BY_ID[family].label;

export const topicFamilyFill = (family: TopicFamilyId): string =>
  vizSlotBg(FAMILY_BY_ID[family].slot, 26, "var(--bg-elevated)");
export const topicFamilyFillHover = (family: TopicFamilyId): string =>
  vizSlotBg(FAMILY_BY_ID[family].slot, 40, "var(--bg-elevated)");
