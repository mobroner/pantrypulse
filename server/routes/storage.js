
const express = require('express');
const db = require('../db');
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

// Worker-style handlers
const workerHandlers = {
    async getAll(request) {
        try {
            const result = await db.query('SELECT * FROM storage_areas WHERE user_id = $1', [request.user.id]);
            return new Response(JSON.stringify(result.rows), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async add(request) {
        const { name } = await request.json();
        try {
            const newStorageArea = await db.query(
                'INSERT INTO storage_areas (user_id, name) VALUES ($1, $2) RETURNING *',
                [request.user.id, name]
            );
            return new Response(JSON.stringify(newStorageArea.rows[0]), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async update(request) {
        const { name } = await request.json();
        const { id } = request.params;
        try {
            const updatedStorageArea = await db.query(
                'UPDATE storage_areas SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
                [name, id, request.user.id]
            );
            if (updatedStorageArea.rows.length === 0) {
                return new Response(JSON.stringify({ msg: 'Storage area not found or user not authorized' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify(updatedStorageArea.rows[0]), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async remove(request) {
        const { id } = request.params;
        try {
            const deleteOp = await db.query('DELETE FROM storage_areas WHERE id = $1 AND user_id = $2 RETURNING *', [id, request.user.id]);
            if (deleteOp.rows.length === 0) {
                return new Response(JSON.stringify({ msg: 'Storage area not found or user not authorized' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ msg: 'Storage area deleted' }), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async addGroup(request) {
        const { group_id } = await request.json();
        const { id } = request.params;
        try {
            const newLink = await db.query(
                'INSERT INTO storage_area_groups (storage_area_id, group_id) VALUES ($1, $2) RETURNING *',
                [id, group_id]
            );
            return new Response(JSON.stringify(newLink.rows[0]), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async removeGroup(request) {
        const { id, group_id } = request.params;
        try {
            const deleteOp = await db.query('DELETE FROM storage_area_groups WHERE storage_area_id = $1 AND group_id = $2 RETURNING *', [id, group_id]);
            if (deleteOp.rows.length === 0) {
                return new Response(JSON.stringify({ msg: 'Link not found or user not authorized' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ msg: 'Group removed from storage area' }), { headers: { 'Content-Type': 'application/json' } });
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
