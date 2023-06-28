const Pi = require('../models/piModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.add = catchAsync(async (req, res, next) => {
  const newPi = await Pi.create(req.body);
  console.log(req.body);
  res.status(200).json({
    status: 'success',
    data: {
      newPi,
    },
  });
});
