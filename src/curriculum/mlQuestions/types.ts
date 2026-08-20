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

export interface CodeVariant {
  id: string;
  label: string;
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
}

export interface ComplexityAnalysis {
  timeComplexity: string;
  spaceComplexity: string;
  breakdown: string;
}

export interface TopicGuideTerm {
  term: string;
  definition: string;
}

export interface TopicGuideSection {
  heading: string;
  body: string;
}

export interface TopicGuide {
  overview: string;
  keyTerms: TopicGuideTerm[];
  sections: TopicGuideSection[];
}

export interface TutorialAlignment {
  phase1_intro: string;
  phase2_walkthrough: string;
  phase3_scenarios: string[];
}

export interface VisualizerSchema {
  canvasType: string;
  stateVariables: Record<string, string>;
  colorMapping: Record<string, string>;
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
  codeVariants: CodeVariant[];
  complexityAnalysis: ComplexityAnalysis;
  topicGuide: TopicGuide;
  tutorialAlignment: TutorialAlignment;
  visualizerSchema: VisualizerSchema;
}
