const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');

// 401 = "I don't know who you are" (no token, bad token, expired token).
// Expects the header:  Authorization: Bearer <token>
async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Not authenticated: token missing');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired, please log in again' : 'Invalid token';
    throw new ApiError(401, message);
  }

  // Load the user fresh from the DB so a deleted user's old token stops working
  // and the role always comes from the database, not just from the token.
  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'User for this token no longer exists');
  }

  req.user = user;
  next();
}

// 403 = "I know who you are, but you're not allowed". Must run after protect.
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Forbidden: admin access only');
  }
  next();
}

module.exports = { protect, adminOnly };
