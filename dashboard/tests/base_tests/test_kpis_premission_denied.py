from unittest import SkipTest

from .test_kpi_planning import TestPlanningKpiPremissionDenied
from .test_kpi_production import TestProductionKpiPermissionDenied
from .test_kpi_safety_index import TestSafetyIndexKpiPermissionDenied
from .test_kpi_stock_volume import TestStockVolumeKpiPermissionDenied


class TestKpisPermissionDenied(
    TestPlanningKpiPremissionDenied,
    TestProductionKpiPermissionDenied,
    TestSafetyIndexKpiPermissionDenied,
    TestStockVolumeKpiPermissionDenied,
):
    def setUp(self):
        # Raise this exception in a test to skip it.
        # We want this test class to run only when inherited.
        raise SkipTest("Abstract test")
