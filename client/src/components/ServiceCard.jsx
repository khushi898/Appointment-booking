import { Link } from 'react-router';
import { formatDuration, formatPrice } from '../lib/format';
import Card from './ui/Card';

// One service in the list: name, description, duration, price and a Book link.
export default function ServiceCard({ service }) {
  return (
    <Card className="flex flex-col">
      <h3 className="text-lg font-semibold">{service.name}</h3>
      {service.description && <p className="mt-1 flex-1 text-sm text-gray-600">{service.description}</p>}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-500">{formatDuration(service.durationMinutes)}</span>
        <span className="font-semibold">{formatPrice(service.price)}</span>
      </div>
      <Link
        to={`/book/${service._id}`}
        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
      >
        Book
      </Link>
    </Card>
  );
}
