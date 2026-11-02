import Button from './ui/Button';

// "Previous  Page 2 of 5  Next". Hidden when everything fits on one page.
export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;

  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages} <span className="hidden sm:inline">({total} total)</span>
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}
