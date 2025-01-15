from shared.constants import FileStatus

from ...constants import LayerType, VectorFileFormat
from ...models import LayerFile
from .cog_generator import run_ortho_cog_generator
from .vector_tile_generators import run_mbtiles_extractor, run_vector_tiles_generator


def run_batch_job(layer_file: LayerFile):
    """
    This helper function is responsible for handling running the batch job for all layer files.
    """
    layer = layer_file.layer
    file_info = layer_file.file_info

    if (
        not file_info
        or file_info.is_deleted
        or file_info.status != FileStatus.DONE.value
    ):
        return

    if layer.type == LayerType.ORTHOMOSAIC.value:
        run_ortho_cog_generator(layer_file)
    elif layer.type == LayerType.MBTILES.value:
        run_mbtiles_extractor(layer_file)
    elif (
        layer.type == LayerType.CONTOUR.value
        and file_info.extension == f".{VectorFileFormat.GPKG.value}"
    ):
        run_vector_tiles_generator(layer_file)
