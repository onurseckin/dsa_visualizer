import type { DifficultyLevel } from "../types/dsa";

export type DifficultyScore = 0 | 1 | 2 | 3;

export interface DifficultyProfile {
  readonly prerequisite: DifficultyScore;
  readonly representations: DifficultyScore;
  readonly horizon: DifficultyScore;
  readonly tradeoffs: DifficultyScore;
}

export type LearningDifficultyLabel =
  | "Introductory"
  | "Developing"
  | "Proficient"
  | "Advanced"
  | "Systems Design";

const isDifficultyScore = (value: unknown): value is DifficultyScore =>
  Number.isInteger(value) && typeof value === "number" && value >= 0 && value <= 3;

export function isDifficultyProfile(value: unknown): value is DifficultyProfile {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const profile = value as Record<string, unknown>;
  const keys = Object.keys(profile);
  if (
    keys.length !== 4 ||
    !keys.every(
      (key) =>
        key === "prerequisite" ||
        key === "representations" ||
        key === "horizon" ||
        key === "tradeoffs",
    )
  ) {
    return false;
  }
  return (
    isDifficultyScore(profile.prerequisite) &&
    isDifficultyScore(profile.representations) &&
    isDifficultyScore(profile.horizon) &&
    isDifficultyScore(profile.tradeoffs)
  );
}

export function difficultyProfileScore(profile: DifficultyProfile): number {
  return profile.prerequisite + profile.representations + profile.horizon + profile.tradeoffs;
}

export function deriveDifficultyLabel(profile: DifficultyProfile): LearningDifficultyLabel {
  const score = difficultyProfileScore(profile);
  if (score <= 2) return "Introductory";
  if (score <= 4) return "Developing";
  if (score <= 7) return "Proficient";
  if (score <= 10) return "Advanced";
  return "Systems Design";
}

export function difficultyLevelFromProfile(profile: DifficultyProfile): DifficultyLevel {
  const label = deriveDifficultyLabel(profile);
  if (label === "Introductory" || label === "Developing") return "Easy";
  if (label === "Proficient") return "Medium";
  return "Hard";
}

const LEGACY_DIFFICULTY_PROFILES = Object.freeze({
  Easy: Object.freeze({
    prerequisite: 0,
    representations: 1,
    horizon: 1,
    tradeoffs: 0,
  }),
  Medium: Object.freeze({
    prerequisite: 1,
    representations: 2,
    horizon: 1,
    tradeoffs: 1,
  }),
  Hard: Object.freeze({
    prerequisite: 2,
    representations: 2,
    horizon: 2,
    tradeoffs: 2,
  }),
} as const satisfies Record<DifficultyLevel, DifficultyProfile>);

/**
 * Transitional adapter mapping for the current coarse algorithm catalog.
 * Target learning items author all four scores directly.
 */
export function legacyDifficultyProfile(
  difficulty: DifficultyLevel | undefined,
): DifficultyProfile {
  return LEGACY_DIFFICULTY_PROFILES[difficulty ?? "Medium"];
}
