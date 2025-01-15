from django.test import Client

from project_manager.models import ProjectPermission
from site_manager.models import SitePermission

from .base_tests import TestKPIs, TestKpisPermissionDenied


class TestKpisForOrgAdmin(TestKPIs):
    def setUp(self):
        self.api_authentication(self.org_admin)


class TestKpisWithOrgAccessToken(TestKPIs):
    def setUp(self):
        # Create client with org access token.
        self.client = Client(HTTP_X_ORG_ACCESS_TOKEN=self.org_access_token.token)


class TestKpisWithSiteViewPermission(TestKPIs):
    def setUp(self):
        # Project permission for a user group to view.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        # Site permission for a user group to view.
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=True,
            can_manage_iterations_and_layers=False,
        )
        self.api_authentication()


class TestKpisWithSiteViewWithoutProjectViewPermission(TestKpisPermissionDenied):
    def setUp(self):
        # Project permission denied for a user group.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=False,
            can_manage_sites=False,
        )
        # Site permission for a user group to view.
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=True,
            can_manage_iterations_and_layers=False,
        )
        self.api_authentication()


class TestKpisWithoutSiteViewPermission(TestKpisPermissionDenied):
    def setUp(self):
        # Project permission for a user group to view.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        # Site permission denied for a user group.
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=False,
            can_manage_iterations_and_layers=False,
        )
        self.api_authentication()
