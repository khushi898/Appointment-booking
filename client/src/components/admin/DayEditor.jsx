import { useState } from 'react';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { generateSlots, mergeSlots } from '../../lib/slots';
import ConfirmButton from '../ConfirmButton';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';

const INTERVALS = [15, 20, 30, 45, 60, 90].map((minutes) => ({ value: minutes, label: `Every ${minutes} min` }));

// Edits the slots of one day. `day` is the saved availability (or null if none yet).
// The parent gives this component a new `key` whenever the saved data changes, so
// React creates it fresh and the draft below starts from the latest saved slots.
export default function DayEditor({ date, day, onSaved }) {
  const booked = day?.bookedSlots ?? [];
  const [slots, setSlots] = useState(day?.slots ?? []); // the unsaved draft
  const [singleTime, setSingleTime] = useState('');
  const [range, setRange] = useState({ start: '09:00', end: '17:00', interval: 30 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const changed = slots.join(',') !== (day?.slots ?? []).join(',');

  const addSingle = () => {
    if (singleTime) setSlots(mergeSlots(slots, [singleTime]));
    setSingleTime('');
  };
  const addRange = () => setSlots(mergeSlots(slots, generateSlots(range.start, range.end, Number(range.interval))));
  const removeSlot = (time) => setSlots(slots.filter((slot) => slot !== time));
  // "Clear" keeps booked slots — those can't be removed while someone is booked
  const clearUnbooked = () => setSlots(slots.filter((slot) => booked.includes(slot)));

  async function save() {
    setSaving(true);
    setError('');
    try {
      await api.put(`/availability/${date}`, { slots });
      onSaved(`Saved ${slots.length} slot(s) for ${formatDate(date)}.`);
    } catch (err) {
      // e.g. 400 past date, 409 "Cannot remove booked slots: 10:00"
      setError(err.details.length ? err.details.map((d) => d.message).join(' ') : err.message);
      setSaving(false);
    }
  }

  async function deleteDay() {
    setError('');
    try {
      await api.delete(`/availability/${date}`);
      onSaved(`Closed ${formatDate(date)} for booking.`);
    } catch (err) {
      setError(err.message); // e.g. 409 "it has 2 booked appointment(s)"
    }
  }

  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{formatDate(date)}</h2>
        <span className="text-sm text-gray-500">
          {day ? `${day.slots.length} saved · ${booked.length} booked` : 'Not open for booking yet'}
        </span>
      </div>

      <Alert>{error}</Alert>

      {/* Generate many slots at once */}
      <div className="grid items-end gap-3 sm:grid-cols-4">
        <Input label="From" type="time" value={range.start} onChange={(e) => setRange({ ...range, start: e.target.value })} />
        <Input label="Until" type="time" value={range.end} onChange={(e) => setRange({ ...range, end: e.target.value })} />
        <Select
          label="Interval"
          options={INTERVALS}
          value={range.interval}
          onChange={(e) => setRange({ ...range, interval: e.target.value })}
        />
        <Button variant="outline" onClick={addRange} disabled={!range.start || !range.end}>
          Add these slots
        </Button>
      </div>

      {/* Add one time */}
      <div className="flex items-end gap-3">
        <Input label="Single time" type="time" value={singleTime} onChange={(e) => setSingleTime(e.target.value)} />
        <Button variant="outline" onClick={addSingle} disabled={!singleTime}>
          Add
        </Button>
      </div>

      {/* Current draft */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Slots ({slots.length})</h3>
          {slots.length > booked.length && (
            <Button variant="ghost" size="sm" onClick={clearUnbooked}>
              Clear unbooked
            </Button>
          )}
        </div>
        {slots.length === 0 ? (
          <p className="text-sm text-gray-500">No slots yet. Generate or add times above.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {slots.map((time) =>
              booked.includes(time) ? (
                <li key={time} className="rounded-md bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700" title="Booked — cannot be removed">
                  {time} · booked
                </li>
              ) : (
                <li key={time} className="flex items-center gap-1 rounded-md border border-gray-300 bg-white py-1 pl-3 pr-1 text-sm">
                  {time}
                  <button
                    type="button"
                    onClick={() => removeSlot(time)}
                    className="rounded px-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                    aria-label={`Remove ${time}`}
                  >
                    ×
                  </button>
                </li>
              )
            )}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <Button onClick={save} loading={saving} disabled={!changed || slots.length === 0}>
          Save day
        </Button>
        {day && (
          <ConfirmButton label="Close this day" question="Remove all slots for this day?" confirmLabel="Close day" onConfirm={deleteDay} />
        )}
      </div>
    </Card>
  );
}
