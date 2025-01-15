from uuid import uuid4

import shapely
from django.contrib.gis.db import models as gismodels
from django.db import models

from shared.helpers.gis_helpers import convert_geometry_2d_to_3d
from shared.models import BaseModel, ImageInfo

from ..constants import FeatureType
from ..managers import FeatureExportManager, FeatureManager
from .layer_models import Layer


class Feature(BaseModel):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid4)
    name = models.CharField(max_length=100, null=True)
    geometry = gismodels.GeometryField(dim=3)
    layer = models.ForeignKey(
        Layer, on_delete=models.DO_NOTHING, related_name="features"
    )
    type = models.CharField(max_length=50, choices=FeatureType.choices(), blank=True)
    properties = models.JSONField(null=True)
    info = models.TextField(null=True, blank=True)
    attributes = models.JSONField(null=True)

    # Managers.
    objects = FeatureManager()
    export_manager = FeatureExportManager()

    # Methods.
    def get_2d_geometry_wkt(self) -> str:
        shapely_geom = shapely.from_wkt(self.geometry.wkt)
        return str(shapely.force_2d(shapely_geom))

    def save(self, *args, **kwargs):
        # Setting geometry type if not present.
        if not self.type:
            self.type = self.geometry.geom_type

        self.geometry = convert_geometry_2d_to_3d(self.geometry)

        return super(Feature, self).save(*args, **kwargs)

    class Meta:
        pass


class FeatureImage(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid4)
    feature = models.ForeignKey(Feature, on_delete=models.CASCADE)
    image = models.OneToOneField(ImageInfo, on_delete=models.CASCADE)
