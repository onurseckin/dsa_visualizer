import { vizSlotBg, vizSlotColor } from "../../primitives/vizPalette";
import type { CurriculumPlacement } from "../../../curriculum/trees";

export type MLInfraFamilyId =
  | "foundations"
  | "training-data-lifecycle"
  | "production-systems"
  | "operations-governance"
  | "capstone"
  | "electives";

export interface MLInfraFamily {
  id: MLInfraFamilyId;
  label: string;
  slot: number;
}

export const ML_INFRA_FAMILIES: MLInfraFamily[] = [
  { id: "foundations", label: "Foundations", slot: 0 },
  {
    id: "training-data-lifecycle",
    label: "Training & Data Lifecycle",
    slot: 1,
  },
  { id: "production-systems", label: "Production Systems", slot: 2 },
  {
    id: "operations-governance",
    label: "Operations & Governance",
    slot: 3,
  },
  { id: "capstone", label: "Capstone", slot: 4 },
  { id: "electives", label: "Advanced Electives", slot: 5 },
];

const FAMILY_BY_ID: Record<MLInfraFamilyId, MLInfraFamily> = ML_INFRA_FAMILIES.reduce(
  (acc, family) => {
    acc[family.id] = family;
    return acc;
  },
  {} as Record<MLInfraFamilyId, MLInfraFamily>,
);

export const mlInfraFamilyColor = (family: MLInfraFamilyId): string =>
  vizSlotColor(FAMILY_BY_ID[family]?.slot ?? 0);

export const mlInfraFamilyLabel = (family: MLInfraFamilyId): string =>
  FAMILY_BY_ID[family]?.label ?? "";

export const mlInfraFamilyFill = (family: MLInfraFamilyId): string =>
  vizSlotBg(FAMILY_BY_ID[family]?.slot ?? 0, 26, "var(--bg-elevated)");

export const mlInfraFamilyFillHover = (family: MLInfraFamilyId): string =>
  vizSlotBg(FAMILY_BY_ID[family]?.slot ?? 0, 40, "var(--bg-elevated)");

export type MLInfraCurriculumPlacement = CurriculumPlacement<MLInfraFamilyId>;
