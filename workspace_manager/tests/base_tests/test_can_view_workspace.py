from unittest import SkipTest

from django.urls import reverse
from rest_framework import status

from layer_manager.constants import LayerType
from layer_manager.models import AccessTag, Layer

from ...models import Workspace, WorkspaceLayer
from ..base_test_case import WorkspaceBaseTestCase


class TestCanViewWorkspace(WorkspaceBaseTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        # Arrange.
        cls.workspace2 = Workspace.objects.create(
            project=cls.project,
            selected_iteration=cls.iteration,
            terrain_iteration=cls.iteration,
            camera_latitude=1,
            camera_longitude=1,
            camera_height=1,
            camera_heading=1,
            camera_pitch=1,
            camera_roll=1,
            created_by=cls.user,
        )

        cls.layer2 = Layer.objects.create(
            name="Layer 2",
            iteration=cls.iteration,
            site=cls.site,
            type=LayerType.VECTOR.value,
        )
        cls.access_tag2 = AccessTag.objects.create(
            name="Access Tag 2", org=cls.org, color="#000000"
        )
        cls.workspace_layer2 = WorkspaceLayer.objects.create(
            layer=cls.layer2,
            workspace=cls.workspace2,
            z_index=1,
            show=True,
        )
        cls.workspace_layer3 = WorkspaceLayer.objects.create(
            dsm_iteration=cls.iteration,
            workspace=cls.workspace2,
            z_index=1,
            show=True,
        )

    def setUp(self):
        raise SkipTest("Helper test")

    # Test add workspace endpoint.
    def test_create_workspace(self):
        # Arrange.
        data = {
            "project_id": self.project.id,
            "selected_iteration_id": self.iteration.id,
            "terrain_iteration_id": self.iteration.id,
            "camera": {
                "latitude": 1,
                "longitude": 1,
                "height": 1,
                "heading": 1,
                "pitch": 1,
                "roll": 1,
            },
            "layers": [
                {
                    "id": str(self.layer2.id),
                    "show": True,
                    "z_index": 1,
                },
                {
                    "dsm_iteration_id": str(self.iteration.id),
                    "show": True,
                    "z_index": 2,
                },
            ],
        }

        # Act.
        response = self.client.post(reverse("workspace-list"), data, format="json")
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("slug", response_data)
        self.assertIsNotNone(response_data["slug"])

    # Test get workspace endpoint.
    def test_get_workspace(self):
        # Act.
        url = reverse("workspace-detail", kwargs={"slug": self.workspace2.slug})
        response = self.client.get(url)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response_data["project"]["id"], str(self.workspace2.project.id)
        )
        self.assertEqual(
            response_data["selected_iteration"]["id"],
            str(self.workspace2.selected_iteration.id),
        )
        self.assertEqual(
            response_data["terrain_iteration"]["id"],
            str(self.workspace2.terrain_iteration.id),
        )
        self.assertEqual(len(response_data["workspace_layers"]), 1)
        self.assertEqual(len(response_data["dsm_layers"]), 1)
