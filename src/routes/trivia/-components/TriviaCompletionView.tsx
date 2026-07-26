import { Home, SlidersHorizontal } from "lucide-react";
import { Button, ButtonGroup } from "../../../ui";
import { TriviaCompletionCard } from "../../../components/trivia/TriviaCompletionCard";

interface TriviaCompletionViewProps {
  sourcesSize: number;
  maxBlanks: number;
  onEditSettings: () => void;
  onBackToHome: () => void;
}

export function TriviaCompletionView({
  sourcesSize,
  maxBlanks,
  onEditSettings,
  onBackToHome,
}: TriviaCompletionViewProps): React.ReactElement {
  return (
    <>
      <TriviaCompletionCard sourcesCount={sourcesSize} maxBlanks={maxBlanks} />
      <ButtonGroup gap="sm">
        <Button
          size="sm"
          variant="secondary"
          icon={<SlidersHorizontal aria-hidden="true" />}
          onClick={onEditSettings}
        >
          Adjust settings to keep going
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<Home aria-hidden="true" />}
          onClick={onBackToHome}
        >
          Back to Trivia Home
        </Button>
      </ButtonGroup>
    </>
  );
}
