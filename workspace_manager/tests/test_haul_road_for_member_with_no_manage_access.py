from project_manager.models import ProjectPermission
from site_manager.constants import AccessType
from site_manager.models.site_models import SitePermission

from .base_tests import TestCanGenerateHaulRoads, TestCannotGenerateHaulRoads


class TestHaulRoadForMemberCase1(TestCannotGenerateHaulRoads):
    # Condition: Is not Org Admin
    # TODO: Will be changed for feature based permissions.

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
            can_manage_iterations_and_layers=False,
            access_type=AccessType.BASIC.value,
        )

    def setUp(self):
        self.api_authentication(self.user)


class TestHaulRoadForMemberCase2(TestCanGenerateHaulRoads):
    # Condition: Is not Org Admin
    # TODO: Will be changed for feature based permissions.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project,
            user_group=cls.user_group,
            can_view=True,
            can_manage_sites=True,
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
