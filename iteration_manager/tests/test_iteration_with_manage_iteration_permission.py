from django.urls import reverse
from rest_framework import status

from project_manager.models import ProjectPermission
from site_manager.models import SitePermission

from .base_tests import (
    TestCanListIterations,
    TestCanManageIterations,
    TestCannotListIterations,
    TestCannotManageIterations,
)


class TestManageIterationsWithProjectAndSiteView(
    TestCanManageIterations, TestCanListIterations
):
    def setUp(self):
        # Project permission for a user group to view & manage.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.test_group,
            can_view=True,
            can_manage_sites=False,
        )
        # Site permission for a user group to view & manage.
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.test_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
        )
        self.api_authentication(self.test_user)

    # Test list iteration endpoint without authentication.
    def test_list_iteration_un_authenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(reverse("iteration-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestManageIterationsWithoutProjectView(
    TestCannotManageIterations, TestCannotListIterations
):
    def setUp(self):
        # Site permission for a user group to view & manage.
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.test_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
        )
        self.api_authentication(self.test_user)


class TestManageIterationsWithoutSiteView(
    TestCannotManageIterations, TestCannotListIterations
):
    def setUp(self):
        # Project permission for a user group to view & manage.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.test_group,
            can_view=True,
            can_manage_sites=False,
        )
        # Site permission for a user group to view & manage.
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.test_group,
            can_view=False,
            can_manage_iterations_and_layers=True,
        )
        self.api_authentication(self.test_user)


class TestManageIterationsWithoutProjectAndSiteView(
    TestCannotManageIterations, TestCannotListIterations
):
    def setUp(self):
        # Site permission for a user group to view & manage.
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.test_group,
            can_view=False,
            can_manage_iterations_and_layers=True,
        )
        self.api_authentication(self.test_user)
