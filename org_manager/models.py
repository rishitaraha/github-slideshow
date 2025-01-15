import json
from uuid import uuid4

from django.db import models

from shared.helpers import generate_token_string
from shared.models import BaseModel, FileInfo

from .feature_flags import FeatureFlag


class Organisation(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=500)
    logo = models.ForeignKey(FileInfo, on_delete=models.DO_NOTHING, null=True)
    feature_flags = models.JSONField(default=FeatureFlag.get_default_values)

    def get_feature_flags(self):
        org_features = (
            self.feature_flags
            if isinstance(self.feature_flags, dict)
            else json.loads(self.feature_flags)
        )

        return {**FeatureFlag.DEFAULTS, **org_features}

    def is_feature_enabled(self, feature_name: FeatureFlag):
        feature_dict = self.get_feature_flags()
        return feature_dict.get(feature_name.value, False)

    def __str__(self):
        return self.name


class OrganisationAccessToken(BaseModel):
    org = models.OneToOneField(
        Organisation, related_name="access_token", on_delete=models.CASCADE
    )
    token = models.CharField(max_length=50, unique=True, default=generate_token_string)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.org.name}: {self.token}"
