
const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
// const auth = require('../middleware/auth'); // You will need to adapt auth for both environments

// Express Router
const expressRouter = express.Router();
expressRouter.get('/', async (req, res) => {
    try {
        // req.user should be set by auth middleware
        const result = await db.query('SELECT * FROM freezer_items WHERE user_id = $1', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
expressRouter.post('/', async (req, res) => {
    const { item_name, quantity, category, expiry_date, barcode, group_id, date_added, storage_area_id } = req.body;
    const finalExpiryDate = expiry_date === '' ? null : expiry_date;
    try {
        const newItem = await db.query(
            'INSERT INTO freezer_items (user_id, item_name, quantity, category, expiry_date, barcode, group_id, date_added, storage_area_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [req.user.id, item_name, quantity, category, finalExpiryDate, barcode, group_id, date_added, storage_area_id]
        );
        res.json(newItem.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
expressRouter.put('/:id', async (req, res) => {
    const { item_name, quantity, category, expiry_date, barcode, group_id, date_added, storage_area_id } = req.body;
    const { id } = req.params;
    try {
        const updatedItem = await db.query(
            'UPDATE freezer_items SET item_name = $1, quantity = $2, category = $3, expiry_date = $4, barcode = $5, group_id = $6, date_added = $7, storage_area_id = $8 WHERE id = $9 AND user_id = $10 RETURNING *',
            [item_name, quantity, category, expiry_date, barcode, group_id, date_added, storage_area_id, id, req.user.id]
        );
        if (updatedItem.rows.length === 0) {
            return res.status(404).json({ msg: 'Item not found or user not authorized' });
        }
        res.json(updatedItem.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
expressRouter.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleteOp = await db.query('DELETE FROM freezer_items WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);
        if (deleteOp.rows.length === 0) {
            return res.status(404).json({ msg: 'Item not found or user not authorized' });
        }
        res.json({ msg: 'Item deleted' });
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
            const result = await env.HYPERDRIVE.prepare('SELECT * FROM freezer_items WHERE user_id = ?').bind(userId).all();
            return new Response(JSON.stringify(result.results), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async add(request, env) {
        const { item_name, quantity, category, expiry_date, barcode, group_id, date_added, storage_area_id } = await request.json();
        const finalExpiryDate = expiry_date === '' ? null : expiry_date;
        try {
            const userId = await getUserIdFromRequest(request, env);
            const result = await env.HYPERDRIVE.prepare(
                'INSERT INTO freezer_items (user_id, item_name, quantity, category, expiry_date, barcode, group_id, date_added, storage_area_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *'
            ).bind(userId, item_name, quantity, category, finalExpiryDate, barcode, group_id, date_added, storage_area_id).all();
            return new Response(JSON.stringify(result.results[0]), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async update(request, env) {
        const { item_name, quantity, category, expiry_date, barcode, group_id, date_added, storage_area_id } = await request.json();
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();
        try {
            const userId = await getUserIdFromRequest(request, env);
            const result = await env.HYPERDRIVE.prepare(
                'UPDATE freezer_items SET item_name = ?, quantity = ?, category = ?, expiry_date = ?, barcode = ?, group_id = ?, date_added = ?, storage_area_id = ? WHERE id = ? AND user_id = ? RETURNING *'
            ).bind(item_name, quantity, category, expiry_date, barcode, group_id, date_added, storage_area_id, id, userId).all();
            if (!result.results.length) {
                return new Response(JSON.stringify({ msg: 'Item not found or user not authorized' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
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
            const result = await env.HYPERDRIVE.prepare('DELETE FROM freezer_items WHERE id = ? AND user_id = ? RETURNING *').bind(id, userId).all();
            if (!result.results.length) {
                return new Response(JSON.stringify({ msg: 'Item not found or user not authorized' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ msg: 'Item deleted' }), { headers: { 'Content-Type': 'application/json' } });
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
