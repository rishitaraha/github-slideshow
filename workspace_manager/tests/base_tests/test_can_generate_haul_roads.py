from unittest import SkipTest

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status

from layer_manager.constants import LayerType
from layer_manager.models import AccessTag, Layer
from rainbow.env_variables import EnvVariable
from shared.constants.enums import Status
from shared.tests.mock import create_test_zipfile

from ...constants import HaulRoadLayerType
from ...models import HaulRoad, HaulRoadLayer, HaulRoadType
from ..base_test_case import WorkspaceBaseTestCase


class TestCanGenerateHaulRoads(WorkspaceBaseTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        # Arrange.
        cls.layer2 = Layer.objects.create(
            name="Layer 2",
            iteration=cls.iteration,
            site=cls.site,
            type=LayerType.VECTOR.value,
        )
        cls.access_tag2 = AccessTag.objects.create(
            name="Access Tag 2", org=cls.org, color="#000000"
        )

        cls.haul_road_type_2 = HaulRoadType.objects.create(
            name="secondary", org=cls.org
        )
        cls.haul_road2 = HaulRoad.objects.create(
            name="New Haul",
            type=cls.haul_road_type_2,
            vehicle_width=10,
            chainage_interval=5,
            iteration=cls.iteration,
            created_by=cls.user,
            updated_by=cls.user,
        )
        cls.haul_road_layer2 = HaulRoadLayer.objects.create(
            layer=cls.layer2,
            haul_road=cls.haul_road2,
            type=HaulRoadLayerType.EDGES.value,
        )

    def setUp(self):
        raise SkipTest("Helper test")

    # Test add haul road analytics endpoint.
    def test_create_haul_road(self):
        # Arrange.
        data = {
            "name": "New Haul Road",
            "type": self.haul_road_type_2.id,
            "vehicle_width": 8,
            "chainage_interval": 5,
            "iteration": str(self.iteration.id),
            "smart_line_wkt": "LINESTRING (10 10, 20 20, 30 15)",
        }

        # Act.
        response = self.client.post(
            reverse("analytics-haul-roads-list"), data, format="json"
        )
        response_data = response.json()["data"]
        # Assert.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Expected keys in the response
        expected_keys = {
            "id",
            "name",
            "type",
            "vehicle_width",
            "chainage_interval",
            "iteration",
        }

        # Assert that all expected keys are present
        self.assertTrue(
            expected_keys.issubset(response_data.keys()), "Response item keys mismatch."
        )

        # Assert the values in the response match the input
        self.assertEqual(
            response_data["name"], data["name"], "Name should match the input data."
        )
        self.assertEqual(
            response_data["type"],
            str(data["type"]),
            "Type should match the input data.",
        )

        self.assertEqual(
            float(response_data["vehicle_width"]),
            data["vehicle_width"],
            "Vehicle width should match the input data.",
        )
        self.assertEqual(
            float(response_data["chainage_interval"]),
            data["chainage_interval"],
            "Chainage interval should match the input data.",
        )
        self.assertEqual(
            response_data["iteration"],
            data["iteration"],
            "Iteration ID should match the input data.",
        )

    # Test retrieve haul road analytics endpoint.
    def test_retrieve_haul_road(self):
        # Arrange.
        url = reverse(
            "analytics-haul-roads-detail", kwargs={"pk": str(self.haul_road2.id)}
        )

        # Act.
        response = self.client.get(url)
        response_data = response.json()

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Expected keys in the response
        expected_keys = {
            "name",
            "type",
            "vehicle_width",
            "chainage_interval",
            "haul_road_layers",
        }

        # Assert.
        self.assertTrue(
            expected_keys.issubset(response_data.get("data", {}).keys()),
            f"Response item keys mismatch: {response_data.get('data', {}).keys()}",
        )

    # Test list haul roads endpoint.
    def test_get_haul_roads(self):
        # Act.
        url = reverse("analytics-haul-roads-list")
        response = self.client.get(url, data={"iteration": str(self.iteration.id)})
        response_data = response.json()["data"]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response_data), 0, "Response data should not be empty.")

        # Validate the first item in response_data.
        first_item = response_data[0]
        expected_keys = {
            "id",
            "name",
            "type",
            "vehicle_width",
            "chainage_interval",
            "iteration",
        }

        # Assert.
        self.assertTrue(
            expected_keys.issubset(first_item.keys()), "Response item keys mismatch."
        )

    def test_upload_valid_zipfile(self):
        # Arrange.
        # TODO: Refactor with proper handling.

        url = reverse("analytics-haul-roads-upload", args=[self.haul_road2.id])
        zip_content = create_test_zipfile()
        uploaded_file = SimpleUploadedFile(
            "test.zip", zip_content, content_type="application/zip"
        )
        data = {"type": HaulRoadLayerType.EDGES.value, "shape_file": uploaded_file}

        # Act.
        response = self.client.post(
            url,
            data,
            format="multipart",
            headers={"X-API-KEY": EnvVariable.MICROSERVICE_API_KEY.value},
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        response_data = response.json()
        self.assertIn("data", response_data)

    def test_can_update_haul_road_status(self):
        data = {
            "status": Status.DONE.value,
        }

        response = self.client.patch(
            reverse("analytics-haul-roads-status", kwargs={"pk": self.haul_road2.id}),
            data,
            format="json",
            headers={"X-API-KEY": EnvVariable.MICROSERVICE_API_KEY.value},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_can_update_haul_road_status_with_invalid_data(self):
        data = {
            "status": "random_value",
        }
        response = self.client.patch(
            reverse("analytics-haul-roads-status", kwargs={"pk": self.layer.id}),
            data,
            format="json",
            headers={"X-API-KEY": EnvVariable.MICROSERVICE_API_KEY.value},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
