export type DifficultyLevel =
  | "Easy"
  | "Medium"
  | "Hard"
  | "Expert"
  | "easy"
  | "medium"
  | "hard"
  | "expert";

export type CurriculumTrackId = "dsa" | "machine-learning" | "ml" | "system-design" | string;

export interface ProseSection {
  readonly type: "prose";
  readonly title?: string;
  readonly content: string;
}

export interface CalloutSection {
  readonly type: "callout";
  readonly variant: "systems" | "tip" | "warning" | "note" | "theoretical";
  readonly title: string;
  readonly content: string;
}

export interface CodeProgressionStage {
  readonly label: string;
  readonly code: string;
  readonly explanation: string;
  readonly timeComplexity?: string;
  readonly spaceComplexity?: string;
}

export interface CodeProgressionSection {
  readonly type: "code_progression";
  readonly title: string;
  readonly language: string;
  readonly stages: readonly CodeProgressionStage[];
  readonly stepByStep?: readonly string[];
}

export interface MentalModelSection {
  readonly type: "mental_model";
  readonly title: string;
  readonly visualIntuition: string;
  readonly invariant: string;
  readonly stateTransitions: string;
  readonly naiveBottleneck: string;
  readonly optimalInsight: string;
}

export interface MathProofSection {
  readonly type: "math_proof";
  readonly title: string;
  readonly theorem: string;
  readonly proof: string;
}

export interface ProblemCheckpointSection {
  readonly type: "problem_checkpoint";
  readonly problemId: string;
  readonly title: string;
  readonly difficulty: DifficultyLevel;
  readonly rationale: string;
  readonly starterCode?: string;
}

export interface QuestionBankSuiteSection {
  readonly type: "question_bank_suite";
  readonly topicId: string;
  readonly title?: string;
  readonly partA_dsaCoding?: readonly {
    readonly title: string;
    readonly url?: string;
    readonly rationale?: string;
    readonly difficulty?: string;
    readonly problemId?: string;
    readonly description?: string;
    readonly problemStatement?: string;
  }[];
  readonly partB_mathProofs?: readonly {
    readonly title: string;
    readonly prompt?: string;
    readonly statement?: string;
    readonly proofOutline?: string;
    readonly engineeringContext?: string;
  }[];
  readonly partC_systemsQuestions?: readonly {
    readonly title: string;
    readonly prompt: string;
    readonly engineeringContext?: string;
    readonly proofOutline?: string;
    readonly scenario?: string;
  }[];
  readonly partD_stressTests?: readonly {
    readonly title: string;
    readonly scenario?: string;
    readonly failureMode?: string;
  }[];
}

export type CourseSection =
  | ProseSection
  | CalloutSection
  | CodeProgressionSection
  | MentalModelSection
  | MathProofSection
  | ProblemCheckpointSection
  | QuestionBankSuiteSection;

export interface CoursePage {
  readonly id: string;
  readonly pageNumber: number;
  readonly title: string;
  readonly subtitle?: string;
  readonly estimatedMinutes?: number;
  readonly sections: readonly CourseSection[];
}

export interface CourseChapter {
  readonly id: string;
  readonly chapterNumber: number;
  readonly title: string;
  readonly subtitle: string;
  readonly estimatedMinutes: number;
  readonly sections: readonly CourseSection[];
  readonly pages?: readonly CoursePage[];
}

export interface CourseTopicJourney {
  readonly id: string;
  readonly trackId?: CurriculumTrackId;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly difficulty: DifficultyLevel;
  readonly estimatedMinutes: number;
  readonly chapters: readonly CourseChapter[];
}
