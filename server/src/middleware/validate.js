const ApiError = require('../utils/ApiError');

// Returns a middleware that checks req.body (default) or req.query against a Zod schema.
// Valid: the cleaned data (trimmed, defaults applied, unknown fields removed) replaces
//        req.body, or is put on req.validatedQuery (Express 5 makes req.query read-only).
// Invalid: 400 with a list of { field, message } so the frontend can show them.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ApiError(400, 'Validation failed', details));
    }
    if (source === 'query') {
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }
    next();
  };
}

module.exports = validate;
