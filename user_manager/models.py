import uuid

from django.contrib.auth.base_user import AbstractBaseUser
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from org_manager.models import Organisation
from shared.models import BaseModel

from .constants import UserType
from .managers import UserManager


class CustomUser(BaseModel, AbstractBaseUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    email = models.EmailField(max_length=50, unique=True)
    org = models.ForeignKey(Organisation, on_delete=models.DO_NOTHING, null=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50, null=True)
    is_active = models.BooleanField(default=True)
    type = models.CharField(
        max_length=20,
        default=UserType.MEMBER.value,
        choices=UserType.choices(),
    )

    objects = UserManager()

    USERNAME_FIELD = "email"

    class Meta:
        ordering = ["first_name", "last_name", "created_at"]
        verbose_name = "user"
        verbose_name_plural = "users"

    @property
    def name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @property
    def is_org_admin(self) -> bool:
        return self.type == UserType.ORG_ADMIN.value

    @property
    def is_support(self) -> bool:
        return self.type == UserType.SUPPORT.value

    @property
    def is_member(self) -> bool:
        return self.type == UserType.MEMBER.value

    # Custom model validation.
    # https://docs.djangoproject.com/en/4.0/ref/models/instances/#validating-objects
    def clean(self, *args, **kwargs):
        # If user type is member or org_admin then org is required.
        if self.org == None and self.type != UserType.SUPPORT.value:
            raise ValidationError(_("Org is required."))

        super().clean(*args, **kwargs)

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    # Django Admin settings.
    @property
    def is_staff(self):
        return self.is_active and self.type == UserType.SUPPORT.value

    @property
    def is_superuser(self):
        return self.is_active and self.type == UserType.SUPPORT.value

    """
    NOTE: The functional definition of these functions explains how Django utilizes them.
    TODO: We will update these functions according to our use case in the future.
    Currently, I am returning True if the user is a superuser so that the Django admin can function properly.
    """

    def has_perm(self, perm, obj=None):
        """
        Return True if the user has the specified permission. Query all
        available auth backends, but return immediately if any backend returns
        True. Thus, a user who has permission from a single auth backend is
        assumed to have permission in general. If an object is provided, check
        permissions for that object.
        """

        return self.is_superuser

    def has_perms(self, perm_list, obj=None):
        """
        Return True if the user has each of the specified permissions. If
        object is passed, check if the user has all required perms for it.
        """

        return self.is_superuser

    def has_module_perms(self, app_label):
        """
        Return True if the user has any permissions in the given app label.
        Use similar logic as has_perm(), above.
        """
        return self.is_superuser


class UserGroup(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    org = models.ForeignKey(Organisation, on_delete=models.DO_NOTHING)
    name = models.CharField(max_length=256)
    users = models.ManyToManyField(CustomUser, blank=True, related_name="groups")
    access_tags = models.ManyToManyField(
        "layer_manager.AccessTag",
        blank=True,
        related_name="groups",
    )

    class Meta:
        unique_together = ("org", "name")
        ordering = ("-created_at",)
