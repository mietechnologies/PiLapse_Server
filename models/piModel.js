const mongoose = require('mongoose');

// A Pi is one physical camera. Each capture profile running on it is an
// "intent" (e.g. a 5s and a 30s lapse of the same view); photos carry the
// intent they were taken for.
const piSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'Your Pi must have a name to identify it.'],
  },
  description: {
    type: String,
  },
  room: {
    name: String,
    windowDirection: {
      type: String,
      enum: ['East', 'West', 'North', 'South'],
    },
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
      default: undefined,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A Pi must belong to a user.'],
  },
  model: {
    type: String,
  },
  intents: {
    type: [String],
    default: [],
  },
  lastSeenAt: Date,
  // SHA-256 of the device token. The plaintext is only returned once, when
  // the Pi is registered or its token is rotated.
  deviceTokenHash: {
    type: String,
    select: false,
    index: { unique: true, sparse: true },
  },
});

// Names only need to be unique per user.
piSchema.index({ userId: 1, name: 1 }, { unique: true });

const Pi = mongoose.model('Pi', piSchema);

module.exports = Pi;
