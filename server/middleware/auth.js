const jwt = require('jsonwebtoken');

// Express middleware
const expressAuth = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ msg: 'Token is not valid' });
    }
    const token = tokenParts[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Worker middleware
const workerAuth = (request) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
        return new Response(JSON.stringify({ msg: 'No token, authorization denied' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return new Response(JSON.stringify({ msg: 'Token is not valid' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const token = tokenParts[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        request.user = decoded;
    } catch (err) {
        return new Response(JSON.stringify({ msg: 'Token is not valid' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
};

module.exports = {
    expressAuth,
    workerAuth
};
