# Pantry Pulse - Local Development & Cloudflare Deployment

## Local Development

1. Copy `.env.example` to `.env` and fill in your local Postgres credentials.
2. Install dependencies:
   - In `/server`: `npm install`
   - In `/client`: `npm install`
3. Start the server:
   - `npm run dev` (from `/server`)
4. Start the client:
   - `npm start` (from `/client`)
5. The React app will proxy API requests to `http://localhost:8787`.

## Cloudflare Deployment

- The API runs as a Worker using `worker.js` and Hyperdrive for Postgres.
- Static files are served from `/client/build`.
- Configure your Hyperdrive binding in `wrangler.toml`.
- Deploy with `npx wrangler deploy` from the root of `V1  - CloudFlare`.

## Notes
- `server/db.js` auto-detects environment: uses Hyperdrive on Cloudflare, `.env` locally.
- Make sure your database schema is set up before running locally or deploying.
