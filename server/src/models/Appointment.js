const mongoose = require('mongoose');
const { isValidDate, isValidTime } = require('../utils/dateTime');

const STATUSES = ['booked', 'cancelled', 'completed', 'no-show'];

const appointmentSchema = new mongoose.Schema(
  {
    // ref tells Mongoose which model to use when we call .populate('user')
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required'],
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      validate: { validator: isValidDate, message: 'Date must be a real date in YYYY-MM-DD format' },
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
      validate: { validator: isValidTime, message: 'Time must be in HH:mm format' },
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: `Status must be one of: ${STATUSES.join(', ')}` },
      default: 'booked',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes must be at most 300 characters'],
      default: '',
    },
    cancelledAt: Date,
  },
  { timestamps: true }
);

// THE DOUBLE-BOOKING GUARD.
// Unique on (date, time), but only for documents whose status is "booked"
// (a partial index). So:
//  - two "booked" appointments for the same slot can never exist — MongoDB itself
//    rejects the second insert with error code 11000, even if both requests
//    arrive at the same millisecond;
//  - cancelled/completed/no-show appointments are ignored by the index, so
//    cancelling frees the slot for someone else.
appointmentSchema.index(
  { date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: 'booked' }, name: 'unique_booked_slot' }
);

// Speeds up "My Appointments" (all appointments of one user, by date)
appointmentSchema.index({ user: 1, date: 1, time: 1 });

appointmentSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Appointment', appointmentSchema);
module.exports.STATUSES = STATUSES;
