const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const jwt = require('jsonwebtoken');

const expressRouter = express.Router();

expressRouter.get('/', async (req, res) => {
    try {
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

module.exports = expressRouter;
