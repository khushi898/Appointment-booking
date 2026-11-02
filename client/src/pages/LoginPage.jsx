import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/useAuth';
import { toFieldErrors } from '../lib/api';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // One handler for every input: uses the input's name to update the right field
  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser reloading the page
    setSubmitting(true);
    setFieldErrors({});
    setFormError('');
    try {
      await login(form);
      // No navigate() here: once the user is set, GuestRoute redirects them
    } catch (err) {
      // Show the API's messages: per-field for 400, a single message for 401/429/network
      setFieldErrors(toFieldErrors(err.details));
      setFormError(err.details.length ? 'Please fix the highlighted fields.' : err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-2xl font-semibold">Log in</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back! Log in to manage your appointments.</p>

        {/* noValidate: all validation messages come from our API */}
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <Alert>{formError}</Alert>
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
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
          />
          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          No account yet?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
