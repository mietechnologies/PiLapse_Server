const mongoose = require('mongoose');
const Pi = require('./piModel');

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
    red: Pi,
    required: [true, 'A photo must be associated with a Pi.'],
  },
});

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo;
