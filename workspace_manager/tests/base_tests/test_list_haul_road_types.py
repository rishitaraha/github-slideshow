from unittest import SkipTest

from django.urls import reverse
from rest_framework import status

from ..base_test_case import WorkspaceBaseTestCase


class TestListHaulRoadTypes(WorkspaceBaseTestCase):
    def setUp(self):
        raise SkipTest("Helper test")

    # Test list haul road types endpoint.
    def test_get_haul_road_types(self):
        # Arrange.
        url = reverse("analytics-haul-roads-types")

        # Act.
        response = self.client.get(url)
        response_data = response.json()["data"]
        first_item = response_data[0]
        expected_keys = {
            "id",
            "name",
        }

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            expected_keys.issubset(first_item.keys()), "Response item keys mismatch."
        )
