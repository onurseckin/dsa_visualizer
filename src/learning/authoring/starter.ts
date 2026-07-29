const PYTHON_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export interface SemanticStarterInput {
  readonly entrypoint: string;
  readonly parameters: readonly string[];
  readonly contract: string;
}

export function semanticStarter(input: SemanticStarterInput): string {
  if (
    !PYTHON_IDENTIFIER.test(input.entrypoint) ||
    input.parameters.some((parameter) => !PYTHON_IDENTIFIER.test(parameter))
  ) {
    throw new Error("Entrypoints and parameters must be valid Python identifiers.");
  }
  const contract = input.contract.trim();
  if (!contract) {
    throw new Error("A semantic starter requires a nonempty output contract.");
  }
  const contractComments = contract
    .split("\n")
    .map((line) => `    # ${line.trim()}`)
    .join("\n");

  return `def ${input.entrypoint}(${input.parameters.join(", ")}):
${contractComments}
    raise NotImplementedError("Implement ${input.entrypoint}")`;
}
