const { z } = require('zod');
const { paginationQuery, objectId } = require('./common.validators');
const { isValidDate, isValidTime } = require('../utils/dateTime');

// Body for POST /api/appointments. "user" is not accepted — it always comes
// from the token, so nobody can book on someone else's behalf.
const bookAppointmentSchema = z.object({
  serviceId: objectId('serviceId'),
  date: z.string({ error: 'Date is required' }).refine(isValidDate, 'Date must be a real date in YYYY-MM-DD format'),
  time: z.string({ error: 'Time is required' }).refine(isValidTime, 'Time must be in HH:mm format'),
  notes: z.string().trim().max(300, 'Notes must be at most 300 characters').optional(),
});

// GET /api/appointments/me?type=upcoming|past&page=&limit=
const myAppointmentsQuery = paginationQuery.omit({ search: true }).extend({
  type: z.enum(['upcoming', 'past'], { error: 'type must be upcoming or past' }).default('upcoming'),
});

module.exports = { bookAppointmentSchema, myAppointmentsQuery };
