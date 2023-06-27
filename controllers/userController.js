const factory = require('../utils/handlerFactory');
const User = require('../models/userModel');

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = factory.getOne(User);
