from django.db.models import Manager
from django_softdelete.models import SoftDeleteManager

import site_manager.models
from site_manager.constants import AccessType
from user_manager.constants import UserType
from user_manager.models import CustomUser


# Site manager.
class SiteManager(SoftDeleteManager):
    def get_sites_for_user(self, user: CustomUser):
        sites_of_org = self.model.objects.filter(project__org=user.org)

        if user.is_org_admin:
            return sites_of_org

        sites_assigned_to_user = site_manager.models.SitePermission.objects.filter(
            can_view=True, user_group__in=user.groups.all()
        ).values_list("site", flat=True)

        return sites_of_org.filter(id__in=sites_assigned_to_user)


class SitePermissionManager(Manager):
    def get_users_email_with_view_permission(self, site):
        user_groups = self.model.objects.filter(site=site, can_view=True).values_list(
            "user_group", flat=True
        )

        users_email = (
            CustomUser.objects.filter(groups__in=user_groups)
            .values_list("email", flat=True)
            .union(
                CustomUser.objects.filter(
                    org=site.project.org, type=UserType.ORG_ADMIN.value
                ).values_list("email", flat=True)
            )
        )
        return users_email

    def get_access_type(self, user: CustomUser, site):
        site_permissions = self.model.objects.filter(
            site=site,
            user_group_id__in=user.groups.all(),
            can_view=True,
        )

        if site_permissions.exists():
            if site_permissions.filter(access_type=AccessType.ADVANCE.value).exists():
                return AccessType.ADVANCE.value
            return AccessType.BASIC.value
