import { MLTopicQuestionBank } from "./types";
import { domain01to02 } from "./domain01to02";
import { domain03to04 } from "./domain03to04";
import { domain05to10 } from "./domain05to10";

export const ML_QUESTION_BANKS: Record<string, MLTopicQuestionBank> = {};

const allBanks: MLTopicQuestionBank[] = [...domain01to02, ...domain03to04, ...domain05to10];

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
export { domain01to02, domain03to04, domain05to10 };
