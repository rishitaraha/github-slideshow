import io
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Union

import pandas as pd
from django.contrib.gis.geos import Point
from django.db.models import Q
from rest_framework.serializers import ValidationError

from shared.constants import EPSG
from shared.exception_handling import ValidationErrors

from ..constants import COORDINATE_BOUND_MAPPING, DatasetType, GeotagImageColumnField
from ..helpers import convert_to_wgs84_transformer, wgs84_point
from ..models import GeotagImage, MergedDataset, ProcessingIterationData


def generate_geotag_df_from_csv(
    *,
    geotag_image_file: str,
    column_order: list[str],
    iteration_dataset: Union[ProcessingIterationData, None],
    merged_dataset: Union[MergedDataset, None],
    dataset_type: DatasetType,
    is_utm: bool,
    geotag_horizontal_crs_srid: int,
) -> pd.DataFrame:
    values_columns = [x for x in column_order if x != GeotagImageColumnField.NONE.value]
    if len(values_columns) != len(set(values_columns)):
        raise ValidationError(ValidationErrors.DUPLICATE_COLUMNS_IN_SCHEMA.value)

    geotag_df = pd.read_csv(geotag_image_file, header=None)

    if geotag_df.empty:
        raise ValidationError(ValidationErrors.EMPTY_FILE.value)

    geotag_df.columns = column_order

    if is_utm:
        xy_columns_from_file = [
            GeotagImageColumnField.EASTING.value,
            GeotagImageColumnField.NORTHING.value,
        ]
        x_accuracy, y_accuracy = (
            GeotagImageColumnField.EASTING_ACCURACY.value,
            GeotagImageColumnField.NORTHING_ACCURACY.value,
        )
    else:
        xy_columns_from_file = [
            GeotagImageColumnField.LONGITUDE.value,
            GeotagImageColumnField.LATITUDE.value,
        ]
        x_accuracy, y_accuracy = (
            GeotagImageColumnField.LONGITUDE_ACCURACY.value,
            GeotagImageColumnField.LATITUDE_ACCURACY.value,
        )
    xy_cols_exist = all(col in geotag_df.columns for col in xy_columns_from_file)
    if not xy_cols_exist:
        raise ValidationError(ValidationErrors.INVALID_FILE_DATA.value)

    nan_rows = geotag_df.isna().any(axis=1)

    if len(geotag_df[nan_rows]) > 0:
        raise ValidationError(ValidationErrors.EMPTY_VALUES_IN_FILE.value)

    if geotag_df.loc[0]["filename"].lower() in "filename":
        geotag_df.drop([0], inplace=True)
    if dataset_type == DatasetType.MERGED_DATASET.value:
        geotag_df["merged_dataset_id"] = merged_dataset.id
    if dataset_type == DatasetType.ITERATION_DATASET.value:
        geotag_df["iteration_dataset_id"] = iteration_dataset.id

    if len(geotag_df["filename"]) != len(set(geotag_df["filename"])):
        raise ValidationError(ValidationErrors.DUPLICATE_VALUES_IN_FILE.value)

    for col in xy_columns_from_file:
        if (
            not geotag_df[col]
            .apply(
                lambda x: COORDINATE_BOUND_MAPPING[col][0]
                <= Decimal(x)
                <= COORDINATE_BOUND_MAPPING[col][1]
            )
            .all()
        ):
            raise ValidationError(ValidationErrors.VALUES_OUT_OF_RANGE.value)

    geotag_df[
        [
            GeotagImageColumnField.X_COORDINATE.value,
            GeotagImageColumnField.Y_COORDINATE.value,
            GeotagImageColumnField.Z_COORDINATE.value,
        ]
    ] = geotag_df[xy_columns_from_file + [GeotagImageColumnField.ALTITUDE.value]].apply(
        lambda col: col.map(Decimal)
    )
    if is_utm:
        transformer = convert_to_wgs84_transformer(utm_srid=geotag_horizontal_crs_srid)
        geotag_df[GeotagImageColumnField.LOCATION_WGS84.value] = geotag_df.apply(
            lambda row: wgs84_point(
                transformer=transformer,
                easting=row[GeotagImageColumnField.EASTING.value],
                northing=row[GeotagImageColumnField.NORTHING.value],
                altitude=row[GeotagImageColumnField.ALTITUDE.value],
            ),
            axis=1,
        )
    else:
        geotag_df[GeotagImageColumnField.LOCATION_WGS84.value] = geotag_df.apply(
            lambda row: Point(
                row[GeotagImageColumnField.LONGITUDE.value],
                row[GeotagImageColumnField.LATITUDE.value],
                row[GeotagImageColumnField.ALTITUDE.value],
            ),
            axis=1,
        )

    geotag_df.rename(
        columns={
            x_accuracy: GeotagImageColumnField.X_ACCURACY.value,
            y_accuracy: GeotagImageColumnField.Y_ACCURACY.value,
        },
        inplace=True,
    )
    columns_to_drop = xy_columns_from_file + [
        GeotagImageColumnField.ALTITUDE.value,
        GeotagImageColumnField.NONE.value,
    ]
    geotag_df.drop(
        columns=[col for col in columns_to_drop if col in geotag_df.columns],
        inplace=True,
        errors="ignore",
    )

    geotag_df["id"] = [uuid.uuid4() for _ in range(len(geotag_df))]
    geotag_df[["created_at", "updated_at"]] = datetime.now()
    geotag_df[
        [
            "is_image_available",
            "is_geotag_disabled",
            "is_image_disabled",
            "is_deleted",
        ]
    ] = False

    return geotag_df


def existing_geotag_image_handler(
    *,
    geotag_df: pd.DataFrame,
    merged_dataset: Union[MergedDataset, None],
    iteration_dataset: Union[ProcessingIterationData, None],
    dataset_type: str,
) -> pd.DataFrame:
    filter_conditions = {
        "is_image_available": True,
    }
    if dataset_type == DatasetType.ITERATION_DATASET.value:
        filter_conditions["iteration_dataset_id"] = iteration_dataset
        dataset_field = "iteration_dataset_id"
        dataset_id = iteration_dataset.id
    if dataset_type == DatasetType.MERGED_DATASET.value:
        filter_conditions["merged_dataset_id"] = merged_dataset
        dataset_field = "merged_dataset_id"
        dataset_id = merged_dataset.id

    existing_filenames = GeotagImage.objects.filter(**filter_conditions).values_list(
        "filename", flat=True
    )

    geotag_df.loc[
        geotag_df["filename"].isin(existing_filenames),
        "is_image_available",
    ] = True

    missing_geotag_filenames = set(existing_filenames) - set(geotag_df["filename"])

    missing_geotag_data_in_file = [
        {
            "id": uuid.uuid4(),
            "filename": image_filename,
            "is_image_available": True,
            "is_geotag_disabled": False,
            "is_image_disabled": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            dataset_field: dataset_id,
            "is_deleted": False,
        }
        for image_filename in missing_geotag_filenames
    ]

    missing_geotag_df = pd.DataFrame(missing_geotag_data_in_file)

    return pd.concat([geotag_df, missing_geotag_df], ignore_index=True)


def generate_in_mem_buffer(*, geotag_df):
    in_mem_buffer = io.StringIO()
    geotag_df.to_csv(in_mem_buffer, index=False)
    in_mem_buffer.seek(0)
    return in_mem_buffer


def combined_geotag_image_q_filter(
    *,
    images_with_geotags: bool,
    images_without_geotags: bool,
    geotags_without_images: bool,
) -> Q:
    images_with_geotags_q_filter = Q()
    images_without_geotags_q_filter = Q()
    geotags_without_images_q_filter = Q()

    if images_with_geotags:
        images_with_geotags_q_filter = Q(
            is_image_available=True,
            z_coordinate__isnull=False,
            x_coordinate__isnull=False,
            y_coordinate__isnull=False,
        )

    if images_without_geotags:
        images_without_geotags_q_filter = Q(is_image_available=True) & (
            Q(x_coordinate__isnull=True)
            | Q(y_coordinate__isnull=True)
            | Q(z_coordinate__isnull=True)
        )

    if geotags_without_images:
        geotags_without_images_q_filter = Q(
            is_image_available=False,
            z_coordinate__isnull=False,
            x_coordinate__isnull=False,
            y_coordinate__isnull=False,
        )

    combined_q_filter = (
        images_with_geotags_q_filter
        | images_without_geotags_q_filter
        | geotags_without_images_q_filter
    )

    return combined_q_filter


def add_location_wgs84_field(
    updated_geotagimage: GeotagImage,
    parent_srid: int,
) -> dict:
    wgs84_point = None
    is_projected_crs = parent_srid != EPSG.WGS84.value
    if is_projected_crs:
        transformer = convert_to_wgs84_transformer(utm_srid=parent_srid)
        wgs84_point = wgs84_point(
            transformer=transformer,
            easting=float(updated_geotagimage.x_coordinate),
            northing=float(updated_geotagimage.y_coordinate),
            altitude=float(updated_geotagimage.z_coordinate),
        )
    else:
        wgs84_point = Point(
            float(updated_geotagimage.x_coordinate),
            float(updated_geotagimage.y_coordinate),
            float(updated_geotagimage.z_coordinate),
        )
    updated_geotagimage.location_wgs84 = wgs84_point

    return updated_geotagimage
