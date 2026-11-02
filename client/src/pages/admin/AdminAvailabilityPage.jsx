import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { formatDate, todayISO } from '../../lib/format';
import DayEditor from '../../components/admin/DayEditor';
import ErrorState from '../../components/ErrorState';
import Alert from '../../components/ui/Alert';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';

// Admin: see which days are open and set the bookable times for any day.
export default function AdminAvailabilityPage() {
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');

  const overview = useApi('/availability'); // next 30 days
  // Only fetch a single day once a date is picked (path null = don't fetch)
  const selected = useApi(date ? `/availability/${date}` : null);

  // 404 just means "no slots set for this day yet" — not an error for the admin
  const notSetYet = selected.error?.status === 404;
  const day = notSetYet ? null : selected.data?.day;

  const handleSaved = (text) => {
    setMessage(text);
    selected.reload();
    overview.reload();
  };

  const pickDate = (value) => {
    setDate(value);
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Availability</h1>
      <Alert variant="success">{message}</Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <Input label="Choose a day to edit" type="date" min={todayISO()} value={date} onChange={(e) => pickDate(e.target.value)} />
          </Card>

          {date &&
            (selected.loading ? (
              <PageSpinner label="Loading day…" />
            ) : selected.error && !notSetYet ? (
              <ErrorState error={selected.error} onRetry={selected.reload} />
            ) : (
              <DayEditor
                // New key when the saved slots change -> editor restarts from the saved data
                key={`${date}|${day?.slots.join(',')}|${day?.bookedSlots.join(',')}`}
                date={date}
                day={day}
                onSaved={handleSaved}
              />
            ))}
        </div>

        <Card className="h-fit">
          <h2 className="font-semibold">Open days (next 30)</h2>
          {overview.loading && !overview.data ? (
            <PageSpinner />
          ) : overview.error ? (
            <ErrorState error={overview.error} onRetry={overview.reload} />
          ) : overview.data.days.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No days open yet. Pick a date to add slots.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {overview.data.days.map((d) => (
                <li key={d.date}>
                  <button
                    type="button"
                    onClick={() => pickDate(d.date)}
                    className={`flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-gray-50 ${
                      d.date === date ? 'bg-indigo-50 text-indigo-700' : ''
                    }`}
                  >
                    <span>{formatDate(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span className="text-xs text-gray-500">
                      {d.bookedSlots.length}/{d.slots.length} booked
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
