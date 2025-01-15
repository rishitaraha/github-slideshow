from rest_framework import serializers

from ..models import SiteKPI


class ProductionKpiSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteKPI
        fields = (
            "id",
            "site",
            "year",
            "month",
            "target_overburden_production",
            "target_ore_production",
            "actual_overburden_production",
            "actual_ore_production",
        )


class StockVolumeKpiSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteKPI
        fields = ("id", "site", "year", "month", "stock_volume")


class SafetyIndexKpiSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteKPI
        fields = (
            "id",
            "site",
            "year",
            "month",
            "haul_road_distance_under_gradient_issue",
            "haul_road_distance_under_width_issue",
        )
