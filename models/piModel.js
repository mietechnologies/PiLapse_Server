const mongoose = require('mongoose');

const piSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: [true, 'Your Pi must have a name to identify it.'],
  },
  description: {
    type: String,
  },
  room: {
    name: {
      type: String,
      required: [true, 'A Pi must have a room.'],
    },
    windowDirection: {
      type: String,
      enum: ['East', 'West', 'North', 'South'],
      required: [true, 'A Pi must have a window direction.'],
    },
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
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
    required: [true, 'A Pi must have a model.'],
  },
});

const Pi = mongoose.model('Pi', piSchema);

module.exports = Pi;
