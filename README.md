# 🌐 ENS Network Explorer

> Visualize the Ethereum Name Service social graph — explore profiles, map relationships, and curate your own on-chain network.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node 20+](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org/)

---

## ✨ Features

| Feature | Description |
|---|---|
| **ENS Profile Pages** | Resolve any `.eth` name to a rich profile — avatar, bio, social links, wallet address, and all on-chain records |
| **Social Graph Visualisation** | Render an interactive, force-directed graph of ENS name pairs with D3.js |
| **Clickable Nodes** | Each node routes to the corresponding ENS profile page |
| **Editable Edges** | Add or delete friend relationships directly in the browser |
| **Persistent Storage** | All user-defined edges are stored in PostgreSQL via a Django REST API |

---

## 🏗️ Tech Stack

### Frontend
- **React 18** + **TypeScript** — component framework
- **Vite** — build tool
- **D3.js v7** — force-directed graph visualisation
- **ethers.js v6** — ENS resolution via public Ethereum RPC
- **TailwindCSS** — utility-first styling
- **React Router v6** — client-side routing

### Backend
- **Django 5** + **Django REST Framework** — API layer
- **PostgreSQL 16** — persistent edge storage
- **Gunicorn** — WSGI server
- **python-dotenv** — environment configuration

### Infrastructure
- **Frontend** → Vercel (free tier)
- **Backend + DB** → Render (free tier)
- **Ethereum RPC** → Cloudflare Ethereum Gateway (public, no key required)

---

## 🚀 Quick Start

### Prerequisites
```
node >= 20
python >= 3.11
postgresql >= 14
```

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/ens-network-explorer.git
cd ens-network-explorer
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and SECRET_KEY

# Run migrations
python manage.py migrate

# Start dev server
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your VITE_API_BASE_URL

# Start dev server
npm run dev
```

### 4. Open in Browser
```
Frontend:  http://localhost:5173
Backend:   http://localhost:8000
API Docs:  http://localhost:8000/api/schema/swagger/
```

---

## 📁 Project Structure

```
ens-network-explorer/
├── frontend/                   # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProfileCard/    # ENS profile display
│   │   │   ├── Graph/          # D3 force-directed graph
│   │   │   └── EdgeEditor/     # Add / delete edges UI
│   │   ├── pages/
│   │   │   ├── ProfilePage.tsx
│   │   │   └── GraphPage.tsx
│   │   ├── hooks/
│   │   │   ├── useENS.ts       # ENS resolution logic
│   │   │   └── useGraph.ts     # Graph state management
│   │   ├── services/
│   │   │   ├── ens.ts          # ethers.js ENS calls
│   │   │   └── api.ts          # Django REST client
│   │   └── types/
│   │       └── index.ts
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                    # Django REST API
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── graph/                  # Core Django app
│   │   ├── models.py           # Edge model
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── requirements.txt
│   └── manage.py
│
├── docs/
│   ├── README.md
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── CHECKLIST.md
│
└── docker-compose.yml          # Local dev orchestration
```

---

## 🔌 API Reference

### Edges

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/edges/` | List all edges (optionally filtered by `?node=vitalik.eth`) |
| `POST` | `/api/edges/` | Create a new edge `{ source, target }` |
| `DELETE` | `/api/edges/{id}/` | Delete an edge by ID |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health/` | Service health check |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm run test
```

---

## 🌍 Deployment

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for full deployment topology.

### One-Click Deploy (Render)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Deploy (Vercel + Render)

```bash
# Frontend → Vercel
cd frontend && vercel --prod

# Backend → Render
# Push to GitHub; Render auto-deploys via render.yaml (Blueprint)
git push origin main
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `feat: add edge weight support`
4. Open a Pull Request

---

## 📄 License

MIT — see [LICENSE](./LICENSE).