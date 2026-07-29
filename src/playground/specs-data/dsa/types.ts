import type {
  JsonValue,
  PythonExecutionSpec,
  PythonPackage,
} from "@dsa-visualizer/execution-contracts";

export interface DsaExecutionAuditSeed {
  readonly signature: string;
  readonly defaultInputShape: string;
  readonly argumentMapping: readonly string[];
  readonly mutation: string;
  readonly returnBehavior: string;
}

export interface DsaExecutionEntry {
  readonly id: string;
  readonly starterCode: string;
  readonly audit: DsaExecutionAuditSeed & {
    readonly symbol: string;
    readonly invocation: PythonExecutionSpec["invocation"]["kind"];
    readonly packages: readonly PythonPackage[];
  };
  readonly spec: PythonExecutionSpec;
}

export interface DsaExecutionAuditEntry extends DsaExecutionAuditSeed {
  readonly id: string;
  readonly symbol: string;
  readonly invocation: PythonExecutionSpec["invocation"]["kind"];
  readonly packages: readonly PythonPackage[];
  readonly topicIds: readonly string[];
  readonly defaultInput: unknown;
  readonly examples: readonly {
    readonly kind: string;
    readonly input: unknown;
    readonly output: unknown;
  }[];
}

export interface DsaCaseFixture {
  readonly label: string;
  readonly input: JsonValue;
  readonly expected: JsonValue;
  readonly comparison?: PythonExecutionSpec["cases"][number]["comparison"];
  readonly tolerance?: number;
}
