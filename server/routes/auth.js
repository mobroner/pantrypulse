
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// Generate JWT
const generateToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
};


// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    try {
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const newUserResult = await db.query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *',
            [email, password_hash, email.split('@')[0]]
        );
        const newUser = newUserResult.rows[0];
        const token = generateToken(newUser);
        return res.status(201).json({ token });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ message: 'Server error during registration.' });
    }
});


// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    try {
        console.log(`Login attempt for email: ${email}`);
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) {
            console.log(`No user found for email: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        if (!user.password_hash) {
            console.log(`User ${email} has no password hash set.`);
            return res.status(401).json({ message: 'Invalid credentials or user does not have a password set.' });
        }

        console.log(`Comparing password for user: ${email}`);
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            console.log(`Password mismatch for user: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        console.log(`Password match for user: ${email}. Generating token.`);
        const token = generateToken(user);
        return res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error during login.', error: err.message });
    }
});

// GET /api/auth/google - Initiates Google Login
router.get('/google', (req, res) => {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID);
    url.searchParams.append('redirect_uri', process.env.GOOGLE_CALLBACK_URL);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', 'profile email');
    res.redirect(url.toString());
});

// GET /api/auth/google/callback - Google OAuth Callback
router.get('/google/callback', async (request) => {
    const { code } = request.query;

    try {
        // Exchange code for token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_CALLBACK_URL,
                grant_type: 'authorization_code',
            }),
        });
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Fetch user profile
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const profile = await profileResponse.json();
        const { id, name, email } = profile;

        let userResult = await db.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [id, email]);
        let user = userResult.rows[0];

        if (user) {
            if (!user.google_id) {
                await db.query('UPDATE users SET google_id = $1, name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [id, name, user.id]);
            }
        } else {
            const newUserResult = await db.query(
                'INSERT INTO users (google_id, email, name) VALUES ($1, $2, $3) RETURNING *',
                [id, email, name]
            );
            user = newUserResult.rows[0];
        }

        const jwtToken = generateToken(user);
        const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
        redirectUrl.searchParams.append('token', jwtToken);

        return new Response(null, { status: 302, headers: { Location: redirectUrl.toString() } });
    } catch (err) {
        console.error('Google OAuth error:', err);
        return new Response(JSON.stringify({ message: 'Google OAuth failed.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});

// Helper to extract user id from JWT in Authorization header
async function getUserIdFromRequest(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid Authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        return decoded.id;
    } catch (e) {
        throw new Error('Invalid token');
    }
}

const workerHandlers = {
    async register(request, env) {
        const { email, password } = await request.json();
        if (!email || !password) {
            return new Response(JSON.stringify({ message: 'Email and password are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        try {
            const existingUser = await env.HYPERDRIVE.prepare('SELECT * FROM users WHERE email = ?').bind(email).all();
            if (existingUser.results.length > 0) {
                return new Response(JSON.stringify({ message: 'User with this email already exists.' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
            }
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            const newUserResult = await env.HYPERDRIVE.prepare(
                'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?) RETURNING *'
            ).bind(email, password_hash, email.split('@')[0]).all();
            const newUser = newUserResult.results[0];
            const token = jwt.sign({ id: newUser.id, email: newUser.email }, env.JWT_SECRET, { expiresIn: '1h' });
            return new Response(JSON.stringify({ token }), { status: 201, headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error('Registration error:', err);
            return new Response(JSON.stringify({ message: 'Server error during registration.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    },
    async login(request, env) {
        const { email, password } = await request.json();
        if (!email || !password) {
            return new Response(JSON.stringify({ message: 'Email and password are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        try {
            const userResult = await env.HYPERDRIVE.prepare('SELECT * FROM users WHERE email = ?').bind(email).all();
            const user = userResult.results[0];
            if (!user || !user.password_hash) {
                return new Response(JSON.stringify({ message: 'Invalid credentials or user does not have a password set.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return new Response(JSON.stringify({ message: 'Invalid credentials.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }
            const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '1h' });
            return new Response(JSON.stringify({ token }), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error('Login error:', err);
            return new Response(JSON.stringify({ message: 'Server error during login.', error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    },
    // Add other handlers as needed (e.g., google)
};


module.exports = {
    expressRouter: router,
    workerHandlers
};
