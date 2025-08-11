

// Export the correct router/handlers for each environment
let expressRouter, workerHandlers;
try {
    // Try to require for Node.js/Express
    expressRouter = require('./auth.express.js');
} catch (e) {}
try {
    // Try to import for Worker (ESM)
    // This will only work in ESM context
    // (worker.js should use: import { workerHandlers } from './server/routes/auth.worker.js')
    // So we just export a placeholder here
    workerHandlers = null;
} catch (e) {}

module.exports = {
    expressRouter,
    workerHandlers
};
