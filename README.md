Local Gemini proxy (example)

This repository includes a tiny Node.js proxy you can run locally to forward requests to the Google Generative Language (Gemini) API and avoid CORS/key exposure issues from the browser.

Files added:
- `server.js` - Express server that forwards POST /gemini to the GEMINI_API_URL using `X-goog-api-key`.
- `package.json` - dependencies and start script.
- `.env.example` - example environment variables.

Quick start
1. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` and `GEMINI_API_URL`.
2. Install dependencies:

```powershell
cd "c:\Users\LOGICMIND COMPUTERS\main work\personal projects\template";
npm install
```

3. Ensure you are running Node 18+ (native fetch is required). Then start the proxy:

```powershell
npm start
```

4. In the app, set the endpoint to your local proxy:

```
.setEndpoint http://localhost:3000/gemini
```

5. Set your API key in the app (optional, server uses .env GEMINI_API_KEY):

```
.setApiKey YOUR_GEMINI_API_KEY
```

6. Request a quiz:

```
.quiz climate change impacts
```

Notes
- This is a minimal example for local development. In production, secure the proxy, restrict origins, and store keys in a secret manager.
- The proxy will prefer server-side `GEMINI_API_KEY` from `.env`. If not set, it will forward the client's X-goog-api-key header if provided.
