import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { api } from '../../lib/api';
import { formatDate, formatPrice } from '../../lib/format';
import ErrorState from '../../components/ErrorState';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { PageSpinner } from '../../components/ui/Spinner';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'booked', label: 'Booked' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no-show', label: 'No-show' },
];
const SORT_OPTIONS = [
  { value: '-date', label: 'Newest first' },
  { value: 'date', label: 'Oldest first' },
];

// Admin: every appointment, filtered/searched/paginated by the API.
export default function AdminAppointmentsPage() {
  const [filters, setFilters] = useState({ status: '', date: '', search: '', sort: '-date' });
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const debouncedSearch = useDebouncedValue(filters.search.trim());

  const { data, error, loading, reload } = useApi('/appointments', {
    page,
    limit: 10,
    status: filters.status,
    date: filters.date,
    search: debouncedSearch,
    sort: filters.sort,
  });

  // Any filter change goes back to page 1
  const setFilter = (name) => (event) => {
    setFilters({ ...filters, [name]: event.target.value });
    setPage(1);
  };

  async function markStatus(appointment, status) {
    setMessage('');
    setActionError('');
    try {
      await api.patch(`/appointments/${appointment._id}/status`, { status });
      setMessage(`Marked ${appointment.user?.name ?? 'appointment'} (${formatDate(appointment.date)} ${appointment.time}) as ${status}.`);
      reload();
    } catch (err) {
      // e.g. 400 "Cannot mark an upcoming appointment as completed"
      setActionError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Appointments</h1>

      <Card className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="Search" type="search" placeholder="Customer or service" value={filters.search} onChange={setFilter('search')} />
        <Select label="Status" options={STATUS_OPTIONS} value={filters.status} onChange={setFilter('status')} />
        <Input label="Date" type="date" value={filters.date} onChange={setFilter('date')} />
        <Select label="Sort" options={SORT_OPTIONS} value={filters.sort} onChange={setFilter('sort')} />
      </Card>

      <Alert variant="success">{message}</Alert>
      <Alert>{actionError}</Alert>

      {loading && !data ? (
        <PageSpinner label="Loading appointments…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data.appointments.length === 0 ? (
        <Card className="text-center text-gray-600">No appointments match these filters.</Card>
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.appointments.map((appointment) => (
                  <tr key={appointment._id}>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-medium">{formatDate(appointment.date)}</p>
                      <p className="text-gray-500">{appointment.time}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{appointment.user?.name ?? 'Deleted user'}</p>
                      <p className="text-xs text-gray-500">{appointment.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{appointment.service?.name ?? 'Deleted service'}</p>
                      {appointment.service && <p className="text-xs text-gray-500">{formatPrice(appointment.service.price)}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td className="px-4 py-3">
                      {/* Only booked appointments can be marked; the API also rejects future ones */}
                      {appointment.status === 'booked' && (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => markStatus(appointment, 'completed')}>
                            Completed
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => markStatus(appointment, 'no-show')}>
                            No-show
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
