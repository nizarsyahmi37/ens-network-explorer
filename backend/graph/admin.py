from django.contrib import admin

from .models import Edge


@admin.register(Edge)
class EdgeAdmin(admin.ModelAdmin):
    list_display = ("source", "target", "created_at")
    search_fields = ("source", "target")
    readonly_fields = ("id", "created_at")
