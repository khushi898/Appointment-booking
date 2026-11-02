const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');

// Reads "Authorization: Bearer <token>" and returns the token, or null if absent.
function getBearerToken(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

// Verifies the token and loads its user from the DB. Throws 401 if anything is wrong.
async function getUserFromToken(token) {
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
  return user;
}

// 401 = "I don't know who you are" (no token, bad token, expired token).
async function protect(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    throw new ApiError(401, 'Not authenticated: token missing');
  }
  req.user = await getUserFromToken(token);
  next();
}

// For public routes that show extra data to logged-in users (e.g. admins see
// inactive services). No token = continue as a guest; a bad token is still a 401.
async function optionalAuth(req, res, next) {
  const token = getBearerToken(req);
  if (token) {
    req.user = await getUserFromToken(token);
  }
  next();
}

// 403 = "I know who you are, but you're not allowed". Must run after protect.
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Forbidden: admin access only');
  }
  next();
}

module.exports = { protect, optionalAuth, adminOnly };
