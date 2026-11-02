const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');

// POST /api/auth/register — creates a normal user (never an admin) and logs them in.
async function register(req, res) {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // role is not passed in, so the schema default 'user' is always used
  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    data: { token: signToken(user), user },
  });
}

// POST /api/auth/login — checks email + password and returns a JWT.
async function login(req, res) {
  const { email, password } = req.body;

  // password has select:false, so we must ask for it explicitly here
  const user = await User.findOne({ email }).select('+password');

  // Same message for "no such email" and "wrong password", so attackers
  // can't use the login form to find out which emails are registered.
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  res.status(200).json({
    success: true,
    data: { token: signToken(user), user },
  });
}

// GET /api/auth/me — returns the logged-in user (set on req.user by protect).
function getMe(req, res) {
  res.status(200).json({ success: true, data: { user: req.user } });
}

module.exports = { register, login, getMe };
