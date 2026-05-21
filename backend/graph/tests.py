"""Tests for the graph app — model constraints, serializer, and API."""
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Edge
from .serializers import EdgeSerializer, validate_ens_name


class EdgeModelTests(TestCase):
    def test_save_normalises_case_and_whitespace(self):
        edge = Edge.objects.create(source="  Vitalik.eth  ", target="BALAJIS.eth")
        self.assertEqual(edge.source, "vitalik.eth")
        self.assertEqual(edge.target, "balajis.eth")
        self.assertIsNotNone(edge.id)
        self.assertIsNotNone(edge.created_at)

    def test_self_loop_blocked_by_clean(self):
        with self.assertRaises(ValidationError):
            Edge.objects.create(source="vitalik.eth", target="vitalik.eth")

    def test_unique_pair_blocked_by_model_validation(self):
        Edge.objects.create(source="a.eth", target="b.eth")
        with self.assertRaises(ValidationError):
            Edge.objects.create(source="a.eth", target="b.eth")

    def test_unique_pair_enforced_at_db_level(self):
        from django.db import connection

        Edge.objects.create(source="a.eth", target="b.eth")
        # Bypass model validation and confirm the DB constraint still fires.
        with self.assertRaises(IntegrityError), transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO graph_edge (id, source, target, created_at) "
                    "VALUES (%s, %s, %s, datetime('now'))",
                    ["11111111-1111-1111-1111-111111111111", "a.eth", "b.eth"],
                )


class EnsValidationTests(TestCase):
    def test_accepts_basic_eth_name(self):
        self.assertEqual(validate_ens_name("Vitalik.ETH"), "vitalik.eth")

    def test_accepts_subname(self):
        self.assertEqual(validate_ens_name("sub.vitalik.eth"), "sub.vitalik.eth")

    def test_rejects_missing_suffix(self):
        from rest_framework.exceptions import ValidationError as DRFValidationError

        with self.assertRaises(DRFValidationError):
            validate_ens_name("vitalik")

    def test_rejects_invalid_chars(self):
        from rest_framework.exceptions import ValidationError as DRFValidationError

        with self.assertRaises(DRFValidationError):
            validate_ens_name("vit alik.eth")


class EdgeSerializerTests(TestCase):
    def test_self_loop_rejected_in_validate(self):
        serializer = EdgeSerializer(
            data={"source": "vitalik.eth", "target": "Vitalik.ETH"},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("target", serializer.errors)


class HealthEndpointTests(APITestCase):
    def test_health_returns_ok(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["db"], "connected")


class EdgeApiTests(APITestCase):
    def test_create_edge_returns_201(self):
        response = self.client.post(
            "/api/edges/",
            {"source": "vitalik.eth", "target": "balajis.eth"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["source"], "vitalik.eth")
        self.assertEqual(response.data["target"], "balajis.eth")
        self.assertIn("id", response.data)
        self.assertIn("created_at", response.data)

    def test_duplicate_edge_returns_409(self):
        Edge.objects.create(source="a.eth", target="b.eth")
        response = self.client.post(
            "/api/edges/",
            {"source": "a.eth", "target": "b.eth"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_self_loop_returns_400(self):
        response = self.client.post(
            "/api/edges/",
            {"source": "vitalik.eth", "target": "vitalik.eth"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_suffix_returns_400(self):
        response = self.client.post(
            "/api/edges/",
            {"source": "vitalik", "target": "balajis.eth"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_edges(self):
        Edge.objects.create(source="a.eth", target="b.eth")
        Edge.objects.create(source="b.eth", target="c.eth")
        response = self.client.get("/api/edges/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_edges_filtered_by_node(self):
        Edge.objects.create(source="a.eth", target="b.eth")
        Edge.objects.create(source="x.eth", target="y.eth")
        Edge.objects.create(source="b.eth", target="c.eth")
        response = self.client.get("/api/edges/?node=B.ETH")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        nodes = {row["source"] for row in response.data} | {
            row["target"] for row in response.data
        }
        self.assertIn("b.eth", nodes)

    def test_delete_edge_returns_204(self):
        edge = Edge.objects.create(source="a.eth", target="b.eth")
        response = self.client.delete(f"/api/edges/{edge.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Edge.objects.filter(id=edge.id).exists())

    def test_delete_missing_edge_returns_404(self):
        response = self.client.delete(
            "/api/edges/00000000-0000-0000-0000-000000000000/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_methods_not_allowed(self):
        edge = Edge.objects.create(source="a.eth", target="b.eth")
        put = self.client.put(
            f"/api/edges/{edge.id}/",
            {"source": "a.eth", "target": "c.eth"},
            format="json",
        )
        patch = self.client.patch(
            f"/api/edges/{edge.id}/",
            {"target": "c.eth"},
            format="json",
        )
        self.assertEqual(put.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(patch.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
