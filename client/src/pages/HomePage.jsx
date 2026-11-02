import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import ErrorState from '../components/ErrorState';
import Pagination from '../components/Pagination';
import ServiceCard from '../components/ServiceCard';
import Card from '../components/ui/Card';
import { PageSpinner } from '../components/ui/Spinner';

const PAGE_SIZE = 9;
const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'price', label: 'Price (low to high)' },
  { value: '-price', label: 'Price (high to low)' },
  { value: 'durationMinutes', label: 'Duration (shortest)' },
];

// Public page: browse services with search, sort and pagination (all done by the API).
export default function HomePage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data, error, loading, reload } = useApi('/services', {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    sort,
  });

  // Changing the search or sort starts again from page 1
  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };
  const handleSort = (event) => {
    setSort(event.target.value);
    setPage(1);
  };

  return (
    <div>
      <section className="pb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Book your appointment in seconds</h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          Pick a service, choose a free time slot and you&apos;re done. No phone calls, no double bookings.
        </p>
      </section>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Search services</span>
          <input
            type="search"
            value={search}
            onChange={handleSearch}
            placeholder="Search services…"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
        <label>
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={handleSort}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:w-auto"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <PageSpinner label="Loading services…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data.services.length === 0 ? (
        <Card className="text-center text-gray-600">
          {debouncedSearch ? `No services match "${debouncedSearch}".` : 'No services are available yet.'}
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.services.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
