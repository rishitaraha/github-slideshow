from unittest import SkipTest

from layer_manager.constants import AreaCategory, FeatureType, LayerType
from layer_manager.models import Feature, Layer
from shared.tests.constants import WKTGeometry
from site_manager.models import SiteKPI

from .test_kpi_planning import TestPlanningKPI
from .test_kpi_production import TestProductionKPI
from .test_kpi_safety_index import TestSafetyIndexKPI
from .test_kpi_stock_volume import TestStockVolumeKPI


class TestKPIs(
    TestPlanningKPI,
    TestProductionKPI,
    TestSafetyIndexKPI,
    TestStockVolumeKPI,
):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        cls.layer2 = Layer.objects.create(
            name="Test Layer",
            iteration=cls.iteration,
            site=cls.site,
            source_id="source id",
            type=LayerType.VECTOR.value,
            area_category=AreaCategory.PLANNED_AND_ACTIVE.value,
        )

        cls.feature2 = Feature.objects.create(
            name="Test Feature",
            geometry=WKTGeometry.POLYGON.value,
            layer=cls.layer2,
            type=FeatureType.POLYGON.value,
            properties={"area": 55.06},
        )

        cls.site_kpi_object = SiteKPI.objects.get(
            site=cls.site,
            year=2022,
            month=2,
        )

        # Add sample production kpi data.
        cls.site_kpi_object.target_overburden_production = 1000.00
        cls.site_kpi_object.target_ore_production = 800.00
        cls.site_kpi_object.actual_overburden_production = 850.00
        cls.site_kpi_object.actual_ore_production = 725.00

        # Add sample safety index kpi data.
        cls.site_kpi_object.haul_road_distance_under_gradient_issue = 7.00
        cls.site_kpi_object.haul_road_distance_under_width_issue = 8.00

        # Add sample stock volume kpi data.
        cls.site_kpi_object.stock_volume = 450.00

        cls.site_kpi_object.save(
            update_fields=[
                "target_overburden_production",
                "target_ore_production",
                "actual_overburden_production",
                "actual_ore_production",
                "haul_road_distance_under_gradient_issue",
                "haul_road_distance_under_width_issue",
                "stock_volume",
            ]
        )

    def setUp(self):
        # Raise this exception in a test to skip it.
        # We want this test class to run only when inherited.
        raise SkipTest("Abstract test")
