const Pi = require('../models/piModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('../utils/handlerFactory');

exports.add = catchAsync(async (req, res, next) => {
  const newPi = await Pi.create({
    name: req.body.name,
    room: req.body.room,
    location: req.body.location,
    userId: req.user._id,
    model: req.body.model,
  });

  res.status(200).json({
    status: 'success',
    data: {
      newPi,
    },
  });
});

exports.getPi = factory.getOne(Pi);
exports.getAll = factory.getAll(Pi);
