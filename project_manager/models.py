from uuid import uuid4

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from org_manager.models import Organisation
from shared.models import BaseModel
from user_manager.models import UserGroup

from .managers import ProjectManager


class Project(BaseModel):
    id = models.UUIDField(default=uuid4, primary_key=True)
    name = models.CharField(max_length=255)
    org = models.ForeignKey(Organisation, on_delete=models.DO_NOTHING)

    objects = ProjectManager()

    def __str__(self):
        return self.name


class ProjectPermission(BaseModel):
    id = models.UUIDField(default=uuid4, primary_key=True)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="permissions"
    )
    user_group = models.ForeignKey(UserGroup, on_delete=models.CASCADE)
    can_view = models.BooleanField()
    can_manage_sites = models.BooleanField()

    def clean(self):
        # Org of project and user_group should be same.
        if self.project.org != self.user_group.org:
            raise ValidationError(_("Org of project and user_group should be same."))
        return super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ("project", "user_group")
        ordering = ("-created_at",)
