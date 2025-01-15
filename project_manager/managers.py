from django.db.models import Count, Manager, QuerySet

import project_manager.models
from user_manager.models import CustomUser


# https://docs.djangoproject.com/en/4.0/topics/db/managers/#calling-custom-queryset-methods-from-the-manager
class ProjectQuerySet(QuerySet):
    def with_site_count(self):
        return self.annotate(total_sites=Count("site"))


class ProjectManager(Manager):
    def get_queryset(self):
        return ProjectQuerySet(self.model, using=self._db)

    def get_projects_for_user(self, user: CustomUser):
        projects_of_org = self.model.objects.filter(org=user.org)

        if user.is_org_admin:
            return projects_of_org

        projects_assigned_to_user = (
            project_manager.models.ProjectPermission.objects.filter(
                can_view=True, user_group__in=user.groups.all()
            ).values_list("project", flat=True)
        )

        return projects_of_org.filter(id__in=projects_assigned_to_user)
