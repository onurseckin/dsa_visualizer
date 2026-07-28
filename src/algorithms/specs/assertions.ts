import type { ProblemExample } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

type ExampleSubject<TInput> = {
  examples?: ProblemExample<TInput>[];
};

export function requireExampleInputs<TInput>(
  subject: ExampleSubject<TInput>,
  isInput: (input: ProblemExample<TInput>["input"]) => input is TInput,
): TInput[] {
  const examples = subject.examples;
  if (!examples) {
    throw new Error("expected authored examples");
  }

  return examples.map((example, index) => {
    if (!isInput(example.input)) {
      throw new Error(`example ${index + 1} must use a typed input`);
    }
    return example.input;
  });
}

export function requireLineExplanations(subject: { trivia?: TriviaMeta }): Record<number, string> {
  const lineExplanations = subject.trivia?.lineExplanations;
  if (!lineExplanations) {
    throw new Error("expected trivia line explanations");
  }
  return lineExplanations;
}
