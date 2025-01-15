from unittest import SkipTest, mock

from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase

from ...constants import LayerType


class TestCanManageLayers(BaseTestCase):
    def setUp(self):
        raise SkipTest("Helper test")

    # Test add layer endpoint.
    def test_create_layer(self):
        # Arrange.
        data = {
            "name": "Test layer",
            "iteration": self.iteration.id,
            "source_id": "some test source id",
            "type": LayerType.VECTOR.value,
            "access_tags": [self.access_tag.id],
        }

        # Act.
        response = self.client.post(reverse("layers-list"), data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(len(response_data["access_tags"]), 1)

    # Test update layer endpoint.
    def test_update_layer(self):
        # Arrange.
        data = {
            "name": "Updated Name",
            "access_tags": [self.access_tag.id, self.access_tag2.id],
        }

        # Act.
        response = self.client.patch(
            reverse("layers-detail", kwargs={"pk": self.layer.id}), data
        )

        # Assert.
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(len(response_data["access_tags"]), 2)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test delete layer endpoint.
    def test_delete_layer(self):
        # Act.
        response = self.client.delete(
            reverse("layers-detail", kwargs={"pk": self.layer2.id})
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_properties(self):
        data = {
            "properties": {"key": "values"},
        }
        response = self.client.patch(
            reverse(
                "layers-properties",
                kwargs={
                    "pk": self.layer.id,
                },
            ),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @mock.patch(
        "layer_manager.views.layer_views.send_features_to_clamp", return_value=None
    )
    def test_clamp_to_terrain(self, *mock_output):
        response = self.client.post(
            reverse("layers-clamp-to-terrain", kwargs={"pk": self.layer.id}),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
