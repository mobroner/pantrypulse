
import { Router } from 'itty-router';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import db from './server/db';
import { workerAuth } from './server/middleware/auth';
import { workerHandlers as authHandlers } from './server/routes/auth';
import { workerHandlers as itemHandlers } from './server/routes/items';
import { workerHandlers as groupHandlers } from './server/routes/groups';
import { workerHandlers as storageHandlers } from './server/routes/storage';

const router = Router();

// Auth
router.post('/api/auth/register', authHandlers.register);
router.post('/api/auth/login', authHandlers.login);
router.get('/api/auth/google', authHandlers.google);

// Items
router.get('/api/items', workerAuth, itemHandlers.getAll);
router.post('/api/items', workerAuth, itemHandlers.add);
router.put('/api/items/:id', workerAuth, itemHandlers.update);
router.delete('/api/items/:id', workerAuth, itemHandlers.remove);

// Groups
router.get('/api/groups', workerAuth, groupHandlers.getAll);
router.post('/api/groups', workerAuth, groupHandlers.add);
router.put('/api/groups/:id', workerAuth, groupHandlers.update);
router.delete('/api/groups/:id', workerAuth, groupHandlers.remove);

// Storage
router.get('/api/storage', workerAuth, storageHandlers.getAll);
router.post('/api/storage', workerAuth, storageHandlers.add);
router.put('/api/storage/:id', workerAuth, storageHandlers.update);
router.delete('/api/storage/:id', workerAuth, storageHandlers.remove);
router.post('/api/storage/:id/groups', workerAuth, storageHandlers.addGroup);
router.delete('/api/storage/:id/groups/:group_id', workerAuth, storageHandlers.removeGroup);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      db.init(env);
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
          ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
        }
      );
    } catch (e) {
      const pathname = new URL(request.url).pathname;
      if (pathname.match(/(\.\w*|__.*)$/)) {
        return new Response(null, { status: 404 });
      }
      const notFoundRequest = new Request(new URL(request.url).origin, request);
      return await getAssetFromKV(
        {
          request: notFoundRequest,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
        }
      );
    }
  },
};
