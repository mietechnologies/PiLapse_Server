const Pi = require('../models/piModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const deviceToken = require('../utils/deviceToken');

const issueToken = async (pi) => {
  const token = deviceToken.generate();
  pi.deviceTokenHash = deviceToken.hash(token);
  await pi.save();
  return token;
};

const sendPi = (res, statusCode, pi, token) => {
  const data = pi.toObject();
  delete data.deviceTokenHash;
  const body = { status: 'success', data: { pi: data } };
  if (token) body.deviceToken = token;
  res.status(statusCode).json(body);
};

// Registers a Pi for the logged-in user and returns its device token. The
// token is only ever returned here and from rotateToken.
exports.add = catchAsync(async (req, res, next) => {
  const newPi = await Pi.create({
    name: req.body.name,
    description: req.body.description,
    room: req.body.room,
    location: req.body.location,
    userId: req.user._id,
    model: req.body.model,
  });

  const token = await issueToken(newPi);
  sendPi(res, 201, newPi, token);
});

exports.getMine = catchAsync(async (req, res, next) => {
  const pis = await Pi.find({ userId: req.user._id }).select('-__v');

  res.status(200).json({
    status: 'success',
    results: pis.length,
    data: { pis },
  });
});

// Loads req.pi from :id and checks the caller may use it. A device may only
// reach its own Pi; a user may only reach Pis they own. Anything else is a 404
// so Pi ids can't be probed.
exports.loadPi = catchAsync(async (req, res, next) => {
  const notFound = new AppError('No Pi found with that ID', 404);
  if (req.device && !req.device._id.equals(req.params.id)) {
    return next(notFound);
  }

  const pi = await Pi.findById(req.params.id).select('+deviceTokenHash');
  if (!pi || !pi.userId.equals(req.user._id)) {
    return next(notFound);
  }

  req.pi = pi;
  next();
});

exports.getPi = (req, res) => sendPi(res, 200, req.pi);

exports.rotateToken = catchAsync(async (req, res, next) => {
  const token = await issueToken(req.pi);
  sendPi(res, 200, req.pi, token);
});

exports.revokeToken = catchAsync(async (req, res, next) => {
  req.pi.deviceTokenHash = undefined;
  await req.pi.save();
  res.status(204).send();
});
