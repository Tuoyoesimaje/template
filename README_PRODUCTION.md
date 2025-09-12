Render deployment notes

1. Secure secrets
- Create a `.env` file on Render (or use Render's Environment settings) with the following keys:
  - GEMINI_API_URL
  - GEMINI_API_KEY
  - JWT_SECRET
  - DB_PATH (optional)
  - PORT (Render sets this automatically)

2. Build & start
- Render should run `npm install` (postinstall will run `npm run build`), and then use `npm start` which runs `node server.js`.
- The server serves the built Vite `dist/` directory when `NODE_ENV=production` is set.

3. Database
- This project uses sqlite by default (`studentbuddy.db`). For production, prefer an external managed database and set `DB_PATH` appropriately.

4. Notes
- Do NOT commit your `.env` file; this repo includes `.env.example` and `.gitignore` ignores `.env`.
- Ensure your GEMINI_API_URL and GEMINI_API_KEY are valid and have production quotas.

---

Render-specific checklist

- Create a new Web Service on Render from this repository.
- In Render dashboard -> Environment, add these variables:
  - `GEMINI_API_URL` (required)
  - `GEMINI_API_KEY` (optional)
  - `JWT_SECRET` (required)
  - `DB_PATH` (optional; if left empty the app uses `studentbuddy.db` in the project root)
  - `NODE_ENV=production`

- Build Command: `npm run build`
- Start Command: `npm start`

Persistent disk for SQLite on Render

- Render's filesystem is ephemeral on the instance that runs your service. To persist SQLite data across deploys and restarts you must attach a Persistent Disk or use an external DB.
- Options:
  1) Attach a Render Persistent Disk and set `DB_PATH` to the mount path (e.g. `/mnt/data/studentbuddy.db`).
  2) Migrate to a managed database (Postgres/MySQL) and update `server.js` to use that DB instead of sqlite. This is recommended for production workloads.

Security note

- Do NOT store secrets in the repo. Use Render's Environment variables UI or a secrets manager.

