from unittest import SkipTest

from django.urls import reverse
from rest_framework import status

from layer_manager.constants import LayerType
from layer_manager.models import AccessTag, Layer

from ...constants import HaulRoadLayerType
from ...models import HaulRoad, HaulRoadLayer, HaulRoadType
from ..base_test_case import WorkspaceBaseTestCase


class TestCannotGenerateHaulRoads(WorkspaceBaseTestCase):
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
    def test_create_haulroad(self):
        # Arrange.
        data = {
            "name": "New Haul Road",
            "type": self.haul_road_type.id,
            "vehicle_width": 8,
            "chainage_interval": 5,
            "iteration": str(self.iteration.id),
            "smart_line_wkt": "LINESTRING (10 10, 20 20, 30 15)",
        }

        # Act.
        response = self.client.post(
            reverse("analytics-haul-roads-list"), data, format="json"
        )
        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_retrieve_haulroad(self):
        # Arrange.
        url = reverse(
            "analytics-haul-roads-detail", kwargs={"pk": str(self.haul_road2.id)}
        )

        # Act.
        response = self.client.get(url)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test get haul roads endpoint.
    def test_get_haul_roads(self):
        # Act.
        url = reverse("analytics-haul-roads-list")
        response = self.client.get(url, data={"iteration": str(self.iteration.id)})

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
