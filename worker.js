import { Router } from 'itty-router';
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

const indexHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><link rel="icon" href="/favicon.ico"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#000000"/><meta name="description" content="Web site created using create-react-app"/><link rel="apple-touch-icon" href="/logo192.png"/><link rel="manifest" href="/manifest.json"/><title>React App</title><script defer="defer" src="/static/js/main.20a4ff86.js"></script><link href="/static/css/main.0c077ec3.css" rel="stylesheet"></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body></html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return router.handle(request, env, ctx);
    }
    return new Response(indexHtml, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    });
  },
};
