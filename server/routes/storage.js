
let expressRouter, workerHandlers;
try {
    expressRouter = require('./storage.express.js');
} catch (e) {}
try {
    workerHandlers = null;
} catch (e) {}

module.exports = {
    expressRouter,
    workerHandlers
};
