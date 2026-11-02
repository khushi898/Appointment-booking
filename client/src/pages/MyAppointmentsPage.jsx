import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { formatDate, formatDuration, formatPrice } from '../lib/format';
import ErrorState from '../components/ErrorState';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { PageSpinner } from '../components/ui/Spinner';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

export default function MyAppointmentsPage() {
  const location = useLocation();
  const [type, setType] = useState('upcoming');
  const [page, setPage] = useState(1);
  // Success message passed from the booking page, e.g. "Booked Haircut on ..."
  const [message, setMessage] = useState(location.state?.message || '');
  const [actionError, setActionError] = useState('');

  const { data, error, loading, reload } = useApi('/appointments/me', { type, page, limit: 10 });

  const changeTab = (value) => {
    setType(value);
    setPage(1);
  };

  async function cancelAppointment(id) {
    setMessage('');
    setActionError('');
    try {
      await api.patch(`/appointments/${id}/cancel`);
      setMessage('Appointment cancelled. The slot is now free for others.');
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">My Appointments</h1>
        <Link
          to="/"
          className="rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
        >
          Book another
        </Link>
      </div>

      <Alert variant="success">{message}</Alert>
      <Alert>{actionError}</Alert>

      <div className="flex gap-2 border-b border-gray-200" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={type === tab.value}
            onClick={() => changeTab(tab.value)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              type === tab.value
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageSpinner label="Loading appointments…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data.appointments.length === 0 ? (
        <Card className="text-center text-gray-600">
          {type === 'upcoming' ? 'You have no upcoming appointments.' : 'No past appointments yet.'}
        </Card>
      ) : (
        <>
          <ul className="space-y-3">
            {data.appointments.map((appointment) => (
              <AppointmentRow
                key={appointment._id}
                appointment={appointment}
                canCancel={type === 'upcoming' && appointment.status === 'booked'}
                onCancel={cancelAppointment}
              />
            ))}
          </ul>
          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

// One appointment. Cancelling needs a second click ("Yes, cancel") so it can't happen by accident.
function AppointmentRow({ appointment, canCancel, onCancel }) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { service } = appointment;

  async function confirmCancel() {
    setCancelling(true);
    await onCancel(appointment._id);
    setCancelling(false);
    setConfirming(false);
  }

  return (
    <li>
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{service?.name ?? 'Service removed'}</h3>
            <StatusBadge status={appointment.status} />
          </div>
          <p className="mt-1 text-sm text-gray-700">
            {formatDate(appointment.date)} at {appointment.time}
          </p>
          {service && (
            <p className="text-sm text-gray-500">
              {formatDuration(service.durationMinutes)} · {formatPrice(service.price)}
            </p>
          )}
          {appointment.notes && <p className="mt-1 text-sm text-gray-500">Notes: {appointment.notes}</p>}
        </div>

        {canCancel &&
          (confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Cancel this booking?</span>
              <Button variant="danger" size="sm" loading={cancelling} onClick={confirmCancel}>
                Yes, cancel
              </Button>
              <Button variant="outline" size="sm" disabled={cancelling} onClick={() => setConfirming(false)}>
                No
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
              Cancel
            </Button>
          ))}
      </Card>
    </li>
  );
}
