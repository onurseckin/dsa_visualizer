import {
  lazy,
  Suspense,
  useMemo,
  type ComponentType,
  type KeyboardEvent,
  type LazyExoticComponent,
} from "react";

export interface PythonEditorControlProps {
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly onRun: () => void;
  readonly value: string;
}

export interface PythonEditorProps extends PythonEditorControlProps {
  readonly loadEditor?: () => Promise<{
    readonly default: ComponentType<PythonEditorControlProps>;
  }>;
}

const loadCodeMirrorEditor = () => import("./CodeMirrorPythonEditor");
const LazyCodeMirrorPythonEditor = lazy(loadCodeMirrorEditor);

export function PythonEditor({
  label,
  loadEditor,
  onChange,
  onRun,
  value,
}: PythonEditorProps): React.ReactElement {
  const LoadedEditor = useMemo<LazyExoticComponent<ComponentType<PythonEditorControlProps>>>(
    () => (loadEditor ? lazy(loadEditor) : LazyCodeMirrorPythonEditor),
    [loadEditor],
  );

  const controlProps = { label, onChange, onRun, value };
  return (
    <Suspense fallback={<TextareaEditor {...controlProps} />}>
      <LoadedEditor {...controlProps} />
    </Suspense>
  );
}

function TextareaEditor({
  label,
  onChange,
  onRun,
  value,
}: PythonEditorControlProps): React.ReactElement {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      onRun();
    }
  };

  return (
    <textarea
      aria-label={label}
      className="code-workspace__textarea"
      spellCheck={false}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}
