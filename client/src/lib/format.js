// Display helpers for dates, prices and durations.

const CURRENCY = import.meta.env.VITE_CURRENCY || 'INR';

// "2026-11-20" -> "Fri, 20 Nov 2026"
// Built from the parts as a LOCAL date: new Date('2026-11-20') would be read
// as UTC midnight and could show the previous day in some timezones.
export function formatDate(dateString, options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, options);
}

// 25 -> "₹25.00"
export function formatPrice(amount) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY }).format(amount);
}

// 90 -> "1 h 30 min", 30 -> "30 min"
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
