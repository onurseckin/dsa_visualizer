import {
  difficultyLevelFromProfile,
  deriveDifficultyLabel,
  isDifficultyProfile,
  type DifficultyProfile,
  type DifficultyScore,
} from "../difficulty";

export interface AuthoredDifficulty {
  readonly difficultyProfile: DifficultyProfile;
  readonly difficultyLabel: ReturnType<typeof deriveDifficultyLabel>;
  readonly difficulty: ReturnType<typeof difficultyLevelFromProfile>;
}

export function profile(
  prerequisite: DifficultyScore,
  representations: DifficultyScore,
  horizon: DifficultyScore,
  tradeoffs: DifficultyScore,
): DifficultyProfile {
  const value = {
    prerequisite,
    representations,
    horizon,
    tradeoffs,
  } satisfies DifficultyProfile;
  if (!isDifficultyProfile(value)) {
    throw new Error("Learning-item difficulty must be a valid P/R/H/T profile.");
  }
  return Object.freeze(value);
}

export function authoredDifficulty(difficultyProfile: DifficultyProfile): AuthoredDifficulty {
  if (!isDifficultyProfile(difficultyProfile)) {
    throw new Error("Learning-item difficulty must be a valid P/R/H/T profile.");
  }
  return Object.freeze({
    difficultyProfile,
    difficultyLabel: deriveDifficultyLabel(difficultyProfile),
    difficulty: difficultyLevelFromProfile(difficultyProfile),
  });
}
