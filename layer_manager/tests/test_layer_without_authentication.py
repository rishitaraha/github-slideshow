from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase

from ..constants import ClampToTerrainStatus


class TestLayerGenerators(BaseTestCase):
    def setUp(self):
        pass

    def test_clamp_to_terrain_status(self):
        data = {
            "status": ClampToTerrainStatus.DONE.value,
        }

        response = self.client.patch(
            reverse("layers-clamp-to-terrain-status", kwargs={"pk": self.layer.id}),
            data,
            format="json",
        )
        response_data = response.json()["data"]

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["status"], ClampToTerrainStatus.DONE.value)

    def test_clamp_to_terrain_status_with_invalid_data(self):
        data = {
            "status": "random_value",
        }
        response = self.client.patch(
            reverse("layers-clamp-to-terrain-status", kwargs={"pk": self.layer.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
