// White box with a border and shadow, used to group content.
export default function Card({ className = '', children }) {
  return <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}>{children}</div>;
}
