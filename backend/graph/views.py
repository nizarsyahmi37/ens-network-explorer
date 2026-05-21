"""Views for the graph app."""
from django.db import IntegrityError, connection
from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Edge, normalise_ens
from .serializers import EdgeSerializer


class EdgeViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """List, create, or delete edges. No update — edges are immutable once created."""

    queryset = Edge.objects.all()
    serializer_class = EdgeSerializer

    def get_queryset(self):
        qs = Edge.objects.all()
        node = self.request.query_params.get("node")
        if node:
            node = normalise_ens(node)
            qs = qs.filter(Q(source=node) | Q(target=node))
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        source = serializer.validated_data["source"]
        target = serializer.validated_data["target"]

        if Edge.objects.filter(source=source, target=target).exists():
            return Response(
                {"detail": "An edge between these ENS names already exists."},
                status=status.HTTP_409_CONFLICT,
            )

        try:
            self.perform_create(serializer)
        except IntegrityError:
            return Response(
                {"detail": "An edge between these ENS names already exists."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([AllowAny])
def health(_request):
    """Simple liveness + DB-reachable check."""
    db_ok = True
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:  # pragma: no cover - defensive
        db_ok = False
    payload = {"status": "ok" if db_ok else "degraded", "db": "connected" if db_ok else "down"}
    http_status = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response(payload, status=http_status)
