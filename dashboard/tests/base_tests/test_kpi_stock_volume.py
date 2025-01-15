from unittest import SkipTest

from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase


class TestStockVolumeKPI(BaseTestCase):
    def setUp(self):
        # Raise this exception in a test to skip it.
        # We want this test class to run only when inherited.
        raise SkipTest("Abstract test")

    def test_stock_volume_kpi_case_1(self):
        """Test get stock volume KPI successfully."""
        # Arrange.
        data = {
            "site_id": self.site.id,
            "financial_year_ending": 2022,
        }

        # Act.
        response = self.client.get(reverse("dashboard-stock-volume-kpi"), data=data)
        response_data = response.json()["data"]

        # Assert.
        expected_monthy_stock_volume_data_in_feburary = {
            "stock_volume": 450.00,
        }

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["financial_year_ending"], 2022)
        self.assertEqual(
            response_data["monthly_stock_volume"]["feb"],
            expected_monthy_stock_volume_data_in_feburary,
        )

    def test_stock_volume_kpi_case_2(self):
        """Test get stock volume KPI with missing parameters."""
        # Arrange.
        data = {
            "site_id": self.site.id,
        }

        # Act.
        response = self.client.get(reverse("dashboard-stock-volume-kpi"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stock_volume_kpi_case_3(self):
        """Test get stock volume KPI for empty financial year."""
        # Arrange.
        data = {
            "site_id": self.site.id,
            "financial_year_ending": 2035,
        }

        # Act.
        response = self.client.get(reverse("dashboard-stock-volume-kpi"), data=data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["monthly_stock_volume"], None)

    def test_stock_volume_kpi_case_4(self):
        """Test get stock volume KPI with incorrect site id."""
        # Arrange.
        data = {
            # Random UUID.
            "site_id": "7ab43ef2-ab23-47f0-ba20-6d264a9d837c",
            "financial_year_ending": 2022,
        }

        # Act.
        response = self.client.get(reverse("dashboard-stock-volume-kpi"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestStockVolumeKpiPermissionDenied(BaseTestCase):
    def setUp(self):
        # Raise this exception in a test to skip it.
        # We want this test class to run only when inherited.
        raise SkipTest("Abstract test")

    def test_get_stock_volume_kpi_permission_denied(self):
        """Test get stock volume KPI permission denied."""
        # Arrange.
        data = {
            "site_id": self.site.id,
            "financial_year_ending": 2022,
        }

        # Act.
        response = self.client.get(reverse("dashboard-stock-volume-kpi"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
