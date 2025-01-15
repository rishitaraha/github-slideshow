from django.db.models import Count, Manager, QuerySet

from user_manager.models import CustomUser


class AccessTagQuerySet(QuerySet):
    def search(self, query: str):
        return self.filter(name__icontains=query).distinct()

    def with_user_groups_count(self):
        return self.annotate(user_groups_count=Count("groups"))


class AccessTagManager(Manager):
    def get_queryset(self):
        return AccessTagQuerySet(self.model, using=self._db)

    def get_access_tags_for_user(self, user: CustomUser):
        if user.is_org_admin:
            return self.model.objects.filter(org=user.org)

        return self.model.objects.filter(groups__in=user.groups.all()).distinct()
