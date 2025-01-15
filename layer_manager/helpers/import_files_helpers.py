from typing import Union

from django.urls import reverse
from rest_framework import status

from layer_manager.constants import LayerFileFormat
from layer_manager.models import LayerFile
from shared.aws.lambda_functions.export_s3_lambda import invoke_export_s3_to_s3
from shared.constants import FileStatus, FileType
from shared.helpers import create_s3_file_key
from shared.models import FileInfo

from ..models import Iteration
from .file_helpers import prepare_layer_file_info


def import_dsm(
    iteration: Iteration, source_bucket_name: str, source_file_s3_key: str, org: str
):
    filename = source_file_s3_key.split("/")[-1]

    if captured_dsm := iteration.captured_dsm:
        captured_dsm.name = filename
        captured_dsm.status = FileStatus.IMPORTING.value
    else:
        key = create_s3_file_key(
            FileType.CAPTURED_DSM.value, f"{str(iteration.id)}.tif"
        )
        captured_dsm = FileInfo(
            name=filename,
            s3_key=key,
            status=FileStatus.IMPORTING.value,
            type=FileType.CAPTURED_DSM.value,
            org=org,
        )
    captured_dsm.save()
    iteration.captured_dsm = captured_dsm
    iteration.save(update_fields=["captured_dsm"])

    update_status_url = reverse(
        "iteration-file-status",
        kwargs={
            "pk": str(iteration.id),
            "filetype": FileType.CAPTURED_DSM.value,
        },
    )

    payload = {
        "source": {
            "bucket": source_bucket_name,
            "key": source_file_s3_key,
        },
        "destination": {
            "bucket": captured_dsm.bucket_name,
            "key": captured_dsm.s3_key,
        },
        "update_status_url": update_status_url,
    }

    lambda_function_status = invoke_export_s3_to_s3(payload)

    if lambda_function_status != status.HTTP_202_ACCEPTED:
        captured_dsm.status = FileStatus.IMPORT_FAILED.value
        captured_dsm.save(update_fields=["status"])

    return lambda_function_status


def import_orthomosaic_as_layer(
    *,
    new_layer,
    source_bucket_name: str,
    source_file_s3_key: str,
    org: str,
    filename: Union[str, None] = None,
) -> LayerFile:
    """
    The `import_orthomosaic` function imports an orthomosaic file info object into a specified layer
    or creates a new file_info object by exporting orthomosaic from processing
    """
    if filename is None:
        filename = source_file_s3_key.split("/")[-1]

    new_ortho_file_info = prepare_layer_file_info(
        file_format=LayerFileFormat.TIF,
        filetype=FileType.ORTHOMOSAIC,
        status=FileStatus.STARTED,
        org=org,
        filename=filename,
    )

    new_ortho_layer_file = LayerFile.objects.create(
        layer=new_layer, file_info=new_ortho_file_info
    )

    update_status_url = reverse(
        "layer-files-status",
        kwargs={
            "pk": str(new_ortho_layer_file.id),
        },
    )

    payload = {
        "source": {
            "bucket": source_bucket_name,
            "key": source_file_s3_key,
        },
        "destination": {
            "bucket": new_ortho_file_info.bucket_name,
            "key": new_ortho_file_info.s3_key,
        },
        "update_status_url": update_status_url,
    }

    lambda_function_status = invoke_export_s3_to_s3(payload)

    if lambda_function_status != status.HTTP_202_ACCEPTED:
        new_ortho_file_info.status = FileStatus.IMPORT_FAILED.value
        new_ortho_file_info.save(update_fields=["status"])

    return new_ortho_layer_file
