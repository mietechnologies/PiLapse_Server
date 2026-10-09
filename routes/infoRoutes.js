const express = require('express');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const { version } = require('../package.json');

const router = express.Router();

// Unauthenticated. Lets a client confirm a URL points at a PiLapse server and
// whether it still needs its first (owner) account.
router.get(
  '/',
  catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      data: {
        name: 'pilapse-server',
        version,
        setupRequired: !(await User.exists({})),
      },
    });
  })
);

module.exports = router;
