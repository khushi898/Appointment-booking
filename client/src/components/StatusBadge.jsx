import Badge from './ui/Badge';

const STATUS_STYLES = {
  booked: { color: 'indigo', label: 'Booked' },
  completed: { color: 'green', label: 'Completed' },
  cancelled: { color: 'gray', label: 'Cancelled' },
  'no-show': { color: 'red', label: 'No-show' },
};

// Coloured badge for an appointment status.
export default function StatusBadge({ status }) {
  const { color, label } = STATUS_STYLES[status] || { color: 'gray', label: status };
  return <Badge color={color}>{label}</Badge>;
}
