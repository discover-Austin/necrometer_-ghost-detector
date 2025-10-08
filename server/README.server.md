# Necrometer AI Proxy Server

This lightweight Express server proxies requests from the client to the Google GenAI (Gemini) APIs. It keeps your API key on the server and provides token-based access control to clients.

## Setup

1. Install dependencies:

```bash
cd server
npm install
```

2. Configure environment variables before starting the server:

- `API_KEY` (required): Your Google GenAI API key.
- `SHARED_TOKEN` (optional): A shared bearer token clients must provide. Defaults to `replace-me-with-a-secret`. Set this to a secure value.
- `PORT` (optional): Port to listen on (defaults to 4000).

3. Start server:

```bash
API_KEY=your_key SHARED_TOKEN=your_token npm start
```

## Endpoints

- `GET /health` — basic health check.
- `POST /api/analyze-scene` — body: `{ imageBase64: string }` — returns scene analysis JSON.
- `POST /api/generate-glyph` — body: `{ name: string, type: string }` — returns `{ glyphB64 }`.
- `POST /api/temporal-echo` — no body — returns temporal echo JSON.
- `POST /api/cross-reference` — body: `{ name: string, type: string }` — returns cross-reference JSON.

Auth and token issuance
-----------------------
The server now uses short-lived JWTs for API access. To obtain a JWT, the client must call the issuance endpoint using the `SHARED_ISSUANCE_TOKEN`:

- `POST /issue-token` — include header `Authorization: Bearer <SHARED_ISSUANCE_TOKEN>` to receive `{ token }` (short-lived JWT, 15 minutes).

Use the returned token when calling the API endpoints:

- Header: `Authorization: Bearer <token>`

Rate limiting
-------------
API endpoints are rate-limited to 60 requests per minute per IP by default (adjust in `index.js`). For production deployments, consider adding stricter auth and per-account quotas.

## Security
- Keep `API_KEY` and `SHARED_TOKEN` secret. Do NOT commit them to source control.
- Consider adding rate limiting and authentication if exposing this server publicly.
