const Availability = require('../models/Availability');
const ApiError = require('../utils/ApiError');
const { nowInBusinessTz, addDays, daysBetween } = require('../utils/dateTime');
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

  res.status(200).json({ success: true, data: { from, to, days } });
}

// GET /api/availability/:date — slots for one day.
async function getAvailability(req, res) {
  const day = await Availability.findOne({ date: req.params.date });
  if (!day) {
    throw new ApiError(404, `No availability set for ${req.params.date}`);
  }
  res.status(200).json({ success: true, data: { day } });
}

// PUT /api/availability/:date (admin) — create or replace the slots for a day.
// PUT fits because it is idempotent: sending the same body twice gives the same result.
async function setAvailability(req, res) {
  const { date } = req.params;
  if (date < nowInBusinessTz().date) {
    throw new ApiError(400, 'Cannot set availability for a past date');
  }

  const existing = await Availability.findOne({ date });
  const day = existing || new Availability({ date });
  day.slots = req.body.slots;
  await day.save();

  // 201 when the day was created, 200 when existing slots were replaced
  res.status(existing ? 200 : 201).json({ success: true, data: { day } });
}

// DELETE /api/availability/:date (admin) — the day is no longer bookable.
async function deleteAvailability(req, res) {
  const day = await Availability.findOneAndDelete({ date: req.params.date });
  if (!day) {
    throw new ApiError(404, `No availability set for ${req.params.date}`);
  }
  res.status(200).json({ success: true, message: `Availability for ${req.params.date} deleted` });
}

module.exports = { listAvailability, getAvailability, setAvailability, deleteAvailability };
