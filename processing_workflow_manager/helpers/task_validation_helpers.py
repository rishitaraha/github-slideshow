import pandas as pd
from rest_framework.serializers import ValidationError

from processing_workflow_manager.constants import (
    ContinuedFromDatasetType,
    TaskStageNameInDatabase,
)
from processing_workflow_manager.constants.gcp_geotag_constants import (
    COORDINATE_BOUND_MAPPING,
    GeotagImageColumnField,
)
from processing_workflow_manager.models import GeotagImage, ProcessingIterationData
from rainbow.env_variables import EnvVariable
from shared.aws.aws_manager import AwsManager
from shared.constants.gis.crs import EPSG
from shared.exception_handling import ValidationErrors
from shared.exception_handling.helpers import ApiError

PROCESSING_STAGES_NUMBERS = {
    TaskStageNameInDatabase.ALIGN_PHOTOS.value: 1,
    TaskStageNameInDatabase.GENERATE_POINT_CLOUD.value: 2,
    TaskStageNameInDatabase.GENERATE_ORTHOMOSAIC.value: 3,
}


def validate_task_options_and_stages_combinations(task_data, optimization_options):
    task_end_stage = task_data.get("end_stage")
    continued_from = task_data.get("continued_from")
    continued_from_task_obj = task_data.get("continued_from_task")
    cropping_region = task_data.get("cropping_region")
    cropping_region_behaviour = task_data.get("cropping_region_behaviour")

    reoptimize_cameras = optimization_options.get("reoptimize-cameras", False)
    stop_after_reoptimize = optimization_options.get("stop-after-reoptimize", False)

    # Validate continued_from logic
    if (
        continued_from == ContinuedFromDatasetType.TASK.value
        and not continued_from_task_obj
    ):
        raise ValidationError(ValidationErrors.CONTINUED_FROM_TASK_REQUIRED.value)

    # Validate stop-after-reoptimize logic
    if stop_after_reoptimize:
        if not reoptimize_cameras:
            raise ValidationError(
                ValidationErrors.STOP_AFTER_REOPTIMIZE_WITHOUT_REOPTIMIZE_CAMERAS.value
            )
        if task_end_stage:
            raise ValidationError(
                ValidationErrors.END_STAGE_PROVIDED_WITH_STOP_AFTER_REOPTIMIZE.value
            )
    elif not task_end_stage:
        raise ValidationError(ValidationErrors.END_STAGE_REQUIRED.value)

    # Validate reoptimize-cameras logic
    if (
        reoptimize_cameras
        and continued_from == ContinuedFromDatasetType.TASK.value
        and not continued_from_task_obj
    ):
        raise ValidationError(
            ValidationErrors.REOPTIMIZE_CAMERAS_WITHOUT_CONTINUED_FROM_TASK.value
        )

    # Validate cropping region logic
    if cropping_region:
        if not reoptimize_cameras:
            raise ValidationError(
                ValidationErrors.CROPPING_REGION_WITHOUT_REOPTIMIZE.value
            )
        if not cropping_region_behaviour:
            raise ValidationError(
                ValidationErrors.CROPPING_REGION_BEHAVIOUR_REQUIRED.value
            )

    # Validate end-stage combinations
    if (
        reoptimize_cameras
        and task_end_stage == TaskStageNameInDatabase.ALIGN_PHOTOS.value
    ):
        raise ValidationError(
            ValidationErrors.CANNOT_REOPTIMIZE_WITH_ALIGN_PHOTOS.value
        )

    if continued_from_task_obj and not reoptimize_cameras:
        new_task_stage_value = PROCESSING_STAGES_NUMBERS.get(task_end_stage, 0)
        previous_task_stage_value = PROCESSING_STAGES_NUMBERS.get(
            continued_from_task_obj.end_stage, 0
        )
        if new_task_stage_value <= previous_task_stage_value:
            raise ValidationError(
                ValidationErrors.END_STAGE_SELECTED_NOT_APPLICABLE.value
            )


def validate_geotag_images(
    iteration_dataset: ProcessingIterationData,
):
    is_utm = iteration_dataset.geotag_horizontal_crs.srid != EPSG.WGS84.value
    geotag_df = pd.DataFrame(
        list(
            GeotagImage.objects.filter(
                iteration_dataset=iteration_dataset, is_image_available=True
            ).values(
                "filename",
                "is_image_available",
                "x_coordinate",
                "y_coordinate",
                "z_coordinate",
            )
        )
    )
    validate_coordinates_of_asset_in_given_crs(geotag_df, is_utm, "geotags")
    validate_presence_of_images_in_s3(geotag_df, iteration_dataset)


def validate_presence_of_images_in_s3(geotag_df, iteration_dataset):
    geotag_images_file_keys_in_s3 = AwsManager.get_object_key_list(
        bucket=EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
        prefix=iteration_dataset.image_folder_path.s3_key,
    )
    geotag_image_filenames_in_s3 = set()
    for file_object_key in geotag_images_file_keys_in_s3:
        filename = file_object_key.split("/")[-1]
        geotag_image_filenames_in_s3.add(filename)
    geotag_filenames = set(geotag_df["filename"])
    missing_in_s3 = geotag_filenames - geotag_image_filenames_in_s3
    if missing_in_s3:
        raise ValidationError(ValidationErrors.IMAGES_NOT_PRESENT_IN_S3.value)


def validate_coordinates_of_asset_in_given_crs(
    df: pd.DataFrame, is_utm: bool, asset: str
):
    if df.empty:
        raise ValidationError(ValidationErrors.NO_GEOTAGS_FOUND.value)

    is_utm_coordinate_mapping = {
        True: (
            GeotagImageColumnField.EASTING.value,
            GeotagImageColumnField.NORTHING.value,
            GeotagImageColumnField.ALTITUDE.value,
        ),
        False: (
            GeotagImageColumnField.LONGITUDE.value,
            GeotagImageColumnField.LATITUDE.value,
            GeotagImageColumnField.ALTITUDE.value,
        ),
    }

    x_col, y_col, z_col = is_utm_coordinate_mapping[is_utm]

    coordinate_mapping = {
        "x_coordinate": COORDINATE_BOUND_MAPPING[x_col],
        "y_coordinate": COORDINATE_BOUND_MAPPING[y_col],
        "z_coordinate": COORDINATE_BOUND_MAPPING[z_col],
    }

    for column, (lower_bound, upper_bound) in coordinate_mapping.items():
        out_of_bounds = df[(df[column] < lower_bound) | (df[column] > upper_bound)]
        if not out_of_bounds.empty:
            raise ValidationError(
                ApiError(
                    f"Out of bounds values found in Geotags for {column}: {out_of_bounds.to_dict(orient='records')}",
                    f"OUT_OF_BOUNDS_VALUES_IN_{asset.upper()}",
                )
            )
