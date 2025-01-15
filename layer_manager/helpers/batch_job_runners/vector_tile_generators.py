from uuid import uuid4

from django.urls import reverse

from analytics_engine_manager.operations import extract_mbtiles
from shared.aws import (
    MbTilesExtractorPayloadSchema,
    VectorTilesGeneratorPayloadSchema,
    submit_vector_tile_generator_job,
)
from shared.constants import FileStatus, FileType
from shared.helpers import create_s3_file_key, get_object_or_none
from shared.models import FileInfo

from ...models import Layer, LayerFile


def prepare_tiles_layer_file(layer: Layer) -> tuple[LayerFile, FileInfo]:
    """
    This function prepares a layer file for vector tiles.
    It will create a new layer file object if one does not already exist otherwise it will return the existing layer file.

    Args:
        layer: The "layer" parameter is an instance of the Layer model.

    Return: A tuple containing the `tile_layer_file` and `tile_layer_file_info` objects.
    """

    if tile_layer_file := get_object_or_none(
        LayerFile, layer=layer, file_info__type=FileType.VECTOR_TILES.value
    ):
        tile_layer_file_info = tile_layer_file.file_info
    else:
        vector_tiles_file_id = uuid4()
        vector_tiles_s3_key = create_s3_file_key(
            FileType.VECTOR_TILES.value, str(vector_tiles_file_id)
        )

        tile_layer_file_info = FileInfo.objects.create(
            id=vector_tiles_file_id,
            name=f"{layer.name}-vector-tiles",
            type=FileType.VECTOR_TILES.value,
            s3_key=vector_tiles_s3_key,
            is_folder=True,
            org=layer.site.project.org,
        )

        tile_layer_file = LayerFile.objects.create(
            layer=layer, file_info=tile_layer_file_info
        )

    return tile_layer_file, tile_layer_file_info


def run_vector_tiles_generator(layer_file: LayerFile):
    # Layer info.
    layer: Layer = layer_file.layer
    iteration = layer.iteration
    site = iteration.site
    project = site.project
    org = project.org

    _, tile_layer_file_info = prepare_tiles_layer_file(layer)

    # Get update layer file status url.
    update_status_url = reverse(
        "files-status",
        kwargs={
            "pk": str(tile_layer_file_info.id),
        },
    )

    # Get update properties url.
    update_properties_url = reverse(
        "files-properties", kwargs={"pk": str(tile_layer_file_info.id)}
    )

    payload: VectorTilesGeneratorPayloadSchema = {
        "resource_id": str(layer_file.file_info.id),
        "input_s3_uri": layer_file.file_info.s3_uri,
        "output_s3_uri": tile_layer_file_info.s3_uri,
        "update_status_url": update_status_url,
        "update_properties_url": update_properties_url,
        "org_name": org.name,
        "project_name": project.name,
        "site_name": site.name,
        "iteration_name": iteration.name,
        "layer_name": layer.name,
    }

    batch_job_object = submit_vector_tile_generator_job(layer.name, payload)

    tile_layer_file_info.batch_job = batch_job_object
    tile_layer_file_info.status = FileStatus.STARTED.value
    tile_layer_file_info.save(update_fields=["batch_job", "status"])


def run_mbtiles_extractor(layer_file: LayerFile):
    # Layer info.
    layer: Layer = layer_file.layer
    iteration = layer.iteration
    site = iteration.site
    project = site.project
    org = project.org

    _, tile_layer_file_info = prepare_tiles_layer_file(layer)

    # Get update layer file status url.
    update_status_url = reverse(
        "files-status",
        kwargs={
            "pk": str(tile_layer_file_info.id),
        },
    )

    # Get update properties url.
    update_properties_url = reverse(
        "files-properties", kwargs={"pk": str(tile_layer_file_info.id)}
    )

    payload: MbTilesExtractorPayloadSchema = {
        "resource_id": str(layer_file.file_info.id),
        "input_s3_uri": layer_file.file_info.s3_uri,
        "output_s3_uri": tile_layer_file_info.s3_uri,
        "update_status_url": update_status_url,
        "update_properties_url": update_properties_url,
        "org_name": org.name,
        "project_name": project.name,
        "site_name": site.name,
        "iteration_name": iteration.name,
        "layer_name": layer.name,
    }

    batch_job_object = extract_mbtiles(payload)

    tile_layer_file_info.batch_job = batch_job_object
    tile_layer_file_info.status = FileStatus.STARTED.value
    tile_layer_file_info.save(update_fields=["batch_job", "status"])
