# Deployment Guide

End-to-end instructions for taking the ENS Network Explorer from a local clone to a public URL on **Vercel** (frontend) + **Render** (backend + PostgreSQL).

The repo is deploy-ready:

- `backend/render.yaml` — Render Blueprint provisioning the web service + Postgres database
- `backend/Procfile` — Gunicorn + release-phase `migrate`
- `backend/runtime.txt` — pins Python 3.11
- `frontend/vercel.json` — SPA rewrite so deep links don't 404 on refresh

You only need a GitHub repo, a Render account, and a Vercel account. No paid tiers required.

---

## Live reference deployment

| Surface | URL |
|---|---|
| Frontend | https://ens-network-explorer.vercel.app |
| Backend | https://ens-network-api.onrender.com |
| API docs | https://ens-network-api.onrender.com/api/schema/swagger/ |
| Source | https://github.com/nizarsyahmi37/ens-network-explorer |

---

## Prerequisites

1. **GitHub repo** containing this project. The remote should be set on `main`.
2. **Render account** — sign up at https://dashboard.render.com (GitHub OAuth works).
3. **Vercel account** — sign up at https://vercel.com (GitHub OAuth works).
4. Latest `main` pushed to GitHub:

   ```bash
   git push origin main
   ```

Deploy the backend **first** so you have its URL to wire into the frontend.

---

## Phase 1 — Deploy backend to Render

1. Open **https://dashboard.render.com** and sign in.
2. Click **New → Blueprint** in the top-right.
3. Connect your GitHub account if it's not linked yet and pick the repo **`ens-network-explorer`** (branch `main`).
4. Render detects `backend/render.yaml` and shows the preview:
   - One web service named `ens-network-api`
   - One free PostgreSQL database named `ens-network-db`
5. The blueprint marks two env vars as `sync: false` so Render prompts you. Fill placeholders for now — we'll fix them in Phase 3:
   - `CORS_ALLOWED_ORIGINS` → `https://placeholder.vercel.app`
   - `CSRF_TRUSTED_ORIGINS` → `https://placeholder.vercel.app`
6. Click **Apply**. Render provisions the database, then builds and starts Gunicorn. The build command runs `pip install`, `collectstatic`, and `migrate` automatically. First build takes ~3–5 minutes.
7. When the service shows **Live**, click into `ens-network-api` and copy the URL at the top (e.g. `https://ens-network-api.onrender.com`).
8. **Verify**:

   ```bash
   curl https://<your-render-url>/api/health/
   # → {"status":"ok","db":"connected"}

   curl https://<your-render-url>/api/edges/
   # → []
   ```

> **Free-tier note:** the web service spins down after 15 minutes idle. The first request after a sleep can take ~30 seconds to return while the container wakes up.

---

## Phase 2 — Deploy frontend to Vercel

1. Open **https://vercel.com/new** and sign in.
2. Click **Import** next to the `ens-network-explorer` repo.
3. On the configure screen:
   - **Root Directory** → click **Edit** and select `frontend`
   - **Framework Preset** → Vercel auto-detects **Vite** (leave as-is)
   - **Build Command** → default (`npm run build`)
   - **Output Directory** → default (`dist`)
4. Expand **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://<your-render-url>/api` (with `/api`, no trailing slash) |

5. Click **Deploy**. Build takes ~1–2 minutes.
6. When green, copy the production URL from the top of the page (e.g. `https://ens-network-explorer.vercel.app`).
7. **Verify the bundle baked in your API URL**:

   ```bash
   JS_URL=$(curl -s https://<your-vercel-url>/ | grep -oE '/assets/index-[^"]+\.js' | head -1)
   curl -s "https://<your-vercel-url>$JS_URL" | grep -oE 'https://[a-z0-9.-]*onrender\.com[^"]*' | head -1
   # → should print your Render URL with /api suffix
   ```

   If empty, the env var didn't make it into the build. Re-check Phase 2 step 4 and trigger a redeploy from the Vercel dashboard.

---

## Phase 3 — Wire CORS

Now point Render's CORS allowlist at the real Vercel URL:

1. In Render, open `ens-network-api` → **Environment** tab.
2. Edit **`CORS_ALLOWED_ORIGINS`** → set to your Vercel URL, e.g. `https://ens-network-explorer.vercel.app`.
   - To support PR preview URLs as well, add them comma-separated: `https://ens-network-explorer.vercel.app,https://ens-network-explorer-git-main-<user>.vercel.app`
3. Edit **`CSRF_TRUSTED_ORIGINS`** → same value.
4. Click **Save**. Render auto-redeploys (~2 minutes).
5. **Verify the CORS preflight**:

   ```bash
   curl -sI -X OPTIONS https://<your-render-url>/api/edges/ \
     -H "Origin: https://<your-vercel-url>" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: content-type" | grep -i access-control
   ```

   You should see `access-control-allow-origin` echoing your Vercel URL.

---

## Verification

Open your Vercel URL and walk through:

- [ ] Home loads with masthead, search bar, and the ambient washi pattern
- [ ] `/profile/vitalik.eth` resolves and shows avatar, bio, address with copy button, and social pills with glyph icons
- [ ] `/profile/nonexistent-xyz-12345.eth` shows the "Not Found" card
- [ ] Refresh on `/profile/vitalik.eth` — should not 404 (this is what `vercel.json` fixes)
- [ ] `/graph` renders the empty-state card
- [ ] Click **Sample** then **Load Graph** — 5-node graph appears and settles within ~1s
- [ ] Click a node → routes to its profile
- [ ] Right sidebar "Storage" card shows **Mode: `API · Django`** (not `Local · browser`)
- [ ] Add an edge via the form → toast confirmation + edge appears immediately
- [ ] Refresh — edge still there
- [ ] Click an edge → confirm Remove → toast confirmation + edge disappears
- [ ] Refresh — edge still gone
- [ ] Theme toggle in the masthead cycles **AUTO → LIGHT → DARK** and persists across refresh

End-to-end smoke test from your terminal:

```bash
# Create
curl -s -X POST https://<your-render-url>/api/edges/ \
  -H "Content-Type: application/json" \
  -d '{"source":"smoke-a.eth","target":"smoke-b.eth"}'
# → 201 with {"id":"...","source":"smoke-a.eth","target":"smoke-b.eth","created_at":"..."}

# Duplicate (should 409)
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://<your-render-url>/api/edges/ \
  -H "Content-Type: application/json" \
  -d '{"source":"smoke-a.eth","target":"smoke-b.eth"}'
# → 409

# Self-loop (should 400)
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://<your-render-url>/api/edges/ \
  -H "Content-Type: application/json" \
  -d '{"source":"smoke-a.eth","target":"smoke-a.eth"}'
# → 400

# Cleanup
EDGE_ID=$(curl -s https://<your-render-url>/api/edges/ | python3 -c "import json,sys; print(json.loads(sys.stdin.read())[0]['id'])")
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE "https://<your-render-url>/api/edges/$EDGE_ID/"
# → 204
```

---

## Subsequent deploys

Once both platforms are connected to GitHub, both auto-deploy on push to `main`:

```bash
git push origin main
```

- Vercel rebuilds the frontend (~1–2 min) and rolls out the new bundle
- Render rebuilds the backend (~2–4 min), runs migrations as a release step, then restarts Gunicorn

Open the **Deployments** tab on either dashboard to watch progress and access build logs.

For preview deploys, open a pull request — Vercel automatically creates a preview URL. The backend stays on the same production database; if you need preview backends, create a second Render Blueprint in a `staging` branch.

---

## Environment variables reference

### Frontend (Vercel)

| Name | Required | Value |
|---|---|---|
| `VITE_API_BASE_URL` | yes | Render API base, e.g. `https://ens-network-api.onrender.com/api` (no trailing slash). When empty, the frontend falls back to browser localStorage for edges. |

### Backend (Render)

| Name | Required | Notes |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | yes | `config.settings.production` |
| `SECRET_KEY` | yes | Auto-generated by `render.yaml` via `generateValue: true` |
| `DATABASE_URL` | yes | Auto-injected from the bound PostgreSQL database |
| `ALLOWED_HOSTS` | yes | `ens-network-api.onrender.com` (plus any custom domain). `RENDER_EXTERNAL_HOSTNAME` is also appended automatically by `production.py`. |
| `CORS_ALLOWED_ORIGINS` | yes | Comma-separated Vercel URLs. Set in dashboard after Phase 2. |
| `CSRF_TRUSTED_ORIGINS` | yes | Same value as `CORS_ALLOWED_ORIGINS` |

---

## Common pitfalls

- **CORS errors in browser console.** Render hasn't finished redeploying after editing the env vars, or there's a trailing slash mismatch. Django's `CORS_ALLOWED_ORIGINS` does an exact string compare.
- **`/api/edges/` returns 502 / 504 on first hit.** The free-tier dyno was asleep. Wait 30 seconds and retry.
- **`ALLOWED_HOSTS` rejection.** If Render gave the service a random name suffix, `production.py` automatically appends `RENDER_EXTERNAL_HOSTNAME` to the allowlist — no manual fix needed.
- **Frontend Storage panel shows `Local · browser` not `API · Django`.** The `VITE_API_BASE_URL` env var wasn't set at build time. Set it in Vercel and **redeploy** (env-var changes alone don't trigger a rebuild — you need to redeploy or push a new commit).
- **`/profile/vitalik.eth` 404s on refresh.** `frontend/vercel.json` is missing or malformed. Verify it contains the `/(.*) → /` rewrite.
- **Render `SECRET_KEY` not set error on first boot.** The Blueprint generates it automatically, but if you imported manually as a Web Service (not Blueprint), set it yourself to a 50+ character random string.

---

## Custom domains (optional)

### Vercel
1. Project → **Settings** → **Domains** → **Add**
2. Vercel issues an SSL cert automatically
3. Update Render's `CORS_ALLOWED_ORIGINS` to include the new domain

### Render
1. Service → **Settings** → **Custom Domains** → **Add Custom Domain**
2. Add a CNAME record at your DNS provider
3. Update `ALLOWED_HOSTS` to include the new hostname

After either change, redeploy the side that didn't change so the new env values are picked up.
