import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { api } from '../../lib/api';
import { formatDuration, formatPrice } from '../../lib/format';
import ServiceForm from '../../components/admin/ServiceForm';
import ConfirmButton from '../../components/ConfirmButton';
import ErrorState from '../../components/ErrorState';
import Pagination from '../../components/Pagination';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';

// Admin: list (including inactive), create, edit, delete (soft) and reactivate services.
export default function AdminServicesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  // null = no form, 'new' = create form, a service object = edit form
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data, error, loading, reload } = useApi('/services', {
    includeInactive: 'true',
    page,
    limit: 10,
    search: debouncedSearch,
    sort: 'name',
  });

  const showResult = (text) => {
    setMessage(text);
    setActionError('');
    reload();
  };

  async function saveService(values) {
    if (editing === 'new') {
      await api.post('/services', values);
      showResult(`Created “${values.name}”.`);
    } else {
      await api.patch(`/services/${editing._id}`, values);
      showResult(`Saved “${values.name}”.`);
    }
    setEditing(null);
  }

  // Used for delete and reactivate. Errors are shown at the top of the page.
  async function runAction(request, successText) {
    try {
      await request();
      showResult(successText);
    } catch (err) {
      setMessage('');
      setActionError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Services</h1>
        {!editing && <Button onClick={() => setEditing('new')}>New service</Button>}
      </div>

      <Alert variant="success">{message}</Alert>
      <Alert>{actionError}</Alert>

      {editing && (
        <ServiceForm
          key={editing === 'new' ? 'new' : editing._id} // fresh form state for each service
          service={editing === 'new' ? null : editing}
          onSubmit={saveService}
          onCancel={() => setEditing(null)}
        />
      )}

      <input
        type="search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        placeholder="Search services…"
        aria-label="Search services"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />

      {loading && !data ? (
        <PageSpinner label="Loading services…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data.services.length === 0 ? (
        <Card className="text-center text-gray-600">No services found.</Card>
      ) : (
        <>
          {/* overflow-x-auto lets the table scroll sideways on small screens */}
          <Card className="overflow-x-auto p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.services.map((service) => (
                  <tr key={service._id} className={service.isActive ? '' : 'bg-gray-50 text-gray-500'}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{service.name}</p>
                      {service.description && <p className="text-xs text-gray-500">{service.description}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDuration(service.durationMinutes)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatPrice(service.price)}</td>
                    <td className="px-4 py-3">
                      {service.isActive ? <Badge color="green">Active</Badge> : <Badge>Inactive</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditing(service)}>
                          Edit
                        </Button>
                        {service.isActive ? (
                          <ConfirmButton
                            label="Delete"
                            question="Hide this service?"
                            confirmLabel="Delete"
                            onConfirm={() =>
                              runAction(() => api.delete(`/services/${service._id}`), `Deleted “${service.name}”.`)
                            }
                          />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              runAction(
                                () => api.patch(`/services/${service._id}`, { isActive: true }),
                                `Reactivated “${service.name}”.`
                              )
                            }
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
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
