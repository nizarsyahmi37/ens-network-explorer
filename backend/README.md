# ENS Network Explorer — Backend

Django 5 + Django REST Framework API that persists the user-curated edges of the ENS social graph.

See the repo root [`README.md`](../README.md), [`PRD.md`](../PRD.md), and [`ARCHITECTURE.md`](../ARCHITECTURE.md) for product and system context. For deployment, see [`../DEPLOY.md`](../DEPLOY.md).

## Quick start

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env            # only DJANGO_SETTINGS_MODULE is required in dev

python manage.py migrate
python manage.py runserver
```

The development settings module (`config.settings.development`) uses SQLite and permissive CORS — no Postgres needed locally. The API is at http://localhost:8000/api/.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET`  | `/api/health/` | `{"status":"ok","db":"connected"}` |
| `GET`  | `/api/edges/` | List edges. Optional `?node=vitalik.eth` filter (matches `source` OR `target`) |
| `POST` | `/api/edges/` | Body: `{"source":"a.eth","target":"b.eth"}` → 201 / 400 / 409 |
| `DELETE` | `/api/edges/{uuid}/` | 204 on success, 404 if not found |
| `GET`  | `/api/schema/` | OpenAPI 3 schema (drf-spectacular) |
| `GET`  | `/api/schema/swagger/` | Interactive Swagger UI explorer |

Validation rules (enforced by `EdgeSerializer`):

- `source` and `target` must match `*.eth` (lowercased, hyphen/alnum labels)
- `source != target` → **400**
- `(source, target)` is unique → **409** on duplicate

## Project structure

```
backend/
├── manage.py
├── requirements.txt
├── Procfile                # gunicorn web + release-phase migrate
├── runtime.txt             # python-3.11.x
├── render.yaml             # Render Blueprint (web service + Postgres)
├── .env.example
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── wsgi.py
│   ├── urls.py             # /admin, /api/, /api/schema, /api/schema/swagger
│   └── settings/
│       ├── __init__.py
│       ├── base.py         # Shared settings (INSTALLED_APPS, REST_FRAMEWORK, etc.)
│       ├── development.py  # DEBUG=True, SQLite, permissive CORS
│       └── production.py   # DEBUG=False, DATABASE_URL, HSTS, secure cookies
└── graph/                  # Core application
    ├── __init__.py
    ├── apps.py
    ├── admin.py
    ├── models.py           # Edge (UUID id, source, target, created_at)
    ├── serializers.py      # EdgeSerializer with .eth + uniqueness validation
    ├── views.py            # EdgeViewSet (list, create, destroy) + health
    ├── urls.py             # DRF router
    ├── migrations/
    │   └── 0001_initial.py
    └── tests.py
```

## Data model

```python
class Edge(models.Model):
    id = UUIDField(primary_key=True, default=uuid4)
    source = CharField(max_length=255)
    target = CharField(max_length=255)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("source", "target")]
        constraints = [CheckConstraint(check=~Q(source=F("target")), name="chk_no_self_loop")]
```

Indexes are created on `source` and `target` for the `?node=` filter.

## Settings modules

Settings are split between three files in `config/settings/`:

| Module | Used when | Notable |
|---|---|---|
| `base.py` | always (re-exported by both) | `INSTALLED_APPS`, `REST_FRAMEWORK`, `SPECTACULAR_SETTINGS` |
| `development.py` | local dev | `DEBUG=True`, SQLite fallback, `CORS_ALLOW_ALL_ORIGINS=True` |
| `production.py` | Render | `DEBUG=False`, `dj_database_url` reads `DATABASE_URL`, `SECURE_*` hardening, CORS locked to `CORS_ALLOWED_ORIGINS` |

Switch via the `DJANGO_SETTINGS_MODULE` env var:

- Local: `config.settings.development` (set in `.env`)
- Render: `config.settings.production` (set in `render.yaml`)

## Environment variables

### Required everywhere
| Name | Default | Notes |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | (none) | `config.settings.development` locally, `config.settings.production` on Render |

### Production-only (Render)
| Name | Set by | Notes |
|---|---|---|
| `SECRET_KEY` | `render.yaml` `generateValue: true` | 50+ char random; required at boot |
| `DATABASE_URL` | Render Postgres binding | Auto-injected `postgresql://…` |
| `ALLOWED_HOSTS` | `render.yaml` | `ens-network-api.onrender.com` (plus `RENDER_EXTERNAL_HOSTNAME` is appended automatically) |
| `CORS_ALLOWED_ORIGINS` | dashboard (`sync: false`) | Comma-separated Vercel URLs |
| `CSRF_TRUSTED_ORIGINS` | dashboard (`sync: false`) | Same as `CORS_ALLOWED_ORIGINS` |

The blueprint marks `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` as `sync: false` because they depend on the frontend URL — fill them in after the first Vercel deploy (see [`../DEPLOY.md`](../DEPLOY.md) Phase 3).

## Production hardening

`config/settings/production.py` enforces:

- `DEBUG=False`
- `SECURE_PROXY_SSL_HEADER` so Django trusts Render's forwarded HTTPS
- `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`
- HSTS for 30 days, including subdomains, with preload
- `X_FRAME_OPTIONS = "DENY"`, `SECURE_CONTENT_TYPE_NOSNIFF`, `SECURE_REFERRER_POLICY = "same-origin"`
- TLS-only Postgres (`ssl_require=True`) with `conn_max_age=600` for connection reuse

## Running tests

```bash
python manage.py test
```

`graph/tests.py` covers serializer validation (`.eth` suffix, source ≠ target), model constraints (unique_together, check constraint), and the full request/response cycle for all endpoints.

## Deploying to Render

Push to GitHub and let Render pick up [`render.yaml`](./render.yaml) as a Blueprint. The blueprint provisions a free PostgreSQL 16 instance, runs migrations as part of the build, and starts Gunicorn. After the first deploy, set `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` in the Render dashboard to the Vercel URL of the frontend.

Full step-by-step in [`../DEPLOY.md`](../DEPLOY.md).
