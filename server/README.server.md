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
- `JWT_ISSUER_SECRET` (required): Secret used to sign short-lived JWTs.
- `SHARED_ISSUANCE_TOKEN` (required): A shared bearer token clients use to request a short-lived JWT from `/issue-token`.
- `PORT` (optional): Port to listen on (defaults to 4000).

3. Start server (example using PowerShell):

```pwsh
$env:API_KEY='your_key'; $env:JWT_ISSUER_SECRET='your_jwt_secret'; $env:SHARED_ISSUANCE_TOKEN='your_shared_token'; npm start
```

## Endpoints

- `GET /health` — basic health check.
- `POST /api/analyze-scene` — body: `{ imageBase64: string }` — returns scene analysis JSON.
- `POST /api/generate-glyph` — body: `{ name: string, type: string }` — returns `{ glyphB64 }`.
 - `POST /api/generate-entity-profile` — body: `{ strength?: string }` — returns a JSON entity profile with { name, type, backstory, instability, contained, glyphB64 }.
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

Client example
--------------
There's a small TypeScript example showing how to configure the client to use the proxy and request an entity profile for development: `examples/proxy-client-example.ts`. It demonstrates calling `setProxyConfig(proxyBaseUrl, sharedIssuanceToken)` and then `getEntityProfile()`.

CI / GitHub Actions
-------------------
This repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` which runs on push and pull requests and performs:
- dependency install
- TypeScript typecheck
- server unit tests
- Angular production build

If you want to run live integration tests that call the real GenAI APIs, there is an optional workflow `.github/workflows/e2e.yml`. It requires the following repository secrets to be configured in GitHub Settings > Secrets:
- `GENAI_API_KEY` (maps to server `API_KEY`)
- `JWT_ISSUER_SECRET`
- `SHARED_ISSUANCE_TOKEN`

Deploy & security checklist
---------------------------
- Do NOT commit `API_KEY`, `JWT_ISSUER_SECRET`, or `SHARED_ISSUANCE_TOKEN` to the repository.
- Use environment variables or a secret manager for production credentials.
- Use a strong `JWT_ISSUER_SECRET` (at least 32 random bytes).
- Replace `SHARED_ISSUANCE_TOKEN` with a high-entropy, single-purpose secret used only to obtain the short-lived JWT.
- Harden CORS to only allow your web origin(s) in production (in `index.js`, replace permissive cors() with a configured allowlist).
- Consider adding authentication (per-user tokens) or API keys per client on top of the shared issuance token if distributing widely.
- Monitor and set strict rate limits in `index.js` to prevent abuse.
- Limit model usage and quota in your GenAI account; set budgets and alerts.

