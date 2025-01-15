from uuid import uuid4

from django.db import models

from org_manager.models import Organisation
from shared.models import BaseModel
from shared.validators import validate_color_field, validate_no_space

from ..managers import AccessTagManager


class AccessTag(BaseModel):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid4)
    name = models.CharField(max_length=32, validators=[validate_no_space])
    org = models.ForeignKey(Organisation, on_delete=models.DO_NOTHING)
    color = models.CharField(max_length=9, validators=[validate_color_field])

    objects = AccessTagManager()

    class Meta:
        unique_together = ("name", "org")
        ordering = ("-created_at",)
