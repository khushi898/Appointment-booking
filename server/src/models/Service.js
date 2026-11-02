const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
      default: '',
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [5, 'Duration must be at least 5 minutes'],
      max: [480, 'Duration must be at most 480 minutes'],
      validate: { validator: Number.isInteger, message: 'Duration must be a whole number of minutes' },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      max: [100000, 'Price must be at most 100000'],
    },
    // Soft delete: "deleted" services are hidden but kept, so past
    // appointments that reference them still have their details.
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Unique name, ignoring case ("Haircut" and "haircut" count as the same).
// strength 2 = compare letters but not upper/lower case.
serviceSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

serviceSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Service', serviceSchema);
