# ENS Network Explorer — Backend

Django 5 + Django REST Framework API that persists the user-curated edges of the ENS social graph.

See the repo root [`README.md`](../README.md), [`PRD.md`](../PRD.md), and
[`ARCHITECTURE.md`](../ARCHITECTURE.md) for product and system context.

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

The development settings module (`config.settings.development`) uses SQLite and
permissive CORS — no Postgres needed locally.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET`  | `/api/health/` | `{"status":"ok","db":"connected"}` |
| `GET`  | `/api/edges/` | List edges. Optional `?node=vitalik.eth` filter |
| `POST` | `/api/edges/` | Body: `{"source":"a.eth","target":"b.eth"}` → 201 / 400 / 409 |
| `DELETE` | `/api/edges/{uuid}/` | 204 on success |
| `GET`  | `/api/schema/swagger/` | Interactive OpenAPI explorer |

Validation rules (all enforced by `EdgeSerializer`):

- `source` and `target` must match `*.eth` (lowercased, hyphen/alnum labels).
- `source != target` → 400.
- `(source, target)` is unique → 409 on duplicate.

## Running tests

```bash
python manage.py test
```

## Deploying to Render

Push to GitHub and let Render pick up [`render.yaml`](./render.yaml) as a Blueprint.
The blueprint provisions a free PostgreSQL 16 instance, runs migrations as part
of the build, and starts Gunicorn. After the first deploy, set
`CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` in the Render dashboard to the
Vercel URL of the frontend.
