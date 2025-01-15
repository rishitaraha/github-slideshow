from django.dispatch import receiver
from fieldsignals import post_save_changed

from rainbow import logger

from ..constants import FileStatus, FileType
from ..helpers import get_cog_metadata
from ..models import FileInfo
from .enums import FileInfoSignalUID


# Ref: https://docs.djangoproject.com/en/4.1/topics/signals/.
@receiver(
    post_save_changed,
    sender=FileInfo,
    fields=["status"],
    dispatch_uid=FileInfoSignalUID.COG_METADATA_EXTRACTOR.value,
)
def extract_cog_metadata(sender, instance: FileInfo, **kwargs):
    """
    This signal is responsible for extracting the metadata from COG file of orthomosaic and slope_map and store it in FileInfo properties.

    COG metadata will be extracted only if:
        - file status is done
        - and the given instance is either orthomosaic_cog or slope_map.
    """

    if instance.status != FileStatus.DONE.value or instance.type not in [
        FileType.ORTHOMOSAIC_COG.value,
        FileType.SLOPE_MAP.value,
    ]:
        return

    if not (extracted_properties := get_cog_metadata(instance.s3_uri)):
        return

    if not instance.properties:
        instance.properties = {}

    instance.properties = {**instance.properties, **extracted_properties}
    instance.save(update_fields=["properties"])

    logger.info(f"COG metadata extracted successfully from FileInfo<{instance.id}>")
