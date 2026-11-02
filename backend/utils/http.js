// Wraps an async route handler so any thrown error goes to the central error
// handler instead of crashing the Node process.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Create an Error that carries an HTTP status code.
const httpError = (status, message) => Object.assign(new Error(message), { status });

module.exports = { asyncHandler, httpError };