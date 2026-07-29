import type {
  PythonExecutionSpec,
  PythonExecutionStatus,
  PythonRunResult,
} from "@dsa-visualizer/execution-contracts";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { playgroundDraftStorage, type DraftStorage } from "../../../playground/draftStorage";
import { createHybridPythonRunner, selectPythonRuntime } from "../../../playground/runnerSelector";
import { executionErrorResult, type PythonRunner } from "../../../playground/types";
import type { DisplayValue } from "../../../types/dsa";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { CodeBlockViewer } from "../../molecules/CodeBlockViewer";
import { ExecutionOutput } from "./ExecutionOutput";
import { PythonEditor } from "./PythonEditor";
import { TestCaseList } from "./TestCaseList";

type CodeWorkspaceTab = "reference" | "playground" | "output";
const CODE_WORKSPACE_TABS = ["reference", "playground", "output"] as const;

export interface CodeWorkspaceProps {
  readonly activeLine?: number;
  readonly draftStorage?: DraftStorage;
  readonly executionSpec?: PythonExecutionSpec;
  readonly itemId: string;
  readonly itemTitle: string;
  readonly lineExplanations?: Record<number, string>;
  readonly referenceCode: string;
  readonly runnerFactory?: () => Promise<PythonRunner>;
  readonly starterCode?: string;
  readonly variables?: Record<string, DisplayValue>;
}

interface ActiveRun {
  readonly abortController: AbortController;
  readonly generation: number;
  readonly runId: string;
}

let runSequence = 0;

export function CodeWorkspace({
  activeLine = 1,
  draftStorage = playgroundDraftStorage,
  executionSpec,
  itemId,
  itemTitle,
  lineExplanations,
  referenceCode,
  runnerFactory = createDefaultPythonRunner,
  starterCode = defaultStarterCode(itemTitle),
  variables,
}: CodeWorkspaceProps): React.ReactElement {
  const [tab, setTab] = useState<CodeWorkspaceTab>("reference");
  const [draft, setDraft] = useState(() => draftStorage.load(itemId, starterCode));
  const [selectedCaseIds, setSelectedCaseIds] = useState<readonly string[]>(
    () => executionSpec?.cases.map((testCase) => testCase.id) ?? [],
  );
  const [result, setResult] = useState<PythonRunResult>();
  const [outputMessage, setOutputMessage] = useState<string>();
  const [statusMessage, setStatusMessage] = useState("Ready.");
  const [running, setRunning] = useState(false);

  const activeRunRef = useRef<ActiveRun | undefined>(undefined);
  const currentItemIdRef = useRef(itemId);
  const generationRef = useRef(0);
  const mountedRef = useRef(true);
  const runnerRef = useRef<PythonRunner | undefined>(undefined);
  const runnerFactoryRef = useRef(runnerFactory);
  const draftStorageRef = useRef(draftStorage);
  const tabRefs = useRef<Record<CodeWorkspaceTab, HTMLButtonElement | null>>({
    reference: null,
    playground: null,
    output: null,
  });

  runnerFactoryRef.current = runnerFactory;
  draftStorageRef.current = draftStorage;

  const cancelActiveRun = useCallback((announcement: string) => {
    generationRef.current += 1;
    const active = activeRunRef.current;
    activeRunRef.current = undefined;
    if (!active) return;
    active.abortController.abort();
    void runnerRef.current?.cancel(active.runId);
    if (mountedRef.current) {
      setRunning(false);
      setStatusMessage(announcement);
    }
  }, []);

  useEffect(() => {
    if (currentItemIdRef.current === itemId) return;
    const previousItemId = currentItemIdRef.current;
    cancelActiveRun("Run cancelled because the selected item changed.");
    draftStorageRef.current.flush(previousItemId);
    currentItemIdRef.current = itemId;
    setDraft(draftStorage.load(itemId, starterCode));
    setSelectedCaseIds(executionSpec?.cases.map((testCase) => testCase.id) ?? []);
    setResult(undefined);
    setOutputMessage(undefined);
    setStatusMessage("Ready.");
    setTab("reference");
  }, [cancelActiveRun, draftStorage, executionSpec, itemId, starterCode]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const active = activeRunRef.current;
      if (active) {
        active.abortController.abort();
        void runnerRef.current?.cancel(active.runId);
      }
      activeRunRef.current = undefined;
      draftStorageRef.current.flush(currentItemIdRef.current);
      runnerRef.current?.dispose();
      runnerRef.current = undefined;
    };
  }, []);

  const caseLabels = useMemo(
    () => new Map(executionSpec?.cases.map((testCase) => [testCase.id, testCase.label])),
    [executionSpec],
  );

  const updateDraft = (nextCode: string) => {
    setDraft(nextCode);
    draftStorage.scheduleSave(itemId, nextCode);
  };

  const resetDraft = () => {
    cancelActiveRun("Run cancelled because the draft was reset.");
    draftStorage.reset(itemId);
    setDraft(starterCode);
    setResult(undefined);
    setOutputMessage(undefined);
    setStatusMessage("Draft reset to the starter scaffold.");
  };

  const runCode = async () => {
    if (running) return;
    setTab("output");
    setResult(undefined);

    if (!executionSpec) {
      const message =
        "Tests are not available yet. You can edit and save your scratchpad, but grading is not available for this item.";
      setOutputMessage(message);
      setStatusMessage(message);
      return;
    }
    if (selectedCaseIds.length === 0) {
      const message = "Select at least one authored test case before running.";
      setOutputMessage(message);
      setStatusMessage(message);
      return;
    }

    const generation = ++generationRef.current;
    const runId = createRunId(itemId);
    const abortController = new AbortController();
    activeRunRef.current = { abortController, generation, runId };
    setOutputMessage("Running selected tests…");
    setStatusMessage("Running selected tests.");
    setRunning(true);

    try {
      const runner = runnerRef.current ?? (await runnerFactoryRef.current());
      if (!isCurrentRun(activeRunRef.current, generation, runId)) {
        runner.dispose();
        return;
      }
      runnerRef.current = runner;
      const nextResult = await runner.run(
        {
          runId,
          code: draft,
          spec: executionSpec,
          caseIds: selectedCaseIds,
        },
        { runtime: "auto", signal: abortController.signal },
      );
      if (!isCurrentRun(activeRunRef.current, generation, runId)) return;
      activeRunRef.current = undefined;
      setResult(nextResult);
      setOutputMessage(undefined);
      setRunning(false);
      setStatusMessage(announcementFor(nextResult.status));
    } catch {
      if (!isCurrentRun(activeRunRef.current, generation, runId)) return;
      activeRunRef.current = undefined;
      const errorResult = executionErrorResult(
        runId,
        selectPythonRuntime(executionSpec),
        "Python runtime could not start.",
      );
      setResult(errorResult);
      setOutputMessage(undefined);
      setRunning(false);
      setStatusMessage(announcementFor("error"));
    }
  };

  const runtime = executionSpec ? selectPythonRuntime(executionSpec) : undefined;

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentTab: CodeWorkspaceTab,
  ) => {
    const currentIndex = CODE_WORKSPACE_TABS.indexOf(currentTab);
    let nextTab: CodeWorkspaceTab | undefined;
    switch (event.key) {
      case "ArrowRight":
        nextTab = CODE_WORKSPACE_TABS[(currentIndex + 1) % CODE_WORKSPACE_TABS.length];
        break;
      case "ArrowLeft":
        nextTab =
          CODE_WORKSPACE_TABS[
            (currentIndex - 1 + CODE_WORKSPACE_TABS.length) % CODE_WORKSPACE_TABS.length
          ];
        break;
      case "Home":
        nextTab = CODE_WORKSPACE_TABS[0];
        break;
      case "End":
        nextTab = CODE_WORKSPACE_TABS.at(-1);
        break;
      default:
        return;
    }
    if (nextTab === undefined) return;
    event.preventDefault();
    setTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  return (
    <section className="code-workspace" aria-label={`${itemTitle} code workspace`}>
      <div className="code-workspace__header">
        <div className="code-workspace__title-row">
          <h3>Code workspace</h3>
          <Badge size="sm" variant={runtime ? "info" : "neutral"}>
            {runtime === "browser"
              ? "Browser runtime"
              : runtime === "server"
                ? "Docker runtime"
                : "Scratchpad only"}
          </Badge>
        </div>
        <div
          role="tablist"
          aria-label="Code workspace views"
          aria-orientation="horizontal"
          className="code-workspace__tabs"
        >
          {CODE_WORKSPACE_TABS.map((nextTab) => (
            <button
              key={nextTab}
              ref={(element) => {
                tabRefs.current[nextTab] = element;
              }}
              id={codeWorkspaceTabId(itemId, nextTab)}
              type="button"
              role="tab"
              aria-controls={codeWorkspacePanelId(itemId, nextTab)}
              aria-selected={tab === nextTab}
              tabIndex={tab === nextTab ? 0 : -1}
              className="code-workspace__tab"
              onClick={() => setTab(nextTab)}
              onKeyDown={(event) => handleTabKeyDown(event, nextTab)}
            >
              {capitalize(nextTab)}
            </button>
          ))}
        </div>
        <div className="code-workspace__run-actions">
          {running ? (
            <Button
              size="sm"
              variant="danger"
              aria-label="Stop Python"
              onClick={() => cancelActiveRun("Run cancelled.")}
            >
              Stop
            </Button>
          ) : (
            <Button size="sm" variant="primary" aria-label="Run Python" onClick={runCode}>
              Run
            </Button>
          )}
        </div>
      </div>

      <div
        id={codeWorkspacePanelId(itemId, "reference")}
        role="tabpanel"
        aria-labelledby={codeWorkspaceTabId(itemId, "reference")}
        hidden={tab !== "reference"}
        tabIndex={0}
        className="code-workspace__body"
      >
        {tab === "reference" && (
          <CodeBlockViewer
            code={referenceCode}
            activeLine={activeLine}
            variables={variables}
            lineExplanations={lineExplanations}
          />
        )}
      </div>

      <div
        id={codeWorkspacePanelId(itemId, "playground")}
        role="tabpanel"
        aria-labelledby={codeWorkspaceTabId(itemId, "playground")}
        hidden={tab !== "playground"}
        className="code-workspace__body"
      >
        {tab === "playground" && (
          <div className="code-workspace__playground">
            <div className="code-workspace__draft-actions">
              <Button size="sm" variant="secondary" onClick={() => updateDraft("")}>
                Start blank
              </Button>
              <Button size="sm" variant="secondary" onClick={() => updateDraft(referenceCode)}>
                Copy reference
              </Button>
              <Button size="sm" variant="ghost" onClick={resetDraft}>
                Reset draft
              </Button>
              <span className="code-workspace__shortcut">Ctrl/Cmd + Enter to run</span>
            </div>
            <div className="code-workspace__editor-well">
              <PythonEditor
                label="Python playground editor"
                value={draft}
                onChange={updateDraft}
                onRun={() => void runCode()}
              />
            </div>
            {executionSpec?.outputContract && (
              <aside
                className="code-workspace__output-contract"
                role="note"
                aria-labelledby={outputContractHeadingId(itemId)}
              >
                <h4 id={outputContractHeadingId(itemId)}>Output contract</h4>
                <p>{executionSpec.outputContract}</p>
              </aside>
            )}
            <TestCaseList
              cases={executionSpec?.cases}
              selectedIds={selectedCaseIds}
              onSelectionChange={setSelectedCaseIds}
            />
          </div>
        )}
      </div>

      <div
        id={codeWorkspacePanelId(itemId, "output")}
        role="tabpanel"
        aria-labelledby={codeWorkspaceTabId(itemId, "output")}
        hidden={tab !== "output"}
        tabIndex={0}
        className="code-workspace__body"
      >
        {tab === "output" && (
          <ExecutionOutput caseLabels={caseLabels} message={outputMessage} result={result} />
        )}
      </div>

      <p className="code-workspace__live-status" role="status" aria-live="polite">
        {statusMessage}
      </p>
    </section>
  );
}

export function defaultStarterCode(itemTitle: string): string {
  return `# ${itemTitle}\n# Write your Python solution here.\n`;
}

async function createDefaultPythonRunner(): Promise<PythonRunner> {
  const [{ createPyodideRunnerClient }, { createServerPythonRunnerClient }] = await Promise.all([
    import("../../../playground/pyodideRunnerClient"),
    import("../../../playground/serverRunnerClient"),
  ]);
  return createHybridPythonRunner({
    browser: createPyodideRunnerClient(),
    server: createServerPythonRunnerClient(),
  });
}

function isCurrentRun(active: ActiveRun | undefined, generation: number, runId: string): boolean {
  return active?.generation === generation && active.runId === runId;
}

function createRunId(itemId: string): string {
  runSequence += 1;
  return `playground-${itemId}-${Date.now().toString(36)}-${runSequence.toString(36)}`;
}

function announcementFor(status: PythonExecutionStatus): string {
  switch (status) {
    case "passed":
      return "All selected tests passed.";
    case "failed":
      return "Some selected tests failed.";
    case "timeout":
      return "Execution timed out.";
    case "error":
      return "Execution failed.";
  }
}

function capitalize(value: CodeWorkspaceTab): string {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function codeWorkspaceTabId(itemId: string, tab: CodeWorkspaceTab): string {
  return `code-workspace-${itemId}-${tab}-tab`;
}

function codeWorkspacePanelId(itemId: string, tab: CodeWorkspaceTab): string {
  return `code-workspace-${itemId}-${tab}-panel`;
}

function outputContractHeadingId(itemId: string): string {
  return `code-workspace-${itemId}-output-contract`;
}
