from django.db import models

from org_manager.models import Organisation
from shared.models import BaseModel


class OrgPreset(BaseModel):
    name = models.TextField()
    value = models.JSONField()
    org = models.ForeignKey(Organisation, on_delete=models.CASCADE)


class DefaultPreset(BaseModel):
    name = models.TextField()
    value = models.JSONField()
