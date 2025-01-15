from django.contrib import admin

from .models import DefaultPreset, OrgPreset


# Register OrgPreset Model
@admin.register(OrgPreset)
class OrgPresetAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "org")
    search_fields = ("name", "org__name")
    list_filter = ("org__name",)
    list_per_page = 25


# Register DefaultPreset Model
@admin.register(DefaultPreset)
class DefaultPresetAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at", "updated_at")
    search_fields = ("name",)
    list_per_page = 25
