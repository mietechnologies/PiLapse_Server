const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  // Path of the stored file, relative to the Pi's photo directory.
  image: String,
  intent: {
    type: String,
    default: 'default',
  },
  temperature: {
    type: Number,
    required: false,
  },
  photoNumber: Number,
  date: {
    type: Date,
    default: Date.now,
    required: [true, 'A photo must have a date.'],
  },
  piId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pi',
    required: [true, 'A photo must be associated with a Pi.'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A photo must belong to a user.'],
  },
});

photoSchema.index({ piId: 1, intent: 1, date: 1 });

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo;
