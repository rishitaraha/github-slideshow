from uuid import uuid4

from django.dispatch import receiver
from django.urls import reverse
from fieldsignals import post_save_changed

from shared.aws import (
    CogGeneratorPayloadSchema,
    TerrainTileGeneratorPayloadSchema,
    submit_cog_generator_job,
    submit_terrain_tile_generator_job,
)
from shared.constants import FileStatus, FileType
from shared.helpers import create_s3_file_key
from shared.models import BatchJob, FileInfo

from ..models import Iteration


def run_terrain_tile_generator(iteration: Iteration) -> BatchJob:
    # Get update batch job status url.
    update_status_url = reverse(
        "iteration-batch-status",
        kwargs={
            "pk": str(iteration.id),
            "filetype": FileType.TERRAIN_TILES.value,
        },
    )
    update_properties_url = reverse(
        "files-properties",
        kwargs={"pk": str(iteration.captured_dsm.id)},
    )

    terrain_s3_key = create_s3_file_key(
        FileType.TERRAIN_TILES.value, f"{iteration.id}_tt"
    )

    # Iteration info.
    site = iteration.site
    project = site.project
    org = project.org

    payload: TerrainTileGeneratorPayloadSchema = {
        "resource_id": str(iteration.id),
        "input_s3_uri": iteration.captured_dsm.s3_uri,
        "output_s3_uri": f"{iteration.captured_dsm.bucket_name}/{terrain_s3_key}",
        "update_status_url": update_status_url,
        "update_properties_url": update_properties_url,
        "org_name": org.name,
        "project_name": project.name,
        "site_name": site.name,
        "iteration_name": iteration.name,
    }

    return submit_terrain_tile_generator_job(iteration.name, payload)


def run_cog_generator(iteration: Iteration) -> FileInfo:
    # Iteration info.
    site = iteration.site
    project = site.project
    org = project.org

    captured_dsm_cog_file_info = iteration.captured_dsm_cog

    # Creating a FileInfo object for captured dsm cog if it doesn't already exist.
    if captured_dsm_cog_file_info is None:
        captured_dsm_cog_file_id = uuid4()
        captured_dsm_cog_name = f"{iteration.captured_dsm.name[:-5]}_cog.tiff"

        captured_dsm_cog_s3_key = create_s3_file_key(
            FileType.CAPTURED_DSM.value, f"{iteration.id}_cog.tiff"
        )

        captured_dsm_cog_file_info = FileInfo.objects.create(
            id=captured_dsm_cog_file_id,
            name=captured_dsm_cog_name,
            type=FileType.CAPTURED_DSM_COG.value,
            s3_key=captured_dsm_cog_s3_key,
            org=org,
        )

    # Get update batch job status url.
    update_status_url = reverse(
        "iteration-batch-status",
        kwargs={
            "pk": str(iteration.id),
            "filetype": FileType.CAPTURED_DSM_COG.value,
        },
    )
    update_properties_url = reverse(
        "files-properties",
        kwargs={"pk": str(captured_dsm_cog_file_info.id)},
    )

    payload: CogGeneratorPayloadSchema = {
        "resource_id": str(iteration.id),
        "input_s3_uri": iteration.captured_dsm.s3_uri,
        "output_s3_uri": captured_dsm_cog_file_info.s3_uri,
        "update_status_url": update_status_url,
        "update_properties_url": update_properties_url,
        "org_name": org.name,
        "project_name": project.name,
        "site_name": site.name,
        "iteration_name": iteration.name,
    }

    captured_dsm_cog_file_info.batch_job = submit_cog_generator_job(
        iteration.name, payload
    )
    captured_dsm_cog_file_info.status = FileStatus.STARTED.value
    captured_dsm_cog_file_info.save(update_fields=["batch_job", "status"])

    return captured_dsm_cog_file_info


# Ref: https://docs.djangoproject.com/en/4.1/topics/signals/.
@receiver(post_save_changed, sender=FileInfo, fields=["status"])
def run_captured_dsm_batch_jobs(sender, instance: FileInfo, **kwargs):
    iteration: Iteration = instance.captured_dsm_iteration.first()
    """
    We have to run batch jobs if these conditions are satisfied.
     - FileInfo instance should be iteration's captured file.
     - FileInfo objects status should be done
    """
    if (
        iteration is None
        or instance != iteration.captured_dsm
        or instance.status != FileStatus.DONE.value
    ):
        return

    # TODO: Move running batch jobs to serializer create and update method and remove this signal with DSM as a layer.

    # Run batch jobs.
    iteration.terrain_tiles = run_terrain_tile_generator(iteration)
    iteration.captured_dsm_cog = run_cog_generator(iteration)

    iteration.save(update_fields=["terrain_tiles", "captured_dsm_cog"])
