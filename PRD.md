# Product Requirements Document (PRD)

## ENS Network Explorer

**Version:** 1.0.0  

---

## 1. Overview

### 1.1 Problem Statement

The Ethereum Name Service (ENS) stores rich, on-chain identity data — yet there is no lightweight tool that lets a user:

- view a human-readable ENS profile and
- explore the social graph implied by known relationships between ENS names.

Existing block explorers are developer-facing and expose too much noise; social graphs are locked inside centralised platforms.

### 1.2 Product Vision

> **Give every `.eth` name a homepage and let users draw the web of people they know on-chain.**

ENS Network Explorer is a browser-based application that resolves ENS names to profile pages, visualises networks of ENS names as interactive graphs, and lets users persist their own edge definitions — all without requiring a wallet connection or any gas fees.

### 1.3 Goals

| # | Goal | Success Metric |
|---|---|---|
| G1 | Any ENS name resolves to a profile page | 100% of resolvable names return a profile within 3 s |
| G2 | Graph renders correctly for ≥ 50 ENS name pairs | No layout errors; all nodes interactive |
| G3 | Edges persist across browser sessions | Round-trip edge add/delete reflected in DB within 500 ms |
| G4 | Live, publicly accessible URL delivered | Verifiable URL submitted to examiner |

### 1.4 Non-Goals

- No wallet connection / signing required
- No ENS name registration or editing
- No real-time blockchain event streaming
- No authentication or user accounts (edges are globally shared for now)

---

## 2. Users & Personas

### Persona A — "The Explorer"
A crypto-native researcher or developer who wants to quickly look up a known `.eth` address, see their social metadata, and understand how they relate to other names in a curated list.

**Jobs to be done:**
- Look up `vitalik.eth` and see their avatar, bio, and social links without searching Etherscan
- Import a list of ENS pairs and see them as a graph

### Persona B — "The Mapper"
A community organiser who wants to document relationships between project contributors, DAOs, or frens.

**Jobs to be done:**
- Add edges between known ENS names that aren't yet connected in the graph
- Delete incorrect edges that were added by mistake

---

## 3. Functional Requirements

### 3.1 Step 1 — ENS Profile Page

| ID | Requirement | Priority |
|---|---|---|
| F-01 | User can enter any ENS name in a search bar | P0 |
| F-02 | App resolves the ENS name to an Ethereum address via public RPC | P0 |
| F-03 | Profile page displays: resolved address (checksummed) | P0 |
| F-04 | Profile page displays: avatar (text record `avatar`) | P0 |
| F-05 | Profile page displays: display name (`name` record) | P0 |
| F-06 | Profile page displays: description / bio (`description` record) | P0 |
| F-07 | Profile page displays: website URL (`url` record) | P1 |
| F-08 | Profile page displays: Twitter / X handle (`com.twitter` record) | P1 |
| F-09 | Profile page displays: GitHub handle (`com.github` record) | P1 |
| F-10 | Profile page displays: Discord handle (`com.discord` record) | P1 |
| F-11 | Profile page displays: Telegram handle (`org.telegram` record) | P2 |
| F-12 | Profile page displays: email (`email` record) | P2 |
| F-13 | Profile page displays: content hash if set | P2 |
| F-14 | Only populated fields are rendered (empty fields are omitted) | P0 |
| F-15 | If ENS name does not exist or is unregistered, show a clear error state | P0 |
| F-16 | Profile page is accessible via direct URL: `/profile/:ensName` | P0 |

### 3.2 Step 2 — Graph Visualisation

| ID | Requirement | Priority |
|---|---|---|
| F-20 | User can input a newline-separated list of ENS name pairs | P0 |
| F-21 | Input accepts the format `name1.eth, name2.eth` per line | P0 |
| F-22 | App parses input and renders a force-directed graph | P0 |
| F-23 | Each node is labelled with the ENS name | P0 |
| F-24 | Nodes display avatar as node icon when available | P1 |
| F-25 | Clicking a node navigates to `/profile/:ensName` | P0 |
| F-26 | Graph is navigable: pan and zoom supported | P1 |
| F-27 | Graph layout is stable (no excessive jitter after settle) | P1 |
| F-28 | Graph handles ≥ 50 nodes without performance degradation | P1 |
| F-29 | Graph page accessible via `/graph` | P0 |

### 3.3 Step 3 — Edge Editing

| ID | Requirement | Priority |
|---|---|---|
| F-30 | User can add a new edge by entering two ENS names in a form | P0 |
| F-31 | User can delete an existing edge by clicking it and selecting "Remove" | P0 |
| F-32 | All edge operations call the Django REST API | P0 |
| F-33 | Edges are stored in PostgreSQL with `source`, `target`, `created_at` fields | P0 |
| F-34 | Graph initialises by fetching all stored edges from the API | P0 |
| F-35 | UI reflects edge additions/deletions without full page reload | P0 |
| F-36 | Duplicate edges (same source–target pair) are rejected by the API with 409 | P1 |
| F-37 | Self-loops (source == target) are rejected by the API with 400 | P1 |

---

## 4. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NF-01 | ENS resolution latency | < 3 s (p95) on a cold lookup |
| NF-02 | Graph render time for 50 nodes | < 2 s after data loaded |
| NF-03 | API response time for edge CRUD | < 300 ms (p95) |
| NF-04 | Frontend bundle size | < 500 KB gzipped |
| NF-05 | Mobile responsiveness | Profile page usable on 375 px viewport |
| NF-06 | CORS headers | Backend allows the deployed frontend origin |
| NF-07 | Environment secrets | No API keys or DB credentials in version control |
| NF-08 | Error handling | All unresolved ENS names and API errors show user-friendly messages |

---

## 5. User Flows

### 5.1 Look Up an ENS Profile

```
User lands on "/" 
  → sees search bar
  → types "vitalik.eth" and submits
  → app calls ENS resolver via ethers.js
  → app navigates to "/profile/vitalik.eth"
  → profile card renders with avatar, bio, social links
```

### 5.2 Explore a Social Graph

```
User navigates to "/graph"
  → sees textarea + "Load Graph" button
  → pastes list of ENS pairs
  → clicks "Load Graph"
  → force-directed graph renders
  → user clicks node "balajis.eth"
  → app navigates to "/profile/balajis.eth"
```

### 5.3 Add an Edge

```
User is on "/graph"
  → graph has loaded
  → user fills "Add Edge" form: source="vitalik.eth", target="balajis.eth"
  → clicks "Add"
  → POST /api/edges/ called
  → on 201 Created, new edge appears in graph without reload
```

### 5.4 Delete an Edge

```
User is on "/graph"
  → user clicks an edge line in the graph
  → tooltip appears: "Remove edge?"
  → user confirms
  → DELETE /api/edges/{id}/ called
  → on 204 No Content, edge disappears from graph
```

---

## 6. Constraints

- **3-hour build window** — scope is strictly limited to P0 requirements; P1/P2 are best-effort
- **No wallet required** — all ENS resolution via read-only public RPC
- **Free-tier infrastructure only** — Vercel + Render free tiers
- **No third-party ENS API** — resolution must use ethers.js directly against mainnet RPC

---

## 7. Out of Scope (v1.0)

- ENS subname support (e.g. `name.subdomain.eth`)
- Directed vs undirected edge distinction
- Edge weights or relationship types
- User authentication
- ENS name search autocomplete
- Mobile-native app
- Webhook / real-time sync when another user edits the graph

---

## 8. Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| Q1 | Should edges from the textarea input also persist to DB, or only via the Add Edge form? | Product | Day 0 |
| Q2 | What is the max number of ENS pairs the textarea should accept? | Engineering | Day 0 |
| Q3 | Should deleted edges be soft-deleted or hard-deleted? | Engineering | Day 0 |

---

## 9. Acceptance Criteria

The submission is considered complete when:

1. A live URL is provided that renders an ENS profile for any valid `.eth` name.
2. A graph page renders a visual network from a pasted list of ENS pairs.
3. Nodes in the graph are clickable and route to correct profile pages.
4. An examiner can add and delete edges from the browser, and those changes survive a page refresh.
5. All code is committed to a public GitHub repository.