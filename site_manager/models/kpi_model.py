from uuid import uuid4

from django.db import models

from shared.models import BaseModel
from shared.validators import validate_month_field

from .site_models import Site


class SiteKPI(BaseModel):
    """Site's Key Performance Indicators."""

    id = models.UUIDField(primary_key=True, default=uuid4)
    site = models.ForeignKey(Site, on_delete=models.DO_NOTHING)
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField(validators=[validate_month_field])

    # Production KPIs (Unit is tonnes)
    target_overburden_production = models.FloatField(null=True)
    target_ore_production = models.FloatField(null=True)
    actual_overburden_production = models.FloatField(
        null=True,
    )
    actual_ore_production = models.FloatField(
        null=True,
    )

    # Stock Volume KPI (Unit is cubic meters)
    stock_volume = models.FloatField(
        null=True,
    )

    # Safety Index KPIs (Unit is kilometers)
    haul_road_distance_under_gradient_issue = models.FloatField(
        null=True,
    )
    haul_road_distance_under_width_issue = models.FloatField(
        null=True,
    )

    class Meta:
        unique_together = ("site", "year", "month")
