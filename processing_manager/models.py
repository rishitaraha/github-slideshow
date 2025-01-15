from uuid import uuid4

from django.db import models

from org_manager.models import Organisation
from shared.models import BaseModel


class Connection(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    org = models.ForeignKey(Organisation, on_delete=models.DO_NOTHING)
    processing_org_id = models.UUIDField()
    processing_org_name = models.CharField(max_length=500, null=True)
    connection_token = models.CharField(max_length=500)

    class Meta:
        unique_together = ("processing_org_id", "org")
