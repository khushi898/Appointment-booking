import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/useAuth';
import { toFieldErrors } from '../lib/api';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      await register(form);
      // The new user is logged in straight away; GuestRoute redirects them
    } catch (err) {
      setFieldErrors(toFieldErrors(err.details));
      // e.g. 409 "An account with this email already exists"
      setFormError(err.details.length ? 'Please fix the highlighted fields.' : err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-2xl font-semibold">Create an account</h1>
        <p className="mt-1 text-sm text-gray-600">Sign up to book and manage appointments.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <Alert>{formError}</Alert>
          <Input
            label="Full name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            error={fieldErrors.name}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
          />
          <p className="text-xs text-gray-500">At least 8 characters.</p>
          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
