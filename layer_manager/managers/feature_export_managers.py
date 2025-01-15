import os
import shutil
import tempfile

from django.db.models import Manager, Q
from osgeo import ogr
from osgeo.osr import OAMS_TRADITIONAL_GIS_ORDER, SpatialReference

from shared.constants import EPSG, VECTOR_DRIVER_EXTENSION, VectorDriver
from shared.helpers import slugify

from ..constants import FeatureType


class FeatureExportManager(Manager):
    def __create_vector_file(
        self,
        layer,
        driver_name: VectorDriver,
        output_path: str,
        feature_type: FeatureType = None,
        return_file=False,
    ):
        """
        Creates a vector file of the given vector layer and saves it in a specified format.
        Returns a file object in binary if `return_file` is True else None.

        Args:
            - layer: Layer model instance from which the vector file will be created.
            - driver_name: The name of the vector driver to be used for creating the vector file.
            - output_path: The path of the file to be created.
            - feature_type (optional): The type of feature to be included in vector file. If not provided, all features in the layer will be included.
            - return_file (optional): Returns a binary file object if set to `True`. Does not return the file by default.
        """
        output_path = f"{output_path}.{VECTOR_DRIVER_EXTENSION[driver_name]}"

        driver: ogr.Driver = ogr.GetDriverByName(driver_name.value)
        datasource: ogr.DataSource = driver.CreateDataSource(output_path)

        # Assigning WGS84 CRS as it is the default CRS we use.
        srs = SpatialReference()
        srs.ImportFromEPSG(EPSG.WGS84.value)

        # Set the coordinate axis mapping strategy to traditional GIS order means (longitude, latitude) or (easting, northing).
        # Ref: https://gdal.org/tutorials/osr_api_tut.html#crs-and-axis-order
        srs.SetAxisMappingStrategy(OAMS_TRADITIONAL_GIS_ORDER)

        # Create a new gdal layer for the geometries.
        # Making layer name XML valid with 'slugify'.
        gdal_layer: ogr.Layer = datasource.CreateLayer(slugify(layer.name), srs)

        # Layer filter query.
        # Ref: https://docs.djangoproject.com/en/4.0/topics/db/queries/#complex-lookups-with-q-objects
        filter_query = Q(layer=layer)
        if feature_type:
            filter_query &= Q(type=feature_type.value)

        # Add the geometries to the layer.
        for geometry in self.model.objects.filter(filter_query).values_list(
            "geometry", flat=True
        ):
            feature = ogr.Feature(gdal_layer.GetLayerDefn())
            gdal_geometry: ogr.Geometry = ogr.CreateGeometryFromWkt(geometry.wkt)
            feature.SetGeometry(gdal_geometry)
            gdal_layer.CreateFeature(feature)

            del feature
            del gdal_geometry

        del gdal_layer
        del datasource
        del driver

        if return_file:
            with open(output_path, "rb") as vector_file:
                return vector_file.read()

    def export_to_shp(self, layer):
        # This temp directory will be deleted automatically after function run.
        temp_dir = tempfile.TemporaryDirectory()

        # Zip file paths.
        zip_container_dir = os.path.join(temp_dir.name, f"{slugify(layer.name)}_shp")

        # Feature count.
        features_count = self.model.objects.get_feature_count(layer.id)
        features_count_list = list(features_count.values())

        """
        let's say features_count = {polygon: 1, line: 2, point: 0, textbox: 3}
        then feature_count_list = [1, 2, 0, 3]
        For getting the total no. of feature type count, we will be ignoring the occurences of 0 in the feature_count_list.
            e.g, feature_count_list = [1, 2, 0, 3]
                 total_features_type_count = 3 (since we are ignoring occurences of 0 here).
        """
        total_features_type_count = len(
            features_count_list
        ) - features_count_list.count(0)

        # Creating point shp.
        if features_count["points"] > 0 or features_count["textbox"] > 0:
            point_feature_shp_zip = os.path.join(zip_container_dir, "point-feature_shp")
            point_feature_shp = os.path.join(temp_dir.name, "point-feature_shp")
            os.makedirs(point_feature_shp)
            self.__create_vector_file(
                layer,
                VectorDriver.ESRI_SHAPEFILE,
                output_path=f"{point_feature_shp}/points",
                feature_type=FeatureType.POINT,
            )
            shutil.make_archive(point_feature_shp_zip, "zip", point_feature_shp)
            feature_shp_zip_path = point_feature_shp_zip

        # Creating line shp.
        if features_count["lines"] > 0:
            line_feature_shp_zip = os.path.join(zip_container_dir, "line-feature_shp")
            line_feature_shp = os.path.join(temp_dir.name, "line-feature_shp")
            os.makedirs(line_feature_shp)
            self.__create_vector_file(
                layer,
                VectorDriver.ESRI_SHAPEFILE,
                output_path=f"{line_feature_shp}/lines",
                feature_type=FeatureType.LINE_STRING,
            )
            shutil.make_archive(line_feature_shp_zip, "zip", line_feature_shp)
            feature_shp_zip_path = line_feature_shp_zip

        # Creating polygon shp.
        if features_count["polygons"] > 0:
            polygon_feature_shp_zip = os.path.join(
                zip_container_dir, "polygon-feature_shp"
            )
            polygon_feature_shp = os.path.join(temp_dir.name, "polygon-feature_shp")
            os.makedirs(polygon_feature_shp)
            self.__create_vector_file(
                layer,
                VectorDriver.ESRI_SHAPEFILE,
                output_path=f"{polygon_feature_shp}/polygons",
                feature_type=FeatureType.POLYGON,
            )
            shutil.make_archive(polygon_feature_shp_zip, "zip", polygon_feature_shp)
            feature_shp_zip_path = polygon_feature_shp_zip

        if total_features_type_count == 1:
            with open(f"{feature_shp_zip_path}.zip", "rb") as feature_shp_zip:
                return feature_shp_zip.read()

        # Creating zip of all features zip files.
        shutil.make_archive(zip_container_dir, "zip", zip_container_dir)

        with open(f"{zip_container_dir}.zip", "rb") as zip_container_file:
            return zip_container_file.read()

    def export_to_dxf(self, layer):
        # Creating temp dxf file.
        with tempfile.TemporaryDirectory() as temp_dir_name:
            return self.__create_vector_file(
                layer,
                VectorDriver.DXF,
                output_path=f"{temp_dir_name}/features",
                return_file=True,
            )

    def export_to_kml(self, layer):
        # Creating temp kml file.
        with tempfile.TemporaryDirectory() as temp_dir_name:
            return self.__create_vector_file(
                layer,
                VectorDriver.KML,
                output_path=f"{temp_dir_name}/features",
                return_file=True,
            )
