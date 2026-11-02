// Helpers for building a day's list of slot times ("HH:mm").

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const toTime = (totalMinutes) =>
  `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;

// generateSlots('09:00', '11:00', 30) -> ['09:00', '09:30', '10:00', '10:30']
// The end time is when the day finishes, so no slot starts AT the end time.
export function generateSlots(start, end, intervalMinutes) {
  const slots = [];
  for (let minute = toMinutes(start); minute < toMinutes(end); minute += intervalMinutes) {
    slots.push(toTime(minute));
  }
  return slots;
}

// Merge, remove duplicates and sort. "HH:mm" strings sort correctly as text.
export function mergeSlots(...lists) {
  return [...new Set(lists.flat())].sort();
}
