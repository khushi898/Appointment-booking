// Runs before every test file. Gives tests their own safe values so they
// never depend on (or touch) the real .env. dotenv does not overwrite
// variables that are already set, so these win.
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.AUTH_RATE_LIMIT_MAX = process.env.AUTH_RATE_LIMIT_MAX || '1000';
