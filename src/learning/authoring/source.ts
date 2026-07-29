import type { SourceKind } from "../../types/dsa";
import type { LearningSource } from "../types";
import { isValidLearningSourceUrl } from "../types";
import { deepFreezeCopy } from "./freeze";

export interface VerifiedSourceInput {
  readonly label: string;
  readonly url: string;
  readonly kind?: SourceKind;
}

export function verifiedSource(input: VerifiedSourceInput): LearningSource {
  if (!input.label.trim() || !isValidLearningSourceUrl(input.url)) {
    throw new Error("A verified HTTP(S) learning source requires a label and canonical URL.");
  }

  return deepFreezeCopy({
    kind: input.kind ?? "ml_infra",
    label: input.label.trim(),
    provenance: "verified",
    url: input.url,
  });
}
