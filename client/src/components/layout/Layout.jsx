import { Outlet } from 'react-router';
import Navbar from './Navbar';

// Shared page frame: navbar on top, the current page below.
export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
