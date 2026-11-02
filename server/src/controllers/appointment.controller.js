const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Availability = require('../models/Availability');
const ApiError = require('../utils/ApiError');
const { nowInBusinessTz, isPastSlot } = require('../utils/dateTime');
const { getSkip, buildPagination } = require('../utils/pagination');

// Service fields to include when we populate an appointment
const SERVICE_FIELDS = 'name durationMinutes price';

// POST /api/appointments — book a slot for the logged-in user.
async function bookAppointment(req, res) {
  const { serviceId, date, time, notes } = req.body;

  // 1. The service must exist and still be offered
  const service = await Service.findOne({ _id: serviceId, isActive: true });
  if (!service) {
    throw new ApiError(404, 'Service not found');
  }

  // 2. The slot must be in the future
  if (isPastSlot(date, time)) {
    throw new ApiError(400, 'Cannot book a time in the past');
  }

  // 3. The admin must have opened this time on this day
  const day = await Availability.findOne({ date });
  if (!day || !day.slots.includes(time)) {
    throw new ApiError(400, `${time} on ${date} is not an available slot`);
  }

  // 4. Insert. We do NOT check "is it free?" first: two requests could both pass
  //    that check before either saves (a race condition). Instead the partial
  //    unique index on (date, time, status: booked) lets MongoDB accept exactly
  //    one insert; the other fails with duplicate-key error 11000 -> 409.
  let appointment;
  try {
    appointment = await Appointment.create({ user: req.user._id, service: service._id, date, time, notes });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'This slot has already been booked. Please choose another time.');
    }
    throw err;
  }

  // Replace the service id with the service's details in the response
  await appointment.populate('service', SERVICE_FIELDS);
  res.status(201).json({ success: true, data: { appointment } });
}

// GET /api/appointments/me?type=upcoming|past&page=&limit=
async function listMyAppointments(req, res) {
  const { page, limit, type } = req.validatedQuery;
  const now = nowInBusinessTz();

  // Upcoming = later today or any later day. Past = everything that has started.
  // (Must match isPastSlot: a slot starting this minute counts as past.)
  const timeFilter =
    type === 'upcoming'
      ? { $or: [{ date: { $gt: now.date } }, { date: now.date, time: { $gt: now.time } }] }
      : { $or: [{ date: { $lt: now.date } }, { date: now.date, time: { $lte: now.time } }] };
  const filter = { user: req.user._id, ...timeFilter };

  // Soonest first for upcoming, most recent first for past
  const sort = type === 'upcoming' ? { date: 1, time: 1 } : { date: -1, time: -1 };

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .sort(sort)
      .skip(getSkip(page, limit))
      .limit(limit)
      .populate('service', SERVICE_FIELDS),
    Appointment.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { appointments, pagination: buildPagination(page, limit, total) },
  });
}

// PATCH /api/appointments/:id/cancel — the owner cancels an upcoming booking.
// We keep the record (status "cancelled") instead of deleting it, for history.
async function cancelMyAppointment(req, res) {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }
  // .equals compares ObjectIds by value (=== would compare object references)
  if (!appointment.user.equals(req.user._id)) {
    throw new ApiError(403, 'You can only cancel your own appointments');
  }
  if (appointment.status !== 'booked') {
    throw new ApiError(400, `Cannot cancel an appointment that is ${appointment.status}`);
  }
  if (isPastSlot(appointment.date, appointment.time)) {
    throw new ApiError(400, 'Cannot cancel an appointment that has already started');
  }

  // Once status is no longer "booked", the partial unique index ignores this
  // document, so the slot becomes free for someone else to book.
  appointment.status = 'cancelled';
  appointment.cancelledAt = new Date();
  await appointment.save();

  await appointment.populate('service', SERVICE_FIELDS);
  res.status(200).json({ success: true, message: 'Appointment cancelled', data: { appointment } });
}

module.exports = { bookAppointment, listMyAppointments, cancelMyAppointment };
