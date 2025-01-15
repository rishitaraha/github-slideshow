from unittest import SkipTest

from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase

from ...constants import LayerType


class TestCannotManageLayers(BaseTestCase):
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

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test update layer endpoint.
    def test_update_layer(self):
        # Arrange.
        data = {"name": "Updated Name"}

        # Act.
        response = self.client.patch(
            reverse("layers-detail", kwargs={"pk": self.layer2.id}), data
        )
        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test get layer endpoint.
    def test_get_layer(self):
        # Act.
        response = self.client.get(
            reverse("layers-detail", kwargs={"pk": self.layer2.id})
        )
        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test delete layer endpoint.
    def test_delete_layer(self):
        # Act.
        response = self.client.delete(
            reverse("layers-detail", kwargs={"pk": self.layer2.id})
        )
        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
