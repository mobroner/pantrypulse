import jwt from 'jsonwebtoken';

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
                    ig.user_id = ?
                GROUP BY 
                    ig.id
                ORDER BY 
                    ig.group_name;
            `;
            const result = await env.HYPERDRIVE.prepare(query).bind(userId).all();
            return new Response(JSON.stringify(result.results), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async add(request, env) {
        const { group_name, description } = await request.json();
        try {
            const userId = await getUserIdFromRequest(request, env);
            const result = await env.HYPERDRIVE.prepare(
                'INSERT INTO item_groups (user_id, group_name, description) VALUES (?, ?, ?) RETURNING *'
            ).bind(userId, group_name, description).all();
            return new Response(JSON.stringify(result.results[0]), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    },
    async update(request, env) {
        const { group_name, description } = await request.json();
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();
        try {
            const userId = await getUserIdFromRequest(request, env);
            const result = await env.HYPERDRIVE.prepare(
                'UPDATE item_groups SET group_name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? RETURNING *'
            ).bind(group_name, description, id, userId).all();
            if (!result.results.length) {
                return new Response(JSON.stringify({ msg: 'Group not found or user not authorized' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
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
            await env.HYPERDRIVE.prepare('UPDATE freezer_items SET group_id = NULL WHERE group_id = ? AND user_id = ?').bind(id, userId).all();
            const result = await env.HYPERDRIVE.prepare('DELETE FROM item_groups WHERE id = ? AND user_id = ? RETURNING *').bind(id, userId).all();
            if (!result.results.length) {
                return new Response(JSON.stringify({ msg: 'Group not found or user not authorized' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ msg: 'Group deleted and items un-grouped' }), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error(err.message);
            return new Response('Server Error', { status: 500 });
        }
    }
};
