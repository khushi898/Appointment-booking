import Alert from './ui/Alert';
import Button from './ui/Button';

// Shown when loading data failed, with a button to try again.
export default function ErrorState({ error, onRetry }) {
  return (
    <Alert className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
      <span>{error?.message || 'Something went wrong while loading.'}</span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Alert>
  );
}
