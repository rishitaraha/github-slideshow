from unittest import SkipTest

from django.urls import reverse
from rest_framework import status

from layer_manager.constants.layer_constants import LayerType
from layer_manager.models.access_tag_models import AccessTag
from layer_manager.models.layer_models import Layer

from ...models import Workspace, WorkspaceLayer
from ..base_test_case import WorkspaceBaseTestCase


class TestCannotViewWorkspace(WorkspaceBaseTestCase):
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
            source_id="some source id 2",
            type=LayerType.VECTOR.value,
        )
        cls.access_tag2 = AccessTag.objects.create(
            name="Access Tag 2", org=cls.org, color="#ffffff"
        )
        cls.workspace_layer2 = WorkspaceLayer.objects.create(
            layer=cls.layer2,
            workspace=cls.workspace2,
            z_index=1,
            show=True,
        )

    def setUp(self):
        raise SkipTest("Helper test")

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
                {"id": str(self.layer2.id), "show": True, "z_index": 1},
            ],
        }
        # Act.
        response = self.client.post(reverse("workspace-list"), data, format="json")

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test get workspace endpoint.
    def test_get_workspace(self):
        # Act.
        url = reverse("workspace-detail", kwargs={"slug": self.workspace.slug})
        response = self.client.get(url)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
