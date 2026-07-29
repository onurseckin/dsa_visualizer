import type {
  PythonExecutionSpec,
  PythonRunRequest,
  PythonRunResult,
} from "@dsa-visualizer/execution-contracts";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DraftStorage } from "../../../../playground/draftStorage";
import type { PythonRunner } from "../../../../playground/types";
import { CodeWorkspace } from "../CodeWorkspace";

vi.mock("../PythonEditor", () => ({
  PythonEditor: ({
    label,
    onChange,
    onRun,
    value,
  }: {
    label: string;
    onChange: (value: string) => void;
    onRun: () => void;
    value: string;
  }) => (
    <textarea
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") onRun();
      }}
    />
  ),
}));

const SPEC: PythonExecutionSpec = {
  runtime: "browser",
  entrypoint: "solve",
  invocation: { kind: "function", arguments: [{ from: "input", path: [] }] },
  packages: [],
  cases: [
    {
      id: "public",
      label: "Public example",
      input: [1, 2],
      expected: 3,
      comparison: "deep-equal",
    },
    {
      id: "edge",
      label: "Empty input",
      input: [],
      expected: 0,
      comparison: "deep-equal",
    },
  ],
};

function result(
  request: PythonRunRequest,
  overrides: Partial<PythonRunResult> = {},
): PythonRunResult {
  const selected = request.caseIds ?? request.spec.cases.map((testCase) => testCase.id);
  return {
    runId: request.runId,
    status: "passed",
    stdout: "answer\\n",
    stderr: "",
    durationMs: 4,
    runtime: "browser",
    cases: selected.map((id) => ({
      id,
      status: "passed",
      stdout: id === selected[0] ? "answer\\n" : "",
      stderr: "",
      durationMs: 2,
      actual: id === "public" ? 3 : 0,
    })),
    ...overrides,
  };
}

function createRunner(
  run: PythonRunner["run"] = vi.fn(async (request) => result(request)),
): PythonRunner {
  return {
    run,
    cancel: vi.fn(async () => {}),
    dispose: vi.fn(),
  };
}

function createDrafts(initial = new Map<string, string>()): DraftStorage {
  return {
    load: vi.fn((itemId, fallback) => initial.get(itemId) ?? fallback),
    scheduleSave: vi.fn((itemId, code) => {
      initial.set(itemId, code);
    }),
    flush: vi.fn(),
    reset: vi.fn((itemId) => {
      initial.delete(itemId);
    }),
    dispose: vi.fn(),
  };
}

const baseProps = {
  itemId: "binary-search",
  itemTitle: "Binary Search",
  referenceCode: "def solve(values):\n    return sum(values)",
  starterCode: "def solve(values):\n    # Your code here\n    pass",
  activeLine: 2,
  lineExplanations: { 2: "Return the computed answer." },
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CodeWorkspace", () => {
  it("starts on immutable Reference and preserves active-line explanations", () => {
    render(<CodeWorkspace {...baseProps} draftStorage={createDrafts()} />);

    expect(screen.getByRole("heading", { name: "Code workspace" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Reference" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("code-viewer")).toHaveTextContent("return sum");
    expect(screen.queryByRole("textbox", { name: "Python playground editor" })).toBeNull();

    const referenceTab = screen.getByRole("tab", { name: "Reference" });
    expect(referenceTab).toHaveAttribute("id", "code-workspace-binary-search-reference-tab");
    expect(referenceTab).toHaveAttribute(
      "aria-controls",
      "code-workspace-binary-search-reference-panel",
    );
    expect(referenceTab).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "aria-labelledby",
      "code-workspace-binary-search-reference-tab",
    );
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "id",
      "code-workspace-binary-search-reference-panel",
    );
    expect(screen.getByRole("tab", { name: "Playground" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("tab", { name: "Output" })).toHaveAttribute("tabindex", "-1");
  });

  it("provides roving tab focus with ArrowLeft/Right and Home/End", () => {
    render(<CodeWorkspace {...baseProps} draftStorage={createDrafts()} />);
    const reference = screen.getByRole("tab", { name: "Reference" });

    reference.focus();
    fireEvent.keyDown(reference, { key: "ArrowRight" });
    const playground = screen.getByRole("tab", { name: "Playground" });
    expect(playground).toHaveFocus();
    expect(playground).toHaveAttribute("aria-selected", "true");
    expect(playground).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "aria-labelledby",
      "code-workspace-binary-search-playground-tab",
    );

    fireEvent.keyDown(playground, { key: "End" });
    const output = screen.getByRole("tab", { name: "Output" });
    expect(output).toHaveFocus();
    expect(output).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(output, { key: "Home" });
    expect(reference).toHaveFocus();
    fireEvent.keyDown(reference, { key: "ArrowLeft" });
    expect(output).toHaveFocus();
  });

  it("opens an editable scaffold and supports Blank, Copy reference, and Reset", () => {
    const drafts = createDrafts();
    render(<CodeWorkspace {...baseProps} draftStorage={drafts} />);

    fireEvent.click(screen.getByRole("tab", { name: "Playground" }));
    const editor = screen.getByRole("textbox", { name: "Python playground editor" });
    expect(editor).toHaveValue(baseProps.starterCode);

    fireEvent.click(screen.getByRole("button", { name: "Start blank" }));
    expect(editor).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Copy reference" }));
    expect(editor).toHaveValue(baseProps.referenceCode);
    fireEvent.change(editor, { target: { value: "# custom" } });
    expect(drafts.scheduleSave).toHaveBeenLastCalledWith("binary-search", "# custom");
    fireEvent.click(screen.getByRole("button", { name: "Reset draft" }));
    expect(drafts.reset).toHaveBeenCalledWith("binary-search");
    expect(editor).toHaveValue(baseProps.starterCode);
  });

  it("does not fabricate grading when an item has no execution spec", () => {
    const runnerFactory = vi.fn(async () => createRunner());
    render(
      <CodeWorkspace {...baseProps} draftStorage={createDrafts()} runnerFactory={runnerFactory} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Playground" }));
    fireEvent.click(screen.getByRole("button", { name: "Run Python" }));

    expect(screen.getByRole("tab", { name: "Output" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByText(/tests are not available yet/i)).toHaveLength(2);
    expect(runnerFactory).not.toHaveBeenCalled();
  });

  it("selects authored cases, loads the runner only on Run, and renders output", async () => {
    const runner = createRunner();
    const runnerFactory = vi.fn(async () => runner);
    render(
      <CodeWorkspace
        {...baseProps}
        executionSpec={SPEC}
        draftStorage={createDrafts()}
        runnerFactory={runnerFactory}
      />,
    );
    expect(runnerFactory).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("tab", { name: "Playground" }));
    expect(screen.getByText("Browser runtime")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Empty input" }));
    fireEvent.click(screen.getByRole("button", { name: "Run Python" }));

    await screen.findByText("All selected tests passed.");
    expect(runnerFactory).toHaveBeenCalledOnce();
    expect(runner.run).toHaveBeenCalledWith(
      expect.objectContaining({
        code: baseProps.starterCode,
        spec: SPEC,
        caseIds: ["public"],
      }),
      expect.objectContaining({ runtime: "auto", signal: expect.any(AbortSignal) }),
    );
    expect(screen.getByText("answer\\n")).toBeInTheDocument();
    expect(screen.getByText("Public example")).toBeInTheDocument();
    expect(screen.queryByText("Empty input")).toBeNull();
  });

  it.each([
    ["failed", "Some selected tests failed."],
    ["error", "Execution failed."],
    ["timeout", "Execution timed out."],
  ] as const)("announces %s results through the live status", async (status, announcement) => {
    const runner = createRunner(
      vi.fn(async (request) =>
        result(request, {
          status,
          stderr: "details",
          cases: [
            {
              id: "public",
              status,
              stdout: "",
              stderr: "details",
              durationMs: 2,
              ...(status === "failed" ? { actual: 4 } : {}),
            },
            {
              id: "edge",
              status,
              stdout: "",
              stderr: "",
              durationMs: 2,
              ...(status === "failed" ? { actual: 1 } : {}),
            },
          ],
        }),
      ),
    );
    render(
      <CodeWorkspace
        {...baseProps}
        executionSpec={SPEC}
        draftStorage={createDrafts()}
        runnerFactory={async () => runner}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Playground" }));
    fireEvent.click(screen.getByRole("button", { name: "Run Python" }));

    expect(await screen.findByRole("status")).toHaveTextContent(announcement);
    expect(screen.getByText("details")).toBeInTheDocument();
  });

  it("runs on Ctrl/Cmd+Enter only from the editor and exposes Stop while running", async () => {
    let resolveRun: ((value: PythonRunResult) => void) | undefined;
    const runner = createRunner(
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveRun = (value) => resolve(value);
          }),
      ),
    );
    render(
      <CodeWorkspace
        {...baseProps}
        executionSpec={SPEC}
        draftStorage={createDrafts()}
        runnerFactory={async () => runner}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Playground" }));
    const editor = screen.getByRole("textbox", { name: "Python playground editor" });

    fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true });
    expect(await screen.findByRole("button", { name: "Stop Python" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stop Python" }));
    expect(runner.cancel).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent("Run cancelled.");

    await act(async () => {
      resolveRun?.(result((runner.run as ReturnType<typeof vi.fn>).mock.calls[0][0]));
    });
    expect(screen.getByRole("status")).toHaveTextContent("Run cancelled.");
  });

  it("cancels an active run and suppresses stale output when the item changes", async () => {
    let resolveRun: ((value: PythonRunResult) => void) | undefined;
    let request: PythonRunRequest | undefined;
    const runner = createRunner(
      vi.fn(
        (nextRequest) =>
          new Promise((resolve) => {
            request = nextRequest;
            resolveRun = resolve;
          }),
      ),
    );
    const drafts = createDrafts(new Map([["merge-sort", "# merge draft"]]));
    const { rerender } = render(
      <CodeWorkspace
        {...baseProps}
        executionSpec={SPEC}
        draftStorage={drafts}
        runnerFactory={async () => runner}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Playground" }));
    fireEvent.click(screen.getByRole("button", { name: "Run Python" }));
    await screen.findByRole("button", { name: "Stop Python" });

    rerender(
      <CodeWorkspace
        {...baseProps}
        itemId="merge-sort"
        itemTitle="Merge Sort"
        executionSpec={SPEC}
        draftStorage={drafts}
        runnerFactory={async () => runner}
      />,
    );
    expect(runner.cancel).toHaveBeenCalledOnce();
    expect(drafts.flush).toHaveBeenCalledWith("binary-search");
    fireEvent.click(screen.getByRole("tab", { name: "Playground" }));
    expect(screen.getByRole("textbox", { name: "Python playground editor" })).toHaveValue(
      "# merge draft",
    );

    await act(async () => {
      if (request) resolveRun?.(result(request));
    });
    expect(screen.queryByText("answer\\n")).toBeNull();
  });

  it("cancels and disposes without leaking a run on unmount", async () => {
    const runner = createRunner(vi.fn(() => new Promise(() => {})));
    const drafts = createDrafts();
    const view = render(
      <CodeWorkspace
        {...baseProps}
        executionSpec={SPEC}
        draftStorage={drafts}
        runnerFactory={async () => runner}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Playground" }));
    fireEvent.click(screen.getByRole("button", { name: "Run Python" }));
    await screen.findByRole("button", { name: "Stop Python" });

    view.unmount();

    expect(runner.cancel).toHaveBeenCalledOnce();
    expect(runner.dispose).toHaveBeenCalledOnce();
    expect(drafts.flush).toHaveBeenCalledWith("binary-search");
  });

  it("keeps cancellation state updates live through React Strict Mode effect replay", async () => {
    const runner = createRunner(vi.fn(() => new Promise(() => {})));
    render(
      <StrictMode>
        <CodeWorkspace
          {...baseProps}
          executionSpec={SPEC}
          draftStorage={createDrafts()}
          runnerFactory={async () => runner}
        />
      </StrictMode>,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Playground" }));
    fireEvent.click(screen.getByRole("button", { name: "Run Python" }));
    fireEvent.click(await screen.findByRole("button", { name: "Stop Python" }));

    expect(screen.getByRole("button", { name: "Run Python" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Run cancelled.");
  });
});
