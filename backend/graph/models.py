"""Models for the ENS social-graph edges."""
import uuid

from django.core.exceptions import ValidationError
from django.db import models


def normalise_ens(name: str) -> str:
    return (name or "").strip().lower()


class Edge(models.Model):
    """An undirected relationship between two ENS names."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source = models.CharField(max_length=255)
    target = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["source", "target"],
                name="uq_edge_source_target",
            ),
            models.CheckConstraint(
                check=~models.Q(source=models.F("target")),
                name="chk_edge_no_self_loop",
            ),
        ]
        indexes = [
            models.Index(fields=["source"]),
            models.Index(fields=["target"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.source} <-> {self.target}"

    def clean(self) -> None:
        self.source = normalise_ens(self.source)
        self.target = normalise_ens(self.target)
        if self.source == self.target:
            raise ValidationError("source and target must differ")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
