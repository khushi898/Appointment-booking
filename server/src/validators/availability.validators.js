const { z } = require('zod');
const { isValidDate, isValidTime } = require('../utils/dateTime');

const MAX_RANGE_DAYS = 62;

const dateString = z
  .string({ error: 'Date is required' })
  .refine(isValidDate, 'Date must be a real date in YYYY-MM-DD format');

// For routes like /api/availability/:date
const dateParam = z.object({ date: dateString });

// Body for PUT /api/availability/:date
// Duplicates are removed and times sorted, so ["10:00","09:00","10:00"] -> ["09:00","10:00"].
// Sorting strings works because "HH:mm" with leading zeros sorts like time.
const setSlotsSchema = z.object({
  slots: z
    .array(z.string().refine(isValidTime, 'Each slot must be a time in HH:mm format'), {
      error: 'slots must be an array of times',
    })
    .min(1, 'At least one slot is required')
    .max(96, 'At most 96 slots per day')
    .transform((slots) => [...new Set(slots)].sort()),
});

// GET /api/availability?from=&to= — both optional; defaults are set in the controller.
const rangeQuery = z
  .object({ from: dateString.optional(), to: dateString.optional() })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: 'from must be on or before to', path: ['to'] });

module.exports = { dateParam, setSlotsSchema, rangeQuery, MAX_RANGE_DAYS };
