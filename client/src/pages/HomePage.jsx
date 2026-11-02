import { Link } from 'react-router';
import { useAuth } from '../context/useAuth';

// Public landing page. The services list is added here in Feature 7b.
export default function HomePage() {
  const { user } = useAuth();

  return (
    <section className="py-12 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Book your appointment in seconds</h1>
      <p className="mx-auto mt-4 max-w-xl text-gray-600">
        Pick a service, choose a free time slot and you&apos;re done. No phone calls, no double bookings.
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {user ? (
          <Link
            to="/appointments"
            className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            View my appointments
          </Link>
        ) : (
          <>
            <Link
              to="/register"
              className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create an account
            </Link>
            <Link
              to="/login"
              className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Log in
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
