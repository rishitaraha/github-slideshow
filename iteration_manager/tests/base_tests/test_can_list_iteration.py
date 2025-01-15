from unittest import SkipTest, mock

from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase


class TestCanListIterations(BaseTestCase):
    def setUp(self):
        raise SkipTest("Abstract test")

    # Test list iterations endpoint with permissions.
    def test_list_iteration(self):
        # Arrange.
        params = {"site_id": self.site.id, "search": "test"}

        # Act.
        response = self.client.get(reverse("iteration-list"), params)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(
            sorted([item["name"] for item in response_data["iterations"]]),
            sorted([self.iteration.name, self.test_iteration.name]),
        )
        self.assertEqual(response_data["project_id"], str(self.site.project_id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_check_terrain_tiles_permission(self):
        # Arrange.
        data = {
            "iteration": self.iteration.id,
            "s3_key": "OUTPUT_S3_KEY",
        }

        # Act.
        response = self.client.post(
            reverse("iteration-check-terrain-tiles-permission"), data
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @mock.patch(
        "iteration_manager.views.iteration_views.get_altitude_from_dsm_cog",
        return_value=90.0,
    )
    def test_altitude(self, mock_output):
        # Arrange.
        iteration_id = str(self.iteration.id)

        data = {
            "latitude": "23.815630",
            "longitude": "87.018226",
            "iterations": [iteration_id],
        }

        # Act.
        response = self.client.get(reverse("iteration-altitude"), data=data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["altitudes"][iteration_id], 90.0)
        mock_output.assert_called_once()

    @mock.patch(
        "iteration_manager.views.iteration_views.get_altitude_from_dsm_cog",
        return_value=0.0,
    )
    def test_altitude_with_invalid_query_params(self, mock_output):
        # Arrange.
        data = {
            "latitude": "invalid",
            "longitude": "87.018226asdadsa",
            "iterations": [self.iteration.id],
        }

        # Act.
        response = self.client.get(reverse("iteration-altitude"), data=data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
