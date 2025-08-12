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
