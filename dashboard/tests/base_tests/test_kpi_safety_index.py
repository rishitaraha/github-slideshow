from unittest import SkipTest

from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase


class TestSafetyIndexKPI(BaseTestCase):
    def setUp(self):
        # Raise this exception in a test to skip it.
        # We want this test class to run only when inherited.
        raise SkipTest("Abstract test")

    def test_safety_index_kpi_case_1(self):
        """Test get safety index KPI successfully."""
        # Arrange.
        data = {
            "site_id": self.site.id,
            "financial_year_ending": 2022,
        }

        # Act.
        response = self.client.get(reverse("dashboard-safety-index-kpi"), data=data)
        response_data = response.json()["data"]

        # Assert.
        expected_monthy_safety_index_data_in_feburary = {
            "haul_road_distance_under_gradient_issue": 7.00,
            "haul_road_distance_under_width_issue": 8.00,
        }

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["financial_year_ending"], 2022)
        self.assertEqual(
            response_data["monthly_safety_index"]["feb"],
            expected_monthy_safety_index_data_in_feburary,
        )

    def test_safety_index_kpi_case_2(self):
        """Test get safety index KPI with missing parameters."""
        # Arrange.
        data = {
            "site_id": self.site.id,
        }

        # Act.
        response = self.client.get(reverse("dashboard-safety-index-kpi"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_safety_index_kpi_case_3(self):
        """Test get safety index KPI for empty financial year."""
        # Arrange.
        data = {
            "site_id": self.site.id,
            "financial_year_ending": 2035,
        }

        # Act.
        response = self.client.get(reverse("dashboard-safety-index-kpi"), data=data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["monthly_safety_index"], None)

    def test_safety_index_kpi_case_4(self):
        """Test get safety index KPI with incorrect site id."""
        # Arrange.
        data = {
            # Random UUID.
            "site_id": "7ab43ef2-ab23-47f0-ba20-6d264a9d837c",
            "financial_year_ending": 2022,
        }

        # Act.
        response = self.client.get(reverse("dashboard-safety-index-kpi"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestSafetyIndexKpiPermissionDenied(BaseTestCase):
    def setUp(self):
        # Raise this exception in a test to skip it.
        # We want this test class to run only when inherited.
        raise SkipTest("Abstract test")

    def test_get_safety_index_kpi_permission_denied(self):
        """Test get safety index KPI permission denied."""
        # Arrange.
        data = {
            "site_id": self.site.id,
            "financial_year_ending": 2022,
        }

        # Act.
        response = self.client.get(reverse("dashboard-safety-index-kpi"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
