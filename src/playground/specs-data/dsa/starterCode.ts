import type { PythonInvocation } from "@dsa-visualizer/execution-contracts";

const GENERIC_PARAMETER = /^arg\d+$/;

export function createDsaStarterCode(
  referenceCode: string,
  entrypoint: string,
  invocation: PythonInvocation,
): string {
  if (invocation.kind === "stdin") {
    return [
      "# Read the authored input from standard input.",
      'raise NotImplementedError("Implement the stdin solution")',
    ].join("\n");
  }

  if (invocation.kind === "function") {
    const parameterNames = callableParameterNames(referenceCode, entrypoint, false);
    validateParameters(entrypoint, parameterNames, invocation.arguments.length);
    return [
      `def ${entrypoint}(${parameterNames.join(", ")}):`,
      '    raise NotImplementedError("Implement this function")',
    ].join("\n");
  }

  const classCode = classBody(referenceCode, entrypoint);
  const constructorParameters = callableParameterNames(classCode, "__init__", true);
  validateMethodParameters(
    `${entrypoint}.__init__`,
    constructorParameters,
    invocation.constructor.length,
  );

  const methods = new Map<string, readonly string[]>();
  const addMethod = (method: string, arity: number): void => {
    if (methods.has(method)) return;
    const parameterNames = callableParameterNames(classCode, method, true);
    validateMethodParameters(`${entrypoint}.${method}`, parameterNames, arity);
    methods.set(method, parameterNames);
  };

  for (const setup of invocation.setup ?? []) {
    addMethod(setup.method, setup.arguments.length);
  }
  addMethod(invocation.method, invocation.arguments.length);

  const lines = [
    `class ${entrypoint}:`,
    `    def __init__(${constructorParameters.join(", ")}):`,
    "        pass",
  ];
  for (const [method, parameterNames] of methods) {
    lines.push(
      "",
      `    def ${method}(${parameterNames.join(", ")}):`,
      '        raise NotImplementedError("Implement this method")',
    );
  }
  return lines.join("\n");
}

function validateMethodParameters(
  callable: string,
  parameterNames: readonly string[],
  expectedArity: number,
): void {
  const [receiver, ...arguments_] = parameterNames;
  if (receiver !== "self") {
    throw new Error(`${callable} must declare self as its first canonical parameter`);
  }
  validateParameters(callable, arguments_, expectedArity);
}

function validateParameters(
  callable: string,
  parameterNames: readonly string[],
  expectedArity: number,
): void {
  if (parameterNames.length !== expectedArity) {
    throw new Error(
      `${callable} canonical arity ${parameterNames.length} does not match execution arity ${expectedArity}`,
    );
  }
  const generic = parameterNames.find((parameter) => GENERIC_PARAMETER.test(parameter));
  if (generic) {
    throw new Error(`${callable} uses forbidden generic parameter ${generic}`);
  }
}

function classBody(referenceCode: string, className: string): string {
  const lines = referenceCode.split("\n");
  const declaration = new RegExp(
    `^([ \\t]*)class\\s+${escapeRegExp(className)}(?:\\s*\\([^\\n]*\\))?\\s*:\\s*(?:#.*)?$`,
  );
  const classLine = lines.findIndex((line) => declaration.test(line));
  if (classLine === -1) {
    throw new Error(`Canonical source is missing class ${className}`);
  }

  const indentation = lines[classLine]?.match(/^[ \t]*/)?.[0].length ?? 0;
  let endLine = lines.length;
  for (let index = classLine + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (line.trim().length === 0) continue;
    const lineIndentation = line.match(/^[ \t]*/)?.[0].length ?? 0;
    if (lineIndentation <= indentation) {
      endLine = index;
      break;
    }
  }
  return lines.slice(classLine + 1, endLine).join("\n");
}

function callableParameterNames(
  source: string,
  callableName: string,
  allowIndentation: boolean,
): readonly string[] {
  const indentation = allowIndentation ? "[ \\t]+" : "";
  const declaration = new RegExp(
    `(?:^|\\n)${indentation}def\\s+${escapeRegExp(callableName)}\\s*\\(`,
  );
  const match = declaration.exec(source);
  if (!match) {
    throw new Error(`Canonical source is missing callable ${callableName}`);
  }

  const openParenthesis = match.index + match[0].lastIndexOf("(");
  const parameterText = balancedParenthesisContent(source, openParenthesis, callableName);
  return splitTopLevel(parameterText)
    .map((parameter) => parameter.trim().match(/^\*{0,2}([A-Za-z_]\w*)/)?.[1])
    .filter((parameter): parameter is string => parameter !== undefined);
}

function balancedParenthesisContent(
  source: string,
  openParenthesis: number,
  callableName: string,
): string {
  let depth = 0;
  let quote: "'" | '"' | undefined;
  let escaped = false;

  for (let index = openParenthesis; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = undefined;
      }
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
    } else if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth === 0) return source.slice(openParenthesis + 1, index);
    }
  }

  throw new Error(`Canonical callable ${callableName} has an unterminated parameter list`);
}

function splitTopLevel(value: string): readonly string[] {
  const parts: string[] = [];
  let start = 0;
  let roundDepth = 0;
  let squareDepth = 0;
  let braceDepth = 0;
  let quote: "'" | '"' | undefined;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = undefined;
      }
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
    } else if (character === "(") {
      roundDepth += 1;
    } else if (character === ")") {
      roundDepth -= 1;
    } else if (character === "[") {
      squareDepth += 1;
    } else if (character === "]") {
      squareDepth -= 1;
    } else if (character === "{") {
      braceDepth += 1;
    } else if (character === "}") {
      braceDepth -= 1;
    } else if (character === "," && roundDepth === 0 && squareDepth === 0 && braceDepth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
