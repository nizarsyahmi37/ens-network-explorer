"""URL routing for the graph app."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EdgeViewSet, health

router = DefaultRouter()
router.register(r"edges", EdgeViewSet, basename="edge")

urlpatterns = [
    path("health/", health, name="health"),
    path("", include(router.urls)),
]
