from django.db.models import F, Q
from django_softdelete.models import SoftDeleteManager

from iteration_manager.models import Iteration
from project_manager.models import Project
from site_manager.constants import AccessType
from site_manager.models import SitePermission
from user_manager.models import CustomUser

from ..constants import LayerType


class LayerManager(SoftDeleteManager):
    def get_layers_for_org(self, org):
        return self.model.objects.filter(
            iteration__site__project__org=org,
        ).order_by("name")

    def get_layers_for_user(self, user: CustomUser, iteration_id: str):
        site = Iteration.objects.get(id=iteration_id).site
        all_view_access = SitePermission.objects.filter(
            site_id=site.id,
            user_group_id__in=user.groups.all(),
            access_type=AccessType.BASIC.value,
            can_view=True,
        ).exists()

        if user.is_org_admin or all_view_access:
            return self.get_layers_for_org(user.org)

        # Orthomosaic layer and layer with access tags will be returned.
        return self.model.objects.filter(
            Q(type__in=[LayerType.ORTHOMOSAIC.value])
            | Q(access_tags__in=user.groups.all().values_list("access_tags", flat=True))
        ).distinct()

    def get_project_layers_for_user(
        self,
        project: Project,
        user: CustomUser,
    ):
        """
        Returns the layers that are accessible to the given user for the specified project.
        """

        if user.is_org_admin:
            return self.filter(site__project=project)

        # For member users, apply user group permissions and access tags.
        return self.filter(
            Q(site__project=project)
            & (
                Q(
                    site__permissions__user_group__in=user.groups.all(),
                    site__permissions__can_view=True,
                )
                & (
                    Q(site__permissions__access_type=AccessType.BASIC.value)
                    | Q(site__permissions__user_group__access_tags__in=F("access_tags"))
                    | Q(type=LayerType.ORTHOMOSAIC.value)
                )
            ),
        )
