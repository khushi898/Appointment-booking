import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { useAuth } from '../../context/useAuth';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

// Links depend on who is logged in: guests, users and admins each see their own.
const USER_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/appointments', label: 'My Appointments' },
];
const ADMIN_LINKS = [{ to: '/admin', label: 'Dashboard' }];

const linkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = !user ? [] : isAdmin ? ADMIN_LINKS : USER_LINKS;
  const closeMenu = () => setMenuOpen(false);

  const navLinks = links.map((link) => (
    <NavLink key={link.to} to={link.to} end={link.end} className={linkClass} onClick={closeMenu}>
      {link.label}
    </NavLink>
  ));

  const accountArea = user ? (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700">{user.name}</span>
      {isAdmin && <Badge color="indigo">Admin</Badge>}
      <Button variant="outline" size="sm" onClick={logout}>
        Log out
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <NavLink to="/login" className={linkClass} onClick={closeMenu}>
        Log in
      </NavLink>
      <Link
        to="/register"
        onClick={closeMenu}
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Sign up
      </Link>
    </div>
  );

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-indigo-600">
          BookEasy
        </Link>

        {/* Desktop (md and wider): everything in one row */}
        <div className="hidden items-center gap-6 md:flex">
          <div className="flex gap-1">{navLinks}</div>
          {accountArea}
        </div>

        {/* Mobile: hamburger button toggles the menu below */}
        <button
          type="button"
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="space-y-3 border-t border-gray-200 px-4 py-3 md:hidden">
          <div className="space-y-1">{navLinks}</div>
          {accountArea}
        </div>
      )}
    </header>
  );
}
