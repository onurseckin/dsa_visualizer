import { vizSlotBg, vizSlotColor } from "../../primitives/vizPalette";
import type { CurriculumPlacement } from "../../../curriculum/trees";

export type MLInfraFamilyId =
  | "linear-algebra"
  | "calculus-autograd"
  | "probability-stats"
  | "classical-ml"
  | "deep-learning"
  | "tokenization-retrieval"
  | "transformers"
  | "inference-serving"
  | "precision-kernels"
  | "distributed-compilers";

export interface MLInfraFamily {
  id: MLInfraFamilyId;
  label: string;
  slot: number;
}

export const ML_INFRA_FAMILIES: MLInfraFamily[] = [
  { id: "linear-algebra", label: "Linear Algebra", slot: 0 },
  { id: "calculus-autograd", label: "Calculus & Optimization", slot: 1 },
  { id: "probability-stats", label: "Probability & Statistics", slot: 2 },
  { id: "classical-ml", label: "Classical ML & Data Science", slot: 3 },
  { id: "deep-learning", label: "Deep Learning & Activations", slot: 4 },
  { id: "tokenization-retrieval", label: "Tokenization & Retrieval", slot: 5 },
  { id: "transformers", label: "Attention & Transformers", slot: 6 },
  { id: "inference-serving", label: "Inference Serving", slot: 7 },
  { id: "precision-kernels", label: "Precision & GPU Kernels", slot: 8 },
  { id: "distributed-compilers", label: "Distributed & Compilers", slot: 9 },
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
