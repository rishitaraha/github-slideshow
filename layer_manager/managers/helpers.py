from typing import Iterable, TypeVar

from django.db import models

from shared.helpers.gis_helpers import convert_geometry_2d_to_3d, get_polygon_area

from ..constants import FeatureType

# Generic type can consist any model.
FeatureSchema = TypeVar("FeatureSchema", bound=models.Model)


def prepare_features_for_bulk_operation(instances: Iterable[FeatureSchema]):
    for feature in instances:
        feature.geometry = convert_geometry_2d_to_3d(feature.geometry)

        # Assigning type to feature.
        if not feature.type:
            feature.type = feature.geometry.geom_type

        # Calculating area of polygons.
        if feature.type == FeatureType.POLYGON.value and feature.geometry != None:
            feature.properties = feature.properties or {}
            feature.properties["area"] = get_polygon_area(feature.geometry)

        yield feature
