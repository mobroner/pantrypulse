const bcrypt = require('bcrypt');

const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
// const auth = require('../middleware/auth');

// Express Router
const expressRouter = express.Router();
expressRouter.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM storage_areas WHERE user_id = $1', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
expressRouter.post('/', async (req, res) => {
    const { name } = req.body;
    try {
        const newStorageArea = await db.query(
            'INSERT INTO storage_areas (user_id, name) VALUES ($1, $2) RETURNING *',
            [req.user.id, name]
        );
        res.json(newStorageArea.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
expressRouter.put('/:id', async (req, res) => {
    const { name } = req.body;
    const { id } = req.params;
    try {
        const updatedStorageArea = await db.query(
            'UPDATE storage_areas SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [name, id, req.user.id]
        );
        if (updatedStorageArea.rows.length === 0) {
            return res.status(404).json({ msg: 'Storage area not found or user not authorized' });
        }
        res.json(updatedStorageArea.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
expressRouter.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleteOp = await db.query('DELETE FROM storage_areas WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);
        if (deleteOp.rows.length === 0) {
            return res.status(404).json({ msg: 'Storage area not found or user not authorized' });
        }
        res.json({ msg: 'Storage area deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
expressRouter.post('/:id/groups', async (req, res) => {
    const { group_id } = req.body;
    const { id } = req.params;
    try {
        const newLink = await db.query(
            'INSERT INTO storage_area_groups (storage_area_id, group_id) VALUES ($1, $2) RETURNING *',
            [id, group_id]
        );
        res.json(newLink.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
expressRouter.delete('/:id/groups/:group_id', async (req, res) => {
    const { id, group_id } = req.params;
    try {
        const deleteOp = await db.query('DELETE FROM storage_area_groups WHERE storage_area_id = $1 AND group_id = $2 RETURNING *', [id, group_id]);
        if (deleteOp.rows.length === 0) {
            return res.status(404).json({ msg: 'Link not found or user not authorized' });
        }
        res.json({ msg: 'Group removed from storage area' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
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
    async getAll(request, env) {
        try {
            const userId = await getUserIdFromRequest(request, env);
            const result = await env.HYPERDRIVE.prepare('SELECT * FROM storage_areas WHERE user_id = ?').bind(userId).all();
            return new Response(JSON.stringify(result.results), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async add(request, env) {
        const { name } = await request.json();
        try {
            const userId = await getUserIdFromRequest(request, env);
            const result = await env.HYPERDRIVE.prepare(
                'INSERT INTO storage_areas (user_id, name) VALUES (?, ?) RETURNING *'
            ).bind(userId, name).all();
            return new Response(JSON.stringify(result.results[0]), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async update(request, env) {
        const { name } = await request.json();
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();
        try {
            const userId = await getUserIdFromRequest(request, env);
            const result = await env.HYPERDRIVE.prepare(
                'UPDATE storage_areas SET name = ? WHERE id = ? AND user_id = ? RETURNING *'
            ).bind(name, id, userId).all();
            if (!result.results.length) {
                return new Response(JSON.stringify({ msg: 'Storage area not found or user not authorized' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify(result.results[0]), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async remove(request, env) {
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();
        try {
            const userId = await getUserIdFromRequest(request, env);
            const result = await env.HYPERDRIVE.prepare('DELETE FROM storage_areas WHERE id = ? AND user_id = ? RETURNING *').bind(id, userId).all();
            if (!result.results.length) {
                return new Response(JSON.stringify({ msg: 'Storage area not found or user not authorized' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ msg: 'Storage area deleted' }), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async addGroup(request, env) {
        const url = new URL(request.url);
        const id = url.pathname.split('/')[url.pathname.split('/').length - 2];
        const { group_id } = await request.json();
        try {
            const result = await env.HYPERDRIVE.prepare(
                'INSERT INTO storage_area_groups (storage_area_id, group_id) VALUES (?, ?) RETURNING *'
            ).bind(id, group_id).all();
            return new Response(JSON.stringify(result.results[0]), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async removeGroup(request, env) {
        const url = new URL(request.url);
        const parts = url.pathname.split('/');
        const id = parts[parts.length - 3];
        const group_id = parts[parts.length - 1];
        try {
            const result = await env.HYPERDRIVE.prepare('DELETE FROM storage_area_groups WHERE storage_area_id = ? AND group_id = ? RETURNING *').bind(id, group_id).all();
            if (!result.results.length) {
                return new Response(JSON.stringify({ msg: 'Link not found or user not authorized' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ msg: 'Link deleted' }), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    }
};


module.exports = {
    expressRouter,
    workerHandlers
};
