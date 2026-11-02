const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

// Creates a signed JWT containing the user's id ("sub" = subject) and role.
// Signed with our secret, so nobody can change the role without the signature breaking.
function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

// Throws if the token was tampered with, signed with another secret, or has expired.
function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signToken, verifyToken };
