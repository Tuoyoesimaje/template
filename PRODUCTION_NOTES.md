Render deployment notes

1) Summary
- This app is a Node/Express backend with a Vite-built frontend. The server proxies requests to a Gemini (Generative Language) API via the /gemini endpoint.

2) Environment variables (set these in Render dashboard or your environment)
- GEMINI_API_URL   (required) e.g. https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
- GEMINI_API_KEY   (optional) API key for Gemini if used
- JWT_SECRET       (required) long random secret for signing JWTs
- DB_PATH          (optional) path to SQLite DB file (default: studentbuddy.db)
- PORT             (optional) server port (default: 3000)
- NODE_ENV=production recommended

3) Build & Start commands for Render
- Build Command: npm run build
- Start Command: npm start

Render will run npm install, then the Build Command, then run the Start Command. The server serves the built frontend from ./dist when NODE_ENV=production.

4) Important: SQLite storage is ephemeral on many PaaS platforms
- Render's filesystem is ephemeral. Using SQLite means your database will not persist across deploys or instance restarts.
- Recommended: use a managed Postgres or MySQL database and update server.js to use that instead of SQLite, or attach a persistent disk. For quick testing you can keep SQLite but be aware of data loss risk.

5) Security
- Do NOT commit a real .env file. This repo includes .env.example; copy to .env locally and fill in secrets.
- .env is listed in .gitignore to prevent accidental commits.

6) Post-deploy checklist
- Set the required environment variables in Render (GEMINI_API_URL, JWT_SECRET, GEMINI_API_KEY if needed).
- If you need persistent storage, configure an external DB and update server code accordingly.
- Verify that the Gemini proxy works by sending a test request to /gemini (authenticated requests will include X-StudentBuddy-User header when applicable).

7) Helpful commands
- Local dev (two terminals): npm run dev (starts Vite) and node server.js (starts backend)
- Local single-terminal dev (Windows-friendly): npm run dev:one
- Build: npm run build
- Start production locally: NODE_ENV=production node server.js
