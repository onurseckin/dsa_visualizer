import { createFileRoute } from "@tanstack/react-router";
import { TopicId } from "../types/dsa";
import { ProblemList } from "../ui";
import { isTopicId } from "../app/topics";
import { useSettings } from "../app/SettingsContext";

interface ProblemsSearch {
  topic?: TopicId;
}

export const Route = createFileRoute("/problems")({
  // Plain typed validator: unknown/invalid topics collapse to "no filter"
  // instead of erroring so shared/mistyped URLs still load the full list.
  validateSearch: (
    search: Record<string, string | number | boolean | undefined | null | object>,
  ): ProblemsSearch => {
    const topic = typeof search.topic === "string" ? search.topic : undefined;
    return topic && isTopicId(topic) ? { topic } : {};
  },
  component: ProblemsPage,
});

function ProblemsPage(): React.ReactElement {
  const { topic } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { setLastItemId } = useSettings();

  return (
    <ProblemList
      topic={topic ?? "All"}
      onTopicChange={(next) => {
        // Push (not replace) so each filter change is a distinct history entry.
        navigate({ search: next === "All" ? {} : { topic: next } });
      }}
      onSelectAlgorithm={(algorithmId) => {
        setLastItemId(algorithmId);
        navigate({ to: "/workspace/$algorithmId", params: { algorithmId } });
      }}
    />
  );
}
