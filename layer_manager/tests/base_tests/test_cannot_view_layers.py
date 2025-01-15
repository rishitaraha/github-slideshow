from unittest import SkipTest

from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase

from ...constants import LayerType, VectorFileFormat
from ...models import AccessTag, Layer


class TestCannotViewLayers(BaseTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        # Arrange.
        cls.layer2 = Layer.objects.create(
            name="Layer 2",
            iteration=cls.iteration,
            site=cls.site,
            source_id="some source id 2",
            type=LayerType.MAPBOX.value,
        )
        cls.access_tag = AccessTag.objects.create(
            name="Access Tag 1", org=cls.org, color="#ffffff"
        )

    def setUp(self):
        raise SkipTest("Helper test")

    # Test list layers endpoint with authentication.
    def test_list_layer(self):
        # Arrange.
        params = {
            "iteration_id": self.iteration.id,
            "search": "layer",
            "page": 1,
        }

        # Act.
        response = self.client.get(reverse("layers-list"), params)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test download layer.
    def test_download_layer(self):
        params = {
            "response_format": VectorFileFormat.SHAPEFILE.value,
        }

        # Act.
        response = self.client.get(
            reverse("layers-download", kwargs={"pk": self.layer2.id}),
            data=params,
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
