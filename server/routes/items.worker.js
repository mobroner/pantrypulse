import jwt from 'jsonwebtoken';

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

export const workerHandlers = {
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
