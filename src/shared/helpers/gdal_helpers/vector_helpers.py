from typing import List

from osgeo.ogr import CreateGeometryFromWkt, Feature, Geometry, GetDriverByName
from osgeo.osr import SpatialReference

from ...constants import VectorDriver


def create_shapefile_from_geometries(geometries: List[Geometry], output_path: str):
    """
    Creates a shapefile from a list of geometries.

    Args:
        - geometries (List[Geometry]): A list of OGR Geometry objects to be saved in the shapefile.
        - output_path (str): Path where the shapefile will be saved.

    Raises:
        ValueError: If the input list is empty or if geometries have inconsistent spatial references.
    """
    if not geometries:
        raise ValueError(
            "The geometries list is empty. At least one geometry is required."
        )

    # Check for consistent spatial references.
    spatial_ref = geometries[0].GetSpatialReference()
    if not all(geom.GetSpatialReference().IsSame(spatial_ref) for geom in geometries):
        raise ValueError("All geometries must have the same spatial reference.")

    # Get the geometry type and ensure all geometries are of the same type.
    geometry_type = geometries[0].GetGeometryType()
    if not all(geom.GetGeometryType() == geometry_type for geom in geometries):
        raise ValueError("All geometries must have the same type.")

    # Create the shapefile using the ESRI Shapefile driver.
    driver = GetDriverByName(VectorDriver.ESRI_SHAPEFILE.value)
    if driver is None:
        raise RuntimeError("ESRI Shapefile driver is not available.")

    data_source = driver.CreateDataSource(output_path)
    if data_source is None:
        raise RuntimeError(f"Failed to create data source at {output_path}.")

    # Create a layer with the appropriate spatial reference and geometry type.
    layer_name = "layer"
    layer = data_source.CreateLayer(layer_name, spatial_ref, geometry_type)
    if layer is None:
        raise RuntimeError(f"Failed to create layer in the shapefile at {output_path}.")

    # Create and add features to the layer.
    for geometry in geometries:
        feature = Feature(layer.GetLayerDefn())
        feature.SetGeometry(geometry)
        if layer.CreateFeature(feature) != 0:
            raise RuntimeError(
                f"Failed to create feature for geometry: {geometry.ExportToWkt()}"
            )

    # Save and close the data source.
    data_source = None


def create_geometries_from_wkts(wkts: List[str], epsg: int) -> List[Geometry]:
    """
    Converts WKT strings to GDAL Geometry objects with an assigned spatial reference.

    Args:
        wkts (List[str]): List of WKT strings.
        epsg (int): EPSG code for the spatial reference system.

    Returns:
        List[Geometry]: List of GDAL Geometry objects with spatial reference.
    """
    geometries = []
    for wkt in wkts:
        geometry = CreateGeometryFromWkt(wkt)
        if geometry is None:
            raise RuntimeError(f"Invalid WKT: {wkt}")

        spatial_ref = SpatialReference()
        spatial_ref.ImportFromEPSG(epsg)
        geometry.AssignSpatialReference(spatial_ref)
        geometries.append(geometry)
    return geometries
