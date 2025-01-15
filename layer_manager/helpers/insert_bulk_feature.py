from tempfile import TemporaryDirectory

from django.contrib.gis.geos import GEOSGeometry

from rainbow import background_task_logger
from rainbow.exceptions.custom_exceptions import CRSNotFound
from shared.constants.files import FileError, FileStatus

from ..constants import ClampToTerrainStatus
from ..models import Feature, Layer, LayerFile
from .clamp_features import send_features_to_clamp
from .vector_file import parse_uploaded_shapefile


def insert_bulk_features(
    shapefile_temp_dir: TemporaryDirectory, layer: Layer, clamp_to_terrain: bool | None
):
    status = FileStatus.DONE.value
    layer_file = LayerFile.objects.get(layer_id=layer.id)
    file_info = layer_file.file_info
    err_slug = ""

    try:
        background_task_logger.info("Vector file processing has started.")
        features_data = parse_uploaded_shapefile(shapefile_temp_dir)

        # Get first feature for checking z value to determine 2D or 3D.
        feature = next(features_data, None)
        if feature:
            feature_geometry = GEOSGeometry(feature["geometry"])
            hasz = feature_geometry.hasz

            Feature.objects.create(
                layer=layer, geometry=feature_geometry, attributes=feature["attributes"]
            )
            del feature_geometry
            del feature

        features = (
            Feature(
                layer=layer,
                geometry=feature_data["geometry"],
                # HACK: Adding name so that we can sort by name for HRA attributes. TODO: Remove this after implementing attribute table.
                name=(
                    feature_data["attributes"].get("name")
                    or feature_data["attributes"].get("Name")
                    or feature_data["attributes"].get("NAME")
                ),
                attributes=feature_data["attributes"],
            )
            for feature_data in features_data
        )

        Feature.objects.bulk_insert_copy(features)
        captured_dsm_cog = layer.iteration.captured_dsm_cog
        if not clamp_to_terrain and hasz:
            layer.clamped_status = ClampToTerrainStatus.ALREADY_CLAMPED.value
            layer.save(update_fields=["clamped_status"])

        elif clamp_to_terrain and captured_dsm_cog is not None:
            layer.clamped_status = ClampToTerrainStatus.STARTED.value
            layer.save(update_fields=["clamped_status"])
            send_features_to_clamp(layer.id, captured_dsm_cog.s3_key)

        # Clear Memory.
        del features
        del features_data

    except FileNotFoundError:
        status = FileStatus.FAILED.value
        err_slug = FileError.SHAPEFILE_NOT_FOUND_IN_ZIP.name

    except CRSNotFound:
        status = FileStatus.FAILED.value
        err_slug = FileError.CRS_NOT_FOUND_IN_VECTOR_FILE.name

    except Exception as exc:
        status = FileStatus.FAILED.value
        err_slug = FileError.SOMETHING_WENT_WRONG.name
        background_task_logger.exception(f"{err_slug}: {str(exc)}", exc_info=True)

    finally:
        if status == FileStatus.FAILED.value:
            file_info.errors.append(err_slug)
            file_info.status = status
            file_info.save()
        else:
            # Removing the layer_file and file_info object once the layer is created
            layer_file.delete()
            file_info.delete()

            background_task_logger.info("Vector file processing is done.")

        # Deleting temp directory.
        shapefile_temp_dir.cleanup()
