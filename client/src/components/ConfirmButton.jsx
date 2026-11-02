import { useState } from 'react';
import Button from './ui/Button';

// A button that asks "Are you sure?" with Yes/No before running a dangerous action.
// onConfirm may return a promise; the Yes button shows a spinner until it finishes.
export default function ConfirmButton({ label, question = 'Are you sure?', confirmLabel = 'Yes', variant = 'outline', onConfirm }) {
  const [asking, setAsking] = useState(false);
  const [running, setRunning] = useState(false);

  async function handleYes() {
    setRunning(true);
    try {
      await onConfirm();
    } finally {
      setRunning(false);
      setAsking(false);
    }
  }

  if (!asking) {
    return (
      <Button variant={variant} size="sm" onClick={() => setAsking(true)}>
        {label}
      </Button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-700">{question}</span>
      <Button variant="danger" size="sm" loading={running} onClick={handleYes}>
        {confirmLabel}
      </Button>
      <Button variant="outline" size="sm" disabled={running} onClick={() => setAsking(false)}>
        No
      </Button>
    </span>
  );
}
