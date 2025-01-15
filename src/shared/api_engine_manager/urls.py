from enum import Enum
from typing import Dict


class APIEngineURL(Enum):
    HAUL_ROADS_LAYER = "analytics-haul-roads-layer"
    HAUL_ROADS_LAYER_STATUS = "analytics-haul-roads-layer-status"
    HAUL_ROADS_STATUS = "analytics-haul-roads-status"
    LAYERS_DOWNLOAD = "layers-download"
    LAYERS_FILE_STATUS = "layers-file-status"
    SMART_DETECT_STATUS = "analytics-smart-detects-status"
    SMART_DETECT_UPLOAD = "analytics-smart-detects-output"


API_ENGINE_URL_MAP = {
    APIEngineURL.HAUL_ROADS_LAYER_STATUS.value: lambda args: f"/workspaces/analytics/haul-roads/{args['haul_road_id']}/layer-status/",
    APIEngineURL.HAUL_ROADS_LAYER.value: lambda args: f"/workspaces/analytics/haul-roads/{args['haul_road_id']}/layer/",
    APIEngineURL.HAUL_ROADS_STATUS.value: lambda args: f"/workspaces/analytics/haul-roads/{args['haul_road_id']}/status/",
    APIEngineURL.LAYERS_DOWNLOAD.value: lambda args: f"/layers/{args['layer_id']}/download/",
    APIEngineURL.LAYERS_FILE_STATUS.value: lambda args: f"/layers/{args['layer_id']}/file-status/",
    APIEngineURL.SMART_DETECT_STATUS.value: lambda args: f"/workspaces/analytics/smart-detects/{args['smart_detect_id']}/status/",
    APIEngineURL.SMART_DETECT_UPLOAD.value: lambda args: f"/workspaces/analytics/smart-detects/{args['smart_detect_id']}/outputs/",
}


def api_engine_url_generator(url_name: APIEngineURL, args: Dict):
    return API_ENGINE_URL_MAP[url_name.value](args)
