import { Link } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { formatPrice, todayISO } from '../../lib/format';
import ErrorState from '../../components/ErrorState';
import StatusBadge from '../../components/StatusBadge';
import Card from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';

function StatCard({ label, value, hint }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </Card>
  );
}

// Admin home: numbers from the stats aggregation + today's appointments.
export default function AdminDashboardPage() {
  const stats = useApi('/appointments/stats');
  const today = useApi('/appointments', { date: todayISO(), sort: 'date', limit: 20 });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      {stats.loading ? (
        <PageSpinner label="Loading stats…" />
      ) : stats.error ? (
        <ErrorState error={stats.error} onRetry={stats.reload} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Booked today" value={stats.data.todayBooked} />
            <StatCard label="Upcoming bookings" value={stats.data.upcomingBooked} />
            <StatCard label="Total appointments" value={stats.data.total} />
            <StatCard label="Completed revenue" value={formatPrice(stats.data.completedRevenue)} hint="At current service prices" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(stats.data.byStatus).map(([status, count]) => (
              <Card key={status} className="flex items-center justify-between p-4">
                <StatusBadge status={status} />
                <span className="text-lg font-semibold">{count}</span>
              </Card>
            ))}
          </div>
        </>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Today&apos;s appointments</h2>
          <Link to="/admin/appointments" className="text-sm font-medium text-indigo-600 hover:underline">
            View all →
          </Link>
        </div>
        {today.loading ? (
          <PageSpinner />
        ) : today.error ? (
          <ErrorState error={today.error} onRetry={today.reload} />
        ) : today.data.appointments.length === 0 ? (
          <Card className="text-center text-gray-600">No appointments today.</Card>
        ) : (
          <Card className="divide-y divide-gray-100 p-0">
            {today.data.appointments.map((appointment) => (
              <div key={appointment._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div>
                  <span className="font-medium">{appointment.time}</span> · {appointment.service?.name}
                  <p className="text-sm text-gray-500">{appointment.user?.name}</p>
                </div>
                <StatusBadge status={appointment.status} />
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
