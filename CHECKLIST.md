# ENS Network Explorer — 3-Hour Sprint Checklist & Milestones

## M0 — Scaffold & Deploy Shell

> Goal: A blank React app and Django project are live at public URLs before writing a single feature.

### Frontend (Vite + React + TypeScript)
- [x] `npm create vite@latest frontend -- --template react-ts`
- [x] Install dependencies: `ethers`, `d3`, `react-router-dom`, `tailwindcss`
- [x] Configure Tailwind (`tailwind.config.ts`, `postcss.config.js`)
- [x] Set up React Router with placeholder routes: `/`, `/profile/:ensName`, `/graph`
- [x] Add `.env.example` with `VITE_API_BASE_URL`
- [x] Push to GitHub
- [x] **Deploy to Vercel** — confirm live URL returns 200 ✅

### Backend (Django + DRF)
- [x] `django-admin startproject config .` inside `backend/`
- [x] `python manage.py startapp graph`
- [x] Install: `djangorestframework`, `django-cors-headers`, `psycopg2-binary`, `gunicorn`, `python-dotenv`, `dj-database-url`
- [x] Split settings into `base.py` / `development.py` / `production.py`
- [x] Configure CORS to allow `*` (tighten to frontend URL before final deploy)
- [x] Create health check endpoint `GET /api/health/` → `{"status": "ok"}`
- [x] Add `Procfile`: `web: gunicorn config.wsgi`
- [x] Add `runtime.txt`: `python-3.11.x`
- [x] Push to GitHub
- [x] **Deploy to Render** — provision PostgreSQL add-on, confirm `/api/health/` returns 200 ✅

---

## M1 — ENS Profile Page

> Goal: `/profile/vitalik.eth` renders a complete, well-styled profile card.

### ENS Resolution Service (`frontend/src/services/ens.ts`)
- [x] Initialise `ethers.JsonRpcProvider` pointing to `https://ethereum-rpc.publicnode.com`
- [x] `resolveAddress(ensName)` → returns checksummed address or `null`
- [x] `fetchTextRecords(ensName)` → fetches the following records in parallel:
  - [x] `avatar`
  - [x] `name` (display name)
  - [x] `description`
  - [x] `url`
  - [x] `com.twitter`
  - [x] `com.github`
  - [x] `com.discord`
  - [x] `org.telegram`
  - [x] `email`
- [x] Handle resolver-not-found gracefully (name doesn't exist → return empty object)
- [x] Export `ENSProfile` TypeScript interface

### `useENS` Hook (`frontend/src/hooks/useENS.ts`)
- [x] Accepts `ensName: string`
- [x] Returns `{ profile, address, loading, error }`
- [ ] Debounces resolution calls
- [x] Memoises results per name (avoid re-fetching on re-render)

### Profile Page (`frontend/src/pages/ProfilePage.tsx`)
- [x] Read `:ensName` from URL params
- [x] Call `useENS(ensName)`
- [x] Show loading skeleton while resolving
- [x] Show clear error state if name not found or resolution fails
- [x] Render `<ProfileCard>` when data available

### `<ProfileCard>` Component
- [x] Display avatar image (fallback to blockie / placeholder if no `avatar` record)
- [x] Display ENS name as heading
- [x] Display resolved address (truncated with copy-to-clipboard button)
- [x] Display description if populated
- [x] Display website link if populated
- [x] Display social badges (Twitter, GitHub, Discord, Telegram, Email) — only if populated
- [ ] Responsive layout (mobile 375 px + desktop)

### Home Page (`/`)
- [x] Search bar: text input + submit button
- [x] On submit, navigate to `/profile/:ensName`
- [x] Input validation: must end in `.eth`

### Verification
- [x] `vitalik.eth` profile loads with avatar, bio, social links ✅
- [x] `nonexistent-xyz-12345.eth` shows error state ✅
- [x] Direct URL `/profile/vitalik.eth` works on page refresh ✅
- [ ] **Live URL confirmed with examiner** ✅

---

## M2 — Graph Visualisation

> Goal: Paste a list of ENS pairs, see a force-directed graph. Click a node → profile page.

### Graph Data Model (`frontend/src/types/index.ts`)
- [x] Define `GraphNode { id: string, label: string, avatar?: string }`
- [x] Define `GraphEdge { id: string | number, source: string, target: string }`
- [x] Define `GraphData { nodes: GraphNode[], edges: GraphEdge[] }`

### Input Parser (`frontend/src/services/parser.ts`)
- [x] Parse textarea input: one pair per line, comma-separated
- [x] Trim whitespace, lowercase, deduplicate nodes
- [x] Return `GraphData`
- [x] Reject malformed lines silently (show count of skipped lines)

### `<ForceGraph>` Component (`frontend/src/components/Graph/ForceGraph.tsx`)
- [x] Initialise D3 force simulation: `forceLink`, `forceManyBody`, `forceCenter`, `forceCollide`
- [x] Render nodes as `<circle>` (or `<image>` if avatar available)
- [x] Render edges as `<line>`
- [x] Node labels as `<text>` below node
- [x] Pan & zoom via `d3.zoom()`
- [x] On node click: call `onNodeClick(ensName)` prop
- [x] On edge click: call `onEdgeClick(edge)` prop (needed for M3)
- [ ] Simulation stabilises within 2 s for 50 nodes

### Graph Page (`frontend/src/pages/GraphPage.tsx`)
- [x] Textarea for ENS pair input
- [x] "Load Graph" button — parses input and renders `<ForceGraph>`
- [x] On node click → `navigate('/profile/:ensName')`
- [x] Graph section sits below input panel

### Verification
- [x] 5-pair input renders correct graph ✅
- [x] 50-pair input renders without layout errors ✅
- [x] Clicking `vitalik.eth` node navigates to `/profile/vitalik.eth` ✅
- [x] Pan and zoom work on desktop ✅

---

## M3 — Backend API + Edge Persistence

> Goal: All edges stored in PostgreSQL; add/delete reflected live in graph.

### Django `Edge` Model (`backend/graph/models.py`)
- [x] Fields: `id` (UUID), `source` (CharField 255), `target` (CharField 255), `created_at` (auto_now_add)
- [x] `Meta: unique_together = [('source', 'target')]`
- [x] `clean()` validator: source ≠ target
- [x] Run and apply migration

### Serializer (`backend/graph/serializers.py`)
- [x] `EdgeSerializer` with fields: `id`, `source`, `target`, `created_at`
- [x] Validate `.eth` suffix on both source and target
- [x] Validate source ≠ target (400)
- [x] Validate uniqueness (409)

### Views / ViewSet (`backend/graph/views.py`)
- [x] `EdgeViewSet` using DRF `ModelViewSet`
- [x] `list` → `GET /api/edges/` (support `?node=vitalik.eth` filter)
- [x] `create` → `POST /api/edges/`
- [x] `destroy` → `DELETE /api/edges/{id}/`
- [x] Disable `update` and `partial_update`

### URLs (`backend/graph/urls.py`)
- [x] Register router for `EdgeViewSet`
- [x] Wire into `config/urls.py` under `/api/`

### CORS + Security
- [ ] `CORS_ALLOWED_ORIGINS` set to deployed Vercel URL
- [x] `SECRET_KEY` read from environment variable
- [x] `DEBUG=False` in production settings
- [x] `ALLOWED_HOSTS` configured

### Frontend API Client (`frontend/src/services/api.ts`)
- [x] `getEdges()` → `GET /api/edges/`
- [x] `createEdge(source, target)` → `POST /api/edges/`
- [x] `deleteEdge(id)` → `DELETE /api/edges/{id}/`
- [x] All functions use `VITE_API_BASE_URL` env variable
- [x] Typed with `GraphEdge` interface

### `useGraph` Hook (`frontend/src/hooks/useGraph.ts`)
- [x] Fetches edges from API on mount
- [x] `addEdge(source, target)` — calls API, updates local state
- [x] `deleteEdge(id)` — calls API, updates local state
- [x] Loading and error states

### `<EdgeEditor>` Component (`frontend/src/components/EdgeEditor/`)
- [x] Two text inputs: Source ENS, Target ENS
- [x] "Add Edge" button → calls `addEdge`, clears inputs on success
- [x] Shows validation error inline
- [x] Shows success toast on add

### Graph Page Updates
- [x] Graph initialises from `useGraph` (API edges) merged with textarea input edges
- [x] Clicking an edge opens delete confirmation tooltip
- [x] Confirming deletion calls `deleteEdge`, removes edge from graph
- [x] `<EdgeEditor>` panel rendered alongside graph

### Verification
- [x] `POST /api/edges/` with `{source: "vitalik.eth", target: "balajis.eth"}` returns 201 ✅
- [ ] Edge appears in graph without reload ✅
- [x] `DELETE /api/edges/{id}/` returns 204 ✅
- [ ] Edge disappears from graph without reload ✅
- [x] Duplicate edge returns 409 ✅
- [x] Self-loop returns 400 ✅
- [ ] Page refresh preserves all edges ✅

---

## M4 — Polish, Validation & Final Deploy

### UX Polish
- [x] Loading skeletons on profile page
- [ ] Error boundary wrapping graph component
- [x] Empty state when no edges exist: "Add your first edge above"
- [ ] Mobile: profile page renders cleanly at 375 px
- [x] Favicon and `<title>` tags set

### Hardening
- [x] ENS input sanitised (trim, lowercase, validate `.eth`)
- [ ] API client handles network errors gracefully (show toast)
- [ ] `console.error` removed or replaced with proper error handling
- [x] No API keys or secrets in frontend bundle

### Final Deployment Checks
- [x] Frontend `VITE_API_BASE_URL` points to production Render URL
- [x] Backend `CORS_ALLOWED_ORIGINS` includes production Vercel URL
- [x] `DATABASE_URL` set in Render environment (auto-injected from Render PostgreSQL)
- [x] `SECRET_KEY` set in Render environment (long random string)
- [x] `DEBUG=False` confirmed in production
- [x] Run `python manage.py migrate` on production DB
- [x] Vercel re-deploy triggered with correct env vars

### Final Acceptance
- [x] Live URL opens without errors ✅
- [ ] `vitalik.eth` profile page loads ✅
- [ ] Graph page renders from pasted pairs ✅
- [ ] Node click routes to profile ✅
- [ ] Edge added via form persists on refresh ✅
- [ ] Edge deleted via graph persists on refresh ✅
- [x] GitHub repo is public with all code committed ✅
- [ ] **URL submitted to examiner** ✅

---

## 🚨 Triage Rules (if running behind)

| If behind at... | Cut these | Keep these |
|---|---|---|
| T+1:00 | P2 text records (Telegram, email, content hash) | All P0 profile fields, live URL |
| T+1:45 | Avatar images in graph nodes, zoom/pan | Nodes, edges, click-to-profile |
| T+2:30 | Edge editing UI polish, toasts | Core add/delete functionality |
| T+2:50 | Mobile responsiveness | Working desktop experience |

> **Golden rule:** A working Step 1 beats a broken Step 3. Tag the commit when Step 1 is complete. Tag again when Step 2 is complete.
