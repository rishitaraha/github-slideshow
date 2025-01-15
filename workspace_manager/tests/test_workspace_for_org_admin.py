from django.urls import reverse
from rest_framework import status

from .base_tests import TestCanViewWorkspace


class TestWorkspaceForOrgAdmin(TestCanViewWorkspace):
    def setUp(self):
        self.api_authentication(self.org_admin)

    # Test add workspace endpoint.
    def test_create_workspace(self):
        # Arrange.
        data = {
            "project_id": self.project.id,
            "selected_iteration_id": str(self.iteration.id),
            "terrain_iteration_id": str(self.iteration.id),
            "camera": {
                "latitude": 1,
                "longitude": 1,
                "height": 1,
                "heading": 1,
                "pitch": 1,
                "roll": 1,
            },
            "layers": [
                {"id": str(self.layer.id), "show": True, "z_index": 1},
            ],
        }

        # Act.
        response = self.client.post(reverse("workspace-list"), data, format="json")
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("slug", response_data)
        self.assertIsNotNone(response_data["slug"])

    # Test create workspace endpoint without authentication.
    def test_create_workspace_un_authenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(reverse("workspace-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Test fetch workspace by user of different organisation.
    def test_cannot_fetch_workspace_of_different_org(self):
        self.api_authentication(self.user_of_org2)
        url = reverse("workspace-detail", kwargs={"slug": self.workspace2.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
