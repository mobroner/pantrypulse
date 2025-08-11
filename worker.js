import { Router } from 'itty-router';
import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler';
import { workerAuth } from './server/middleware/auth';
import { workerHandlers as authHandlers } from './server/routes/auth.worker.js';
import { workerHandlers as itemHandlers } from './server/routes/items.worker.js';
import { workerHandlers as groupHandlers } from './server/routes/groups.worker.js';
import { workerHandlers as storageHandlers } from './server/routes/storage.worker.js';

const router = Router();

// Auth
router.post('/api/auth/register', (req, env, ctx) => authHandlers.register(req, env, ctx));
router.post('/api/auth/login', (req, env, ctx) => authHandlers.login(req, env, ctx));
router.get('/api/auth/google', (req, env, ctx) => authHandlers.google(req, env, ctx));

// Items
router.get('/api/items', workerAuth, (req, env, ctx) => itemHandlers.getAll(req, env, ctx));
router.post('/api/items', workerAuth, (req, env, ctx) => itemHandlers.add(req, env, ctx));
router.put('/api/items/:id', workerAuth, (req, env, ctx) => itemHandlers.update(req, env, ctx));
router.delete('/api/items/:id', workerAuth, (req, env, ctx) => itemHandlers.remove(req, env, ctx));

// Groups
router.get('/api/groups', workerAuth, (req, env, ctx) => groupHandlers.getAll(req, env, ctx));
router.post('/api/groups', workerAuth, (req, env, ctx) => groupHandlers.add(req, env, ctx));
router.put('/api/groups/:id', workerAuth, (req, env, ctx) => groupHandlers.update(req, env, ctx));
router.delete('/api/groups/:id', workerAuth, (req, env, ctx) => groupHandlers.remove(req, env, ctx));

// Storage
router.get('/api/storage', workerAuth, (req, env, ctx) => storageHandlers.getAll(req, env, ctx));
router.post('/api/storage', workerAuth, (req, env, ctx) => storageHandlers.add(req, env, ctx));
router.put('/api/storage/:id', workerAuth, (req, env, ctx) => storageHandlers.update(req, env, ctx));
router.delete('/api/storage/:id', workerAuth, (req, env, ctx) => storageHandlers.remove(req, env, ctx));
router.post('/api/storage/:id/groups', workerAuth, (req, env, ctx) => storageHandlers.addGroup(req, env, ctx));
router.delete('/api/storage/:id/groups/:group_id', workerAuth, (req, env, ctx) => storageHandlers.removeGroup(req, env, ctx));

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return router.handle(request, env, ctx);
    }

    try {
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.STATIC_CONTENT,
          ASSET_MANIFEST: JSON.parse(await env.STATIC_CONTENT.get('asset-manifest.json')),
          mapRequestToAsset: (req) => {
            const url = new URL(req.url);
            if (url.pathname.startsWith('/static/')) {
              return mapRequestToAsset(req);
            }
            return new Request(`${url.origin}/index.html`, req);
          },
        }
      );
    } catch (e) {
      return new Response('Not found', { status: 404 });
    }
  },
};
