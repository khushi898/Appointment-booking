const ApiError = require('../utils/ApiError');

// Returns a middleware that checks req.body against a Zod schema.
// Valid: req.body is replaced with the cleaned data (trimmed, unknown fields removed).
// Invalid: 400 with a list of { field, message } so the frontend can show them.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ApiError(400, 'Validation failed', details));
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
