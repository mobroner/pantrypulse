
let expressRouter, workerHandlers;
try {
    expressRouter = require('./items.express.js');
} catch (e) {}
try {
    // For Worker (ESM): import { workerHandlers } from './items.worker.js'
    workerHandlers = null;
} catch (e) {}

module.exports = {
    expressRouter,
    workerHandlers
};
