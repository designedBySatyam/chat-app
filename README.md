# Novyn Chat

A minimal web chat app with:
- Username + password authentication
- Add friends (send/accept requests)
- Real-time one-to-one chat
- Online/offline status
- Typing indicator
- Message status (`sent`, `delivered`, `seen`)
- Unread counts + last message preview
- Managed MongoDB persistence (optional)
- Configurable message retention window (`CHAT_RETENTION_DAYS`)

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

To test real-time chat, open two browser windows (or different devices) and login with different accounts.

## Modular architecture status

The app now runs with:

- Stable backend runtime: `server.js` (socket contract unchanged)
- Modular frontend runtime: `src/main.js` + `src/app|pages|components|ai`
- Theme modules: `src/theme/*` and `src/styles/*`
- Three.js login scene: `src/pages/login/LoginScene3D.js`

The transitional server scaffold is still present in `server/` for ongoing backend extraction.

## Database setup (MongoDB)

Set these environment variables:

- `MONGODB_URI`: your MongoDB connection string
- `MONGODB_DB` (optional): database name (default: `novyn`)
- `CHAT_RETENTION_DAYS` (optional): number of days to keep chat history (default: `30`)
- `ANTHROPIC_API_KEY` (optional): enables Novyn AI (`/api/ai` proxy route)

If `MONGODB_URI` is not set, the app falls back to local file storage at `data/chat-state.json`.

## Deploy so it works from any location

You can deploy this Node app to services like Render, Railway, Fly.io, or a VPS.

1. Push this folder to GitHub.
2. Create a new Web Service on your host.
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Expose port from `PORT` environment variable (already supported in `server.js`).
6. Add env vars:
   - `MONGODB_URI`
   - `MONGODB_DB` (optional)
   - `CHAT_RETENTION_DAYS` (optional, e.g. `30`)
   - `ANTHROPIC_API_KEY` (optional, required for AI features)

After deployment, anyone can access your public URL and chat in real time.

## Important note

This app prunes old messages automatically based on `CHAT_RETENTION_DAYS`. Friend lists and account data are preserved; only chat history older than your configured days is removed.

## PWA cache versioning

The service worker cache key is tied to `<meta name="novyn-build">` in [`public/index.html`](public/index.html).

On each deploy:
1. Bump `novyn-build` (example: `2026.03.08.2`).
2. Deploy.

This forces a new `sw.js?v=<build>` registration so users get fresh assets without hard-refreshing.
