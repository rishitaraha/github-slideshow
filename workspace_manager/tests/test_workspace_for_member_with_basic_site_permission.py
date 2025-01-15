from project_manager.models import ProjectPermission
from site_manager.constants import AccessType
from site_manager.models.site_models import SitePermission

from .base_tests import TestCannotViewWorkspace, TestCanViewWorkspace


class TestWorkspaceForMemberCase1(TestCanViewWorkspace):
    # Condition: Has View Project, View Site permission.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project,
            user_group=cls.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        cls.site_permission = SitePermission.objects.create(
            project=cls.project,
            site=cls.site,
            user_group=cls.user_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.BASIC.value,
        )

    def setUp(self):
        self.api_authentication(self.user)


class TestWorkspaceForMemberCase2(TestCannotViewWorkspace):
    # Condition: Has View Project permission.
    # Does not have View Site permission.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project,
            user_group=cls.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        cls.site_permission = SitePermission.objects.create(
            project=cls.project,
            site=cls.site,
            user_group=cls.user_group,
            can_view=False,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.BASIC.value,
        )

    def setUp(self):
        self.api_authentication(self.user)


class TestWorkspaceForMemberCase3(TestCannotViewWorkspace):
    # Condition: Has View Site permission.
    # Does not have View Project permission.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project,
            user_group=cls.user_group,
            can_view=False,
            can_manage_sites=False,
        )
        cls.site_permission = SitePermission.objects.create(
            project=cls.project,
            site=cls.site,
            user_group=cls.user_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.BASIC.value,
        )

    def setUp(self):
        self.api_authentication(self.user)


class TestWorkspaceForMemberCase4(TestCannotViewWorkspace):
    # Condition: Does not have View Project and View Site permission.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project,
            user_group=cls.user_group,
            can_view=False,
            can_manage_sites=False,
        )
        cls.site_permission = SitePermission.objects.create(
            project=cls.project,
            site=cls.site,
            user_group=cls.user_group,
            can_view=False,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.BASIC.value,
        )

    def setUp(self):
        self.api_authentication(self.user)
