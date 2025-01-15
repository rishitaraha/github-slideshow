from fastapi import APIRouter

from ..auth import Authenticate, AuthenticateWithApiEngine
from .fetch_altitude import get_altitude_view
from .histogram import cog_histogram_tile_view
from .raster_tile import cog_tile_view, mbtiles_view
from .terrain_tile import terrain_metadata_view, terrain_tile_view
from .vector_tile import vector_tile_view

router = APIRouter()

# Vector tile route.
router.add_api_route(
    r"/vector/{z}/{x}/{y}.pbf",
    vector_tile_view,
    methods=["GET"],
    dependencies=[AuthenticateWithApiEngine],
)

# Terrain tile routes.
router.add_api_route(
    r"/terrain/layer.json",
    terrain_metadata_view,
    methods=["GET"],
    dependencies=[AuthenticateWithApiEngine],
)

router.add_api_route(
    r"/terrain/{z}/{x}/{y}.terrain",
    terrain_tile_view,
    methods=["GET"],
    dependencies=[AuthenticateWithApiEngine],
)

# Raster tile routes.
router.add_api_route(
    r"/ortho/{z}/{x}/{y}.png",
    cog_tile_view,
    methods=["GET"],
    dependencies=[Authenticate],
)

router.add_api_route(
    r"/mbtiles/{z}/{x}/{y}.png",
    mbtiles_view,
    methods=["GET"],
    dependencies=[AuthenticateWithApiEngine],
)

router.add_api_route(
    r"/histogram/{z}/{x}/{y}.png",
    cog_histogram_tile_view,
    methods=["GET"],
    dependencies=[Authenticate],
)

# Metadata.
router.add_api_route(
    r"/altitude",
    get_altitude_view,
    methods=["GET"],
    dependencies=[Authenticate],
)
