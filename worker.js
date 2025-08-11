
import { Router } from 'itty-router';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
// import db from './server/db';
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
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: null, // We don't need a manifest with this setup
        }
      );
    } catch (e) {
      // If the asset is not found, fall back to the index.html for SPA routing.
      try {
        let notFoundResponse = await getAssetFromKV(
          {
            request: new Request(new URL(request.url).origin + '/index.html', request),
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: null,
          }
        );
        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 200,
        });
      } catch (e) {
        return new Response(`Asset not found. Tried to serve ${new URL(request.url).origin}/index.html`, { status: 404 });
      }
    }
  },
};
