from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.geos.error import GEOSException

from rainbow import logger

from ..constants import GeometryType


def is_polygon(wkt: str):
    try:
        geometry: GEOSGeometry = GEOSGeometry(wkt)
        is_polygon_geometry = geometry.geom_type == GeometryType.POLYGON.value
        return geometry.valid and is_polygon_geometry
    except GEOSException as geos_exception:
        logger.debug(geos_exception)
        return False


def is_multi_polygon(wkt: str):
    try:
        geometry: GEOSGeometry = GEOSGeometry(wkt)
        is_multipolygon_geometry = (
            geometry.geom_type == GeometryType.MULTI_POLYGON.value
        )
        # Shapely do not allow overlapping polygons in multi-polygon so we cant use valid property
        return is_multipolygon_geometry
    except GEOSException as geos_exception:
        logger.debug(geos_exception)
        return False
