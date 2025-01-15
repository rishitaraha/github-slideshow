from uuid import uuid4

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_softdelete.models import DeletedManager, SoftDeleteModel
from rest_framework.exceptions import NotFound

from project_manager.models import Project
from shared.exception_handling import ApiErrors
from shared.models import BaseModel, FileInfo
from user_manager.models import UserGroup

from ..constants import AccessType, SiteType
from ..managers import SiteManager, SitePermissionManager


class Site(BaseModel, SoftDeleteModel):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid4)
    project = models.ForeignKey(Project, on_delete=models.DO_NOTHING)
    name = models.CharField(max_length=100)
    type = models.CharField(
        choices=SiteType.choices(),
        max_length=30,
        default=SiteType.MINE_SITE.value,
    )
    latitude = models.FloatField(null=True)
    longitude = models.FloatField(null=True)
    boundary = models.CharField(max_length=100, null=True)
    dashboard_layer_mapbox_id = models.CharField(max_length=2044, null=True, blank=True)
    base_dsm = models.ForeignKey(
        FileInfo, on_delete=models.CASCADE, null=True, related_name="base_dsm"
    )
    legend_image = models.ForeignKey(
        FileInfo,
        on_delete=models.CASCADE,
        null=True,
        related_name="legend_image",
    )

    objects = SiteManager()
    deleted_objects = DeletedManager()

    def get_base_dsm_or_404(self) -> FileInfo:
        if not self.base_dsm:
            api_error_obj = ApiErrors.DSM_NOT_FOUND.value
            api_error_obj.message = f"Base DSM not present for site {self.name}"
            raise NotFound(api_error_obj)

        return self.base_dsm

    def __str__(self) -> str:
        return self.name


class SitePermission(BaseModel):
    id = models.UUIDField(default=uuid4, primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.DO_NOTHING)
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name="permissions")
    user_group = models.ForeignKey(
        UserGroup, on_delete=models.CASCADE, related_name="site_permissions"
    )
    access_type = models.CharField(
        choices=AccessType.choices(),
        max_length=30,
        default=AccessType.ADVANCE.value,
    )
    can_view = models.BooleanField()
    can_manage_iterations_and_layers = models.BooleanField(
        help_text="""
            AccessType: BASIC ---> edit access for all iterations and layers.
            AccessType: ADVANCE ---> create and edit access for all iterations and layers.
        """
    )

    objects = SitePermissionManager()

    class Meta:
        unique_together = ("site", "user_group")
        ordering = ("-created_at",)

    # Validations.
    def clean(self):
        # Project of site_permission and site should be same.
        if self.project != self.site.project:
            raise ValidationError(
                _("Project of site_permission and site should be same.")
            )

        # Org of site and user_group should be same.
        if self.project.org != self.user_group.org:
            raise ValidationError(_("Org of site and user_group should be same."))
        return super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
