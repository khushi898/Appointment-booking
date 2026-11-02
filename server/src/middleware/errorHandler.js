// Central error handler: every error in the app ends up here.
// It converts known error types into clean JSON and never sends stack traces to the client.
// Express recognises it as an error handler because it has 4 parameters.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  if (err.type === 'entity.parse.failed') {
    // express.json() could not parse the request body
    statusCode = 400;
    message = 'Malformed JSON in request body';
  } else if (err.name === 'ValidationError') {
    // Mongoose schema validation failed (required, min/max, enum...)
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    // e.g. "abc" passed where a MongoDB ObjectId is expected
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    // MongoDB unique index violation
    statusCode = 409;
    message = `Duplicate value for: ${Object.keys(err.keyValue || {}).join(', ')}`;
  }

  if (statusCode >= 500) {
    // Log the full error on the server only; the client gets a generic message.
    if (process.env.NODE_ENV !== 'test') console.error(err);
    message = 'Internal server error';
    details = undefined;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
  });
}

module.exports = errorHandler;
