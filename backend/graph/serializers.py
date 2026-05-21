"""Serializers for the graph app."""
import re

from rest_framework import serializers

from .models import Edge, normalise_ens

ENS_LABEL_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$")
ENS_MAX_LEN = 253


def validate_ens_name(value: str) -> str:
    name = normalise_ens(value)
    if not name or not name.endswith(".eth"):
        raise serializers.ValidationError("Must be an ENS name ending in '.eth'.")
    if len(name) > ENS_MAX_LEN:
        raise serializers.ValidationError(
            f"ENS name must be {ENS_MAX_LEN} characters or fewer."
        )
    labels = name.split(".")
    if len(labels) < 2 or any(not ENS_LABEL_RE.match(label) for label in labels):
        raise serializers.ValidationError(
            "Must be a valid ENS name (lowercase alphanumerics and hyphens; "
            "labels separated by '.', ending in '.eth')."
        )
    return name


class EdgeSerializer(serializers.ModelSerializer):
    source = serializers.CharField(validators=[validate_ens_name])
    target = serializers.CharField(validators=[validate_ens_name])

    class Meta:
        model = Edge
        fields = ("id", "source", "target", "created_at")
        read_only_fields = ("id", "created_at")
        # Suppress the auto-generated UniqueTogetherValidator so duplicates
        # surface as 409 from the view rather than 400 from the serializer.
        validators = []

    def validate(self, attrs):
        source = normalise_ens(attrs.get("source", ""))
        target = normalise_ens(attrs.get("target", ""))
        if source == target:
            raise serializers.ValidationError(
                {"target": "source and target must differ (no self-loops)."}
            )
        attrs["source"] = source
        attrs["target"] = target
        return attrs
