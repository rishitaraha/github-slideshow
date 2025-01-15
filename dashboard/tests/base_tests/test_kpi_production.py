from unittest import SkipTest

from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase


class TestProductionKPI(BaseTestCase):
    def setUp(self):
        # Raise this exception in a test to skip it.
        # We want this test class to run only when inherited.
        raise SkipTest("Abstract test")

    def test_production_kpi_case_1(self):
        """Test get production KPI successfully."""
        # Arrange.
        data = {
            "site_id": self.site.id,
            "financial_year_ending": 2022,
        }

        # Act.
        response = self.client.get(reverse("dashboard-production-kpi"), data=data)
        response_data = response.json()["data"]

        # Assert.
        expected_monthy_production_data_in_feburary = {
            "target_overburden_production": 1000.0,
            "target_ore_production": 800.0,
            "target_composite_volume": 1800.0,
            "target_stripping_ratio": 1.25,
            "actual_overburden_production": 850.0,
            "actual_ore_production": 725.0,
            "actual_composite_volume": 1575.0,
            "actual_stripping_ratio": 1.1724137931034482,
        }
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["financial_year_ending"], 2022)
        self.assertEqual(
            response_data["monthly_production"]["feb"],
            expected_monthy_production_data_in_feburary,
        )

    def test_production_kpi_case_2(self):
        """Test get production KPI with missing parameters."""
        # Arrange.
        data = {
            "site_id": self.site.id,
        }

        # Act.
        response = self.client.get(reverse("dashboard-production-kpi"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_production_kpi_case_3(self):
        """Test get production KPI for empty financial year."""
        # Arrange.
        data = {
            "site_id": self.site.id,
            "financial_year_ending": 2035,
        }

        # Act.
        response = self.client.get(reverse("dashboard-production-kpi"), data=data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["monthly_production"], None)

    def test_production_kpi_case_4(self):
        """Test get production KPI with incorrect site id."""
        # Arrange.
        data = {
            # Random UUID.
            "site_id": "7ab43ef2-ab23-47f0-ba20-6d264a9d837c",
            "financial_year_ending": 2022,
        }

        # Act.
        response = self.client.get(reverse("dashboard-production-kpi"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestProductionKpiPermissionDenied(BaseTestCase):
    def setUp(self):
        # Raise this exception in a test to skip it.
        # We want this test class to run only when inherited.
        raise SkipTest("Abstract test")

    def test_get_production_kpi_permission_denied(self):
        """Test get production KPI permission denied."""
        # Arrange.
        data = {
            "site_id": self.site.id,
            "financial_year_ending": 2022,
        }

        # Act.
        response = self.client.get(reverse("dashboard-production-kpi"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
