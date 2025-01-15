from uuid import uuid4

from django.urls import reverse

from shared.aws import CogGeneratorPayloadSchema, submit_cog_generator_job
from shared.constants import FileStatus, FileType
from shared.helpers import create_s3_file_key, get_object_or_none
from shared.models import FileInfo

from ...models import Layer, LayerFile


def run_ortho_cog_generator(layer_file: LayerFile):
    # Layer info.
    layer: Layer = layer_file.layer
    iteration = layer.iteration
    site = iteration.site
    project = site.project
    org = project.org

    # Assumption: These will be only one orthomosaic cog file of a orthomosaic layer.
    if ortho_cog_layer_file := get_object_or_none(
        LayerFile, layer=layer, file_info__type=FileType.ORTHOMOSAIC_COG.value
    ):
        ortho_cog_file_info = ortho_cog_layer_file.file_info
    else:
        ortho_cog_file_id = uuid4()
        ortho_cog_s3_key = create_s3_file_key(
            FileType.ORTHOMOSAIC_COG.value, f"{ortho_cog_file_id}.tif"
        )

        ortho_cog_file_info = FileInfo.objects.create(
            id=ortho_cog_file_id,
            name=f"COG-{layer_file.file_info.name}",
            type=FileType.ORTHOMOSAIC_COG.value,
            s3_key=ortho_cog_s3_key,
            org=org,
        )

        ortho_cog_layer_file = LayerFile.objects.create(
            layer=layer, file_info=ortho_cog_file_info
        )

    # Get update layer file status url.
    update_status_url = reverse(
        "files-status",
        kwargs={
            "pk": str(ortho_cog_file_info.id),
        },
    )
    update_properties_url = reverse(
        "files-properties",
        kwargs={"pk": str(ortho_cog_file_info.id)},
    )

    payload: CogGeneratorPayloadSchema = {
        "resource_id": str(layer_file.file_info.id),
        "input_s3_uri": layer_file.file_info.s3_uri,
        "output_s3_uri": ortho_cog_file_info.s3_uri,
        "update_status_url": update_status_url,
        "update_properties_url": update_properties_url,
        "org_name": org.name,
        "project_name": project.name,
        "site_name": site.name,
        "iteration_name": iteration.name,
        "layer_name": layer.name,
    }

    cog_batch_job_object = submit_cog_generator_job(layer.name, payload)

    ortho_cog_file_info.batch_job = cog_batch_job_object
    ortho_cog_file_info.status = FileStatus.STARTED.value
    ortho_cog_file_info.save(update_fields=["batch_job", "status"])
