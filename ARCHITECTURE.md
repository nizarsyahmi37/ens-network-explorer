# Architecture Document

## ENS Network Explorer

**Version:** 1.0.0  

---

## 1. System Overview

ENS Network Explorer is a three-tier web application:

```
┌──────────────────────────────────────────────────────┐
│                     BROWSER                          │
│                                                      │
│   React SPA (Vite + TypeScript)                      │
│   ┌─────────────┐  ┌────────────┐  ┌──────────────┐  │
│   │ ProfilePage │  │ GraphPage  │  │  EdgeEditor  │  │
│   └──────┬──────┘  └─────┬──────┘  └──────┬───────┘  │
│          │               │                │          │
│   ┌──────▼───────────────▼────────────────▼───────┐  │
│   │            Services Layer                     │  │
│   │  ens.ts (ethers.js)    api.ts (fetch)         │  │
│   └──────┬──────────────────────────┬─────────────┘  │
└──────────┼──────────────────────────┼────────────────┘
           │                          │
           ▼                          ▼
  ┌─────────────────┐      ┌──────────────────────┐
  │  Ethereum RPC   │      │   Django REST API     │
  │  (Cloudflare)   │      │   (Render)            │
  │                 │      │                       │
  │  ENS Resolver   │      │  /api/edges/          │
  │  Text Records   │      │  /api/health/         │
  └─────────────────┘      └──────────┬────────────┘
                                      │
                           ┌──────────▼────────────┐
                           │     PostgreSQL 16      │
                           │     (Render)           │
                           │                        │
                           │  table: graph_edge     │
                           └────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 18 + TypeScript | Industry standard; excellent D3 integration; type safety |
| Build tool | Vite | Sub-second HMR; optimised production bundles |
| Routing | React Router v6 | File-based routing patterns; URL-based navigation for deep links |
| ENS resolution | ethers.js v6 | First-class ENS support; no API key needed |
| Graph rendering | D3.js v7 | Maximum control over force simulation and SVG rendering |
| Styling | TailwindCSS v3 | Rapid utility-first styling; no CSS bundle bloat |
| HTTP client | Native `fetch` | No dependency needed for simple REST calls |

### 2.2 Component Hierarchy

```
App
├── Router
│   ├── "/" → HomePage
│   │   └── SearchBar
│   │
│   ├── "/profile/:ensName" → ProfilePage
│   │   ├── useENS(ensName)
│   │   └── ProfileCard
│   │       ├── AvatarBlock
│   │       ├── AddressBlock
│   │       └── SocialLinks
│   │
│   └── "/graph" → GraphPage
│       ├── useGraph()
│       ├── PairInputPanel
│       ├── ForceGraph (D3)
│       │   ├── Nodes (circle/image)
│       │   ├── Edges (line)
│       │   └── Labels (text)
│       └── EdgeEditor
│           ├── AddEdgeForm
│           └── EdgeDeleteTooltip
```

### 2.3 ENS Resolution Flow

```
User enters "vitalik.eth"
        │
        ▼
ens.resolveAddress("vitalik.eth")
        │
        ├─ provider.resolveName(name)           ← returns address
        │
        ▼
ens.fetchTextRecords("vitalik.eth")
        │
        ├─ resolver = provider.getResolver(name)
        │
        └─ Promise.allSettled([
               resolver.getText("avatar"),
               resolver.getText("name"),
               resolver.getText("description"),
               resolver.getText("url"),
               resolver.getText("com.twitter"),
               resolver.getText("com.github"),
               resolver.getText("com.discord"),
               resolver.getText("org.telegram"),
               resolver.getText("email"),
           ])
        │
        ▼
ENSProfile object (only truthy values)
```

All RPC calls go to `https://cloudflare-eth.com` (Ethereum mainnet, public, no key required).

### 2.4 Graph Data Flow

```
1. User pastes ENS pairs into textarea
2. parser.parseInput(text) → GraphData { nodes[], edges[] }
3. useGraph() fetches persisted edges from API: GET /api/edges/
4. Merge: deduplicate nodes from both sources
5. ForceGraph receives merged GraphData
6. D3 force simulation runs:
     - forceLink (edge spring force)
     - forceManyBody (node repulsion, strength -300)
     - forceCenter (anchor to SVG centre)
     - forceCollide (prevent overlap, radius 40)
7. On tick: update cx, cy of nodes; x1,y1,x2,y2 of edges
8. On stabilise (alpha < 0.01): freeze layout
```

### 2.5 State Management

No external state library (Redux / Zustand) is used. State is co-located:

| State | Location | Strategy |
|---|---|---|
| ENS profile | `useENS` hook | Local hook state + memo cache |
| Graph nodes/edges | `useGraph` hook | Local hook state |
| UI (loading, errors) | Component local state | `useState` |

---

## 3. Backend Architecture

### 3.1 Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Django 5 + DRF | Rapid API development; battle-tested ORM; easy PostgreSQL integration |
| Database | PostgreSQL 16 | ACID-compliant; excellent unique constraints; Render free tier |
| WSGI server | Gunicorn | Production-grade; straightforward Render deploy |
| CORS | django-cors-headers | One-line CORS configuration |
| DB adapter | psycopg2-binary | Standard PostgreSQL driver for Django |

### 3.2 Django Project Structure

```
backend/
├── config/
│   ├── settings/
│   │   ├── base.py          # Shared settings
│   │   ├── development.py   # DEBUG=True, SQLite fallback
│   │   └── production.py    # DEBUG=False, DATABASE_URL, WhiteNoise
│   ├── urls.py              # Root URL conf
│   └── wsgi.py
│
└── graph/                   # Core application
    ├── migrations/
    │   └── 0001_initial.py
    ├── models.py
    ├── serializers.py
    ├── views.py
    ├── urls.py
    └── tests.py
```

### 3.3 Data Model

```sql
CREATE TABLE graph_edge (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source      VARCHAR(255) NOT NULL,
    target      VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT  uq_edge UNIQUE (source, target),
    CONSTRAINT  chk_no_self_loop CHECK (source <> target)
);

CREATE INDEX idx_edge_source ON graph_edge(source);
CREATE INDEX idx_edge_target ON graph_edge(target);
```

### 3.4 API Design

```
Base URL: https://ens-network-api.onrender.com/api/

GET  /edges/              List all edges
                          Query: ?node=vitalik.eth (filter source OR target)
                          Response: 200 [{ id, source, target, created_at }]

POST /edges/              Create edge
                          Body: { "source": "a.eth", "target": "b.eth" }
                          Response: 201 { id, source, target, created_at }
                          Errors: 400 (validation), 409 (duplicate)

DELETE /edges/{id}/       Delete edge by UUID
                          Response: 204 No Content
                          Errors: 404 (not found)

GET  /health/             Health check
                          Response: 200 { "status": "ok", "db": "connected" }
```

### 3.5 Request Lifecycle (POST /edges/)

```
Browser
  │  POST /api/edges/  { source: "a.eth", target: "b.eth" }
  ▼
Gunicorn worker
  │
  ▼
Django middleware (CORS check → allowed origin?)
  │
  ▼
EdgeViewSet.create()
  │
  ▼
EdgeSerializer.is_valid()
  ├─ source and target end in ".eth"?
  ├─ source ≠ target?
  └─ (source, target) not already in DB?
  │
  ├─ Invalid → 400 / 409
  │
  ▼
Edge.objects.create(source, target)
  │
  ▼
PostgreSQL INSERT
  │
  ▼
201 Created + serialized Edge JSON
  │
  ▼
Browser: updates graph state, new edge appears
```

---

## 4. Infrastructure & Deployment

### 4.1 Deployment Topology

```
                    ┌───────────────────────────┐
                    │         Vercel            │
                    │   CDN (100+ edge nodes)   │
                    │                           │
 User ──HTTPS──────►│  React SPA (static files) │
                    │  ens-network.vercel.app   │
                    └────────────┬──────────────┘
                                 │ API calls (HTTPS)
                    ┌────────────▼─────────────────────┐
                    │         Render                   │
                    │   ens-network-api.onrender.com   │
                    │                                  │
                    │   Gunicorn / Django              │
                    │   (Web Service, free tier)       │
                    └────────────┬─────────────────────┘
                                 │ TCP (private network)
                    ┌────────────▼──────────────┐
                    │         Render            │
                    │   PostgreSQL 16           │
                    │   (private, not public)   │
                    └───────────────────────────┘
```

### 4.2 Environment Variables

#### Frontend (Vercel)
```env
VITE_API_BASE_URL=https://ens-network-api.onrender.com/api
```

#### Backend (Render)
```env
SECRET_KEY=<long-random-string-50+-chars>
DEBUG=False
DATABASE_URL=postgresql://user:pass@host:5432/dbname   # auto-set by Render
ALLOWED_HOSTS=ens-network-api.onrender.com
CORS_ALLOWED_ORIGINS=https://ens-network.vercel.app
DJANGO_SETTINGS_MODULE=config.settings.production
```

### 4.3 CI/CD

| Trigger | Action |
|---|---|
| Push to `main` | Vercel auto-deploys frontend |
| Push to `main` | Render auto-deploys backend |
| PR opened | Vercel creates preview URL |

### 4.4 Deployment Checklist (run in order)

1. Push backend to GitHub → Render detects and builds (via `render.yaml` Blueprint or manual Web Service)
2. Render provisions PostgreSQL → `DATABASE_URL` auto-injected via service binding
3. Run `python manage.py migrate` via Render Shell (or as a one-off pre-deploy command)
4. Confirm `/api/health/` returns 200
5. Set `CORS_ALLOWED_ORIGINS` to Vercel URL
6. Push frontend to GitHub → Vercel detects and builds
7. Set `VITE_API_BASE_URL` in Vercel environment settings
8. Trigger Vercel redeploy
9. Test end-to-end from browser

---

## 5. Security Considerations

| Concern | Mitigation |
|---|---|
| Secret key exposure | `SECRET_KEY` in env var, never in code |
| SQL injection | Django ORM parameterised queries |
| CORS abuse | `CORS_ALLOWED_ORIGINS` locked to Vercel domain in production |
| Input injection | Serializer validates `.eth` suffix; CharField length limits |
| Debug mode | `DEBUG=False` enforced in production settings |
| DB not public | PostgreSQL on Render private network, not internet-accessible |

---

## 6. Performance Considerations

### ENS Resolution
- Text records fetched in parallel via `Promise.allSettled`
- Results memoised in React state — no re-fetch on re-render
- Cloudflare ETH gateway: ~100–300 ms per call typically

### Graph Rendering
- D3 simulation runs on CPU in main thread
- For > 100 nodes: consider `requestAnimationFrame` throttling
- Node avatars lazy-loaded as `<image>` elements after graph settles

### API
- Edges table indexed on `source` and `target`
- Single `GET /api/edges/` call on page load; no polling
- Django query: `Edge.objects.all()` — acceptable for hundreds of edges

---

## 7. Testing Strategy

### Frontend
- **Unit tests** (Vitest): `parseInput()`, `useENS` hook mock
- **Component tests** (React Testing Library): ProfileCard renders fields, error state
- **E2E** (manual): profile lookup, graph render, edge CRUD

### Backend
- **Unit tests** (Django TestCase): serializer validation, model constraints
- **Integration tests** (APITestCase): full request/response cycle for all endpoints
- **DB constraint tests**: duplicate edge → 409, self-loop → 400

---

## 8. Future Improvements (Post v1.0)

| Area | Improvement |
|---|---|
| Performance | Web worker for D3 simulation (off main thread) |
| Features | Edge types / labels (e.g. "colleague", "friend", "follows") |
| Features | Directed graph support |
| Auth | Wallet-based auth: sign a message to prove ENS ownership |
| Infra | Redis cache for ENS resolution results (TTL 5 min) |
| Infra | Rate limiting on POST /api/edges/ |
| UX | ENS name autocomplete via The Graph |
| Scalability | Paginated edge list for large graphs |