import { useState } from 'react';
import { toFieldErrors } from '../../lib/api';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';

// "" -> undefined (so the API says "required"), "30" -> 30
const toNumber = (value) => (value === '' ? undefined : Number(value));

// Create/edit form for a service. `service` is given when editing.
// onSubmit(values) must return a promise; API errors are shown under the fields.
export default function ServiceForm({ service, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: service?.name ?? '',
    description: service?.description ?? '',
    durationMinutes: service?.durationMinutes?.toString() ?? '',
    price: service?.price?.toString() ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError('');
    try {
      await onSubmit({
        name: form.name,
        description: form.description,
        durationMinutes: toNumber(form.durationMinutes),
        price: toNumber(form.price),
      });
    } catch (err) {
      setFieldErrors(toFieldErrors(err.details));
      // e.g. 409 "Duplicate value for: name"
      setFormError(err.details.length ? 'Please fix the highlighted fields.' : err.message);
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">{service ? `Edit “${service.name}”` : 'New service'}</h2>
      <form onSubmit={handleSubmit} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
        <Alert className="sm:col-span-2">{formError}</Alert>
        <Input label="Name" name="name" value={form.name} onChange={handleChange} error={fieldErrors.name} />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Duration (min)"
            name="durationMinutes"
            type="number"
            min="5"
            step="5"
            value={form.durationMinutes}
            onChange={handleChange}
            error={fieldErrors.durationMinutes}
          />
          <Input
            label="Price (£)"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            error={fieldErrors.price}
          />
        </div>
        <Input
          label="Description (optional)"
          name="description"
          value={form.description}
          onChange={handleChange}
          error={fieldErrors.description}
          className="sm:col-span-2"
        />
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" loading={submitting}>
            {service ? 'Save changes' : 'Create service'}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
