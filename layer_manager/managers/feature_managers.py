import json
import os
from csv import DictWriter as CSVDictWriter
from tempfile import NamedTemporaryFile
from typing import Dict, Iterable, Literal, TypeVar

from django.db import connection, models
from django.db.models import Count, Manager
from django.utils import timezone
from psycopg2 import sql
from psycopg2.extensions import AsIs

from rainbow import logger
from shared.helpers import model_to_dict, parse_postgis_box

from ..constants import FeatureType
from .helpers import prepare_features_for_bulk_operation

# Generic type can consist any model.
FeatureSchema = TypeVar("FeatureSchema", bound=models.Model)


class FeatureManager(Manager):
    def get_feature_count(self, layer_id: str) -> Dict[str, int]:
        """
        Returns the count of features for each feature type.

        Args:
            layer_id: The ID of the layer.
        Returns:
            A dictionary with the count of features for each feature type.
        """

        features = self.model.objects.filter(layer_id=layer_id)
        feature_type_count_queryset = features.values("type").annotate(
            count=Count("type")
        )

        # Create a dictionary with the counts for each feature type.
        feature_counts = {
            feature_type_count["type"]: feature_type_count["count"]
            for feature_type_count in feature_type_count_queryset
        }

        feature_count_response = {
            "polygons": feature_counts.get(FeatureType.POLYGON.value, 0),
            "lines": feature_counts.get(FeatureType.LINE_STRING.value, 0),
            "points": feature_counts.get(FeatureType.POINT.value, 0),
            "textbox": feature_counts.get(FeatureType.TEXT_BOX.value, 0),
        }

        return feature_count_response

    def get_features_collection(self, layer_id: str):
        query = """
        SELECT
        json_build_object(
            'type', 'FeatureCollection',
            'features', json_agg(jsonb_build_object(
                'type',       'Feature',
                'geometry',   ST_AsGeoJSON(geometry)::jsonb
            )
        ))
        FROM %(db_table)s where layer_id = %(layer_id)s
        """
        params = {
            "db_table": AsIs(self.model._meta.db_table),
            "layer_id": layer_id,
        }

        with connection.cursor() as cursor:
            cursor.execute(query, params)
            geojson = cursor.fetchone()[0]

        return geojson

    def get_bounds(self, layer_id: str) -> tuple[float, float, float, float]:
        """
        Retrieves the bounding box coordinates for a given layer.
        Returns: A tuple of coordinates representing the bounding box of a specific layer.
        """

        query = """
        SELECT ST_Extent(geometry)
        FROM %(db_table)s
        WHERE layer_id = %(layer_id)s;
        """
        params = {
            "db_table": AsIs(self.model._meta.db_table),
            "layer_id": layer_id,
        }

        with connection.cursor() as cursor:
            cursor.execute(query, params)
            bounding_box_wkt = cursor.fetchone()[0]

        if bounding_box_wkt is not None:
            bounds = parse_postgis_box(bounding_box_wkt)
            return bounds

    def get_features_ordered_by_attribute(
        self, layer_id: str, attribute_name: str, order: Literal["ASC", "DESC"] = "ASC"
    ):
        """
        Retrieve a list of features for the specified layer, sorted by the given attribute.

        Args:
            layer_id (str): The ID of the layer.
            attribute_name (str): The key/name of the attribute used for sorting.
            order (Literal["ASC", "DESC"], optional): The sort direction. Defaults to "ASC".

        Returns:
            RawQuerySet[Features]: The result set of features, sorted by the specified attribute in the
            specified order (ascending or descending).
        """

        query = """
            SELECT id, attributes
            FROM %(db_table)s
            WHERE layer_id = %(layer_id)s
            ORDER BY attributes->%(attribute_name)s %(order)s
        """

        params = {
            "db_table": AsIs(self.model._meta.db_table),
            "layer_id": layer_id,
            "attribute_name": attribute_name,
            "order": AsIs(order),
        }

        return self.raw(query, params)

    def bulk_create(self, instances: Iterable[FeatureSchema], **kwargs):
        features = prepare_features_for_bulk_operation(instances)
        return super(models.Manager, self).bulk_create(features, **kwargs)

    def bulk_update(self, instances: Iterable[FeatureSchema], **kwargs):
        features = prepare_features_for_bulk_operation(instances)
        return super().bulk_update(features, **kwargs)

    def bulk_insert_copy(self, instances: Iterable[FeatureSchema]):
        """
        Bulk inserts features to db using postgres COPY command.
        """

        features = prepare_features_for_bulk_operation(instances)

        # Creating a temporary CSV file.
        with NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as temp_csv_file:
            column_names = [field.column for field in self.model._meta.fields]

            # Adding features data in CSV file.
            csv_writer = CSVDictWriter(temp_csv_file, fieldnames=column_names)

            time_now = timezone.now()

            for feature in features:
                feature_dict = model_to_dict(feature, use_column_as_key=True)

                # Adding auto generated fields.
                feature_dict["created_at"] = time_now
                feature_dict["updated_at"] = time_now

                # Dumping JSON fields to string.
                feature_dict["attributes"] = (
                    json.dumps(feature_dict["attributes"])
                    if feature_dict["attributes"]
                    else None
                )
                feature_dict["properties"] = (
                    json.dumps(feature_dict["properties"])
                    if feature_dict["properties"]
                    else None
                )

                csv_writer.writerow(feature_dict)

        # Construct the COPY query
        columns = sql.SQL(",").join(map(sql.Identifier, column_names))
        copy_query = sql.SQL(
            "COPY {} ({}) FROM STDIN WITH CSV NULL '' DELIMITER ',';"
        ).format(
            sql.Identifier(self.model._meta.db_table),
            columns,
        )

        with connection.cursor() as cursor, open(temp_csv_file.name, "r") as csv_file:
            cursor.copy_expert(copy_query, csv_file)

        # Deleting the temporary CSV file.
        try:
            os.remove(temp_csv_file.name)
        except Exception as e:
            logger.exception(f"Error in deleting the temporary CSV file: {e}")
