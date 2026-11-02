import { useContext } from 'react';
import { AuthContext } from './AuthContext';

// Any component can call useAuth() to read the logged-in user or log in/out.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
