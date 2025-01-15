from django.db import models

from org_manager.models import Organisation

from ..constants import HaulRoadRiskAnalysisType
from ..helpers import calculate_haul_road_risk_range
from ..schemas import HRARiskRangeSchema


class HaulRoadRiskAnalysisSettingsManager(models.Manager):
    def get_hra_risk_ranges(
        self,
        *,
        org: Organisation,
        type: HaulRoadRiskAnalysisType,
        haul_road_type,
        vehicle_width: float,
    ) -> list[HRARiskRangeSchema]:
        hra_settings = self.model.objects.filter(
            type=type.value,
            org=org,
            haul_road_type=haul_road_type,
        )

        hra_risk_ranges: list[HRARiskRangeSchema] = [
            {
                "min_value": calculate_haul_road_risk_range(
                    hra_setting.min_range, vehicle_width
                ),
                "max_value": calculate_haul_road_risk_range(
                    hra_setting.max_range, vehicle_width
                ),
                "color": hra_setting.color,
                "risk_category": hra_setting.risk_category,
            }
            for hra_setting in hra_settings
        ]

        return hra_risk_ranges
