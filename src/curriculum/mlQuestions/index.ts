import { MLTopicQuestionBank } from "./types";
import { domain01to05 } from "./domain01to05";
import { domain06to10 } from "./domain06to10";

export const ML_QUESTION_BANKS: Record<string, MLTopicQuestionBank> = {};

const allBanks = [...domain01to05, ...domain06to10];

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
