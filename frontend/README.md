# ENS Network Explorer — Frontend

React 19 + TypeScript + Vite single-page app that resolves ENS profiles client-side via ethers.js and visualises ENS social graphs with D3.

See the repo root [`README.md`](../README.md), [`PRD.md`](../PRD.md), and [`ARCHITECTURE.md`](../ARCHITECTURE.md) for product and system context. For deployment, see [`DEPLOY.md`](../DEPLOY.md).

## Tech stack

- **React 19** + **TypeScript** — component framework with type safety
- **Vite** — dev server with sub-second HMR; production bundling
- **React Router v6** — `/`, `/profile/:ensName`, `/graph`
- **ethers.js v6** — ENS resolution against PublicNode mainnet RPC, no API key required
- **D3.js v7** — force-directed graph (`forceLink` + `forceManyBody` + `forceCenter` + `forceCollide`)
- **Tailwind CSS v3** — utility-first styling with Japandi design tokens
- **sonner** — toast notifications for API and resolver errors

## Quick start

```bash
cd frontend
npm install

cp .env.example .env.local
# Leave VITE_API_BASE_URL blank to use browser localStorage for edges,
# or set it to a running backend, e.g. http://localhost:8000/api

npm run dev
```

Open http://localhost:5173. If port 5173 is taken, Vite auto-picks 5174.

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | TypeScript project-references build + Vite production bundle to `dist/` |
| `npm run preview` | Serve the built bundle locally for a smoke test |
| `npm run lint` | Run ESLint over `src/` |

## Project structure

```
frontend/
├── index.html              # Entry HTML + inline FOUC-prevention theme script
├── public/
│   └── favicon.svg         # 間-glyph favicon
├── src/
│   ├── main.tsx            # React root mount
│   ├── App.tsx             # BrowserRouter + Routes + Toaster
│   ├── index.css           # Tailwind layers + Japandi tokens + ambient pattern
│   ├── types/index.ts      # ENSProfile, GraphNode, GraphEdge, GraphData, PersistedEdge
│   ├── lib/
│   │   └── ens-utils.ts    # isValidEnsName, normaliseEns, truncateAddress, initialFrom
│   ├── services/
│   │   ├── ens.ts          # ethers.js resolver + text-records fetch (memoised)
│   │   ├── api.ts          # Django REST client with localStorage fallback
│   │   └── parser.ts       # Textarea pair parser → GraphData
│   ├── hooks/
│   │   ├── useENS.ts       # 250ms debounced ENS resolution
│   │   ├── useGraph.ts     # Edge CRUD state with API + toasts on failure
│   │   └── useTheme.ts     # light / dark / auto (system) cycle with localStorage persistence
│   ├── components/
│   │   ├── Layout.tsx      # Page shell with masthead + main + footer credit
│   │   ├── Masthead.tsx    # 間 glyph, nav, theme toggle
│   │   ├── SearchBar.tsx   # ENS input with .eth validation
│   │   ├── Avatar.tsx      # Circle with image or initial fallback
│   │   ├── CopyButton.tsx  # Clipboard copy for resolved address
│   │   ├── ThemeToggle.tsx # Cycling ☀ / ☾ / ◐ pill
│   │   ├── ErrorBoundary.tsx
│   │   ├── ProfileCard/
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── SocialLinks.tsx  # Pills with inline brand-glyph icons
│   │   ├── Graph/
│   │   │   └── ForceGraph.tsx   # D3 force simulation, pan/zoom, drag
│   │   └── EdgeEditor/
│   │       └── EdgeEditor.tsx
│   └── pages/
│       ├── HomePage.tsx
│       ├── ProfilePage.tsx
│       └── GraphPage.tsx
├── tailwind.config.js      # Japandi palette + data-theme dark mode
├── postcss.config.js
├── vite.config.ts
├── tsconfig*.json
├── vercel.json             # SPA rewrite rule
└── .env.example
```

## Environment variables

| Name | Required | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | no | Django REST base URL with `/api` suffix and no trailing slash (e.g. `https://ens-network-api.onrender.com/api`). When empty, edge CRUD falls back to `localStorage` so the graph still works offline. |

Vite exposes only variables prefixed with `VITE_` to the browser. Never put secrets in this file.

## Architecture notes

### ENS resolution

`services/ens.ts` creates a single `ethers.JsonRpcProvider` pointed at `https://ethereum-rpc.publicnode.com` and fetches the following text records in parallel via `Promise.allSettled`:

- `avatar`, `name` (display name), `description`, `url`
- `com.twitter`, `com.github`, `com.discord`, `org.telegram`
- `email`

Resolved profiles are memoised in a module-level `Map<string, Promise<ENSProfile>>` so navigating away and back doesn't re-hit the RPC.

`useENS` adds a **250 ms debounce** so rapid URL changes (e.g. typing in the address bar) don't fan out into multiple RPC calls.

### Force-directed graph

`<ForceGraph>` runs D3 v7 with `alphaDecay(0.05)` and `alphaMin(0.01)` — simulations of 50 nodes converge in under 1 second instead of the 5–10 seconds you'd get with defaults. Pan + zoom via `d3.zoom()`, node dragging via `d3.drag()`. Nodes carry colour hashed from their ENS name for visual identity.

The whole component is wrapped in an `<ErrorBoundary>` in `GraphPage` so a render crash shows a graceful "graph crashed" card with a reset button instead of taking down the page.

### Edge persistence

`services/api.ts` is dual-mode:

- **API mode** (`VITE_API_BASE_URL` is set) — calls the Django REST endpoints (`GET/POST/DELETE /api/edges/`).
- **Local mode** (env var blank) — reads/writes a JSON array in `localStorage` under `japandi-ens:edges`.

Both modes implement the same constraint set: `.eth` validation, source ≠ target, source-target uniqueness (returns 409 / `ApiError` on duplicate).

### Theme system

Three states cycled by the masthead pill: **light** / **dark** / **auto** (follows `prefers-color-scheme`). The selected mode is written to `localStorage` under `japandi-ens:theme` and applied via `data-theme="light" | "dark"` on the `<html>` element.

A tiny inline script in `index.html` reads the stored preference and sets the attribute **before React mounts**, preventing the flash of the wrong palette on first paint.

All colour tokens (`--c-ink`, `--c-paper`, `--c-cream`, `--c-washi`, `--c-gold`, `--c-body`, `--c-mono`, `--c-rust`, etc.) live in `src/index.css` and invert automatically between the two themes.

## Design system

The visual language is described in [`../DesignSystem.html`](../DesignSystem.html) — open it in a browser to see the full specimen (palette, typography, components, motifs). Key tokens:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--c-ink` | `#1C1917` | `#F5F0E8` | Primary text |
| `--c-paper` | `#F5F0E8` | `#1C1917` | Page background |
| `--c-cream` | `#FAF7F2` | `#292524` | Pills, inputs |
| `--c-washi` | `#FEFCFA` | `#312E2B` | Cards |
| `--c-gold` | `#C9A96E` | `#C9A96E` | Accent, borders, glyphs |
| `--c-rust` | `#8B4513` | `#D68559` | Errors |
| `--c-mono` | `#2D3561` | `#8B96CC` | Monospace (addresses) |

Typography: **Cormorant Garamond** (display/serif), **DM Sans** (body), **DM Mono** (addresses & code).

## Deployment

The build outputs to `dist/`. `vercel.json` contains an SPA rewrite rule so deep links like `/profile/vitalik.eth` serve `index.html` instead of 404ing.

For step-by-step Vercel + Render setup, see [`../DEPLOY.md`](../DEPLOY.md).
