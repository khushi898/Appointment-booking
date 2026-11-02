const mongoose = require('mongoose');
const { isValidDate, isValidTime } = require('../utils/dateTime');

// One document per working day, listing the start times that can be booked.
// e.g. { date: '2026-11-20', slots: ['09:00', '09:30', '10:00'] }
const availabilitySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, 'Date is required'],
      unique: true, // one availability document per day
      validate: { validator: isValidDate, message: 'Date must be a real date in YYYY-MM-DD format' },
    },
    slots: {
      type: [
        {
          type: String,
          validate: { validator: isValidTime, message: 'Each slot must be a time in HH:mm format' },
        },
      ],
      validate: { validator: (slots) => slots.length > 0, message: 'At least one slot is required' },
    },
  },
  { timestamps: true }
);

availabilitySchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Availability', availabilitySchema);
