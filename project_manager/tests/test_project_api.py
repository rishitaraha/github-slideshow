from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase

from ..models import Project, ProjectPermission


class TestProject(BaseTestCase):
    def setUp(self):
        self.test_project = Project.objects.create(name="Test Project", org=self.org)
        self.project_permission = ProjectPermission.objects.create(
            project=self.test_project,
            user_group=self.user_group,
            can_view=True,
            can_manage_sites=True,
        )

        self.api_authentication(self.org_admin)

    # Test add project endpoint.
    def test_create_project(self):
        data = {
            "name": "Test Project",
        }
        response = self.client.post(reverse("project-list"), data)
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # Test list project endpoint for org admin.
    def test_list_project_for_org_admin(self):
        response = self.client.get(reverse("project-list"))
        response_data = response.json()["data"]
        self.assertEqual(
            [item["id"] for item in response.json()["data"]["projects"]].sort(),
            [str(self.project.id), str(self.test_project.id)].sort(),
        )
        self.assertEqual(response_data["total"], 2)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test list project endpoint for member.
    def test_list_project_for_member(self):
        self.api_authentication(self.user)
        response = self.client.get(reverse("project-list"))
        response_data = response.json()["data"]

        # Only those project should come which is assigned to the logged user.
        self.assertEqual(response_data["projects"][0]["id"], str(self.test_project.id))
        self.assertEqual(response_data["total"], 1)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test list project endpoint without authentication.
    def test_list_project_un_authenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(reverse("project-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Test get project endpoint.
    def test_get_project(self):
        response = self.client.get(
            reverse("project-detail", kwargs={"pk": self.project.id})
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], self.project.name)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test get project endpoint for member user.
    def test_get_project_for_member(self):
        self.api_authentication(self.user)
        response = self.client.get(
            reverse("project-detail", kwargs={"pk": self.test_project.id})
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], self.test_project.name)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test update project endpoint.
    def test_update_project(self):
        data = {"name": "Updated Project Name"}
        response = self.client.patch(
            reverse("project-detail", kwargs={"pk": self.project.id}), data
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test add permission of a project.
    def test_add_project_permission(self):
        data = {
            "user_group": str(self.user_group.id),
            "can_view": True,
            "can_manage_sites": False,
        }

        response = self.client.post(
            reverse("project-permission", kwargs={"pk": self.project.id}), data
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["user_group"], data["user_group"])
        self.assertEqual(response_data["can_view"], data["can_view"])
        self.assertEqual(response_data["can_manage_sites"], data["can_manage_sites"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test update permission of a project.
    def test_update_project_permission(self):
        data = {
            "user_group": str(self.user_group.id),
            "can_view": False,
        }

        response = self.client.post(
            reverse("project-permission", kwargs={"pk": self.test_project.id}),
            data,
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["user_group"], data["user_group"])
        self.assertEqual(response_data["can_view"], data["can_view"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test permission of project in different organisation
    def test_cannot_fetch_project_of_different_org(self):
        self.api_authentication(self.user_of_org2)
        response = self.client.get(
            reverse("project-detail", kwargs={"pk": self.project.id})
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
