from project_manager.models import ProjectPermission
from site_manager.constants import AccessType
from site_manager.models import SitePermission

from .base_tests import TestCanDownloadCapturedDsm, TestCannotDownloadCapturedDsm


class TestDownloadCapturedDsmForMemberCase1(TestCanDownloadCapturedDsm):
    # Condition: Has View Project permission.
    # Have Can Manage Iteration and Layers permission.

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
            can_manage_iterations_and_layers=True,
            access_type=AccessType.ADVANCE.value,
        )

    def setUp(self):
        self.api_authentication(self.user)


class TestDownloadCapturedDsmForMemberCase2(TestCannotDownloadCapturedDsm):
    # Condition: Has View Project permission.
    # Does not have Can Manage Iteration and Layers permission.

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


class TestDownloadCapturedDsmForMemberCase3(TestCannotDownloadCapturedDsm):
    # Condition: Does not have View Project permission.
    # Have Can Manage Iteration and Layers permission.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project2,
            user_group=cls.user_group,
            can_view=False,
            can_manage_sites=True,
        )
        cls.site_permission = SitePermission.objects.create(
            project=cls.project2,
            site=cls.site2,
            user_group=cls.user_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.ADVANCE.value,
        )

    def setUp(self):
        self.api_authentication(self.user)


class TestDownloadCapturedDsmForMemberCase4(TestCannotDownloadCapturedDsm):
    # Condition: Have View Project permission.
    # Does not have View Site Permission.

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
            can_view=False,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.ADVANCE.value,
        )

    def setUp(self):
        self.api_authentication(self.user)
