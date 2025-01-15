import json
from enum import Enum

import shapely
from django.db import transaction
from pyproj import Transformer
from shapely.geometry import Point as ShapePoint
from shapely.geometry import Polygon, shape
from shapely.ops import transform

from processing_workflow_manager.constants import (
    CroppingRegionBehaviour,
    InstanceMappingDataParams,
    JobType,
    ProcessingBatchJobEnvironmentVariable,
    task_field_file_type_mapping,
)
from processing_workflow_manager.models import (
    GCP,
    GCPImageTag,
    GeotagImage,
    MergedDataset,
    ProcessingIterationData,
    Task,
    TaskGCP,
    TaskGCPImageTag,
    TaskGeotagImage,
)
from rainbow.env_variables import EnvVariable
from shared.aws.aws_manager import AwsManager
from shared.constants import EPSG, FileStatus, FileType
from shared.models import BatchJob, FileInfo

gcp_field_mapping = {
    "label": "label",
    "type": "type",
    "x_coordinate": "x_coordinate",
    "y_coordinate": "y_coordinate",
    "z_coordinate": "z_coordinate",
    "location_wgs84": "location_wgs84",
}

geotag_image_field_mapping = {
    "x_coordinate": "x_coordinate",
    "y_coordinate": "y_coordinate",
    "z_coordinate": "z_coordinate",
    "location_wgs84": "location_wgs84",
    "filename": "filename",
    "is_image_available": "is_image_available",
    "is_geotag_disabled": "is_geotag_disabled",
    "is_image_disabled": "is_image_disabled",
    "x_accuracy": "x_accuracy",
    "y_accuracy": "y_accuracy",
    "horizontal_accuracy": "horizontal_accuracy",
    "vertical_accuracy": "vertical_accuracy",
    "omega": "omega",
    "omega_accuracy": "omega_accuracy",
    "phi": "phi",
    "phi_accuracy": "phi_accuracy",
    "kappa": "kappa",
    "kappa_accuracy": "kappa_accuracy",
    "yaw": "yaw",
    "yaw_accuracy": "yaw_accuracy",
    "pitch": "pitch",
    "pitch_accuracy": "pitch_accuracy",
    "roll": "roll",
    "roll_accuracy": "roll_accuracy",
    "image_orientation": "image_orientation",
}


class TaskRecordType(Enum):
    GCP = "gcp"
    GEOTAG_IMAGE = "geotag_image"


def get_instance_mapping_data(user_selected_instance_size):
    instance_mapping_key = (
        f"Configs/instance_mapping-{EnvVariable.ENVIRONMENT.value}.json"
    )
    if user_selected_instance_size:
        instance_mapping_key = (
            f"Configs/selectable_instance_mapping-{EnvVariable.ENVIRONMENT.value}.json"
        )

    return AwsManager.get_json_object(
        EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value, instance_mapping_key
    )


def get_instance_params_and_job_details(
    instance_mapping_data,
    number_of_images_to_process,
    user_selected_instance_size=None,
):
    """
    Determines instance parameters and job details based on instance mapping data, user selection, and the number of images.

    Args:
        instance_mapping_data (dict): Data containing instance mappings and details.
        number_of_images_to_process (int): The number of images to process.
        user_selected_instance_size (str, optional): The user-selected instance size.

    Returns:
        tuple: (instance_params, job_definition, job_queue)
    """
    instance_params = {
        "instance_type": "",
        "instance_name": None,
        "v_cpus": 0,
        "storage": 0,
        "ram": 0.0,
        "swap": 0.0,
    }
    job_definition = ""
    job_queue = ""

    if user_selected_instance_size:
        # Populate instance parameters based on user-selected instance size
        for param_key in instance_params.keys():
            instance_params[param_key] = (
                user_selected_instance_size
                if param_key == InstanceMappingDataParams.INSTANCE_NAME.value
                else instance_mapping_data[user_selected_instance_size].get(
                    param_key, instance_params[param_key]
                )
            )
        # Set job definition and job queue if available
        job_definition = instance_mapping_data[user_selected_instance_size].get(
            InstanceMappingDataParams.JD_NAME.value, ""
        )
        job_queue = instance_mapping_data[user_selected_instance_size].get(
            InstanceMappingDataParams.JQ_NAME.value, ""
        )
    else:
        # Iterate over instance mappings to determine parameters and job details
        for instance_map in instance_mapping_data.get(
            InstanceMappingDataParams.INSTANCE_MAP.value, []
        ):
            if (
                instance_map[InstanceMappingDataParams.MAX_IMAGES.value]
                >= number_of_images_to_process
            ):
                # Populate instance parameters
                for param_key in instance_params.keys():
                    if param_key in instance_map:
                        instance_params[param_key] = instance_map[param_key]
                # Set job definition and job queue
                job_definition = instance_map.get(
                    InstanceMappingDataParams.JD_NAME.value, ""
                )
                job_queue = instance_map.get(
                    InstanceMappingDataParams.JQ_NAME.value, ""
                )
                break

    return instance_params, job_definition, job_queue


def create_task_batch_job(instance_params, job_definition, job_queue, task_id):
    batch_job_env_variables = [
        {
            "name": ProcessingBatchJobEnvironmentVariable.BucketName.value,
            "value": EnvVariable.OUTPUT_BUCKET_NAME.value,
        },
        {
            "name": ProcessingBatchJobEnvironmentVariable.LicenseBucketName.value,
            "value": EnvVariable.LICENSE_BUCKET_NAME.value,
        },
        {
            "name": ProcessingBatchJobEnvironmentVariable.MasterServerHost.value,
            "value": EnvVariable.MASTER_SERVER_HOST.value,
        },
        {
            "name": ProcessingBatchJobEnvironmentVariable.RedisHostName.value,
            "value": EnvVariable.REDIS_HOST_NAME.value,
        },
        {
            "name": ProcessingBatchJobEnvironmentVariable.SlackMetashapeErrorsWebhookUrl.value,
            "value": EnvVariable.SLACK_WEBHOOK_URL.value,
        },
        {
            "name": ProcessingBatchJobEnvironmentVariable.SourceImagesBucket.value,
            "value": EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
        },
        {
            "name": ProcessingBatchJobEnvironmentVariable.JobType.value,
            "value": JobType.ProcessTask.value,
        },
        {
            "name": ProcessingBatchJobEnvironmentVariable.TaskID.value,
            "value": str(task_id),
        },
        {
            "name": ProcessingBatchJobEnvironmentVariable.IsRainbow.value,
            "value": "true",
        },
    ]

    job_output = AwsManager.submit_batch_job(
        job_definition,
        job_queue,
        str(task_id),
        batch_job_env_variables,
    )

    return BatchJob.objects.create(
        job_id=job_output["jobId"],
        env_variables=batch_job_env_variables,
        instance_type=instance_params["instance_type"],
        v_cpus=instance_params["v_cpus"],
        storage=instance_params["storage"],
        ram=instance_params["ram"],
        swap=instance_params["swap"],
    )


def copy_records_to_task(
    *,
    source_model: GCP,
    target_model: TaskGCP,
    task: Task,
    source_dataset: ProcessingIterationData | MergedDataset,
    field_mapping: dict,
    foreign_key_field: TaskRecordType,
):
    source_queryset = source_model.objects.filter(
        iteration_dataset=(
            source_dataset
            if isinstance(source_dataset, ProcessingIterationData)
            else None
        ),
        merged_dataset=(
            source_dataset if isinstance(source_dataset, MergedDataset) else None
        ),
    ).only(*field_mapping.keys())

    target_records = []
    for source_record in source_queryset:
        target_data = {
            target_field: getattr(source_record, source_field)
            for source_field, target_field in field_mapping.items()
        }
        target_data["task"] = task
        if foreign_key_field:
            target_data[foreign_key_field] = source_record
        target_records.append(target_model(**target_data))

    # Bulk create target model records
    with transaction.atomic():
        target_model.objects.bulk_create(target_records)


def get_is_used_for_processing(
    coords, cropping_region, cropping_region_behaviour, crs_srid
):
    is_used_for_processing = True
    if cropping_region and cropping_region_behaviour:
        region_features = json.loads(cropping_region)["features"]
        # NOTE: buffer(0) is a trick for fixing scenarios where polygons have overlapping coordinates
        features_geometry = [
            shape(feature["geometry"]).buffer(0) for feature in region_features
        ]
        crs_transformer = Transformer.from_crs(4326, crs_srid, always_xy=True).transform
        cropping_region_polygon = transform(
            crs_transformer, Polygon(features_geometry[0])
        )
        if cropping_region_polygon:
            geotag_point = ShapePoint(coords[0], coords[1])
            is_inside = shapely.contains(cropping_region_polygon, geotag_point)
            if (
                not is_inside
                and cropping_region_behaviour == CroppingRegionBehaviour.INCLUDE.value
            ) or (
                is_inside
                and cropping_region_behaviour == CroppingRegionBehaviour.EXCLUDE.value
            ):
                is_used_for_processing = False
    return is_used_for_processing


def copy_geotagimage_records_to_task(
    *,
    geotag_image: GeotagImage,
    task_geotag_image: TaskGeotagImage,
    task: Task,
    source_dataset: ProcessingIterationData | MergedDataset,
    field_mapping: dict,
    foreign_key_field: TaskRecordType,
    cropping_region,
    cropping_region_behaviour,
):
    source_queryset = geotag_image.objects.filter(
        iteration_dataset=(
            source_dataset
            if isinstance(source_dataset, ProcessingIterationData)
            else None
        ),
        merged_dataset=(
            source_dataset if isinstance(source_dataset, MergedDataset) else None
        ),
    ).only(*field_mapping.keys())
    crs_srid = source_dataset.geotag_horizontal_crs.srid
    coords = (
        ("easting", "northing")
        if crs_srid != EPSG.WGS84.value
        else ("longitude", "latitude")
    )
    target_records = []
    for source_record in source_queryset:
        target_data = {
            target_field: getattr(source_record, source_field)
            for source_field, target_field in field_mapping.items()
        }
        target_data["task"] = task
        if foreign_key_field:
            target_data[foreign_key_field] = source_record
        is_used_for_processing = get_is_used_for_processing(
            coords=coords,
            cropping_region=cropping_region,
            cropping_region_behaviour=cropping_region_behaviour,
            crs_srid=crs_srid,
        )
        target_data["is_used_for_processing"] = is_used_for_processing
        target_records.append(task_geotag_image(**target_data))

    # Bulk create target model records
    with transaction.atomic():
        task_geotag_image.objects.bulk_create(target_records)


def clone_task_records(
    *,
    model_to_clone: TaskGCP | TaskGeotagImage,
    original_task_id: str,
    new_task_id: str,
):
    """
    Clones records from one task related model to another.

    Args:
        model_to_clone (Model): The model class of the records to clone.
        original_task_id (str): The ID of the original task.
        new_task_id (str): The ID of the new task.
    """
    original_task_records = model_to_clone.objects.filter(task_id=original_task_id)

    # List of fields to exclude during cloning
    excluded_fields = {"_state", "id", "task_id"}
    new_task_records = [
        model_to_clone(
            task_id=new_task_id,
            **{
                key: value
                for key, value in task_record.__dict__.items()
                if key not in excluded_fields
            },
        )
        for task_record in original_task_records
    ]
    model_to_clone.objects.bulk_create(new_task_records)


def copy_gcp_image_tags_to_task(task: Task):
    """
    Copies GCPImageTags to TaskGCPImageTag, mapping GCP to TaskGCP and GeotagImage to TaskGeotagImage.

    Args:
        task (Task): The task to associate the copied TaskGCPImageTag records with.
    """
    gcp_to_task_gcp_map = {
        task_gcp.gcp_id: task_gcp
        for task_gcp in TaskGCP.objects.filter(task=task).select_related("gcp")
    }
    image_to_task_geotag_image_map = {
        task_geotag_image.geotag_image_id: task_geotag_image
        for task_geotag_image in TaskGeotagImage.objects.filter(
            task=task
        ).select_related("geotag_image")
    }
    gcp_image_tags_queryset = GCPImageTag.objects.filter(
        gcp__in=gcp_to_task_gcp_map.keys(),
        geotag_image__in=image_to_task_geotag_image_map.keys(),
    ).select_related("gcp", "geotag_image")

    task_gcp_image_tags = []
    for gcp_image_tag in gcp_image_tags_queryset:
        task_gcp = gcp_to_task_gcp_map.get(gcp_image_tag.gcp_id)
        task_geotag_image = image_to_task_geotag_image_map.get(
            gcp_image_tag.geotag_image_id
        )

        if task_gcp and task_geotag_image:
            task_gcp_image_tags.append(
                TaskGCPImageTag(
                    task_gcp=task_gcp,
                    task_geotag_image=task_geotag_image,
                    image_x=gcp_image_tag.image_x,
                    image_y=gcp_image_tag.image_y,
                )
            )

    with transaction.atomic():
        TaskGCPImageTag.objects.bulk_create(task_gcp_image_tags)


def task_name_formatter(task_name: str):
    return "".join(
        character
        for character in task_name.replace(" ", "_")
        if character.isalnum() or character in ["_", "-"]
    )


def task_output_file_path_formatter(task_id, task_name):
    return task_name_formatter(task_name) + "_" + str(task_id) + "/"


def get_output_file_info_values(task: Task):
    file_path = task_output_file_path_formatter(task.id, task.name)
    output_paths = {}
    subdirectory_file_path = f"{task.name}_{task.iteration_dataset.iteration.name}"

    resources = {
        FileType.ORTHOMOSAIC.value: f"{subdirectory_file_path}_orthomosaic.tif",
        FileType.ORTHO_TILES.value: f"{subdirectory_file_path}_ortho_tiles.zip",
        FileType.ORTHOMOSAIC_COG.value: f"{subdirectory_file_path}_orthomosaic_cog.tif",
        FileType.CAPTURED_DSM.value: f"{subdirectory_file_path}_dsm.tif",
        FileType.CAPTURED_DSM_COG.value: f"{subdirectory_file_path}_dsm_cog.tif",
        FileType.POINT_CLOUD.value: f"{subdirectory_file_path}_point_cloud.laz",
        FileType.REPORT.value: f"{subdirectory_file_path}_report.pdf",
        FileType.PROJECT_FILE.value: f"{subdirectory_file_path}_project_files.zip",
        FileType.ALL_OUTPUTS.value: f"{subdirectory_file_path}_outputs.zip",
    }

    output_paths[
        task_field_file_type_mapping[FileType.OUTPUTS_FOLDER.value]
    ] = FileInfo.objects.create(
        name=f"{file_path}-Outputs-Folder",
        is_folder=True,
        type=FileType.OUTPUTS_FOLDER.value,
        bucket_name=EnvVariable.OUTPUT_BUCKET_NAME.value,
        s3_key=file_path,
        status=FileStatus.PENDING.value,
    )

    for resource, sub_file_path in resources.items():
        s3_key = file_path + sub_file_path
        output_paths[task_field_file_type_mapping[resource]] = FileInfo.objects.create(
            name=sub_file_path,
            type=resource,
            bucket_name=EnvVariable.OUTPUT_BUCKET_NAME.value,
            s3_key=s3_key,
            status=FileStatus.PENDING.value,
        )

    return output_paths
