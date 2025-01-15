import tempfile

import numpy as np
from osgeo.gdal import Dataset
from osgeo.gdal import Open as OpenRaster
from shapely import from_wkt, transform

from ..db import PostgresManager
from ..shared import logger
from ..shared.api_engine_manager import ClampToTerrainStatus
from ..shared.constants import EnvVariable
from ..shared.helpers import download_cog_part, get_elevation
from .helpers import update_clamp_to_terrain_status
from .schemas import ClampToTerrainPayload


def add_elevation(feature_coords: np.ndarray, dsm_path: str):
    try:
        dsm_ds: Dataset = OpenRaster(dsm_path)
        # Replacing 3rd column (Z values) with new elevation values.
        feature_coords[:, 2] = get_elevation(
            dsm_ds,
            feature_coords[:, :2],
            allow_xy_outside_extent=True,
            new_nodata_value=0.0,
        )
        del dsm_ds
    except Exception as e:
        logger.exception(e)

    return feature_coords


def get_features(layer_id: str) -> dict:
    db = PostgresManager()
    db_connection = db.get_connection()

    with db_connection.cursor() as cursor:
        try:
            cursor.execute(f"select * from get_features_by_layer('{layer_id}');")
            return cursor.fetchone()[0]
        except Exception as exc:
            # Re-throwing exception to handle update status on parent.
            raise exc
        finally:
            db.disconnect()


def update_features(features_string: str):
    db = PostgresManager()
    db_connection = db.get_connection()
    with db_connection.cursor() as cursor:
        try:
            cursor.execute(
                f"SELECT bulk_update_features(ARRAY[{features_string}]::FEATURE_TYPE[]);"
            )
        except Exception as exc:
            # Re-throwing exception to handle update status on parent.
            raise exc
        finally:
            db_connection.commit()
            db.disconnect()


def clamp_to_terrain(payload: ClampToTerrainPayload):
    logger.info("Clamp to Terrain Process started..")
    update_url = payload.update_status_url

    update_clamp_to_terrain_status(update_url, ClampToTerrainStatus.PROCESSING)

    cog_part_temp_file = tempfile.NamedTemporaryFile(suffix=f".tif")

    dsm_path = download_cog_part(
        f"s3://{EnvVariable.BUCKET_NAME.value}/{payload.dsm_cog_s3_key}",
        bounds=payload.bounds,
        output_file_path=cog_part_temp_file.name,
    )

    try:
        features = get_features(payload.layer_id)
    except Exception:
        logger.exception("Failed to fetch features from DB", stack_info=True)
        update_clamp_to_terrain_status(update_url, ClampToTerrainStatus.FAILED)
        return

    logger.info("Adding elevation to geometry...")

    features_tuple_array = []

    # Add elevation to feature geometries.
    for feature in features:
        geometry_wkt = from_wkt(feature["geometry"])
        geometry = transform(
            geometry_wkt,
            lambda feature_coords: add_elevation(feature_coords, dsm_path),
            include_z=True,
        ).wkt
        feature["geometry"] = geometry
        id = feature["id"]
        features_tuple_array.append(
            (str(id), geometry),
        )

    features_string = ",".join(map(str, features_tuple_array))

    try:
        logger.info("Updating features")
        update_features(features_string)
    except Exception:
        logger.exception("Failed to update features in DB", stack_info=True)
        update_clamp_to_terrain_status(update_url, ClampToTerrainStatus.FAILED)
        return

    logger.info("Clamp to terrain task completed successfully")
    update_clamp_to_terrain_status(update_url, ClampToTerrainStatus.DONE)
