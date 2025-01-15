from project_manager.models import ProjectPermission
from site_manager.constants import AccessType
from site_manager.models import SitePermission

from .base_tests import TestCanDownloadBaseDsm, TestCannotDownloadBaseDsm


class TestDownloadBaseDsmForMemberCase1(TestCanDownloadBaseDsm):
    # Condition: Has View Project and View Site permission.
    # Have Can Manage Sites permission.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project2,
            user_group=cls.user_group,
            can_view=True,
            can_manage_sites=True,
        )
        cls.site_permission = SitePermission.objects.create(
            project=cls.project2,
            site=cls.site2,
            user_group=cls.user_group,
            can_view=True,
            can_manage_iterations_and_layers=False,
            access_type=AccessType.ADVANCE.value,
        )

    def setUp(self):
        self.api_authentication(self.user)


class TestDownloadBaseDsmForMemberCase2(TestCannotDownloadBaseDsm):
    # Condition: Has View Project permission.
    # Does not have Can Manage Sites permission.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project2,
            user_group=cls.user_group,
            can_view=True,
            can_manage_sites=False,
        )

    def setUp(self):
        self.api_authentication(self.user)


class TestDownloadBaseDsmForMemberCase3(TestCannotDownloadBaseDsm):
    # Condition: Does not Have View Project permission.
    # Have Can Manage Sites permission.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project2,
            user_group=cls.user_group,
            can_view=False,
            can_manage_sites=True,
        )

    def setUp(self):
        self.api_authentication(self.user)


class TestDownloadBaseDsmForMemberCase4(TestCannotDownloadBaseDsm):
    # Condition: Does not have View Project permission.
    # Does not have can manage sites permission.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project2,
            user_group=cls.user_group,
            can_view=False,
            can_manage_sites=False,
        )

    def setUp(self):
        self.api_authentication(self.user)
