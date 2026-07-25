import { createFileRoute } from '@tanstack/react-router';
import { CategoryType } from '../types/dsa';
import { ProblemList } from '../components/ProblemList';
import { isCategoryType } from '../app/categories';
import { useSettings } from '../app/SettingsContext';

interface ProblemsSearch {
  category?: CategoryType;
}

export const Route = createFileRoute('/problems')({
  // Plain typed validator: unknown/invalid categories collapse to "no filter"
  // instead of erroring so shared/mistyped URLs still load the full list.
  validateSearch: (search: Record<string, unknown>): ProblemsSearch => {
    return isCategoryType(search.category) ? { category: search.category } : {};
  },
  component: ProblemsPage,
});

function ProblemsPage() {
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { setLastAlgorithmId } = useSettings();

  return (
    <ProblemList
      category={category ?? 'All'}
      onCategoryChange={(next) => {
        // Push (not replace) so each filter change is a distinct history entry.
        navigate({ search: next === 'All' ? {} : { category: next } });
      }}
      onSelectAlgorithm={(algorithmId) => {
        setLastAlgorithmId(algorithmId);
        navigate({ to: '/workspace/$algorithmId', params: { algorithmId } });
      }}
    />
  );
}
