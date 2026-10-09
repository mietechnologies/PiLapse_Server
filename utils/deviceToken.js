const crypto = require('crypto');

exports.generate = () => crypto.randomBytes(32).toString('hex');

exports.hash = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');
