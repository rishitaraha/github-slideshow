from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase


class TestProject(BaseTestCase):
    def setUp(self):
        self.api_authentication()

    # Member should not add project.
    def test_create_project(self):
        data = {
            "name": "Test Project",
        }
        response = self.client.post(reverse("project-list"), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Member should not fetch project.
    def test_get_project(self):
        response = self.client.get(
            reverse("project-detail", kwargs={"pk": self.project.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Member should not update project.
    def test_update_project(self):
        data = {"name": "Updated Project Name"}
        response = self.client.patch(
            reverse("project-detail", kwargs={"pk": self.project.id}), data
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Member should not add project permission.
    def test_add_project_permission(self):
        data = {
            "user_group": str(self.user_group.id),
            "can_view": True,
            "can_manage_sites": False,
        }
        response = self.client.post(
            reverse("project-permission", kwargs={"pk": self.project.id}), data
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Member should not update project permission.
    def test_update_project_permission(self):
        data = {
            "user_group": str(self.user_group.id),
            "can_view": False,
        }
        response = self.client.post(
            reverse("project-permission", kwargs={"pk": self.project.id}),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
