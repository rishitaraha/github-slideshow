import io

import exifread
import piexif
from PIL import Image

from rainbow.env_variables import EnvVariable
from rainbow.log_config import init_logger
from shared.aws import AwsManager
from shared.aws.aws_s3_file import S3File
from shared.constants import BatchJobStatus
from shared.helpers import make_alphanum
from shared.models import BatchJob

from ..constants import IMAGE_ORIENTATION_TYPE_MAPPING, ImageOrientationTypeSlug

logger = init_logger(__name__)


def check_image_exif(image_file, size=60000, max_size=1000000, increment_step=10000):
    """
    Function checks if EXIF data is present in a image file
    Parameter: ZipFile object
    Returns: boolean
    """
    logger.info(f"Checking for EXIF")
    buffer = io.BytesIO()
    buffer.flush()
    buffer.seek(0)
    current_size = size
    last_cursor = 0
    while current_size <= max_size:
        try:
            image_file.seek(last_cursor)
            buffer.write(image_file.read(size))
            image = Image.open(buffer)
            exif_dict = piexif.load(image.info["exif"])
            """
            This snippet validates if the GPS data extraction is possible.
            Sample GPS exif looks like: {0: (2, 0, 0, 0), 1: b'N', 2: ((12, 1), (22, 1), (465977164, 10000000)), 3: b'E', 4: ((77, 1), (4, 1), (131788596, 10000000)), 5: b'\x00', 6: (6433837, 10000), 18: b'WGS-84'}
            These values are integer only fields so in each tuple first value is divided by second value to get the real value.
            The GPS coordinates are in degree, minutes and seconds which then has to be converted to decimal degrees.
            """
            (
                exif_dict["GPS"][2][0][0] / exif_dict["GPS"][2][0][1]
                + exif_dict["GPS"][2][1][0] / exif_dict["GPS"][2][1][1] / 60
                + exif_dict["GPS"][2][2][0] / exif_dict["GPS"][2][2][1] / 3600
            )
            (
                exif_dict["GPS"][4][0][0] / exif_dict["GPS"][4][0][1]
                + exif_dict["GPS"][4][1][0] / exif_dict["GPS"][4][1][1] / 60
                + exif_dict["GPS"][4][2][0] / exif_dict["GPS"][4][2][1] / 3600
            )
            exif_dict["GPS"][6][0] / exif_dict["GPS"][6][1]
            logger.info(f"EXIF data found")
            return True
        except (OSError, EOFError) as e:
            print(
                f"{e}. Checking for exif :: No EXIF data found from current pointer: {current_size}, reading till: {current_size+increment_step}, increasing by {increment_step}"
            )
            last_cursor = current_size
            size = increment_step
            current_size += increment_step
        except Exception as e:
            logger.info(f"EXIF info NOT present in image file: {e}")
            return False


def submit_exif_extractor_job(
    task_name=None, iteration_id=None, source_image_path=None
) -> BatchJob:
    logger.info(f"Creating extract_exif batch job creation function for {iteration_id}")

    job_definition = EnvVariable.AWS_BATCH_EXIF_EXTRACTOR_JOB_DEFINITION.value
    job_queue = EnvVariable.AWS_BATCH_EXIF_EXTRACTOR_JOB_QUEUE.value

    exif_extractor_job_variables = [
        {"name": "ITERATION_ID", "value": str(iteration_id)},
        {
            "name": "BUCKET_NAME",
            "value": EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
        },
        {
            "name": "IMAGE_DATA_PATH",
            "value": source_image_path,
        },
        {
            "name": "MASTER_SERVER_HOST",
            "value": EnvVariable.MASTER_SERVER_HOST.value,
        },
        {"name": "WORKERS", "value": str(10)},
    ]

    aws_submit_job_response = AwsManager.submit_batch_job(
        jobName=make_alphanum(task_name),
        jobQueue=job_queue,
        jobDefinition=job_definition,
        containerOverrides=exif_extractor_job_variables,
    )

    if not aws_submit_job_response or not aws_submit_job_response.get("jobId"):
        raise Exception("aws_submit_batch_job_did_not_return_batch_job_id")

    exif_extraction_job_id = aws_submit_job_response["jobId"]

    logger.info(
        f"Created Exif extractor job id: {exif_extraction_job_id} for iteration id: {iteration_id}"
    )

    return BatchJob.objects.create(
        job_id=aws_submit_job_response["jobId"],
        status=BatchJobStatus.STARTED.value,
        env_variables=exif_extractor_job_variables,
    )


def get_image_orientation_slug_from_exif(image_object_key):
    s3_object = AwsManager.get_object(
        bucket=EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
        key=image_object_key,
    )
    with S3File(s3_object) as image_file:
        buffer = io.BytesIO()
        buffer.write(image_file.read(6000))  # Reading only first 6kb of information.
        buffer.seek(0)
        tags = exifread.process_file(buffer)
        image_exif_orientation_type = str(tags.get("Image Orientation", ""))

    image_orientation_slug = IMAGE_ORIENTATION_TYPE_MAPPING.get(
        image_exif_orientation_type,
        ImageOrientationTypeSlug.HORIZONTAL_NORMAL.value,
    )
    return image_orientation_slug
