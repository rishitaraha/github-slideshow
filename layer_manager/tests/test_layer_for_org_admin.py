from django.urls import reverse
from rest_framework import status

from ..constants import LayerType
from .base_tests import TestCanManageLayers, TestCanViewLayers


class TestLayerForOrgAdmin(TestCanViewLayers, TestCanManageLayers):
    def setUp(self):
        self.api_authentication(self.org_admin)

    # Test add layer endpoint.
    def test_create_layer(self):
        # Arrange.
        data = {
            "name": "Test layer",
            "iteration": self.iteration.id,
            "source_id": "some test source id",
            "type": LayerType.VECTOR.value,
        }

        # Act.
        response = self.client.post(reverse("layers-list"), data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_data["name"], data["name"])

    # Test create mbtiles layer endpoint without feature enabled.
    def test_mbtiles_layer_without_feature_enabled(self):
        # Arrange.
        self.api_authentication(self.org_admin_without_feature_flag)
        data = {
            "name": "Test layer",
            "iteration": self.iteration.id,
            "source_id": "some test source id",
            "file_id": self.file_info.id,
            "type": LayerType.MBTILES.value,
        }

        # Act.
        response = self.client.post(reverse("layers-list"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test delete layer endpoint.
    def test_delete_layer(self):
        # Act.
        response = self.client.delete(
            reverse("layers-detail", kwargs={"pk": self.layer2.id})
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
