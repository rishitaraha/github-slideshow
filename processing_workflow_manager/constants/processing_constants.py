from django.conf import settings

from shared.constants import BaseEnum


class DatasetType(BaseEnum):
    ITERATION_DATASET = "iteration_dataset"
    MERGED_DATASET = "merged_dataset"
    TASK = "task"


class ContinuedFromDatasetType(BaseEnum):
    TASK = "task"
    PARENT_ITERATION = "parent_iteration"
    PARENT_MERGED_DATASET_INPUT = "parent_merged_dataset_input"
    PARENT_MERGED_DATASET_OUTPUT = "parent_merged_dataset_output"


class DatasetAlignmentMethod(BaseEnum):
    POINT_BASED = "point_based"
    MARKER_BASED = "marker_based"
    CAMERA_BASED = "camera_based"


class MergeableAssetType(BaseEnum):
    DENSE_POINT_CLOUD = "dense_point_cloud"
    SPARSE_POINT_CLOUD = "sparse_point_cloud"
    DEM = "dem"
    ORTHOMOSAIC = "orthomosaic"


class OutputType(BaseEnum):
    REPORT = "report"
    PROJECT_FILES = "project_files"
    POINT_CLOUD = "point_cloud"
    DSM_COG = "dsm_cog"
    ORTHOPHOTO_COG = "orthophoto_cog"
    DSM = "dsm"
    ORTHOPHOTO = "orthophoto"
    ORTHO_TILES = "ortho_tiles"
    ALL_OUTPUTS = "all_outputs"


class CroppingRegionBehaviour(BaseEnum):
    EXCLUDE = "exclude"
    INCLUDE = "include"


# https://github.com/ianare/exif-py/blob/d60f18d3b5f701cd87523c577adacd91175f1365/exifread/tags/exif.py#L124
class ImageOrientationExifType(BaseEnum):
    HORIZONTAL_NORMAL = "Horizontal (normal)"
    MIRRORED_HORIZONTAL = "Mirrored horizontal"
    ROTATED_180 = "Rotated 180"
    MIRRORED_VERTICAL = "Mirrored vertical"
    MIRRORED_HORIZONTAL_THEN_ROTATED_90_CCW = "Mirrored horizontal then rotated 90 CCW"
    ROTATED_90_CW = "Rotated 90 CW"
    MIRRORED_HORIZONTAL_THEN_ROTATED_90_CW = "Mirrored horizontal then rotated 90 CW"
    ROTATED_90_CCW = "Rotated 90 CCW"


class ImageOrientationTypeSlug(BaseEnum):
    HORIZONTAL_NORMAL = "horizontal_normal"
    MIRRORED_HORIZONTAL = "mirrored_horizontal"
    ROTATED_180 = "rotated_180"
    MIRRORED_VERTICAL = "mirrored_vertical"
    MIRRORED_HORIZONTAL_THEN_ROTATED_90_CCW = "mirrored_horizontal_then_rotated_90_ccw"
    ROTATED_90_CW = "rotated_90_cw"
    MIRRORED_HORIZONTAL_THEN_ROTATED_90_CW = "mirrored_horizontal_then_rotated_90_cw"
    ROTATED_90_CCW = "rotated_90_ccw"


class TaskStageNameInDatabase(BaseEnum):
    ALIGN_PHOTOS = "align-photos"
    GENERATE_POINT_CLOUD = "generate-point-cloud"
    GENERATE_ORTHOMOSAIC = "generate-orthomosaic"


class TaskStage(BaseEnum):
    ALIGN_PHOTOS = "Align Photos"
    GENERATE_POINT_CLOUD = "Generate Point Cloud"
    GENERATE_ORTHOMOSAIC = "Generate Orthomosaic"
    STOP_AT_REOPTIMIZATION = "Stop After Reoptimization"


InstanceSizeTypes = [
    "g4dn.xlarge",
    "g4dn.2xlarge",
    "g4dn.4xlarge",
    "g4dn.8xlarge",
    "g4dn.12xlarge",
    "g4dn.16xlarge",
    "g4dn.metal",
]


class JobType(BaseEnum):
    ProcessMergedDataset = "process_merged_dataset"
    ProcessTask = "process_task"


class ProcessingBatchJobEnvironmentVariable(BaseEnum):
    AgisoftLicenseFilesPath = "agisoft_LICENSE"
    BucketName = "BUCKET_NAME"
    JobType = "JOB_TYPE"
    LicenseBucketName = "LICENSE_BUCKET_NAME"
    MasterServerHost = "MASTER_SERVER_HOST"
    MergedDatasetId = "MERGED_DATASET_ID"
    RedisHostName = "REDIS_HOST_NAME"
    SlackMetashapeErrorsWebhookUrl = "SLACK_METASHAPE_ERRORS_WEBHOOK_URL"
    SourceImagesBucket = "SOURCE_IMAGES_BUCKET"
    TaskID = "TASK_ID"
    IsRainbow = "IS_RAINBOW"


class InstanceMappingDataParams(BaseEnum):
    INSTANCE_ID = "instance_id"
    INSTANCE_MAP = "instance_map"
    INSTANCE_NAME = "instance_name"
    INSTANCE_TYPE = "instance_type"
    MAX_IMAGES = "max_images"
    JD_NAME = "jd_name"
    JQ_NAME = "jq_name"
    V_CPUS = "v_cpus"
    RAM = "ram"
    SWAP = "swap"
    STORAGE = "storage"


DEFAULT_DATABASE = settings.DATABASES["default"]
PG_DEFAULT_DATABASE_PARAMS = {
    "dbname": DEFAULT_DATABASE["NAME"],
    "user": DEFAULT_DATABASE["USER"],
    "password": DEFAULT_DATABASE["PASSWORD"],
    "port": DEFAULT_DATABASE["PORT"],
    "host": DEFAULT_DATABASE["HOST"],
}

IMAGE_ORIENTATION_TYPE_MAPPING = {
    ImageOrientationExifType.HORIZONTAL_NORMAL.value: ImageOrientationTypeSlug.HORIZONTAL_NORMAL.value,
    ImageOrientationExifType.MIRRORED_HORIZONTAL.value: ImageOrientationTypeSlug.MIRRORED_HORIZONTAL.value,
    ImageOrientationExifType.ROTATED_180.value: ImageOrientationTypeSlug.ROTATED_180.value,
    ImageOrientationExifType.MIRRORED_VERTICAL.value: ImageOrientationTypeSlug.MIRRORED_VERTICAL.value,
    ImageOrientationExifType.ROTATED_90_CW.value: ImageOrientationTypeSlug.ROTATED_90_CW.value,
    ImageOrientationExifType.ROTATED_90_CCW.value: ImageOrientationTypeSlug.ROTATED_90_CCW.value,
    ImageOrientationExifType.MIRRORED_HORIZONTAL_THEN_ROTATED_90_CCW.value: ImageOrientationTypeSlug.MIRRORED_HORIZONTAL_THEN_ROTATED_90_CCW.value,
    ImageOrientationExifType.MIRRORED_HORIZONTAL_THEN_ROTATED_90_CW.value: ImageOrientationTypeSlug.MIRRORED_HORIZONTAL_THEN_ROTATED_90_CW.value,
}
