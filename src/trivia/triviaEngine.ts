/* Pure drill logic — no React, no storage, no Math.random by default.
   Decomposed into focused sub-modules under ./engine/. */

export * from "./engine/triviaEngineConfig";
export * from "./engine/triviaEngineParser";
export * from "./engine/triviaEngineProgress";
export * from "./engine/triviaEngineRound";
export * from "./engine/triviaEngineGrading";
export * from "./engine/triviaEngineMastery";
export type { Rng, PickRoundOptions } from "./engine/triviaEngineRound";
