import { createFileRoute } from "@tanstack/react-router";
import { TopicId } from "../types/dsa";
import { ProblemList } from "../ui";
import { isTopicId } from "../app/topics";
import { useSettings } from "../app/SettingsContext";

interface ProblemsSearch {
  topic?: TopicId;
  tag?: string;
}

export const Route = createFileRoute("/problems")({
  // Plain typed validator: unknown/invalid topics or tags collapse gracefully
  // instead of erroring so shared/mistyped URLs still load the full list.
  validateSearch: (
    search: Record<string, string | number | boolean | undefined | null | object>,
  ): ProblemsSearch => {
    const topic = typeof search.topic === "string" ? search.topic : undefined;
    const tag = typeof search.tag === "string" ? search.tag : undefined;
    const result: ProblemsSearch = {};
    if (topic && isTopicId(topic)) result.topic = topic;
    if (tag && tag.trim()) result.tag = tag.trim();
    return result;
  },
  component: ProblemsPage,
});

function ProblemsPage(): React.ReactElement {
  const { topic, tag } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { setLastItemId } = useSettings();

  return (
    <ProblemList
      topic={topic ?? "All"}
      onTopicChange={(nextTopic) => {
        // Push (not replace) so each filter change is a distinct history entry.
        navigate({
          search: (prev) => ({
            ...prev,
            topic: nextTopic === "All" ? undefined : nextTopic,
          }),
        });
      }}
      tag={tag ?? "All"}
      onTagChange={(nextTag) => {
        navigate({
          search: (prev) => ({
            ...prev,
            tag: nextTag === "All" ? undefined : nextTag,
          }),
        });
      }}
      onSelectAlgorithm={(algorithmId) => {
        setLastItemId(algorithmId);
        navigate({ to: "/workspace/$algorithmId", params: { algorithmId } });
      }}
    />
  );
}
