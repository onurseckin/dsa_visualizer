import type { MLTopicQuestionBank } from "./types";
import { domain01_part1 } from "./domain01_part1";
import { domain01_part2 } from "./domain01_part2";
import { domain02_part1 } from "./domain02_part1";
import { domain02_part2 } from "./domain02_part2";
import { domain03_part1 } from "./domain03_part1";
import { domain03_part2 } from "./domain03_part2";
import { domain04_part1 } from "./domain04_part1";
import { domain04_part2 } from "./domain04_part2";
import { domain04_part3 } from "./domain04_part3";
import { domain05_part1 } from "./domain05_part1";
import { domain05_part2 } from "./domain05_part2";
import { domain05_part3 } from "./domain05_part3";
import { domain06_part1 } from "./domain06_part1";
import { domain06_part2 } from "./domain06_part2";
import { domain07_part1 } from "./domain07_part1";
import { domain07_part2 } from "./domain07_part2";
import { domain08_part1 } from "./domain08_part1";
import { domain08_part2 } from "./domain08_part2";
import { domain09_part1 } from "./domain09_part1";
import { domain09_part2 } from "./domain09_part2";
import { domain10_part1 } from "./domain10_part1";
import { domain10_part2 } from "./domain10_part2";
import { domain10_part3 } from "./domain10_part3";

export const ML_QUESTION_BANKS: Record<string, MLTopicQuestionBank> = {};

const allBanks: MLTopicQuestionBank[] = [
  ...domain01_part1,
  ...domain01_part2,
  ...domain02_part1,
  ...domain02_part2,
  ...domain03_part1,
  ...domain03_part2,
  ...domain04_part1,
  ...domain04_part2,
  ...domain04_part3,
  ...domain05_part1,
  ...domain05_part2,
  ...domain05_part3,
  ...domain06_part1,
  ...domain06_part2,
  ...domain07_part1,
  ...domain07_part2,
  ...domain08_part1,
  ...domain08_part2,
  ...domain09_part1,
  ...domain09_part2,
  ...domain10_part1,
  ...domain10_part2,
  ...domain10_part3,
];

for (const bank of allBanks) {
  ML_QUESTION_BANKS[bank.topicId] = bank;
}

export function getMlTopicQuestionBank(topicId: string): MLTopicQuestionBank {
  const bank = ML_QUESTION_BANKS[topicId];
  if (!bank) {
    throw new Error(`MLTopicQuestionBank not found for topicId: ${topicId}`);
  }
  return bank;
}

export * from "./types";
