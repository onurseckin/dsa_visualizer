export interface LeetCodeProblem {
  title: string;
  url: string;
  rationale: string;
  difficulty?: "Easy" | "Medium" | "Hard";
}

export interface MathProof {
  title: string;
  prompt: string;
  proofOutline?: string;
}

export interface SystemsQuestion {
  title: string;
  prompt: string;
  engineeringContext?: string;
}

export interface StressTest {
  title: string;
  scenario: string;
  failureMode: string;
}

export interface ExecutableContract {
  id: string;
  title: string;
  referenceUrl: string;
  prompt: string;
  inputSchema: string;
  outputSchema: string;
  constraints: string[];
  tolerances: string;
  workedExamples: string[];
  pythonCode: string;
}

export interface MLTopicQuestionBank {
  topicId: string;
  title: string;
  domain: string;
  partA_dsaCoding: LeetCodeProblem[];
  partB_mathProofs: MathProof[];
  partC_systemsQuestions: SystemsQuestion[];
  partD_stressTests: StressTest[];
  executableContract: ExecutableContract;
}
