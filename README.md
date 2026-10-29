# Cynbit contact form

This repository currently contains a single React/Vite contact page and an Express API that saves leads to MongoDB. The RAG (retrieval augmented generation) service is a documented placeholder: it is not implemented, connected to the website, or deployed. There is no chat API, document indexing, or company knowledge base yet.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- MongoDB, either a local instance or a MongoDB Atlas database

## Run locally

From the project root:

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `MONGODB_URI` to your database URI. Never commit `.env` or share database credentials.
3. Start the API in one terminal: `npm run dev:server` (default `http://localhost:3000`).
4. Start the website in another terminal: `npm run dev` (Vite prints the URL, usually `http://localhost:5173`).
5. Open the Vite URL followed by `/contact`, for example `http://localhost:5173/contact`.

The Vite development server proxies `/api` requests to the API. Set `API_PROXY_TARGET` if the API runs at a different address. The API defaults to port 3000; set `PORT` to change it.

Check `GET http://localhost:3000/api/health` for API and database status. A healthy API with an unavailable database reports `"database":"disconnected"`; form submissions then return 503 until MongoDB is reachable.

## Contact form behavior

- `POST /api/leads` validates and saves a lead with status `new` and a creation timestamp.
- Required fields: name (2–80 characters), valid email, service, budget, timeline, and message (10–1,000 characters). Phone is optional and accepts 7–15 digits with `+`, `-`, and spaces.
- Service, budget, and timeline values are restricted to the options shown in the form. Input is trimmed and normalized; unexpected fields are rejected. Validation failures return status 400 with per-field messages.
- A filled `website` honeypot returns success without saving. The API limits requests to five submissions per IP per 15 minutes.
- The form provides a thank-you state after a successful save. SMTP confirmation is sent when all `SMTP_*` settings are configured; otherwise the confirmation is logged by the API. Email delivery failures do not undo a saved lead.
- `?service=...` can preselect a listed service, such as `/contact?service=Cloud%20Systems`.

The API uses Helmet, JSON payloads up to 50 KB, and CORS restricted to `CLIENT_URL` (default `http://localhost:5173`). Environment variable names and safe local defaults are in `.env.example`.

## Tests and production build

- Run validation tests: `npm test`
- Build the frontend: `npm run build`

## Deploy to Render

The Express web service serves both the built Vite site and `/api`, so the form and backend use the same Render URL.

1. Push this project to a Git provider connected to Render. If the repository root contains this project inside a `cynbit/` folder, set Render's **Root Directory** to `cynbit`; otherwise leave it blank.
2. In Render, create **New > Web Service**, select the repository and production branch, and choose Node.
3. Set **Build Command** to `npm ci && npm run build` and **Start Command** to `npm start`.
4. Set the **Health Check Path** to `/api/health`.
5. Add `MONGODB_URI` and `MONGODB_DB=cynbit` in Render's Environment settings. Set `CLIENT_URL` to the deployed `https://<your-service>.onrender.com` URL (or your custom domain). Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` only if you want email confirmations. Do not commit or paste production secrets into source files.
6. In MongoDB Atlas, add the Render service's outbound IP ranges to the cluster's Network Access allowlist. Find the ranges in the Render service's **Connect > Outbound** panel. Deploy, then check `https://<your-service>.onrender.com/api/health` and open `https://<your-service>.onrender.com/contact`.

Render injects `PORT` at runtime; the server listens on that port. A free Render web service may spin down after inactivity, so its first request after idle can take longer while it starts again.

The RAG service remains unimplemented and is not included in this deployment.

## RAG service status

The `rag/` and `knowledge/` folders contain README placeholders only. No RAG code, model integration, vector store, indexing pipeline, or API route exists in this project. The service has not been deployed and cannot currently answer questions. Implement it as a separate feature after approved company source material is added to `knowledge/`; until then, do not present generated company answers as available.
