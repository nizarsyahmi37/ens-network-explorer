"""Local development settings — DEBUG on, SQLite fallback, permissive CORS."""
import os

from .base import *  # noqa: F401,F403
from .base import BASE_DIR

SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "django-insecure-dev-key-do-not-use-in-production-0123456789abcdef",
)

DEBUG = True

ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

CORS_ALLOW_ALL_ORIGINS = True
