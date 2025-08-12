const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const jwt = require('jsonwebtoken');

const expressRouter = express.Router();

expressRouter.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                ig.id, 
                ig.group_name, 
                ig.description, 
                COALESCE(
                    json_agg(
                        json_build_object('id', sa.id, 'name', sa.name)
                    ) FILTER (WHERE sa.id IS NOT NULL), 
                    '[]'
                ) as storage_areas
            FROM 
                item_groups ig
            LEFT JOIN 
                storage_area_groups sag ON ig.id = sag.group_id
            LEFT JOIN 
                storage_areas sa ON sag.storage_area_id = sa.id
            WHERE 
                ig.user_id = $1
            GROUP BY 
                ig.id
            ORDER BY 
                ig.group_name;
        `;
        const result = await db.query(query, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

expressRouter.post('/', async (req, res) => {
    const { group_name, description } = req.body;
    try {
        const newGroup = await db.query(
            'INSERT INTO item_groups (user_id, group_name, description) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, group_name, description]
        );
        res.json(newGroup.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

expressRouter.put('/:id', async (req, res) => {
    const { group_name, description } = req.body;
    const { id } = req.params;
    try {
        const updatedGroup = await db.query(
            'UPDATE item_groups SET group_name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
            [group_name, description, id, req.user.id]
        );
        if (updatedGroup.rows.length === 0) {
            return res.status(404).json({ msg: 'Group not found or user not authorized' });
        }
        res.json(updatedGroup.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

expressRouter.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE freezer_items SET group_id = NULL WHERE group_id = $1 AND user_id = $2', [id, req.user.id]);
        const deleteOp = await db.query('DELETE FROM item_groups WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);
        if (deleteOp.rows.length === 0) {
            return res.status(404).json({ msg: 'Group not found or user not authorized' });
        }
        res.json({ msg: 'Group deleted and items un-grouped' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = expressRouter;
