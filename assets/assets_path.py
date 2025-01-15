import os
from enum import Enum

from django.conf import settings

ASSETS_DIR = os.path.join(settings.BASE_DIR, "assets")


class AssetPath(Enum):
    FEATURES_STYLE = os.path.join(ASSETS_DIR, "features_styles.json")
    PRODUCTION_KPI_CSV_TEMPLATE = os.path.join(
        ASSETS_DIR, "kpi_templates/production_kpi_template.csv"
    )
    STOCK_VOLUME_KPI_CSV_TEMPLATE = os.path.join(
        ASSETS_DIR, "kpi_templates/stock_volume_kpi_template.csv"
    )
    SAFETY_INDEX_KPI_CSV_TEMPLATE = os.path.join(
        ASSETS_DIR, "kpi_templates/safety_index_kpi_template.csv"
    )
