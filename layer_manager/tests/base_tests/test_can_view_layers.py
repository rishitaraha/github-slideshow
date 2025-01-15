from unittest import SkipTest, mock

from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase
from shared.tests.constants import WKTGeometry

from ...constants import LayerType, VectorFileFormat
from ...models import AccessTag, Feature, Layer


class TestCanViewLayers(BaseTestCase):
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
        cls.vector_layer = Layer.objects.create(
            name="Vector Layer",
            iteration=cls.iteration,
            site=cls.site,
            type=LayerType.VECTOR.value,
        )
        cls.vector_layer_feature = Feature.objects.create(
            name="Test Feature 1",
            geometry=WKTGeometry.POLYGON.value,
            layer=cls.vector_layer,
        )
        cls.access_tag = AccessTag.objects.create(
            name="Access Tag 1", org=cls.org, color="#ffffff"
        )
        cls.access_tag2 = AccessTag.objects.create(
            name="Access Tag 2", org=cls.org, color="#000000"
        )

    def setUp(self):
        raise SkipTest("Helper test")

    # Test list layers endpoint for user.
    def test_list_layer(self):
        # Arrange.
        params = {"iteration_id": self.iteration.id, "search": "layer"}

        # Act.
        response = self.client.get(reverse("layers-list"), params)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(
            sorted([item["name"] for item in response_data["layers"]]),
            sorted([self.layer.name, self.layer2.name, self.vector_layer.name]),
        )
        self.assertEqual(response_data["site_id"], str(self.iteration.site_id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test get layer endpoint.
    def test_get_layer(self):
        # Act.
        response = self.client.get(
            reverse("layers-detail", kwargs={"pk": self.layer2.id})
        )
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response_data["name"], self.layer2.name)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test download layer as shape file.
    def test_download_layer_as_shp(self):
        # Arrange.
        params = {
            "response_format": VectorFileFormat.SHAPEFILE.value,
        }

        # Act.
        response = self.client.get(
            reverse("layers-download", kwargs={"pk": self.vector_layer.id}),
            data=params,
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.content)
        self.assertEqual(response["Content-Type"], "application/zip")

    # Test download layer as dxf.
    def test_download_layer_as_dxf(self):
        # Arrange.
        params = {
            "response_format": VectorFileFormat.DXF.value,
        }

        # Act.
        response = self.client.get(
            reverse("layers-download", kwargs={"pk": self.vector_layer.id}),
            data=params,
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.content)
        self.assertEqual(response["Content-Type"], "application/dxf")


class TestCanViewEmptyLayers(BaseTestCase):
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

    # Test list layers endpoint for user.
    def test_list_layer(self):
        # Arrange.
        params = {"iteration_id": self.iteration.id, "search": "layer"}

        # Act.
        response = self.client.get(reverse("layers-list"), params)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(len(response_data["layers"]), 0)
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
