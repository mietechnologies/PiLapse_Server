const mongoose = require('mongoose');
const Pi = require('./piModel');
const User = require('./userModel');

const photoSchema = new mongoose.Schema({
  image: String,
  temperature: {
    type: Number,
    required: false,
  },
  photoNumber: Number,
  date: {
    type: Date,
    required: [true, 'A photo must have a date.'],
  },
  piId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Pi,
    required: [true, 'A photo must be associated with a Pi.'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    require: [true, 'A photo must belong to a user.'],
  },
});

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo;
