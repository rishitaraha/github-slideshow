from project_manager.models import ProjectPermission
from site_manager.constants import AccessType
from site_manager.models import SitePermission

from .base_tests import TestCanDownloadLayer, TestCannotDownloadLayer


class TestDownloadLayerForMemberCase1(TestCanDownloadLayer):
    # Condition: User has advance type access for layer.
    # But with same access tag as attached with user group.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project2,
            user_group=cls.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        cls.site_permission = SitePermission.objects.create(
            project=cls.project2,
            site=cls.site2,
            user_group=cls.user_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.ADVANCE.value,
        )
        cls.user_group.access_tags.add(cls.access_tag2)
        cls.layer2.access_tags.add(cls.access_tag2)

    def setUp(self):
        self.api_authentication(self.user)


class TestDownloadLayerForMemberCase2(TestCannotDownloadLayer):
    # Condition: User has advance type access for layer.
    # But without same access tag as attached with user group.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project2,
            user_group=cls.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        cls.site_permission = SitePermission.objects.create(
            project=cls.project2,
            site=cls.site2,
            user_group=cls.user_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.ADVANCE.value,
        )
        cls.user_group.access_tags.add(cls.access_tag)
        cls.layer2.access_tags.add(cls.access_tag2)

    def setUp(self):
        self.api_authentication(self.user)


class TestDownloadLayerForMemberCase3(TestCanDownloadLayer):
    # Condition: User has view site permission.
    # With Basic All Site Access Type.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project2,
            user_group=cls.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        cls.site_permission = SitePermission.objects.create(
            project=cls.project2,
            site=cls.site2,
            user_group=cls.user_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.BASIC.value,
        )

    def setUp(self):
        self.api_authentication(self.user)


class TestDownloadLayerForMemberCase4(TestCannotDownloadLayer):
    # Condition: User does not have view site permission.
    # With Basic All Site Access Type.

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.project_permission = ProjectPermission.objects.create(
            project=cls.project2,
            user_group=cls.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        cls.site_permission = SitePermission.objects.create(
            project=cls.project2,
            site=cls.site2,
            user_group=cls.user_group,
            can_view=False,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.BASIC.value,
        )

    def setUp(self):
        self.api_authentication(self.user)
