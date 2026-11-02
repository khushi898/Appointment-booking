// Date helpers. Dates are "YYYY-MM-DD" strings and times are "HH:mm" strings,
// both in the business's own timezone (BUSINESS_TIMEZONE), so a booking for
// "2026-11-20 09:00" means 9am where the clinic/salon is — no UTC day shifts.
const { env } = require('../config/env');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/; // 00:00 – 23:59

// "2026-02-30" matches the regex but isn't a real day. Build a UTC date from
// the parts and check it didn't roll over into another month.
function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isValidTime(value) {
  return typeof value === 'string' && TIME_REGEX.test(value);
}

// Today's date and the current time in the business timezone, e.g. { date: '2026-11-02', time: '14:05' }.
// 'en-CA' formats dates as YYYY-MM-DD; hourCycle h23 gives 00–23 hours.
function nowInBusinessTz(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: env.businessTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type).value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

// True if the slot has already started (or is starting this minute) in the business timezone.
// "2026-11-20T09:00" style strings compare correctly as plain text.
function isPastSlot(date, time, now = nowInBusinessTz()) {
  return `${date}T${time}` <= `${now.date}T${now.time}`;
}

// addDays('2026-11-30', 1) -> '2026-12-01'
function addDays(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

// Number of days from one date string to another (to - from).
function daysBetween(from, to) {
  return Math.round((Date.parse(to) - Date.parse(from)) / (24 * 60 * 60 * 1000));
}

module.exports = {
  DATE_REGEX,
  TIME_REGEX,
  isValidDate,
  isValidTime,
  nowInBusinessTz,
  isPastSlot,
  addDays,
  daysBetween,
};
