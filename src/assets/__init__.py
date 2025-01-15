from enum import Enum
from pathlib import Path

ASSETS_DIR = Path(__file__).resolve().parent


class AssetPath(Enum):
    EMPTY_CESIUM_TERRAIN = ASSETS_DIR.joinpath("empty.terrain")
