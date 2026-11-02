const { z } = require('zod');
const { paginationQuery, objectId, dateString } = require('./common.validators');
const { isValidTime } = require('../utils/dateTime');
const { STATUSES } = require('../models/Appointment');

// Body for POST /api/appointments. "user" is not accepted — it always comes
// from the token, so nobody can book on someone else's behalf.
const bookAppointmentSchema = z.object({
  serviceId: objectId('serviceId'),
  date: dateString,
  time: z.string({ error: 'Time is required' }).refine(isValidTime, 'Time must be in HH:mm format'),
  notes: z.string().trim().max(300, 'Notes must be at most 300 characters').optional(),
});

// GET /api/appointments/me?type=upcoming|past&page=&limit=
const myAppointmentsQuery = paginationQuery.omit({ search: true }).extend({
  type: z.enum(['upcoming', 'past'], { error: 'type must be upcoming or past' }).default('upcoming'),
});

// GET /api/appointments (admin) — filter by status and by one date OR a from/to range.
const adminListQuery = paginationQuery
  .extend({
    status: z.enum(STATUSES, { error: `status must be one of: ${STATUSES.join(', ')}` }).optional(),
    date: dateString.optional(),
    from: dateString.optional(),
    to: dateString.optional(),
    sort: z.enum(['date', '-date'], { error: 'sort must be date or -date' }).default('-date'),
  })
  .refine((q) => !(q.date && (q.from || q.to)), { message: 'Use either date or from/to, not both', path: ['date'] })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: 'from must be on or before to', path: ['to'] });

// PATCH /api/appointments/:id/status (admin) — record what happened.
const updateStatusSchema = z.object({
  status: z.enum(['completed', 'no-show'], { error: 'status must be completed or no-show' }),
});

module.exports = { bookAppointmentSchema, myAppointmentsQuery, adminListQuery, updateStatusSchema };
