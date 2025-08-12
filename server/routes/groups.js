
let expressRouter, workerHandlers;
try {
    expressRouter = require('./groups.express.js');
} catch (e) {}
try {
    workerHandlers = null;
} catch (e) {}

module.exports = {
    expressRouter,
    workerHandlers
};
