import { hashPassword, verifyPassword } from '../utils/workerPassword.js';
import jwt from 'jsonwebtoken';

export const workerHandlers = {
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
            const password_hash = await hashPassword(password);
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
            const isMatch = await verifyPassword(password, user.password_hash);
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
    // ...add other handlers as needed (e.g., google)
};
