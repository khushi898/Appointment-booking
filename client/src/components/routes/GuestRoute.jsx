import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/useAuth';
import { homePathFor } from '../../context/AuthContext';
import { PageSpinner } from '../ui/Spinner';

// Wraps login/register: a user who is already logged in is sent on instead.
export default function GuestRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner />;
  if (user) {
    const from = location.state?.from?.pathname;
    return <Navigate to={from || homePathFor(user)} replace />;
  }
  return <Outlet />;
}
