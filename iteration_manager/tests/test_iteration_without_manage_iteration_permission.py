from project_manager.models import ProjectPermission
from site_manager.models import SitePermission

from .base_tests import (
    TestCanListIterations,
    TestCannotListIterations,
    TestCannotManageIterations,
)


class TestIterationWithProjectAndSiteView(
    TestCannotManageIterations, TestCanListIterations
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
            can_manage_iterations_and_layers=False,
        )
        self.api_authentication(self.test_user)


class TestIterationWithoutProjectView(
    TestCannotManageIterations, TestCannotListIterations
):
    def setUp(self):
        # Site permission for a user group to view & manage.
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.test_group,
            can_view=True,
            can_manage_iterations_and_layers=False,
        )
        self.api_authentication(self.test_user)


class TestIterationsWithoutSiteView(
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
            can_manage_iterations_and_layers=False,
        )
        self.api_authentication(self.test_user)


class TestIterationsWithoutProjectAndSiteView(
    TestCannotManageIterations, TestCannotListIterations
):
    def setUp(self):
        # Site permission for a user group to view & manage.
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.test_group,
            can_view=False,
            can_manage_iterations_and_layers=False,
        )
        self.api_authentication(self.test_user)
