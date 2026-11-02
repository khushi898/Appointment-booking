import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { formatDate, formatDuration, formatPrice } from '../lib/format';
import ErrorState from '../components/ErrorState';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { PageSpinner } from '../components/ui/Spinner';

// Book a service: pick a day, pick a free slot, confirm.
export default function BookPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const serviceQuery = useApi(`/services/${serviceId}`);
  // Next 30 days that have slots, each with availableSlots worked out by the API
  const availabilityQuery = useApi('/availability');

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  if (serviceQuery.loading) return <PageSpinner label="Loading service…" />;
  if (serviceQuery.error) {
    return (
      <div className="space-y-4">
        <ErrorState error={serviceQuery.error} onRetry={serviceQuery.error.status === 404 ? null : serviceQuery.reload} />
        <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Back to services
        </Link>
      </div>
    );
  }

  const { service } = serviceQuery.data;
  const days = availabilityQuery.data?.days ?? [];
  const selectedDay = days.find((day) => day.date === selectedDate);

  const chooseDate = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
    setBookingError('');
  };

  async function handleBook() {
    setSubmitting(true);
    setBookingError('');
    try {
      await api.post('/appointments', { serviceId, date: selectedDate, time: selectedTime, notes });
      navigate('/appointments', {
        state: { message: `Booked ${service.name} on ${formatDate(selectedDate)} at ${selectedTime}.` },
      });
    } catch (err) {
      setBookingError(err.message);
      if (err.status === 409) {
        // Someone else just took this slot: clear it and fetch fresh availability
        setSelectedTime('');
        availabilityQuery.reload();
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
        ← Back to services
      </Link>

      <Card>
        <h1 className="text-2xl font-semibold">{service.name}</h1>
        {service.description && <p className="mt-1 text-gray-600">{service.description}</p>}
        <p className="mt-3 text-sm text-gray-700">
          {formatDuration(service.durationMinutes)} · <span className="font-semibold">{formatPrice(service.price)}</span>
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">1. Choose a day</h2>
        {availabilityQuery.loading ? (
          <PageSpinner label="Loading available days…" />
        ) : availabilityQuery.error ? (
          <ErrorState error={availabilityQuery.error} onRetry={availabilityQuery.reload} />
        ) : days.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No days are open for booking right now. Please check back later.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {days.map((day) => {
              const full = day.availableSlots.length === 0;
              const selected = day.date === selectedDate;
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={full}
                  onClick={() => chooseDate(day.date)}
                  aria-pressed={selected}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-white hover:border-indigo-400'
                  }`}
                >
                  <span className="block font-medium">{formatDate(day.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="block text-xs text-gray-500">
                    {full ? 'Full' : `${day.availableSlots.length} slot${day.availableSlots.length === 1 ? '' : 's'} free`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {selectedDay && (
        <Card>
          <h2 className="text-lg font-semibold">2. Choose a time on {formatDate(selectedDay.date)}</h2>
          {selectedDay.availableSlots.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">This day is now fully booked. Please choose another day.</p>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {selectedDay.availableSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  aria-pressed={time === selectedTime}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    time === selectedTime
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-300 bg-white hover:border-indigo-400'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      <Alert>{bookingError}</Alert>

      {selectedDay && selectedTime && (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">3. Confirm</h2>
          <p className="text-sm text-gray-700">
            {service.name} on <strong>{formatDate(selectedDay.date)}</strong> at <strong>{selectedTime}</strong>
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={300}
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <Button onClick={handleBook} loading={submitting} className="w-full sm:w-auto">
            {submitting ? 'Booking…' : 'Confirm booking'}
          </Button>
        </Card>
      )}
    </div>
  );
}
