# Simple Friends Chat

A minimal web chat app with:
- Username-based login
- Add friends (send/accept requests)
- Real-time one-to-one chat
- Online/offline status

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

To test real-time chat, open two browser windows (or different devices) and join with different usernames.

## Deploy so it works from any location

You can deploy this Node app to services like Render, Railway, Fly.io, or a VPS.

1. Push this folder to GitHub.
2. Create a new Web Service on your host.
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Expose port from `PORT` environment variable (already supported in `server.js`).

After deployment, anyone can access your public URL and chat in real time.

## Important note

This version stores users/friends/messages in memory, so data resets when the server restarts. If you want persistence and real accounts, next step is adding a database + authentication.