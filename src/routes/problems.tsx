import { createFileRoute } from "@tanstack/react-router";
import { CategoryType } from "../types/dsa";
import { ProblemList } from "../ui";
import { isCategoryType } from "../app/categories";
import { useSettings } from "../app/SettingsContext";

interface ProblemsSearch {
  category?: CategoryType;
}

export const Route = createFileRoute("/problems")({
  // Plain typed validator: unknown/invalid categories collapse to "no filter"
  // instead of erroring so shared/mistyped URLs still load the full list.
  validateSearch: (
    search: Record<string, string | number | boolean | undefined | null | object>,
  ): ProblemsSearch => {
    const cat = typeof search.category === "string" ? search.category : undefined;
    return cat && isCategoryType(cat) ? { category: cat } : {};
  },
  component: ProblemsPage,
});

function ProblemsPage(): React.ReactElement {
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { setLastAlgorithmId } = useSettings();

  return (
    <ProblemList
      category={category ?? "All"}
      onCategoryChange={(next) => {
        // Push (not replace) so each filter change is a distinct history entry.
        navigate({ search: next === "All" ? {} : { category: next } });
      }}
      onSelectAlgorithm={(algorithmId) => {
        setLastAlgorithmId(algorithmId);
        navigate({ to: "/workspace/$algorithmId", params: { algorithmId } });
      }}
    />
  );
}
