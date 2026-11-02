// Works out which slots of a day are already booked and which are still free.
const Appointment = require('../models/Appointment');
const { nowInBusinessTz, isPastSlot } = require('./dateTime');

// For a list of dates, returns a Map like { '2026-11-20' => Set{'09:00','10:00'} }
// of the times that currently have a "booked" appointment. One DB query for all dates.
async function getBookedTimesByDate(dates) {
  const booked = await Appointment.find({ date: { $in: dates }, status: 'booked' }).select('date time');
  const byDate = new Map(dates.map((date) => [date, new Set()]));
  booked.forEach((appointment) => byDate.get(appointment.date).add(appointment.time));
  return byDate;
}

// Adds bookedSlots and availableSlots to an Availability document.
// A slot is available if nobody has booked it and it hasn't already started.
function withSlotStatus(day, bookedTimes, now = nowInBusinessTz()) {
  return {
    ...day.toJSON(),
    bookedSlots: day.slots.filter((time) => bookedTimes.has(time)),
    availableSlots: day.slots.filter((time) => !bookedTimes.has(time) && !isPastSlot(day.date, time, now)),
  };
}

module.exports = { getBookedTimesByDate, withSlotStatus };
