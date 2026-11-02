// An Error that also carries an HTTP status code.
// Controllers throw it (e.g. `throw new ApiError(404, 'Service not found')`)
// and the central error handler turns it into a JSON response.
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = ApiError;
