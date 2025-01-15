from datetime import datetime
from unittest import SkipTest

from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase


class TestPlanningKPI(BaseTestCase):
    def setUp(self):
        # Raise this exception in a test to skip it.
        # We want this test class to run only when inherited.
        raise SkipTest("Abstract test")

    def test_planning_kpi_case_1(self):
        """Test get planning KPI successfully."""
        # Arrange.
        current_date = datetime.now()
        financial_year_ending = current_date.year
        if current_date.month > 3:
            financial_year_ending = financial_year_ending + 1
        data = {
            "site_id": self.site.id,
            "financial_year_ending": financial_year_ending,
            "month": current_date.month,
        }
        total_area = {"planned_and_active": "0.000055"}
        # Act.
        response = self.client.get(reverse("dashboard-planning-kpi"), data=data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["financial_year_ending"], financial_year_ending)
        self.assertEqual(response_data["month"], current_date.month)
        self.assertEqual(response_data["total_area"], total_area)

    def test_planning_kpi_case_2(self):
        """
        Test get planning KPI with missing financial_year_ending param.
        """
        # Arrange.
        data = {
            "site_id": self.site.id,
            "month": datetime.now().month,
        }

        # Act.
        response = self.client.get(reverse("dashboard-planning-kpi"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_planning_kpi_case_3(self):
        """Test get planning KPI with missing month param."""
        # Arrange.
        current_date = datetime.now()
        financial_year_ending = current_date.year
        if current_date.month > 3:
            financial_year_ending = financial_year_ending + 1
        data = {
            "site_id": self.site.id,
            "financial_year_ending": financial_year_ending,
        }

        # Act.
        response = self.client.get(reverse("dashboard-planning-kpi"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_planning_kpi_case_4(self):
        """Test get planning KPI for empty financial year."""
        # Arrange.
        data = {
            "site_id": self.site.id,
            "financial_year_ending": 2035,
            "month": 2,
        }

        # Act.
        response = self.client.get(reverse("dashboard-planning-kpi"), data=data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["total_area"], None)

    def test_planning_kpi_case_5(self):
        """Test get planning KPI with incorrect site id."""
        # Arrange.
        data = {
            # Random UUID.
            "site_id": "7ab43ef2-ab23-47f0-ba20-6d264a9d837c",
            "financial_year_ending": 2022,
            "month": 2,
        }

        # Act.
        response = self.client.get(reverse("dashboard-planning-kpi"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestPlanningKpiPremissionDenied(BaseTestCase):
    def setUp(self):
        # Raise this exception in a test to skip it.
        # We want this test class to run only when inherited.
        raise SkipTest("Abstract test")

    def test_get_planning_kpi_permission_denied(self):
        """Test get planning KPI permission denied."""
        # Arrange.
        current_date = datetime.now()
        financial_year_ending = current_date.year
        if current_date.month > 3:
            financial_year_ending = financial_year_ending + 1
        data = {
            "site_id": self.site.id,
            "financial_year_ending": financial_year_ending,
            "month": current_date.month,
        }

        # Act.
        response = self.client.get(reverse("dashboard-planning-kpi"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
