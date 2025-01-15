from project_manager.models import ProjectPermission
from site_manager.constants import AccessType
from site_manager.models import SitePermission

from .base_tests import (
    TestCanManageLayers,
    TestCannotManageLayers,
    TestCannotViewLayers,
    TestCanViewLayers,
)


class TestLayerForMemberCase1(
    TestCanViewLayers,
    TestCanManageLayers,
):
    # Condition: Has View Project, View Site permission and Manage Iteration & Layers permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.BASIC.value,
        )
        self.api_authentication(self.user)


class TestLayerForMemberCase2(
    TestCanViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Project, View Site permission.
    # Does not has Manage Iteration & Layers permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=True,
            can_manage_iterations_and_layers=False,
            access_type=AccessType.BASIC.value,
        )
        self.api_authentication(self.user)


class TestLayerForMemberCase3(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Project permission.
    # Does not has View Site, Manage Iteration & Layers permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=False,
            can_manage_iterations_and_layers=False,
            access_type=AccessType.BASIC.value,
        )
        self.api_authentication(self.user)


class TestLayerForMemberCase4(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Project, Manage Iteration & Layers permission.
    # Does not has View Site permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=False,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.BASIC.value,
        )
        self.api_authentication(self.user)


class TestLayerForMemberCase5(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Site, Manage Iteration & Layers permission.
    # Does not has View Project permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=False,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.BASIC.value,
        )
        self.api_authentication(self.user)


class TestLayerForMemberCase6(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Site permission.
    # Does not has View Project, Manage Iteration & Layers permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=False,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=True,
            can_manage_iterations_and_layers=False,
            access_type=AccessType.BASIC.value,
        )
        self.api_authentication(self.user)


class TestLayerForMemberCase7(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has Manage Iteration & Layers permission.
    # Does not has View Project, View Site permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=False,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=False,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.BASIC.value,
        )
        self.api_authentication(self.user)


class TestLayerForMemberCase8(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Does not has View Project, View Site, Manage Iteration & Layers permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=False,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=False,
            can_manage_iterations_and_layers=False,
            access_type=AccessType.BASIC.value,
        )
        self.api_authentication(self.user)
