const { AsyncLocalStorage } = require('async_hooks');

// Provides a way to store state across the async execution context of a request
const requestContext = new AsyncLocalStorage();

module.exports = requestContext;
