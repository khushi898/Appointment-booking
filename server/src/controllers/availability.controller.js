const Availability = require('../models/Availability');
const Appointment = require('../models/Appointment');
const ApiError = require('../utils/ApiError');
const { nowInBusinessTz, addDays, daysBetween } = require('../utils/dateTime');
const { getBookedTimesByDate, withSlotStatus } = require('../utils/slots');
const { MAX_RANGE_DAYS } = require('../validators/availability.validators');

const DEFAULT_RANGE_DAYS = 30;

// GET /api/availability?from=&to= — working days in a date range (for a calendar view).
async function listAvailability(req, res) {
  const from = req.validatedQuery.from || nowInBusinessTz().date;
  const to = req.validatedQuery.to || addDays(from, DEFAULT_RANGE_DAYS);

  if (daysBetween(from, to) > MAX_RANGE_DAYS) {
    throw new ApiError(400, `Date range can be at most ${MAX_RANGE_DAYS} days`);
  }

  // "YYYY-MM-DD" strings compare correctly with $gte/$lte, like real dates
  const days = await Availability.find({ date: { $gte: from, $lte: to } }).sort('date');
  const bookedByDate = await getBookedTimesByDate(days.map((day) => day.date));
  const now = nowInBusinessTz();

  res.status(200).json({
    success: true,
    data: { from, to, days: days.map((day) => withSlotStatus(day, bookedByDate.get(day.date), now)) },
  });
}

// GET /api/availability/:date — slots for one day, with which are booked/free.
async function getAvailability(req, res) {
  const { date } = req.params;
  const day = await Availability.findOne({ date });
  if (!day) {
    throw new ApiError(404, `No availability set for ${date}`);
  }
  const bookedByDate = await getBookedTimesByDate([date]);
  res.status(200).json({ success: true, data: { day: withSlotStatus(day, bookedByDate.get(date)) } });
}

// PUT /api/availability/:date (admin) — create or replace the slots for a day.
// PUT fits because it is idempotent: sending the same body twice gives the same result.
async function setAvailability(req, res) {
  const { date } = req.params;
  const { slots } = req.body;
  if (date < nowInBusinessTz().date) {
    throw new ApiError(400, 'Cannot set availability for a past date');
  }

  // Don't let the admin remove a time that someone has already booked
  const bookedTimes = (await getBookedTimesByDate([date])).get(date);
  const removedButBooked = [...bookedTimes].filter((time) => !slots.includes(time)).sort();
  if (removedButBooked.length > 0) {
    throw new ApiError(409, `Cannot remove booked slots: ${removedButBooked.join(', ')}`);
  }

  const existing = await Availability.findOne({ date });
  const day = existing || new Availability({ date });
  day.slots = slots;
  await day.save();

  // 201 when the day was created, 200 when existing slots were replaced
  res.status(existing ? 200 : 201).json({ success: true, data: { day: withSlotStatus(day, bookedTimes) } });
}

// DELETE /api/availability/:date (admin) — the day is no longer bookable.
async function deleteAvailability(req, res) {
  const { date } = req.params;
  const bookedCount = await Appointment.countDocuments({ date, status: 'booked' });
  if (bookedCount > 0) {
    throw new ApiError(409, `Cannot delete ${date}: it has ${bookedCount} booked appointment(s)`);
  }

  const day = await Availability.findOneAndDelete({ date });
  if (!day) {
    throw new ApiError(404, `No availability set for ${date}`);
  }
  res.status(200).json({ success: true, message: `Availability for ${date} deleted` });
}

module.exports = { listAvailability, getAvailability, setAvailability, deleteAvailability };
