const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Pi = require('../models/piModel');
const deviceToken = require('../utils/deviceToken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// The first account becomes the server's owner. After that, public signup is
// closed and only the owner can create accounts.
exports.signup = catchAsync(async (req, res, next) => {
  const hasUsers = await User.exists({});
  if (hasUsers && !(req.user && req.user.role === 'owner')) {
    return next(
      new AppError(
        'Signup is closed. Ask the server owner for an account.',
        403
      )
    );
  }

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: hasUsers ? 'user' : 'owner',
  });

  if (hasUsers) {
    newUser.password = undefined;
    return res.status(201).json({ status: 'success', data: { user: newUser } });
  }

  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, req, res);
});

const getAuthHeader = (req) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return { scheme, token };
};

const userFromJWT = async (token) => {
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    throw new AppError(
      'The user belonging to this token does no longer exist.',
      401
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    throw new AppError(
      'User recently changed password! Please log in again.',
      401
    );
  }

  return currentUser;
};

// Requires a logged-in user (Authorization: Bearer <jwt>).
exports.protect = catchAsync(async (req, res, next) => {
  const { scheme, token } = getAuthHeader(req);
  if (scheme !== 'Bearer' || !token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  req.user = await userFromJWT(token);
  res.locals.user = req.user;
  next();
});

// Loads the user if a valid Bearer token is present, but doesn't require one.
exports.optionalUser = catchAsync(async (req, res, next) => {
  const { scheme, token } = getAuthHeader(req);
  if (scheme === 'Bearer' && token) {
    req.user = await userFromJWT(token);
  }
  next();
});

// Accepts either a logged-in user or a Pi's device token
// (Authorization: Device <token>). A device acts as its owner, but only for
// its own Pi; see piController.loadPi.
exports.protectUserOrDevice = catchAsync(async (req, res, next) => {
  const { scheme, token } = getAuthHeader(req);
  if (scheme !== 'Device' || !token) {
    return exports.protect(req, res, next);
  }

  const pi = await Pi.findOne({ deviceTokenHash: deviceToken.hash(token) });
  if (!pi) {
    return next(new AppError('Invalid or revoked device token.', 401));
  }
  const owner = await User.findById(pi.userId);
  if (!owner) {
    return next(new AppError('The owner of this Pi no longer exists.', 401));
  }

  req.device = pi;
  req.user = owner;
  next();
});

// Blocks requests authenticated with a device token.
exports.usersOnly = (req, res, next) => {
  if (req.device) {
    return next(
      new AppError('This action requires a user login, not a device.', 403)
    );
  }
  next();
};
