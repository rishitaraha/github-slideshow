import glob
import os
from tempfile import TemporaryDirectory
from typing import Generator

from osgeo import ogr, osr
from rest_framework.exceptions import NotFound, ValidationError

from rainbow.exceptions.custom_exceptions import CRSNotFound
from shared.constants import EPSG
from shared.exception_handling import ApiErrors, ValidationErrors
from shared.helpers import slugify

from ..constants import VectorFileFormat
from ..models import Feature, Layer
from .schemas import PrepareVectorFileResponseSchema, VectorDataSchema


def prepare_vector_files_for_download(layer: Layer, response_format: str):
    # Checking if features is present in layer.
    if Feature.objects.filter(layer=layer).count() == 0:
        raise NotFound(ApiErrors.NO_FEATURE_PRESENT_FOR_THE_LAYER.value)

    response: PrepareVectorFileResponseSchema = {}

    if response_format == VectorFileFormat.SHAPEFILE.value:
        response["file"] = Feature.export_manager.export_to_shp(layer)
        response["filename"] = f"{slugify(layer.name)}_shp.zip"
        response["content_type"] = "application/zip"

    elif response_format == VectorFileFormat.DXF.value:
        response["file"] = Feature.export_manager.export_to_dxf(layer)
        response["filename"] = f"{slugify(layer.name)}_dxf.dxf"
        response["content_type"] = "application/dxf"

    elif response_format == VectorFileFormat.KML.value:
        response["file"] = Feature.export_manager.export_to_kml(layer)
        response["filename"] = f"{slugify(layer.name)}_kml.kml"
        response["content_type"] = "application/kml"

    else:
        raise ValidationError(ValidationErrors.INVALID_RESPONSE_FORMAT.value)

    return response


def extract_geometry_and_attributes(
    vector_file_path: str,
) -> Generator[VectorDataSchema, None, None]:
    """
    Extract geometry and attributes from a vector file.

    Args:
        - vector_file_path: Path to the vector file to be processed.

    Yields:
       A generator that yields dictionaries with extracted geometry and attributes.
    """

    # Open the input shapefile
    vector_datasource: ogr.DataSource = ogr.Open(vector_file_path)
    layer: ogr.Layer = vector_datasource.GetLayer()

    # Fetching CRS of uploaded file.
    layer_srs = layer.GetSpatialRef()
    epsg = layer_srs.GetAttrValue("AUTHORITY", 1) if layer_srs else None
    if epsg is None:
        raise CRSNotFound

    # Transform the geometry to WGS84 if the layer's CRS is not already in WGS84.
    transformer = None
    if int(epsg) != EPSG.WGS84.value:
        target_srs = osr.SpatialReference()
        target_srs.ImportFromEPSG(EPSG.WGS84.value)
        target_srs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)

        transformer = osr.CoordinateTransformation(layer_srs, target_srs)
        del target_srs
    del layer_srs

    # Fetch wkt and attribute from feature.
    for feature in layer:
        geom: ogr.Geometry = feature.geometry()
        if geom is None:
            continue

        if transformer:
            geom.Transform(transformer)

        attributes = {
            feature.GetFieldDefnRef(i).GetName(): feature.GetField(i)
            for i in range(feature.GetFieldCount())
        }

        yield {"geometry": geom.ExportToWkt(), "attributes": attributes}
        del geom

    # Clear memory.
    if transformer:
        del transformer
    del attributes
    del feature
    del layer
    del vector_datasource


def parse_uploaded_shapefile(
    shape_file_dir: TemporaryDirectory,
) -> Generator[VectorDataSchema, None, None]:
    """
    Extract geometry and attributes from uploaded shapefile.

    Yields:
       A generator that yields dictionaries with extracted geometry and attributes.
    """

    # Finding shp file in extracted files.
    shp_file_path = None
    if file_path := glob.glob(os.path.join(shape_file_dir.name, "*.shp")):
        shp_file_path = file_path[0]

    if not shp_file_path:
        raise FileNotFoundError

    yield from extract_geometry_and_attributes(shp_file_path)
