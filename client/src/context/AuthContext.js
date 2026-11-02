import { createContext } from 'react';

// Holds { user, loading, isAdmin, login, register, logout } — provided by AuthProvider.
export const AuthContext = createContext(null);

// Where each role lands after logging in
export function homePathFor(user) {
  return user?.role === 'admin' ? '/admin' : '/';
}
